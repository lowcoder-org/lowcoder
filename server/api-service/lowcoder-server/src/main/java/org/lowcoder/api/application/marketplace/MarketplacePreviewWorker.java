package org.lowcoder.api.application.marketplace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Generates previews independently of visitor traffic, on the installation that owns the app. */
@Component
@RequiredArgsConstructor
@Slf4j
public class MarketplacePreviewWorker {
    // Bump when the renderer/components change. No time-based expiration of successful images.
    static final String RENDER_VERSION = "layout-v3-1280x800";
    private static final ObjectMapper JSON = new ObjectMapper().enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
    private final ApplicationService applications;
    private final ApplicationRecordService versions;
    private final OrganizationService organizations;
    private final MarketplacePreviewStore store;
    private final MarketplaceRenderClient renderer;
    private final AtomicBoolean reconciling = new AtomicBoolean();
    private final AtomicBoolean working = new AtomicBoolean();

    @Scheduled(initialDelay = 10000, fixedDelayString = "${LOWCODER_PREVIEW_RECONCILE_MS:60000}")
    public void reconcile() {
        if (!renderer.isConfigured() || !reconciling.compareAndSet(false, true)) return;
        store.ensureIndex().thenMany(applications.findAllMarketplaceApps())
                .filter(MarketplacePreviewWorker::eligible)
                .concatMap(app -> snapshot(app).flatMap(snapshot -> store.desire(app.getId(), snapshot.hash()))
                        .onErrorResume(error -> {
                            log.warn("Marketplace preview reconciliation failed for {}", app.getId(), error);
                            return Mono.empty();
                        }))
                .doFinally(ignored -> reconciling.set(false))
                .subscribe(ignored -> {}, error -> log.warn("Marketplace preview reconciliation failed", error));
    }

    @Scheduled(initialDelay = 15000, fixedDelay = 2000)
    public void work() {
        if (!renderer.isConfigured() || !working.compareAndSet(false, true)) return;
        store.claim(Instant.now()).flatMap(this::capture)
                .doFinally(ignored -> working.set(false))
                .subscribe(ignored -> {}, error -> log.warn("Marketplace preview worker failed", error));
    }

    Mono<Void> capture(MarketplacePreview job) {
        return snapshot(job.getId()).flatMap(snapshot -> {
            if (!snapshot.hash().equals(job.getDesiredHash()))
                return store.desire(job.getId(), snapshot.hash()).thenReturn(true);
            return renderer.render(snapshot.json()).flatMap(image -> snapshot(job.getId())
                    .flatMap(current -> (current.hash().equals(job.getDesiredHash())
                            ? store.complete(job, image) : store.desire(job.getId(), current.hash())).thenReturn(true))
                    .switchIfEmpty(store.discard(job).thenReturn(false)));
        }).switchIfEmpty(store.discard(job).thenReturn(false)).then()
                .onErrorResume(error -> {
                    boolean busy = error instanceof WebClientResponseException response && response.getStatusCode().value() == 429;
                    log.warn("Marketplace preview {} attempt {} {}", job.getId(), job.getAttempts(), busy ? "deferred" : "failed");
                    return store.fail(job, busy);
                });
    }

    static boolean eligible(Application app) {
        return app.getApplicationStatus() == ApplicationStatus.NORMAL && app.isPublicToAll() && app.isPublicToMarketplace();
    }

    Mono<Snapshot> snapshot(String id) {
        return applications.findByIdWithoutDsl(id).flatMap(this::snapshot);
    }

    Mono<Snapshot> snapshot(Application app) {
        if (!eligible(app)) return Mono.empty();
        // Never use getLiveApplicationDsl: its fallback would expose an unpublished draft.
        return versions.getLatestRecordByApplicationId(app.getId()).flatMap(version -> {
            var dsl = version.getApplicationDSL();
            var modules = applications.getAllDependentModulesFromDsl(dsl).flatMapMany(Flux::fromIterable)
                    .filter(module -> module.getApplicationStatus() == ApplicationStatus.NORMAL)
                    .concatMap(module -> versions.getLatestRecordByApplicationId(module.getId())
                            .map(published -> Map.entry(module.getId(), staticDsl(published.getApplicationDSL()))))
                    .collectMap(Map.Entry::getKey, Map.Entry::getValue);
            return Mono.zip(modules, organizations.getOrgCommonSettings(app.getOrganizationId()).defaultIfEmpty(new OrganizationCommonSettings()))
                    .map(tuple -> {
                        Map<String, Object> themes = new TreeMap<>();
                        themes.put("themeList", tuple.getT2().getOrDefault("themeList", List.of()));
                        if (tuple.getT2().get("defaultTheme") != null) themes.put("defaultTheme", tuple.getT2().get("defaultTheme"));
                        return snapshotOf(Map.of(
                                "applicationInfoView", Map.of("applicationId", app.getId(), "name", app.getName(), "applicationType", app.getApplicationType()),
                                "applicationDSL", staticDsl(dsl), "moduleDSL", tuple.getT1(), "orgCommonSettings", themes));
                    });
        });
    }

    record Snapshot(String hash, String json) {}

    static Snapshot snapshotOf(Map<String, Object> payload) {
        try {
            String json = JSON.writeValueAsString(payload);
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest((RENDER_VERSION + "\n" + json).getBytes(StandardCharsets.UTF_8)));
            return new Snapshot(hash, json);
        } catch (Exception error) {
            throw new IllegalArgumentException("Cannot serialize marketplace layout", error);
        }
    }

    static Object staticDsl(Object value) {
        if (value instanceof List<?> list) return list.stream().map(MarketplacePreviewWorker::staticDsl).toList();
        if (!(value instanceof Map<?, ?> map)) return value;
        Map<String, Object> result = new TreeMap<>();
        map.forEach((key, item) -> {
            String name = key.toString();
            if (List.of("queries", "transformers", "dataResponders", "hooks", "events").contains(name)) result.put(name, List.of());
            else if (name.equals("preload")) {
                Map<String, Object> css = new TreeMap<>();
                if (item instanceof Map<?, ?> preload) for (String field : List.of("css", "globalCSS")) {
                    if (preload.get(field) instanceof String style) css.put(field, style);
                }
                result.put(name, css);
            } else result.put(name, staticDsl(item));
        });
        return result;
    }
}

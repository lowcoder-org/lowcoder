package org.lowcoder.api.application.marketplace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidDefinitionException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.test.publisher.PublisherProbe;

/**
 * Pins the {@link MarketplacePreviewWorker} paths upstream's {@code MarketplacePreviewTest} does not run: the scheduled
 * {@code reconcile} and {@code work}, {@code capture}'s requeue, discard and failure paths, the snapshot's module filter
 * and default theme, and {@code snapshotOf}'s failure. The collaborators are mocked as upstream's test mocks them.
 *
 * <p>{@code reconcile} and {@code work} return nothing: they subscribe their chain ({@code MarketplacePreviewWorker.java:54},
 * {@code :62}). Outside the in-progress tests every stub answers synchronously, so the chain completes on the calling
 * thread before the method returns. Because a stub that answered on another thread would let an assertion that a call
 * did not happen pass vacuously, each such test calls the method a second time and verifies the run's first store call
 * was made twice, which only happens after {@code doFinally} released the run's flag. The in-progress tests hold the
 * first run open with a store answer from a test-owned {@link Sinks} sink, completed in a {@code finally} block so the
 * subscription never outlives the test.
 *
 * <p>Framework behaviour relied on, which an upgrade could change: Reactor's sinks hold a subscriber until the test emits;
 * Jackson's default {@code FAIL_ON_EMPTY_BEANS} refuses a plain {@code new Object()}
 * ({@link #snapshotOfAnUnserializableLayoutFails}).
 *
 * <p>Limits: {@code store.discard(job)} is called while the capture chain is assembled
 * ({@code MarketplacePreviewWorker.java:72}, {@code :73}), so a discard is pinned by subscribing to its answer
 * ({@link PublisherProbe}), not by the call.
 */
class MarketplacePreviewWorkerTest {

    private static final String LOG_PREFIX = "[MarketplacePreviewWorkerTest] ";
    private static final String APP_ID = "app";
    private static final String LATER_APP_ID = "later-app";
    private static final String UNSHARED_APP_ID = "unshared-app";
    private static final String BROKEN_APP_ID = "broken-app";
    private static final String MODULE_ID = "module";
    private static final String RECYCLED_MODULE_ID = "recycled-module";
    private static final String ORG_ID = "org";
    private static final String APP_NAME = "Example";
    private static final String STALE_HASH = "stale-hash";
    private static final String DEFAULT_THEME = "theme-1";
    private static final String DEFAULT_THEME_KEY = "defaultTheme";
    private static final String THEME_LIST_KEY = "themeList";
    private static final String MODULE_DSL_KEY = "moduleDSL";
    private static final String ORG_SETTINGS_KEY = "orgCommonSettings";
    private static final String APPLICATION_DSL_KEY = "applicationDSL";
    private static final String QUERIES_KEY = "queries";
    private static final String PRELOAD_KEY = "preload";
    private static final String CSS_KEY = "css";
    private static final String GLOBAL_CSS_KEY = "globalCSS";
    private static final String GLOBAL_STYLE = ".global{color:red}";
    private static final String SERIALIZATION_FAILURE = "Cannot serialize marketplace layout";
    private static final int RENDERER_BUSY = 429;
    private static final int RENDERER_FAILED = 500;
    private static final byte[] IMAGE = {1, 2, 3};
    private static final Map<String, Object> APP_DSL = Map.of("ui", Map.of("title", APP_NAME), QUERIES_KEY, List.of("secret"));
    private static final Map<String, Object> MODULE_DSL = Map.of("ui", Map.of("title", MODULE_ID), QUERIES_KEY, List.of("secret"));
    private static final Map<String, Object> RECYCLED_MODULE_DSL = Map.of("ui", Map.of("title", RECYCLED_MODULE_ID));
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ApplicationService apps = mock(ApplicationService.class);
    private final ApplicationRecordService versions = mock(ApplicationRecordService.class);
    private final OrganizationService orgs = mock(OrganizationService.class);
    private final MarketplacePreviewStore store = mock(MarketplacePreviewStore.class);
    private final MarketplaceRenderClient renderer = mock(MarketplaceRenderClient.class);
    private final MarketplacePreviewWorker worker = new MarketplacePreviewWorker(apps, versions, orgs, store, renderer);
    private final PublisherProbe<Void> discard = PublisherProbe.empty();

    @BeforeEach
    void setUp() {
        when(renderer.isConfigured()).thenReturn(true);
        when(apps.getAllDependentModulesFromDsl(anyMap())).thenReturn(Mono.just(List.of()));
        when(orgs.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(new OrganizationCommonSettings()));
        when(store.ensureIndex()).thenReturn(Mono.empty());
        when(store.claim(any())).thenReturn(Mono.empty());
        when(store.desire(anyString(), anyString())).thenReturn(Mono.empty());
        when(store.complete(any(), any())).thenReturn(Mono.empty());
        when(store.fail(any(), eq(true))).thenReturn(Mono.empty());
        when(store.fail(any(), eq(false))).thenReturn(Mono.empty());
        when(store.discard(any())).thenReturn(discard.mono());
        published(APP_ID, APP_DSL);
    }

    @Test
    void reconcileDesiresEligibleAppsAndContinuesPastAFailure() {
        Application unshared = app(UNSHARED_APP_ID, ApplicationStatus.NORMAL, false);
        when(versions.getLatestRecordByApplicationId(BROKEN_APP_ID))
                .thenReturn(Mono.error(new IllegalStateException("version lookup failed")));
        published(LATER_APP_ID, APP_DSL);
        String appHash = worker.snapshot(app(APP_ID)).block().hash();
        String laterHash = worker.snapshot(app(LATER_APP_ID)).block().hash();
        when(apps.findAllMarketplaceApps())
                .thenReturn(Flux.just(app(APP_ID), unshared, app(BROKEN_APP_ID), app(LATER_APP_ID)));

        worker.reconcile();

        System.out.println(LOG_PREFIX + "expected desires " + APP_ID + "=" + appHash + ", " + LATER_APP_ID + "=" + laterHash);
        verify(store).desire(APP_ID, appHash);
        verify(store).desire(LATER_APP_ID, laterHash);
        verify(store, never()).desire(eq(UNSHARED_APP_ID), anyString());
        verify(store, never()).desire(eq(BROKEN_APP_ID), anyString());
        verify(versions, never()).getLatestRecordByApplicationId(UNSHARED_APP_ID);
        worker.reconcile();
        verify(store, times(2)).ensureIndex();
    }

    @Test
    void reconcileAndWorkDoNothingWithoutAConfiguredRenderer() {
        when(renderer.isConfigured()).thenReturn(false);

        worker.reconcile();
        worker.work();

        verifyNoInteractions(store, apps, versions, orgs);
        when(renderer.isConfigured()).thenReturn(true);
        when(apps.findAllMarketplaceApps()).thenReturn(Flux.empty());
        worker.reconcile();
        worker.work();
        System.out.println(LOG_PREFIX + "configured: the same worker reached the store");
        verify(store).ensureIndex();
        verify(store).claim(any());
    }

    @Test
    void reconcileSkipsWhileARunIsInProgress() {
        Sinks.Empty<Void> index = Sinks.empty();
        when(store.ensureIndex()).thenReturn(index.asMono());
        when(apps.findAllMarketplaceApps()).thenReturn(Flux.empty());
        try {
            worker.reconcile();
            worker.reconcile();
            System.out.println(LOG_PREFIX + "second reconcile while the first holds the index");
            verify(store, times(1)).ensureIndex();
        } finally {
            index.tryEmitEmpty();
        }
        worker.reconcile();
        System.out.println(LOG_PREFIX + "third reconcile after the first finished");
        verify(store, times(2)).ensureIndex();
    }

    @Test
    void workSkipsWhileARunIsInProgress() {
        Sinks.One<MarketplacePreview> claim = Sinks.one();
        when(store.claim(any())).thenReturn(claim.asMono());
        try {
            worker.work();
            worker.work();
            System.out.println(LOG_PREFIX + "second work while the first holds the claim");
            verify(store, times(1)).claim(any());
        } finally {
            claim.tryEmitEmpty();
        }
        worker.work();
        System.out.println(LOG_PREFIX + "third work after the first finished");
        verify(store, times(2)).claim(any());
    }

    @Test
    void workCapturesTheClaimedJob() {
        when(apps.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app(APP_ID)));
        MarketplacePreview job = job(worker.snapshot(APP_ID).block().hash());
        when(store.claim(any())).thenReturn(Mono.just(job), Mono.empty());
        when(renderer.render(anyString())).thenReturn(Mono.just(IMAGE));

        worker.work();

        System.out.println(LOG_PREFIX + "captured job " + job.getId() + " at " + job.getDesiredHash());
        verify(renderer).render(anyString());
        verify(store).complete(job, IMAGE);
        verify(store, never()).desire(anyString(), anyString());
        discard.assertWasNotSubscribed();
        worker.work();
        verify(store, times(2)).claim(any());
    }

    @Test
    void captureOfAChangedLayoutRequeuesIt() {
        when(apps.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app(APP_ID)));
        String currentHash = worker.snapshot(APP_ID).block().hash();
        MarketplacePreview job = job(STALE_HASH);

        worker.capture(job).block();

        System.out.println(LOG_PREFIX + "job at " + STALE_HASH + " requeued at " + currentHash);
        verify(store).desire(APP_ID, currentHash);
        verify(renderer, never()).render(anyString());
        verify(store, never()).complete(any(), any());
        discard.assertWasNotSubscribed();
    }

    /** When the application stops being found: before the capture, or while the renderer works. */
    enum Disappearance { BEFORE_CAPTURE, DURING_RENDER }

    @ParameterizedTest
    @EnumSource(Disappearance.class)
    void captureOfAJobWhoseAppIsGoneDiscardsIt(Disappearance disappearance) {
        when(apps.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app(APP_ID)));
        MarketplacePreview job = job(worker.snapshot(APP_ID).block().hash());
        if (disappearance == Disappearance.BEFORE_CAPTURE) {
            when(apps.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.empty());
        } else {
            when(apps.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app(APP_ID)), Mono.empty());
        }
        when(renderer.render(anyString())).thenReturn(Mono.just(IMAGE));

        worker.capture(job).block();

        System.out.println(LOG_PREFIX + disappearance + ": discard subscribed " + discard.wasSubscribed());
        discard.assertWasSubscribed();
        verify(renderer, times(disappearance == Disappearance.BEFORE_CAPTURE ? 0 : 1)).render(anyString());
        verify(store, never()).complete(any(), any());
        verify(store, never()).desire(anyString(), anyString());
    }

    /** A renderer failure and whether the store should treat it as the renderer being busy. */
    record RenderFailure(String name, Throwable error, boolean busy) {
        @Override
        public String toString() {
            return name;
        }
    }

    static Stream<RenderFailure> renderFailures() {
        return Stream.of(
                new RenderFailure("renderer busy (429)", WebClientResponseException.create(RENDERER_BUSY, "Too Many Requests", null, null, null), true),
                new RenderFailure("renderer failed (500)", WebClientResponseException.create(RENDERER_FAILED, "Internal Server Error", null, null, null), false),
                new RenderFailure("renderer unreachable", new IllegalStateException("connection refused"), false));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("renderFailures")
    void captureFailure(RenderFailure failure) {
        when(apps.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app(APP_ID)));
        MarketplacePreview job = job(worker.snapshot(APP_ID).block().hash());
        when(renderer.render(anyString())).thenReturn(Mono.error(failure.error()));

        worker.capture(job).block();

        System.out.println(LOG_PREFIX + failure + ": expected fail(job, busy=" + failure.busy() + ")");
        verify(store).fail(job, failure.busy());
        verify(store, never()).fail(job, !failure.busy());
        verify(store, never()).complete(any(), any());
    }

    @Test
    void snapshotCarriesNormalModulesAndTheDefaultTheme() throws Exception {
        Application module = app(MODULE_ID);
        Application recycled = app(RECYCLED_MODULE_ID, ApplicationStatus.RECYCLED, true);
        when(apps.getAllDependentModulesFromDsl(anyMap())).thenReturn(Mono.just(List.of(module, recycled)));
        published(MODULE_ID, MODULE_DSL);
        published(RECYCLED_MODULE_ID, RECYCLED_MODULE_DSL);
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put(DEFAULT_THEME_KEY, DEFAULT_THEME);
        settings.put(THEME_LIST_KEY, List.of(DEFAULT_THEME));
        when(orgs.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(settings));

        String json = worker.snapshot(app(APP_ID)).block().json();

        System.out.println(LOG_PREFIX + "snapshot " + json);
        JsonNode snapshot = JSON.readTree(json);
        assertThat(fieldNames(snapshot.get(MODULE_DSL_KEY))).containsExactly(MODULE_ID);
        assertThat(snapshot.get(MODULE_DSL_KEY).get(MODULE_ID).get(QUERIES_KEY).isEmpty()).isTrue();
        assertThat(snapshot.get(ORG_SETTINGS_KEY).get(DEFAULT_THEME_KEY).asText()).isEqualTo(DEFAULT_THEME);
        assertThat(snapshot.get(ORG_SETTINGS_KEY).get(THEME_LIST_KEY).get(0).asText()).isEqualTo(DEFAULT_THEME);
        verify(versions, never()).getLatestRecordByApplicationId(RECYCLED_MODULE_ID);
    }

    @Test
    void snapshotOfAnUnserializableLayoutFails() {
        Map<String, Object> payload = Map.of(APPLICATION_DSL_KEY, new Object());

        assertThatThrownBy(() -> MarketplacePreviewWorker.snapshotOf(payload))
                .satisfies(error -> System.out.println(LOG_PREFIX + "snapshotOf refused: " + error + ", cause " + error.getCause()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(SERIALIZATION_FAILURE)
                .hasCauseInstanceOf(InvalidDefinitionException.class);
    }

    @Test
    void staticDslKeepsOnlyStringStylesOfPreload() {
        Map<String, Object> styled = Map.of(PRELOAD_KEY, Map.of(CSS_KEY, 42, GLOBAL_CSS_KEY, GLOBAL_STYLE, "js", "run()"));
        Map<String, Object> unstyled = Map.of(PRELOAD_KEY, "not a map");

        Object keptStyles = MarketplacePreviewWorker.staticDsl(List.of(styled, unstyled));

        System.out.println(LOG_PREFIX + "static DSL " + keptStyles);
        assertThat(keptStyles).isEqualTo(List.of(
                Map.of(PRELOAD_KEY, Map.of(GLOBAL_CSS_KEY, GLOBAL_STYLE)),
                Map.of(PRELOAD_KEY, Map.of())));
    }

    private void published(String id, Map<String, Object> dsl) {
        when(versions.getLatestRecordByApplicationId(id))
                .thenReturn(Mono.just(ApplicationVersion.builder().applicationDSL(dsl).build()));
    }

    private static Application app(String id) {
        return app(id, ApplicationStatus.NORMAL, true);
    }

    private static Application app(String id, ApplicationStatus status, boolean shared) {
        return Application.builder().id(id).name(APP_NAME).organizationId(ORG_ID)
                .applicationStatus(status).publicToAll(shared).publicToMarketplace(shared).build();
    }

    private static MarketplacePreview job(String desiredHash) {
        MarketplacePreview job = new MarketplacePreview();
        job.setId(APP_ID);
        job.setDesiredHash(desiredHash);
        job.setAttempts(1);
        job.setLeaseToken("lease-token");
        return job;
    }

    private static List<String> fieldNames(JsonNode node) {
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}

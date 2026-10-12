package org.lowcoder.api.application.marketplace;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.repository.ApplicationRecordRepository;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

class MarketplacePreviewTest {
    private final ApplicationService apps = mock(ApplicationService.class);
    private final ApplicationRecordService versions = mock(ApplicationRecordService.class);
    private final OrganizationService orgs = mock(OrganizationService.class);
    private final MarketplacePreviewStore store = mock(MarketplacePreviewStore.class);
    private final MarketplaceRenderClient renderer = mock(MarketplaceRenderClient.class);
    private final MarketplacePreviewWorker worker = new MarketplacePreviewWorker(apps, versions, orgs, store, renderer);

    private Application app(ApplicationStatus status, boolean shared) {
        return Application.builder().id("app").name("Example").organizationId("org")
                .applicationStatus(status).publicToAll(shared).publicToMarketplace(shared).build();
    }

    @Test
    void canonicalHashIgnoresMapOrderButChangesWithLayoutThemeAndModules() {
        Map<String, Object> first = new LinkedHashMap<>();
        first.put("ui", Map.of("title", "App")); first.put("theme", "light");
        Map<String, Object> reordered = new LinkedHashMap<>();
        reordered.put("theme", "light"); reordered.put("ui", Map.of("title", "App"));
        assertEquals(MarketplacePreviewWorker.snapshotOf(first).hash(), MarketplacePreviewWorker.snapshotOf(reordered).hash());
        for (Map<String, Object> change : List.of(Map.<String, Object>of("ui", "new"), Map.<String, Object>of("theme", "dark"),
                Map.<String, Object>of("moduleDSL", Map.of("child", "changed"))))
            assertNotEquals(MarketplacePreviewWorker.snapshotOf(first).hash(), MarketplacePreviewWorker.snapshotOf(change).hash());
    }

    @Test
    void sanitizedCaptureKeepsStylesAndRemovesQueriesEventsAndPreloadScripts() {
        Map<String, Object> input = Map.of("ui", Map.of("title", "Keep", "events", List.of("execute")),
                "queries", List.of(Map.of("password", "secret")), "preload", Map.of("js", "execute()", "css", ".x{color:red}"));
        String json = MarketplacePreviewWorker.snapshotOf(Map.of("applicationDSL", MarketplacePreviewWorker.staticDsl(input))).json();
        assertFalse(json.contains("secret")); assertFalse(json.contains("execute"));
        assertTrue(json.contains("Keep")); assertTrue(json.contains(".x{color:red}"));
    }

    @Test
    void unpublishedDraftAndUnsharedOrRecycledAppsNeverEnterCapture() {
        when(versions.getLatestRecordByApplicationId("app")).thenReturn(Mono.empty());
        assertNull(worker.snapshot(app(ApplicationStatus.NORMAL, true)).block());
        assertNull(worker.snapshot(app(ApplicationStatus.NORMAL, false)).block());
        assertNull(worker.snapshot(app(ApplicationStatus.RECYCLED, true)).block());
        verifyNoInteractions(orgs, renderer, store);
    }

    @Test
    void changedPublicationDuringCaptureCannotStoreTheOldImage() {
        var app = app(ApplicationStatus.NORMAL, true);
        when(apps.findByIdWithoutDsl("app")).thenReturn(Mono.just(app));
        var oldVersion = ApplicationVersion.builder().applicationDSL(Map.of("ui", "old")).build();
        var newVersion = ApplicationVersion.builder().applicationDSL(Map.of("ui", "new")).build();
        when(versions.getLatestRecordByApplicationId("app")).thenReturn(Mono.just(oldVersion));
        when(apps.getAllDependentModulesFromDsl(anyMap())).thenReturn(Mono.just(List.of()));
        when(orgs.getOrgCommonSettings("org")).thenReturn(Mono.just(new OrganizationCommonSettings()));
        var before = worker.snapshot("app").block();
        var job = new MarketplacePreview(); job.setId("app"); job.setDesiredHash(before.hash());
        when(renderer.render(anyString())).thenAnswer(ignored -> {
            when(versions.getLatestRecordByApplicationId("app")).thenReturn(Mono.just(newVersion));
            return Mono.just(new byte[]{1, 2});
        });
        when(store.desire(eq("app"), anyString())).thenReturn(Mono.empty());
        when(store.discard(job)).thenReturn(Mono.empty());
        worker.capture(job).block();
        verify(store).desire(eq("app"), argThat(hash -> !hash.equals(before.hash())));
        verify(store, never()).complete(any(), any());
    }

    @Test
    void aThousandReadsUseStoredImageWithoutRenderingAndRevocationAlsoBlocks304() {
        var publications = mock(ApplicationRecordRepository.class);
        var permissions = mock(ResourcePermissionService.class);
        var users = mock(SessionUserService.class);
        var controller = new MarketplacePreviewController(apps, publications, permissions, users, store);
        when(apps.findByIdWithoutDsl("app")).thenReturn(Mono.just(app(ApplicationStatus.NORMAL, true)));
        when(users.getVisitorId()).thenReturn(Mono.just("viewer"));
        when(permissions.checkUserPermissionStatusOnApplication(anyString(), anyString(), any(), any()))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(ResourcePermission.builder().resourceRole(ResourceRole.VIEWER).build())));
        when(publications.existsByApplicationId("app")).thenReturn(Mono.just(true));
        var image = new MarketplacePreview(); image.setRenderedHash("hash"); image.setImage(new byte[]{1, 2});
        when(store.read("app")).thenReturn(Mono.just(image));
        var responses = Flux.range(0, 1000).flatMap(i -> controller.image("app", null)).collectList().block();
        assertEquals(1000, responses.size());
        assertTrue(responses.stream().allMatch(response -> response.getStatusCode().value() == 200));
        assertEquals(304, controller.image("app", "\"hash\"").block().getStatusCode().value());
        when(permissions.checkUserPermissionStatusOnApplication(anyString(), anyString(), any(), any()))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.anonymousUser()));
        assertEquals(404, controller.image("app", "\"hash\"").block().getStatusCode().value());
        when(apps.findByIdWithoutDsl("app")).thenReturn(Mono.just(app(ApplicationStatus.NORMAL, false)));
        assertEquals(404, controller.image("app", "\"hash\"").block().getStatusCode().value());
        when(apps.findByIdWithoutDsl("app")).thenReturn(Mono.just(app(ApplicationStatus.RECYCLED, true)));
        assertEquals(404, controller.image("app", "\"hash\"").block().getStatusCode().value());
        verifyNoInteractions(renderer, versions, orgs);
        verify(store, never()).desire(anyString(), anyString());
        verify(store, never()).claim(any());
    }
}

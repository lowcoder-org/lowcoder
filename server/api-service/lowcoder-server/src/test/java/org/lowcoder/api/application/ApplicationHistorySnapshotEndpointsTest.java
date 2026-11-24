package org.lowcoder.api.application;

import com.google.common.collect.ImmutableMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotRequest;
import org.lowcoder.api.application.view.HistorySnapshotDslView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.util.Pagination;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshotTS;
import org.lowcoder.domain.application.service.ApplicationHistorySnapshotService;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ApplicationHistorySnapshotEndpointsTest {

    private ResourcePermissionService resourcePermissionService;
    private ApplicationHistorySnapshotService applicationHistorySnapshotService;
    private SessionUserService sessionUserService;
    private UserService userService;
    private ApplicationService applicationService;
    private ApplicationRecordService applicationRecordService;
    private ApplicationHistorySnapshotController controller;
    private Application pathApplication;

    private static final String TEST_APPLICATION_ID = "test-app-id";
    private static final String OTHER_APPLICATION_ID = "other-app-id";
    private static final String TEST_APPLICATION_GID = "test-app-gid";
    private static final String TEST_APPLICATION_SLUG = "test-app-slug";
    private static final String TEST_SNAPSHOT_ID = "test-snapshot-id";
    private static final String TEST_USER_ID = "test-user-id";
    private static final String TEST_USER_NAME = "Test User";
    private static final String TEST_USER_AVATAR = "https://example.com/avatar.jpg";
    private static final Instant SNAPSHOT_CREATED_AT = Instant.parse("2026-01-02T00:00:00Z");
    private static final Instant BEFORE_SNAPSHOT = SNAPSHOT_CREATED_AT.minusSeconds(60);
    private static final Instant AFTER_SNAPSHOT = SNAPSHOT_CREATED_AT.plusSeconds(60);

    @BeforeEach
    void setUp() {
        // Create mocks manually
        resourcePermissionService = Mockito.mock(ResourcePermissionService.class);
        applicationHistorySnapshotService = Mockito.mock(ApplicationHistorySnapshotService.class);
        sessionUserService = Mockito.mock(SessionUserService.class);
        userService = Mockito.mock(UserService.class);
        applicationService = Mockito.mock(ApplicationService.class);
        applicationRecordService = Mockito.mock(ApplicationRecordService.class);

        // Setup common mocks
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(TEST_USER_ID));
        when(resourcePermissionService.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class)))
                .thenReturn(Mono.empty());
        pathApplication = createMockApplication(TEST_APPLICATION_ID);
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_ID)).thenReturn(Mono.just(pathApplication));

        // Create controller with all required dependencies
        controller = new ApplicationHistorySnapshotController(
                resourcePermissionService,
                applicationHistorySnapshotService,
                sessionUserService,
                userService,
                applicationService,
                applicationRecordService
        );
    }

    @Test
    void testCreate_success() {
        // Prepare request data
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("components", new HashMap<>());
        dsl.put("layout", new HashMap<>());

        Map<String, Object> context = new HashMap<>();
        context.put("action", "save");
        context.put("timestamp", Instant.now().toEpochMilli());

        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(
                TEST_APPLICATION_ID,
                dsl,
                context
        );

        when(applicationHistorySnapshotService.createHistorySnapshot(
                eq(TEST_APPLICATION_ID),
                eq(dsl),
                eq(context),
                eq(TEST_USER_ID)
        )).thenReturn(Mono.just(true));

        when(applicationService.updateLastEditedAt(eq(TEST_APPLICATION_ID), any(Instant.class), eq(TEST_USER_ID)))
                .thenReturn(Mono.just(true));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.create(request);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testCreate_withEmptyDsl() {
        // Prepare request data with empty DSL
        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(
                TEST_APPLICATION_ID,
                new HashMap<>(),
                new HashMap<>()
        );

        when(applicationHistorySnapshotService.createHistorySnapshot(
                eq(TEST_APPLICATION_ID),
                any(Map.class),
                any(Map.class),
                eq(TEST_USER_ID)
        )).thenReturn(Mono.just(true));

        when(applicationService.updateLastEditedAt(eq(TEST_APPLICATION_ID), any(Instant.class), eq(TEST_USER_ID)))
                .thenReturn(Mono.just(true));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.create(request);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testCreate_serviceError() {
        // Prepare request data
        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(
                TEST_APPLICATION_ID,
                new HashMap<>(),
                new HashMap<>()
        );

        when(applicationHistorySnapshotService.createHistorySnapshot(
                anyString(),
                any(Map.class),
                any(Map.class),
                anyString()
        )).thenReturn(Mono.error(new RuntimeException("Service error")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.create(request);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectErrorMessage("Service error")
                .verify();
    }

    @Test
    void testListAllHistorySnapshotBriefInfo_success() {
        // Prepare test data
        ApplicationHistorySnapshot snapshot1 = createMockApplicationHistorySnapshot("snapshot-1", "user1");
        ApplicationHistorySnapshot snapshot2 = createMockApplicationHistorySnapshot("snapshot-2", "user2");
        List<ApplicationHistorySnapshot> snapshotList = List.of(snapshot1, snapshot2);

        User user1 = createMockUser("user1", "User One", "avatar1.jpg");
        User user2 = createMockUser("user2", "User Two", "avatar2.jpg");

        when(applicationHistorySnapshotService.listAllHistorySnapshotBriefInfo(
                eq(TEST_APPLICATION_ID),
                anyString(),
                anyString(),
                any(Instant.class),
                any(Instant.class),
                any()
        )).thenReturn(Mono.just(snapshotList));

        when(userService.getByIds(anyList())).thenReturn(Mono.just(Map.of("user1", user1, "user2", user2)));
        when(applicationHistorySnapshotService.countByApplicationId(eq(TEST_APPLICATION_ID)))
                .thenReturn(Mono.just(2L));

        // Test the controller method directly
        Mono<ResponseView<Map<String, Object>>> result = controller.listAllHistorySnapshotBriefInfo(
                TEST_APPLICATION_ID,
                1,
                10,
                "test-component",
                "dark",
                Instant.now().minusSeconds(3600),
                Instant.now()
        );

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().containsKey("list");
                    assert response.getData().containsKey("count");
                    assert (Long) response.getData().get("count") == 2L;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testListAllHistorySnapshotBriefInfo_withNullFilters() {
        // Prepare test data
        List<ApplicationHistorySnapshot> snapshotList = List.of();
        User user = createMockUser("user1", "User One", "avatar1.jpg");

        when(applicationHistorySnapshotService.listAllHistorySnapshotBriefInfo(
                eq(TEST_APPLICATION_ID),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                any()
        )).thenReturn(Mono.just(snapshotList));

        when(userService.getByIds(anyList())).thenReturn(Mono.just(Map.of()));
        when(applicationHistorySnapshotService.countByApplicationId(eq(TEST_APPLICATION_ID)))
                .thenReturn(Mono.just(0L));

        // Test the controller method directly
        Mono<ResponseView<Map<String, Object>>> result = controller.listAllHistorySnapshotBriefInfo(
                TEST_APPLICATION_ID,
                1,
                10,
                null,
                null,
                null,
                null
        );

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().containsKey("list");
                    assert response.getData().containsKey("count");
                    assert (Long) response.getData().get("count") == 0L;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testListAllHistorySnapshotBriefInfo_serviceError() {
        when(applicationHistorySnapshotService.listAllHistorySnapshotBriefInfo(
                anyString(),
                anyString(),
                anyString(),
                any(Instant.class),
                any(Instant.class),
                any()
        )).thenReturn(Mono.error(new RuntimeException("Service error")));

        // Test the controller method directly
        Mono<ResponseView<Map<String, Object>>> result = controller.listAllHistorySnapshotBriefInfo(
                TEST_APPLICATION_ID,
                1,
                10,
                "test-component",
                "dark",
                Instant.now().minusSeconds(3600),
                Instant.now()
        );

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testListAllHistorySnapshotBriefInfoArchived_success() {
        // Prepare test data
        ApplicationHistorySnapshotTS snapshot1 = createMockApplicationHistorySnapshotTS("snapshot-1", "user1");
        ApplicationHistorySnapshotTS snapshot2 = createMockApplicationHistorySnapshotTS("snapshot-2", "user2");
        List<ApplicationHistorySnapshotTS> snapshotList = List.of(snapshot1, snapshot2);

        User user1 = createMockUser("user1", "User One", "avatar1.jpg");
        User user2 = createMockUser("user2", "User Two", "avatar2.jpg");

        when(applicationHistorySnapshotService.listAllHistorySnapshotBriefInfoArchived(
                eq(TEST_APPLICATION_ID),
                anyString(),
                anyString(),
                any(Instant.class),
                any(Instant.class),
                any()
        )).thenReturn(Mono.just(snapshotList));

        when(userService.getByIds(anyList())).thenReturn(Mono.just(Map.of("user1", user1, "user2", user2)));
        when(applicationHistorySnapshotService.countByApplicationIdArchived(eq(TEST_APPLICATION_ID)))
                .thenReturn(Mono.just(2L));

        // Test the controller method directly
        Mono<ResponseView<Map<String, Object>>> result = controller.listAllHistorySnapshotBriefInfoArchived(
                TEST_APPLICATION_ID,
                1,
                10,
                "test-component",
                "dark",
                Instant.now().minusSeconds(3600),
                Instant.now()
        );

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().containsKey("list");
                    assert response.getData().containsKey("count");
                    assert (Long) response.getData().get("count") == 2L;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testListAllHistorySnapshotBriefInfoArchived_serviceError() {
        when(applicationHistorySnapshotService.listAllHistorySnapshotBriefInfoArchived(
                anyString(),
                anyString(),
                anyString(),
                any(Instant.class),
                any(Instant.class),
                any()
        )).thenReturn(Mono.error(new RuntimeException("Service error")));

        // Test the controller method directly
        Mono<ResponseView<Map<String, Object>>> result = controller.listAllHistorySnapshotBriefInfoArchived(
                TEST_APPLICATION_ID,
                1,
                10,
                "test-component",
                "dark",
                Instant.now().minusSeconds(3600),
                Instant.now()
        );

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetHistorySnapshotDsl_success() {
        // Prepare test data
        ApplicationHistorySnapshot snapshot = createMockApplicationHistorySnapshot(TEST_SNAPSHOT_ID, TEST_USER_ID);
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("components", new HashMap<>());
        dsl.put("layout", new HashMap<>());

        List<Application> dependentModules = List.of();

        when(applicationHistorySnapshotService.getHistorySnapshotDetail(eq(TEST_SNAPSHOT_ID)))
                .thenReturn(Mono.just(snapshot));
        when(applicationService.getAllDependentModulesFromDsl(any(Map.class)))
                .thenReturn(Mono.just(dependentModules));

        // Test the controller method directly
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(
                TEST_APPLICATION_ID,
                TEST_SNAPSHOT_ID
        );

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationsDsl() != null;
                    assert response.getData().getModuleDSL() != null;
                    return true;
                })
                .verifyComplete();
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService).findByIdWithoutDsl(TEST_APPLICATION_ID);
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
    }

    @Test
    void testGetHistorySnapshotDsl_withDependentModules() {
        // Prepare test data
        ApplicationHistorySnapshot snapshot = createMockApplicationHistorySnapshot(TEST_SNAPSHOT_ID, TEST_USER_ID);
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("components", new HashMap<>());
        dsl.put("layout", new HashMap<>());

        Application dependentApp = createMockApplication("dependent-app-id");
        List<Application> dependentModules = List.of(dependentApp);

        when(applicationHistorySnapshotService.getHistorySnapshotDetail(eq(TEST_SNAPSHOT_ID)))
                .thenReturn(Mono.just(snapshot));
        when(applicationService.getAllDependentModulesFromDsl(any(Map.class)))
                .thenReturn(Mono.just(dependentModules));
        when(dependentApp.getLiveApplicationDsl(applicationRecordService))
                .thenReturn(Mono.just(new HashMap<>()));

        // Test the controller method directly
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(
                TEST_APPLICATION_ID,
                TEST_SNAPSHOT_ID
        );

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationsDsl() != null;
                    assert response.getData().getModuleDSL() != null;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetHistorySnapshotDsl_serviceError() {
        when(applicationHistorySnapshotService.getHistorySnapshotDetail(eq(TEST_SNAPSHOT_ID)))
                .thenReturn(Mono.error(new RuntimeException("Service error")));

        // Test the controller method directly
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(
                TEST_APPLICATION_ID,
                TEST_SNAPSHOT_ID
        );

        // Verify the error is propagated (expectErrorMessage, not expectError: a wrong-typed refusal, e.g. BizException, must fail this test too)
        StepVerifier.create(result)
                .expectErrorMessage("Service error")
                .verify();
    }

    @Test
    void testGetHistorySnapshotDslArchived_success() {
        // Prepare test data
        ApplicationHistorySnapshotTS snapshot = createMockApplicationHistorySnapshotTS(TEST_SNAPSHOT_ID, TEST_USER_ID);
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("components", new HashMap<>());
        dsl.put("layout", new HashMap<>());

        List<Application> dependentModules = List.of();

        when(applicationHistorySnapshotService.getHistorySnapshotDetailArchived(eq(TEST_SNAPSHOT_ID)))
                .thenReturn(Mono.just(snapshot));
        when(applicationService.getAllDependentModulesFromDsl(any(Map.class)))
                .thenReturn(Mono.just(dependentModules));

        // Test the controller method directly
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDslArchived(
                TEST_APPLICATION_ID,
                TEST_SNAPSHOT_ID
        );

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationsDsl() != null;
                    assert response.getData().getModuleDSL() != null;
                    return true;
                })
                .verifyComplete();
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService).findByIdWithoutDsl(TEST_APPLICATION_ID);
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
    }

    @Test
    void testGetHistorySnapshotDslArchived_serviceError() {
        when(applicationHistorySnapshotService.getHistorySnapshotDetailArchived(eq(TEST_SNAPSHOT_ID)))
                .thenReturn(Mono.error(new RuntimeException("Service error")));

        // Test the controller method directly
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDslArchived(
                TEST_APPLICATION_ID,
                TEST_SNAPSHOT_ID
        );

        // Verify the error is propagated (expectErrorMessage, not expectError: a wrong-typed refusal, e.g. BizException, must fail this test too)
        StepVerifier.create(result)
                .expectErrorMessage("Service error")
                .verify();
    }

    @Test
    void testPermissionCheck_failure() {
        // Prepare request data
        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(
                TEST_APPLICATION_ID,
                new HashMap<>(),
                new HashMap<>()
        );

        when(resourcePermissionService.checkResourcePermissionWithError(
                eq(TEST_USER_ID),
                eq(TEST_APPLICATION_ID),
                eq(ResourceAction.EDIT_APPLICATIONS)
        )).thenReturn(Mono.error(new RuntimeException("Permission denied")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.create(request);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    // ---------------------------------------------------------------- D-31: served only through the app it was saved for

    @Test
    void testGetHistorySnapshotDsl_snapshotOfAnotherApplication_isRefused() {
        ApplicationHistorySnapshot snapshot = stubSnapshot(OTHER_APPLICATION_ID);

        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] snapshotOfAnotherApplication: path=" + TEST_APPLICATION_ID
                + " stored=" + OTHER_APPLICATION_ID);
        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService, never()).findByIdWithoutDsl(OTHER_APPLICATION_ID);
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
        verifyNoInteractions(applicationRecordService);
    }

    @Test
    void testGetHistorySnapshotDsl_snapshotStoredUnderGid_isRefused() {
        when(pathApplication.getGid()).thenReturn(TEST_APPLICATION_GID);
        when(pathApplication.getCreatedAt()).thenReturn(BEFORE_SNAPSHOT);
        ApplicationHistorySnapshot snapshot = stubSnapshot(TEST_APPLICATION_GID);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_GID)).thenReturn(Mono.just(pathApplication));

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] snapshotStoredUnderGid: path=" + TEST_APPLICATION_ID
                + " stored=" + TEST_APPLICATION_GID + " marker=null createdAt(app)=" + BEFORE_SNAPSHOT + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(applicationService, never()).findByIdWithoutDsl(TEST_APPLICATION_GID);
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
    }

    @Test
    void testGetHistorySnapshotDsl_snapshotStoredUnderSlug_isRefused() {
        when(pathApplication.getSlug()).thenReturn(TEST_APPLICATION_SLUG);
        when(pathApplication.getCreatedAt()).thenReturn(BEFORE_SNAPSHOT);
        ApplicationHistorySnapshot snapshot = stubSnapshot(TEST_APPLICATION_SLUG);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_SLUG)).thenReturn(Mono.just(pathApplication));

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] snapshotStoredUnderSlug: path=" + TEST_APPLICATION_ID
                + " stored=" + TEST_APPLICATION_SLUG + " marker=null createdAt(app)=" + BEFORE_SNAPSHOT + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(applicationService, never()).findByIdWithoutDsl(TEST_APPLICATION_SLUG);
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
    }

    @Test
    void testGetHistorySnapshotDsl_snapshotWithoutApplication_isRefused() {
        ApplicationHistorySnapshot snapshot = stubSnapshot(null);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] snapshotWithoutApplication: path=" + TEST_APPLICATION_ID + " stored=null");
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService, never()).findByIdWithoutDsl(isNull());
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
    }

    @Test
    void testGetHistorySnapshotDsl_pathGivenAsSlug_isServed() {
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_SLUG)).thenReturn(Mono.just(pathApplication));
        stubSnapshot(TEST_APPLICATION_ID);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] pathGivenAsSlug: path=" + TEST_APPLICATION_SLUG
                + " resolvedTo=" + TEST_APPLICATION_ID + " stored=" + TEST_APPLICATION_ID);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_SLUG, TEST_SNAPSHOT_ID);

        StepVerifier.create(result)
                .expectNextMatches(response -> response.isSuccess() && response.getData().getApplicationsDsl() != null
                        && response.getData().getModuleDSL() != null)
                .verifyComplete();
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), eq(TEST_APPLICATION_SLUG), any());
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService, never()).findById(anyString());
    }

    @Test
    void testGetHistorySnapshotDsl_pathApplicationNotFound_skipsCheckAndSnapshotRead() {
        BizException notFound = new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", TEST_APPLICATION_ID);
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_ID)).thenReturn(Mono.error(notFound));
        stubSnapshot(TEST_APPLICATION_ID);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] pathApplicationNotFound: path=" + TEST_APPLICATION_ID);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(notFound)).verify();
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), anyString(), any());
        verify(applicationHistorySnapshotService, never()).getHistorySnapshotDetail(anyString());
    }

    @Test
    void testGetHistorySnapshotDsl_editDenied_skipsSnapshotRead() {
        BizException denied = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        when(resourcePermissionService.checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.error(denied));
        stubSnapshot(TEST_APPLICATION_ID);

        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(denied)).verify();
        verify(applicationHistorySnapshotService, never()).getHistorySnapshotDetail(anyString());
    }

    @Test
    void testGetHistorySnapshotDslArchived_snapshotOfAnotherApplication_isRefused() {
        ApplicationHistorySnapshotTS snapshot = stubArchivedSnapshot(OTHER_APPLICATION_ID);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] archived snapshotOfAnotherApplication: path=" + TEST_APPLICATION_ID
                + " stored=" + OTHER_APPLICATION_ID);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDslArchived(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService, never()).findByIdWithoutDsl(OTHER_APPLICATION_ID);
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
        verifyNoInteractions(applicationRecordService);
    }

    @Test
    void testGetHistorySnapshotDslArchived_pathGivenAsSlug_isServed() {
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_SLUG)).thenReturn(Mono.just(pathApplication));
        stubArchivedSnapshot(TEST_APPLICATION_ID);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] archived pathGivenAsSlug: path=" + TEST_APPLICATION_SLUG
                + " resolvedTo=" + TEST_APPLICATION_ID + " stored=" + TEST_APPLICATION_ID);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDslArchived(TEST_APPLICATION_SLUG, TEST_SNAPSHOT_ID);

        StepVerifier.create(result)
                .expectNextMatches(response -> response.isSuccess() && response.getData().getApplicationsDsl() != null
                        && response.getData().getModuleDSL() != null)
                .verifyComplete();
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), eq(TEST_APPLICATION_SLUG), any());
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
        verify(applicationService, never()).findById(anyString());
    }

    @Test
    void testGetHistorySnapshotDsl_legacySnapshotOfOlderApplication_isServed() {
        stubSnapshot(TEST_APPLICATION_ID);
        when(pathApplication.getCreatedAt()).thenReturn(BEFORE_SNAPSHOT);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] legacySnapshotOfOlderApplication: createdAt(app)="
                + BEFORE_SNAPSHOT + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result)
                .expectNextMatches(response -> response.isSuccess() && response.getData().getApplicationsDsl() != null
                        && response.getData().getModuleDSL() != null)
                .verifyComplete();
    }

    @Test
    void testGetHistorySnapshotDsl_legacySnapshotOfNewerApplication_isRefused() {
        ApplicationHistorySnapshot snapshot = stubSnapshot(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        when(pathApplication.getCreatedAt()).thenReturn(AFTER_SNAPSHOT);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] legacySnapshotOfNewerApplication: createdAt(app)="
                + AFTER_SNAPSHOT + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
    }

    @Test
    void testGetHistorySnapshotDsl_legacySnapshotOfEquallyTimedApplication_isRefused() {
        ApplicationHistorySnapshot snapshot = stubSnapshot(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        when(pathApplication.getCreatedAt()).thenReturn(SNAPSHOT_CREATED_AT);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] legacySnapshotOfEquallyTimedApplication: createdAt(app)="
                + SNAPSHOT_CREATED_AT + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(snapshot, never()).getDsl();
        verify(applicationService, never()).getAllDependentModulesFromDsl(any());
    }

    @Test
    void testGetHistorySnapshotDsl_legacySnapshot_applicationWithoutCreationTime_isRefused() {
        ApplicationHistorySnapshot snapshot = stubSnapshot(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        // pathApplication.getCreatedAt() left unstubbed: null.

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] legacySnapshot_applicationWithoutCreationTime: createdAt(app)=null"
                + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(snapshot, never()).getDsl();
    }

    @Test
    void testGetHistorySnapshotDsl_legacySnapshotWithoutCreationTime_isRefused() {
        ApplicationHistorySnapshot snapshot = stubSnapshot(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        when(snapshot.getCreatedAt()).thenReturn(null);
        when(pathApplication.getCreatedAt()).thenReturn(BEFORE_SNAPSHOT);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] legacySnapshotWithoutCreationTime: createdAt(app)="
                + BEFORE_SNAPSHOT + " createdAt(snapshot)=null");
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(snapshot, never()).getDsl();
    }

    @Test
    void testGetHistorySnapshotDsl_resolvedSnapshot_applicationWithoutCreationTime_isServed() {
        stubSnapshot(TEST_APPLICATION_ID);
        // marker stays TRUE (stubSnapshot/createMockApplicationHistorySnapshot default); pathApplication.getCreatedAt() left unstubbed: null.

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] resolvedSnapshot_applicationWithoutCreationTime: marker=TRUE createdAt(app)=null");
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDsl(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result)
                .expectNextMatches(response -> response.isSuccess() && response.getData().getApplicationsDsl() != null
                        && response.getData().getModuleDSL() != null)
                .verifyComplete();
    }

    @Test
    void testGetHistorySnapshotDslArchived_legacySnapshotOfNewerApplication_isRefused() {
        ApplicationHistorySnapshotTS snapshot = stubArchivedSnapshot(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(null);
        when(pathApplication.getCreatedAt()).thenReturn(AFTER_SNAPSHOT);

        System.out.println("[ApplicationHistorySnapshotEndpointsTest] archived legacySnapshotOfNewerApplication: createdAt(app)="
                + AFTER_SNAPSHOT + " createdAt(snapshot)=" + SNAPSHOT_CREATED_AT);
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDslArchived(TEST_APPLICATION_ID, TEST_SNAPSHOT_ID);

        StepVerifier.create(result).expectErrorSatisfies(this::assertInvalidHistorySnapshot).verify();
        verify(snapshot, never()).getDsl();
    }

    @Test
    void testCreate_requestGivenAsSlug_storesObjectId() {
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("components", new HashMap<>());
        dsl.put("layout", new HashMap<>());
        Map<String, Object> context = new HashMap<>();
        context.put("action", "save");
        context.put("timestamp", Instant.now().toEpochMilli());
        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(TEST_APPLICATION_SLUG, dsl, context);
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_SLUG)).thenReturn(Mono.just(pathApplication));
        stubCreateSucceeds();

        Mono<ResponseView<Boolean>> result = controller.create(request);

        StepVerifier.create(result)
                .expectNextMatches(response -> response.isSuccess() && Boolean.TRUE.equals(response.getData()))
                .verifyComplete();
        verify(applicationHistorySnapshotService).createHistorySnapshot(eq(TEST_APPLICATION_ID), eq(dsl), eq(context), eq(TEST_USER_ID));
        verify(applicationHistorySnapshotService, never()).createHistorySnapshot(eq(TEST_APPLICATION_SLUG), any(), any(), any());
        verify(resourcePermissionService).checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), eq(TEST_APPLICATION_SLUG), any());
        verify(applicationService).updateLastEditedAt(eq(TEST_APPLICATION_ID), any(Instant.class), eq(TEST_USER_ID));
        verify(applicationService, times(1)).findByIdWithoutDsl(anyString());
    }

    @Test
    void testCreate_applicationNotFound_storesNothing() {
        BizException notFound = new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", TEST_APPLICATION_ID);
        when(applicationService.findByIdWithoutDsl(TEST_APPLICATION_ID)).thenReturn(Mono.error(notFound));
        stubCreateSucceeds();
        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(TEST_APPLICATION_ID, new HashMap<>(), new HashMap<>());

        Mono<ResponseView<Boolean>> result = controller.create(request);

        StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(notFound)).verify();
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), anyString(), any());
        verify(applicationHistorySnapshotService, never()).createHistorySnapshot(anyString(), any(), any(), any());
        verify(applicationService, never()).updateLastEditedAt(anyString(), any(), anyString());
    }

    @Test
    void testCreate_editDenied_storesNothing() {
        BizException denied = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        when(resourcePermissionService.checkResourcePermissionWithError(TEST_USER_ID, TEST_APPLICATION_ID, ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.error(denied));
        stubCreateSucceeds();
        ApplicationHistorySnapshotRequest request = new ApplicationHistorySnapshotRequest(TEST_APPLICATION_ID, new HashMap<>(), new HashMap<>());

        Mono<ResponseView<Boolean>> result = controller.create(request);

        StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(denied)).verify();
        verify(applicationHistorySnapshotService, never()).createHistorySnapshot(anyString(), any(), any(), any());
    }

    // Helper methods to create mock objects
    private ApplicationHistorySnapshot createMockApplicationHistorySnapshot(String snapshotId, String userId) {
        ApplicationHistorySnapshot snapshot = Mockito.mock(ApplicationHistorySnapshot.class);
        when(snapshot.getId()).thenReturn(snapshotId);
        when(snapshot.getApplicationId()).thenReturn(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(Boolean.TRUE);
        when(snapshot.getCreatedBy()).thenReturn(userId);
        when(snapshot.getCreatedAt()).thenReturn(Instant.now());
        when(snapshot.getDsl()).thenReturn(new HashMap<>());
        when(snapshot.getContext()).thenReturn(new HashMap<>());
        return snapshot;
    }

    private ApplicationHistorySnapshotTS createMockApplicationHistorySnapshotTS(String snapshotId, String userId) {
        ApplicationHistorySnapshotTS snapshot = Mockito.mock(ApplicationHistorySnapshotTS.class);
        when(snapshot.getId()).thenReturn(snapshotId);
        when(snapshot.getApplicationId()).thenReturn(TEST_APPLICATION_ID);
        when(snapshot.getApplicationIdResolved()).thenReturn(Boolean.TRUE);
        when(snapshot.getCreatedBy()).thenReturn(userId);
        when(snapshot.getCreatedAt()).thenReturn(Instant.now());
        when(snapshot.getDsl()).thenReturn(new HashMap<>());
        when(snapshot.getContext()).thenReturn(new HashMap<>());
        return snapshot;
    }

    /** Refused by {@code savedFor} (the create route's style of INVALID_HISTORY_SNAPSHOT, D-31): verbose and exact. */
    private void assertInvalidHistorySnapshot(Throwable error) {
        System.out.println("[ApplicationHistorySnapshotEndpointsTest] refused: " + error);
        assertThat(error).isInstanceOf(BizException.class);
        BizException bizException = (BizException) error;
        assertThat(bizException.getError()).isEqualTo(BizError.INVALID_HISTORY_SNAPSHOT);
        assertThat(bizException.getMessageKey()).isEqualTo("INVALID_HISTORY_SNAPSHOT");
        assertThat(bizException.getArgs()).containsExactly(TEST_SNAPSHOT_ID);
    }

    /** Stubs the whole read side of an active-snapshot DSL test, so no row leaves a {@code null}; marker stays TRUE. */
    private ApplicationHistorySnapshot stubSnapshot(String storedApplicationKey) {
        ApplicationHistorySnapshot snapshot = createMockApplicationHistorySnapshot(TEST_SNAPSHOT_ID, TEST_USER_ID);
        when(snapshot.getApplicationId()).thenReturn(storedApplicationKey);
        when(snapshot.getCreatedAt()).thenReturn(SNAPSHOT_CREATED_AT);
        when(applicationHistorySnapshotService.getHistorySnapshotDetail(TEST_SNAPSHOT_ID)).thenReturn(Mono.just(snapshot));
        when(applicationService.getAllDependentModulesFromDsl(any(Map.class))).thenReturn(Mono.just(List.of()));
        return snapshot;
    }

    /** As {@link #stubSnapshot}, for the archive route. */
    private ApplicationHistorySnapshotTS stubArchivedSnapshot(String storedApplicationKey) {
        ApplicationHistorySnapshotTS snapshot = createMockApplicationHistorySnapshotTS(TEST_SNAPSHOT_ID, TEST_USER_ID);
        when(snapshot.getApplicationId()).thenReturn(storedApplicationKey);
        when(snapshot.getCreatedAt()).thenReturn(SNAPSHOT_CREATED_AT);
        when(applicationHistorySnapshotService.getHistorySnapshotDetailArchived(TEST_SNAPSHOT_ID)).thenReturn(Mono.just(snapshot));
        when(applicationService.getAllDependentModulesFromDsl(any(Map.class))).thenReturn(Mono.just(List.of()));
        return snapshot;
    }

    /** Stubs the two writes of the create route for any key, so an unfixed controller is answered too. */
    private void stubCreateSucceeds() {
        when(applicationHistorySnapshotService.createHistorySnapshot(anyString(), any(Map.class), any(Map.class), anyString()))
                .thenReturn(Mono.just(true));
        when(applicationService.updateLastEditedAt(anyString(), any(Instant.class), anyString())).thenReturn(Mono.just(true));
    }

    private User createMockUser(String userId, String userName, String avatarUrl) {
        User user = Mockito.mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getName()).thenReturn(userName);
        when(user.getAvatarUrl()).thenReturn(avatarUrl);
        return user;
    }

    private Application createMockApplication(String appId) {
        Application app = Mockito.mock(Application.class);
        when(app.getId()).thenReturn(appId);
        return app;
    }
} 
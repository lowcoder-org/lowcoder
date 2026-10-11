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
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class ApplicationHistorySnapshotEndpointsTest {

    private ResourcePermissionService resourcePermissionService;
    private ApplicationHistorySnapshotService applicationHistorySnapshotService;
    private SessionUserService sessionUserService;
    private UserService userService;
    private ApplicationService applicationService;
    private ApplicationRecordService applicationRecordService;
    private ApplicationHistorySnapshotController controller;

    private static final String TEST_APPLICATION_ID = "test-app-id";
    private static final String TEST_SNAPSHOT_ID = "test-snapshot-id";
    private static final String TEST_USER_ID = "test-user-id";
    private static final String TEST_USER_NAME = "Test User";
    private static final String TEST_USER_AVATAR = "https://example.com/avatar.jpg";

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
                .expectError(RuntimeException.class)
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

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
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

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
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

    // Helper methods to create mock objects
    private ApplicationHistorySnapshot createMockApplicationHistorySnapshot(String snapshotId, String userId) {
        ApplicationHistorySnapshot snapshot = Mockito.mock(ApplicationHistorySnapshot.class);
        when(snapshot.getId()).thenReturn(snapshotId);
        when(snapshot.getApplicationId()).thenReturn(TEST_APPLICATION_ID);
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
        when(snapshot.getCreatedBy()).thenReturn(userId);
        when(snapshot.getCreatedAt()).thenReturn(Instant.now());
        when(snapshot.getDsl()).thenReturn(new HashMap<>());
        when(snapshot.getContext()).thenReturn(new HashMap<>());
        return snapshot;
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
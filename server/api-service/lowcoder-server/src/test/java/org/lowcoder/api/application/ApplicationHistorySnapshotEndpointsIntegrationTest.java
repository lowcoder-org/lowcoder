package org.lowcoder.api.application;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotRequest;
import org.lowcoder.api.application.view.HistorySnapshotDslView;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@SpringBootTest
@ActiveProfiles("test") // Uses embedded MongoDB
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ApplicationHistorySnapshotEndpointsIntegrationTest {

    @Autowired
    private ApplicationHistorySnapshotController controller;
    
    @Autowired
    private ApplicationController applicationController;
    
    @Autowired
    private InitData initData;

    @BeforeAll
    public void beforeAll() {
        initData.init(); // Initialize test database with data
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testCreateHistorySnapshotWithDatabase() {
        // First create an application
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for History",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application and then create history snapshot
        Mono<ResponseView<Boolean>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create history snapshot request
                ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
                    appId,
                    createTestDsl(),
                    createTestContext()
                );
                
                return controller.create(snapshotRequest);
            });

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData());
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testListHistorySnapshotsWithDatabase() {
        // First create an application and snapshot
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for List",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application, snapshot, and then list snapshots
        Mono<ResponseView<Map<String, Object>>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create history snapshot
                ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
                    appId,
                    createTestDsl(),
                    createTestContext()
                );
                
                return controller.create(snapshotRequest)
                    .then(Mono.just(appId));
            })
            .flatMap(appId -> controller.listAllHistorySnapshotBriefInfo(
                appId,
                1,
                10,
                null,
                null,
                null,
                null
            ));

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData().containsKey("list"));
                Assertions.assertTrue(response.getData().containsKey("count"));
                Assertions.assertTrue((Long) response.getData().get("count") >= 1L);
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testGetHistorySnapshotDslWithDatabase() {
        // First create an application and snapshot
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for DSL",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application, snapshot, and then get snapshot DSL
        Mono<ResponseView<HistorySnapshotDslView>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create history snapshot
                ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
                    appId,
                    createTestDsl(),
                    createTestContext()
                );
                
                return controller.create(snapshotRequest)
                    .then(Mono.just(appId));
            })
            .flatMap(appId -> controller.listAllHistorySnapshotBriefInfo(
                appId,
                1,
                10,
                null,
                null,
                null,
                null
            ))
            .flatMap(listResponse -> {
                @SuppressWarnings("unchecked")
                java.util.List<ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotBriefInfo> snapshots = 
                    (java.util.List<ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotBriefInfo>) listResponse.getData().get("list");
                
                if (!snapshots.isEmpty()) {
                    String snapshotId = snapshots.get(0).snapshotId();
                    String appId = snapshots.get(0).userId(); // This is actually the appId in the test context
                    return controller.getHistorySnapshotDsl(appId, snapshotId);
                } else {
                    return Mono.error(new RuntimeException("No snapshots found"));
                }
            });

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertNotNull(response.getData().getApplicationsDsl());
                Assertions.assertNotNull(response.getData().getModuleDSL());
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testListArchivedHistorySnapshotsWithDatabase() {
        // First create an application and snapshot
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for Archived",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application, snapshot, and then list archived snapshots
        Mono<ResponseView<Map<String, Object>>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create history snapshot
                ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
                    appId,
                    createTestDsl(),
                    createTestContext()
                );
                
                return controller.create(snapshotRequest)
                    .then(Mono.just(appId));
            })
            .flatMap(appId -> controller.listAllHistorySnapshotBriefInfoArchived(
                appId,
                1,
                10,
                null,
                null,
                null,
                null
            ));

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData().containsKey("list"));
                Assertions.assertTrue(response.getData().containsKey("count"));
                // Archived snapshots might be empty in test environment
                Assertions.assertNotNull(response.getData().get("count"));
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testCreateMultipleSnapshotsWithDatabase() {
        // First create an application
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for Multiple Snapshots",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application and multiple snapshots
        Mono<ResponseView<Map<String, Object>>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create multiple history snapshots
                ApplicationHistorySnapshotRequest snapshotRequest1 = new ApplicationHistorySnapshotRequest(
                    appId,
                    createTestDsl(),
                    createTestContext("snapshot1")
                );
                
                ApplicationHistorySnapshotRequest snapshotRequest2 = new ApplicationHistorySnapshotRequest(
                    appId,
                    createTestDsl(),
                    createTestContext("snapshot2")
                );
                
                return controller.create(snapshotRequest1)
                    .then(controller.create(snapshotRequest2))
                    .then(Mono.just(appId));
            })
            .flatMap(appId -> controller.listAllHistorySnapshotBriefInfo(
                appId,
                1,
                10,
                null,
                null,
                null,
                null
            ));

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData().containsKey("list"));
                Assertions.assertTrue(response.getData().containsKey("count"));
                Assertions.assertTrue((Long) response.getData().get("count") >= 2L);
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testCreateSnapshotWithEmptyDsl() {
        // First create an application
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for Empty DSL",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application and snapshot with empty DSL
        Mono<ResponseView<Boolean>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create history snapshot with empty DSL
                ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
                    appId,
                    new HashMap<>(),
                    createTestContext()
                );
                
                return controller.create(snapshotRequest);
            });

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData());
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "test-user")
    public void testCreateSnapshotWithComplexDsl() {
        // First create an application
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for Complex DSL",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        // Create application and snapshot with complex DSL
        Mono<ResponseView<Boolean>> result = applicationController.create(createRequest)
            .flatMap(appView -> {
                String appId = appView.getData().getApplicationInfoView().getApplicationId();
                
                // Create complex DSL
                Map<String, Object> complexDsl = createComplexTestDsl();
                
                // Create history snapshot with complex DSL
                ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
                    appId,
                    complexDsl,
                    createTestContext("complex-snapshot")
                );
                
                return controller.create(snapshotRequest);
            });

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData());
            })
            .verifyComplete();
    }

    // Helper methods
    private Map<String, Object> createTestDsl() {
        Map<String, Object> dsl = new HashMap<>();
        Map<String, Object> components = new HashMap<>();
        Map<String, Object> layout = new HashMap<>();
        
        components.put("test-component", new HashMap<>());
        layout.put("type", "grid");
        
        dsl.put("components", components);
        dsl.put("layout", layout);
        
        return dsl;
    }

    private Map<String, Object> createComplexTestDsl() {
        Map<String, Object> dsl = new HashMap<>();
        Map<String, Object> components = new HashMap<>();
        Map<String, Object> layout = new HashMap<>();
        
        // Create complex component structure
        Map<String, Object> component1 = new HashMap<>();
        component1.put("type", "button");
        component1.put("text", "Click me");
        component1.put("style", Map.of("backgroundColor", "#007bff"));
        
        Map<String, Object> component2 = new HashMap<>();
        component2.put("type", "input");
        component2.put("placeholder", "Enter text");
        component2.put("style", Map.of("border", "1px solid #ccc"));
        
        components.put("button-1", component1);
        components.put("input-1", component2);
        
        layout.put("type", "flex");
        layout.put("direction", "column");
        layout.put("items", java.util.List.of("button-1", "input-1"));
        
        dsl.put("components", components);
        dsl.put("layout", layout);
        
        return dsl;
    }

    private Map<String, Object> createTestContext() {
        return createTestContext("test-snapshot");
    }

    private Map<String, Object> createTestContext(String snapshotName) {
        Map<String, Object> context = new HashMap<>();
        context.put("action", "save");
        context.put("timestamp", Instant.now().toEpochMilli());
        context.put("name", snapshotName);
        context.put("description", "Test snapshot created during integration test");
        return context;
    }
} 
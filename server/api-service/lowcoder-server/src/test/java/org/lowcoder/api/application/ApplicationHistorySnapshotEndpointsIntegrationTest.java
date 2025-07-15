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

import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_TOKEN;
import org.lowcoder.api.application.view.ApplicationView;

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
    @WithMockUser(id = "user01")
    public void testCreateHistorySnapshotWithExistingApplication() {
        // Use an existing application from test data instead of creating a new one
        String existingAppId = "app01"; // This exists in the test data
        
        // Create history snapshot request for existing application
        ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
            existingAppId,
            createTestDsl(),
            createTestContext()
        );
        
        System.out.println("Creating history snapshot for existing app: " + existingAppId);
        
        // Create history snapshot
        Mono<ResponseView<Boolean>> result = controller.create(snapshotRequest)
            .doOnNext(response -> {
                System.out.println("History snapshot creation response: " + response);
            })
            .doOnError(error -> {
                System.err.println("History snapshot creation error: " + error.getMessage());
                error.printStackTrace();
            })
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testListHistorySnapshotsWithExistingApplication() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // First create a history snapshot for the existing application
        ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
            existingAppId,
            createTestDsl(),
            createTestContext()
        );
        
        // Create snapshot and then list snapshots
        Mono<ResponseView<Map<String, Object>>> result = controller.create(snapshotRequest)
            .then(controller.listAllHistorySnapshotBriefInfo(
                existingAppId,
                1,
                10,
                null,
                null,
                null,
                null
            ))
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testGetHistorySnapshotDslWithExistingApplication() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // First create a history snapshot for the existing application
        ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
            existingAppId,
            createTestDsl(),
            createTestContext()
        );
        
        // Create snapshot and then get snapshot DSL
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.create(snapshotRequest)
            .then(controller.listAllHistorySnapshotBriefInfo(
                existingAppId,
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
                    return controller.getHistorySnapshotDsl(existingAppId, snapshotId);
                } else {
                    return Mono.error(new RuntimeException("No snapshots found"));
                }
            })
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testListArchivedHistorySnapshotsWithExistingApplication() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // First create a history snapshot for the existing application
        ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
            existingAppId,
            createTestDsl(),
            createTestContext()
        );
        
        // Create snapshot and then list archived snapshots
        Mono<ResponseView<Map<String, Object>>> result = controller.create(snapshotRequest)
            .then(controller.listAllHistorySnapshotBriefInfoArchived(
                existingAppId,
                1,
                10,
                null,
                null,
                null,
                null
            ))
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testListArchivedHistorySnapshotsEmptyList() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // Test the archived endpoint structure - in test environment, there are no archived snapshots
        // so we test that the endpoint responds correctly with an empty list
        Mono<ResponseView<Map<String, Object>>> listResult = controller.listAllHistorySnapshotBriefInfoArchived(
            existingAppId,
            1,
            10,
            null,
            null,
            null,
            null
        )
        .contextWrite(setupTestContext());

        // Verify that the archived list endpoint works correctly
        StepVerifier.create(listResult)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertTrue(response.getData().containsKey("list"));
                Assertions.assertTrue(response.getData().containsKey("count"));
                // In test environment, count should be 0 since no snapshots are archived
                Assertions.assertEquals(0L, response.getData().get("count"));
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    public void testCreateMultipleSnapshotsWithExistingApplication() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // Create multiple history snapshots for the existing application
        ApplicationHistorySnapshotRequest snapshotRequest1 = new ApplicationHistorySnapshotRequest(
            existingAppId,
            createTestDsl(),
            createTestContext("snapshot1")
        );
        
        ApplicationHistorySnapshotRequest snapshotRequest2 = new ApplicationHistorySnapshotRequest(
            existingAppId,
            createTestDsl(),
            createTestContext("snapshot2")
        );
        
        // Create multiple snapshots and then list them
        Mono<ResponseView<Map<String, Object>>> result = controller.create(snapshotRequest1)
            .then(controller.create(snapshotRequest2))
            .then(controller.listAllHistorySnapshotBriefInfo(
                existingAppId,
                1,
                10,
                null,
                null,
                null,
                null
            ))
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testCreateSnapshotWithEmptyDslWithExistingApplication() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // Create history snapshot with empty DSL for the existing application
        ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
            existingAppId,
            new HashMap<>(),
            createTestContext()
        );
        
        // Create snapshot
        Mono<ResponseView<Boolean>> result = controller.create(snapshotRequest)
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testCreateSnapshotWithComplexDslWithExistingApplication() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        
        // Create complex DSL
        Map<String, Object> complexDsl = createComplexTestDsl();
        
        // Create history snapshot with complex DSL for the existing application
        ApplicationHistorySnapshotRequest snapshotRequest = new ApplicationHistorySnapshotRequest(
            existingAppId,
            complexDsl,
            createTestContext("complex-snapshot")
        );
        
        // Create snapshot
        Mono<ResponseView<Boolean>> result = controller.create(snapshotRequest)
            .contextWrite(setupTestContext());

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
    @WithMockUser(id = "user01")
    public void testApplicationCreationWorks() {
        // Test that application creation works independently
        ApplicationEndpoints.CreateApplicationRequest createRequest = new ApplicationEndpoints.CreateApplicationRequest(
            "org01",
            null,
            "Test App for Creation",
            1,
            createTestDsl(),
            null,
            null,
            null
        );

        System.out.println("Creating application with request: " + createRequest);

        Mono<ResponseView<ApplicationView>> result = applicationController.create(createRequest)
            .doOnNext(response -> {
                System.out.println("Application creation response: " + response);
                if (response.isSuccess() && response.getData() != null) {
                    System.out.println("Application created successfully with ID: " + response.getData().getApplicationInfoView().getApplicationId());
                } else {
                    System.out.println("Application creation failed: " + response.getMessage());
                }
            })
            .doOnError(error -> {
                System.err.println("Application creation error: " + error.getMessage());
                error.printStackTrace();
            })
            .contextWrite(setupTestContext());

        // Verify the result
        StepVerifier.create(result)
            .assertNext(response -> {
                Assertions.assertTrue(response.isSuccess());
                Assertions.assertNotNull(response.getData());
                Assertions.assertNotNull(response.getData().getApplicationInfoView());
                Assertions.assertNotNull(response.getData().getApplicationInfoView().getApplicationId());
                System.out.println("Successfully created application with ID: " + response.getData().getApplicationInfoView().getApplicationId());
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    public void testGetHistorySnapshotDslArchivedWithNonExistentSnapshot() {
        // Use an existing application from test data
        String existingAppId = "app01"; // This exists in the test data
        String nonExistentSnapshotId = "non-existent-snapshot-id";
        
        // Test that trying to get a non-existent archived snapshot returns an appropriate error
        Mono<ResponseView<HistorySnapshotDslView>> result = controller.getHistorySnapshotDslArchived(
            existingAppId,
            nonExistentSnapshotId
        )
        .contextWrite(setupTestContext());

        // Verify that the endpoint handles non-existent snapshots appropriately
        StepVerifier.create(result)
            .expectError()
            .verify();
    }

    // Helper method to set up Reactor context for tests
    private reactor.util.context.Context setupTestContext() {
        return reactor.util.context.Context.of(
            VISITOR_TOKEN, "test-token-" + System.currentTimeMillis(),
            "headers", new HashMap<String, String>()
        );
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
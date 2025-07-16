package org.lowcoder.api.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationEndpoints.*;
import org.lowcoder.api.application.view.*;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class ApplicationEndpointsTest {

    private UserHomeApiService userHomeApiService;
    private ApplicationApiService applicationApiService;
    private BusinessEventPublisher businessEventPublisher;
    private GidService gidService;
    private ApplicationRecordService applicationRecordService;
    private ApplicationController controller;

    private static final String TEST_APPLICATION_ID = "test-app-id";
    private static final String TEST_ORGANIZATION_ID = "test-org-id";
    private static final String TEST_TEMPLATE_ID = "template-123";

    @BeforeEach
    void setUp() {
        // Create mocks manually
        userHomeApiService = Mockito.mock(UserHomeApiService.class);
        applicationApiService = Mockito.mock(ApplicationApiService.class);
        businessEventPublisher = Mockito.mock(BusinessEventPublisher.class);
        gidService = Mockito.mock(GidService.class);
        applicationRecordService = Mockito.mock(ApplicationRecordService.class);

        // Setup common mocks
        when(businessEventPublisher.publishApplicationCommonEvent(any(), any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishApplicationCommonEvent(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishApplicationPublishEvent(any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishApplicationVersionChangeEvent(any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishApplicationPermissionEvent(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishApplicationSharingEvent(any(), any(), any())).thenReturn(Mono.empty());
        
        // Mock gidService to return the same ID that was passed to it
        when(gidService.convertApplicationIdToObjectId(any())).thenAnswer(invocation -> {
            String appId = invocation.getArgument(0);
            return Mono.just(appId);
        });
        when(gidService.convertLibraryQueryIdToObjectId(any())).thenAnswer(invocation -> {
            String appId = invocation.getArgument(0);
            return Mono.just(appId);
        });

        // Mock getApplicationPermissions to prevent null pointer exceptions
        ApplicationPermissionView mockPermissionView = Mockito.mock(ApplicationPermissionView.class);
        when(applicationApiService.getApplicationPermissions(any())).thenReturn(Mono.just(mockPermissionView));

        // Mock setApplicationPublicToMarketplace to return a proper Mono
        when(applicationApiService.setApplicationPublicToMarketplace(any(), any())).thenReturn(Mono.just(true));

        // Mock setApplicationAsAgencyProfile to return a proper Mono
        when(applicationApiService.setApplicationAsAgencyProfile(any(), anyBoolean())).thenReturn(Mono.just(true));

        // Mock setApplicationPublicToAll to return a proper Mono
        when(applicationApiService.setApplicationPublicToAll(any(), anyBoolean())).thenReturn(Mono.just(true));

        // Mock getGroupsOrMembersWithoutPermissions to return a proper Mono
        when(applicationApiService.getGroupsOrMembersWithoutPermissions(any())).thenReturn(Mono.just(List.of()));

        // Create controller with all required dependencies
        controller = new ApplicationController(
                userHomeApiService,
                applicationApiService,
                businessEventPublisher,
                gidService,
                applicationRecordService
        );
    }

    @Test
    void testCreateApplication_success() {
        // Prepare request data
        CreateApplicationRequest request = new CreateApplicationRequest(
                TEST_ORGANIZATION_ID,
                null,
                "Test App",
                1,
                new HashMap<>(),
                null,
                null,
                null
        );

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.create(any(CreateApplicationRequest.class)))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.create(request);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationInfoView() != null;
                    assert TEST_APPLICATION_ID.equals(response.getData().getApplicationInfoView().getApplicationId());
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testCreateApplication_withAllFields() {
        // Prepare request data with all fields populated
        HashMap<String, Object> dsl = new HashMap<>();
        dsl.put("components", new HashMap<>());
        dsl.put("layout", new HashMap<>());

        CreateApplicationRequest request = new CreateApplicationRequest(
                TEST_ORGANIZATION_ID,
                "test-gid",
                "Test Application with All Fields",
                1,
                dsl,
                "folder-123",
                true,
                false
        );

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.create(any(CreateApplicationRequest.class)))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.create(request);

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
    void testCreateApplication_serviceError() {
        // Prepare request data
        CreateApplicationRequest request = new CreateApplicationRequest(
                TEST_ORGANIZATION_ID,
                null,
                "Error App",
                1,
                new HashMap<>(),
                null,
                false,
                false
        );

        when(applicationApiService.create(any(CreateApplicationRequest.class)))
                .thenReturn(Mono.error(new RuntimeException("Service error")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.create(request);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testCreateFromTemplate_success() {
        // Mock the service response
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.createFromTemplate(TEST_TEMPLATE_ID))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.createFromTemplate(TEST_TEMPLATE_ID);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationInfoView() != null;
                    assert TEST_APPLICATION_ID.equals(response.getData().getApplicationInfoView().getApplicationId());
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testCreateFromTemplate_withDifferentTemplateId() {
        // Test with a different template ID
        String differentTemplateId = "template-456";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.createFromTemplate(differentTemplateId))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.createFromTemplate(differentTemplateId);

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
    void testCreateFromTemplate_serviceError() {
        // Mock service error
        when(applicationApiService.createFromTemplate(TEST_TEMPLATE_ID))
                .thenReturn(Mono.error(new RuntimeException("Template not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.createFromTemplate(TEST_TEMPLATE_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testCreateFromTemplate_withEmptyTemplateId() {
        // Test with empty template ID
        String emptyTemplateId = "";

        when(applicationApiService.createFromTemplate(emptyTemplateId))
                .thenReturn(Mono.error(new IllegalArgumentException("Template ID cannot be empty")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.createFromTemplate(emptyTemplateId);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    void testCreateFromTemplate_withNullTemplateId() {
        // Test with null template ID
        when(applicationApiService.createFromTemplate(null))
                .thenReturn(Mono.error(new IllegalArgumentException("Template ID cannot be null")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.createFromTemplate(null);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    void testRecycle_success() {
        // Mock the service responses
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.recycle(TEST_APPLICATION_ID))
                .thenReturn(Mono.just(true));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.recycle(TEST_APPLICATION_ID);

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
    void testRecycle_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-456";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(differentAppId, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.recycle(differentAppId))
                .thenReturn(Mono.just(true));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.recycle(differentAppId);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testRecycle_serviceError() {
        // Mock service error
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.recycle(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testRecycle_recycleServiceError() {
        // Mock successful get but failed recycle
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.recycle(TEST_APPLICATION_ID))
                .thenReturn(Mono.error(new RuntimeException("Recycle operation failed")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.recycle(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testRestore_success() {
        // Mock the service responses
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.restore(TEST_APPLICATION_ID))
                .thenReturn(Mono.just(true));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.restore(TEST_APPLICATION_ID);

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
    void testRestore_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-789";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(differentAppId, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.restore(differentAppId))
                .thenReturn(Mono.just(true));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.restore(differentAppId);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testRestore_serviceError() {
        // Mock service error
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.restore(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testRestore_restoreServiceError() {
        // Mock successful get but failed restore
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.restore(TEST_APPLICATION_ID))
                .thenReturn(Mono.error(new RuntimeException("Restore operation failed")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.restore(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testRecycle_withEmptyApplicationId() {
        // Test with empty application ID
        String emptyAppId = "";

        when(applicationApiService.getEditingApplication(emptyAppId, true))
                .thenReturn(Mono.error(new RuntimeException("Application ID cannot be empty")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.recycle(emptyAppId);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testRestore_withEmptyApplicationId() {
        // Test with empty application ID
        String emptyAppId = "";

        when(applicationApiService.getEditingApplication(emptyAppId, true))
                .thenReturn(Mono.error(new RuntimeException("Application ID cannot be empty")));

        // Test the controller method directly
        Mono<ResponseView<Boolean>> result = controller.restore(emptyAppId);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetRecycledApplications_success() {
        // Mock the service response
        List<ApplicationInfoView> mockRecycledApps = List.of(
                createMockApplicationInfoView(),
                createMockApplicationInfoView()
        );
        when(applicationApiService.getRecycledApplications(null, null))
                .thenReturn(Flux.fromIterable(mockRecycledApps));

        // Test the controller method directly
        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getRecycledApplications(null, null);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().size() == 2;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetRecycledApplications_withNameFilter() {
        // Mock the service response with name filter
        String nameFilter = "test-app";
        List<ApplicationInfoView> mockRecycledApps = List.of(createMockApplicationInfoView());
        when(applicationApiService.getRecycledApplications(nameFilter, null))
                .thenReturn(Flux.fromIterable(mockRecycledApps));

        // Test the controller method directly
        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getRecycledApplications(nameFilter, null);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().size() == 1;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetRecycledApplications_withCategoryFilter() {
        // Mock the service response with category filter
        String categoryFilter = "business";
        List<ApplicationInfoView> mockRecycledApps = List.of(createMockApplicationInfoView());
        when(applicationApiService.getRecycledApplications(null, categoryFilter))
                .thenReturn(Flux.fromIterable(mockRecycledApps));

        // Test the controller method directly
        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getRecycledApplications(null, categoryFilter);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().size() == 1;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetRecycledApplications_withNameAndCategoryFilter() {
        // Mock the service response with both filters
        String nameFilter = "test-app";
        String categoryFilter = "business";
        List<ApplicationInfoView> mockRecycledApps = List.of(createMockApplicationInfoView());
        when(applicationApiService.getRecycledApplications(nameFilter, categoryFilter))
                .thenReturn(Flux.fromIterable(mockRecycledApps));

        // Test the controller method directly
        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getRecycledApplications(nameFilter, categoryFilter);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().size() == 1;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetRecycledApplications_emptyResult() {
        // Mock empty service response
        when(applicationApiService.getRecycledApplications(null, null))
                .thenReturn(Flux.empty());

        // Test the controller method directly
        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getRecycledApplications(null, null);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().isEmpty();
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetRecycledApplications_serviceError() {
        // Mock service error
        when(applicationApiService.getRecycledApplications(null, null))
                .thenReturn(Flux.error(new RuntimeException("Database error")));

        // Test the controller method directly
        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getRecycledApplications(null, null);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testDelete_success() {
        // Mock the service responses
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.delete(TEST_APPLICATION_ID))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.delete(TEST_APPLICATION_ID);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationInfoView() != null;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testDelete_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-999";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(differentAppId, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.delete(differentAppId))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.delete(differentAppId);

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
    void testDelete_serviceError() {
        // Mock service error
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.delete(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testDelete_deleteServiceError() {
        // Mock successful get but failed delete
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.delete(TEST_APPLICATION_ID))
                .thenReturn(Mono.error(new RuntimeException("Delete operation failed")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.delete(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testDelete_withEmptyApplicationId() {
        // Test with empty application ID
        String emptyAppId = "";

        when(applicationApiService.getEditingApplication(emptyAppId, true))
                .thenReturn(Mono.error(new RuntimeException("Application ID cannot be empty")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.delete(emptyAppId);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetEditingApplication_success() {
        // Mock the service response
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getEditingApplication(TEST_APPLICATION_ID, false);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationInfoView() != null;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetEditingApplication_withDeleted() {
        // Mock the service response with withDeleted=true
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getEditingApplication(TEST_APPLICATION_ID, true);

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
    void testGetEditingApplication_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-123";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getEditingApplication(differentAppId, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(differentAppId))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getEditingApplication(differentAppId, false);

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
    void testGetEditingApplication_serviceError() {
        // Mock service error
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, false))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getEditingApplication(TEST_APPLICATION_ID, false);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetEditingApplication_withEmptyApplicationId() {
        // Test with empty application ID
        String emptyAppId = "";

        when(applicationApiService.getEditingApplication(emptyAppId, false))
                .thenReturn(Mono.error(new RuntimeException("Application ID cannot be empty")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getEditingApplication(emptyAppId, false);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetPublishedApplication_success() {
        // Mock the service responses
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.PUBLIC_TO_ALL, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedApplication(TEST_APPLICATION_ID, false);

        // Verify the result
        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() != null;
                    assert response.getData().getApplicationInfoView() != null;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetPublishedApplication_withDeleted() {
        // Mock the service responses with withDeleted=true
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.PUBLIC_TO_ALL, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedApplication(TEST_APPLICATION_ID, true);

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
    void testGetPublishedApplication_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-456";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(differentAppId, ApplicationRequestType.PUBLIC_TO_ALL, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(differentAppId))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedApplication(differentAppId, false);

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
    void testGetPublishedApplication_serviceError() {
        // Mock service error
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.PUBLIC_TO_ALL, false))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedApplication(TEST_APPLICATION_ID, false);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetPublishedApplication_withEmptyApplicationId() {
        // Test with empty application ID
        String emptyAppId = "";

        when(applicationApiService.getPublishedApplication(emptyAppId, ApplicationRequestType.PUBLIC_TO_ALL, false))
                .thenReturn(Mono.error(new RuntimeException("Application ID cannot be empty")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedApplication(emptyAppId, false);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetPublishedMarketPlaceApplication_success() {
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.PUBLIC_TO_MARKETPLACE, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());

        Mono<ResponseView<ApplicationView>> result = controller.getPublishedMarketPlaceApplication(TEST_APPLICATION_ID);

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
    void testGetPublishedMarketPlaceApplication_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-789";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(differentAppId, ApplicationRequestType.PUBLIC_TO_MARKETPLACE, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(differentAppId))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedMarketPlaceApplication(differentAppId);

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
    void testGetPublishedMarketPlaceApplication_serviceError() {
        // Mock service error
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.PUBLIC_TO_MARKETPLACE, false))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getPublishedMarketPlaceApplication(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testGetAgencyProfileApplication_success() {
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.AGENCY_PROFILE, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());

        Mono<ResponseView<ApplicationView>> result = controller.getAgencyProfileApplication(TEST_APPLICATION_ID);

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
    void testGetAgencyProfileApplication_withDifferentApplicationId() {
        // Test with a different application ID
        String differentAppId = "app-999";

        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationApiService.getPublishedApplication(differentAppId, ApplicationRequestType.AGENCY_PROFILE, false))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.updateUserApplicationLastViewTime(differentAppId))
                .thenReturn(Mono.empty());

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getAgencyProfileApplication(differentAppId);

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
    void testGetAgencyProfileApplication_serviceError() {
        // Mock service error
        when(applicationApiService.getPublishedApplication(TEST_APPLICATION_ID, ApplicationRequestType.AGENCY_PROFILE, false))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.getAgencyProfileApplication(TEST_APPLICATION_ID);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testUpdate_success() {
        ApplicationView mockApplicationView = createMockApplicationView();
        Application mockApplication = createMockApplication();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.update(TEST_APPLICATION_ID, mockApplication, null))
                .thenReturn(Mono.just(mockApplicationView));

        Mono<ResponseView<ApplicationView>> result = controller.update(TEST_APPLICATION_ID, mockApplication, null);

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
    void testUpdate_withUpdateStatus() {
        // Mock the service responses with updateStatus=true
        ApplicationView mockApplicationView = createMockApplicationView();
        Application mockApplication = createMockApplication();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.update(TEST_APPLICATION_ID, mockApplication, true))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.update(TEST_APPLICATION_ID, mockApplication, true);

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
    void testUpdate_serviceError() {
        // Mock service error
        Application mockApplication = createMockApplication();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.error(new RuntimeException("Application not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.update(TEST_APPLICATION_ID, mockApplication, null);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testUpdate_updateServiceError() {
        // Mock successful get but failed update
        ApplicationView mockApplicationView = createMockApplicationView();
        Application mockApplication = createMockApplication();
        when(applicationApiService.getEditingApplication(TEST_APPLICATION_ID, true))
                .thenReturn(Mono.just(mockApplicationView));
        when(applicationApiService.update(TEST_APPLICATION_ID, mockApplication, null))
                .thenReturn(Mono.error(new RuntimeException("Update operation failed")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.update(TEST_APPLICATION_ID, mockApplication, null);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testPublish_success() {
        ApplicationView mockApplicationView = createMockApplicationView();
        when(applicationRecordService.getLatestRecordByApplicationId(any()))
                .thenReturn(Mono.empty());
        when(applicationApiService.publish(any(), any(ApplicationPublishRequest.class)))
                .thenReturn(Mono.just(mockApplicationView));

        Mono<ResponseView<ApplicationView>> result = controller.publish(TEST_APPLICATION_ID, null);

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
    void testPublish_withPublishRequest() {
        // Mock the service responses with publish request
        ApplicationView mockApplicationView = createMockApplicationView();
        ApplicationPublishRequest publishRequest = new ApplicationPublishRequest("test-tag", "1.0.0");
        when(applicationRecordService.getLatestRecordByApplicationId(TEST_APPLICATION_ID))
                .thenReturn(Mono.empty());
        when(applicationApiService.publish(TEST_APPLICATION_ID, publishRequest))
                .thenReturn(Mono.just(mockApplicationView));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.publish(TEST_APPLICATION_ID, publishRequest);

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
    void testPublish_serviceError() {
        // Mock service error
        when(applicationRecordService.getLatestRecordByApplicationId(TEST_APPLICATION_ID))
                .thenReturn(Mono.error(new RuntimeException("Application record not found")));

        // Test the controller method directly
        Mono<ResponseView<ApplicationView>> result = controller.publish(TEST_APPLICATION_ID, null);

        // Verify the error is propagated
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testUpdateEditState_success() {
        UpdateEditStateRequest updateRequest = new UpdateEditStateRequest(true);
        when(applicationApiService.updateEditState(TEST_APPLICATION_ID, updateRequest))
                .thenReturn(Mono.just(true));

        Mono<ResponseView<Boolean>> result = controller.updateEditState(TEST_APPLICATION_ID, updateRequest);

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testUpdateSlug_success() {
        String newSlug = "new-app-slug";
        Application mockApplication = createMockApplication();
        when(applicationApiService.updateSlug(TEST_APPLICATION_ID, newSlug))
                .thenReturn(Mono.just(mockApplication));

        Mono<ResponseView<Application>> result = controller.updateSlug(TEST_APPLICATION_ID, newSlug);

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
    void testGetUserHomePage_success() {
        UserHomepageView mockHomepageView = Mockito.mock(UserHomepageView.class);
        when(userHomeApiService.getUserHomePageView(any()))
                .thenReturn(Mono.just(mockHomepageView));

        Mono<ResponseView<UserHomepageView>> result = controller.getUserHomePage(0);

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
    void testGetApplications_success() {
        List<ApplicationInfoView> mockApps = List.of(createMockApplicationInfoView());
        when(userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(any(), any(), anyBoolean(), any(), any()))
                .thenReturn(Flux.fromIterable(mockApps));

        Mono<ResponseView<List<ApplicationInfoView>>> result = controller.getApplications(null, null, true, null, null, 1, 10);

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
    void testGetMarketplaceApplications_success() {
        List<MarketplaceApplicationInfoView> mockApps = List.of(Mockito.mock(MarketplaceApplicationInfoView.class));
        when(userHomeApiService.getAllMarketplaceApplications(any()))
                .thenReturn(Flux.fromIterable(mockApps));

        Mono<ResponseView<List<MarketplaceApplicationInfoView>>> result = controller.getMarketplaceApplications(null);

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
    void testGetAgencyProfileApplications_success() {
        List<MarketplaceApplicationInfoView> mockApps = List.of(Mockito.mock(MarketplaceApplicationInfoView.class));
        when(userHomeApiService.getAllAgencyProfileApplications(any()))
                .thenReturn(Flux.fromIterable(mockApps));

        Mono<ResponseView<List<MarketplaceApplicationInfoView>>> result = controller.getAgencyProfileApplications(null);

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
    void testUpdatePermission_success() {
        UpdatePermissionRequest updateRequest = new UpdatePermissionRequest("editor");
        when(applicationApiService.updatePermission(eq(TEST_APPLICATION_ID), eq("permission-123"), any()))
                .thenReturn(Mono.just(true));

        Mono<ResponseView<Boolean>> result = controller.updatePermission(TEST_APPLICATION_ID, "permission-123", updateRequest);

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testRemovePermission_success() {
        when(applicationApiService.removePermission(TEST_APPLICATION_ID, "permission-123"))
                .thenReturn(Mono.just(true));

        Mono<ResponseView<Boolean>> result = controller.removePermission(TEST_APPLICATION_ID, "permission-123");

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGrantPermission_success() {
        BatchAddPermissionRequest grantRequest = new BatchAddPermissionRequest("editor", Set.of("user1"), Set.of("group1"));
        when(applicationApiService.grantPermission(TEST_APPLICATION_ID, Set.of("user1"), Set.of("group1"), ResourceRole.EDITOR))
                .thenReturn(Mono.just(true));

        Mono<ResponseView<Boolean>> result = controller.grantPermission(TEST_APPLICATION_ID, grantRequest);

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testGetApplicationPermissions_success() {
        Mono<ResponseView<ApplicationPermissionView>> result = controller.getApplicationPermissions(TEST_APPLICATION_ID);

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
    void testGetGroupsOrMembersWithoutPermissions_success() {
        Mono<ResponseView<List<Object>>> result = controller.getGroupsOrMembersWithoutPermissions(TEST_APPLICATION_ID, null, 1, 1000);

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
    void testSetApplicationPublicToAll_success() {
        ApplicationPublicToAllRequest request = new ApplicationPublicToAllRequest(true);

        Mono<ResponseView<Boolean>> result = controller.setApplicationPublicToAll(TEST_APPLICATION_ID, request);

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testSetApplicationPublicToMarketplace_success() {
        ApplicationPublicToMarketplaceRequest request = new ApplicationPublicToMarketplaceRequest(true);

        Mono<ResponseView<Boolean>> result = controller.setApplicationPublicToMarketplace(TEST_APPLICATION_ID, request);

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    @Test
    void testSetApplicationAsAgencyProfile_success() {
        ApplicationAsAgencyProfileRequest request = new ApplicationAsAgencyProfileRequest(true);

        Mono<ResponseView<Boolean>> result = controller.setApplicationAsAgencyProfile(TEST_APPLICATION_ID, request);

        StepVerifier.create(result)
                .expectNextMatches(response -> {
                    assert response != null;
                    assert response.isSuccess();
                    assert response.getData() == true;
                    return true;
                })
                .verifyComplete();
    }

    // Helper methods to create mock objects
    private ApplicationView createMockApplicationView() {
        ApplicationView view = Mockito.mock(ApplicationView.class);
        ApplicationInfoView infoView = createMockApplicationInfoView();
        when(view.getApplicationInfoView()).thenReturn(infoView);
        return view;
    }

    private ApplicationInfoView createMockApplicationInfoView() {
        ApplicationInfoView view = Mockito.mock(ApplicationInfoView.class);
        when(view.getApplicationId()).thenReturn(TEST_APPLICATION_ID);
        when(view.getName()).thenReturn("Test Application");
        when(view.getApplicationType()).thenReturn(1); // ApplicationType.APPLICATION.getValue()
        when(view.getApplicationStatus()).thenReturn(ApplicationStatus.NORMAL);
        return view;
    }

    private Application createMockApplication() {
        Application application = Mockito.mock(Application.class);
        when(application.getId()).thenReturn(TEST_APPLICATION_ID);
        when(application.getName()).thenReturn("Test Application");
        when(application.getApplicationType()).thenReturn(1); // ApplicationType.APPLICATION.getValue()
        when(application.getApplicationStatus()).thenReturn(ApplicationStatus.NORMAL);
        return application;
    }
}

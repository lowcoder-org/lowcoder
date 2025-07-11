package org.lowcoder.api.application;


import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.solutions.TemplateSolutionService;

import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Set;
@SpringBootTest
//@RunWith(SpringRunner.class)
@ActiveProfiles("ApplicationApiServiceTest")
@Slf4j(topic = "ApplicationApiServiceTest")

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ApplicationApiServiceTest {

    @Autowired
    private ApplicationApiService applicationApiService;
    @Autowired
    private FolderApiService folderApiService;
    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private DatasourceApiService datasourceApiService;
    @Autowired
    private InitData initData = new InitData();
    @Autowired
    private TemplateSolutionService templateSolutionService;

    @BeforeAll
    public void beforeAll() {
        initData.init();
    }

    @Test
    @WithMockUser
    public void testCreateApplication() {
        CreateApplicationRequest request = new CreateApplicationRequest(
            "org01",
            null,
            "test-app",
            ApplicationType.APPLICATION.getValue(),
            Map.of("comp", "list"),
            null,
            null,
            null
        );

        Mono<ApplicationView> result = applicationApiService.create(request);

        StepVerifier.create(result)
            .assertNext(applicationView -> {
                Assertions.assertNotNull(applicationView);
                Assertions.assertEquals("test-app", applicationView.getApplicationInfoView().getName());
            })
            .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetRecycledApplications() {
        String appName = "recycled-app";
        Mono<String> recycledAppIdMono = createApplication(appName, null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.recycle(appId))
            .cache();

        String normalAppName = "normal-app";
        createApplication(normalAppName, null).block();

        StepVerifier.create(
            recycledAppIdMono.thenMany(applicationApiService.getRecycledApplications(null, null).collectList())
        )
        .assertNext(apps -> {
            Assertions.assertTrue(
                apps.stream().anyMatch(app -> appName.equals(app.getName()) && app.getApplicationStatus() == ApplicationStatus.RECYCLED),
                "Expected recycled application not found"
            );
            // Optionally, assert that normal-app is not in the recycled list
            Assertions.assertTrue(
                apps.stream().noneMatch(app -> normalAppName.equals(app.getName())),
                "Normal app should not be in recycled list"
            );
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testDeleteApplication() {
        // Step 1: Create application
        Mono<String> appIdMono = createApplication("delete-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            // Step 2: Recycle the application
            .delayUntil(appId -> applicationApiService.recycle(appId))
            .cache();

        // Step 3: Delete the application and verify
        StepVerifier.create(
            appIdMono
                .delayUntil(appId -> applicationApiService.delete(appId))
                .flatMap(appId -> applicationService.findById(appId))
        )
        .assertNext(app -> Assertions.assertEquals(ApplicationStatus.DELETED, app.getApplicationStatus()))
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testRecycleApplication() {
        Mono<String> appIdMono = createApplication("recycle-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        StepVerifier.create(
            appIdMono
                .delayUntil(appId -> applicationApiService.recycle(appId))
                .flatMap(appId -> applicationService.findById(appId))
        )
        .assertNext(app -> Assertions.assertEquals(ApplicationStatus.RECYCLED, app.getApplicationStatus()))
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testRestoreApplication() {
        // Create application and recycle it
        Mono<String> appIdMono = createApplication("restore-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.recycle(appId))
            .cache();

        // Restore the application and verify status
        StepVerifier.create(
            appIdMono
                .delayUntil(appId -> applicationApiService.restore(appId))
                .flatMap(appId -> applicationService.findById(appId))
        )
        .assertNext(app -> Assertions.assertNotEquals(ApplicationStatus.RECYCLED, app.getApplicationStatus()))
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetEditingApplication() {
        // Create a new application
        Mono<String> appIdMono = createApplication("editing-app-test", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        // Retrieve the editing application and verify its properties
        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.getEditingApplication(appId, false))
        )
        .assertNext(applicationView -> {
            Assertions.assertNotNull(applicationView);
            Assertions.assertEquals("editing-app-test", applicationView.getApplicationInfoView().getName());
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetPublishedApplication() {
        // Create a new application
        Mono<String> appIdMono = createApplication("published-app-test", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        // Publish the application
        Mono<String> publishedAppIdMono = appIdMono
            .delayUntil(appId -> applicationApiService.publish(appId, new ApplicationPublishRequest("Initial Publish", "1.0.0")))
            .cache();

        // Retrieve the published application and verify its properties
        StepVerifier.create(
            publishedAppIdMono.flatMap(appId ->
                applicationApiService.getPublishedApplication(appId, ApplicationRequestType.PUBLIC_TO_ALL, false)
            )
        )
        .assertNext(applicationView -> {
            Assertions.assertNotNull(applicationView);
            Assertions.assertEquals("published-app-test", applicationView.getApplicationInfoView().getName());
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testUpdateUserApplicationLastViewTime() {
        Mono<String> appIdMono = createApplication("last-view-time-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.updateUserApplicationLastViewTime(appId))
        )
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testUpdateApplication() {
        // Create a new application
        Mono<String> appIdMono = createApplication("update-app-test", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        // Update the application's name
        Mono<ApplicationView> updatedAppMono = appIdMono
            .flatMap(appId -> applicationApiService.update(
                appId,
                Application.builder().name("updated-app-name").build(),
                false
            ));

        // Verify the application's name is updated
        StepVerifier.create(updatedAppMono)
            .assertNext(applicationView ->
                Assertions.assertEquals("updated-app-name", applicationView.getApplicationInfoView().getName())
            )
            .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testPublishFunction() {
        // Step 1: Create a new application
        Mono<String> appIdMono = createApplication("publish-app-test", null)
                .map(appView -> appView.getApplicationInfoView().getApplicationId())
                .cache();

        // Step 2: Publish the application
        ApplicationPublishRequest publishRequest = new ApplicationPublishRequest("Initial Publish", "1.0.0");
        Mono<ApplicationView> publishedAppMono = appIdMono
                .delayUntil(appId -> applicationApiService.publish(appId, publishRequest))
                .flatMap(appId -> applicationApiService.getPublishedApplication(appId, ApplicationRequestType.PUBLIC_TO_ALL, false));

        // Step 3: Assert the result
        StepVerifier.create(publishedAppMono)
                .assertNext(applicationView -> {
                    Assertions.assertNotNull(applicationView);
                    Assertions.assertEquals("publish-app-test", applicationView.getApplicationInfoView().getName());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testUpdateEditState() {
        Mono<String> appIdMono = createApplication("edit-state-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        ApplicationEndpoints.UpdateEditStateRequest request =
            new ApplicationEndpoints.UpdateEditStateRequest(true);

        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.updateEditState(appId, request))
        )
        .expectNext(true)
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGrantPermission() {
        // Create a new application
        Mono<String> appIdMono = createApplication("grant-permission-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        // Grant permissions to user and group, then verify
        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.grantPermission(
                appId,
                Set.of("user02"),
                Set.of("group01"),
                ResourceRole.EDITOR
            ).then(applicationApiService.getApplicationPermissions(appId)))
        )
        .assertNext(applicationPermissionView -> {
            Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                .anyMatch(permissionItemView ->
                    permissionItemView.getType() == ResourceHolder.USER &&
                        "user02".equals(permissionItemView.getId()) &&
                        ResourceRole.EDITOR.getValue().equals(permissionItemView.getRole())
                ));
            Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                .anyMatch(permissionItemView ->
                    permissionItemView.getType() == ResourceHolder.GROUP &&
                        "group01".equals(permissionItemView.getId()) &&
                        ResourceRole.EDITOR.getValue().equals(permissionItemView.getRole())
                ));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testUpdatePermission() {
        // Create a new application and grant EDITOR permission to user02
        Mono<String> appIdMono = createApplication("update-permission-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.grantPermission(
                    appId, Set.of("user02"), Set.of(), ResourceRole.EDITOR))
            .cache();

        // Update the permission role for user02 to VIEWER and verify
        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.getApplicationPermissions(appId)
                .map(applicationPermissionView -> applicationPermissionView.getPermissions().stream()
                    .filter(p -> p.getType() == ResourceHolder.USER && "user02".equals(p.getId()))
                    .findFirst()
                    .orElseThrow())
                .flatMap(permissionItemView -> applicationApiService.updatePermission(
                    appId, permissionItemView.getPermissionId(), ResourceRole.VIEWER))
                .then(applicationApiService.getApplicationPermissions(appId)))
        )
        .assertNext(applicationPermissionView -> {
            Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                .anyMatch(p -> p.getType() == ResourceHolder.USER
                    && "user02".equals(p.getId())
                    && ResourceRole.VIEWER.getValue().equals(p.getRole())));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testRemovePermission() {
        // Create a new application and grant EDITOR permission to user02
        Mono<String> appIdMono = createApplication("remove-permission-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.grantPermission(
                    appId, Set.of("user02"), Set.of(), ResourceRole.EDITOR))
            .cache();

        // Remove the permission for user02 and verify
        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.getApplicationPermissions(appId)
                .map(applicationPermissionView -> applicationPermissionView.getPermissions().stream()
                    .filter(p -> p.getType() == ResourceHolder.USER && "user02".equals(p.getId()))
                    .findFirst()
                    .orElseThrow())
                .flatMap(permissionItemView -> applicationApiService.removePermission(
                    appId, permissionItemView.getPermissionId()))
                .then(applicationApiService.getApplicationPermissions(appId)))
        )
        .assertNext(applicationPermissionView -> {
            Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                .noneMatch(p -> p.getType() == ResourceHolder.USER && "user02".equals(p.getId())));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetApplicationPermissions() {
        // Create a new application and grant permissions to user and group
        Mono<String> appIdMono = createApplication("get-permissions-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.grantPermission(
                    appId, Set.of("user02"), Set.of("group01"), ResourceRole.EDITOR))
            .cache();

        // Retrieve and verify permissions
        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.getApplicationPermissions(appId))
        )
        .assertNext(applicationPermissionView -> {
            Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                .anyMatch(p -> p.getType() == ResourceHolder.USER
                    && "user02".equals(p.getId())
                    && ResourceRole.EDITOR.getValue().equals(p.getRole())));
            Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                .anyMatch(p -> p.getType() == ResourceHolder.GROUP
                    && "group01".equals(p.getId())
                    && ResourceRole.EDITOR.getValue().equals(p.getRole())));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testCreateFromTemplate() {
        String templateId = "test-template-id";
        Mono<ApplicationView> result = applicationApiService.createFromTemplate(templateId);

        StepVerifier.create(result)
            .expectErrorMatches(throwable ->
                throwable instanceof BizException &&
                    throwable.getMessage().contains("template does not exist")
            )
            .verify();
    }

    @Test
    @WithMockUser
    public void testCheckPermissionWithReadableErrorMsg() {
        // Create a new application and grant EDITOR permission to user02
        Mono<String> appIdMono = createApplication("check-permission-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.grantPermission(
                    appId, Set.of("user02"), Set.of(), ResourceRole.EDITOR))
            .cache();

        // Check permission for an EDIT_APPLICATIONS action
        StepVerifier.create(
            appIdMono.flatMap(appId ->
                applicationApiService.checkPermissionWithReadableErrorMsg(appId, ResourceAction.EDIT_APPLICATIONS)
            )
        )
        .assertNext(resourcePermission -> {
            Assertions.assertNotNull(resourcePermission);
            Assertions.assertTrue(resourcePermission.getResourceRole().canDo(ResourceAction.EDIT_APPLICATIONS));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testCheckApplicationPermissionWithReadableErrorMsg() {
        // Create a new application and grant EDITOR permission to user02
        Mono<String> appIdMono = createApplication("check-app-permission-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .delayUntil(appId -> applicationApiService.grantPermission(
                    appId, Set.of("user02"), Set.of(), ResourceRole.EDITOR))
            .cache();

        // Check permission for an EDIT_APPLICATIONS action with PUBLIC_TO_ALL request type
        StepVerifier.create(
            appIdMono.flatMap(appId ->
                applicationApiService.checkApplicationPermissionWithReadableErrorMsg(
                    appId, ResourceAction.EDIT_APPLICATIONS, ApplicationRequestType.PUBLIC_TO_ALL)
            )
        )
        .assertNext(resourcePermission -> {
            Assertions.assertNotNull(resourcePermission);
            Assertions.assertTrue(resourcePermission.getResourceRole().canDo(ResourceAction.EDIT_APPLICATIONS));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testSetApplicationPublicToAll() {
        Mono<String> appIdMono = createApplication("public-to-all-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.setApplicationPublicToAll(appId, true))
        )
            .expectNext(true)
            .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testSetApplicationPublicToMarketplace() {
        Mono<String> appIdMono = createApplication("public-to-marketplace-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        ApplicationEndpoints.ApplicationPublicToMarketplaceRequest request =
            new ApplicationEndpoints.ApplicationPublicToMarketplaceRequest(true);

        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.setApplicationPublicToMarketplace(appId, request))
        )
        .expectNext(true)
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testSetApplicationAsAgencyProfile() {
        Mono<String> appIdMono = createApplication("agency-profile-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        StepVerifier.create(
            appIdMono.flatMap(appId -> applicationApiService.setApplicationAsAgencyProfile(appId, true))
        )
        .expectNext(true)
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testUpdateSlug() {
        String uniqueAppName = "SlugTestApp-" + System.currentTimeMillis();
        String uniqueSlug = "new-slug-" + System.currentTimeMillis();

        createApplication(uniqueAppName, null)
            .map(applicationView -> applicationView.getApplicationInfoView().getApplicationId())
            .flatMap(applicationId -> applicationApiService.updateSlug(applicationId, uniqueSlug))
            .as(StepVerifier::create)
            .expectComplete() // Expect no value, just completion
            .verify();
    }

    @Test
    @WithMockUser
    public void testGetGroupsOrMembersWithoutPermissions() {
        // Create a new application
        Mono<String> appIdMono = createApplication("no-permission-test-app", null)
            .map(appView -> appView.getApplicationInfoView().getApplicationId())
            .cache();

        // Grant permission to user02 and group01
        Mono<List<Object>> resultMono = appIdMono
            .delayUntil(appId -> applicationApiService.grantPermission(
                    appId, Set.of("user02"), Set.of("group01"), ResourceRole.EDITOR))
            .flatMap(appId -> applicationApiService.getGroupsOrMembersWithoutPermissions(appId));

        StepVerifier.create(resultMono)
        .assertNext(list -> {
            // Should contain users/groups except user02 and group01
            Assertions.assertTrue(list.stream().noneMatch(obj -> obj.toString().contains("user02")));
            Assertions.assertTrue(list.stream().noneMatch(obj -> obj.toString().contains("group01")));
        })
        .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testAutoInheritFoldersPermissionsOnAppCreate() {
        Mono<ApplicationPermissionView> permissionViewMono =
                folderApiService.grantPermission("folder01", Set.of("user02"), Set.of("group01"), ResourceRole.EDITOR)
                        .then(createApplication("test", "folder01"))
                        .flatMap(applicationView -> applicationApiService.getApplicationPermissions(
                                applicationView.getApplicationInfoView().getApplicationId()));

        StepVerifier.create(permissionViewMono)
                .assertNext(applicationPermissionView -> {
                    Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                            .anyMatch(permissionItemView ->
                                    equals(permissionItemView, PermissionItemView.builder()
                                            .type(ResourceHolder.GROUP)
                                            .id("group01")
                                            .role(ResourceRole.EDITOR.getValue())
                                            .build())
                            ));
                    Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                            .anyMatch(permissionItemView ->
                                    equals(permissionItemView, PermissionItemView.builder()
                                            .type(ResourceHolder.USER)
                                            .id("user01")
                                            .role(ResourceRole.OWNER.getValue())
                                            .build())
                            ));
                    Assertions.assertTrue(applicationPermissionView.getPermissions().stream()
                            .anyMatch(permissionItemView ->
                                    equals(permissionItemView, PermissionItemView.builder()
                                            .type(ResourceHolder.USER)
                                            .id("user02")
                                            .role(ResourceRole.EDITOR.getValue())
                                            .build())
                            ));
                })
                .verifyComplete();
    }

    private boolean equals(PermissionItemView p1, PermissionItemView p2) {
        return p1.getType() == p2.getType()
                && p1.getId().equals(p2.getId())
                && p1.getRole().equals(p2.getRole());
    }

    @Test
    @WithMockUser
    public void testRecycleAndDeleteApplicationSuccess() {

        Mono<Application> applicationMono = createApplication("app02", null)
                .map(applicationView -> applicationView.getApplicationInfoView().getApplicationId())
                .delayUntil(applicationId -> applicationApiService.recycle(applicationId))
                .delayUntil(applicationId -> applicationApiService.delete(applicationId))
                .flatMap(applicationId -> applicationService.findById(applicationId));
        StepVerifier.create(applicationMono)
                .assertNext(application -> Assertions.assertSame(application.getApplicationStatus(), ApplicationStatus.DELETED))
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testDeleteNormalApplicationWithError() {

        StepVerifier.create(applicationApiService.delete("app02"))
                .expectErrorMatches(throwable -> throwable instanceof BizException bizException
                        && bizException.getError() == BizError.UNSUPPORTED_OPERATION)
                .verify();
    }

    private Mono<ApplicationView> createApplication(String name, String folderId) {
        CreateApplicationRequest createApplicationRequest =
                new CreateApplicationRequest("org01", null, name, ApplicationType.APPLICATION.getValue(),
                        Map.of("comp", "list"), folderId, null, null);
        return applicationApiService.create(createApplicationRequest);
    }

    @Test
    @WithMockUser
    public void testPublishApplication() {
        Mono<String> applicationIdMono = createApplication("test", null)
                .map(applicationView -> applicationView.getApplicationInfoView().getApplicationId())
                .cache();

        // edit dsl before publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl before publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // publish
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.publish(id, new ApplicationPublishRequest("Test Publish", "1.0.0"))).cache();

        // edit dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // update
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.update(id, Application.builder().editingApplicationDSL(Map.of("comp", "table")).build(), false)).cache();

        // edit dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "table"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // publish 2
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.publish(id, new ApplicationPublishRequest("Test Publish 2", "2.0.0"))).cache();

        // edit dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "table"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL, false)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "table"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // publish 3
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.publish(id, new ApplicationPublishRequest("Same tag", "2.0.0"))).cache();

        // Error
        StepVerifier.create(applicationIdMono)
                .verifyError();
    }

    @Test
    @WithMockUser
    public void testPermissions() {
        // test grant permissions.
        Mono<ApplicationPermissionView> applicationPermissionViewMono =
                applicationApiService.grantPermission("app01", Set.of("user02"), Set.of("group01"), ResourceRole.EDITOR)
                        .then(applicationApiService.getApplicationPermissions("app01"));
        StepVerifier.create(applicationPermissionViewMono)
                .assertNext(applicationPermissionView -> {
                    List<PermissionItemView> permissions = applicationPermissionView.getPermissions();
                    Assertions.assertEquals(2, permissions.size());
                    Assertions.assertTrue(permissions.stream()
                            .anyMatch(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.USER)
                                        .id("user02")
                                        .role(ResourceRole.EDITOR.getValue())
                                        .build();
                                return equals(permissionItemView, other);
                            }));
                    Assertions.assertTrue(permissions.stream()
                            .anyMatch(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.GROUP)
                                        .id("group01")
                                        .role(ResourceRole.EDITOR.getValue())
                                        .build();
                                return equals(permissionItemView, other);
                            }));
                })
                .verifyComplete();

        // test update permissions.
        applicationPermissionViewMono = applicationApiService.getApplicationPermissions("app01")
                .flatMap(applicationPermissionView -> {
                    List<PermissionItemView> permissionItemViews = applicationPermissionView.getPermissions()
                            .stream()
                            .filter(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.USER)
                                        .id("user02")
                                        .role(ResourceRole.EDITOR.getValue())
                                        .build();
                                return equals(permissionItemView, other);
                            })
                            .toList();
                    Assertions.assertEquals(1, permissionItemViews.size());
                    String permissionId = permissionItemViews.get(0).getPermissionId();
                    return applicationApiService.updatePermission("app01", permissionId, ResourceRole.VIEWER);
                })
                .then(applicationApiService.getApplicationPermissions("app01"));
        StepVerifier.create(applicationPermissionViewMono)
                .assertNext(applicationPermissionView -> {
                    List<PermissionItemView> permissions = applicationPermissionView.getPermissions();
                    Assertions.assertEquals(2, permissions.size());
                    Assertions.assertTrue(permissions.stream()
                            .anyMatch(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.USER)
                                        .id("user02")
                                        .role(ResourceRole.VIEWER.getValue())// updated
                                        .build();
                                return equals(permissionItemView, other);
                            }));
                    Assertions.assertTrue(permissions.stream()
                            .anyMatch(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.GROUP)
                                        .id("group01")
                                        .role(ResourceRole.EDITOR.getValue())
                                        .build();
                                return equals(permissionItemView, other);
                            }));
                })
                .verifyComplete();

        // test remove permissions.
        applicationPermissionViewMono = applicationApiService.getApplicationPermissions("app01")
                .flatMap(applicationPermissionView -> {
                    List<PermissionItemView> permissionItemViews = applicationPermissionView.getPermissions()
                            .stream()
                            .filter(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.USER)
                                        .id("user02")
                                        .role(ResourceRole.VIEWER.getValue())
                                        .build();
                                return equals(permissionItemView, other);
                            })
                            .toList();
                    Assertions.assertEquals(1, permissionItemViews.size());
                    String permissionId = permissionItemViews.get(0).getPermissionId();
                    return applicationApiService.removePermission("app01", permissionId);
                })
                .then(applicationApiService.getApplicationPermissions("app01"));

        StepVerifier.create(applicationPermissionViewMono)
                .assertNext(applicationPermissionView -> {
                    List<PermissionItemView> permissions = applicationPermissionView.getPermissions();
                    Assertions.assertEquals(1, permissions.size());
                    Assertions.assertTrue(permissions.stream()
                            .anyMatch(permissionItemView -> {
                                PermissionItemView other = PermissionItemView.builder()
                                        .type(ResourceHolder.GROUP)
                                        .id("group01")
                                        .role(ResourceRole.EDITOR.getValue())
                                        .build();
                                return equals(permissionItemView, other);
                            }));
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testAppCreateAndRetrievalByGID() {

        Mono<Application> applicationMono = createApplication("test", null)
                .map(applicationView -> applicationView.getApplicationInfoView().getApplicationGid())
                .delayUntil(applicationGid -> applicationApiService.recycle(applicationGid))
                .delayUntil(applicationGid -> applicationApiService.delete(applicationGid))
                .flatMap(applicationGid -> applicationService.findById(applicationGid));
        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    Assertions.assertSame(application.getApplicationStatus(), ApplicationStatus.DELETED);
                    Assertions.assertNotNull(application.getGid());
                    Assertions.assertTrue(FieldName.isGID(application.getGid()));
                })
                .verifyComplete();
    }
}
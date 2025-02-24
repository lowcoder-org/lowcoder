package org.lowcoder.api.application;


import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
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
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourceRole;
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
    private InitData initData;

    @BeforeAll
    public void beforeAll() {
        initData.init();
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
                new CreateApplicationRequest("org01", name, ApplicationType.APPLICATION.getValue(),
                        Map.of("comp", "list"), folderId);
        return applicationApiService.create(createApplicationRequest);
    }

    @Test
    @WithMockUser
    public void testPublishApplication() {
        Mono<String> applicationIdMono = createApplication("test", null)
                .map(applicationView -> applicationView.getApplicationInfoView().getApplicationId())
                .cache();

        // edit dsl before publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl before publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // publish
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.publish(id, new ApplicationPublishRequest("Test Publish", "1.0.0"))).cache();

        // edit dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // update
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.update(id, Application.builder().editingApplicationDSL(Map.of("comp", "table")).build())).cache();

        // edit dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "table"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "list"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // publish 2
        applicationIdMono = applicationIdMono
                .delayUntil(id -> applicationApiService.publish(id, new ApplicationPublishRequest("Test Publish 2", "2.0.0"))).cache();

        // edit dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getEditingApplication(id)))
                .assertNext(applicationView -> Assertions.assertEquals(Map.of("comp", "table"), applicationView.getApplicationDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(applicationIdMono.flatMap(id -> applicationApiService.getPublishedApplication(id, ApplicationRequestType.PUBLIC_TO_ALL)))
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

    @Test
    @WithMockUser
    public void testUpdateSlug() {
        // Create a dummy application
        Mono<String> applicationMono = createApplication("SlugTestApp", null)
                .map(applicationView -> applicationView.getApplicationInfoView().getApplicationId());

        // Assume updateSlug is performed by passing applicationId and the new slug
        Mono<Application> updatedApplicationMono = applicationMono
                .flatMap(applicationId -> applicationApiService.updateSlug(applicationId, "new-slug-value"));

        // Verify the application updates with the new slug
        StepVerifier.create(updatedApplicationMono)
                .assertNext(application -> {
                    Assertions.assertNotNull(application.getSlug(), "Slug should not be null");
                    Assertions.assertEquals("new-slug-value", application.getSlug(), "Slug should be updated to 'new-slug-value'");
                })
                .verifyComplete();
    }
}
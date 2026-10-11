package org.lowcoder.api.bundle;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
//@RunWith(SpringRunner.class)
@ActiveProfiles("BundleApiServiceImplTest")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class BundleApiServiceImplTest {
    @Autowired
    BundleApiServiceImpl bundleApiService;
    @Autowired
    private FolderApiService folderApiService;
    @Autowired
    private BundleService bundleService;
    @Autowired
    private InitData initData;

    @BeforeAll
    public void beforeAll() {
        initData.init();
    }

    @Test
    @WithMockUser
    public void createBundleTestAdminUser() {
        //When org admin user creates bundle it succeed
        Mono<BundleInfoView> bundleInfoViewMono = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name1",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono)
                .assertNext(bundleInfoView -> {
                    assertNotNull(bundleInfoView.getBundleId());
                    assertEquals("name1", bundleInfoView.getName());
                    assertEquals("title", bundleInfoView.getTitle());
                    assertEquals("description", bundleInfoView.getDescription());
                    assertEquals("category", bundleInfoView.getCategory());
                    assertEquals("image", bundleInfoView.getImage());
                    assertFalse(bundleInfoView.getPublicToAll());
                    assertFalse(bundleInfoView.getPublicToMarketplace());
                    assertFalse(bundleInfoView.getAgencyProfile());
                    assertNull(bundleInfoView.getFolderId());
                    assertNotNull(bundleInfoView.getBundleGid());
                    assertTrue(FieldName.isGID(bundleInfoView.getBundleGid()));
                })
                .verifyComplete();
    }
    @Test
    @WithMockUser(id="user02")
    public void createBundleTestDevUser() {
        //When org dev user creates bundle it succeed
        Mono<BundleInfoView> bundleInfoViewMono1 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name2",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono1)
                .assertNext(bundleInfoView -> {
                    assertNotNull(bundleInfoView.getBundleId());
                    assertEquals("name2", bundleInfoView.getName());
                    assertEquals("title", bundleInfoView.getTitle());
                    assertEquals("description", bundleInfoView.getDescription());
                    assertEquals("category", bundleInfoView.getCategory());
                    assertEquals("image", bundleInfoView.getImage());
                    assertFalse(bundleInfoView.getPublicToAll());
                    assertFalse(bundleInfoView.getPublicToMarketplace());
                    assertFalse(bundleInfoView.getAgencyProfile());
                    assertNull(bundleInfoView.getFolderId());
                    assertNotNull(bundleInfoView.getBundleGid());
                    assertTrue(FieldName.isGID(bundleInfoView.getBundleGid()));
                })
                .verifyComplete();
    }
    @Test
    @WithMockUser(id="user03")
    public void createBundleTestNonDevUser() {
        //When non-dev create bundle throws error
        Mono<BundleInfoView> bundleInfoViewMono2 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name3",
                "title",
                "description",
                "category",
                "image",
                null));
        StepVerifier.create(bundleInfoViewMono2)
                .expectError()
                .verify();
    }

    @Test
    @WithMockUser
    public void moveAddAppTestAdmin() {
        //Create bundles
        Mono<BundleInfoView> bundleInfoViewMono = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name4",
                "title",
                "description",
                "category",
                "image",
                null));

        Mono<BundleInfoView> bundleInfoViewMono2 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name5",
                "title",
                "description",
                "category",
                "image",
                null));

        Mono<Void> testMono = Mono.zip(bundleInfoViewMono, bundleInfoViewMono2)
                .flatMap(tuple2 -> {
                    var bundleInfoView = tuple2.getT1();
                    var bundleInfoView2 = tuple2.getT2();

                    return bundleApiService.addApp("app01", bundleInfoView.getBundleId())
                            .then(bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()))
                            //Get published bundle
                            .then(bundleApiService.getPublishedBundle(bundleInfoView2.getBundleId(), BundleRequestType.PUBLIC_TO_ALL))
                            .doOnNext(bundle -> {
                                //should have no published dsl since not yet published
                                assertNotNull(bundle.getBundleId());
                                assertNull(bundle.getPublishedBundleDSL());
                            })
                            .then();
                });

        StepVerifier.create(testMono)
                .verifyComplete();
    }

    @Test
    @WithMockUser(id="user02")
    public void moveAddAppTestNonDev() {
        //Create bundles
        Mono<BundleInfoView> bundleInfoViewMono = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name4",
                "title",
                "description",
                "category",
                "image",
                null));

        Mono<BundleInfoView> bundleInfoViewMono2 = bundleApiService.create(new BundleEndpoints.CreateBundleRequest(
                "org01",
                "",
                "name5",
                "title",
                "description",
                "category",
                "image",
                null));

        Flux<?> testFlux = Flux.zip(bundleInfoViewMono, bundleInfoViewMono2)
                .flatMap(tuple2 -> {
                    var bundleInfoView = tuple2.getT1();
                    var bundleInfoView2 = tuple2.getT2();

                    return Flux.concat(bundleApiService.addApp("app01", bundleInfoView.getBundleId()),
                            bundleApiService.moveApp("app01", bundleInfoView.getBundleId(), bundleInfoView2.getBundleId()));
                });

        StepVerifier.create(testFlux)
                .expectError()
                .verify();

        StepVerifier.create(testFlux)
                .expectError()
                .verify();
    }

    private Mono<BundleInfoView> createBundle(String name, String folderId) {
        BundleEndpoints.CreateBundleRequest createBundleRequest =
                new BundleEndpoints.CreateBundleRequest("org01", "" ,name, "title", "desc", "category", "image", folderId);
        return bundleApiService.create(createBundleRequest);
    }

    @Test
    @WithMockUser
    public void testPublishBundle() {
        Mono<String> bundleIdMono = createBundle("test", null)
                .map(BundleInfoView::getBundleId)
                .delayUntil(id ->bundleApiService.addApp("app01", id))
                .cache();

        // edit dsl before publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getEditingBundle(id)))
                .assertNext(bundleView -> Assertions.assertNotNull(bundleView.getEditingBundleDSL()))
                .verifyComplete();

        // published dsl before publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getPublishedBundle(id, BundleRequestType.PUBLIC_TO_ALL)))
                .assertNext(bundleView -> Assertions.assertNull(bundleView.getPublishedBundleDSL()))
                .verifyComplete();

        // publish
        bundleIdMono = bundleIdMono
                .delayUntil(id -> bundleApiService.publish(id));

        // edit dsl after publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getEditingBundle(id)))
                .assertNext(bundleView -> Assertions.assertNotNull(bundleView.getEditingBundleDSL()))
                .verifyComplete();

        // published dsl after publish
        StepVerifier.create(bundleIdMono.flatMap(id -> bundleApiService.getPublishedBundle(id, BundleRequestType.PUBLIC_TO_ALL)))
                .assertNext(bundleView -> Assertions.assertNotNull(bundleView.getPublishedBundleDSL()))
                .verifyComplete();
    }

    private boolean equals(PermissionItemView p1, PermissionItemView p2) {
        return p1.getType() == p2.getType()
                && p1.getId().equals(p2.getId())
                && p1.getRole().equals(p2.getRole());
    }

    @Test
    @WithMockUser
    public void testAutoInheritFoldersPermissionsOnBundleCreate() {
        Mono<BundlePermissionView> permissionViewMono =
                folderApiService.grantPermission("folder01", Set.of("user02"), Set.of("group01"), ResourceRole.EDITOR)
                        .then(createBundle("test2", "folder01"))
                        .flatMap(bundleView -> bundleApiService.getBundlePermissions(
                                bundleView.getBundleId()));

        StepVerifier.create(permissionViewMono)
                .assertNext(bundlePermissionView -> {
                    Assertions.assertTrue(bundlePermissionView.getPermissions().stream()
                            .anyMatch(permissionItemView ->
                                    equals(permissionItemView, PermissionItemView.builder()
                                            .type(ResourceHolder.GROUP)
                                            .id("group01")
                                            .role(ResourceRole.EDITOR.getValue())
                                            .build())
                            ));
                    Assertions.assertTrue(bundlePermissionView.getPermissions().stream()
                            .anyMatch(permissionItemView ->
                                    equals(permissionItemView, PermissionItemView.builder()
                                            .type(ResourceHolder.USER)
                                            .id("user01")
                                            .role(ResourceRole.OWNER.getValue())
                                            .build())
                            ));
                    Assertions.assertTrue(bundlePermissionView.getPermissions().stream()
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

    @Test
    @WithMockUser
    public void testRecycleAndDeleteBundleSuccess() {

        Mono<Bundle> bundleMono = createBundle("bundle02", null)
                .map(BundleInfoView::getBundleId)
                .delayUntil(bundleId -> bundleApiService.recycle(bundleId))
                .delayUntil(bundleId -> bundleApiService.delete(bundleId))
                .flatMap(bundleId -> bundleService.findById(bundleId));
        StepVerifier.create(bundleMono)
                .assertNext(bundle -> Assertions.assertSame(bundle.getBundleStatus(), BundleStatus.DELETED))
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testDeleteNormalBundleWithError() {

        StepVerifier.create(bundleApiService.delete("bundle02"))
                .expectErrorMatches(throwable -> throwable instanceof BizException bizException
                        && bizException.getError() == BizError.UNSUPPORTED_OPERATION)
                .verify();
    }

    @Test
    @WithMockUser
    public void testPermissions() {
        // test grant permissions.
        Mono<BundlePermissionView> bundlePermissionViewMono =
                bundleApiService.grantPermission("bundle01", Set.of("user02"), Set.of("group01"), ResourceRole.EDITOR)
                        .then(bundleApiService.getBundlePermissions("bundle01"));
        StepVerifier.create(bundlePermissionViewMono)
                .assertNext(bundlePermissionView -> {
                    List<PermissionItemView> permissions = bundlePermissionView.getPermissions();
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
        bundlePermissionViewMono = bundleApiService.getBundlePermissions("bundle01")
                .flatMap(bundlePermissionView -> {
                    List<PermissionItemView> permissionItemViews = bundlePermissionView.getPermissions()
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
                    return bundleApiService.updatePermission("bundle01", permissionId, ResourceRole.VIEWER);
                })
                .then(bundleApiService.getBundlePermissions("bundle01"));
        StepVerifier.create(bundlePermissionViewMono)
                .assertNext(bundlePermissionView -> {
                    List<PermissionItemView> permissions = bundlePermissionView.getPermissions();
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
        bundlePermissionViewMono = bundleApiService.getBundlePermissions("bundle01")
                .flatMap(bundlePermissionView -> {
                    List<PermissionItemView> permissionItemViews = bundlePermissionView.getPermissions()
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
                    return bundleApiService.removePermission("bundle01", permissionId);
                })
                .then(bundleApiService.getBundlePermissions("bundle01"));

        StepVerifier.create(bundlePermissionViewMono)
                .assertNext(bundlePermissionView -> {
                    List<PermissionItemView> permissions = bundlePermissionView.getPermissions();
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
}

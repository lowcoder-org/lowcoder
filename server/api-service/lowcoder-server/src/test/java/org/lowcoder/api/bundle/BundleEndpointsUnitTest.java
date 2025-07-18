package org.lowcoder.api.bundle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("unchecked")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class BundleEndpointsUnitTest {

    @Mock
    private BundleService bundleService;
    
    @Mock
    private BundleApiService bundleApiService;
    
    @Mock
    private BusinessEventPublisher businessEventPublisher;
    
    @Mock
    private UserHomeApiService userHomeApiService;
    
    @Mock
    private GidService gidService;

    private BundleController bundleController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        bundleController = new BundleController(
                bundleService, 
                bundleApiService, 
                businessEventPublisher, 
                userHomeApiService, 
                gidService
        );
        
        // Default mock behaviors
        when(businessEventPublisher.publishBundleCommonEvent(any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishBundleCommonEvent(anyString(), any(), any(), any())).thenReturn(Mono.empty());
        when(gidService.convertBundleIdToObjectId(anyString())).thenReturn(Mono.just("objectId"));
        when(gidService.convertApplicationIdToObjectId(anyString())).thenReturn(Mono.just("appObjectId"));
    }

    @Test
    void testCreateBundle_Success() {
        // Given
        BundleEndpoints.CreateBundleRequest request = new BundleEndpoints.CreateBundleRequest(
                "org01", "", "test-bundle", "Test Bundle", "Description", "category", "image", null
        );
        
        BundleInfoView expectedView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("test-bundle")
                .title("Test Bundle")
                .description("Description")
                .category("category")
                .image("image")
                .build();
        
        when(bundleApiService.create(any(BundleEndpoints.CreateBundleRequest.class)))
                .thenReturn(Mono.just(expectedView));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.create(request);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(expectedView, response.getData());
                })
                .verifyComplete();
        
        verify(bundleApiService).create(eq(request));
        verify(businessEventPublisher).publishBundleCommonEvent(eq(expectedView), any());
    }

    @Test
    void testCreateBundle_Error() {
        // Given
        BundleEndpoints.CreateBundleRequest request = new BundleEndpoints.CreateBundleRequest(
                "org01", "", "test-bundle", "Test Bundle", "Description", "category", "image", null
        );
        
        when(bundleApiService.create(any(BundleEndpoints.CreateBundleRequest.class)))
                .thenReturn(Mono.error(new BizException(BizError.INVALID_PARAMETER, "Invalid request")));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.create(request);

        // Then
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    void testDeleteBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        Bundle deletedBundle = Bundle.builder()
                .id("objectId")
                .gid(bundleId)
                .name("test-bundle")
                .title("Test Bundle")
                .description("Test Description")
                .category("test-category")
                .image("test-image")
                .editingBundleDSL(Map.of())
                .publishedBundleDSL(Map.of())
                .publicToMarketplace(false)
                .publicToAll(false)
                .agencyProfile(false)
                .createdAt(Instant.now())
                .createdBy("test-user")
                .build();
        
        when(bundleApiService.delete(anyString()))
                .thenReturn(Mono.just(deletedBundle));

        // When
        Mono<ResponseView<Void>> result = bundleController.delete(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).delete(eq("objectId"));
        verify(businessEventPublisher).publishBundleCommonEvent(any(BundleInfoView.class), any());
    }

    @Test
    void testUpdateBundle_Success() {
        // Given
        Bundle bundle = Bundle.builder()
                .id("bundle-123")
                .name("updated-bundle")
                .title("Updated Bundle")
                .build();
        
        Bundle existingBundle = Bundle.builder()
                .id("bundle-123")
                .name("old-bundle")
                .build();
        
        BundleInfoView updatedView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("updated-bundle")
                .build();
        
        when(bundleService.findById(anyString()))
                .thenReturn(Mono.just(existingBundle));
        when(bundleApiService.update(any(Bundle.class)))
                .thenReturn(Mono.just(updatedView));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.update(bundle);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(updatedView, response.getData());
                })
                .verifyComplete();
        
        verify(bundleService).findById(eq("bundle-123"));
        verify(bundleApiService).update(eq(bundle));
        verify(businessEventPublisher).publishBundleCommonEvent(eq(updatedView), any());
    }

    @Test
    void testPublishBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleInfoView publishedView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("published-bundle")
                .build();
        
        when(bundleApiService.publish(anyString()))
                .thenReturn(Mono.just(publishedView));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.publish(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(publishedView, response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).publish(eq("objectId"));
    }

    @Test
    void testRecycleBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        when(bundleApiService.recycle(anyString()))
                .thenReturn(Mono.just(true));

        // When
        Mono<ResponseView<Boolean>> result = bundleController.recycle(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).recycle(eq("objectId"));
        verify(businessEventPublisher).publishBundleCommonEvent(eq(bundleId), eq(null), eq(null), any());
    }

    @Test
    void testRestoreBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        when(bundleApiService.restore(anyString()))
                .thenReturn(Mono.just(true));

        // When
        Mono<ResponseView<Boolean>> result = bundleController.restore(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).restore(eq("objectId"));
        verify(businessEventPublisher).publishBundleCommonEvent(eq(bundleId), eq(null), eq(null), any());
    }

    @Test
    void testGetRecycledBundles_Success() {
        // Given
        List<BundleInfoView> recycledBundles = List.of(
                BundleInfoView.builder().bundleId("bundle-1").name("recycled-1").build(),
                BundleInfoView.builder().bundleId("bundle-2").name("recycled-2").build()
        );
        
        when(bundleApiService.getRecycledBundles())
                .thenReturn(Flux.fromIterable(recycledBundles));

        // When
        Mono<ResponseView<List<BundleInfoView>>> result = bundleController.getRecycledBundles();

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(recycledBundles, response.getData());
                })
                .verifyComplete();
        
        verify(bundleApiService).getRecycledBundles();
    }

    @Test
    void testGetElements_Success() {
        // Given
        String bundleId = "bundle-123";
        ApplicationType applicationType = ApplicationType.APPLICATION;
        Integer pageNum = 1;
        Integer pageSize = 10;
        
        when(bundleApiService.getElements(anyString(), any(ApplicationType.class)))
                .thenReturn(Flux.empty());

        // When
        Mono<PageResponseView<?>> result = bundleController.getElements(bundleId, applicationType, pageNum, pageSize);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).getElements(eq("objectId"), eq(applicationType));
    }

    @Test
    void testMoveApp_Success() {
        // Given
        String applicationId = "app-123";
        String fromBundleId = "bundle-1";
        String toBundleId = "bundle-2";
        
        when(bundleApiService.moveApp(anyString(), anyString(), anyString()))
                .thenReturn(Mono.empty());

        // When
        Mono<ResponseView<Void>> result = bundleController.moveApp(applicationId, fromBundleId, toBundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(fromBundleId));
        verify(gidService).convertBundleIdToObjectId(eq(toBundleId));
        verify(gidService).convertApplicationIdToObjectId(eq(applicationId));
        verify(bundleApiService).moveApp(eq("appObjectId"), eq("objectId"), eq("objectId"));
        verify(businessEventPublisher).publishBundleCommonEvent(eq(applicationId), eq(fromBundleId), eq(toBundleId), any());
    }

    @Test
    void testAddApp_Success() {
        // Given
        String applicationId = "app-123";
        String toBundleId = "bundle-1";
        
        when(bundleApiService.addApp(anyString(), anyString()))
                .thenReturn(Mono.empty());

        // When
        Mono<ResponseView<Void>> result = bundleController.addApp(applicationId, toBundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(toBundleId));
        verify(gidService).convertApplicationIdToObjectId(eq(applicationId));
        verify(bundleApiService).addApp(eq("appObjectId"), eq("objectId"));
    }

    @Test
    void testReorder_Success() {
        // Given
        String bundleId = "bundle-123";
        List<String> elementIds = List.of("element1", "element2", "element3");
        
        when(bundleApiService.reorder(anyString(), anyList()))
                .thenReturn(Mono.empty());

        // When
        Mono<ResponseView<Void>> result = bundleController.reorder(bundleId, elementIds);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).reorder(eq("objectId"), eq(elementIds));
    }

    @Test
    void testUpdatePermission_Success() {
        // Given
        String bundleId = "bundle-123";
        String permissionId = "perm-123";
        BundleEndpoints.UpdatePermissionRequest request = new BundleEndpoints.UpdatePermissionRequest("owner");
        
        when(bundleApiService.updatePermission(anyString(), anyString(), any(ResourceRole.class)))
                .thenReturn(Mono.empty());

        // When
        Mono<ResponseView<Void>> result = bundleController.updatePermission(bundleId, permissionId, request);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).updatePermission(eq("objectId"), eq(permissionId), eq(ResourceRole.OWNER));
    }

    @Test
    void testUpdatePermission_InvalidRole() {
        // Given
        String bundleId = "bundle-123";
        String permissionId = "perm-123";
        BundleEndpoints.UpdatePermissionRequest request = new BundleEndpoints.UpdatePermissionRequest("INVALID_ROLE");

        // When
        Mono<ResponseView<Void>> result = bundleController.updatePermission(bundleId, permissionId, request);

        // Then
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
        
        verify(gidService, never()).convertBundleIdToObjectId(anyString());
        verify(bundleApiService, never()).updatePermission(anyString(), anyString(), any());
    }

    @Test
    void testRemovePermission_Success() {
        // Given
        String bundleId = "bundle-123";
        String permissionId = "perm-123";
        
        when(bundleApiService.removePermission(anyString(), anyString()))
                .thenReturn(Mono.empty());

        // When
        Mono<ResponseView<Void>> result = bundleController.removePermission(bundleId, permissionId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).removePermission(eq("objectId"), eq(permissionId));
    }

    @Test
    void testGrantPermission_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleEndpoints.BatchAddPermissionRequest request = new BundleEndpoints.BatchAddPermissionRequest(
                "editor", 
                Set.of("user1", "user2"), 
                Set.of("group1")
        );
        
        when(bundleApiService.grantPermission(anyString(), anySet(), anySet(), any(ResourceRole.class)))
                .thenReturn(Mono.empty());

        // When
        Mono<ResponseView<Void>> result = bundleController.grantPermission(bundleId, request);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).grantPermission(eq("objectId"), eq(request.userIds()), eq(request.groupIds()), eq(ResourceRole.EDITOR));
    }

    @Test
    void testGrantPermission_InvalidRole() {
        // Given
        String bundleId = "bundle-123";
        BundleEndpoints.BatchAddPermissionRequest request = new BundleEndpoints.BatchAddPermissionRequest(
                "INVALID_ROLE", 
                Set.of("user1"), 
                Set.of()
        );

        // When
        Mono<ResponseView<Void>> result = bundleController.grantPermission(bundleId, request);

        // Then
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
        
        verify(gidService, never()).convertBundleIdToObjectId(anyString());
        verify(bundleApiService, never()).grantPermission(anyString(), anySet(), anySet(), any());
    }

    @Test
    void testGetBundlePermissions_Success() {
        // Given
        String bundleId = "bundle-123";
        BundlePermissionView permissionView = BundlePermissionView.builder()
                .groupPermissions(List.of())
                .userPermissions(List.of())
                .build();
        
        when(bundleApiService.getPermissions(anyString()))
                .thenReturn(Mono.just(permissionView));

        // When
        Mono<ResponseView<BundlePermissionView>> result = bundleController.getBundlePermissions(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(permissionView, response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).getPermissions(eq("objectId"));
    }

    @Test
    void testGetPublishedBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleInfoView publishedView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("published-bundle")
                .build();
        
        when(bundleApiService.getPublishedBundle(anyString(), any()))
                .thenReturn(Mono.just(publishedView));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.getPublishedBundle(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(publishedView, response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).getPublishedBundle(eq("objectId"), any());
    }

    @Test
    void testGetPublishedMarketPlaceBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleInfoView marketplaceView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("marketplace-bundle")
                .build();
        
        when(bundleApiService.getPublishedBundle(anyString(), any()))
                .thenReturn(Mono.just(marketplaceView));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.getPublishedMarketPlaceBundle(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(marketplaceView, response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).getPublishedBundle(eq("objectId"), any());
    }

    @Test
    void testGetAgencyProfileBundle_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleInfoView agencyView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("agency-bundle")
                .build();
        
        when(bundleApiService.getPublishedBundle(anyString(), any()))
                .thenReturn(Mono.just(agencyView));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.getAgencyProfileBundle(bundleId);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(agencyView, response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).getPublishedBundle(eq("objectId"), any());
    }

    @Test
    void testGetBundles_Success() {
        // Given
        BundleStatus bundleStatus = BundleStatus.NORMAL;
        List<BundleInfoView> bundles = List.of(
                BundleInfoView.builder().bundleId("bundle-1").name("bundle1").build(),
                BundleInfoView.builder().bundleId("bundle-2").name("bundle2").build()
        );
        
        when(userHomeApiService.getAllAuthorisedBundles4CurrentOrgMember(any(BundleStatus.class)))
                .thenReturn(Flux.fromIterable(bundles));

        // When
        Mono<ResponseView<List<BundleInfoView>>> result = bundleController.getBundles(bundleStatus);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(bundles, response.getData());
                })
                .verifyComplete();
        
        verify(userHomeApiService).getAllAuthorisedBundles4CurrentOrgMember(bundleStatus);
    }

    @Test
    void testGetMarketplaceBundles_Success() {
        // Given
        List<MarketplaceBundleInfoView> marketplaceBundles = List.of(
                MarketplaceBundleInfoView.builder()
                        .bundleId("bundle-1")
                        .name("bundle1")
                        .title("title1")
                        .description("desc1")
                        .category("cat1")
                        .image("img1")
                        .orgId("org1")
                        .orgName("org1")
                        .creatorEmail("creator1@test.com")
                        .bundleGid("gid1")
                        .createAt(Instant.now().toEpochMilli())
                        .createBy("user1")
                        .bundleStatus(BundleStatus.NORMAL)
                        .build(),
                MarketplaceBundleInfoView.builder()
                        .bundleId("bundle-2")
                        .name("bundle2")
                        .title("title2")
                        .description("desc2")
                        .category("cat2")
                        .image("img2")
                        .orgId("org2")
                        .orgName("org2")
                        .creatorEmail("creator2@test.com")
                        .bundleGid("gid2")
                        .createAt(Instant.now().toEpochMilli())
                        .createBy("user2")
                        .bundleStatus(BundleStatus.NORMAL)
                        .build()
        );
        
        when(userHomeApiService.getAllMarketplaceBundles())
                .thenReturn(Flux.fromIterable(marketplaceBundles));

        // When
        Mono<ResponseView<List<MarketplaceBundleInfoView>>> result = bundleController.getMarketplaceBundles();

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(marketplaceBundles, response.getData());
                })
                .verifyComplete();
        
        verify(userHomeApiService).getAllMarketplaceBundles();
    }

    @Test
    void testGetAgencyProfileBundles_Success() {
        // Given
        List<MarketplaceBundleInfoView> agencyBundles = List.of(
                MarketplaceBundleInfoView.builder()
                        .bundleId("bundle-1")
                        .name("agency1")
                        .title("title1")
                        .description("desc1")
                        .category("cat1")
                        .image("img1")
                        .orgId("org1")
                        .orgName("org1")
                        .creatorEmail("creator1@test.com")
                        .bundleGid("gid1")
                        .createAt(Instant.now().toEpochMilli())
                        .createBy("user1")
                        .bundleStatus(BundleStatus.NORMAL)
                        .build(),
                MarketplaceBundleInfoView.builder()
                        .bundleId("bundle-2")
                        .name("agency2")
                        .title("title2")
                        .description("desc2")
                        .category("cat2")
                        .image("img2")
                        .orgId("org2")
                        .orgName("org2")
                        .creatorEmail("creator2@test.com")
                        .bundleGid("gid2")
                        .createAt(Instant.now().toEpochMilli())
                        .createBy("user2")
                        .bundleStatus(BundleStatus.NORMAL)
                        .build()
        );
        
        when(userHomeApiService.getAllAgencyProfileBundles())
                .thenReturn(Flux.fromIterable(agencyBundles));

        // When
        Mono<ResponseView<List<MarketplaceBundleInfoView>>> result = bundleController.getAgencyProfileBundles();

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(agencyBundles, response.getData());
                })
                .verifyComplete();
        
        verify(userHomeApiService).getAllAgencyProfileBundles();
    }

    @Test
    void testSetBundlePublicToAll_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleEndpoints.BundlePublicToAllRequest request = new BundleEndpoints.BundlePublicToAllRequest(true);
        
        when(bundleApiService.setBundlePublicToAll(anyString(), anyBoolean()))
                .thenReturn(Mono.just(true));

        // When
        Mono<ResponseView<Boolean>> result = bundleController.setBundlePublicToAll(bundleId, request);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).setBundlePublicToAll(eq("objectId"), eq(true));
    }

    @Test
    void testSetBundlePublicToMarketplace_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleEndpoints.BundlePublicToMarketplaceRequest request = new BundleEndpoints.BundlePublicToMarketplaceRequest(true);
        
        when(bundleApiService.setBundlePublicToMarketplace(anyString(), any(BundleEndpoints.BundlePublicToMarketplaceRequest.class)))
                .thenReturn(Mono.just(true));

        // When
        Mono<ResponseView<Boolean>> result = bundleController.setBundlePublicToMarketplace(bundleId, request);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).setBundlePublicToMarketplace(eq("objectId"), eq(request));
    }

    @Test
    void testSetBundleAsAgencyProfile_Success() {
        // Given
        String bundleId = "bundle-123";
        BundleEndpoints.BundleAsAgencyProfileRequest request = new BundleEndpoints.BundleAsAgencyProfileRequest(true);
        
        when(bundleApiService.setBundleAsAgencyProfile(anyString(), anyBoolean()))
                .thenReturn(Mono.just(true));

        // When
        Mono<ResponseView<Boolean>> result = bundleController.setBundleAsAgencyProfile(bundleId, request);

        // Then
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService).setBundleAsAgencyProfile(eq("objectId"), eq(true));
    }

    @Test
    void testGidServiceError_PropagatesException() {
        // Given
        String bundleId = "invalid-bundle-id";
        when(gidService.convertBundleIdToObjectId(anyString()))
                .thenReturn(Mono.error(new BizException(BizError.INVALID_PARAMETER, "Invalid bundle ID")));

        // When
        Mono<ResponseView<Void>> result = bundleController.delete(bundleId);

        // Then
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
        
        verify(gidService).convertBundleIdToObjectId(eq(bundleId));
        verify(bundleApiService, never()).delete(anyString());
    }

    @Test
    void testBusinessEventPublisherError_DoesNotAffectMainFlow() {
        // Given
        BundleEndpoints.CreateBundleRequest request = new BundleEndpoints.CreateBundleRequest(
                "org01", "", "test-bundle", "Test Bundle", "Description", "category", "image", null
        );
        
        BundleInfoView expectedView = BundleInfoView.builder()
                .bundleId("bundle-123")
                .name("test-bundle")
                .build();
        
        when(bundleApiService.create(any(BundleEndpoints.CreateBundleRequest.class)))
                .thenReturn(Mono.just(expectedView));
        when(businessEventPublisher.publishBundleCommonEvent(any(), any()))
                .thenReturn(Mono.error(new RuntimeException("Event publishing failed")));

        // When
        Mono<ResponseView<BundleInfoView>> result = bundleController.create(request);

        // Then
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
        
        verify(bundleApiService).create(eq(request));
        verify(businessEventPublisher).publishBundleCommonEvent(eq(expectedView), any());
    }
} 
package org.lowcoder.api.datasource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.datasource.service.DatasourceStructureService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.core.publisher.Flux;
import java.util.ArrayList;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import org.lowcoder.api.datasource.DatasourceView;

class DatasourceEndpointsTest {

    private DatasourceStructureService datasourceStructureService;
    private DatasourceApiService datasourceApiService;
    private UpsertDatasourceRequestMapper upsertDatasourceRequestMapper;
    private BusinessEventPublisher businessEventPublisher;
    private DatasourceService datasourceService;
    private GidService gidService;
    private ResourcePermissionService resourcePermissionService;
    private DatasourceController controller;

    private static final String TEST_DATASOURCE_ID = "test-datasource-id";
    private static final String TEST_ORGANIZATION_ID = "test-org-id";
    private static final String TEST_PERMISSION_ID = "test-permission-id";

    @BeforeEach
    void setUp() {
        // Create mocks manually
        datasourceStructureService = Mockito.mock(DatasourceStructureService.class);
        datasourceApiService = Mockito.mock(DatasourceApiService.class);
        upsertDatasourceRequestMapper = Mockito.mock(UpsertDatasourceRequestMapper.class);
        businessEventPublisher = Mockito.mock(BusinessEventPublisher.class);
        datasourceService = Mockito.mock(DatasourceService.class);
        gidService = Mockito.mock(GidService.class);
        resourcePermissionService = Mockito.mock(ResourcePermissionService.class);

        // Setup common mocks
        when(businessEventPublisher.publishDatasourceEvent(any(Datasource.class), any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishDatasourceEvent(any(String.class), any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishDatasourcePermissionEvent(any(), any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(businessEventPublisher.publishDatasourceResourcePermissionEvent(any(), any(), any())).thenReturn(Mono.empty());
        when(datasourceService.removePasswordTypeKeysFromJsDatasourcePluginConfig(any())).thenReturn(Mono.empty());
        when(gidService.convertDatasourceIdToObjectId(any())).thenAnswer(invocation -> {
            String datasourceId = invocation.getArgument(0);
            return datasourceId != null ? Mono.just(datasourceId) : Mono.empty();
        });
        when(gidService.convertApplicationIdToObjectId(any())).thenAnswer(invocation -> {
            String applicationId = invocation.getArgument(0);
            return applicationId != null ? Mono.just(applicationId) : Mono.empty();
        });
        when(gidService.convertOrganizationIdToObjectId(any())).thenAnswer(invocation -> {
            String organizationId = invocation.getArgument(0);
            return organizationId != null ? Mono.just(organizationId) : Mono.empty();
        });
        when(resourcePermissionService.getById(any())).thenAnswer(invocation -> {
            String permissionId = invocation.getArgument(0);
            ResourcePermission mockPermission = Mockito.mock(ResourcePermission.class);
            return permissionId != null ? Mono.just(mockPermission) : Mono.empty();
        });

        // Create controller with all required dependencies
        controller = new DatasourceController(
                datasourceStructureService,
                datasourceApiService,
                upsertDatasourceRequestMapper,
                businessEventPublisher,
                datasourceService,
                gidService,
                resourcePermissionService
        );
    }

    @Test
    void testCreateDatasource_Success() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();
        Datasource mockDatasource = createMockDatasource();
        
        when(upsertDatasourceRequestMapper.resolve(request)).thenReturn(mockDatasource);
        when(datasourceApiService.create(mockDatasource)).thenReturn(Mono.just(mockDatasource));

        // Act
        Mono<ResponseView<Datasource>> result = controller.create(request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockDatasource);
                })
                .verifyComplete();
    }

    @Test
    void testCreateDatasource_ServiceError() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();
        Datasource mockDatasource = createMockDatasource();
        
        when(upsertDatasourceRequestMapper.resolve(request)).thenReturn(mockDatasource);
        when(datasourceApiService.create(mockDatasource)).thenReturn(Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER")));

        // Act
        Mono<ResponseView<Datasource>> result = controller.create(request);

        // Assert
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    void testGetDatasourceById_Success() {
        // Arrange
        Datasource mockDatasource = createMockDatasource();
        when(datasourceApiService.findByIdWithPermission(TEST_DATASOURCE_ID)).thenReturn(Mono.just(mockDatasource));

        // Act
        Mono<ResponseView<Datasource>> result = controller.getById(TEST_DATASOURCE_ID);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockDatasource);
                })
                .verifyComplete();
    }

    @Test
    void testGetDatasourceById_NotFound() {
        // Arrange
        when(datasourceApiService.findByIdWithPermission(TEST_DATASOURCE_ID)).thenReturn(Mono.error(new BizException(BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND")));

        // Act
        Mono<ResponseView<Datasource>> result = controller.getById(TEST_DATASOURCE_ID);

        // Assert
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    void testUpdateDatasource_Success() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();
        Datasource mockDatasource = createMockDatasource();
        Datasource originalDatasource = createMockDatasource();
        originalDatasource.setName("Original Name");
        
        when(upsertDatasourceRequestMapper.resolve(request)).thenReturn(mockDatasource);
        when(datasourceService.getById(TEST_DATASOURCE_ID)).thenReturn(Mono.just(originalDatasource));
        when(datasourceApiService.update(TEST_DATASOURCE_ID, mockDatasource)).thenReturn(Mono.just(mockDatasource));

        // Act
        Mono<ResponseView<Datasource>> result = controller.update(TEST_DATASOURCE_ID, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockDatasource);
                })
                .verifyComplete();
    }

    @Test
    void testUpdateDatasource_ServiceError() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();
        Datasource mockDatasource = createMockDatasource();
        
        when(upsertDatasourceRequestMapper.resolve(request)).thenReturn(mockDatasource);
        when(datasourceService.getById(TEST_DATASOURCE_ID)).thenReturn(Mono.just(mockDatasource));
        when(datasourceApiService.update(TEST_DATASOURCE_ID, mockDatasource)).thenReturn(Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER")));

        // Act
        Mono<ResponseView<Datasource>> result = controller.update(TEST_DATASOURCE_ID, request);

        // Assert
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    void testDeleteDatasource_Success() {
        // Arrange
        Datasource mockDatasource = createMockDatasource();
        when(datasourceService.getById(TEST_DATASOURCE_ID)).thenReturn(Mono.just(mockDatasource));
        when(datasourceApiService.delete(TEST_DATASOURCE_ID)).thenReturn(Mono.just(true));

        // Act
        Mono<ResponseView<Boolean>> result = controller.delete(TEST_DATASOURCE_ID);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(true);
                })
                .verifyComplete();
    }

    @Test
    void testDeleteDatasource_ServiceError() {
        // Arrange
        Datasource mockDatasource = createMockDatasource();
        when(datasourceService.getById(TEST_DATASOURCE_ID)).thenReturn(Mono.just(mockDatasource));
        when(datasourceApiService.delete(TEST_DATASOURCE_ID)).thenReturn(Mono.error(new BizException(BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND")));

        // Act
        Mono<ResponseView<Boolean>> result = controller.delete(TEST_DATASOURCE_ID);

        // Assert
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    void testTestDatasource_Success() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();
        Datasource mockDatasource = createMockDatasource();
        DatasourceTestResult testResult = DatasourceTestResult.testSuccess();
        
        when(upsertDatasourceRequestMapper.resolve(request)).thenReturn(mockDatasource);
        when(datasourceApiService.testDatasource(mockDatasource)).thenReturn(Mono.just(testResult));

        // Act
        Mono<ResponseView<Boolean>> result = controller.testDatasource(request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(true);
                })
                .verifyComplete();
    }

    @Test
    void testTestDatasource_Failure() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();
        Datasource mockDatasource = createMockDatasource();
        DatasourceTestResult testResult = DatasourceTestResult.testFail("Connection failed");
        
        when(upsertDatasourceRequestMapper.resolve(request)).thenReturn(mockDatasource);
        when(datasourceApiService.testDatasource(mockDatasource)).thenReturn(Mono.just(testResult));

        // Act
        Mono<ResponseView<Boolean>> result = controller.testDatasource(request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert !response.isSuccess();
                    assert response.getCode() == 500;
                })
                .verifyComplete();
    }

    @Test
    void testGetStructure_Success() {
        // Arrange
        DatasourceStructure mockStructure = new DatasourceStructure();
        when(datasourceStructureService.getStructure(TEST_DATASOURCE_ID, false)).thenReturn(Mono.just(mockStructure));

        // Act
        Mono<ResponseView<DatasourceStructure>> result = controller.getStructure(TEST_DATASOURCE_ID, false);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockStructure);
                })
                .verifyComplete();
    }

    @Test
    void testGetStructure_WithIgnoreCache() {
        // Arrange
        DatasourceStructure mockStructure = new DatasourceStructure();
        when(datasourceStructureService.getStructure(TEST_DATASOURCE_ID, true)).thenReturn(Mono.just(mockStructure));

        // Act
        Mono<ResponseView<DatasourceStructure>> result = controller.getStructure(TEST_DATASOURCE_ID, true);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockStructure);
                })
                .verifyComplete();
    }

    @Test
    void testListJsDatasourcePlugins_Success() {
        // Arrange
        Flux<Datasource> mockDatasourceFlux = Flux.just(createMockDatasource());
        when(datasourceApiService.listJsDatasourcePlugins(anyString(), anyString(), anyString()))
                .thenReturn(mockDatasourceFlux);

        // Act
        Mono<PageResponseView<?>> result = controller.listJsDatasourcePlugins("appId", "name", "type", 1, 10);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                })
                .verifyComplete();
    }

    @Test
    void testGetPluginDynamicConfig_Success() {
        // Arrange
        GetPluginDynamicConfigRequestDTO requestDTO = GetPluginDynamicConfigRequestDTO.builder()
                .dataSourceId("test-id")
                .pluginName("test-plugin")
                .path("/test")
                .dataSourceConfig(new HashMap<>())
                .build();
        List<GetPluginDynamicConfigRequestDTO> requestDTOs = List.of(requestDTO);
        List<Object> mockConfigs = List.of(new HashMap<>());
        when(datasourceApiService.getPluginDynamicConfig(requestDTOs)).thenReturn(Mono.just(mockConfigs));

        // Act
        Mono<ResponseView<List<Object>>> result = controller.getPluginDynamicConfig(requestDTOs);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockConfigs);
                })
                .verifyComplete();
    }

    @Test
    void testListOrgDataSources_Success() {
        // Arrange
        Flux<DatasourceView> mockDatasourceViewFlux = Flux.just(Mockito.mock(DatasourceView.class));
        when(datasourceApiService.listOrgDataSources(anyString(), anyString(), anyString()))
                .thenReturn(mockDatasourceViewFlux);

        // Act
        Mono<PageResponseView<?>> result = controller.listOrgDataSources(TEST_ORGANIZATION_ID, "name", "type", 1, 10);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                })
                .verifyComplete();
    }

    @Test
    void testListAppDataSources_Success() {
        // Arrange
        Flux<DatasourceView> mockDatasourceViewFlux = Flux.just(Mockito.mock(DatasourceView.class));
        when(datasourceApiService.listAppDataSources(anyString(), anyString(), anyString()))
                .thenReturn(mockDatasourceViewFlux);

        // Act
        Mono<PageResponseView<?>> result = controller.listAppDataSources("appId", "name", "type", 1, 10);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                })
                .verifyComplete();
    }

    @Test
    void testGetPermissions_Success() {
        // Arrange
        CommonPermissionView mockPermissionView = CommonPermissionView.builder()
                .orgName("Test Org")
                .creatorId("user01")
                .groupPermissions(new ArrayList<>())
                .userPermissions(new ArrayList<>())
                .build();
        when(datasourceApiService.getPermissions(TEST_DATASOURCE_ID)).thenReturn(Mono.just(mockPermissionView));

        // Act
        Mono<ResponseView<CommonPermissionView>> result = controller.getPermissions(TEST_DATASOURCE_ID);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockPermissionView);
                })
                .verifyComplete();
    }

    @Test
    void testGrantPermission_Success() {
        // Arrange
        DatasourceEndpoints.BatchAddPermissionRequest request = new DatasourceEndpoints.BatchAddPermissionRequest("owner", Set.of("user1"), Set.of("group1"));
        when(datasourceApiService.grantPermission(eq(TEST_DATASOURCE_ID), any(), any(), any())).thenReturn(Mono.just(true));
        when(datasourceApiService.getPermissions(TEST_DATASOURCE_ID)).thenReturn(Mono.just(CommonPermissionView.builder()
                .orgName("Test Org")
                .creatorId("user01")
                .groupPermissions(new ArrayList<>())
                .userPermissions(new ArrayList<>())
                .build()));

        // Act
        Mono<ResponseView<Boolean>> result = controller.grantPermission(TEST_DATASOURCE_ID, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(true);
                })
                .verifyComplete();
    }

    @Test
    void testUpdatePermission_Success() {
        // Arrange
        DatasourceEndpoints.UpdatePermissionRequest request = new DatasourceEndpoints.UpdatePermissionRequest("viewer");
        ResourcePermission mockPermission = Mockito.mock(ResourcePermission.class);
        when(resourcePermissionService.getById(TEST_PERMISSION_ID)).thenReturn(Mono.just(mockPermission));
        when(datasourceApiService.updatePermission(TEST_PERMISSION_ID, ResourceRole.VIEWER)).thenReturn(Mono.just(true));

        // Act
        Mono<ResponseView<Boolean>> result = controller.updatePermission(TEST_PERMISSION_ID, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(true);
                })
                .verifyComplete();
    }

    @Test
    void testDeletePermission_Success() {
        // Arrange
        when(datasourceApiService.deletePermission(TEST_PERMISSION_ID)).thenReturn(Mono.just(true));
        when(resourcePermissionService.getById(TEST_PERMISSION_ID)).thenReturn(Mono.just(Mockito.mock(ResourcePermission.class)));

        // Act
        Mono<ResponseView<Boolean>> result = controller.deletePermission(TEST_PERMISSION_ID);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(true);
                })
                .verifyComplete();
    }

    @Test
    void testInfo_Success() {
        // Arrange
        Object mockInfo = new HashMap<>();
        when(datasourceApiService.info(TEST_DATASOURCE_ID)).thenReturn(mockInfo);

        // Act
        Mono<ResponseView<Object>> result = controller.info(TEST_DATASOURCE_ID);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assert response.isSuccess();
                    assert response.getData().equals(mockInfo);
                })
                .verifyComplete();
    }

    @Test
    void testInfo_WithoutDatasourceId() {
        // Arrange
        Object mockInfo = new HashMap<>();
        when(datasourceApiService.info(null)).thenReturn(mockInfo);
        when(gidService.convertDatasourceIdToObjectId(null)).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<Object>> result = controller.info(null);

        // Assert
        StepVerifier.create(result)
                .verifyComplete();
    }

    // Helper methods
    private UpsertDatasourceRequest createTestUpsertDatasourceRequest() {
        UpsertDatasourceRequest request = new UpsertDatasourceRequest();
        request.setId(TEST_DATASOURCE_ID);
        request.setName("Test Datasource");
        request.setType("mysql");
        request.setOrganizationId(TEST_ORGANIZATION_ID);
        request.setStatus(DatasourceStatus.NORMAL);
        request.setDatasourceConfig(new HashMap<>());
        return request;
    }

    private Datasource createMockDatasource() {
        Datasource datasource = new Datasource();
        datasource.setId(TEST_DATASOURCE_ID);
        datasource.setName("Test Datasource");
        datasource.setType("mysql");
        datasource.setOrganizationId(TEST_ORGANIZATION_ID);
        // Note: Datasource doesn't have a setStatus method, it uses setDatasourceStatus
        return datasource;
    }
} 
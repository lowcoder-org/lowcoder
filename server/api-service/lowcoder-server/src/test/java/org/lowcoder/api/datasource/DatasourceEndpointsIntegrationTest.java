package org.lowcoder.api.datasource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DatasourceEndpointsIntegrationTest {

    @Autowired
    private DatasourceController datasourceController;

    @Autowired
    private InitData initData;

    private static final String TEST_ORGANIZATION_ID = "org01";
    private static final String TEST_APPLICATION_ID = "app01";
    private static final String TEST_PERMISSION_ID = "permission01";

    @BeforeEach
    void setUp() {
        try {
            initData.init();
        } catch (RuntimeException e) {
            // Handle duplicate key errors gracefully - this happens when test data already exists
            if (e.getCause() instanceof DuplicateKeyException) {
                // Data already exists, continue with test
                System.out.println("Test data already exists, continuing with test...");
            } else {
                // Re-throw other exceptions
                throw e;
            }
        }
    }

    @Test
    @WithMockUser(id = "user01")
    void testCreateDatasource_Integration_Success() {
        // Arrange
        UpsertDatasourceRequest request = createTestUpsertDatasourceRequest();

        // Act
        Mono<ResponseView<Datasource>> result = datasourceController.create(request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals("Test REST API Datasource", response.getData().getName());
                    assertEquals("restapi", response.getData().getType());
                    assertEquals(TEST_ORGANIZATION_ID, response.getData().getOrganizationId());
                    assertNotNull(response.getData().getId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetDatasourceById_Integration_Success() {
        // Arrange - First create a datasource, then retrieve it
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Test Datasource for Get");

        // Act - Create then get
        Mono<ResponseView<Datasource>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.getById(createdId);
                });

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals("Test Datasource for Get", response.getData().getName());
                    assertEquals("restapi", response.getData().getType());
                    assertEquals(TEST_ORGANIZATION_ID, response.getData().getOrganizationId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testDeleteDatasource_Integration_Success() {
        // Arrange - First create a datasource to delete
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Datasource to Delete");

        // Act - Create then delete
        Mono<ResponseView<Boolean>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.delete(createdId);
                });

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetDatasourceStructure_Integration_Success() {
        // Arrange - First create a datasource, then get its structure
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Datasource for Structure Test");

        boolean ignoreCache = false;

        // Act - Create then get structure
        Mono<ResponseView<DatasourceStructure>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.getStructure(createdId, ignoreCache);
                });

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    // Note: Structure might be null in test environment
                    // So we just verify the response structure
                    assertNotNull(response);
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetDatasourceStructure_Integration_WithCache() {
        // Arrange - First create a datasource, then get its structure with cache
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Datasource for Cache Structure Test");

        boolean ignoreCache = true;

        // Act - Create then get structure
        Mono<ResponseView<DatasourceStructure>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.getStructure(createdId, ignoreCache);
                });

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    // Note: Structure might be null in test environment
                    // So we just verify the response structure
                    assertNotNull(response);
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListJsDatasourcePlugins_Integration_Success() {
        // Arrange
        String applicationId = TEST_APPLICATION_ID;
        String name = null;
        String type = null;
        int pageNum = 1;
        int pageSize = 10;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listJsDatasourcePlugins(
                applicationId, name, type, pageNum, pageSize);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getTotal());
                    assertNotNull(response.getPageNum());
                    assertNotNull(response.getPageSize());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListJsDatasourcePlugins_Integration_WithFilters() {
        // Arrange
        String applicationId = TEST_APPLICATION_ID;
        String name = "restapi";
        String type = "restapi";
        int pageNum = 1;
        int pageSize = 5;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listJsDatasourcePlugins(
                applicationId, name, type, pageNum, pageSize);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getTotal());
                    assertNotNull(response.getPageNum());
                    assertNotNull(response.getPageSize());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetPluginDynamicConfig_Integration_EmptyList() {
        // Arrange
        List<GetPluginDynamicConfigRequestDTO> emptyList = List.of();

        // Act
        Mono<ResponseView<List<Object>>> result = datasourceController.getPluginDynamicConfig(emptyList);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertTrue(response.getData().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListOrgDataSources_Integration_Success() {
        // Arrange
        String orgId = TEST_ORGANIZATION_ID;
        String name = null;
        String type = null;
        int pageNum = 1;
        int pageSize = 10;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listOrgDataSources(
                orgId, name, type, pageNum, pageSize);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getTotal());
                    assertNotNull(response.getPageNum());
                    assertNotNull(response.getPageSize());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListOrgDataSources_Integration_WithFilters() {
        // Arrange
        String orgId = TEST_ORGANIZATION_ID;
        String name = "restapi";
        String type = "restapi";
        int pageNum = 1;
        int pageSize = 5;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listOrgDataSources(
                orgId, name, type, pageNum, pageSize);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getTotal());
                    assertNotNull(response.getPageNum());
                    assertNotNull(response.getPageSize());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListOrgDataSources_Integration_EmptyOrgId() {
        // Arrange
        String orgId = "";
        String name = null;
        String type = null;
        int pageNum = 1;
        int pageSize = 10;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listOrgDataSources(
                orgId, name, type, pageNum, pageSize);

        // Assert - This method uses ofError() directly, so it throws BizException
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListAppDataSources_Integration_Success() {
        // Arrange
        String appId = TEST_APPLICATION_ID;
        String name = null;
        String type = null;
        int pageNum = 1;
        int pageSize = 10;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listAppDataSources(
                appId, name, type, pageNum, pageSize);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getTotal());
                    assertNotNull(response.getPageNum());
                    assertNotNull(response.getPageSize());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListAppDataSources_Integration_WithFilters() {
        // Arrange
        String appId = TEST_APPLICATION_ID;
        String name = "restapi";
        String type = "restapi";
        int pageNum = 1;
        int pageSize = 5;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listAppDataSources(
                appId, name, type, pageNum, pageSize);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getTotal());
                    assertNotNull(response.getPageNum());
                    assertNotNull(response.getPageSize());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testListAppDataSources_Integration_EmptyAppId() {
        // Arrange
        String appId = "";
        String name = null;
        String type = null;
        int pageNum = 1;
        int pageSize = 10;

        // Act
        Mono<PageResponseView<?>> result = datasourceController.listAppDataSources(
                appId, name, type, pageNum, pageSize);

        // Assert - This method uses ofError() directly, so it throws BizException
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetDatasourcePermissions_Integration_Success() {
        // Arrange - First create a datasource, then get its permissions
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Datasource for Permissions Test");

        // Act - Create then get permissions
        Mono<ResponseView<CommonPermissionView>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.getPermissions(createdId);
                });

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getData().getUserPermissions());
                    assertNotNull(response.getData().getGroupPermissions());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGrantDatasourcePermission_Integration_InvalidRole() {
        // Arrange - First create a datasource, then try to grant invalid permissions
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Datasource for Invalid Permission Test");

        Set<String> userIds = Set.of("user02");
        Set<String> groupIds = Set.of();
        String invalidRole = "INVALID_ROLE";
        
        DatasourceEndpoints.BatchAddPermissionRequest request = 
                new DatasourceEndpoints.BatchAddPermissionRequest(invalidRole, userIds, groupIds);

        // Act - Create then try to grant invalid permission
        Mono<ResponseView<Boolean>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.grantPermission(createdId, request);
                });

        // Assert - This method uses ofError() directly, so it throws BizException
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateDatasourcePermission_Integration_InvalidRole() {
        // Arrange
        String permissionId = TEST_PERMISSION_ID;
        String invalidRole = "INVALID_ROLE";
        
        DatasourceEndpoints.UpdatePermissionRequest request = 
                new DatasourceEndpoints.UpdatePermissionRequest(invalidRole);

        // Act
        Mono<ResponseView<Boolean>> result = datasourceController.updatePermission(permissionId, request);

        // Assert - This method uses ofError() directly, so it throws BizException
        StepVerifier.create(result)
                .expectError(BizException.class)
                .verify();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetDatasourceInfo_Integration_Success() {
        // Arrange - First create a datasource, then get its info
        UpsertDatasourceRequest createRequest = createTestUpsertDatasourceRequest();
        createRequest.setName("Datasource for Info Test");

        // Act - Create then get info
        Mono<ResponseView<Object>> result = datasourceController.create(createRequest)
                .flatMap(createResponse -> {
                    String createdId = createResponse.getData().getId();
                    return datasourceController.info(createdId);
                });

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                })
                .verifyComplete();
    }

    // Helper method to create a test UpsertDatasourceRequest
    private UpsertDatasourceRequest createTestUpsertDatasourceRequest() {
        UpsertDatasourceRequest request = new UpsertDatasourceRequest();
        request.setName("Test REST API Datasource");
        request.setType("restapi"); // Use REST_API instead of mysql
        request.setOrganizationId(TEST_ORGANIZATION_ID);
        request.setStatus(DatasourceStatus.NORMAL);
        
        // Create REST API datasource config
        Map<String, Object> config = new HashMap<>();
        config.put("url", "https://api.example.com");
        config.put("method", "GET");
        config.put("headers", new HashMap<String, String>());
        config.put("params", new HashMap<String, String>());
        
        request.setDatasourceConfig(config);
        return request;
    }
}

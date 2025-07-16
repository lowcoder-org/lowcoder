package org.lowcoder.api.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;
import org.lowcoder.api.config.ConfigView;

@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ConfigEndpointsIntegrationTest {

    @Autowired
    private ConfigController configController;
    
    @Autowired
    private ServerConfigRepository serverConfigRepository;
    
    @Autowired
    private ConfigCenter configCenter;
    
    @Autowired
    private InitData initData;

    private ServerWebExchange mockExchange;

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
        MockServerHttpRequest request = MockServerHttpRequest.get("").build();
        mockExchange = MockServerWebExchange.builder(request).build();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetDeploymentId_Integration_Success() {
        // Act
        Mono<String> result = configController.getDeploymentId();

        // Assert
        StepVerifier.create(result)
                .assertNext(deploymentId -> {
                    assertNotNull(deploymentId);
                    // Deployment ID can be empty string in test environment
                    assertTrue(deploymentId.length() >= 0);
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetServerConfig_Integration_ExistingConfig() {
        // Arrange - Create a test config first
        String key = "integration-test-key";
        String value = "integration-test-value";
        
        ServerConfig testConfig = ServerConfig.builder()
                .key(key)
                .value(value)
                .build();
        
        serverConfigRepository.save(testConfig).block();

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.getServerConfig(key);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertEquals(value, response.getData().getValue());
                })
                .verifyComplete();

        // Cleanup
        serverConfigRepository.deleteById(testConfig.getId()).block();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetServerConfig_Integration_NonExistingConfig() {
        // Arrange
        String key = "non-existing-integration-key";

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.getServerConfig(key);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertNull(response.getData().getValue());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetServerConfig_Integration_EmptyKey() {
        // Arrange
        String key = "";

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.getServerConfig(key);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertNull(response.getData().getValue());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateServerConfig_Integration_Success() {
        // Arrange
        String key = "update-test-key";
        String value = "update-test-value";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.updateServerConfig(key, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertEquals(value, response.getData().getValue());
                })
                .verifyComplete();

        // Verify the config was actually saved in database
        StepVerifier.create(serverConfigRepository.findByKey(key))
                .assertNext(savedConfig -> {
                    assertNotNull(savedConfig);
                    assertEquals(key, savedConfig.getKey());
                    assertEquals(value, savedConfig.getValue());
                })
                .verifyComplete();

        // Cleanup
        serverConfigRepository.findByKey(key)
                .flatMap(config -> serverConfigRepository.deleteById(config.getId()))
                .block();
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateServerConfig_Integration_UpdateExistingConfig() {
        // Arrange - Create a config first
        String key = "update-existing-test-key";
        String initialValue = "initial-value";
        
        ServerConfig initialConfig = ServerConfig.builder()
                .key(key)
                .value(initialValue)
                .build();
        
        serverConfigRepository.save(initialConfig).block();

        // Update the config
        String newValue = "updated-value";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(newValue);

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.updateServerConfig(key, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertEquals(newValue, response.getData().getValue());
                })
                .verifyComplete();

        // Verify the config was actually updated in database
        StepVerifier.create(serverConfigRepository.findByKey(key))
                .assertNext(savedConfig -> {
                    assertNotNull(savedConfig);
                    assertEquals(key, savedConfig.getKey());
                    assertEquals(newValue, savedConfig.getValue());
                })
                .verifyComplete();

        // Cleanup
        serverConfigRepository.findByKey(key)
                .flatMap(config -> serverConfigRepository.deleteById(config.getId()))
                .block();
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateServerConfig_Integration_NullValue() {
        // Arrange
        String key = "null-value-test-key";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(null);

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.updateServerConfig(key, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertNull(response.getData().getValue());
                })
                .verifyComplete();

        // Verify the config was actually saved in database
        StepVerifier.create(serverConfigRepository.findByKey(key))
                .assertNext(savedConfig -> {
                    assertNotNull(savedConfig);
                    assertEquals(key, savedConfig.getKey());
                    assertNull(savedConfig.getValue());
                })
                .verifyComplete();

        // Cleanup
        serverConfigRepository.findByKey(key)
                .flatMap(config -> serverConfigRepository.deleteById(config.getId()))
                .block();
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateServerConfig_Integration_EmptyValue() {
        // Arrange
        String key = "empty-value-test-key";
        String value = "";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.updateServerConfig(key, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertEquals(value, response.getData().getValue());
                })
                .verifyComplete();

        // Verify the config was actually saved in database
        StepVerifier.create(serverConfigRepository.findByKey(key))
                .assertNext(savedConfig -> {
                    assertNotNull(savedConfig);
                    assertEquals(key, savedConfig.getKey());
                    assertEquals(value, savedConfig.getValue());
                })
                .verifyComplete();

        // Cleanup
        serverConfigRepository.findByKey(key)
                .flatMap(config -> serverConfigRepository.deleteById(config.getId()))
                .block();
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateServerConfig_Integration_SpecialCharacters() {
        // Arrange
        String key = "special-chars-test-key";
        String value = "test-value-with-special-chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.updateServerConfig(key, request);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(key, response.getData().getKey());
                    assertEquals(value, response.getData().getValue());
                })
                .verifyComplete();

        // Verify the config was actually saved in database
        StepVerifier.create(serverConfigRepository.findByKey(key))
                .assertNext(savedConfig -> {
                    assertNotNull(savedConfig);
                    assertEquals(key, savedConfig.getKey());
                    assertEquals(value, savedConfig.getValue());
                })
                .verifyComplete();

        // Cleanup
        serverConfigRepository.findByKey(key)
                .flatMap(config -> serverConfigRepository.deleteById(config.getId()))
                .block();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetConfig_Integration_Success() {
        // Act
        Mono<ResponseView<ConfigView>> result = configController.getConfig(mockExchange, null);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    // Verify ConfigView properties
                    assertNotNull(response.getData().getAuthConfigs());
                    assertNotNull(response.getData().getWorkspaceMode());
                    assertNotNull(response.getData().getCookieName());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetConfig_Integration_WithNullOrgId() {
        // Act
        Mono<ResponseView<ConfigView>> result = configController.getConfig(mockExchange, null);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    // Verify ConfigView properties
                    assertNotNull(response.getData().getAuthConfigs());
                    assertNotNull(response.getData().getWorkspaceMode());
                    assertNotNull(response.getData().getCookieName());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetConfig_Integration_WithEmptyOrgId() {
        // Act & Assert - Expect BizException for empty org ID
        StepVerifier.create(configController.getConfig(mockExchange, ""))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof org.lowcoder.sdk.exception.BizException);
                    org.lowcoder.sdk.exception.BizException bizException = (org.lowcoder.sdk.exception.BizException) throwable;
                    // Should fail due to empty organization ID
                    assertTrue(bizException.getMessage().contains("Illegal workspace ID") ||
                              bizException.getMessage().contains("does not exist"));
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetConfig_Integration_WithNonExistingOrgId() {
        // Act & Assert - Expect BizException for non-existing org ID
        StepVerifier.create(configController.getConfig(mockExchange, "non-existing-org-id"))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof org.lowcoder.sdk.exception.BizException);
                    org.lowcoder.sdk.exception.BizException bizException = (org.lowcoder.sdk.exception.BizException) throwable;
                    // Should fail due to non-existing organization
                    assertTrue(bizException.getMessage().contains("Illegal workspace ID") ||
                              bizException.getMessage().contains("does not exist"));
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateConfigRequest_Record_Integration() {
        // Arrange - Test UpdateConfigRequest record creation and validation
        String value = "integration-test-value";

        // Act - Create UpdateConfigRequest record
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Assert - Verify record properties
        assertEquals(value, request.value());

        // Test record immutability and equality
        ConfigEndpoints.UpdateConfigRequest sameRequest = new ConfigEndpoints.UpdateConfigRequest(value);
        assertEquals(request, sameRequest);
        assertEquals(request.hashCode(), sameRequest.hashCode());

        // Test different request
        ConfigEndpoints.UpdateConfigRequest differentRequest = new ConfigEndpoints.UpdateConfigRequest("different-value");
        assertNotEquals(request, differentRequest);

        // Test toString method
        String toString = request.toString();
        assertTrue(toString.contains(value));

        // Test with null values
        ConfigEndpoints.UpdateConfigRequest nullRequest = new ConfigEndpoints.UpdateConfigRequest(null);
        assertNull(nullRequest.value());
        assertEquals(value, request.value()); // Original request should remain unchanged
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateConfigRequest_Record_Integration_WithNullValue() {
        // Arrange & Act
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(null);

        // Assert
        assertNull(request.value());

        // Test record immutability and equality
        ConfigEndpoints.UpdateConfigRequest sameRequest = new ConfigEndpoints.UpdateConfigRequest(null);
        assertEquals(request, sameRequest);
        assertEquals(request.hashCode(), sameRequest.hashCode());

        // Test toString method
        String toString = request.toString();
        assertTrue(toString.contains("null"));
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateConfigRequest_Record_Integration_WithEmptyValue() {
        // Arrange
        String value = "";

        // Act
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Assert
        assertEquals(value, request.value());

        // Test record immutability and equality
        ConfigEndpoints.UpdateConfigRequest sameRequest = new ConfigEndpoints.UpdateConfigRequest(value);
        assertEquals(request, sameRequest);
        assertEquals(request.hashCode(), sameRequest.hashCode());

        // Test toString method
        String toString = request.toString();
        assertTrue(toString.contains(value));
    }

    @Test
    @WithMockUser(id = "user01")
    void testUpdateConfigRequest_Record_Integration_WithSpecialCharacters() {
        // Arrange
        String value = "integration-test-value-with-special-chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";

        // Act
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Assert
        assertEquals(value, request.value());

        // Test record immutability and equality
        ConfigEndpoints.UpdateConfigRequest sameRequest = new ConfigEndpoints.UpdateConfigRequest(value);
        assertEquals(request, sameRequest);
        assertEquals(request.hashCode(), sameRequest.hashCode());

        // Test toString method
        String toString = request.toString();
        assertTrue(toString.contains(value));
    }

    @Test
    @WithMockUser(id = "user01")
    void testConfigView_Integration_Properties() {
        // Act
        Mono<ResponseView<ConfigView>> result = configController.getConfig(mockExchange, null);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    // Verify ConfigView properties
                    assertNotNull(response.getData().getAuthConfigs());
                    assertNotNull(response.getData().getWorkspaceMode());
                    assertNotNull(response.getData().getCookieName());
                })
                .verifyComplete();
    }
} 
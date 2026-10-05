package org.lowcoder.api.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConfigEndpointsUnitTest {

    @Mock
    private ServerConfigRepository serverConfigRepository;

    @Mock
    private OrgApiService orgApiService;

    @Mock
    private ConfigCenter configCenter;

    @Mock
    private ConfigInstance configInstance;

    @Mock
    private Conf<String> deploymentIdConf;

    @Mock
    private SessionUserService sessionUserService;

    @Mock
    private UserService userService;

    @InjectMocks
    private ConfigController configController;

    private ServerWebExchange mockExchange;

    private static final String VISITOR_ID = "visitor";

    /** The visitor of a config write, stored with the given {@code superAdmin} flag (BF-001). */
    private void visitorWithSuperAdminFlag(Boolean superAdmin) {
        User visitor = new User();
        visitor.setId(VISITOR_ID);
        visitor.setSuperAdmin(superAdmin);
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        when(userService.findById(VISITOR_ID)).thenReturn(Mono.just(visitor));
    }

    @BeforeEach
    void setUp() {
        MockServerHttpRequest request = MockServerHttpRequest.get("").build();
        mockExchange = MockServerWebExchange.builder(request).build();
    }

    @Test
    void testGetDeploymentId_Success() {
        // Arrange
        String expectedDeploymentId = "test-deployment-id";
        when(configCenter.deployment()).thenReturn(configInstance);
        when(configInstance.ofString("id", "")).thenReturn(deploymentIdConf);
        when(deploymentIdConf.get()).thenReturn(expectedDeploymentId);
        
        // Initialize the controller since @PostConstruct is not called with @InjectMocks
        configController.init();

        // Act
        Mono<String> result = configController.getDeploymentId();

        // Assert
        StepVerifier.create(result)
                .expectNext(expectedDeploymentId)
                .verifyComplete();
    }

    @Test
    void testGetDeploymentId_EmptyId() {
        // Arrange
        when(configCenter.deployment()).thenReturn(configInstance);
        when(configInstance.ofString("id", "")).thenReturn(deploymentIdConf);
        when(deploymentIdConf.get()).thenReturn("");
        
        // Initialize the controller since @PostConstruct is not called with @InjectMocks
        configController.init();

        // Act
        Mono<String> result = configController.getDeploymentId();

        // Assert
        StepVerifier.create(result)
                .expectNext("")
                .verifyComplete();
    }

    @Test
    void testGetServerConfig_ExistingConfig() {
        // Arrange
        String key = "test-key";
        String value = "test-value";
        ServerConfig expectedConfig = ServerConfig.builder()
                .key(key)
                .value(value)
                .build();
        
        when(serverConfigRepository.findByKey(key)).thenReturn(Mono.just(expectedConfig));

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
    }

    @Test
    void testGetServerConfig_NonExistingConfig() {
        // Arrange
        String key = "non-existing-key";
        when(serverConfigRepository.findByKey(key)).thenReturn(Mono.empty());

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
    void testGetServerConfig_NullKey() {
        // Arrange
        String key = null;
        when(serverConfigRepository.findByKey(key)).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<ServerConfig>> result = configController.getServerConfig(key);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNull(response.getData().getKey());
                    assertNull(response.getData().getValue());
                })
                .verifyComplete();
    }

    @Test
    void testUpdateServerConfig_Success() {
        // Arrange
        visitorWithSuperAdminFlag(true);
        String key = "test-key";
        String value = "new-value";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);
        
        ServerConfig expectedConfig = ServerConfig.builder()
                .key(key)
                .value(value)
                .build();
        
        when(serverConfigRepository.upsert(key, value)).thenReturn(Mono.just(expectedConfig));

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
        
        verify(serverConfigRepository).upsert(key, value);
    }

    @Test
    void testUpdateServerConfig_NullValue() {
        // Arrange
        visitorWithSuperAdminFlag(true);
        String key = "test-key";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(null);
        
        ServerConfig expectedConfig = ServerConfig.builder()
                .key(key)
                .value(null)
                .build();
        
        when(serverConfigRepository.upsert(key, null)).thenReturn(Mono.just(expectedConfig));

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
        
        verify(serverConfigRepository).upsert(key, null);
    }

    @Test
    void testUpdateServerConfig_EmptyValue() {
        // Arrange
        visitorWithSuperAdminFlag(true);
        String key = "test-key";
        String value = "";
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);
        
        ServerConfig expectedConfig = ServerConfig.builder()
                .key(key)
                .value(value)
                .build();
        
        when(serverConfigRepository.upsert(key, value)).thenReturn(Mono.just(expectedConfig));

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
        
        verify(serverConfigRepository).upsert(key, value);
    }

    /** BF-001: a visitor whose stored user is not the super admin (flag false or absent) cannot write; nothing is upserted. */
    @ParameterizedTest
    @NullSource
    @ValueSource(booleans = false)
    void testUpdateServerConfig_NotSuperAdmin_IsRefused(Boolean superAdmin) {
        visitorWithSuperAdminFlag(superAdmin);

        Mono<ResponseView<ServerConfig>> result = configController.updateServerConfig("test-key", new ConfigEndpoints.UpdateConfigRequest("v"));

        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    System.out.println("[ConfigEndpointsUnitTest] superAdmin=" + superAdmin + " -> " + error);
                    assertTrue(error instanceof BizException);
                    assertEquals(BizError.NOT_AUTHORIZED, ((BizException) error).getError());
                })
                .verify();
        verify(serverConfigRepository, never()).upsert(anyString(), any());
    }

    /** BF-001: without a visitor (no session user) the write is refused. */
    @Test
    void testUpdateServerConfig_NoVisitor_IsRefused() {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.empty());

        StepVerifier.create(configController.updateServerConfig("test-key", new ConfigEndpoints.UpdateConfigRequest("v")))
                .expectErrorSatisfies(error -> assertEquals(BizError.NOT_AUTHORIZED, ((BizException) error).getError()))
                .verify();
        verify(serverConfigRepository, never()).upsert(anyString(), any());
    }

    @Test
    void testGetConfig_Success() {
        // Arrange
        String orgId = "test-org-id";
        ConfigView expectedConfigView = ConfigView.builder()
                .isCloudHosting(false)
                .workspaceMode(org.lowcoder.sdk.constants.WorkspaceMode.SAAS)
                .selfDomain(false)
                .cookieName("test-cookie")
                .build();
        
        when(orgApiService.getOrganizationConfigs(orgId)).thenReturn(Mono.just(expectedConfigView));

        // Act
        Mono<ResponseView<ConfigView>> result = configController.getConfig(mockExchange, orgId);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(expectedConfigView.isCloudHosting(), response.getData().isCloudHosting());
                    assertEquals(expectedConfigView.getWorkspaceMode(), response.getData().getWorkspaceMode());
                    assertEquals(expectedConfigView.isSelfDomain(), response.getData().isSelfDomain());
                    assertEquals(expectedConfigView.getCookieName(), response.getData().getCookieName());
                })
                .verifyComplete();
        
        verify(orgApiService).getOrganizationConfigs(orgId);
    }

    @Test
    void testGetConfig_NullOrgId() {
        // Arrange
        String orgId = null;
        ConfigView expectedConfigView = ConfigView.builder()
                .isCloudHosting(true)
                .workspaceMode(org.lowcoder.sdk.constants.WorkspaceMode.ENTERPRISE)
                .selfDomain(true)
                .cookieName("default-cookie")
                .build();
        
        when(orgApiService.getOrganizationConfigs(orgId)).thenReturn(Mono.just(expectedConfigView));

        // Act
        Mono<ResponseView<ConfigView>> result = configController.getConfig(mockExchange, orgId);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(expectedConfigView.isCloudHosting(), response.getData().isCloudHosting());
                    assertEquals(expectedConfigView.getWorkspaceMode(), response.getData().getWorkspaceMode());
                    assertEquals(expectedConfigView.isSelfDomain(), response.getData().isSelfDomain());
                    assertEquals(expectedConfigView.getCookieName(), response.getData().getCookieName());
                })
                .verifyComplete();
        
        verify(orgApiService).getOrganizationConfigs(orgId);
    }

    @Test
    void testGetConfig_EmptyOrgId() {
        // Arrange
        String orgId = "";
        ConfigView expectedConfigView = ConfigView.builder()
                .isCloudHosting(false)
                .workspaceMode(org.lowcoder.sdk.constants.WorkspaceMode.SAAS)
                .selfDomain(false)
                .cookieName("empty-org-cookie")
                .build();
        
        when(orgApiService.getOrganizationConfigs(orgId)).thenReturn(Mono.just(expectedConfigView));

        // Act
        Mono<ResponseView<ConfigView>> result = configController.getConfig(mockExchange, orgId);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertEquals(expectedConfigView.isCloudHosting(), response.getData().isCloudHosting());
                    assertEquals(expectedConfigView.getWorkspaceMode(), response.getData().getWorkspaceMode());
                    assertEquals(expectedConfigView.isSelfDomain(), response.getData().isSelfDomain());
                    assertEquals(expectedConfigView.getCookieName(), response.getData().getCookieName());
                })
                .verifyComplete();
        
        verify(orgApiService).getOrganizationConfigs(orgId);
    }

    @Test
    void testUpdateConfigRequest_Record() {
        // Arrange
        String value = "test-value";

        // Act
        ConfigEndpoints.UpdateConfigRequest request = new ConfigEndpoints.UpdateConfigRequest(value);

        // Assert
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
        
        // Test with null value
        ConfigEndpoints.UpdateConfigRequest nullRequest = new ConfigEndpoints.UpdateConfigRequest(null);
        assertNull(nullRequest.value());
    }

    @Test
    void testUpdateConfigRequest_Record_WithNullValue() {
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
    void testUpdateConfigRequest_Record_WithEmptyValue() {
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
    void testUpdateConfigRequest_Record_WithSpecialCharacters() {
        // Arrange
        String value = "test-value-with-special-chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";

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
} 
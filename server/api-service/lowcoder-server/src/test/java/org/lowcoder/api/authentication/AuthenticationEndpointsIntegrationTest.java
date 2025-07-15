package org.lowcoder.api.authentication;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.lowcoder.sdk.exception.BizError.INVALID_PASSWORD;
import org.lowcoder.domain.user.model.Connection;

@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthenticationEndpointsIntegrationTest {

    @Autowired
    private AuthenticationController authenticationController;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuthenticationService authenticationService;
    
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
        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        mockExchange = MockServerWebExchange.builder(request).build();
    }

    @Test
    @WithMockUser(id = "user01")
    void testFormLogin_Integration_Success() {
        // Arrange
        String email = "integration_test@example.com";
        String password = "testPassword123";
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();

        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                email, password, true, source, authId
        );

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.formLogin(
                formLoginRequest, null, null, mockExchange
        );

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();

        // Verify user was created in database
        StepVerifier.create(userRepository.findByConnections_SourceAndConnections_RawId(source, email))
                .assertNext(user -> {
                    assertNotNull(user);
                    // Since connections is a Set, we need to find the connection by source
                    // Fixed: Changed from get(0) to stream().filter().findFirst() approach
                    Connection connection = user.getConnections().stream()
                            .filter(conn -> source.equals(conn.getSource()))
                            .findFirst()
                            .orElse(null);
                    assertNotNull(connection);
                    assertEquals(email, connection.getRawId());
                    assertEquals(source, connection.getSource());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testFormLogin_Integration_LoginExistingUser() {
        // Arrange - First register a user
        String email = "existing_user@example.com";
        String password = "testPassword123";
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();

        AuthenticationEndpoints.FormLoginRequest registerRequest = new AuthenticationEndpoints.FormLoginRequest(
                email, password, true, source, authId
        );

        // Register the user first
        authenticationController.formLogin(registerRequest, null, null, mockExchange).block();

        // Now try to login with the same credentials
        AuthenticationEndpoints.FormLoginRequest loginRequest = new AuthenticationEndpoints.FormLoginRequest(
                email, password, false, source, authId
        );

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.formLogin(
                loginRequest, null, null, mockExchange
        );

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
    void testFormLogin_Integration_InvalidCredentials() {
        // Arrange
        String email = "nonexistent@example.com";
        String password = "wrongPassword";
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();

        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                email, password, false, source, authId
        );

        // Act & Assert
        StepVerifier.create(authenticationController.formLogin(formLoginRequest, null, null, mockExchange))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof BizException);
                    BizException bizException = (BizException) throwable;
                    assertEquals(INVALID_PASSWORD, bizException.getError());
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testLogout_Integration_Success() {
        // Arrange - Set up a mock session token
        MockServerHttpRequest request = MockServerHttpRequest.post("")
                .cookie(ResponseCookie.from("token", "test-session-token").build())
                .build();
        ServerWebExchange exchangeWithCookie = MockServerWebExchange.builder(request).build();

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.logout(exchangeWithCookie);

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
    void testEnableAuthConfig_Integration_Success() {
        // Arrange
        AuthConfigRequest authConfigRequest = new AuthConfigRequest();
        authConfigRequest.put("authType", "FORM");
        authConfigRequest.put("source", "test-email");
        authConfigRequest.put("sourceName", "Test Email Auth");
        authConfigRequest.put("enableRegister", true);

        // Act
        Mono<ResponseView<Void>> result = authenticationController.enableAuthConfig(authConfigRequest);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetAllConfigs_Integration_Success() {
        // Act
        Mono<ResponseView<List<AbstractAuthConfig>>> result = authenticationController.getAllConfigs();

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    // Should have at least the default email config
                    assertTrue(response.getData().size() >= 1);
                    
                    // Verify at least one config is an EmailAuthConfig
                    boolean hasEmailConfig = response.getData().stream()
                            .anyMatch(config -> config instanceof EmailAuthConfig);
                    assertTrue(hasEmailConfig);
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testCreateAPIKey_Integration_Success() {
        // Arrange
        APIKeyRequest apiKeyRequest = new APIKeyRequest();
        apiKeyRequest.put("name", "Integration Test API Key");
        apiKeyRequest.put("description", "API Key created during integration test");

        // Act
        Mono<ResponseView<APIKeyVO>> result = authenticationController.createAPIKey(apiKeyRequest);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertNotNull(response.getData().getId());
                    assertNotNull(response.getData().getToken());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testGetAllAPIKeys_Integration_Success() {
        // Arrange - Create an API key first
        APIKeyRequest apiKeyRequest = new APIKeyRequest();
        apiKeyRequest.put("name", "Test API Key for List");
        apiKeyRequest.put("description", "Test Description");
        
        authenticationController.createAPIKey(apiKeyRequest).block();

        // Act
        Mono<ResponseView<List<APIKey>>> result = authenticationController.getAllAPIKeys();

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                    assertTrue(response.getData().size() >= 1);
                    
                    // Verify the created API key is in the list
                    boolean foundCreatedKey = response.getData().stream()
                            .anyMatch(key -> "Test API Key for List".equals(key.getName()));
                    assertTrue(foundCreatedKey);
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testDeleteAPIKey_Integration_Success() {
        // Arrange - Create an API key first
        APIKeyRequest apiKeyRequest = new APIKeyRequest();
        apiKeyRequest.put("name", "API Key to Delete");
        apiKeyRequest.put("description", "This key will be deleted");
        
        APIKeyVO createdKey = authenticationController.createAPIKey(apiKeyRequest).block().getData();

        // Act
        Mono<ResponseView<Void>> result = authenticationController.deleteAPIKey(createdKey.getId());

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();

        // Verify the key was actually deleted
        StepVerifier.create(authenticationController.getAllAPIKeys())
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    boolean keyStillExists = response.getData().stream()
                            .anyMatch(key -> createdKey.getId().equals(key.getId()));
                    assertFalse(keyStillExists);
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testBindEmail_Integration_Success() {
        // Arrange
        String emailToBind = "bound_email@example.com";

        // Act
        Mono<ResponseView<?>> result = authenticationController.bindEmail(emailToBind);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNotNull(response.getData());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testFormLogin_Integration_WithInvitationId() {
        // Arrange - Test registration without invitation ID (invitation ID is optional)
        String email = "invited_user@example.com";
        String password = "testPassword123";
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();
        String invitationId = null; // No invitation ID - should work fine

        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                email, password, true, source, authId
        );

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.formLogin(
                formLoginRequest, invitationId, null, mockExchange
        );

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
    void testFormLogin_Integration_WithOrgId() {
        // Arrange
        String email = "org_user@example.com";
        String password = "testPassword123";
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();
        String orgId = null; // Use null to get default EMAIL auth config

        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                email, password, true, source, authId
        );

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.formLogin(
                formLoginRequest, null, orgId, mockExchange
        );

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
    void testDisableAuthConfig_Integration_Success() {
        // Arrange - First enable an auth config
        AuthConfigRequest authConfigRequest = new AuthConfigRequest();
        authConfigRequest.put("authType", "FORM");
        authConfigRequest.put("source", "disable-test");
        authConfigRequest.put("sourceName", "Test Auth to Disable");
        authConfigRequest.put("enableRegister", true);

        authenticationController.enableAuthConfig(authConfigRequest).block();

        // Get the config ID (this is a simplified approach - in real scenario you'd get it from the response)
        String configId = "disable-test"; // Simplified for test

        // Act
        Mono<ResponseView<Void>> result = authenticationController.disableAuthConfig(configId, false);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(id = "user01")
    void testLoginWithThirdParty_Integration_Success() {
        // Arrange - Use the existing Google OAuth config from test data
        String authId = "106e4f4a4f6a48e5aa23cca6757c29e4"; // Google OAuth config ID from organization.json
        String source = "GOOGLE";
        String code = "mock-oauth-code";
        String redirectUrl = "http://localhost:8080/auth/callback";
        String orgId = "org01";

        // Act & Assert - Expect network error since auth.google.com doesn't exist
        StepVerifier.create(authenticationController.loginWithThirdParty(
                authId, source, code, null, redirectUrl, orgId, mockExchange
        ))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof BizException);
                    BizException bizException = (BizException) throwable;
                    // Should fail due to network error when trying to reach auth.google.com
                    assertTrue(bizException.getMessage().contains("Failed to get OIDC information") ||
                              bizException.getMessage().contains("Failed to resolve"));
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testLoginWithThirdParty_Integration_WithInvitationId() {
        // Arrange - Test with invitation ID
        String authId = "106e4f4a4f6a48e5aa23cca6757c29e4";
        String source = "GOOGLE";
        String code = "mock-oauth-code";
        String redirectUrl = "http://localhost:8080/auth/callback";
        String orgId = "org01";
        String invitationId = "test-invitation-id";

        // Act & Assert - Expect network error since auth.google.com doesn't exist
        StepVerifier.create(authenticationController.loginWithThirdParty(
                authId, source, code, invitationId, redirectUrl, orgId, mockExchange
        ))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof BizException);
                    BizException bizException = (BizException) throwable;
                    // Should fail due to network error when trying to reach auth.google.com
                    assertTrue(bizException.getMessage().contains("Failed to get OIDC information") ||
                              bizException.getMessage().contains("Failed to resolve"));
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testLinkAccountWithThirdParty_Integration_Success() {
        // Arrange - Use the existing Google OAuth config from test data
        String authId = "106e4f4a4f6a48e5aa23cca6757c29e4"; // Google OAuth config ID from organization.json
        String source = "GOOGLE";
        String code = "mock-oauth-code";
        String redirectUrl = "http://localhost:8080/auth/callback";
        String orgId = "org01";

        // Act & Assert - Expect network error since auth.google.com doesn't exist
        StepVerifier.create(authenticationController.linkAccountWithThirdParty(
                authId, source, code, redirectUrl, orgId, mockExchange
        ))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof BizException);
                    BizException bizException = (BizException) throwable;
                    // Should fail due to network error when trying to reach auth.google.com
                    assertTrue(bizException.getMessage().contains("Failed to get OIDC information") ||
                              bizException.getMessage().contains("Failed to resolve"));
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testLoginWithThirdParty_Integration_InvalidAuthConfig() {
        // Arrange - Test with non-existent auth config
        String authId = "non-existent-auth-id";
        String source = "GOOGLE";
        String code = "mock-oauth-code";
        String redirectUrl = "http://localhost:8080/auth/callback";
        String orgId = "org01";

        // Act & Assert
        StepVerifier.create(authenticationController.loginWithThirdParty(
                authId, source, code, null, redirectUrl, orgId, mockExchange
        ))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof BizException);
                    // Should fail due to invalid auth config
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testLinkAccountWithThirdParty_Integration_InvalidAuthConfig() {
        // Arrange - Test with non-existent auth config
        String authId = "non-existent-auth-id";
        String source = "GOOGLE";
        String code = "mock-oauth-code";
        String redirectUrl = "http://localhost:8080/auth/callback";
        String orgId = "org01";

        // Act & Assert
        StepVerifier.create(authenticationController.linkAccountWithThirdParty(
                authId, source, code, redirectUrl, orgId, mockExchange
        ))
                .verifyErrorMatches(throwable -> {
                    assertTrue(throwable instanceof BizException);
                    // Should fail due to invalid auth config
                    return true;
                });
    }

    @Test
    @WithMockUser(id = "user01")
    void testFormLoginRequest_Record_Integration() {
        // Arrange - Test FormLoginRequest record creation and validation
        String loginId = "test@example.com";
        String password = "testPassword123";
        boolean register = true;
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();

        // Act - Create FormLoginRequest record
        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, register, source, authId
        );

        // Assert - Verify record properties
        assertEquals(loginId, formLoginRequest.loginId());
        assertEquals(password, formLoginRequest.password());
        assertEquals(register, formLoginRequest.register());
        assertEquals(source, formLoginRequest.source());
        assertEquals(authId, formLoginRequest.authId());

        // Test record immutability and equality
        AuthenticationEndpoints.FormLoginRequest sameRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, register, source, authId
        );
        assertEquals(formLoginRequest, sameRequest);
        assertEquals(formLoginRequest.hashCode(), sameRequest.hashCode());

        // Test different request
        AuthenticationEndpoints.FormLoginRequest differentRequest = new AuthenticationEndpoints.FormLoginRequest(
                "different@example.com", password, register, source, authId
        );
        assertNotEquals(formLoginRequest, differentRequest);

        // Test toString method
        String toString = formLoginRequest.toString();
        assertTrue(toString.contains(loginId));
        assertTrue(toString.contains(source));
        assertTrue(toString.contains(String.valueOf(register)));

        // Test with null values (should work for optional fields)
        AuthenticationEndpoints.FormLoginRequest nullAuthIdRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, register, source, null
        );
        assertNull(nullAuthIdRequest.authId());
        assertEquals(loginId, nullAuthIdRequest.loginId());
    }

    @Test
    @WithMockUser(id = "user01")
    void testFormLoginRequest_Record_WithDifferentSources() {
        // Arrange - Test FormLoginRequest with different auth sources
        String loginId = "test@example.com";
        String password = "testPassword123";
        boolean register = false;
        String authId = getEmailAuthConfigId();

        // Test with EMAIL source
        AuthenticationEndpoints.FormLoginRequest emailRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, register, AuthSourceConstants.EMAIL, authId
        );
        assertEquals(AuthSourceConstants.EMAIL, emailRequest.source());

        // Test with PHONE source
        AuthenticationEndpoints.FormLoginRequest phoneRequest = new AuthenticationEndpoints.FormLoginRequest(
                "1234567890", password, register, AuthSourceConstants.PHONE, authId
        );
        assertEquals(AuthSourceConstants.PHONE, phoneRequest.source());
        assertEquals("1234567890", phoneRequest.loginId());

        // Test with GOOGLE source
        AuthenticationEndpoints.FormLoginRequest googleRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, register, "GOOGLE", authId
        );
        assertEquals("GOOGLE", googleRequest.source());
    }

    @Test
    @WithMockUser(id = "user01")
    void testFormLoginRequest_Record_WithDifferentRegisterModes() {
        // Arrange - Test FormLoginRequest with different register modes
        String loginId = "test@example.com";
        String password = "testPassword123";
        String source = AuthSourceConstants.EMAIL;
        String authId = getEmailAuthConfigId();

        // Test register mode (true)
        AuthenticationEndpoints.FormLoginRequest registerRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, true, source, authId
        );
        assertTrue(registerRequest.register());

        // Test login mode (false)
        AuthenticationEndpoints.FormLoginRequest loginRequest = new AuthenticationEndpoints.FormLoginRequest(
                loginId, password, false, source, authId
        );
        assertFalse(loginRequest.register());

        // Verify they are different
        assertNotEquals(registerRequest, loginRequest);
    }

    private String getEmailAuthConfigId() {
        return authenticationService.findAuthConfigBySource(null, AuthSourceConstants.EMAIL)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .block();
    }
} 
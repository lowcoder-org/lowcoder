package org.lowcoder.api.authentication;

import org.junit.jupiter.api.AfterEach;
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
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.lowcoder.sdk.exception.BizError.INVALID_PASSWORD;
import org.lowcoder.domain.user.model.Connection;

@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthenticationEndpointsIntegrationTest {

    /** The client id of the GitHub config the disable test adds (a GitHub config requires one). */
    private static final String DISABLE_TEST_CLIENT_ID = "disable-test-client-id";
    /** The id of the config the disable test adds and then disables. */
    private static final String DISABLE_TEST_CONFIG_ID = "disable-test";
    /** The client id of the GOOGLE configs the duplicate test adds (a GOOGLE config requires one). */
    private static final String DUPLICATE_TEST_CLIENT_ID = "duplicate-test-client-id";

    // GH-03 (#2194): one user per case, so that no other test's keys interfere and InitData never has to reset them.
    // The ids hold no hyphen: FieldName.guessFieldNameFromId reads an id with one as a gid, and UserService.update would not find the user.
    private static final String ONLY_KEY_USER_ID = "usergh03onlykey";
    private static final String NO_KEYS_USER_ID = "usergh03nokeys";
    private static final String TWO_KEYS_USER_ID = "usergh03twokeys";
    private static final String PARTIAL_UPDATE_USER_ID = "usergh03partialupdate";
    private static final List<String> GH03_USER_IDS =
            List.of(ONLY_KEY_USER_ID, NO_KEYS_USER_ID, TWO_KEYS_USER_ID, PARTIAL_UPDATE_USER_ID);
    private static final String UNKNOWN_KEY_ID = "gh03-no-such-key";
    /** The name of the stored field that holds a user's API keys (User.apiKeys). */
    private static final String STORED_API_KEYS_FIELD = "apiKeys";
    private static final String GH03_USER_NAME = "GH-03 user";
    private static final String RENAMED_USER_NAME = "GH-03 renamed";
    private static final String KEY_NAME_FIRST = "gh03 first key";
    private static final String KEY_NAME_SECOND = "gh03 second key";
    private static final String KEY_DESCRIPTION = "created by a GH-03 case";
    private static final int NO_KEYS = 0;
    private static final String GH03_LOG = "[GH-03] ";

    @Autowired
    private AuthenticationController authenticationController;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @Autowired
    private InitData initData;

    @Autowired
    private CookieHelper cookieHelper;

    @Autowired
    private UserService userService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    private ReactiveMongoTemplate reactiveMongoTemplate;

    private ServerWebExchange mockExchange;

    @BeforeEach
    void setUp() {
        initData.init();
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
        // Arrange - the cookie name must be the configured one, otherwise getCookieToken returns "" and this
        // exercises nothing
        String cookieName = cookieHelper.getCookieName();
        MockServerHttpRequest request = MockServerHttpRequest.post("")
                .cookie(ResponseCookie.from(cookieName, "test-session-token").build())
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

        ResponseCookie clearedCookie = exchangeWithCookie.getResponse().getCookies().getFirst(cookieName);
        assertNotNull(clearedCookie);
        assertEquals("", clearedCookie.getValue());
        assertEquals(Duration.ZERO, clearedCookie.getMaxAge());
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
        // Arrange - First enable an auth config with a known id, so that the disable acts on it. Its type is one no other
        // test adds to org01: an organization may have one config per type (BF-087), and
        // testEnableAuthConfig_Integration_Success adds a FORM config to the same organization
        String configId = DISABLE_TEST_CONFIG_ID;
        AuthConfigRequest authConfigRequest = new AuthConfigRequest();
        authConfigRequest.put("id", configId);
        authConfigRequest.put("authType", AuthTypeConstants.GITHUB);
        authConfigRequest.put("clientId", DISABLE_TEST_CLIENT_ID);
        authConfigRequest.put("source", "disable-test");
        authConfigRequest.put("sourceName", "Test Auth to Disable");
        authConfigRequest.put("enableRegister", true);

        authenticationController.enableAuthConfig(authConfigRequest).block();

        // Act
        Mono<ResponseView<Void>> result = authenticationController.disableAuthConfig(configId, false);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        List<AbstractAuthConfig> configs = authenticationController.getAllConfigs().block().getData();
        System.out.println("[AuthenticationEndpointsIntegrationTest] configs after the disable: "
                + configs.stream().map(config -> config.getId() + " enable=" + config.isEnable()).toList());
        assertTrue(configs.stream().anyMatch(config -> configId.equals(config.getId()) && !config.isEnable()),
                "the added config is disabled");
    }

    /**
     * BF-087: through the controller, a second new config (no id) of a type the organization already has is refused with
     * DUPLICATE_AUTH_CONFIG_ADDITION, an HTTP 400; the type is one no other test adds to org01.
     */
    @Test
    @WithMockUser(id = "user01")
    void testEnableAuthConfig_secondNewConfigOfAType_isRefusedAsADuplicateBF087() {
        AuthConfigRequest first = new AuthConfigRequest();
        first.put("authType", AuthTypeConstants.GOOGLE);
        first.put("clientId", DUPLICATE_TEST_CLIENT_ID);
        AuthConfigRequest second = new AuthConfigRequest();
        second.putAll(first);

        StepVerifier.create(authenticationController.enableAuthConfig(first))
                .assertNext(response -> assertTrue(response.isSuccess()))
                .verifyComplete();
        StepVerifier.create(authenticationController.enableAuthConfig(second))
                .verifyErrorSatisfies(error -> {
                    System.out.println("[AuthenticationEndpointsIntegrationTest] second new GOOGLE config -> " + error);
                    BizException bizException = assertInstanceOf(BizException.class, error);
                    assertEquals(BizError.DUPLICATE_AUTH_CONFIG_ADDITION, bizException.getError());
                    assertEquals(HttpStatus.BAD_REQUEST.value(), bizException.getError().getHttpErrorCode());
                });
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

    // ---------------------------------------------------------------------------------------------------------------
    // GH-03 (lowcoder-org/lowcoder#2194): deleting a user's last API key. Each case has its own user. The principal of a
    // @WithMockUser case is one User object that keeps the in-place changes of earlier calls and starts without the key
    // fields a production request reads from Mongo, so loadKeysAsANewRequestWould copies both of them first.
    // ---------------------------------------------------------------------------------------------------------------

    @AfterEach
    void removeGh03Users() {
        GH03_USER_IDS.forEach(id -> userRepository.deleteById(id).block());
    }

    private void freshUserWithoutKeys(String userId) {
        userRepository.deleteById(userId).block();
        userRepository.save(User.builder().id(userId).name(GH03_USER_NAME).state(UserState.ACTIVATED).build()).block();
    }

    private APIKeyVO createKey(String name) {
        APIKeyRequest request = new APIKeyRequest();
        request.put("name", name);
        request.put("description", KEY_DESCRIPTION);
        return authenticationController.createAPIKey(request).block().getData();
    }

    /** The ids of the keys stored for the user, read from Mongo. */
    private List<String> storedKeyIds(String userId) {
        User stored = userRepository.findById(userId).block();
        System.out.println(GH03_LOG + "stored apiKeys of " + userId + ": "
                + (stored.getApiKeys() == null ? "absent" : String.valueOf(stored.getApiKeys().size()))
                + ", read as " + stored.getApiKeysList().size() + " key(s)");
        return CollectionUtils.emptyIfNull(stored.getApiKeysList()).stream().map(APIKey::getId).toList();
    }

    /** The stored document's apiKeys field as it is in Mongo: empty when the key is absent, otherwise the list. */
    private Optional<List<?>> rawStoredApiKeys(String userId) {
        Document document = reactiveMongoTemplate
                .findById(userId, Document.class, reactiveMongoTemplate.getCollectionName(User.class)).block();
        boolean present = document.containsKey(STORED_API_KEYS_FIELD);
        System.out.println(GH03_LOG + "raw document of " + userId + ": " + STORED_API_KEYS_FIELD + " "
                + (present ? "present, value " + document.get(STORED_API_KEYS_FIELD) : "absent"));
        return present ? Optional.of((List<?>) document.get(STORED_API_KEYS_FIELD)) : Optional.empty();
    }

    /** What APIKeyAuthFilter asks for a bearer token: does a stored key of this user carry this token? */
    private boolean tokenAuthenticates(String userId, String token) {
        boolean authenticates = sessionUserService
                .resolveSessionUserForJWT(jwtUtils.parseJwtClaims(token), token)
                .blockOptional()
                .map(user -> Objects.equals(user.getId(), userId))
                .orElse(false);
        System.out.println(GH03_LOG + "token authenticates for " + userId + ": " + authenticates);
        return authenticates;
    }

    /** A production request starts with both key fields read from Mongo; this principal keeps earlier in-place changes. */
    private void loadKeysAsANewRequestWould(String userId) {
        User principal = sessionUserService.getVisitor().block();
        User stored = userRepository.findById(userId).block();
        principal.setApiKeysList(stored.getApiKeysList());
        principal.setApiKeys(stored.getApiKeys());
    }

    @Test
    @WithMockUser(id = ONLY_KEY_USER_ID)
    void testDeleteAPIKey_onlyKey_isRemovedAndItsTokenRevokedGH03() {
        freshUserWithoutKeys(ONLY_KEY_USER_ID);
        APIKeyVO key = createKey(KEY_NAME_FIRST);
        assertEquals(List.of(key.getId()), storedKeyIds(ONLY_KEY_USER_ID), "precondition: the created key is stored");
        assertTrue(tokenAuthenticates(ONLY_KEY_USER_ID, key.getToken()), "precondition: the created key's token authenticates");

        loadKeysAsANewRequestWould(ONLY_KEY_USER_ID);
        ResponseView<Void> response = authenticationController.deleteAPIKey(key.getId()).block();
        assertTrue(response.isSuccess(), "the delete answers success");

        Optional<List<?>> raw = rawStoredApiKeys(ONLY_KEY_USER_ID);
        List<String> stored = storedKeyIds(ONLY_KEY_USER_ID);
        boolean authenticates = tokenAuthenticates(ONLY_KEY_USER_ID, key.getToken());
        loadKeysAsANewRequestWould(ONLY_KEY_USER_ID);
        List<String> listed = authenticationController.getAllAPIKeys().block().getData().stream().map(APIKey::getId).toList();
        assertAll(
                () -> assertEquals(NO_KEYS, stored.size(), "the deleted last key is still stored"),
                () -> assertTrue(raw.isPresent() && raw.get().isEmpty(), "the stored field is not an empty array: " + raw),
                () -> assertFalse(authenticates, "the deleted last key's token still authenticates"),
                () -> assertEquals(NO_KEYS, listed.size(), "the next listing shows the deleted key again: " + listed)
        );
    }

    @Test
    @WithMockUser(id = NO_KEYS_USER_ID)
    void testDeleteAPIKey_unknownIdOfAUserWithoutKeys_succeedsAndStoresAnEmptyListGH03() {
        freshUserWithoutKeys(NO_KEYS_USER_ID);
        assertTrue(rawStoredApiKeys(NO_KEYS_USER_ID).isEmpty(), "precondition: a user saved without keys has no stored apiKeys field");

        ResponseView<Void> response = authenticationController.deleteAPIKey(UNKNOWN_KEY_ID).block();
        assertTrue(response.isSuccess(), "the delete of an unknown id answers success");

        Optional<List<?>> raw = rawStoredApiKeys(NO_KEYS_USER_ID);
        List<String> stored = storedKeyIds(NO_KEYS_USER_ID);
        assertAll(
                () -> assertTrue(raw.isPresent() && raw.get().isEmpty(), "the stored field is not an empty array: " + raw),
                () -> assertEquals(NO_KEYS, stored.size(), "the user has no keys")
        );
    }

    @Test
    @WithMockUser(id = TWO_KEYS_USER_ID)
    void testDeleteAPIKey_oneOfTwoKeys_keepsTheOtherGH03() {
        freshUserWithoutKeys(TWO_KEYS_USER_ID);
        APIKeyVO first = createKey(KEY_NAME_FIRST);
        loadKeysAsANewRequestWould(TWO_KEYS_USER_ID);
        APIKeyVO second = createKey(KEY_NAME_SECOND);
        assertEquals(2, storedKeyIds(TWO_KEYS_USER_ID).size(), "precondition: both keys are stored");

        loadKeysAsANewRequestWould(TWO_KEYS_USER_ID);
        assertTrue(authenticationController.deleteAPIKey(first.getId()).block().isSuccess(), "the delete answers success");

        List<String> stored = storedKeyIds(TWO_KEYS_USER_ID);
        assertAll(
                () -> assertEquals(List.of(second.getId()), stored, "exactly the other key is stored"),
                () -> assertTrue(tokenAuthenticates(TWO_KEYS_USER_ID, second.getToken()), "the other key's token authenticates")
        );
    }

    @Test
    @WithMockUser(id = PARTIAL_UPDATE_USER_ID)
    void testPartialUserUpdate_leavesTheApiKeysAloneGH03() {
        freshUserWithoutKeys(PARTIAL_UPDATE_USER_ID);
        APIKeyVO key = createKey(KEY_NAME_FIRST);

        User partial = new User();
        partial.setName(RENAMED_USER_NAME);
        userService.update(PARTIAL_UPDATE_USER_ID, partial).block();

        User stored = userRepository.findById(PARTIAL_UPDATE_USER_ID).block();
        assertAll(
                () -> assertEquals(RENAMED_USER_NAME, stored.getName(), "the partial update was applied"),
                () -> assertEquals(List.of(key.getId()), storedKeyIds(PARTIAL_UPDATE_USER_ID), "the key survives the partial update"),
                () -> assertTrue(tokenAuthenticates(PARTIAL_UPDATE_USER_ID, key.getToken()), "the key's token still authenticates")
        );
    }
}

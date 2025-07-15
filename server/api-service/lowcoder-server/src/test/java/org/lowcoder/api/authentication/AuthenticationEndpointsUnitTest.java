package org.lowcoder.api.authentication;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationEndpointsUnitTest {

    @Mock
    private AuthenticationApiService authenticationApiService;
    
    @Mock
    private SessionUserService sessionUserService;
    
    @Mock
    private CookieHelper cookieHelper;
    
    @Mock
    private BusinessEventPublisher businessEventPublisher;
    
    @Mock
    private UserService userService;

    private AuthenticationController authenticationController;
    private ServerWebExchange mockExchange;

    @BeforeEach
    void setUp() {
        authenticationController = new AuthenticationController(
                authenticationApiService,
                sessionUserService,
                cookieHelper,
                businessEventPublisher,
                userService
        );
        
        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        mockExchange = MockServerWebExchange.builder(request).build();
    }

    @Test
    void testFormLogin_Success() {
        // Arrange
        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                "test@example.com", "password", false, "email", "authId"
        );
        AuthUser mockAuthUser = mock(AuthUser.class);
        
        when(authenticationApiService.authenticateByForm(
                eq("test@example.com"), eq("password"), eq("email"), 
                eq(false), eq("authId"), eq("orgId")
        )).thenReturn(Mono.just(mockAuthUser));
        
        when(authenticationApiService.loginOrRegister(
                eq(mockAuthUser), eq(mockExchange), eq("invitationId"), eq(false)
        )).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.formLogin(
                formLoginRequest, "invitationId", "orgId", mockExchange
        );

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(authenticationApiService).authenticateByForm(
                "test@example.com", "password", "email", false, "authId", "orgId"
        );
        verify(authenticationApiService).loginOrRegister(mockAuthUser, mockExchange, "invitationId", false);
    }

    @Test
    void testFormLogin_RegisterMode() {
        // Arrange
        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(
                "new@example.com", "password", true, "email", "authId"
        );
        AuthUser mockAuthUser = mock(AuthUser.class);
        
        when(authenticationApiService.authenticateByForm(
                eq("new@example.com"), eq("password"), eq("email"), 
                eq(true), eq("authId"), isNull()
        )).thenReturn(Mono.just(mockAuthUser));
        
        when(authenticationApiService.loginOrRegister(
                eq(mockAuthUser), eq(mockExchange), isNull(), eq(false)
        )).thenReturn(Mono.empty());

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
    }

    @Test
    void testLoginWithThirdParty_Success() {
        // Arrange
        AuthUser mockAuthUser = mock(AuthUser.class);
        
        when(authenticationApiService.authenticateByOauth2(
                eq("authId"), eq("google"), eq("code"), eq("redirectUrl"), eq("orgId")
        )).thenReturn(Mono.just(mockAuthUser));
        
        when(authenticationApiService.loginOrRegister(
                eq(mockAuthUser), eq(mockExchange), eq("invitationId"), eq(false)
        )).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.loginWithThirdParty(
                "authId", "google", "code", "invitationId", "redirectUrl", "orgId", mockExchange
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
    void testLinkAccountWithThirdParty_Success() {
        // Arrange
        AuthUser mockAuthUser = mock(AuthUser.class);
        
        when(authenticationApiService.authenticateByOauth2(
                eq("authId"), eq("github"), eq("code"), eq("redirectUrl"), eq("orgId")
        )).thenReturn(Mono.just(mockAuthUser));
        
        when(authenticationApiService.loginOrRegister(
                eq(mockAuthUser), eq(mockExchange), isNull(), eq(true)
        )).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.linkAccountWithThirdParty(
                "authId", "github", "code", "redirectUrl", "orgId", mockExchange
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
    void testLogout_Success() {
        // Arrange
        when(cookieHelper.getCookieToken(mockExchange)).thenReturn("sessionToken");
        when(sessionUserService.removeUserSession("sessionToken")).thenReturn(Mono.empty());
        when(businessEventPublisher.publishUserLogoutEvent()).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<Boolean>> result = authenticationController.logout(mockExchange);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();
        
        verify(cookieHelper).getCookieToken(mockExchange);
        verify(sessionUserService).removeUserSession("sessionToken");
        verify(businessEventPublisher).publishUserLogoutEvent();
    }

    @Test
    void testEnableAuthConfig_Success() {
        // Arrange
        AuthConfigRequest authConfigRequest = new AuthConfigRequest();
        authConfigRequest.put("authType", "FORM");
        authConfigRequest.put("source", "email");
        
        when(authenticationApiService.enableAuthConfig(authConfigRequest)).thenReturn(Mono.just(true));

        // Act
        Mono<ResponseView<Void>> result = authenticationController.enableAuthConfig(authConfigRequest);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(authenticationApiService).enableAuthConfig(authConfigRequest);
    }

    @Test
    void testDisableAuthConfig_Success() {
        // Arrange
        when(authenticationApiService.disableAuthConfig("authId", true)).thenReturn(Mono.just(true));

        // Act
        Mono<ResponseView<Void>> result = authenticationController.disableAuthConfig("authId", true);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(authenticationApiService).disableAuthConfig("authId", true);
    }

    @Test
    void testGetAllConfigs_Success() {
        // Arrange
        EmailAuthConfig emailConfig = new EmailAuthConfig("email", true, true);
        List<AbstractAuthConfig> configs = List.of(emailConfig);
        
        when(authenticationApiService.findAuthConfigs(false))
                .thenReturn(reactor.core.publisher.Flux.fromIterable(
                        configs.stream().map(config -> new org.lowcoder.domain.authentication.FindAuthConfig(config, null)).toList()
                ));

        // Act
        Mono<ResponseView<List<AbstractAuthConfig>>> result = authenticationController.getAllConfigs();

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(1, response.getData().size());
                    assertEquals(emailConfig, response.getData().get(0));
                })
                .verifyComplete();
    }

    @Test
    void testCreateAPIKey_Success() {
        // Arrange
        APIKeyRequest apiKeyRequest = new APIKeyRequest();
        apiKeyRequest.put("name", "Test API Key");
        apiKeyRequest.put("description", "Test Description");
        
        APIKeyVO mockApiKeyVO = mock(APIKeyVO.class);
        when(authenticationApiService.createAPIKey(apiKeyRequest)).thenReturn(Mono.just(mockApiKeyVO));

        // Act
        Mono<ResponseView<APIKeyVO>> result = authenticationController.createAPIKey(apiKeyRequest);

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(mockApiKeyVO, response.getData());
                })
                .verifyComplete();
        
        verify(authenticationApiService).createAPIKey(apiKeyRequest);
    }

    @Test
    void testDeleteAPIKey_Success() {
        // Arrange
        when(authenticationApiService.deleteAPIKey("apiKeyId")).thenReturn(Mono.empty());

        // Act
        Mono<ResponseView<Void>> result = authenticationController.deleteAPIKey("apiKeyId");

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertNull(response.getData());
                })
                .verifyComplete();
        
        verify(authenticationApiService).deleteAPIKey("apiKeyId");
    }

    @Test
    void testGetAllAPIKeys_Success() {
        // Arrange
        APIKey apiKey1 = APIKey.builder().id("key1").name("Key 1").build();
        APIKey apiKey2 = APIKey.builder().id("key2").name("Key 2").build();
        List<APIKey> apiKeys = List.of(apiKey1, apiKey2);
        
        when(authenticationApiService.findAPIKeys())
                .thenReturn(reactor.core.publisher.Flux.fromIterable(apiKeys));

        // Act
        Mono<ResponseView<List<APIKey>>> result = authenticationController.getAllAPIKeys();

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(2, response.getData().size());
                    assertEquals(apiKey1, response.getData().get(0));
                    assertEquals(apiKey2, response.getData().get(1));
                })
                .verifyComplete();
    }

    @Test
    void testBindEmail_Success() {
        // Arrange
        User mockUser = mock(User.class);
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(mockUser));
        when(userService.bindEmail(mockUser, "test@example.com")).thenReturn(Mono.just(true));

        // Act
        Mono<ResponseView<?>> result = authenticationController.bindEmail("test@example.com");

        // Assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertEquals(true, response.getData());
                })
                .verifyComplete();
        
        verify(sessionUserService).getVisitor();
        verify(userService).bindEmail(mockUser, "test@example.com");
    }

    @Test
    void testFormLoginRequest_Record() {
        // Arrange & Act
        AuthenticationEndpoints.FormLoginRequest request = new AuthenticationEndpoints.FormLoginRequest(
                "test@example.com", "password", false, "email", "authId"
        );

        // Assert
        assertEquals("test@example.com", request.loginId());
        assertEquals("password", request.password());
        assertFalse(request.register());
        assertEquals("email", request.source());
        assertEquals("authId", request.authId());
    }
} 
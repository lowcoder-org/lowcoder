package org.lowcoder.api.authentication;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.google.common.collect.Iterables;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.GlobalContext;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * This class is for testing GenericAuth feature
 */
@ActiveProfiles("testGeneric")
@SpringBootTest
//@RunWith(SpringRunner.class)
@WireMockTest
@ExtendWith(MockitoExtension.class)
@Slf4j
public class GenericAuthenticateTest {

    @Autowired
    private AuthenticationController authenticationController;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthenticationService authenticationService;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private InitData initData;

    @BeforeEach
    public void beforeEach() {
        initData.init();
    }
    @Test
    @WithMockUser
    public void testGoogleLoginSuccess(WireMockRuntimeInfo wmRuntimeInfo) {
        log.info("Running mock server on port: {}", wmRuntimeInfo.getHttpPort());
        //Begin mocking services
        HashMap<String, String> sourceMappings = new HashMap<String, String>();
        sourceMappings.put("jwt", "id_token");
        sourceMappings.put("uid", "sub");
        sourceMappings.put("username", "name");
        sourceMappings.put("email", "email");
        sourceMappings.put("avatar", "picture");
        var authConfig = Oauth2GenericAuthConfig.builder()
                .source(AuthSourceConstants.GOOGLE)
                .sourceName(AuthSourceConstants.GOOGLE_NAME)
                .enable(true)
                .enableRegister(true)
                .authType(AuthTypeConstants.GENERIC)
                .clientId("clientid")
                .clientSecret("clientsecret")
                .sourceDescription("Google Auth")
                .sourceIcon("")
                .sourceCategory("cat")
                .issuerUri("http://google.com")
                .authorizationEndpoint(wmRuntimeInfo.getHttpBaseUrl() + "/oauth2/v4/token")
                .tokenEndpoint(wmRuntimeInfo.getHttpBaseUrl() + "/oauth2/v4/token")
                .userInfoEndpoint(wmRuntimeInfo.getHttpBaseUrl() + "/oauth2/v2/userinfo")
                .scope("scope")
                .sourceMappings(sourceMappings)
                .userInfoIntrospection(true)
                .userCanSelectAccounts(true)
                .build();

        var organization = Organization.builder()
                .id("org01")
                .build();
        var mockAuthConfig = new FindAuthConfig(authConfig, organization);
        Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));
        Mockito.when(authenticationService.findAuthConfigBySource(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));

        stubFor(post(urlPathEqualTo("/oauth2/v4/token"))
                .willReturn(okJson("{\"access_token\":\"ya29.a0AfH6SMB...\",\"expires_in\":3600,\"token_type\":\"Bearer\",\"scope\":\"https://www.googleapis.com/auth/userinfo.profile\",\"id_token\": \"eyJhbGciOiJSUzI1NiIsImtpZCI6IjNkNTgwZjBhZjdhY2U2OThhMGNlZTdmMjMwYmNhNTk0ZGM2ZGJiNTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyMjIwMTc1NDgwNzYtcWU1bzBnbWxiMjRtcHRmanE5aGlwazRzNHFvcnN2OGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjIwMTc1NDgwNzYtcWU1bzBnbWxiMjRtcHRmanE5aGlwazRzNHFvcnN2OGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMyNDk5MjY4NDI2Mzg2NDkzNzEiLCJhdF9oYXNoIjoiblRwVUJzamRXbnlMcDZfM2RsM2MxUSIsIm5hbWUiOiJUZWNoIE5pbmphIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xfS3Z5OXI5SVVibVoySmRlSnJwUUpOY2pUbGhqdHpEY2hvVlJabVdrUkxUUEozOTg9czk2LWMiLCJnaXZlbl9uYW1lIjoiVGVjaCIsImZhbWlseV9uYW1lIjoiTmluamEiLCJpYXQiOjE3MTg4MDUwNzQsImV4cCI6MTcxODgwODY3NH0.UiT0D77_jG5cwAHNZFOT-M2tX-ht2EztOSqZKDfEU7P1-Y6cv0CTESvueI7DC6M_5l942UxXnNBE5SCYluQGNNBg6gLU_lpLNoUnfVUE2ocPjKIxSZeTwyCxYbCtOGL7G5BdWAk-dJhyAudzG3_lLSuz8M7XgomWPC1s7Z5uaD8TH5BdNclV-3kYzNV0CtOPxQ00eAtHhi3MUswTCdwb0cFQl_2GXRdLiXjBGzBY4fe_tarihMDjXXXFrxHsIiB-VcLKWBfl8vRvMxR4Rb\"}")));
        stubFor(get(urlPathEqualTo("/oauth2/v2/userinfo"))
                .willReturn(okJson("{\"sub\":\"user001\",\"email\":\"test_register@ob.dev\",\"name\":\"Tech Ninja\"}")));
        //

        String source = AuthSourceConstants.GOOGLE;
        String code = "test-code-123456";
        String orgId = "org01";
        String redirectUrl = "https://test.com";

        String uid = "user001";

        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        var authId = getGenericAuthConfigId(orgId).block();
        Mono<User> userMono = authenticationController.loginWithThirdParty(authId, source, code, null, redirectUrl, orgId, exchange).hasElement()
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source, uid));

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals("Tech Ninja", user.getName());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertEquals(1, user.getConnections().size());
                    assertTrue(user.getIsEnabled());
                })
                .verifyComplete();

        String email = "test_register@ob.dev";
        String password = "lowcoder";
        String source1 = AuthSourceConstants.EMAIL;

        var authConfig1 = new EmailAuthConfig(AuthSourceConstants.EMAIL, true, true);

        mockAuthConfig = new FindAuthConfig(authConfig1, organization);
        Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));
        Mockito.when(authenticationService.findAuthConfigBySource(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));

        String authId1 = getEmailAuthConfigId();
        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(email, password, true, source1, authId1);
        MockServerHttpRequest request1 = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange1 = MockServerWebExchange.builder(request1).build();

        Mono<User> userMono1 = authenticationController.formLogin(formLoginRequest, null, null, exchange1)
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source1, email));

        StepVerifier.create(userMono1)
                .assertNext(user -> {
                    assertEquals(email, user.getEmail());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertTrue(user.getIsEnabled());
                    assertTrue(encryptionService.matchPassword(password, user.getPassword()));
                    assertFalse(user.getIsAnonymous());
                    assertFalse(user.getIsNewUser());//
                    assertFalse(user.isHasSetNickname());
                    assertNotNull(user.getId());
                    //connections
                    assertEquals(2, user.getConnections().size());
                    Connection connection = Iterables.getLast(user.getConnections(), null);
                    assertNotNull(connection);
                    assertEquals(authId1, connection.getAuthId());
                    assertEquals(source1, connection.getSource());
                    assertEquals(email, connection.getRawId());
                    assertEquals(email, connection.getName());
                    assertNull(connection.getAvatar());
                    assertEquals(1, connection.getOrgIds().size());
                    assertNull(connection.getAuthConnectionAuthToken());
                    assertEquals(Map.of("email", email), connection.getRawUserInfo());
                })
                .verifyComplete();

        Mockito.framework().clearInlineMocks();
    }

    private String getEmailAuthConfigId() {
        return authenticationService.findAuthConfigBySource(null, AuthSourceConstants.EMAIL)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .contextWrite(Context.of(GlobalContext.DOMAIN, "avengers.com"))
                .block();
    }

    private Mono<String> getGenericAuthConfigId(String orgId) {
        return authenticationService.findAuthConfigBySource(orgId, AuthSourceConstants.GOOGLE)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .contextWrite(Context.of(GlobalContext.DOMAIN, "avengers.com"));
    }
}

package org.lowcoder.api.authentication;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.GlobalContext;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.util.HashMap;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
                .build();

        var organization = Organization.builder().build();
        var mockAuthConfig = new FindAuthConfig(authConfig, organization);
        Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));
        Mockito.when(authenticationService.findAuthConfigBySource(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));

        stubFor(post(urlPathEqualTo("/oauth2/v4/token"))
                .willReturn(okJson("{\"access_token\":\"ya29.a0AfH6SMB...\",\"expires_in\":3600,\"token_type\":\"Bearer\",\"scope\":\"https://www.googleapis.com/auth/userinfo.profile\",\"id_token\": \"eyJhbGciOiJSUzI1NiIsImtpZCI6IjNkNTgwZjBhZjdhY2U2OThhMGNlZTdmMjMwYmNhNTk0ZGM2ZGJiNTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyMjIwMTc1NDgwNzYtcWU1bzBnbWxiMjRtcHRmanE5aGlwazRzNHFvcnN2OGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjIwMTc1NDgwNzYtcWU1bzBnbWxiMjRtcHRmanE5aGlwazRzNHFvcnN2OGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMyNDk5MjY4NDI2Mzg2NDkzNzEiLCJhdF9oYXNoIjoiblRwVUJzamRXbnlMcDZfM2RsM2MxUSIsIm5hbWUiOiJUZWNoIE5pbmphIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xfS3Z5OXI5SVVibVoySmRlSnJwUUpOY2pUbGhqdHpEY2hvVlJabVdrUkxUUEozOTg9czk2LWMiLCJnaXZlbl9uYW1lIjoiVGVjaCIsImZhbWlseV9uYW1lIjoiTmluamEiLCJpYXQiOjE3MTg4MDUwNzQsImV4cCI6MTcxODgwODY3NH0.UiT0D77_jG5cwAHNZFOT-M2tX-ht2EztOSqZKDfEU7P1-Y6cv0CTESvueI7DC6M_5l942UxXnNBE5SCYluQGNNBg6gLU_lpLNoUnfVUE2ocPjKIxSZeTwyCxYbCtOGL7G5BdWAk-dJhyAudzG3_lLSuz8M7XgomWPC1s7Z5uaD8TH5BdNclV-3kYzNV0CtOPxQ00eAtHhi3MUswTCdwb0cFQl_2GXRdLiXjBGzBY4fe_tarihMDjXXXFrxHsIiB-VcLKWBfl8vRvMxR4Rb\"}")));
        stubFor(get(urlPathEqualTo("/oauth2/v2/userinfo"))
                .willReturn(okJson("{\"sub\":\"user001\",\"email\":\"user001@gmail.com\"}")));
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
        Mockito.framework().clearInlineMocks();
    }

    private Mono<String> getGenericAuthConfigId(String orgId) {
        return authenticationService.findAuthConfigBySource(orgId, AuthSourceConstants.GOOGLE)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .contextWrite(Context.of(GlobalContext.DOMAIN, "avengers.com"));
    }
}

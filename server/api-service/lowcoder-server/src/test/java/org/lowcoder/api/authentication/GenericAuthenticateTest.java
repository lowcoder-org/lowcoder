package org.lowcoder.api.authentication;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * This class is for testing GenericAuth feature
 */
@ActiveProfiles("test")
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

    @Test
    @WithMockUser
    public void testGoogleLoginSuccess(WireMockRuntimeInfo wmRuntimeInfo) {
        log.info("Running mock server on port: {}", wmRuntimeInfo.getHttpPort());
        //Begin mocking services
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
                .userInfoIntrospection(true)
                .build();

        var organization = Organization.builder().build();
        var mockAuthConfig = new FindAuthConfig(authConfig, organization);
        Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));
        Mockito.when(authenticationService.findAuthConfigBySource(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));

        stubFor(post(urlPathEqualTo("/oauth2/v4/token"))
                .willReturn(okJson("{\"access_token\":\"ya29.a0AfH6SMB...\",\"expires_in\":3600,\"token_type\":\"Bearer\",\"scope\":\"https://www.googleapis.com/auth/userinfo.profile\"}")));
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
                    assertEquals("user001@gmail.com", user.getName());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertEquals(1, user.getConnections().size());
                    assertTrue(user.getIsEnabled());
                })
                .verifyComplete();
    }

    private Mono<String> getGenericAuthConfigId(String orgId) {
        return authenticationService.findAuthConfigBySource(orgId, AuthSourceConstants.GOOGLE)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .contextWrite(Context.of(GlobalContext.DOMAIN, "avengers.com"));
    }
}

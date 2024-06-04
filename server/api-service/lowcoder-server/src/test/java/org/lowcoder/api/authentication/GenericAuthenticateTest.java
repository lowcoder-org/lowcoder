package org.lowcoder.api.authentication;

import com.google.common.collect.Iterables;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.Oauth2AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.request.GenericAuthRequest;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.AuthenticationServiceImpl;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.*;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.GlobalContext;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.util.Objects;

import static org.junit.Assert.*;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;

/**
 * This class is for testing GenericAuth feature
 */
@SpringBootTest
@RunWith(SpringRunner.class)
public class GenericAuthenticateTest {

    @Autowired
    private AuthenticationController authenticationController;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthenticationService authenticationService;

    @Test
    @WithMockUser
    public void testGoogleLoginSuccess() {
        String source = AuthSourceConstants.GOOGLE;
        String code = "test-code-123456";
        String orgId = "org01";
        String redirectUrl = "https://test.com";

        GenericAuthRequest.setTest(true);
        String uid = "uId";

        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        var authId = getGenericAuthConfigId(orgId).block();
        Mono<User> userMono = authenticationController.loginWithThirdParty(authId, source, code, null, redirectUrl, orgId, exchange)
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source, uid));

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals("dummyname", user.getName());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertEquals(1, user.getConnections().size());
                    assertTrue(user.getIsEnabled());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGoogleLoginWithNoRefreshSuccess() {
        String source = AuthSourceConstants.GOOGLE;
        String code = "test-code-123456";
        String orgId = "org01";
        String redirectUrl = "https://test.com";

        GenericAuthRequest.setTest(true);
        GenericAuthRequest.setTestCase01(true);
        String uid = "uId";

        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        var authId = getGenericAuthConfigId(orgId).block();
        Mono<User> userMono = authenticationController.loginWithThirdParty(authId, source, code, null, redirectUrl, orgId, exchange)
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source, uid));

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals("dummyname", user.getName());
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

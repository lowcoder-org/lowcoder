package org.lowcoder.api.authentication;

import com.google.common.collect.Iterables;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.AuthenticationEndpoints.FormLoginRequest;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.lowcoder.sdk.exception.BizError.INVALID_PASSWORD;
import static org.lowcoder.sdk.exception.BizError.USER_LOGIN_ID_EXIST;

@SpringBootTest
//@RunWith(SpringRunner.class)
@ActiveProfiles("test")
public class AuthenticationControllerTest {

    /** matches common.cookie-name in src/test/resources/application.yml */
    private static final String SESSION_COOKIE_NAME = "UT-TACO-TOKEN";

    @Autowired
    private AuthenticationController authenticationController;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private AuthenticationService authenticationService;
    @Autowired
    private SessionUserService sessionUserService;

    @Test
    public void testFormRegisterSuccess() {
        String email = "test_register@ob.dev";
        String password = "lowcoder";
        String source = AuthSourceConstants.EMAIL;

        String authId = getEmailAuthConfigId();
        FormLoginRequest formLoginRequest = new FormLoginRequest(email, password, true, source, authId);
        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        Mono<User> userMono = authenticationController.formLogin(formLoginRequest, null, null, exchange)
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source, email));

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals(email, user.getName());
                    assertNull(user.getAvatar());
                    assertNull(user.getTpAvatarLink());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertTrue(user.getIsEnabled());
                    assertTrue(encryptionService.matchPassword(password, user.getPassword()));
                    assertFalse(user.getIsAnonymous());
                    assertFalse(user.getIsNewUser());//
                    assertFalse(user.isHasSetNickname());
                    assertNotNull(user.getId());
                    //connections
                    assertEquals(1, user.getConnections().size());
                    Connection connection = Iterables.getFirst(user.getConnections(), null);
                    assertNotNull(connection);
                    assertEquals(authId, connection.getAuthId());
                    assertEquals(source, connection.getSource());
                    assertEquals(email, connection.getRawId());
                    assertEquals(email, connection.getName());
                    assertNull(connection.getAvatar());
                    assertEquals(0, connection.getOrgIds().size());
                    assertNull(connection.getAuthConnectionAuthToken());
                    assertEquals(Map.of("email", email), connection.getRawUserInfo());
                    //exchange
                    MultiValueMap<String, ResponseCookie> cookies = exchange.getResponse().getCookies();
                    assertEquals(1, cookies.size());
                    assertTrue(cookies.containsKey(SESSION_COOKIE_NAME));
                    assertTrue(connection.getTokens().contains(Objects.requireNonNull(cookies.getFirst(SESSION_COOKIE_NAME)).getValue()));
                })
                .verifyComplete();
    }
    @Test
    public void testFormLoginSuccess() {
        String email = "test_login@ob.dev";
        String password = "lowcoder";
        String source = AuthSourceConstants.EMAIL;

        String authId = getEmailAuthConfigId();

        FormLoginRequest formRegisterRequest = new FormLoginRequest(email, password, true, source, authId);
        MockServerHttpRequest registerRequest = MockServerHttpRequest.post("").build();
        MockServerWebExchange registerExchange = MockServerWebExchange.builder(registerRequest).build();

        FormLoginRequest formLoginRequest = new FormLoginRequest(email, password, false, source, authId);
        MockServerHttpRequest loginRequest = MockServerHttpRequest.post("").build();
        MockServerWebExchange loginExchange = MockServerWebExchange.builder(loginRequest).build();

        Mono<User> userMono = authenticationController.formLogin(formRegisterRequest, null,null, registerExchange)
                .then(authenticationController.formLogin(formLoginRequest, null, null,loginExchange))
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source, email));

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals(email, user.getName());
                    assertNull(user.getAvatar());
                    assertNull(user.getTpAvatarLink());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertTrue(user.getIsEnabled());
                    assertTrue(encryptionService.matchPassword(password, user.getPassword()));
                    assertFalse(user.getIsAnonymous());
                    assertFalse(user.getIsNewUser());//
                    assertFalse(user.isHasSetNickname());
                    assertNotNull(user.getId());
                    //connections
                    assertEquals(1, user.getConnections().size());
                    Connection connection = Iterables.getFirst(user.getConnections(), null);
                    assertNotNull(connection);
                    assertEquals(authId, connection.getAuthId());
                    assertEquals(source, connection.getSource());
                    assertEquals(email, connection.getRawId());
                    assertEquals(email, connection.getName());
                    assertNull(connection.getAvatar());
                    assertEquals(0, connection.getOrgIds().size());
                    assertNull(connection.getAuthConnectionAuthToken());
                    assertEquals(Map.of("email", email), connection.getRawUserInfo());
                    //exchange
                    MultiValueMap<String, ResponseCookie> cookies = loginExchange.getResponse().getCookies();
                    assertEquals(1, cookies.size());
                    assertTrue(cookies.containsKey(SESSION_COOKIE_NAME));
                    assertTrue(connection.getTokens().contains(Objects.requireNonNull(cookies.getFirst(SESSION_COOKIE_NAME)).getValue()));
                })
                .verifyComplete();
    }

    @Test
    public void testRegisterFailByLoginIdExist() {

        String email = "test_register_fail@ob.dev";
        String password = "lowcoder";
        String source = AuthSourceConstants.EMAIL;

        FormLoginRequest formLoginRequest = new FormLoginRequest(email, password, true, source, getEmailAuthConfigId());
        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        Mono<ResponseView<Boolean>> loginMono = authenticationController.formLogin(formLoginRequest, null, null,exchange)
                .then(authenticationController.formLogin(formLoginRequest, null,null, exchange));
        StepVerifier.create(loginMono)
                .verifyErrorMatches(throwable -> {
                    BizException bizException = (BizException) throwable;
                    assertEquals(USER_LOGIN_ID_EXIST, bizException.getError());
                    assertEquals("USER_LOGIN_ID_EXIST", bizException.getMessageKey());
                    return true;
                });
    }

    @Test
    public void testLoginFailByLoginIdNotExist() {
        String email = "test_login_fail@ob.dev";
        String password = "lowcoder";
        String source = AuthSourceConstants.EMAIL;

        FormLoginRequest formLoginRequest = new FormLoginRequest(email, password, false, source, getEmailAuthConfigId());
        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        Mono<ResponseView<Boolean>> loginMono = authenticationController.formLogin(formLoginRequest, null, null, exchange);
        StepVerifier.create(loginMono)
                .verifyErrorMatches(throwable -> {
                    BizException bizException = (BizException) throwable;
                    assertEquals(INVALID_PASSWORD, bizException.getError());
                    assertEquals("INVALID_EMAIL_OR_PASSWORD", bizException.getMessageKey());
                    return true;
                });
    }

    private String getEmailAuthConfigId() {
        return authenticationService.findAuthConfigBySource(null, AuthSourceConstants.EMAIL)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .block();
    }

    /**
     * Logout has two halves and both matter: the browser must be told to drop the cookie, and the session must be
     * gone server side. Neither is worth much on its own.
     */
    @Test
    public void logout() {
        String email = "test_logout@ob.dev";
        String password = "lowcoder";
        String source = AuthSourceConstants.EMAIL;

        FormLoginRequest registerRequest = new FormLoginRequest(email, password, true, source, getEmailAuthConfigId());
        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange registerExchange = MockServerWebExchange.builder(request).build();

        authenticationController.formLogin(registerRequest, null, null, registerExchange).block();

        ResponseCookie sessionCookie = registerExchange.getResponse().getCookies().getFirst(SESSION_COOKIE_NAME);
        assertNotNull(sessionCookie);
        String token = sessionCookie.getValue();
        assertFalse(token.isEmpty());
        assertEquals(Boolean.TRUE, sessionUserService.tokenExist(token).block());

        MockServerHttpRequest logoutRequest = MockServerHttpRequest.post("")
                .cookie(ResponseCookie.from(SESSION_COOKIE_NAME, token).build())
                .build();
        MockServerWebExchange logoutExchange = MockServerWebExchange.builder(logoutRequest).build();

        StepVerifier.create(authenticationController.logout(logoutExchange))
                .assertNext(response -> {
                    assertTrue(response.isSuccess());
                    assertTrue(response.getData());
                })
                .verifyComplete();

        // the browser is told to drop the cookie...
        ResponseCookie clearedCookie = logoutExchange.getResponse().getCookies().getFirst(SESSION_COOKIE_NAME);
        assertNotNull(clearedCookie);
        assertEquals("", clearedCookie.getValue());
        assertEquals(Duration.ZERO, clearedCookie.getMaxAge());
        assertEquals("/", clearedCookie.getPath());
        assertTrue(clearedCookie.isHttpOnly());

        // ...and the session really is gone, so replaying the old value cannot authenticate
        assertEquals(Boolean.FALSE, sessionUserService.tokenExist(token).block());
    }
}

package org.lowcoder.api.framework.filter;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The filter used to attempt API key authentication only when the session cookie string was empty, so a stale cookie
 * left behind by a logout permanently masked the Authorization header. These tests pin the corrected precedence: the
 * cookie still wins, but only while it resolves to a live session.
 */
@ExtendWith(MockitoExtension.class)
class APIKeyAuthFilterTest {

    private static final String API_KEY = "a.jwt.token";
    private static final String LIVE_COOKIE_TOKEN = "live-session-token";
    private static final String STALE_COOKIE_TOKEN = "stale-session-token";
    private static final String NO_COOKIE = "";

    @Mock
    private SessionUserService service;

    @Mock
    private CookieHelper cookieHelper;

    @Mock
    private JWTUtils jwtUtils;

    @Mock
    private WebFilterChain chain;

    private APIKeyAuthFilter filter;
    private MockServerWebExchange exchange;
    private AtomicReference<Authentication> propagated;

    @BeforeEach
    void setUp() {
        filter = new APIKeyAuthFilter(service, cookieHelper, jwtUtils);
        exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/users/me").build());
        propagated = new AtomicReference<>();
        // records whatever identity the filter wrote into the reactor context for the rest of the chain
        when(chain.filter(exchange)).thenReturn(ReactiveSecurityContextHolder.getContext()
                .doOnNext(securityContext -> propagated.set(securityContext.getAuthentication()))
                .then());
    }

    private void runFilter() {
        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
    }

    private User givenApiKeyResolvesToUser() {
        Claims claims = mock(Claims.class);
        User user = mock(User.class);
        when(jwtUtils.parseJwtClaims(API_KEY)).thenReturn(claims);
        when(service.resolveSessionUserForJWT(claims, API_KEY)).thenReturn(Mono.just(user));
        return user;
    }

    @Test
    void noApiKeyPassesThroughWithoutReadingTheCookie() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(null);

        runFilter();

        verify(chain).filter(exchange);
        verify(cookieHelper, never()).getCookieToken(any());
        verify(service, never()).tokenExist(any());
        assertNull(propagated.get());
    }

    @Test
    void emptyApiKeyPassesThroughWithoutReadingTheCookie() {
        when(jwtUtils.resolveToken(exchange)).thenReturn("");

        runFilter();

        verify(chain).filter(exchange);
        verify(cookieHelper, never()).getCookieToken(any());
        verify(service, never()).tokenExist(any());
        assertNull(propagated.get());
    }

    @Test
    void apiKeyWithoutCookieAuthenticates() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(API_KEY);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(NO_COOKIE);
        User user = givenApiKeyResolvesToUser();

        runFilter();

        verify(chain).filter(exchange);
        // no cookie means no reason to pay for a Redis round trip
        verify(service, never()).tokenExist(any());
        assertNotNull(propagated.get());
        assertSame(user, propagated.get().getPrincipal());
    }

    @Test
    void liveCookieKeepsPrecedenceOverApiKey() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(API_KEY);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(LIVE_COOKIE_TOKEN);
        when(service.tokenExist(LIVE_COOKIE_TOKEN)).thenReturn(Mono.just(true));

        runFilter();

        verify(chain).filter(exchange);
        verify(jwtUtils, never()).parseJwtClaims(any());
        verify(service, never()).resolveSessionUserForJWT(any(), any());
        // the cookie identity established upstream is left untouched
        assertNull(propagated.get());
    }

    /**
     * The regression this change targets: after a logout the browser still sends the dead cookie, and that must not
     * stop an explicit API key from authenticating.
     */
    @Test
    void staleCookieFallsThroughToApiKey() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(API_KEY);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(STALE_COOKIE_TOKEN);
        when(service.tokenExist(STALE_COOKIE_TOKEN)).thenReturn(Mono.just(false));
        User user = givenApiKeyResolvesToUser();

        runFilter();

        verify(chain).filter(exchange);
        assertNotNull(propagated.get());
        assertSame(user, propagated.get().getPrincipal());
    }

    @Test
    void absentRedisAnswerFallsThroughToApiKey() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(API_KEY);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(STALE_COOKIE_TOKEN);
        when(service.tokenExist(STALE_COOKIE_TOKEN)).thenReturn(Mono.empty());
        User user = givenApiKeyResolvesToUser();

        runFilter();

        verify(chain).filter(exchange);
        assertNotNull(propagated.get());
        assertSame(user, propagated.get().getPrincipal());
    }

    @Test
    void unparseableApiKeyPassesThroughAnonymously() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(API_KEY);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(STALE_COOKIE_TOKEN);
        when(service.tokenExist(STALE_COOKIE_TOKEN)).thenReturn(Mono.just(false));
        when(jwtUtils.parseJwtClaims(API_KEY)).thenReturn(null);

        runFilter();

        verify(chain).filter(exchange);
        verify(service, never()).resolveSessionUserForJWT(any(), any());
        assertNull(propagated.get());
    }

    /**
     * An API key that no longer matches any user must fall through to anonymous, so the authorization layer can answer
     * 401. Before the switchIfEmpty the chain was never invoked at all and the request completed with an empty body.
     */
    @Test
    void unknownApiKeyStillInvokesTheChain() {
        when(jwtUtils.resolveToken(exchange)).thenReturn(API_KEY);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(STALE_COOKIE_TOKEN);
        when(service.tokenExist(STALE_COOKIE_TOKEN)).thenReturn(Mono.just(false));
        Claims claims = mock(Claims.class);
        when(jwtUtils.parseJwtClaims(API_KEY)).thenReturn(claims);
        when(service.resolveSessionUserForJWT(claims, API_KEY)).thenReturn(Mono.empty());

        runFilter();

        verify(chain).filter(exchange);
        assertNull(propagated.get());
    }
}

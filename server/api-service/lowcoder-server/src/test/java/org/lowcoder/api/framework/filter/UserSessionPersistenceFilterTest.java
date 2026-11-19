package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.ConnectionAuthToken;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

/**
 * Unit tests of {@link UserSessionPersistenceFilter}: session resolution, authentication context, validity
 * extension and the OAuth access-token refresh.
 *
 * <p>Fixed since: the dropped request (BF-039), now asserted by the {@code ...ContinuesWithoutRefreshBF039} tests; the
 * NullPointerException for a connection with a null authId or without a stored token (BF-040), now asserted by the
 * {@code ...BF040} tests.
 * Expiry is always computed relative to {@code Instant.now()} with a one-day margin, so no test depends on timing.
 */
@ExtendWith(MockitoExtension.class)
class UserSessionPersistenceFilterTest {

    private static final String COOKIE_TOKEN = "cookie-token";
    private static final String USER_ID = "user-1";
    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String OAUTH_AUTH_ID = "oauth-cfg";
    private static final String OTHER_AUTH_ID = "other-cfg";
    private static final String DEFAULT_AUTH_ID = AuthenticationService.DEFAULT_AUTH_CONFIG.getId();
    private static final String REFRESH_TOKEN = "refresh-1";
    private static final String EVENT_CHAIN = "chain";
    private static final String EVENT_EXTEND = "extend";
    private static final long ONE_DAY_SECONDS = 24L * 3600L;
    private static final String LOOKUP_FAILURE = "db down";

    @Mock private SessionUserService sessionUserService;
    @Mock private UserService userService;
    @Mock private CookieHelper cookieHelper;
    @Mock private AuthenticationService authenticationService;
    @Mock private AuthenticationApiServiceImpl authenticationApiService;
    @Mock private AuthRequestFactory<AuthRequestContext> authRequestFactory;
    @Mock private AuthRequest authRequest;

    private UserSessionPersistenceFilter filter;
    private ServerWebExchange exchange;
    private final List<String> events = new ArrayList<>();
    private final AtomicReference<Authentication> seenAuthentication = new AtomicReference<>();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger filterLogger = (Logger) LoggerFactory.getLogger(UserSessionPersistenceFilter.class);

    private static class StubAuthConfig extends AbstractAuthConfig {
        StubAuthConfig(String id) {
            super(id, "GOOGLE", "GOOGLE", true, true, "STUB");
        }
    }

    @BeforeEach
    void setUp() {
        filter = new UserSessionPersistenceFilter(sessionUserService, userService, cookieHelper, authenticationService,
                authenticationApiService, authRequestFactory);
        exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/x").build());
        lenient().when(cookieHelper.getCookieToken(exchange)).thenReturn(COOKIE_TOKEN);
        lenient().when(sessionUserService.extendValidity(COOKIE_TOKEN))
                .thenReturn(Mono.<Void>fromRunnable(() -> events.add(EVENT_EXTEND)));
        logs.start();
        filterLogger.addAppender(logs);
    }

    @AfterEach
    void tearDown() {
        filterLogger.detachAppender(logs);
        logs.stop();
    }

    // ---------------------------------------------------------------- helpers

    /** A chain that records its invocation and the authentication visible in its reactor context. */
    private final WebFilterChain recordingChain = ex -> Mono.defer(() -> {
        events.add(EVENT_CHAIN);
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .doOnNext(seenAuthentication::set)
                .then();
    });

    private void sessionIs(User user) {
        when(sessionUserService.resolveSessionUserFromCookie(COOKIE_TOKEN)).thenReturn(Mono.just(user));
    }

    private static Connection connection(String authId, ConnectionAuthToken token, String... orgIds) {
        return Connection.builder().authId(authId).source("GOOGLE").rawId("raw-" + authId).name("conn")
                .orgIds(new HashSet<>(Set.of(orgIds))).authConnectionAuthToken(token)
                .tokens(new HashSet<>(Set.of("t1", "t2"))).build();
    }

    private static ConnectionAuthToken token(long expireAt, String refreshToken) {
        return ConnectionAuthToken.builder().accessToken("access").expireAt(expireAt).refreshToken(refreshToken).build();
    }

    private static long expiredAt() {
        return Instant.now().getEpochSecond() - ONE_DAY_SECONDS;
    }

    private static long validUntil() {
        return Instant.now().getEpochSecond() + ONE_DAY_SECONDS;
    }

    private static User userWith(String activeAuthId, Connection... connections) {
        return User.builder().id(USER_ID).name("User One").activeAuthId(activeAuthId)
                .connections(new HashSet<>(Set.of(connections))).build();
    }

    private static User expiredOauthUser(String refreshToken, String... orgIds) {
        return userWith(OAUTH_AUTH_ID, connection(OAUTH_AUTH_ID, token(expiredAt(), refreshToken), orgIds));
    }

    private void configFound(String orgId, String authId) {
        when(authenticationService.findAllAuthConfigs(orgId, true))
                .thenReturn(Flux.just(new FindAuthConfig(new StubAuthConfig(authId), null)));
    }

    private void assertChainRanAs(User user) {
        assertThat(events).containsExactly(EVENT_CHAIN, EVENT_EXTEND);
        assertThat(seenAuthentication.get().getPrincipal()).isSameAs(user);
    }

    // ----------------------------------------------------------- session found

    /** Catches anonymous requests being dropped, authenticated, or extending a session that does not exist. */
    @Test
    void filter_noSession_chainContinuesUnauthenticated_andNoValidityExtension() {
        when(sessionUserService.resolveSessionUserFromCookie(COOKIE_TOKEN)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertThat(events).containsExactly(EVENT_CHAIN);
        assertThat(seenAuthentication.get()).isNull();
        verify(sessionUserService, never()).extendValidity(anyString());
        System.out.println("[UserSessionPersistenceFilterTest] no session -> chain ran once, no authentication, no extendValidity");
    }

    /** Catches a missing authentication in the chain's context, or the validity never being extended after the chain. */
    @Test
    void filter_sessionFound_putsTheUserInTheContext_andExtendsValidityAfterTheChain() {
        User user = userWith(DEFAULT_AUTH_ID, connection(DEFAULT_AUTH_ID, token(0L, null), ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertChainRanAs(user);
        System.out.println("[UserSessionPersistenceFilterTest] events=" + events + " principal=" + seenAuthentication.get().getPrincipal());
    }

    /** Catches a failed request extending the session: the extension only runs after the chain completed. */
    @Test
    void filter_chainError_propagates_andDoesNotExtendValidity() {
        User user = userWith(DEFAULT_AUTH_ID, connection(DEFAULT_AUTH_ID, token(0L, null), ORG_ID));
        sessionIs(user);
        WebFilterChain failing = ex -> Mono.defer(() -> {
            events.add(EVENT_CHAIN);
            return Mono.error(new IllegalStateException("handler failed"));
        });

        StepVerifier.create(filter.filter(exchange, failing)).expectError(IllegalStateException.class).verify();

        assertThat(events).containsExactly(EVENT_CHAIN);
        System.out.println("[UserSessionPersistenceFilterTest] chain error propagated, events=" + events);
    }

    // ------------------------------------------------------- no refresh needed

    /** Catches a refresh attempted for a user whose active auth id has no connection. */
    @Test
    void filter_noConnectionMatchingTheActiveAuthId_continuesWithoutRefresh() {
        User user = userWith("missing-auth-id", connection(OAUTH_AUTH_ID, token(expiredAt(), REFRESH_TOKEN), ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertChainRanAs(user);
        verifyNoInteractions(authenticationService);
        System.out.println("[UserSessionPersistenceFilterTest] no active connection -> no auth config lookup");
    }

    /** Catches password (default EMAIL) logins being sent to an OAuth refresh. */
    @Test
    void filter_defaultEmailConnection_isNeverRefreshed() {
        User user = userWith(DEFAULT_AUTH_ID, connection(DEFAULT_AUTH_ID, token(expiredAt(), REFRESH_TOKEN), ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertChainRanAs(user);
        verifyNoInteractions(authenticationService);
        System.out.println("[UserSessionPersistenceFilterTest] default connection with expired token -> not refreshed");
    }

    /** Catches an access token without expiry (expireAt 0) being refreshed. */
    @Test
    void filter_expireAtZero_isNeverRefreshed() {
        User user = userWith(OAUTH_AUTH_ID, connection(OAUTH_AUTH_ID, token(0L, REFRESH_TOKEN), ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertChainRanAs(user);
        verifyNoInteractions(authenticationService);
        System.out.println("[UserSessionPersistenceFilterTest] expireAt=0 -> not refreshed");
    }

    /** Catches a still valid token being refreshed on every request. */
    @Test
    void filter_notYetExpiredToken_isNotRefreshed() {
        User user = userWith(OAUTH_AUTH_ID, connection(OAUTH_AUTH_ID, token(validUntil(), REFRESH_TOKEN), ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertChainRanAs(user);
        verifyNoInteractions(authenticationService);
        System.out.println("[UserSessionPersistenceFilterTest] token valid for a day -> not refreshed");
    }

    /** Catches a refresh without any organisation to resolve the auth config in. */
    @Test
    void filter_expiredTokenWithoutOrgIds_isNotRefreshed() {
        User user = expiredOauthUser(REFRESH_TOKEN);
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertChainRanAs(user);
        verifyNoInteractions(authenticationService);
        System.out.println("[UserSessionPersistenceFilterTest] expired token, no org ids -> not refreshed");
    }

    // ----------------------------------------------------------------- refresh

    /** Catches stale tokens: the refresh runs through the auth request and the refreshed connection is persisted. */
    @Test
    void filter_expiredToken_refreshesViaTheAuthRequest_updatesTheConnection_andPersistsTheUser() {
        User user = expiredOauthUser(REFRESH_TOKEN, ORG_ID);
        User persisted = User.builder().id(USER_ID).name("persisted").build();
        sessionIs(user);
        configFound(ORG_ID, OAUTH_AUTH_ID);
        when(authRequestFactory.build(any())).thenReturn(Mono.just(authRequest));
        AuthUser refreshed = AuthUser.builder().uid("raw").build();
        when(authRequest.refresh(REFRESH_TOKEN)).thenReturn(Mono.just(refreshed));
        when(userService.update(USER_ID, user)).thenReturn(Mono.just(persisted));

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        ArgumentCaptor<AuthRequestContext> context = ArgumentCaptor.forClass(AuthRequestContext.class);
        verify(authRequestFactory).build(context.capture());
        assertThat(context.getValue()).isInstanceOf(OAuth2RequestContext.class);
        assertThat(context.getValue().getOrgId()).isEqualTo(ORG_ID);
        assertThat(context.getValue().getAuthConfig().getId()).isEqualTo(OAUTH_AUTH_ID);
        assertThat(refreshed.getAuthContext()).isSameAs(context.getValue());
        verify(authenticationApiService).updateConnection(refreshed, user);
        verify(userService).update(USER_ID, user);
        assertChainRanAs(persisted);
        System.out.println("[UserSessionPersistenceFilterTest] refreshed, connection updated, request continued as " + persisted.getName());
    }

    /** Catches the auth config being chosen by position: only the config with the connection's auth id is used. */
    @Test
    void filter_expiredToken_usesOnlyTheAuthConfigMatchingTheConnection() {
        User user = expiredOauthUser(REFRESH_TOKEN, ORG_ID);
        sessionIs(user);
        when(authenticationService.findAllAuthConfigs(ORG_ID, true)).thenReturn(Flux.just(
                new FindAuthConfig(new StubAuthConfig(OTHER_AUTH_ID), null),
                new FindAuthConfig(new StubAuthConfig(OAUTH_AUTH_ID), null)));
        when(authRequestFactory.build(any())).thenReturn(Mono.just(authRequest));
        when(authRequest.refresh(REFRESH_TOKEN)).thenReturn(Mono.just(AuthUser.builder().uid("raw").build()));
        when(userService.update(eq(USER_ID), any())).thenReturn(Mono.just(user));

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        ArgumentCaptor<AuthRequestContext> context = ArgumentCaptor.forClass(AuthRequestContext.class);
        verify(authRequestFactory, times(1)).build(context.capture());
        assertThat(context.getValue().getAuthConfig().getId()).isEqualTo(OAUTH_AUTH_ID);
        System.out.println("[UserSessionPersistenceFilterTest] built the request for " + context.getValue().getAuthConfig().getId());
    }

    // ------------------------------------------------------------ refresh failure

    private void assertRefreshFailedButRequestContinued(User user) {
        verify(sessionUserService).removeUserSession("t1");
        verify(sessionUserService).removeUserSession("t2");
        verify(userService, never()).update(anyString(), any());
        assertChainRanAs(user);
    }

    private void refreshableSetup(User user) {
        sessionIs(user);
        configFound(ORG_ID, OAUTH_AUTH_ID);
        when(authRequestFactory.build(any())).thenReturn(Mono.just(authRequest));
        lenient().when(sessionUserService.removeUserSession(anyString())).thenReturn(Mono.empty());
    }

    /**
     * Catches a dead session surviving. Today the connection's sessions are removed and the request still continues
     * as the old user (not a logout of the current request).
     */
    @Test
    void filter_expiredToken_emptyRefreshToken_removesTheConnectionsTokens_andContinuesAsTheOldUser() {
        User user = expiredOauthUser("", ORG_ID);
        refreshableSetup(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        verify(authRequest, never()).refresh(anyString());
        assertRefreshFailedButRequestContinued(user);
        System.out.println("[UserSessionPersistenceFilterTest] empty refresh token -> sessions t1,t2 removed, request continued");
    }

    /** Catches a provider error propagating to the client, or leaving the old sessions valid. */
    @Test
    void filter_expiredToken_refreshFails_removesTheConnectionsTokens_andContinuesAsTheOldUser() {
        User user = expiredOauthUser(REFRESH_TOKEN, ORG_ID);
        refreshableSetup(user);
        when(authRequest.refresh(REFRESH_TOKEN)).thenReturn(Mono.error(new IllegalStateException("provider down")));

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertRefreshFailedButRequestContinued(user);
        System.out.println("[UserSessionPersistenceFilterTest] provider error -> sessions removed, request continued");
    }

    /** Catches an empty refresh answer (null after block) being treated as success. */
    @Test
    void filter_expiredToken_refreshReturnsNothing_removesTheConnectionsTokens() {
        User user = expiredOauthUser(REFRESH_TOKEN, ORG_ID);
        refreshableSetup(user);
        when(authRequest.refresh(REFRESH_TOKEN)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        assertRefreshFailedButRequestContinued(user);
        System.out.println("[UserSessionPersistenceFilterTest] empty refresh answer -> sessions removed, request continued");
    }

    // ------------------------------------------------------- pinned defects

    /**
     * BF-039 fixed: with an expired token and no auth config of the connection's id, the refresh yielded no user, so the
     * chain was never called and the request got an empty response. Now the request continues as the user, unrefreshed:
     * the chain runs, validity is extended, nothing is refreshed, persisted or removed.
     */
    @Test
    void filter_expiredToken_noMatchingAuthConfig_continuesWithoutRefreshBF039() {
        User user = expiredOauthUser(REFRESH_TOKEN, ORG_ID);
        sessionIs(user);
        configFound(ORG_ID, OTHER_AUTH_ID);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        System.out.println("[UserSessionPersistenceFilterTest] no matching config -> events " + events);
        assertChainRanAs(user);
        verifyNoInteractions(authRequestFactory);
        verify(userService, never()).update(anyString(), any());
        verify(sessionUserService, never()).removeUserSession(anyString());
    }

    /**
     * BF-039 fixed for a failing auth-config lookup: the error is logged as a warning with its cause and the org, then treated
     * as no config found, so the request continues unrefreshed.
     */
    @Test
    void filter_expiredToken_authConfigLookupFails_continuesWithoutRefreshBF039() {
        User user = expiredOauthUser(REFRESH_TOKEN, ORG_ID);
        sessionIs(user);
        when(authenticationService.findAllAuthConfigs(ORG_ID, true)).thenReturn(Flux.error(new IllegalStateException(LOOKUP_FAILURE)));

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        System.out.println("[UserSessionPersistenceFilterTest] lookup error -> events " + events + ", logged "
                + logs.list.stream().map(e -> e.getLevel() + " " + e.getFormattedMessage()).toList());
        assertChainRanAs(user);
        assertThat(logs.list).as("the lookup failure is logged with its cause and the org")
                .anyMatch(e -> e.getLevel() == Level.WARN && e.getThrowableProxy() != null
                        && LOOKUP_FAILURE.equals(e.getThrowableProxy().getMessage()) && e.getFormattedMessage().contains(ORG_ID));
        verifyNoInteractions(authRequestFactory);
        verify(sessionUserService, never()).removeUserSession(anyString());
    }

    /**
     * BF-040 fixed: a connection stored without an auth id made the lookup of the active connection throw, so every
     * request of that session failed. It now matches no auth id: placed first (fixed iteration order) with an expired
     * token, it is skipped; the active connection's valid token needs no refresh and the chain runs as the user.
     */
    @Test
    void filter_connectionWithNullAuthId_isSkipped_andTheRequestContinuesBF040() {
        User user = userWith(OAUTH_AUTH_ID);
        user.setConnections(new LinkedHashSet<>(List.of(connection(null, token(expiredAt(), REFRESH_TOKEN), ORG_ID),
                connection(OAUTH_AUTH_ID, token(validUntil(), REFRESH_TOKEN), ORG_ID))));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        System.out.println("[UserSessionPersistenceFilterTest] null authId connection first -> events " + events);
        assertChainRanAs(user);
        verifyNoInteractions(authenticationService, authRequestFactory);
    }

    /**
     * BF-040: a user without an active auth id does not take a connection without an auth id as the active one, so its
     * expired token is not refreshed; the chain runs as the user.
     */
    @Test
    void filter_noActiveAuthId_doesNotMatchAConnectionWithoutAuthIdBF040() {
        User user = userWith(null, connection(null, token(expiredAt(), REFRESH_TOKEN), ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        System.out.println("[UserSessionPersistenceFilterTest] no active auth id, null authId connection -> events " + events);
        assertChainRanAs(user);
        verifyNoInteractions(authenticationService, authRequestFactory);
    }

    /**
     * BF-040 fixed: reading the expiry of a non-default active connection without a stored token threw, so every request
     * of that session failed. Such a connection has nothing to refresh: the chain runs as the user, nothing is looked up,
     * refreshed or removed.
     */
    @Test
    void filter_nonDefaultConnectionWithoutStoredToken_hasNothingToRefresh_andTheRequestContinuesBF040() {
        User user = userWith(OAUTH_AUTH_ID, connection(OAUTH_AUTH_ID, null, ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        System.out.println("[UserSessionPersistenceFilterTest] connection without token -> events " + events);
        assertChainRanAs(user);
        verifyNoInteractions(authenticationService, authRequestFactory);
        verify(sessionUserService, never()).removeUserSession(anyString());
    }

    /**
     * BF-040: a non-default active connection whose stored token has no expiry (legacy data; {@code ConnectionAuthToken.of}
     * writes 0 instead) failed reading it as a number, so every request of that session failed. Like 0, it has nothing to
     * refresh: the chain runs as the user, nothing is looked up, refreshed or removed.
     */
    @Test
    void filter_nonDefaultConnectionWithoutAnExpiry_hasNothingToRefresh_andTheRequestContinuesBF040() {
        ConnectionAuthToken withoutExpiry = ConnectionAuthToken.builder().accessToken("access").refreshToken(REFRESH_TOKEN).build();
        User user = userWith(OAUTH_AUTH_ID, connection(OAUTH_AUTH_ID, withoutExpiry, ORG_ID));
        sessionIs(user);

        StepVerifier.create(filter.filter(exchange, recordingChain)).verifyComplete();

        System.out.println("[UserSessionPersistenceFilterTest] token without expiry -> events " + events);
        assertChainRanAs(user);
        verifyNoInteractions(authenticationService, authRequestFactory);
        verify(sessionUserService, never()).removeUserSession(anyString());
    }
}

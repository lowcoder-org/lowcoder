package org.lowcoder.api.home;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.lowcoder.sdk.constants.GlobalContext.CURRENT_ORG_MEMBER;
import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_TOKEN;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.util.AuthenticationUtils;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

/**
 * Unit tests of {@link SessionUserServiceImpl}: visitor accessors, the org-member cache, session save/extend/remove,
 * cookie and JWT (API key) session resolution. The Redis-backed success path of {@code resolveSessionUserFromCookie}
 * is pinned separately by {@code SessionCacheContractTest}; this class covers what that one does not.
 */
@ExtendWith(MockitoExtension.class)
class SessionUserServiceImplJwtAndSessionTest {

    private static final String USER_ID = "user-1";
    private static final String ORG_ID = "org-1";
    private static final String TOKEN = "session-token";
    private static final String SOURCE = "GOOGLE";
    private static final String JWT = "jwt-token-value";
    private static final String OTHER_JWT = "another-jwt-value";
    private static final String CLAIM_USER_ID = "userId";
    /** CommonConfig's default cookie max age: 24 hours. */
    private static final Duration SESSION_TTL = Duration.ofHours(24);
    private static final String EVENT_SET = "set";
    private static final String EVENT_REMOVE_INVALID = "removeInvalidTokens";
    private static final String EVENT_SAVE_TOKEN = "saveToken";
    private static final String EVENT_DELETE = "delete";
    private static final String EVENT_REMOVE_TOKEN = "removeToken";

    @Mock private UserService userService;
    @Mock private OrgMemberService orgMemberService;
    @Mock private UserApiService userApiService;
    @Mock private ReactiveRedisTemplate<String, String> reactiveTemplate;
    @Mock private ReactiveValueOperations<String, String> ops;
    @Mock private Claims claims;

    private SessionUserServiceImpl service;
    private final List<String> events = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new SessionUserServiceImpl();
        ReflectionTestUtils.setField(service, "commonConfig", new CommonConfig());
        ReflectionTestUtils.setField(service, "userService", userService);
        ReflectionTestUtils.setField(service, "orgMemberService", orgMemberService);
        ReflectionTestUtils.setField(service, "userApiService", userApiService);
        ReflectionTestUtils.setField(service, "reactiveTemplate", reactiveTemplate);
        lenient().when(reactiveTemplate.opsForValue()).thenReturn(ops);
    }

    // ---------------------------------------------------------------- helpers

    private static User user(String id) {
        return User.builder().id(id).name("name-" + id).build();
    }

    private static OrgMember member() {
        return OrgMember.builder().orgId(ORG_ID).userId(USER_ID).role(MemberRole.MEMBER).build();
    }

    private static Context withVisitor(User user) {
        return ReactiveSecurityContextHolder.withAuthentication(AuthenticationUtils.toAuthentication(user));
    }

    private static void assertBizError(Throwable throwable, BizError expected) {
        assertThat(throwable).isInstanceOf(BizException.class);
        assertThat(((BizException) throwable).getError()).isEqualTo(expected);
    }

    private static User userWithApiKeys(UserState state, String... tokens) {
        User user = user(USER_ID);
        user.setState(state);
        List<APIKey> keys = new ArrayList<>();
        for (String token : tokens) {
            keys.add(new APIKey("key-" + token, "name", "description", token));
        }
        user.setApiKeysList(keys);
        return user;
    }

    // ----------------------------------------------------------- visitor reads

    /** Catches the visitor accessors reading the wrong principal, id or anonymous flag. */
    @Test
    void visitorAccessors_readThePrincipalOfTheSecurityContext() {
        User visitor = user(USER_ID);
        StepVerifier.create(service.getVisitor().contextWrite(withVisitor(visitor))).expectNext(visitor).verifyComplete();
        StepVerifier.create(service.getVisitorId().contextWrite(withVisitor(visitor))).expectNext(USER_ID).verifyComplete();
        StepVerifier.create(service.isAnonymousUser().contextWrite(withVisitor(visitor))).expectNext(false).verifyComplete();

        User anonymous = user("anonymous");
        anonymous.setIsAnonymous(true);
        StepVerifier.create(service.isAnonymousUser().contextWrite(withVisitor(anonymous))).expectNext(true).verifyComplete();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] visitor, id and anonymous flag read from the security context");
    }

    // ------------------------------------------------------- org member cache

    /** Catches a visitor without an organisation proceeding as if in one. */
    @Test
    void getVisitorOrgMemberCache_returnsTheCachedMember_notExistOrEmpty_failUnableToFindValidOrg() {
        OrgMember member = member();
        StepVerifier.create(service.getVisitorOrgMemberCache().contextWrite(Context.of(CURRENT_ORG_MEMBER, Mono.just(member))))
                .expectNext(member).verifyComplete();

        StepVerifier.create(service.getVisitorOrgMemberCache().contextWrite(Context.of(CURRENT_ORG_MEMBER, Mono.just(OrgMember.NOT_EXIST))))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.UNABLE_TO_FIND_VALID_ORG)).verify();

        StepVerifier.create(service.getVisitorOrgMemberCache().contextWrite(Context.of(CURRENT_ORG_MEMBER, Mono.empty())))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.UNABLE_TO_FIND_VALID_ORG)).verify();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] cached member returned; NOT_EXIST and empty -> UNABLE_TO_FIND_VALID_ORG");
    }

    /** Catches the silent variant raising an error: it must hand back even {@code NOT_EXIST}. */
    @Test
    void getVisitorOrgMemberCacheSilent_returnsEvenNotExist_withoutError() {
        StepVerifier.create(service.getVisitorOrgMemberCacheSilent().contextWrite(Context.of(CURRENT_ORG_MEMBER, Mono.just(OrgMember.NOT_EXIST))))
                .expectNext(OrgMember.NOT_EXIST).verifyComplete();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] silent variant returned NOT_EXIST without error");
    }

    /** Catches the visitor token being read from the wrong context key. */
    @Test
    void getVisitorToken_returnsTheVisitorTokenOfTheContext() {
        StepVerifier.create(service.getVisitorToken().contextWrite(Context.of(VISITOR_TOKEN, TOKEN))).expectNext(TOKEN).verifyComplete();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] visitor token " + TOKEN);
    }

    /** Catches the org member being looked up for the wrong user, and a missing membership not being an error. */
    @Test
    void getVisitorOrgMember_usesTheVisitorsCurrentOrgMember_andFailsWhenThereIsNone() {
        OrgMember member = member();
        when(orgMemberService.getCurrentOrgMember(USER_ID)).thenReturn(Mono.just(member));
        StepVerifier.create(service.getVisitorOrgMember().contextWrite(withVisitor(user(USER_ID)))).expectNext(member).verifyComplete();

        when(orgMemberService.getCurrentOrgMember("lonely")).thenReturn(Mono.empty());
        StepVerifier.create(service.getVisitorOrgMember().contextWrite(withVisitor(user("lonely"))))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.UNABLE_TO_FIND_VALID_ORG)).verify();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] current org member looked up by visitor id; none -> UNABLE_TO_FIND_VALID_ORG");
    }

    // ------------------------------------------------------------ session write

    /** Catches a session without TTL, or a token list not cleaned or saved, or the steps out of order. */
    @Test
    void saveUserSession_storesTheTokenWithTtl_thenRemovesInvalidTokens_thenSavesTheToken_inOrder() {
        when(ops.set(TOKEN, USER_ID, SESSION_TTL)).thenReturn(Mono.fromSupplier(() -> {
            events.add(EVENT_SET);
            return true;
        }));
        when(userApiService.removeInvalidTokens(USER_ID)).thenReturn(Mono.<Void>fromRunnable(() -> events.add(EVENT_REMOVE_INVALID)));
        when(userApiService.saveToken(USER_ID, SOURCE, TOKEN)).thenReturn(Mono.<Void>fromRunnable(() -> events.add(EVENT_SAVE_TOKEN)));

        StepVerifier.create(service.saveUserSession(TOKEN, user(USER_ID), SOURCE)).verifyComplete();

        assertThat(events).containsExactly(EVENT_SET, EVENT_REMOVE_INVALID, EVENT_SAVE_TOKEN);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] save order " + events);
    }

    /** Catches a session being written for a user without id (the token would map to {@code null}). */
    @Test
    void saveUserSession_userWithoutId_failsWithNpe_andWritesNothing() {
        assertThatThrownBy(() -> service.saveUserSession(TOKEN, User.builder().build(), SOURCE))
                .isInstanceOf(NullPointerException.class);

        verify(ops, never()).set(any(), any(), any(Duration.class));
        verifyNoInteractions(userApiService);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] user without id -> NPE, nothing written");
    }

    /** Catches {@code expire("")}-style calls for a missing token. */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void extendValidity_blankToken_isANoOp(String blank) {
        StepVerifier.create(service.extendValidity(blank)).verifyComplete();

        verifyNoInteractions(reactiveTemplate);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] extendValidity('" + blank + "') made no redis call");
    }

    /** Catches the session lifetime not being renewed with the configured max age. */
    @Test
    void extendValidity_token_setsTheConfiguredTtl() {
        when(reactiveTemplate.expire(TOKEN, SESSION_TTL)).thenReturn(Mono.just(true));

        StepVerifier.create(service.extendValidity(TOKEN)).verifyComplete();

        verify(reactiveTemplate).expire(TOKEN, SESSION_TTL);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] expire(" + TOKEN + ", " + SESSION_TTL + ")");
    }

    /** Catches a blank token touching redis. */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void removeUserSession_blankToken_isANoOp(String blank) {
        StepVerifier.create(service.removeUserSession(blank)).verifyComplete();

        verifyNoInteractions(reactiveTemplate, userApiService);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] removeUserSession('" + blank + "') made no call");
    }

    /** Catches a logged-out token staying in redis or on the user, or the user id/token being swapped. */
    @Test
    void removeUserSession_existingToken_deletesTheKey_thenRemovesTheTokenFromTheUser() {
        when(ops.get(TOKEN)).thenReturn(Mono.just(USER_ID));
        when(ops.delete(TOKEN)).thenReturn(Mono.fromSupplier(() -> {
            events.add(EVENT_DELETE);
            return true;
        }));
        when(userApiService.removeToken(USER_ID, TOKEN)).thenReturn(Mono.<Void>fromRunnable(() -> events.add(EVENT_REMOVE_TOKEN)));

        StepVerifier.create(service.removeUserSession(TOKEN)).verifyComplete();

        assertThat(events).containsExactly(EVENT_DELETE, EVENT_REMOVE_TOKEN);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] remove order " + events);
    }

    /** Catches a removal against a session that does not exist. */
    @Test
    void removeUserSession_unknownToken_deletesNothing_andTouchesNoUser() {
        when(ops.get(TOKEN)).thenReturn(Mono.empty());

        StepVerifier.create(service.removeUserSession(TOKEN)).verifyComplete();

        verify(ops, never()).delete(anyString());
        verifyNoInteractions(userApiService);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] unknown token -> nothing deleted");
    }

    // ------------------------------------------------------------ cookie resolve

    /** Catches a blank cookie reaching redis. */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void resolveSessionUserFromCookie_blankToken_isEmpty_withoutRedis(String blank) {
        StepVerifier.create(service.resolveSessionUserFromCookie(blank)).verifyComplete();

        verifyNoInteractions(reactiveTemplate, userService);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] blank cookie '" + blank + "' -> empty, no redis");
    }

    private static Stream<Arguments> storedSessionValues() {
        return Stream.of(
                // stored value, id that must be looked up, state of the found user (null = none), user exists, resolved
                Arguments.of("plain-id", "plain-id", UserState.ACTIVATED, true, true),
                Arguments.of("{\"id\":\"legacy-id\",\"name\":\"Legacy\"}", "legacy-id", UserState.ACTIVATED, true, true),
                Arguments.of("plain-id", "plain-id", UserState.DELETED, true, false),
                Arguments.of("plain-id", "plain-id", null, true, true),
                Arguments.of("unknown-id", "unknown-id", null, false, false));
    }

    /**
     * A session value is either a plain user id or (legacy) a user JSON whose id is looked up; a DELETED user never
     * resolves; an unknown id or a user without state behave as stated.
     */
    @ParameterizedTest(name = "stored={0} lookup={1} state={2} exists={3} -> resolved={4}")
    @MethodSource("storedSessionValues")
    void resolveSessionUserFromCookie_looksUpTheRightId_andFiltersDeletedUsers(
            String stored, String lookupId, UserState state, boolean exists, boolean resolved) {
        when(ops.get(TOKEN)).thenReturn(Mono.just(stored));
        User found = user(lookupId);
        found.setState(state);
        when(userService.findById(lookupId)).thenReturn(exists ? Mono.just(found) : Mono.empty());

        if (resolved) {
            StepVerifier.create(service.resolveSessionUserFromCookie(TOKEN)).expectNext(found).verifyComplete();
        } else {
            StepVerifier.create(service.resolveSessionUserFromCookie(TOKEN)).verifyComplete();
        }

        verify(userService).findById(lookupId);
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] stored=" + stored + " looked up " + lookupId + " resolved=" + resolved);
    }

    // --------------------------------------------------------------------- JWT

    /** Catches a valid API key not authenticating its owner. */
    @Test
    void resolveSessionUserForJWT_tokenOfAnApiKeyOfTheUser_resolvesTheUser() {
        User owner = userWithApiKeys(UserState.ACTIVATED, OTHER_JWT, JWT);
        when(claims.get(CLAIM_USER_ID)).thenReturn(USER_ID);
        when(userService.findById(USER_ID)).thenReturn(Mono.just(owner));

        StepVerifier.create(service.resolveSessionUserForJWT(claims, JWT)).expectNext(owner).verifyComplete();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] token matched one of " + owner.getApiKeysList().size() + " API keys");
    }

    /** Catches a revoked (or foreign) API key still authenticating: a token not among the user's keys is rejected. */
    @ParameterizedTest(name = "stored keys={0}")
    @ValueSource(strings = {"", "another-jwt-value"})
    void resolveSessionUserForJWT_tokenNotAmongTheUsersApiKeys_isRejected(String storedKey) {
        User owner = storedKey.isEmpty() ? userWithApiKeys(UserState.ACTIVATED) : userWithApiKeys(UserState.ACTIVATED, storedKey);
        when(claims.get(CLAIM_USER_ID)).thenReturn(USER_ID);
        when(userService.findById(USER_ID)).thenReturn(Mono.just(owner));

        StepVerifier.create(service.resolveSessionUserForJWT(claims, JWT)).verifyComplete();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] token not among keys '" + storedKey + "' -> rejected");
    }

    /** Catches a deleted user, or an unknown user, authenticating by API key. */
    @Test
    void resolveSessionUserForJWT_deletedOrUnknownUser_isRejected() {
        when(claims.get(CLAIM_USER_ID)).thenReturn(USER_ID, "ghost");
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithApiKeys(UserState.DELETED, JWT)));
        when(userService.findById("ghost")).thenReturn(Mono.empty());

        StepVerifier.create(service.resolveSessionUserForJWT(claims, JWT)).verifyComplete();
        StepVerifier.create(service.resolveSessionUserForJWT(claims, JWT)).verifyComplete();
        System.out.println("[SessionUserServiceImplJwtAndSessionTest] deleted and unknown users rejected");
    }
}

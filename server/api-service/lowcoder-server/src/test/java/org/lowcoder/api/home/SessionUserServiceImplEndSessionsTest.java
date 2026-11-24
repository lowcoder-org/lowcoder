package org.lowcoder.api.home;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Unit tests of {@link SessionUserServiceImpl#endSessionsOfUser} (D-34): the sweep that ends every session of a
 * user except an optionally kept one, used by a password change, a lost-password reset and an ENTERPRISE admin
 * reset. A mocked {@code ReactiveValueOperations} and {@code UserApiService} stand in for Redis and the Mongo
 * token-list cleanup; {@code events} records {@code delete:<token>} and {@code removeToken:<token>} on
 * subscription, so ordering is observable.
 */
@ExtendWith(MockitoExtension.class)
class SessionUserServiceImplEndSessionsTest {

    private static final String USER_ID = "user-1";
    private static final String T1 = "token-1";
    private static final String T2 = "token-2";
    private static final String KEEP = "token-keep";

    @Mock private UserService userService;
    @Mock private OrgMemberService orgMemberService;
    @Mock private UserApiService userApiService;
    @Mock private ReactiveRedisTemplate<String, String> reactiveTemplate;
    @Mock private ReactiveValueOperations<String, String> ops;

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

    private static User userWithTokens() {
        Connection email = Connection.builder().source("EMAIL").rawId(USER_ID).tokens(Set.of(T1, KEEP)).build();
        Connection google = Connection.builder().source("GOOGLE").rawId(USER_ID).tokens(new HashSet<>(Set.of(T2))).build();
        return User.builder().id(USER_ID).connections(Set.of(email, google)).build();
    }

    private void stubDelete(String token) {
        when(ops.delete(token)).thenReturn(Mono.fromSupplier(() -> {
            events.add("delete:" + token);
            return true;
        }));
    }

    private void stubRemoveToken(String token) {
        when(userApiService.removeToken(USER_ID, token)).thenReturn(Mono.<Void>fromRunnable(() -> events.add("removeToken:" + token)));
    }

    private static void assertBizError(Throwable throwable, BizError expected, String messageKey) {
        assertThat(throwable).isInstanceOf(BizException.class);
        BizException biz = (BizException) throwable;
        assertThat(biz.getError()).isEqualTo(expected);
        assertThat(biz.getMessageKey()).isEqualTo(messageKey);
    }

    @Test
    void endSessionsOfUser_keepsOnlyTheKeptToken_deletesThenRemovesEveryOther() {
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithTokens()));
        stubDelete(T1);
        stubDelete(T2);
        stubRemoveToken(T1);
        stubRemoveToken(T2);

        StepVerifier.create(service.endSessionsOfUser(USER_ID, KEEP)).verifyComplete();

        verify(ops).delete(T1);
        verify(ops).delete(T2);
        verify(ops, never()).delete(KEEP);
        verify(userApiService).removeToken(USER_ID, T1);
        verify(userApiService).removeToken(USER_ID, T2);
        verify(userApiService, never()).removeToken(USER_ID, KEEP);
        assertThat(events.indexOf("delete:" + T1)).isLessThan(events.indexOf("removeToken:" + T1));
        assertThat(events.indexOf("delete:" + T2)).isLessThan(events.indexOf("removeToken:" + T2));
        verify(ops, never()).get(anyString());
        System.out.println("[SessionUserServiceImplEndSessionsTest] keep=" + KEEP + " events=" + events);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void endSessionsOfUser_nullOrBlankKeep_endsEverySession(String keep) {
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithTokens()));
        stubDelete(T1);
        stubDelete(T2);
        stubDelete(KEEP);
        stubRemoveToken(T1);
        stubRemoveToken(T2);
        stubRemoveToken(KEEP);

        StepVerifier.create(service.endSessionsOfUser(USER_ID, keep)).verifyComplete();

        verify(ops).delete(T1);
        verify(ops).delete(T2);
        verify(ops).delete(KEEP);
        verify(userApiService).removeToken(USER_ID, T1);
        verify(userApiService).removeToken(USER_ID, T2);
        verify(userApiService).removeToken(USER_ID, KEEP);
        System.out.println("[SessionUserServiceImplEndSessionsTest] keep='" + keep + "' -> every token ended");
    }

    @Test
    void endSessionsOfUser_keyAlreadyGone_isNotAnError() {
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithTokens()));
        when(ops.delete(T1)).thenReturn(Mono.just(false));
        stubDelete(T2);
        stubRemoveToken(T1);
        stubRemoveToken(T2);

        StepVerifier.create(service.endSessionsOfUser(USER_ID, KEEP)).verifyComplete();

        verify(userApiService).removeToken(USER_ID, T1);
        System.out.println("[SessionUserServiceImplEndSessionsTest] delete(T1) false (already gone) -> not an error, still removed");
    }

    @Test
    void endSessionsOfUser_redisFailsOnce_retriesAndSucceeds() {
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithTokens()));
        AtomicInteger t1Attempts = new AtomicInteger();
        // retry() resubscribes to the Mono ops.delete(T1) already returned, so a plain Mono.error would fail every
        // retry too; Mono.defer re-evaluates the supplier on every subscription, so each retry counts a fresh attempt.
        when(ops.delete(T1)).thenReturn(Mono.defer(() -> {
            int attempt = t1Attempts.incrementAndGet();
            if (attempt == 1) {
                return Mono.error(new RuntimeException("transient redis error"));
            }
            return Mono.just(true);
        }));
        stubDelete(T2);
        stubRemoveToken(T1);
        stubRemoveToken(T2);

        StepVerifier.create(service.endSessionsOfUser(USER_ID, KEEP)).verifyComplete();

        assertThat(t1Attempts.get()).isEqualTo(2);
        verify(userApiService).removeToken(USER_ID, T1);
        System.out.println("[SessionUserServiceImplEndSessionsTest] T1 failed once, retried, attempts=" + t1Attempts.get());
    }

    @Test
    void endSessionsOfUser_redisFailsTwice_triesTheRestAndFails() {
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithTokens()));
        AtomicInteger t1Attempts = new AtomicInteger();
        when(ops.delete(T1)).thenReturn(Mono.defer(() -> {
            t1Attempts.incrementAndGet();
            return Mono.error(new RuntimeException("persistent redis error"));
        }));
        stubDelete(T2);
        stubDelete(KEEP);
        stubRemoveToken(T2);
        stubRemoveToken(KEEP);

        StepVerifier.create(service.endSessionsOfUser(USER_ID, null))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.PASSWORD_CHANGED_SESSIONS_NOT_ENDED, "PASSWORD_CHANGED_SESSIONS_NOT_ENDED");
                    assertThat(((BizException) error).getArgs()).as("the number of sessions that could not be ended").containsExactly(1);
                })
                .verify();

        assertThat(t1Attempts.get()).isEqualTo(2);
        verify(ops).delete(T2);
        verify(ops).delete(KEEP);
        verify(userApiService).removeToken(USER_ID, T2);
        verify(userApiService).removeToken(USER_ID, KEEP);
        verify(userApiService, never()).removeToken(USER_ID, T1);
        System.out.println("[SessionUserServiceImplEndSessionsTest] T1 failed twice -> PASSWORD_CHANGED_SESSIONS_NOT_ENDED; T2 and KEEP still ended");
    }

    @Test
    void endSessionsOfUser_mongoCleanupFails_stillCompletes() {
        when(userService.findById(USER_ID)).thenReturn(Mono.just(userWithTokens()));
        stubDelete(T1);
        stubDelete(T2);
        when(userApiService.removeToken(USER_ID, T1)).thenReturn(Mono.error(new RuntimeException("mongo down")));
        stubRemoveToken(T2);

        StepVerifier.create(service.endSessionsOfUser(USER_ID, KEEP)).verifyComplete();

        verify(ops).delete(T1);
        verify(ops).delete(T2);
        System.out.println("[SessionUserServiceImplEndSessionsTest] mongo cleanup failed for T1 -> still completes, both tokens deleted from redis");
    }

    @Test
    void endSessionsOfUser_unknownUser_completesWithoutRedis() {
        when(userService.findById(USER_ID)).thenReturn(Mono.empty());

        StepVerifier.create(service.endSessionsOfUser(USER_ID, KEEP)).verifyComplete();

        verifyNoInteractions(ops, userApiService);
        System.out.println("[SessionUserServiceImplEndSessionsTest] unknown user -> completes, no redis or mongo call");
    }
}

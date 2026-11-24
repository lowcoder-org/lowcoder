package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code UserApiServiceImpl#resetLostPassword} (D-34): after the domain reset of a lost password, every session of
 * the account is ended, for an anonymous caller none is kept.
 */
class UserApiServiceImplResetLostPasswordTest {

    private static final String EMAIL = "UserApiServiceImplResetLostPasswordTest.email@example.com";
    private static final String TOKEN = "UserApiServiceImplResetLostPasswordTest.resetToken";
    private static final String NEW_PASSWORD = "UserApiServiceImplResetLostPasswordTest.newPassword";
    private static final String USER_ID = "UserApiServiceImplResetLostPasswordTest.userId";

    private SessionUserService sessionUserService;
    private UserService userService;
    private UserApiServiceImpl service;

    @BeforeEach
    void setUp() {
        sessionUserService = mock(SessionUserService.class);
        OrgMemberService orgMemberService = mock(OrgMemberService.class);
        userService = mock(UserService.class);
        service = new UserApiServiceImpl(sessionUserService, orgMemberService, userService, mock(UserRepository.class));
    }

    @Test
    void resetLostPassword_success_endsEverySessionAfterTheReset() {
        List<String> order = new ArrayList<>();
        when(userService.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD)).thenReturn(Mono.defer(() -> {
            order.add("reset");
            return Mono.just(USER_ID);
        }));
        when(sessionUserService.endSessionsOfUser(USER_ID, null)).thenReturn(Mono.defer(() -> {
            order.add("endSessions");
            return Mono.empty();
        }));

        StepVerifier.create(service.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD)).expectNext(true).verifyComplete();

        assertThat(order).containsExactly("reset", "endSessions");
    }

    @Test
    void resetLostPassword_tokenRefused_endsNoSession() {
        BizException refused = new BizException(BizError.INVALID_PARAMETER, "INVALID_TOKEN");
        when(userService.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD)).thenReturn(Mono.error(refused));

        StepVerifier.create(service.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(refused))
                .verify();

        verify(sessionUserService, never()).endSessionsOfUser(anyString(), any());
    }

    @Test
    void resetLostPassword_noQualifyingAccount_answersEmptyAndEndsNoSession() {
        when(userService.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD)).thenReturn(Mono.empty());

        StepVerifier.create(service.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD)).verifyComplete();

        verify(sessionUserService, never()).endSessionsOfUser(anyString(), any());
    }

    @Test
    void resetLostPassword_sessionsNotEnded_answersTheError() {
        when(userService.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD)).thenReturn(Mono.just(USER_ID));
        when(sessionUserService.endSessionsOfUser(USER_ID, null)).thenReturn(
                Mono.error(new BizException(BizError.PASSWORD_CHANGED_SESSIONS_NOT_ENDED, "PASSWORD_CHANGED_SESSIONS_NOT_ENDED", 1)));

        StepVerifier.create(service.resetLostPassword(EMAIL, TOKEN, NEW_PASSWORD))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.PASSWORD_CHANGED_SESSIONS_NOT_ENDED);
                })
                .verify();
    }
}

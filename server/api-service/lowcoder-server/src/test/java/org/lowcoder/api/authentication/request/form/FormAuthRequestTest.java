package org.lowcoder.api.authentication.request.form;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Tests of {@link FormAuthRequest}: password login and registration checks. Registration of a new or existing address
 * and the address-shape check run end to end in {@code EmailNormalizationTest}; this class covers the failures that
 * test does not reach.
 */
@ExtendWith(MockitoExtension.class)
class FormAuthRequestTest {

    private static final String LOGIN_ID = "neo@example.com";
    private static final String PASSWORD = "pw-1";
    private static final String ENCODED = "encoded-pw";
    private static final String INVALID_EMAIL_OR_PASSWORD = "INVALID_EMAIL_OR_PASSWORD";

    @Mock private UserService userService;
    @Mock private EncryptionService encryptionService;

    private FormAuthRequest request;

    @BeforeEach
    void setUp() {
        request = new FormAuthRequest();
        ReflectionTestUtils.setField(request, "userService", userService);
        ReflectionTestUtils.setField(request, "encryptionService", encryptionService);
    }

    private static FormAuthRequestContext context(boolean register, AbstractAuthConfig authConfig) {
        FormAuthRequestContext context = new FormAuthRequestContext(LOGIN_ID, PASSWORD, register, "org-1");
        context.setAuthConfig(authConfig);
        return context;
    }

    private static void assertBizError(Throwable throwable, BizError expected) {
        assertThat(throwable).isInstanceOf(BizException.class);
        assertThat(((BizException) throwable).getError()).isEqualTo(expected);
    }

    // -------------------------------------------------------------------- login

    /** Catches a login with the right password failing, or the user being built from something other than the login id. */
    @Test
    void login_rightPassword_returnsTheAuthUserOfTheLoginId() {
        when(userService.findBySourceAndId(AuthSourceConstants.EMAIL, LOGIN_ID)).thenReturn(Mono.just(User.builder().password(ENCODED).build()));
        when(encryptionService.matchPassword(PASSWORD, ENCODED)).thenReturn(true);

        AuthUser authUser = request.auth(context(false, new EmailAuthConfig("cfg", true, true))).block();

        assertThat(authUser.getUid()).isEqualTo(LOGIN_ID);
        assertThat(authUser.getUsername()).isEqualTo(LOGIN_ID);
        assertThat(authUser.getEmail()).isEqualTo(LOGIN_ID);
        System.out.println("[FormAuthRequestTest] login ok -> " + authUser.getUid());
    }

    /** Catches a login with a wrong password succeeding. */
    @Test
    void login_wrongPassword_failsWithInvalidPassword() {
        when(userService.findBySourceAndId(AuthSourceConstants.EMAIL, LOGIN_ID)).thenReturn(Mono.just(User.builder().password(ENCODED).build()));
        when(encryptionService.matchPassword(PASSWORD, ENCODED)).thenReturn(false);

        StepVerifier.create(request.auth(context(false, new EmailAuthConfig("cfg", true, true))))
                .expectErrorSatisfies(e -> {
                    assertBizError(e, BizError.INVALID_PASSWORD);
                    assertThat(((BizException) e).getMessageKey()).isEqualTo(INVALID_EMAIL_OR_PASSWORD);
                })
                .verify();
        System.out.println("[FormAuthRequestTest] wrong password -> INVALID_PASSWORD");
    }

    /** Catches user enumeration: an unknown login fails with the same error and message key as a wrong password. */
    @Test
    void login_unknownUser_failsWithTheSameErrorAsAWrongPassword() {
        when(userService.findBySourceAndId(AuthSourceConstants.EMAIL, LOGIN_ID)).thenReturn(Mono.empty());

        StepVerifier.create(request.auth(context(false, new EmailAuthConfig("cfg", true, true))))
                .expectErrorSatisfies(e -> {
                    assertBizError(e, BizError.INVALID_PASSWORD);
                    assertThat(((BizException) e).getMessageKey()).isEqualTo(INVALID_EMAIL_OR_PASSWORD);
                })
                .verify();
        verify(encryptionService, never()).matchPassword(anyString(), anyString());
        System.out.println("[FormAuthRequestTest] unknown login -> INVALID_PASSWORD / " + INVALID_EMAIL_OR_PASSWORD);
    }

    // ------------------------------------------------------------- registration

    private void assertRegistrationRefused(AbstractAuthConfig authConfig, String why) {
        StepVerifier.create(request.auth(context(true, authConfig)))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.UNSUPPORTED_OPERATION))
                .verify();
        verify(userService, never()).findBySourceAndId(anyString(), anyString());
        System.out.println("[FormAuthRequestTest] registration refused: " + why);
    }

    /** Catches registration through a config that must not allow it: registration disabled. */
    @Test
    void register_withRegistrationDisabled_isUnsupported() {
        assertRegistrationRefused(new EmailAuthConfig("cfg", true, false), "enableRegister=false");
    }

    /** Catches registration through a config of another source. */
    @Test
    void register_withAnotherSource_isUnsupported() {
        assertRegistrationRefused(Oauth2SimpleAuthConfig.builder().id("cfg").source("GITHUB").sourceName("Github").enable(true)
                .enableRegister(true).clientId("c").authType("GITHUB").build(), "source GITHUB");
    }

    /** Catches registration through a non-email config that claims the EMAIL source. */
    @Test
    void register_withANonEmailConfigOfTheEmailSource_isUnsupported() {
        assertRegistrationRefused(Oauth2SimpleAuthConfig.builder().id("cfg").source(AuthSourceConstants.EMAIL).sourceName("x").enable(true)
                .enableRegister(true).clientId("c").authType("GITHUB").build(), "not an EmailAuthConfig");
    }

    @Test
    void refresh_isNotSupported() {
        StepVerifier.create(request.refresh("any-refresh-token")).expectError(UnsupportedOperationException.class).verify();
        verify(userService, never()).findBySourceAndId(any(), any());
        System.out.println("[FormAuthRequestTest] refresh -> UnsupportedOperationException");
    }
}

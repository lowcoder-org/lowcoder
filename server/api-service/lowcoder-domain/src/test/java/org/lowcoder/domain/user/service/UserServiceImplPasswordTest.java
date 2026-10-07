package org.lowcoder.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.organization.service.OrganizationService.PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT;
import static org.lowcoder.domain.user.service.UserServiceFixture.ORG_ID;
import static org.lowcoder.domain.user.service.UserServiceFixture.USER_EMAIL;
import static org.lowcoder.domain.user.service.UserServiceFixture.USER_ID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.HashUtils;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Password flows of {@code UserServiceImpl} (unit U10, task L3-2): change, reset, forgot-password and reset-by-token,
 * against a mocked repository and the real password hashing. Complements the server E2E tests, which only cover the
 * successful token reset, the never-requested account, and the soft-deleted account through MongoDB.
 */
class UserServiceImplPasswordTest {

    private static final String OLD_PASSWORD = "old-password";
    private static final String NEW_PASSWORD = "new-password";
    private static final String TOKEN = "reset-token";
    private static final String MISSING_USER_ID = "missing";
    private static final String USER_NOT_EXIST_KEY = "USER_NOT_EXIST";
    /** Wide margin so nothing depends on timing. */
    private static final Duration ONE_HOUR = Duration.ofHours(1);

    private UserServiceFixture fixture;
    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        fixture = new UserServiceFixture();
        service = fixture.service;
    }

    private void stubFindById(User user) {
        when(fixture.repository.findById(USER_ID)).thenReturn(Mono.just(user));
    }

    private void stubEmailLookup(User... users) {
        when(fixture.repository.findByEmailOrConnections_Email(USER_EMAIL, USER_EMAIL)).thenReturn(Flux.just(users));
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).isEqualTo(expected);
        assertThat(biz.getMessageKey()).isEqualTo(messageKey);
    }

    // ---------------------------------------------------------------- updatePassword

    /** Catches a password changed although the old one does not match (:389). */
    @Test
    void updatePassword_wrongOldPassword_failsAndNeverSaves() {
        User user = fixture.userWithPassword(OLD_PASSWORD);
        String storedHash = user.getPassword();
        stubFindById(user);

        StepVerifier.create(service.updatePassword(USER_ID, "not-the-old-one", NEW_PASSWORD))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PASSWORD, "INVALID_PASSWORD"))
                .verify();
        verify(fixture.repository, never()).save(any(User.class));
        assertThat(user.getPassword()).isEqualTo(storedHash);
        System.out.println("[UserServiceImplPasswordTest] wrong old password -> INVALID_PASSWORD, nothing saved");
    }

    /** Catches an account without a password (SSO-only) getting one set through the change-password flow (:384). */
    @ParameterizedTest
    @NullAndEmptySource
    void updatePassword_blankStoredPassword_failsWithInvalidPassword(String storedPassword) {
        User user = User.builder().id(USER_ID).password(storedPassword).build();
        stubFindById(user);

        StepVerifier.create(service.updatePassword(USER_ID, "anything", NEW_PASSWORD))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PASSWORD, "INVALID_PASSWORD"))
                .verify();
        verify(fixture.repository, never()).save(any(User.class));
        System.out.println("[UserServiceImplPasswordTest] blank stored password (" + storedPassword + ") rejected");
    }

    /** Catches the new password stored in plain text or the old one kept (:393). */
    @Test
    void updatePassword_correctOldPassword_savesHashOfNewPassword() {
        User user = fixture.userWithPassword(OLD_PASSWORD);
        stubFindById(user);

        StepVerifier.create(service.updatePassword(USER_ID, OLD_PASSWORD, NEW_PASSWORD))
                .expectNext(true)
                .verifyComplete();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(fixture.repository).save(saved.capture());
        String hash = saved.getValue().getPassword();
        assertThat(hash).isNotEqualTo(NEW_PASSWORD);
        assertThat(fixture.encryptionService.matchPassword(NEW_PASSWORD, hash)).isTrue();
        assertThat(fixture.encryptionService.matchPassword(OLD_PASSWORD, hash)).isFalse();
        System.out.println("[UserServiceImplPasswordTest] updatePassword stored a hash that matches only the new password");
    }

    // ---------------------------------------------------------------- resetPassword / setPassword / markAsSuperAdmin

    /** Catches a plaintext password persisted, or a different value returned than the one hashed (:409-412). */
    @Test
    void resetPassword_returnsPlaintextOnce_andStoresItsHash() {
        User user = fixture.userWithPassword(OLD_PASSWORD);
        stubFindById(user);

        StepVerifier.create(service.resetPassword(USER_ID))
                .assertNext(plain -> {
                    assertThat(plain).hasSize(12);
                    assertThat(user.getPassword()).isNotEqualTo(plain);
                    assertThat(fixture.encryptionService.matchPassword(plain, user.getPassword())).isTrue();
                    assertThat(fixture.encryptionService.matchPassword(OLD_PASSWORD, user.getPassword())).isFalse();
                })
                .verifyComplete();
        verify(fixture.repository).save(user);
        System.out.println("[UserServiceImplPasswordTest] resetPassword returned a 12 char password whose hash was saved");
    }

    /** Catches a reset on an account that never had a password (:405). */
    @ParameterizedTest
    @NullAndEmptySource
    void resetPassword_blankStoredPassword_failsPasswordNotSetYet(String storedPassword) {
        stubFindById(User.builder().id(USER_ID).password(storedPassword).build());

        StepVerifier.create(service.resetPassword(USER_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PASSWORD, "PASSWORD_NOT_SET_YET"))
                .verify();
        verify(fixture.repository, never()).save(any(User.class));
        System.out.println("[UserServiceImplPasswordTest] resetPassword on blank password -> PASSWORD_NOT_SET_YET");
    }

    /** Catches a plaintext password stored by setPassword (:478). */
    @Test
    void setPassword_encryptsAndSaves() {
        User user = User.builder().id(USER_ID).build();
        stubFindById(user);
        StepVerifier.create(service.setPassword(USER_ID, NEW_PASSWORD)).expectNext(true).verifyComplete();
        assertThat(user.getPassword()).isNotEqualTo(NEW_PASSWORD);
        assertThat(fixture.encryptionService.matchPassword(NEW_PASSWORD, user.getPassword())).isTrue();
        verify(fixture.repository).save(user);
        System.out.println("[UserServiceImplPasswordTest] setPassword stored a hash that matches the password");
    }

    /** Catches the super admin flag not being set (:489). */
    @Test
    void markAsSuperAdmin_setsFlagAndSaves() {
        User user = User.builder().id(USER_ID).build();
        stubFindById(user);
        StepVerifier.create(service.markAsSuperAdmin(USER_ID)).expectNext(true).verifyComplete();
        assertThat(user.getSuperAdmin()).isTrue();
        verify(fixture.repository).save(user);
        System.out.println("[UserServiceImplPasswordTest] markAsSuperAdmin set the flag and saved");
    }

    // ---------------------------------------------------------------- resetLostPassword

    private static User userWithResetToken(String token, Instant expiry) {
        return User.builder()
                .id(USER_ID)
                .email(USER_EMAIL)
                .passwordResetToken(token == null ? null : HashUtils.hash(token.getBytes()))
                .passwordResetTokenExpiry(expiry)
                .build();
    }

    /** Catches an account takeover with a guessed token (:453): wrong token is rejected and nothing is saved. */
    @Test
    void resetLostPassword_wrongToken_isRejectedAndPasswordUnchanged() {
        User user = userWithResetToken(TOKEN, Instant.now().plus(ONE_HOUR));
        user.setPassword("untouched-hash");
        stubEmailLookup(user);

        StepVerifier.create(service.resetLostPassword(USER_EMAIL, "guessed-token", NEW_PASSWORD))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "INVALID_TOKEN"))
                .verify();
        verify(fixture.repository, never()).save(any(User.class));
        assertThat(user.getPassword()).isEqualTo("untouched-hash");
        System.out.println("[UserServiceImplPasswordTest] wrong reset token -> INVALID_TOKEN, password untouched");
    }

    static Stream<Arguments> expiries() {
        return Stream.of(
                Arguments.of("expired an hour ago", Instant.now().minus(ONE_HOUR)),
                Arguments.of("expires right now", Instant.now()),
                Arguments.of("no expiry stored", null));
    }

    /** Catches an expiry bypass or an NPE on an account without an expiry (:448-449), even with the right token. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("expiries")
    void resetLostPassword_expiredOrMissingExpiry_isRejected(String label, Instant expiry) {
        User user = userWithResetToken(TOKEN, expiry);
        stubEmailLookup(user);

        StepVerifier.create(service.resetLostPassword(USER_EMAIL, TOKEN, NEW_PASSWORD))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "TOKEN_EXPIRED"))
                .verify();
        verify(fixture.repository, never()).save(any(User.class));
        System.out.println("[UserServiceImplPasswordTest] reset token " + label + " -> TOKEN_EXPIRED");
    }

    /** Catches token reuse after a successful reset (:457-459): the token is cleared and a second use fails. */
    @Test
    void resetLostPassword_success_setsHashAndInvalidatesTheToken() {
        User user = userWithResetToken(TOKEN, Instant.now().plus(ONE_HOUR));
        stubEmailLookup(user);

        StepVerifier.create(service.resetLostPassword(USER_EMAIL, TOKEN, NEW_PASSWORD))
                .expectNext(true)
                .verifyComplete();

        assertThat(fixture.encryptionService.matchPassword(NEW_PASSWORD, user.getPassword())).isTrue();
        assertThat(user.getPasswordResetToken()).isEmpty();
        assertThat(user.getPasswordResetTokenExpiry()).isBeforeOrEqualTo(Instant.now());
        verify(fixture.repository).save(user);

        StepVerifier.create(service.resetLostPassword(USER_EMAIL, TOKEN, "another-password"))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "TOKEN_EXPIRED"))
                .verify();
        assertThat(fixture.encryptionService.matchPassword(NEW_PASSWORD, user.getPassword())).isTrue();
        System.out.println("[UserServiceImplPasswordTest] reset succeeded once; the same token fails the second time");
    }

    /** Catches resetting a soft-deleted account (:443). */
    @Test
    void resetLostPassword_deletedAccount_isNotRecoverable() {
        User user = userWithResetToken(TOKEN, Instant.now().plus(ONE_HOUR));
        user.setState(UserState.DELETED);
        stubEmailLookup(user);
        when(fixture.repository.findByName(USER_EMAIL)).thenReturn(Mono.empty());

        StepVerifier.create(service.resetLostPassword(USER_EMAIL, TOKEN, NEW_PASSWORD)).verifyComplete();
        verify(fixture.repository, never()).save(any(User.class));
        System.out.println("[UserServiceImplPasswordTest] deleted account -> empty result, nothing saved");
    }

    /** Catches the lookup by name being lost (:442): an e-mail lookup without hit falls back to the user name. */
    @Test
    void resetLostPassword_fallsBackToLookupByName() {
        User user = userWithResetToken(TOKEN, Instant.now().plus(ONE_HOUR));
        when(fixture.repository.findByEmailOrConnections_Email("some-handle", "some-handle")).thenReturn(Flux.empty());
        when(fixture.repository.findByName("some-handle")).thenReturn(Mono.just(user));

        StepVerifier.create(service.resetLostPassword("some-handle", TOKEN, NEW_PASSWORD))
                .expectNext(true)
                .verifyComplete();
        verify(fixture.repository).findByName("some-handle");
        System.out.println("[UserServiceImplPasswordTest] reset resolved the account by name after an empty e-mail lookup");
    }

    // ---------------------------------------------------------------- lostPassword

    private void stubOrgOfUser() {
        when(fixture.orgMemberService.getCurrentOrgMember(USER_ID))
                .thenReturn(Mono.just(OrgMember.builder().orgId(ORG_ID).userId(USER_ID).build()));
        when(fixture.organizationService.getById(ORG_ID)).thenReturn(Mono.just(Organization.builder().build()));
    }

    /**
     * Catches a plaintext reset token stored, or a wrong lifetime (:429-435): the token handed to the mail hashes to
     * the stored value, and the expiry is twelve hours ahead.
     */
    @Test
    void lostPassword_mailSent_storesTokenHashAndTwelveHourExpiry() {
        User user = User.builder().id(USER_ID).email(USER_EMAIL).build();
        stubEmailLookup(user);
        stubOrgOfUser();
        when(fixture.emailCommunicationService.sendPasswordResetEmail(eq(USER_EMAIL), any(), any())).thenReturn(true);
        Instant before = Instant.now();

        StepVerifier.create(service.lostPassword(USER_EMAIL)).verifyComplete();

        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(fixture.emailCommunicationService).sendPasswordResetEmail(eq(USER_EMAIL), token.capture(),
                eq(PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT));
        assertThat(token.getValue()).hasSize(12);
        assertThat(user.getPasswordResetToken()).isEqualTo(HashUtils.hash(token.getValue().getBytes()));
        assertThat(user.getPasswordResetToken()).isNotEqualTo(token.getValue());
        assertThat(user.getPasswordResetTokenExpiry())
                .isBetween(before.plus(Duration.ofHours(12)).minusSeconds(60), Instant.now().plus(Duration.ofHours(12)).plusSeconds(60));
        verify(fixture.repository).save(user);
        System.out.println("[UserServiceImplPasswordTest] lostPassword stored the token hash and a 12 hour expiry");
    }

    /** Catches a valid token stored for a mail that was never sent (:430). */
    @Test
    void lostPassword_mailSendFails_storesNothing() {
        User user = User.builder().id(USER_ID).email(USER_EMAIL).build();
        stubEmailLookup(user);
        stubOrgOfUser();
        when(fixture.emailCommunicationService.sendPasswordResetEmail(any(), any(), any())).thenReturn(false);

        StepVerifier.create(service.lostPassword(USER_EMAIL)).verifyComplete();
        verify(fixture.repository, never()).save(any(User.class));
        assertThat(user.getPasswordResetToken()).isNull();
        assertThat(user.getPasswordResetTokenExpiry()).isNull();
        System.out.println("[UserServiceImplPasswordTest] mail not sent -> no token stored");
    }

    /** Catches a mail sent for an unknown or soft-deleted account (:420): both end empty without a mail or a save. */
    @Test
    void lostPassword_unknownAndDeletedAccount_sendNothing() {
        when(fixture.repository.findByEmailOrConnections_Email("nobody@example.com", "nobody@example.com")).thenReturn(Flux.empty());
        when(fixture.repository.findByName("nobody@example.com")).thenReturn(Mono.empty());
        StepVerifier.create(service.lostPassword("nobody@example.com")).verifyComplete();

        User deleted = User.builder().id(USER_ID).email(USER_EMAIL).state(UserState.DELETED).build();
        stubEmailLookup(deleted);
        when(fixture.repository.findByName(USER_EMAIL)).thenReturn(Mono.empty());
        stubOrgOfUser();
        StepVerifier.create(service.lostPassword(USER_EMAIL)).verifyComplete();

        verify(fixture.emailCommunicationService, never()).sendPasswordResetEmail(any(), any(), any());
        verify(fixture.repository, never()).save(any(User.class));
        System.out.println("[UserServiceImplPasswordTest] unknown and deleted accounts -> no mail, no save");
    }

    private static final String CUSTOM_RESET_TEMPLATE = "<p>custom %s %s</p>";

    /** Runs lostPassword for a member of an org with these common settings and answers the template the mail was sent with. */
    private String templateSentFor(OrganizationCommonSettings settings) {
        User user = User.builder().id(USER_ID).email(USER_EMAIL).build();
        stubEmailLookup(user);
        when(fixture.orgMemberService.getCurrentOrgMember(USER_ID))
                .thenReturn(Mono.just(OrgMember.builder().orgId(ORG_ID).userId(USER_ID).build()));
        when(fixture.organizationService.getById(ORG_ID))
                .thenReturn(Mono.just(Organization.builder().commonSettings(settings).build()));
        when(fixture.emailCommunicationService.sendPasswordResetEmail(any(), any(), any())).thenReturn(true);

        StepVerifier.create(service.lostPassword(USER_EMAIL)).verifyComplete();

        ArgumentCaptor<String> template = ArgumentCaptor.forClass(String.class);
        verify(fixture.emailCommunicationService).sendPasswordResetEmail(eq(USER_EMAIL), any(), template.capture());
        return template.getValue();
    }

    /**
     * BF-041 fixed: lostPassword looked the org's reset-mail template up with the default template's own text as the key,
     * so an org with a custom template still got the default one. It now reads {@code PASSWORD_RESET_EMAIL_TEMPLATE}.
     */
    @Test
    void lostPassword_orgWithCustomResetTemplate_sendsTheCustomTemplateBF041() {
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put(OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE, CUSTOM_RESET_TEMPLATE);

        String sent = templateSentFor(settings);

        System.out.println("[UserServiceImplPasswordTest] custom reset template -> sent with " + sent);
        assertThat(sent).isEqualTo(CUSTOM_RESET_TEMPLATE);
    }

    static Stream<Arguments> noUsableTemplate() {
        return Stream.of(
                Arguments.of("no template stored", null, false),
                Arguments.of("a blank template", "  ", true),
                Arguments.of("a number (common settings take any JSON value)", 42, true),
                Arguments.of("an object", java.util.Map.of("html", CUSTOM_RESET_TEMPLATE), true));
    }

    /**
     * BF-041: with the right key, whatever an admin stored is read; anything but a non-blank text gives the default
     * template instead of failing the unauthenticated lost-password request (a non-text value was cast to String).
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("noUsableTemplate")
    void lostPassword_withoutAUsableCustomTemplate_sendsTheDefaultTemplateBF041(String label, Object stored, boolean present) {
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        if (present) {
            settings.put(OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE, stored);
        }

        String sent = templateSentFor(settings);

        System.out.println("[UserServiceImplPasswordTest] " + label + " -> default template sent: " + PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT.equals(sent));
        assertThat(sent).isEqualTo(PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT);
    }

    /**
     * BF-100 (was pinned as the plan section 9 row "updatePassword, setPassword and markAsSuperAdmin emit true though
     * nothing was saved"): for an unknown user id each fails with USER_NOT_EXIST and saves nothing; each used to end in
     * {@code flatMap(save).thenReturn(true)}, which emitted true after the empty lookup.
     */
    @ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(strings = {"updatePassword", "setPassword", "markAsSuperAdmin"})
    void unknownUser_updatePasswordSetPasswordMarkAsSuperAdmin_failWithUserNotExistAndSaveNothingBF100(String method) {
        when(fixture.repository.findById(MISSING_USER_ID)).thenReturn(Mono.empty());
        Mono<Boolean> result = switch (method) {
            case "updatePassword" -> service.updatePassword(MISSING_USER_ID, OLD_PASSWORD, NEW_PASSWORD);
            case "setPassword" -> service.setPassword(MISSING_USER_ID, NEW_PASSWORD);
            default -> service.markAsSuperAdmin(MISSING_USER_ID);
        };

        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertBizError(error, BizError.USER_NOT_EXIST, USER_NOT_EXIST_KEY))
                .verify();
        verify(fixture.repository, never()).save(any(User.class));
        System.out.println("[UserServiceImplPasswordTest] " + method + " on an unknown id -> USER_NOT_EXIST, nothing saved (BF-100)");
    }
}

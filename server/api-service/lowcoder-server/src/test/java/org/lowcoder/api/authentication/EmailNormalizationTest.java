package org.lowcoder.api.authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.BizError.INVALID_EMAIL_FORMAT;
import static org.lowcoder.sdk.exception.BizError.USER_LOGIN_ID_EXIST;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.AuthenticationEndpoints.FormLoginRequest;
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
import org.lowcoder.sdk.util.EmailUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;

import lombok.extern.slf4j.Slf4j;

/**
 * End-to-end cover for email sanitization, driven through {@link AuthenticationController#formLogin} -- the
 * same entry point the browser hits -- so it exercises the whole chain: the shape check in
 * {@code FormAuthRequest}, the two-probe lookups in {@code UserServiceImpl}, the normalization in
 * {@code AuthUser#toAuthConnection} and {@code createNewUserByAuthUser}, and the case-insensitive connection
 * match in {@code AuthenticationApiServiceImpl#getAuthConnection}.
 *
 * <p>The bug being closed: {@code john@doe.com} and {@code JoHn@DoE.com} registered as two separate
 * accounts, because nothing normalized and MongoDB has no collation on these fields.
 *
 * <p>The constraint being respected: an account stored with mixed case must keep working exactly as before,
 * whether or not the backfill (changeset {@code 032}) has reached it -- and it never does here, because
 * {@code DatabaseChangelog} is {@code @Profile("!test")}. {@link #legacyMixedCaseAccountStillLogsIn} is the
 * regression guard, and {@link #legacyMixedCaseAccountIsNotReachableByItsLowercaseForm} pins the lookup
 * limitation that remains for any row the backfill leaves in place.
 *
 * <p>Every test uses its own address: this class shares an application context, and therefore one database,
 * with the other {@code @ActiveProfiles("test")} test classes.
 */
@SpringBootTest
@ActiveProfiles("test")
@Slf4j
public class EmailNormalizationTest {

    private static final String SOURCE = AuthSourceConstants.EMAIL;
    private static final String PASSWORD = "lowcoder";

    @Autowired
    private AuthenticationController authenticationController;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private AuthenticationService authenticationService;

    private String getEmailAuthConfigId() {
        return authenticationService.findAuthConfigBySource(null, AuthSourceConstants.EMAIL)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .block();
    }

    /** Drives the real endpoint. {@code register} true is sign-up, false is sign-in. */
    private void formLogin(String loginId, boolean register) {
        FormLoginRequest request = new FormLoginRequest(loginId, PASSWORD, register, SOURCE, getEmailAuthConfigId());
        MockServerWebExchange exchange =
                MockServerWebExchange.builder(MockServerHttpRequest.post("").build()).build();
        authenticationController.formLogin(request, null, null, exchange).block();
    }

    private BizException formLoginExpectingFailure(String loginId, boolean register) {
        try {
            formLogin(loginId, register);
        } catch (BizException e) {
            return e;
        }
        throw new AssertionError("expected formLogin(\"" + loginId + "\", register=" + register
                + ") to fail, but it succeeded");
    }

    private User findByRawId(String rawId) {
        return userRepository.findByConnections_SourceAndConnections_RawId(SOURCE, rawId).block();
    }

    private Connection emailConnection(User user) {
        return user.getConnections().stream()
                .filter(connection -> SOURCE.equals(connection.getSource()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("user " + user.getId() + " has no EMAIL connection"));
    }

    private void logUser(String label, User user) {
        if (user == null) {
            log.info("{}: <no user>", label);
            return;
        }
        log.info("{}: id={} name={} email={} connections={}", label, user.getId(), user.getName(),
                user.getEmail(),
                user.getConnections().stream()
                        .map(c -> c.getSource() + ":" + c.getRawId() + " (email=" + c.getEmail() + ")")
                        .toList());
    }

    // ------------------------------------------------------------------ writes

    /**
     * Registration is the main writer of an address. Whatever case the user typed, one canonical form has to
     * land in {@code user.email} and in the connection, or the next login is a coin flip.
     */
    @Test
    public void registrationStoresTheAddressInCanonicalForm() {
        String typed = "MiXeD.Case@Example.COM";
        String canonical = "mixed.case@example.com";

        formLogin(typed, true);

        User user = findByRawId(canonical);
        logUser("registered as " + typed, user);
        assertNotNull(user, "the account must be reachable by the canonical rawId " + canonical);

        assertEquals(canonical, user.getEmail(), "user.email must be stored canonical");
        Connection connection = emailConnection(user);
        assertEquals(canonical, connection.getRawId(), "connection.rawId must be stored canonical");
        assertEquals(canonical, connection.getEmail(), "connection.email must be stored canonical");

        assertNull(findByRawId(typed),
                "nothing may remain stored under the typed casing " + typed);

        // user.name keeps what the user typed. Pinned so a future change to name handling is a deliberate
        // one. It is no longer a lookup key: UserServiceImpl#lostPassword and #resetLostPassword now
        // resolve by address via findByEmailDeep, falling back to findByName only when that finds
        // nothing, so password recovery is case-insensitive like login.
        assertEquals(typed, user.getName(), "user.name is left as typed");
    }

    /** Surrounding whitespace is stripped by the same normalization, not stored into the identifier. */
    @Test
    public void registrationTrimsSurroundingWhitespace() {
        String typed = "  padded@example.com\t";
        String canonical = "padded@example.com";

        formLogin(typed, true);

        User user = findByRawId(canonical);
        logUser("registered as " + EmailUtils.normalize(typed) + " (typed with padding)", user);
        assertNotNull(user, "the account must be reachable by the trimmed rawId " + canonical);
        assertEquals(canonical, user.getEmail());
        assertEquals(canonical, emailConnection(user).getRawId());
    }

    // ------------------------------------------------------------------- the bug

    /**
     * The bug this branch exists to close. Before the fix, the second registration found nothing -- the
     * lookup was a byte-exact match on the typed casing -- and happily created a second account for the same
     * address.
     */
    @Test
    public void registrationRejectsADuplicateThatDiffersOnlyInCase() {
        formLogin("dup@example.com", true);

        BizException exception = formLoginExpectingFailure("DuP@Example.COM", true);
        log.info("second registration rejected with {} / {}", exception.getError(), exception.getMessageKey());

        assertEquals(USER_LOGIN_ID_EXIST, exception.getError());
        assertEquals("USER_LOGIN_ID_EXIST", exception.getMessageKey());

        assertNull(findByRawId("DuP@Example.COM"), "no second account may have been created");
    }

    /**
     * The other half of the same bug: having registered once, the user must be able to sign in however they
     * type it. This is also what proves {@code getAuthConnection} agrees with the lookup -- it runs on the
     * login path after the user is resolved, and a byte-exact comparison there would throw on exactly this
     * login rather than returning a connection.
     */
    @Test
    public void loginSucceedsWhenTheTypedCaseDiffersFromTheStoredAddress() {
        String canonical = "caselogin@example.com";
        formLogin(canonical, true);
        User afterRegister = findByRawId(canonical);
        assertNotNull(afterRegister);
        String userId = afterRegister.getId();

        formLogin("CaseLogin@Example.COM", false);

        User afterLogin = findByRawId(canonical);
        logUser("after mixed-case login", afterLogin);
        assertNotNull(afterLogin, "the mixed-case login must resolve to the existing account");
        assertEquals(userId, afterLogin.getId(), "it must be the SAME account, not a new one");
        assertEquals(UserState.ACTIVATED, afterLogin.getState());
        assertTrue(encryptionService.matchPassword(PASSWORD, afterLogin.getPassword()));

        assertEquals(1, afterLogin.getConnections().size(),
                "the login must reuse the existing connection, not append a second one");
        assertEquals(canonical, emailConnection(afterLogin).getRawId(),
                "the stored rawId must stay canonical -- the login must not rewrite it to the typed casing");
        assertNull(findByRawId("CaseLogin@Example.COM"), "no second account may have been created");
    }

    // ----------------------------------------------------------- no regression

    /**
     * The no-migration guarantee, as a test. An account written before normalization holds whatever case the
     * user typed back then; signing in with that same value must still work. A single normalized probe would
     * fail here -- it would look up {@code legacy@example.com}, find nothing, and lock the account out.
     */
    @Test
    public void legacyMixedCaseAccountStillLogsIn() {
        String legacy = "Legacy@Example.COM";
        User seeded = userRepository.save(User.builder()
                        .name(legacy)
                        .email(legacy)
                        .password(encryptionService.encryptPassword(PASSWORD))
                        .state(UserState.ACTIVATED)
                        .isEnabled(true)
                        .connections(Set.of(Connection.builder()
                                .source(SOURCE)
                                .name(legacy)
                                .rawId(legacy)
                                .email(legacy)
                                .build()))
                        .build())
                .block();
        assertNotNull(seeded);
        logUser("seeded pre-normalization account", seeded);

        formLogin(legacy, false);

        User afterLogin = findByRawId(legacy);
        logUser("after legacy login", afterLogin);
        assertNotNull(afterLogin, "a pre-normalization account must still be found by its stored value");
        assertEquals(seeded.getId(), afterLogin.getId(), "it must be the SAME account, not a new one");
        assertEquals(legacy, emailConnection(afterLogin).getRawId(),
                "logging in must not rewrite the stored value; only changeset 032 converges it");
    }

    /**
     * The known limitation of two byte-exact probes, pinned deliberately. Reaching a stored
     * {@code Stored@Example.COM} from the input {@code stored@example.com} needs a case-insensitive query,
     * which MongoDB cannot serve from the existing {@code (connections.source, connections.rawId)} index.
     *
     * <p>This describes the <i>lookup</i>, and it stays true even though the backfill migration now ships.
     * The migration converges stored data; it does not give the query case-insensitivity. So this remains
     * the behaviour for every row the backfill does not rewrite -- a member of a reported conflict group,
     * a row written by something outside the normalizing paths, or an install where changeset {@code 032}
     * has not run yet.
     *
     * <p>It therefore keeps its assertions rather than being inverted. The converged case is covered
     * separately, end to end, by
     * {@code EmailBackfillEndToEndTest#aLegacyMixedCaseAccountBecomesReachableByItsLowercaseForm}; this
     * test seeds its own row under the {@code test} profile, where {@code DatabaseChangelog} is disabled,
     * so no migration ever touches it.
     */
    @Test
    public void legacyMixedCaseAccountIsNotReachableByItsLowercaseForm() {
        String legacy = "Stored@Example.COM";
        userRepository.save(User.builder()
                        .name(legacy)
                        .email(legacy)
                        .password(encryptionService.encryptPassword(PASSWORD))
                        .state(UserState.ACTIVATED)
                        .isEnabled(true)
                        .connections(Set.of(Connection.builder()
                                .source(SOURCE)
                                .name(legacy)
                                .rawId(legacy)
                                .email(legacy)
                                .build()))
                        .build())
                .block();

        User byLowercase = findByRawId("stored@example.com");
        log.info("lookup of the lowercase form of a mixed-case stored account: {}",
                byLowercase == null ? "<not found, as documented>" : byLowercase.getId());
        assertNull(byLowercase, "documents the limitation: converging these needs the backfill migration");
    }

    // --------------------------------------------------------------- shape check

    /**
     * Registration used to accept anything, including the empty string, and store it as an address. An
     * account whose address is {@code ""} is then resolvable by a subsequent login that also sends
     * {@code ""} -- which is why the shape check runs before anything is created.
     */
    @ParameterizedTest(name = "registration rejects [{0}]")
    @ValueSource(strings = {
            "",
            "   ",
            "notanemail",
            "@example.com",
            "user@",
            "a@b@c.com",
            "John Doe@example.com",
            "Iron Man",
    })
    public void registrationRejectsValuesThatAreNotAddresses(String notAnAddress) {
        BizException exception = formLoginExpectingFailure(notAnAddress, true);
        log.info("registration of [{}] rejected with {} / {}", notAnAddress, exception.getError(),
                exception.getMessageKey());

        assertEquals(INVALID_EMAIL_FORMAT, exception.getError());
        assertEquals("INVALID_EMAIL_FORMAT", exception.getMessageKey());

        assertNull(findByRawId(notAnAddress), "nothing may have been stored for [" + notAnAddress + "]");
        assertNull(findByRawId(EmailUtils.normalize(notAnAddress)),
                "nothing may have been stored for the normalized form of [" + notAnAddress + "]");
    }
}

package org.lowcoder.api.authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.BizError.ALREADY_BIND;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.runner.migrations.job.EmailNormalizationBackfill;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.HashUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import lombok.extern.slf4j.Slf4j;

/**
 * Proves the backfill actually closes the holes the sanitization branch documented, exercised through the
 * real services rather than against the migration's own collections.
 *
 * <p>Its own profile, so it gets its own application context and its own embedded mongod. It must not use
 * the {@code test} profile: that shares one {@code user} collection with every other {@code test}-profile
 * class, and running a real backfill across it would rewrite their fixtures.
 *
 * <p>A side effect of naming a profile is that {@code test} is not active, so {@code DatabaseChangelog}
 * (which is {@code @Profile("!test")}) runs for real at context startup — including changeset 032 against
 * an empty collection, and the changesets that build the unique sparse index this test then relies on.
 */
@SpringBootTest
@ActiveProfiles("emailBackfill")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class EmailBackfillEndToEndTest {

    private static final String SOURCE = AuthSourceConstants.EMAIL;
    private static final String PASSWORD = "lowcoder";

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private MongoTemplate blockingMongoTemplate;

    /** Writes a row in the shape a pre-normalization install holds it: whatever casing the user typed. */
    private User seedLegacy(String storedAddress) {
        Set<Connection> connections = new HashSet<>();
        connections.add(Connection.builder()
                .source(SOURCE)
                .name(storedAddress)
                .rawId(storedAddress)
                .email(storedAddress)
                .build());
        User user = userRepository.save(User.builder()
                        .name(storedAddress)
                        .email(storedAddress)
                        .password(encryptionService.encryptPassword(PASSWORD))
                        .state(UserState.ACTIVATED)
                        .isEnabled(true)
                        .connections(connections)
                        .build())
                .block();
        assertNotNull(user);
        return user;
    }

    private void runBackfill() {
        log.info("backfill: {}", EmailNormalizationBackfill.run(blockingMongoTemplate.getDb()));
    }

    /**
     * The headline fix. Before the backfill this lookup misses — it is the limitation
     * {@code EmailNormalizationTest.legacyMixedCaseAccountIsNotReachableByItsLowercaseForm} pins.
     */
    @Test
    public void aLegacyMixedCaseAccountBecomesReachableByItsLowercaseForm() {
        String stored = "Reachable.Legacy@Example.COM";
        String typed = "reachable.legacy@example.com";
        User seeded = seedLegacy(stored);

        assertNull(userService.findBySourceAndId(SOURCE, typed).block(),
                "precondition: the lowercase form does not reach it before the backfill");

        runBackfill();

        User found = userService.findBySourceAndId(SOURCE, typed).block();
        assertNotNull(found, "after the backfill the canonical form must resolve the account");
        assertEquals(seeded.getId(), found.getId(), "and it must be the same account, not a new one");
        assertEquals(typed, found.getEmail(), "its stored address is now canonical");
        assertTrue(encryptionService.matchPassword(PASSWORD, found.getPassword()),
                "the credential must survive the migration untouched");
    }

    /** The other half: the duplicate that the un-migrated row used to let through is now caught. */
    @Test
    public void bindEmailFindsALegacyMixedCaseOwnerAfterTheBackfill() {
        String stored = "Bindable.Legacy@Example.COM";
        String typed = "bindable.legacy@example.com";
        seedLegacy(stored);
        runBackfill();

        User binder = userRepository.save(User.builder()
                        .name("sso-only-binder-e2e")
                        .isEnabled(true)
                        .connections(new HashSet<>())
                        .build())
                .block();
        assertNotNull(binder);

        BizException exception = null;
        try {
            userService.bindEmail(binder, typed).block();
        } catch (BizException e) {
            exception = e;
        }
        assertNotNull(exception, "binding an address another account holds must now be rejected");
        log.info("bind rejected with {} / {}", exception.getError(), exception.getMessageKey());
        assertEquals(ALREADY_BIND, exception.getError());
    }

    /**
     * Password recovery, which this change moved off {@code findByName} and onto the email lookup. Driven
     * through {@code resetLostPassword} with the token seeded directly, so the test needs no SMTP.
     */
    @Test
    public void passwordRecoveryResolvesAnAccountWhateverCaseIsTyped() {
        String stored = "Recover.Legacy@Example.COM";
        User seeded = seedLegacy(stored);

        String token = "reset-token-e2e";
        seeded.setPasswordResetToken(HashUtils.hash(token.getBytes()));
        seeded.setPasswordResetTokenExpiry(Instant.now().plus(1, ChronoUnit.HOURS));
        userRepository.save(seeded).block();

        runBackfill();

        Boolean reset = userService.resetLostPassword("RECOVER.LEGACY@EXAMPLE.COM", token, "new-password")
                .block();
        assertEquals(Boolean.TRUE, reset, "recovery must resolve the account regardless of typed case");

        User after = userRepository.findById(seeded.getId()).block();
        assertNotNull(after);
        assertTrue(encryptionService.matchPassword("new-password", after.getPassword()),
                "and must actually have changed the password");
    }

    /** The pre-existing NPE this change would otherwise have made far more reachable. */
    @Test
    public void passwordResetOnAnAccountThatNeverRequestedOneFailsCleanly() {
        seedLegacy("NoToken.Legacy@Example.COM");
        runBackfill();

        BizException exception = null;
        try {
            userService.resetLostPassword("notoken.legacy@example.com", "whatever", "new-password").block();
        } catch (BizException e) {
            exception = e;
        }
        assertNotNull(exception, "an account with no reset token must produce a clean error, not an NPE");
        log.info("no-token reset rejected with {} / {}", exception.getError(), exception.getMessageKey());
        assertEquals("TOKEN_EXPIRED", exception.getMessageKey());
    }

    /**
     * Resolving recovery by address rather than by {@code user.name} reaches strictly more rows, including
     * soft-deleted accounts, which keep their {@code email}. They must not be resettable: a reset cannot
     * log anyone in afterwards, but widening what an unauthenticated endpoint can mutate is not something
     * to do by accident.
     */
    @Test
    public void passwordRecoveryIgnoresASoftDeletedAccount() {
        String address = "Deleted.Legacy@Example.COM";
        User seeded = seedLegacy(address);
        String token = "reset-token-deleted";
        seeded.setPasswordResetToken(HashUtils.hash(token.getBytes()));
        seeded.setPasswordResetTokenExpiry(Instant.now().plus(1, ChronoUnit.HOURS));
        seeded.markAsDeleted();
        userRepository.save(seeded).block();

        runBackfill();

        Boolean reset = userService.resetLostPassword(address, token, "new-password").block();
        log.info("reset against a soft-deleted account returned {}", reset);
        assertNull(reset, "a deleted account must not be a password-reset target");
    }

    /**
     * An account that belongs to no workspace. It is a reachable state: {@code loginOrRegister} only
     * creates a default org when {@code authProperties.getWorkspaceCreation()} is on, so with workspace
     * creation disabled every new form registration lands here, as does anyone whose last org was
     * deleted or who was removed from it.
     *
     * <p>The backfill itself does not care — it never reads org membership. This pins that, and pins what
     * {@code lostPassword} does for such an account.
     */
    @Test
    public void anAccountInNoOrgIsStillConvergedByTheBackfill() {
        String stored = "Orgless.Legacy@Example.COM";
        String typed = "orgless.legacy@example.com";
        User seeded = seedLegacy(stored);

        runBackfill();

        User found = userService.findBySourceAndId(SOURCE, typed).block();
        assertNotNull(found, "org membership is irrelevant to the backfill");
        assertEquals(seeded.getId(), found.getId());
        assertEquals(typed, found.getEmail());

        // And recovery still resolves it, regardless of case: resetLostPassword does not consult orgs.
        User reloaded = userRepository.findById(seeded.getId()).block();
        assertNotNull(reloaded);
        String token = "orgless-token";
        reloaded.setPasswordResetToken(HashUtils.hash(token.getBytes()));
        reloaded.setPasswordResetTokenExpiry(Instant.now().plus(1, ChronoUnit.HOURS));
        userRepository.save(reloaded).block();

        assertEquals(Boolean.TRUE, userService.resetLostPassword(typed, token, "new-password").block(),
                "resetting must work for an account that belongs to no workspace");
    }

    /**
     * ...but <b>requesting</b> the token does not, and fails silently.
     *
     * <p>{@code lostPassword} zips the user with their current organization to pick an email template, and
     * {@code getCurrentOrgMember} completes empty for an account in no workspace. {@code zipWhen} with an
     * empty inner publisher yields empty, so the method stores no token, sends no mail, and reports
     * nothing — the caller cannot distinguish it from success.
     *
     * <p>Pre-existing and not caused by the email work, but it means password recovery is unusable for
     * this class of account regardless of casing, so it is pinned here rather than left as folklore.
     */
    @Test
    public void requestingAPasswordResetSilentlyDoesNothingForAnAccountInNoOrg() {
        String address = "orgless.request@example.com";
        User seeded = seedLegacy(address);

        Boolean requested = userService.lostPassword(address).block();
        log.info("lostPassword for an org-less account returned {}", requested);

        User after = userRepository.findById(seeded.getId()).block();
        assertNotNull(after);
        assertNull(after.getPasswordResetToken(),
                "no token is stored, and the caller is told nothing -- this is the gap");
    }

    /**
     * The honest counterpart: a genuine conflict is left in place by design, so the lowercase form still
     * does not reach it. This is what the collision policy costs, pinned so it stays visible.
     */
    @Test
    public void aConflictingPairIsLeftAloneAndStaysUnreachableByItsLowercaseForm() {
        String lower = "conflict.pair@example.com";
        String upper = "Conflict.Pair@Example.COM";
        User canonical = seedLegacy(lower);
        User mixed = seedLegacy(upper);

        runBackfill();

        User reloadedMixed = userRepository.findById(mixed.getId()).block();
        assertNotNull(reloadedMixed);
        assertEquals(upper, reloadedMixed.getEmail(),
                "a conflicting account must be left byte-for-byte as it was");

        User byLower = userService.findBySourceAndId(SOURCE, lower).block();
        assertNotNull(byLower);
        assertEquals(canonical.getId(), byLower.getId(),
                "the lowercase form still resolves the account that already held it");

        User byUpper = userService.findBySourceAndId(SOURCE, upper).block();
        assertNotNull(byUpper, "and the frozen account is still reachable by its own stored casing, "
                + "which is what makes freezing safe rather than a lockout");
        assertEquals(mixed.getId(), byUpper.getId());
    }

    /** The conflict report is the whole remediation story, so it has to actually land in the database. */
    @Test
    public void aConflictIsRecordedInTheReportCollection() {
        seedLegacy("reported.pair@example.com");
        seedLegacy("Reported.Pair@Example.COM");

        runBackfill();

        long rows = blockingMongoTemplate.getDb()
                .getCollection(EmailNormalizationBackfill.REPORT_COLLECTION)
                .countDocuments(com.mongodb.client.model.Filters.eq("normalizedValue",
                        "reported.pair@example.com"));
        log.info("report rows for the conflicting pair: {}", rows);
        assertTrue(rows >= 2, "both members of the group must be reported for an operator to resolve");
    }

    /** Re-running the changeset against already-converged data must be a no-op, not a second rewrite. */
    @Test
    public void reRunningTheBackfillChangesNothing() {
        seedLegacy("Rerun.Legacy@Example.COM");
        runBackfill();
        EmailNormalizationBackfill.Summary second =
                EmailNormalizationBackfill.run(blockingMongoTemplate.getDb());
        log.info("second run: {}", second);
        assertEquals(0, second.modified(), "a converged database must produce no writes on a re-run");
    }
}

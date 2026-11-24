package org.lowcoder.api.usermanagement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Real-MongoDB cover for {@code UserServiceImpl#setPasswordIfAbsent} (D-49): the domain unit test
 * ({@code UserServiceImplPasswordTest}) mocks {@code UserRepository}, so it never exercises the conditional
 * filter {@code CustomUserRepositoryImpl#setPasswordIfAbsent} builds. This class saves real users with
 * Testcontainers MongoDB and proves the filter itself, including that it is race-proof.
 */
@SpringBootTest
@ActiveProfiles("setPasswordIfAbsent")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class UserSetPasswordIfAbsentMongoTest {

    private static final String PASSWORDLESS_PASSWORD = "e2e-d49-passwordless-password";
    private static final String BLANK_STORED_PASSWORD = " ";
    private static final String ORIGINAL_PASSWORD = "e2e-d49-original-password";
    private static final String ATTEMPTED_PASSWORD = "e2e-d49-attempted-password";
    private static final int RACE_ROUNDS = 20;

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionService encryptionService;

    private static String uniqueName(String label) {
        return "UserSetPasswordIfAbsentMongoTest." + label + "." + UUID.randomUUID();
    }

    private User save(User user) {
        return userRepository.save(user).block();
    }

    private User reload(String userId) {
        return userRepository.findById(userId).block();
    }

    @Test
    void setPasswordIfAbsent_passwordlessUser_setsItAndEncryptsIt() {
        User user = save(User.builder().name(uniqueName("passwordless")).build());

        Boolean result = userService.setPasswordIfAbsent(user.getId(), PASSWORDLESS_PASSWORD).block();

        assertTrue(result, "setPasswordIfAbsent on a passwordless account");
        User reloaded = reload(user.getId());
        assertTrue(encryptionService.matchPassword(PASSWORDLESS_PASSWORD, reloaded.getPassword()),
                "the stored hash matches the password that was set");
        log.info("[UserSetPasswordIfAbsentMongoTest] passwordless user {} -> password set", user.getId());
    }

    @Test
    void setPasswordIfAbsent_blankStoredPassword_setsItAndEncryptsIt() {
        User user = save(User.builder().name(uniqueName("blank")).password(BLANK_STORED_PASSWORD).build());

        Boolean result = userService.setPasswordIfAbsent(user.getId(), PASSWORDLESS_PASSWORD).block();

        assertTrue(result, "setPasswordIfAbsent on a blank-password account (the regex branch of the filter)");
        User reloaded = reload(user.getId());
        assertTrue(encryptionService.matchPassword(PASSWORDLESS_PASSWORD, reloaded.getPassword()),
                "the stored hash matches the password that was set");
        log.info("[UserSetPasswordIfAbsentMongoTest] blank-password user {} -> password set", user.getId());
    }

    @Test
    void setPasswordIfAbsent_userWithAPassword_failsAndChangesNothing() {
        String originalHash = encryptionService.encryptPassword(ORIGINAL_PASSWORD);
        User user = save(User.builder().name(uniqueName("has-password")).password(originalHash).build());

        BizException error = (BizException) catchThrowable(() -> userService.setPasswordIfAbsent(user.getId(), ATTEMPTED_PASSWORD).block());

        assertEquals(org.lowcoder.sdk.exception.BizError.INVALID_PASSWORD, error.getError());
        assertEquals("PASSWORD_ALREADY_SET", error.getMessageKey());
        User reloaded = reload(user.getId());
        assertEquals(originalHash, reloaded.getPassword(), "the stored hash is unchanged, byte for byte");
        assertTrue(encryptionService.matchPassword(ORIGINAL_PASSWORD, reloaded.getPassword()), "still matches the original password");
        assertFalse(encryptionService.matchPassword(ATTEMPTED_PASSWORD, reloaded.getPassword()), "does not match the attempted one");
        log.info("[UserSetPasswordIfAbsentMongoTest] user {} with a password -> PASSWORD_ALREADY_SET, unchanged", user.getId());
    }

    private static Throwable catchThrowable(Runnable runnable) {
        try {
            runnable.run();
        } catch (Throwable t) {
            return t;
        }
        throw new AssertionError("expected setPasswordIfAbsent to fail, but it succeeded");
    }

    /** True if {@code error} is exactly the PASSWORD_ALREADY_SET BizException the race is meant to produce; any other error is a real failure. */
    private static boolean isPasswordAlreadySet(Throwable error) {
        return error instanceof BizException biz
                && biz.getError() == org.lowcoder.sdk.exception.BizError.INVALID_PASSWORD
                && "PASSWORD_ALREADY_SET".equals(biz.getMessageKey());
    }

    /**
     * Maps an error of one of the two concurrent calls to "lost" (PASSWORD_ALREADY_SET, the expected outcome for
     * the call the conditional update refuses); any other error is a real failure, never a race loss, so it is
     * logged with the round and call it came from and re-emitted wrapped in an {@link AssertionError} that carries
     * that context, instead of a bare rethrow that would otherwise lose which round and which call (A or B) failed.
     */
    private static Mono<String> rethrowWithRound(int round, String call, Throwable error) {
        if (isPasswordAlreadySet(error)) {
            return Mono.just("PASSWORD_ALREADY_SET");
        }
        log.error("[UserSetPasswordIfAbsentMongoTest] round {} call {}: unexpected error", round, call, error);
        return Mono.error(new AssertionError("round " + round + " call " + call + ": unexpected error " + error, error));
    }

    /**
     * Two concurrent {@code setPasswordIfAbsent} calls on one passwordless account: the single conditional update
     * guarantees exactly one wins and the other sees PASSWORD_ALREADY_SET, never both succeeding and never the
     * second one overwriting the winner. A pass does not prove the two updates interleaved in this particular
     * round; the filter is what guarantees it (inverted in the plan's section 6 step 2, which removes the filter
     * and shows this test then fails).
     */
    @RepeatedTest(RACE_ROUNDS)
    void setPasswordIfAbsent_concurrentCallsOnOnePasswordlessAccount_exactlyOneWins(org.junit.jupiter.api.RepetitionInfo repetitionInfo) {
        int round = repetitionInfo.getCurrentRepetition();
        User user = save(User.builder().name(uniqueName("race-" + round)).build());
        String passwordA = "e2e-d49-race-a-" + round;
        String passwordB = "e2e-d49-race-b-" + round;

        Mono<String> callA = userService.setPasswordIfAbsent(user.getId(), passwordA)
                .map(ignored -> passwordA)
                .onErrorResume(e -> rethrowWithRound(round, "A", e))
                .subscribeOn(Schedulers.parallel());
        Mono<String> callB = userService.setPasswordIfAbsent(user.getId(), passwordB)
                .map(ignored -> passwordB)
                .onErrorResume(e -> rethrowWithRound(round, "B", e))
                .subscribeOn(Schedulers.parallel());

        var outcomes = Mono.zip(callA, callB).block();
        String outcomeA = outcomes.getT1();
        String outcomeB = outcomes.getT2();

        String winner;
        if (!"PASSWORD_ALREADY_SET".equals(outcomeA) && "PASSWORD_ALREADY_SET".equals(outcomeB)) {
            winner = outcomeA;
        } else if ("PASSWORD_ALREADY_SET".equals(outcomeA) && !"PASSWORD_ALREADY_SET".equals(outcomeB)) {
            winner = outcomeB;
        } else {
            throw new AssertionError("round " + round + ": expected exactly one winner and one PASSWORD_ALREADY_SET, got A="
                    + outcomeA + " B=" + outcomeB);
        }
        String loser = winner.equals(passwordA) ? passwordB : passwordA;

        User reloaded = reload(user.getId());
        assertTrue(encryptionService.matchPassword(winner, reloaded.getPassword()), "round " + round + ": the stored hash matches the winner");
        assertFalse(encryptionService.matchPassword(loser, reloaded.getPassword()), "round " + round + ": the stored hash does not match the loser");
        log.info("[UserSetPasswordIfAbsentMongoTest] race round {}: winner={} loser=PASSWORD_ALREADY_SET", round, winner.equals(passwordA) ? "A" : "B");
    }
}

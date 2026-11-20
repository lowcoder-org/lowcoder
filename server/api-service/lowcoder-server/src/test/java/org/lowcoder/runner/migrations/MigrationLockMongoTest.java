package org.lowcoder.runner.migrations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doCallRealMethod;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.spy;

import java.time.Duration;
import java.util.Date;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.MongoException;

import lombok.extern.slf4j.Slf4j;

/**
 * {@link MigrationLock} and {@link MigrationHistory} on the failure paths that a healthy database does not produce, and
 * the background renewal on its own. A Mockito spy of the {@link MongoTemplate} makes the collection lookup throw a
 * {@link MongoException}, which stands for a database that stopped answering; the real MongoDB container serves
 * everything else. The runner's behaviour on a lost lock is in {@link MigrationRunnerMongoTest}.
 *
 * <p>Limits: a failing database is simulated at the collection lookup, so a call that fails halfway (a write the server
 * applied but did not acknowledge) is not covered.
 */
@Slf4j
class MigrationLockMongoTest {

    private static final String TAG = "[MigrationLockMongoTest] ";
    private static final Duration LEASE = Duration.ofSeconds(2);
    private static final Duration WAIT = Duration.ofSeconds(30);
    private static final Duration SHORT_LEASE = Duration.ofSeconds(1);
    private static final long RETRY_PAUSE_FLOOR_MILLIS = 400;

    private MigrationTestDatabase db;
    private MongoTemplate spiedTemplate;

    @BeforeEach
    void createDatabase() {
        db = new MigrationTestDatabase();
        spiedTemplate = spy(db.template);
    }

    @AfterEach
    void dropDatabase() {
        db.close();
    }

    @Test
    void heartbeat_movesTheExpiryForwardWhileTheLockIsHeld() throws InterruptedException {
        MigrationLock lock = new MigrationLock(db.template, MigrationLockSettings.of(LEASE, WAIT));
        try (MigrationLock.Held held = lock.acquire()) {
            Date first = db.lock().find().first().getDate(MigrationLock.EXPIRES_AT);

            Thread.sleep(LEASE.toMillis());

            Date later = db.lock().find().first().getDate(MigrationLock.EXPIRES_AT);
            log.info("{}expiresAt {} then {}", TAG, first, later);
            assertThat(later).as("expiresAt after one lease of renewals (renewal every third of the lease)").isAfter(first);
            assertThat(held.generation()).isEqualTo(1L);
        }
        assertThat(db.lock().countDocuments()).as("close() deletes the document").isZero();
    }

    @Test
    void renewalErrors_areRetriedUntilTheLeaseRunsOut_thenTheLockIsLostForGood() {
        MigrationLock lock = new MigrationLock(spiedTemplate, MigrationLockSettings.of(SHORT_LEASE, WAIT).withoutRenewal());
        try (MigrationLock.Held held = lock.acquire()) {
            doThrow(new MongoException("database down")).when(spiedTemplate).getCollection(MigrationLock.COLLECTION);
            long started = System.nanoTime();

            assertThatThrownBy(held::confirm).as("no renewal succeeded within the lease")
                    .isInstanceOfSatisfying(MigrationLockLostException.class,
                            e -> assertThat(e).hasCauseInstanceOf(MongoException.class));

            long elapsedMillis = Duration.ofNanos(System.nanoTime() - started).toMillis();
            log.info("{}confirm gave up after {} ms", TAG, elapsedMillis);
            assertThat(elapsedMillis).as("errors were retried until the lease (1000 ms) ran out, not given up at once")
                    .isGreaterThanOrEqualTo(RETRY_PAUSE_FLOOR_MILLIS);
            assertThatThrownBy(held::confirm).as("a lost lock stays lost, without another database call")
                    .isInstanceOf(MigrationLockLostException.class).hasMessageContaining("lost earlier");
        }
    }

    @Test
    void renewalError_thatEndsBeforeTheLeaseRunsOut_isSurvived() {
        MigrationLock lock = new MigrationLock(spiedTemplate,
                MigrationLockSettings.of(Duration.ofSeconds(10), WAIT).withoutRenewal());
        try (MigrationLock.Held held = lock.acquire()) {
            doThrow(new MongoException("blip")).doCallRealMethod().when(spiedTemplate)
                    .getCollection(MigrationLock.COLLECTION);

            held.confirm();

            assertThat(db.lock().find().first().getString(MigrationLock.OWNER)).isEqualTo(held.owner());
        }
    }

    @Test
    void acquire_withADatabaseError_failsAsALockExceptionNotAsATimeout() {
        doThrow(new MongoException("database down")).when(spiedTemplate).getCollection(MigrationLock.COLLECTION);
        MigrationLock lock = new MigrationLock(spiedTemplate, MigrationLockSettings.of(LEASE, WAIT));

        assertThatThrownBy(lock::acquire).isExactlyInstanceOf(MigrationLockException.class)
                .hasCauseInstanceOf(MongoException.class);
    }

    @Test
    void close_ofALockTheDatabaseCannotReleaseAnymore_doesNotThrow() {
        MigrationLock lock = new MigrationLock(spiedTemplate, MigrationLockSettings.of(LEASE, WAIT).withoutRenewal());
        MigrationLock.Held held = lock.acquire();
        doThrow(new MongoException("database down")).when(spiedTemplate).getCollection(MigrationLock.COLLECTION);

        held.close();

        doCallRealMethod().when(spiedTemplate).getCollection(MigrationLock.COLLECTION);
        assertThat(db.lock().countDocuments()).as("the lock document expires on its own").isEqualTo(1);
    }

    @Test
    void settings_rejectNonPositiveDurations() {
        assertThatThrownBy(() -> MigrationLockSettings.of(Duration.ZERO, WAIT)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> MigrationLockSettings.of(LEASE, Duration.ofSeconds(-1)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(MigrationLockSettings.of(Duration.ofSeconds(60), WAIT).renewalEvery()).as("a third of the lease")
                .isEqualTo(Duration.ofSeconds(20));
    }

    // ---------------------------------------------------------------- history on a database that fails

    @Test
    void history_wrapsDatabaseErrorsInMigrationHistoryException() {
        doThrow(new MongoException("database down")).when(spiedTemplate).getCollection(MigrationHistory.COLLECTION);
        MigrationHistory history = new MigrationHistory(spiedTemplate);
        MigrationStep step = new MigrationStep("001", "one", "", "test.Changelog", "methodOne", () -> { });

        assertThatThrownBy(history::executedKeys).isInstanceOf(MigrationHistoryException.class)
                .hasCauseInstanceOf(MongoException.class);
        assertThatThrownBy(() -> history.recordExecuted(step, MigrationHistory.newExecutionId(), java.time.Instant.now(), 1))
                .isInstanceOf(MigrationHistoryException.class).hasMessageContaining("one");
        assertThatThrownBy(() -> history.recordFailed(step, MigrationHistory.newExecutionId(), java.time.Instant.now(), 1,
                new IllegalStateException("x"))).isInstanceOf(MigrationHistoryException.class).hasMessageContaining("FAILED");
    }

    @Test
    void executionId_isALocalTimeAndANumber() {
        assertThat(MigrationHistory.newExecutionId()).matches("\\d{4}-\\d{2}-\\d{2}T[\\d:.]+-\\d{1,3}");
    }
}

package org.lowcoder.runner.migrations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.runner.migrations.job.AddPtmFieldsJob;
import org.lowcoder.runner.migrations.job.AddSuperAdminUser;
import org.lowcoder.runner.migrations.job.CompleteAuthType;
import org.lowcoder.runner.migrations.job.MigrateAuthConfigJob;
import org.lowcoder.sdk.config.CommonConfig;

import com.mongodb.MongoException;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;

import lombok.extern.slf4j.Slf4j;

/**
 * {@link MigrationRunner} with its real {@link MigrationHistory} and {@link MigrationLock} against the module's MongoDB
 * container. Each test gets a database of its own ({@link MigrationTestDatabase}).
 *
 * <p>Two kinds of registry. The production one ({@link #productionRegistryCounting}) has the ids, authors and order of
 * {@link DatabaseChangelogRegistry} with bodies that only record that they ran, so the tests prove the history rule on the
 * real keys against the history Mongock 5.4.0 wrote ({@code migrations/mongock-5.4.0-history.jsonl}, captured from the
 * build before the replacement on an empty database, host name replaced). The bodies of the real change sets are
 * exercised by {@link DatabaseChangelogMigrationsTest}. A small registry of test change sets is used where a body has to
 * block, throw or take the lock away.
 *
 * <p>Limits: the fixture is the history of a fresh Mongock start. A history written by an older Mongock version or by
 * hand is not covered. That the build before the replacement reads the history this runner writes is shown by the
 * field and type comparison here and by the rollback run on a real database that the phase documents, not by a test in
 * this module (which has no second build to start).
 */
@Slf4j
class MigrationRunnerMongoTest {

    private static final String TAG = "[MigrationRunnerMongoTest] ";
    private static final String PUBLISHED_TO_RECORD = "published-to-record";
    private static final String PUBLISHED_TO_RECORD_AUTHOR = "Thomas";
    private static final int CHANGE_SETS = 29;
    private static final Duration LEASE = Duration.ofSeconds(2);
    private static final Duration LONG_CHANGE_SET = LEASE.multipliedBy(3);
    private static final Duration LONG_WAIT = Duration.ofSeconds(60);
    private static final Duration POLL = Duration.ofMillis(50);
    private static final Duration SHORT_WAIT = Duration.ofMillis(300);
    private static final long LATCH_SECONDS = 30;
    private static final String TEST_CHANGE_LOG_CLASS = "test.Changelog";

    private MigrationTestDatabase db;
    private ExecutorService threads;
    private final List<String> events = Collections.synchronizedList(new ArrayList<>());

    @BeforeEach
    void createDatabase() {
        db = new MigrationTestDatabase();
        threads = Executors.newCachedThreadPool();
        log.info("{}database {}", TAG, db.name);
    }

    @AfterEach
    void dropDatabase() {
        threads.shutdownNow();
        db.close();
    }

    // ---------------------------------------------------------------- history

    @Test
    void freshDatabase_runsEveryChangeSetOnceInMongocksOrder_andWritesEntriesLikeMongock() {
        MigrationRunner runner = runnerOver(productionRegistryCounting(""), settings());

        MigrationRunner.Outcome outcome = runner.migrate();

        List<Document> fixture = MigrationTestDatabase.mongockChangeSetEntries();
        List<String> mongockOrder = fixture.stream().map(d -> d.getString(MigrationHistory.CHANGE_ID)).toList();
        List<Document> written = db.historyEntries();
        log.info("{}ran {} change sets, wrote {} entries", TAG, outcome.executedIds().size(), written.size());
        assertThat(fixture).as("the fixture holds the 29 change sets of the build before the replacement").hasSize(CHANGE_SETS);
        assertThat(outcome.executedIds()).as("change sets run, in the order Mongock ran them").isEqualTo(mongockOrder);
        assertThat(events).as("each body ran exactly once").containsExactlyElementsOf(mongockOrder);
        assertThat(outcome.skipped()).isZero();
        assertThat(written).as("one history entry per change set").hasSize(CHANGE_SETS);
        assertThat(written).extracting(d -> d.getString(MigrationHistory.CHANGE_ID))
                .as("entries in execution order").containsExactlyElementsOf(mongockOrder);
        assertThat(written).extracting(d -> d.getString(MigrationHistory.STATE))
                .containsOnly(MigrationHistory.STATE_EXECUTED);
        assertThat(db.lock().countDocuments()).as("the lock is released after the run").isZero();
    }

    @Test
    void writtenEntries_haveTheFieldsAndTypesOfMongocksEntries() {
        runnerOver(productionRegistryCounting(""), settings()).migrate();

        List<Document> mongock = MigrationTestDatabase.mongockChangeSetEntries();
        List<Document> written = db.historyEntries();
        assertThat(written).hasSameSizeAs(mongock);
        for (int i = 0; i < mongock.size(); i++) {
            Document expected = mongock.get(i);
            Document actual = written.get(i);
            String id = expected.getString(MigrationHistory.CHANGE_ID);
            assertThat(actual.keySet()).as("field names and order of " + id).containsExactlyElementsOf(expected.keySet());
            for (String field : List.of(MigrationHistory.CHANGE_ID, MigrationHistory.AUTHOR, MigrationHistory.STATE,
                    MigrationHistory.TYPE, MigrationHistory.CHANGE_LOG_CLASS, MigrationHistory.CHANGE_SET_METHOD,
                    MigrationHistory.METADATA, MigrationHistory.ERROR_TRACE, MigrationHistory.SYSTEM_CHANGE)) {
                assertThat(actual.get(field)).as(field + " of " + id).isEqualTo(expected.get(field));
            }
            assertThat(actual.get("_id")).as("_id of " + id).isInstanceOf(org.bson.types.ObjectId.class);
            assertThat(actual.get(MigrationHistory.EXECUTION_ID)).as("executionId of " + id).isInstanceOf(String.class);
            assertThat(actual.get(MigrationHistory.TIMESTAMP)).as("timestamp of " + id).isInstanceOf(java.util.Date.class);
            assertThat(actual.get(MigrationHistory.EXECUTION_MILLIS)).as("executionMillis of " + id)
                    .isInstanceOf(Long.class);
            assertThat(actual.get(MigrationHistory.EXECUTION_HOSTNAME)).as("executionHostname of " + id)
                    .isInstanceOf(String.class);
        }
        assertThat(written).extracting(d -> d.getString(MigrationHistory.EXECUTION_ID)).as("one execution id per start")
                .containsOnly(written.get(0).getString(MigrationHistory.EXECUTION_ID));
    }

    @Test
    void historyWrittenByMongock_runsNoChangeSet_andIsNotTouched() {
        db.history().insertMany(MigrationTestDatabase.mongockFixture());
        List<Document> before = db.historyEntries();

        MigrationRunner.Outcome outcome = runnerOver(productionRegistryCounting(""), settings()).migrate();

        log.info("{}seeded run: executed={} skipped={}", TAG, outcome.executedIds(), outcome.skipped());
        assertThat(before).as("seed: 29 change sets and 2 system entries").hasSize(CHANGE_SETS + 2);
        assertThat(outcome.executedIds()).as("change sets run on a database with Mongock's history").isEmpty();
        assertThat(events).as("no body ran").isEmpty();
        assertThat(outcome.skipped()).isEqualTo(CHANGE_SETS);
        assertThat(db.historyEntries()).as("history unchanged").isEqualTo(before);
        assertThat(db.lock().countDocuments()).isZero();
    }

    @Test
    void historyWithOneEntryRemoved_runsExactlyThatChangeSet() {
        db.history().insertMany(MigrationTestDatabase.mongockFixture());
        db.history().deleteOne(Filters.and(Filters.eq(MigrationHistory.CHANGE_ID, PUBLISHED_TO_RECORD),
                Filters.eq(MigrationHistory.AUTHOR, PUBLISHED_TO_RECORD_AUTHOR)));

        MigrationRunner.Outcome outcome = runnerOver(productionRegistryCounting(""), settings()).migrate();

        log.info("{}run after removing {}: {}", TAG, PUBLISHED_TO_RECORD, outcome.executedIds());
        assertThat(outcome.executedIds()).as("only the change set without a history entry runs")
                .containsExactly(PUBLISHED_TO_RECORD);
        assertThat(events).containsExactly(PUBLISHED_TO_RECORD);
        assertThat(db.historyEntriesOf(PUBLISHED_TO_RECORD)).as("its entry is written again").hasSize(1)
                .allSatisfy(d -> assertThat(d.getString(MigrationHistory.STATE)).isEqualTo(MigrationHistory.STATE_EXECUTED));
        assertThat(db.historyEntries()).as("30 change sets and the 2 system entries again").hasSize(CHANGE_SETS + 2);
    }

    @Test
    void failedChangeSet_stopsTheRun_recordsFailed_andReleasesTheLock() {
        IllegalStateException boom = new IllegalStateException("boom in change set two");
        MigrationRunner runner = runnerOver(testRegistry(
                step("001", "one", () -> events.add("one")),
                step("002", "two", () -> {
                    events.add("two");
                    throw boom;
                }),
                step("003", "three", () -> events.add("three"))), settings());

        assertThatThrownBy(runner::migrate)
                .as("a throwing change set fails the start")
                .isInstanceOfSatisfying(MigrationFailedException.class, e -> {
                    assertThat(e.getChangeId()).isEqualTo("two");
                    assertThat(e).hasCause(boom);
                });

        assertThat(events).as("the run stops at the failed change set").containsExactly("one", "two");
        assertThat(db.historyEntriesOf("one")).extracting(d -> d.getString(MigrationHistory.STATE))
                .containsExactly(MigrationHistory.STATE_EXECUTED);
        List<Document> failed = db.historyEntriesOf("two");
        assertThat(failed).as("a failed change set leaves one FAILED entry and no EXECUTED one").hasSize(1);
        assertThat(failed.get(0).getString(MigrationHistory.STATE)).isEqualTo(MigrationHistory.STATE_FAILED);
        assertThat(failed.get(0).getString(MigrationHistory.ERROR_TRACE)).contains("boom in change set two")
                .contains(IllegalStateException.class.getName());
        assertThat(db.historyEntriesOf("three")).as("no entry for a change set that never started").isEmpty();
        assertThat(db.lock().countDocuments()).as("the lock is released after a failure").isZero();
    }

    @Test
    void startAfterAFailure_runsTheChangeSetAgain_andKeepsItsFailedEntry() {
        boolean[] failing = {true};
        MigrationRunner runner = runnerOver(testRegistry(
                step("001", "one", () -> events.add("one")),
                step("002", "two", () -> {
                    events.add("two");
                    if (failing[0]) {
                        throw new IllegalStateException("not yet");
                    }
                }),
                step("003", "three", () -> events.add("three"))), settings());
        assertThatThrownBy(runner::migrate).isInstanceOf(MigrationFailedException.class);
        events.clear();
        failing[0] = false;

        MigrationRunner.Outcome outcome = runner.migrate();

        assertThat(outcome.executedIds()).as("the failed change set and the one after it run; the first is recorded")
                .containsExactly("two", "three");
        assertThat(db.historyEntriesOf("two")).as("the FAILED entry stays, an EXECUTED entry is added")
                .extracting(d -> d.getString(MigrationHistory.STATE))
                .containsExactly(MigrationHistory.STATE_FAILED, MigrationHistory.STATE_EXECUTED);
        assertThat(db.historyEntriesOf("one")).as("a recorded change set is not run again").hasSize(1);
    }

    @Test
    void mongockFailedEntry_isNeverCompleted_theChangeSetRunsAgain() {
        List<Document> seed = MigrationTestDatabase.mongockFixture();
        for (Document entry : seed) {
            if (PUBLISHED_TO_RECORD.equals(entry.getString(MigrationHistory.CHANGE_ID))) {
                entry.put(MigrationHistory.STATE, MigrationHistory.STATE_FAILED);
                entry.put(MigrationHistory.ERROR_TRACE, "java.lang.IllegalStateException: left by Mongock");
            }
        }
        db.history().insertMany(seed);

        MigrationRunner.Outcome outcome = runnerOver(productionRegistryCounting(""), settings()).migrate();

        assertThat(outcome.executedIds()).as("a change set whose only entry is FAILED runs again")
                .containsExactly(PUBLISHED_TO_RECORD);
        assertThat(db.historyEntriesOf(PUBLISHED_TO_RECORD)).as("Mongock's FAILED entry stays, an EXECUTED one is added")
                .extracting(d -> d.getString(MigrationHistory.STATE))
                .containsExactly(MigrationHistory.STATE_FAILED, MigrationHistory.STATE_EXECUTED);
    }

    @Test
    void entriesInOtherStates_neverCountAsExecuted() {
        for (String state : List.of("ROLLED_BACK", "IGNORED", "STARTED", "")) {
            db.history().insertOne(new Document(MigrationHistory.CHANGE_ID, "one").append(MigrationHistory.AUTHOR, "")
                    .append(MigrationHistory.STATE, state));
        }

        assertThat(new MigrationHistory(db.template).executedKeys())
                .as("only EXECUTED entries are completed change sets").isEmpty();
    }

    // ---------------------------------------------------------------- lock

    @Test
    void heldLock_carriesOwnerGenerationAndAnExpiryInTheFuture() {
        Document[] seen = new Document[1];
        runnerOver(testRegistry(step("001", "one", () -> seen[0] = db.lock().find().first())), settings()).migrate();

        Document lock = seen[0];
        assertThat(lock).as("the lock document while a change set runs").isNotNull();
        assertThat(lock.getString(MigrationLock.ID)).isEqualTo(MigrationLock.LOCK_ID);
        assertThat(lock.getString(MigrationLock.OWNER)).isNotBlank();
        assertThat(lock.getLong(MigrationLock.GENERATION)).isEqualTo(1L);
        assertThat(lock.getDate(MigrationLock.EXPIRES_AT)).as("expiresAt, from the database clock")
                .isAfter(new java.util.Date());
    }

    @Test
    void twoRunnersStartedTogether_runEachChangeSetOnce() throws Exception {
        CountDownLatch go = new CountDownLatch(1);
        Function<String, MigrationRunner> runnerNamed = name -> runnerOver(testRegistry(
                step("001", "one", () -> slow(name + ":one")),
                step("002", "two", () -> slow(name + ":two")),
                step("003", "three", () -> slow(name + ":three"))), settings());
        Future<MigrationRunner.Outcome> first = threads.submit(() -> {
            go.await();
            return runnerNamed.apply("A").migrate();
        });
        Future<MigrationRunner.Outcome> second = threads.submit(() -> {
            go.await();
            return runnerNamed.apply("B").migrate();
        });
        go.countDown();

        MigrationRunner.Outcome a = first.get(LATCH_SECONDS, TimeUnit.SECONDS);
        MigrationRunner.Outcome b = second.get(LATCH_SECONDS, TimeUnit.SECONDS);

        log.info("{}A ran {}, B ran {}, events {}", TAG, a.executedIds(), b.executedIds(), events);
        assertThat(events).as("every change set ran exactly once across both runners").hasSize(3);
        assertThat(events.stream().map(e -> e.substring(e.indexOf(':') + 1)).toList())
                .containsExactlyInAnyOrder("one", "two", "three");
        assertThat(a.executedIds().size() + b.executedIds().size()).isEqualTo(3);
        assertThat(List.of(a.executedIds().size(), b.executedIds().size())).as("the runner that waited ran none")
                .containsExactlyInAnyOrder(3, 0);
        assertThat(db.historyEntries()).hasSize(3);
        assertThat(db.lock().countDocuments()).isZero();
    }

    @Test
    void longChangeSet_keepsTheLockWhileItIsRenewed_soASecondRunnerWaitsAndThenRunsNothing() throws Exception {
        CountDownLatch firstIsInsideTheChangeSet = new CountDownLatch(1);
        MigrationRunner first = runnerOver(testRegistry(
                step("001", "long", () -> holdFor(firstIsInsideTheChangeSet, "A", LONG_CHANGE_SET))),
                settings().polling(POLL));
        MigrationRunner second = runnerOver(testRegistry(
                step("001", "long", () -> events.add("B:long:start"))), settings().polling(POLL));
        Future<MigrationRunner.Outcome> firstRun = threads.submit(first::migrate);
        assertThat(firstIsInsideTheChangeSet.await(LATCH_SECONDS, TimeUnit.SECONDS)).isTrue();
        Future<MigrationRunner.Outcome> secondRun = threads.submit(second::migrate);

        MigrationRunner.Outcome a = firstRun.get(LATCH_SECONDS, TimeUnit.SECONDS);
        MigrationRunner.Outcome b = secondRun.get(LATCH_SECONDS, TimeUnit.SECONDS);

        log.info("{}events {}", TAG, events);
        assertThat(events).as("the second runner never entered while the first held its renewed lease (3 leases)")
                .containsExactly("A:long:start", "A:long:end");
        assertThat(a.executedIds()).containsExactly("long");
        assertThat(b.executedIds()).as("after the release the second runner finds the change set recorded").isEmpty();
        assertThat(b.skipped()).isEqualTo(1);
        assertThat(db.historyEntriesOf("long")).hasSize(1);
    }

    @Test
    void longChangeSet_withRenewalSwitchedOff_letsASecondRunnerIn_andTheFirstFailsItsStart() throws Exception {
        CountDownLatch firstIsInsideTheChangeSet = new CountDownLatch(1);
        MigrationRunner first = runnerOver(testRegistry(
                step("001", "long", () -> holdFor(firstIsInsideTheChangeSet, "A", LONG_CHANGE_SET))),
                settings().polling(POLL).withoutRenewal());
        MigrationRunner second = runnerOver(testRegistry(
                step("001", "long", () -> events.add("B:long:start"))), settings().polling(POLL));
        Future<MigrationRunner.Outcome> firstRun = threads.submit(first::migrate);
        assertThat(firstIsInsideTheChangeSet.await(LATCH_SECONDS, TimeUnit.SECONDS)).isTrue();
        Future<MigrationRunner.Outcome> secondRun = threads.submit(second::migrate);

        MigrationRunner.Outcome b = secondRun.get(LATCH_SECONDS, TimeUnit.SECONDS);
        Throwable firstFailure = org.junit.jupiter.api.Assertions.assertThrows(ExecutionException.class,
                () -> firstRun.get(LATCH_SECONDS, TimeUnit.SECONDS)).getCause();

        log.info("{}events {}, first failed with {}", TAG, events, firstFailure.toString());
        assertThat(b.executedIds()).as("without renewal the lease ran out and the second runner entered")
                .containsExactly("long");
        assertThat(events.indexOf("B:long:start")).as("B started while A was still inside its change set")
                .isGreaterThan(events.indexOf("A:long:start")).isLessThan(events.indexOf("A:long:end"));
        assertThat(firstFailure).as("the first runner finds the lock gone and does not record its change set")
                .isInstanceOf(MigrationLockLostException.class);
        assertThat(db.historyEntriesOf("long")).as("only the runner that held the lock wrote history").hasSize(1);
    }

    @Test
    void lockTakenAwayDuringAChangeSet_writesNoEntryForIt_startsNothingElse_andFailsTheStart() {
        MigrationRunner runner = runnerOver(testRegistry(
                step("001", "one", () -> events.add("one")),
                step("002", "two", () -> {
                    events.add("two");
                    db.lock().updateOne(Filters.eq(MigrationLock.ID, MigrationLock.LOCK_ID),
                            Updates.combine(Updates.set(MigrationLock.OWNER, "thief"), Updates.inc(MigrationLock.GENERATION, 1)));
                }),
                step("003", "three", () -> events.add("three"))), settings());

        assertThatThrownBy(runner::migrate).as("a lost lock fails the start")
                .isInstanceOf(MigrationLockLostException.class);

        assertThat(events).as("the change set after the one that lost the lock never starts").containsExactly("one", "two");
        assertThat(db.historyEntries()).as("no entry for the change set that was running, none for the next")
                .extracting(d -> d.getString(MigrationHistory.CHANGE_ID)).containsExactly("one");
        Document lock = db.lock().find().first();
        assertThat(lock).as("the thief's lock is left alone by the release").isNotNull();
        assertThat(lock.getString(MigrationLock.OWNER)).isEqualTo("thief");
    }

    @Test
    void lockTakenAwayDuringAFailingChangeSet_writesNoFailedEntry() {
        MigrationRunner runner = runnerOver(testRegistry(
                step("001", "one", () -> {
                    db.lock().updateOne(Filters.eq(MigrationLock.ID, MigrationLock.LOCK_ID),
                            Updates.combine(Updates.set(MigrationLock.OWNER, "thief"), Updates.inc(MigrationLock.GENERATION, 1)));
                    throw new IllegalStateException("fails after losing the lock");
                })), settings());

        assertThatThrownBy(runner::migrate).isInstanceOfSatisfying(MigrationLockLostException.class,
                e -> assertThat(e.getSuppressed()).as("the change set's own failure is kept").hasSize(1));

        assertThat(db.historyEntries()).as("no history write after the lock was lost").isEmpty();
    }

    @Test
    void lockHeldByAnotherInstance_failsTheStartAfterTheMaximumWait_withoutRunningAnything() {
        db.lock().insertOne(new Document(MigrationLock.ID, MigrationLock.LOCK_ID).append(MigrationLock.OWNER, "other")
                .append(MigrationLock.GENERATION, 5L)
                .append(MigrationLock.EXPIRES_AT, new java.util.Date(System.currentTimeMillis() + Duration.ofHours(1).toMillis())));
        MigrationRunner runner = runnerOver(testRegistry(step("001", "one", () -> events.add("one"))),
                MigrationLockSettings.of(LEASE, SHORT_WAIT).polling(POLL));

        assertThatThrownBy(runner::migrate).isInstanceOf(MigrationLockTimeoutException.class);

        assertThat(events).isEmpty();
        assertThat(db.historyEntries()).isEmpty();
        assertThat(db.lock().find().first().getString(MigrationLock.OWNER)).as("the other holder's lock is untouched")
                .isEqualTo("other");
    }

    @Test
    void expiredLock_isTakenOver_withARaisedGeneration() {
        db.lock().insertOne(new Document(MigrationLock.ID, MigrationLock.LOCK_ID).append(MigrationLock.OWNER, "gone")
                .append(MigrationLock.GENERATION, 7L)
                .append(MigrationLock.EXPIRES_AT, new java.util.Date(System.currentTimeMillis() - Duration.ofHours(1).toMillis())));
        Long[] generation = new Long[1];
        runnerOver(testRegistry(step("001", "one",
                () -> generation[0] = db.lock().find().first().getLong(MigrationLock.GENERATION))), settings()).migrate();

        assertThat(generation[0]).as("generation while held after taking over an expired lock").isEqualTo(8L);
        assertThat(db.lock().countDocuments()).isZero();
    }

    @Test
    void historyWriteFailingAfterAChangeSetFailure_keepsTheChangeSetFailureAsSuppressed() {
        MigrationHistory history = spy(new MigrationHistory(db.template));
        IllegalStateException failure = new IllegalStateException("change set failure");
        doThrow(new MigrationHistoryException("history is down", new MongoException("down")))
                .when(history).recordFailed(any(), any(), any(), anyLong(), any());
        MigrationRunner runner = new MigrationRunner(testRegistry(step("001", "one", () -> {
            throw failure;
        })), history, new MigrationLock(db.template, settings()));

        assertThatThrownBy(runner::migrate).isInstanceOfSatisfying(MigrationHistoryException.class,
                e -> assertThat(e.getSuppressed()).as("the change set's failure is not lost").containsExactly(failure));

        assertThat(db.lock().countDocuments()).as("the lock is released after a failed history write").isZero();
    }

    @Test
    void historyWriteFailingAfterASuccessfulChangeSet_failsTheStartWithoutAnEntry() {
        MigrationHistory history = spy(new MigrationHistory(db.template));
        doThrow(new MigrationHistoryException("history is down", new MongoException("down")))
                .when(history).recordExecuted(any(), any(), any(), anyLong());
        MigrationRunner runner = new MigrationRunner(testRegistry(
                step("001", "one", () -> events.add("one")), step("002", "two", () -> events.add("two"))),
                history, new MigrationLock(db.template, settings()));

        assertThatThrownBy(runner::migrate).isInstanceOf(MigrationHistoryException.class);

        assertThat(events).as("nothing runs after a change set that could not be recorded").containsExactly("one");
        assertThat(db.historyEntries()).isEmpty();
    }

    // ---------------------------------------------------------------- helpers

    private MigrationRunner runnerOver(MigrationRegistry registry, MigrationLockSettings settings) {
        return new MigrationRunner(registry, new MigrationHistory(db.template), new MigrationLock(db.template, settings));
    }

    private static MigrationLockSettings settings() {
        return MigrationLockSettings.of(LEASE, LONG_WAIT).polling(POLL);
    }

    /** The production ids, authors and order, each body only recording {@code prefix + id} in {@link #events}. */
    private MigrationRegistry productionRegistryCounting(String prefix) {
        MigrationRegistry production = DatabaseChangelogRegistry.create(new DatabaseChangelog(), db.template,
                mock(CommonConfig.class), mock(MigrateAuthConfigJob.class), mock(CompleteAuthType.class),
                mock(AddSuperAdminUser.class), mock(AddPtmFieldsJob.class));
        return new MigrationRegistry(production.steps().stream()
                .map(step -> step.withBody(() -> events.add(prefix + step.id()))).toList());
    }

    private static MigrationRegistry testRegistry(MigrationStep... steps) {
        return new MigrationRegistry(List.of(steps));
    }

    private static MigrationStep step(String order, String id, Runnable body) {
        return new MigrationStep(order, id, "", TEST_CHANGE_LOG_CLASS, "method" + id, body);
    }

    private void slow(String event) {
        events.add(event);
        sleep(Duration.ofMillis(150));
    }

    private void holdFor(CountDownLatch inside, String runner, Duration time) {
        events.add(runner + ":long:start");
        inside.countDown();
        sleep(time);
        events.add(runner + ":long:end");
    }

    private static void sleep(Duration time) {
        try {
            Thread.sleep(time.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted inside a test change set", e);
        }
    }
}

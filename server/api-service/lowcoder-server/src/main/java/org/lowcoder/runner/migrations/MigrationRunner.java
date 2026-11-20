package org.lowcoder.runner.migrations;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Runs the change sets of the {@link MigrationRegistry} that the {@link MigrationHistory} does not record as executed,
 * in registry order, while it holds the {@link MigrationLock}. Like any {@link ApplicationRunner} it runs after the
 * context is up, so the web server answers while the change sets run; a failure ends the start of the application.
 *
 * <p>Sequence: acquire the lock (waiting for another instance, at most the lock's maximum wait), read the history only
 * then (so the change sets the previous holder ran are skipped), and for each pending change set: confirm the lock, run
 * the body, confirm the lock again and write the history entry. A change set that throws gets a {@code FAILED} entry
 * (after a confirmation as well) and stops the run with {@link MigrationFailedException}. A lost lock stops the run with
 * {@link MigrationLockLostException} without starting another change set or writing another entry: the change set that
 * was running stays not completed and runs again at the next start.
 *
 * <p>Limits. A change set is not atomic: one that fails or loses the lock halfway leaves its partial writes, and its
 * body has to tolerate being run again. An {@link Error} from a body ends the run without a {@code FAILED}
 * entry (it is not a change set failure). See {@link MigrationLock} for what the lock does not cover.
 */
@Slf4j
@Component
@Profile("!test")
public class MigrationRunner implements ApplicationRunner {

    /** What one run did: the ids of the change sets it ran, in order, and how many were already recorded. */
    public record Outcome(List<String> executedIds, int skipped) {
    }

    private final MigrationRegistry registry;
    private final MigrationHistory history;
    private final MigrationLock lock;

    public MigrationRunner(MigrationRegistry registry, MigrationHistory history, MigrationLock lock) {
        this.registry = registry;
        this.history = history;
        this.lock = lock;
    }

    @Override
    public void run(ApplicationArguments args) {
        migrate();
    }

    public Outcome migrate() {
        String executionId = MigrationHistory.newExecutionId();
        List<String> executed = new ArrayList<>();
        int skipped = 0;
        try (MigrationLock.Held held = lock.acquire()) {
            Set<MigrationHistory.ChangeKey> done = history.executedKeys();
            for (MigrationStep step : registry.steps()) {
                if (done.contains(step.key())) {
                    skipped++;
                    continue;
                }
                execute(step, held, executionId);
                executed.add(step.id());
            }
        }
        log.info("Migrations finished: {} change sets run, {} already recorded", executed.size(), skipped);
        return new Outcome(List.copyOf(executed), skipped);
    }

    private void execute(MigrationStep step, MigrationLock.Held held, String executionId) {
        held.confirm();
        log.info("Change set {} ({}) starts", step.id(), step.changeSetMethod());
        Instant startedAt = Instant.now();
        long startedNanos = System.nanoTime();
        try {
            step.body().run();
        } catch (RuntimeException failure) {
            recordFailure(step, held, executionId, startedAt, millisSince(startedNanos), failure);
            throw new MigrationFailedException(step, failure);
        }
        long millis = millisSince(startedNanos);
        held.confirm();
        history.recordExecuted(step, executionId, startedAt, millis);
        log.info("Change set {} ({}) executed in {} ms", step.id(), step.changeSetMethod(), millis);
    }

    private void recordFailure(MigrationStep step, MigrationLock.Held held, String executionId, Instant startedAt,
            long millis, RuntimeException failure) {
        log.error("Change set {} ({}) failed", step.id(), step.changeSetMethod(), failure);
        try {
            held.confirm();
            history.recordFailed(step, executionId, startedAt, millis, failure);
        } catch (MigrationLockLostException | MigrationHistoryException e) {
            e.addSuppressed(failure);
            throw e;
        }
    }

    private static long millisSince(long startedNanos) {
        return Duration.ofNanos(System.nanoTime() - startedNanos).toMillis();
    }
}

package org.lowcoder.runner.migrations;

import java.time.Duration;

/**
 * Timing of {@link MigrationLock}.
 *
 * @param lease        how long the lock stays valid without a renewal; it has to cover the longest stall of the whole
 *                     process (a garbage collection pause, a suspended container), because a change set body that keeps
 *                     writing after its instance lost the lock cannot be stopped
 * @param renewalEvery how often a held lock is renewed: a third of the lease, so two renewals can fail before the lease
 *                     runs out
 * @param maxWait      how long an instance waits for a lock another instance holds before its start fails
 * @param pollEvery    how often a waiting instance tries again
 * @param renewing     whether a held lock is renewed in the background; {@code false} only in tests, to show that the
 *                     renewal is what keeps a long change set exclusive
 */
public record MigrationLockSettings(Duration lease, Duration renewalEvery, Duration maxWait, Duration pollEvery,
        boolean renewing) {

    public static final Duration DEFAULT_LEASE = Duration.ofSeconds(60);
    public static final Duration DEFAULT_MAX_WAIT = Duration.ofMinutes(10);
    public static final Duration DEFAULT_POLL = Duration.ofSeconds(1);
    private static final int RENEWALS_PER_LEASE = 3;

    public MigrationLockSettings {
        if (lease.isZero() || lease.isNegative() || renewalEvery.isZero() || renewalEvery.isNegative()
                || pollEvery.isZero() || pollEvery.isNegative() || maxWait.isNegative()) {
            throw new IllegalArgumentException("lock durations must be positive: " + lease + ", " + renewalEvery + ", "
                    + maxWait + ", " + pollEvery);
        }
    }

    public static MigrationLockSettings of(Duration lease, Duration maxWait) {
        return new MigrationLockSettings(lease, lease.dividedBy(RENEWALS_PER_LEASE), maxWait, DEFAULT_POLL, true);
    }

    public MigrationLockSettings polling(Duration pollEvery) {
        return new MigrationLockSettings(lease, renewalEvery, maxWait, pollEvery, renewing);
    }

    public MigrationLockSettings withoutRenewal() {
        return new MigrationLockSettings(lease, renewalEvery, maxWait, pollEvery, false);
    }
}

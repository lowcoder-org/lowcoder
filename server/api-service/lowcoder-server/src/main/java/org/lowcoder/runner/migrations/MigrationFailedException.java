package org.lowcoder.runner.migrations;

/**
 * A change set threw. The history holds a {@code FAILED} entry for it, never an {@code EXECUTED} one, so it runs again
 * at the next start. The change set's own exception is the cause.
 */
public class MigrationFailedException extends MigrationException {

    private final String changeId;

    public MigrationFailedException(MigrationStep step, Throwable cause) {
        super("Change set " + step.id() + " (" + step.changeSetMethod() + ") failed: " + cause, cause);
        this.changeId = step.id();
    }

    public String getChangeId() {
        return changeId;
    }
}

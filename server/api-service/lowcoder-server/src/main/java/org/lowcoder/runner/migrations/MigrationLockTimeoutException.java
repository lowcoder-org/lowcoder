package org.lowcoder.runner.migrations;

/** Another instance held the migration lock for the whole maximum wait. */
public class MigrationLockTimeoutException extends MigrationLockException {

    public MigrationLockTimeoutException(String message) {
        super(message);
    }
}

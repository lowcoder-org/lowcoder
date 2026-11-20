package org.lowcoder.runner.migrations;

/** The migration lock could not be taken or kept. See {@link MigrationLock}. */
public class MigrationLockException extends MigrationException {

    public MigrationLockException(String message) {
        super(message);
    }

    public MigrationLockException(String message, Throwable cause) {
        super(message, cause);
    }
}

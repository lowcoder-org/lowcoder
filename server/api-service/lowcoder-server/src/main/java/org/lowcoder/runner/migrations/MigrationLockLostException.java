package org.lowcoder.runner.migrations;

/**
 * The lock this instance held is gone: another instance took it over, or no renewal succeeded before it expired. The
 * runner starts no further change set and writes no further history entry.
 */
public class MigrationLockLostException extends MigrationLockException {

    public MigrationLockLostException(String message) {
        super(message);
    }

    public MigrationLockLostException(String message, Throwable cause) {
        super(message, cause);
    }
}

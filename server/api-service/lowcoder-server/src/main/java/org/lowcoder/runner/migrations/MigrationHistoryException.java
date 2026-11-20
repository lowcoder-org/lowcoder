package org.lowcoder.runner.migrations;

/** The migration history collection could not be read or written. */
public class MigrationHistoryException extends MigrationException {

    public MigrationHistoryException(String message, Throwable cause) {
        super(message, cause);
    }
}

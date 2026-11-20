package org.lowcoder.runner.migrations;

/** Base of the failures that stop {@link MigrationRunner}, and with it the start of the application. */
public class MigrationException extends RuntimeException {

    public MigrationException(String message) {
        super(message);
    }

    public MigrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

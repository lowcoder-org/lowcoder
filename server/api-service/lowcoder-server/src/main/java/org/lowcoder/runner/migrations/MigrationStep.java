package org.lowcoder.runner.migrations;

import java.util.Objects;

/**
 * One change set: the identity the history stores ({@code id} and {@code author}), its {@code order}, the class and
 * method names the history records, and the code to run.
 *
 * <p>{@code id} and {@code author} are the keys of the history: changing either makes the change set run again on every
 * database that already recorded it.
 */
public record MigrationStep(String order, String id, String author, String changeLogClass, String changeSetMethod,
        Runnable body) {

    public MigrationStep {
        Objects.requireNonNull(order, "order");
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(author, "author");
        Objects.requireNonNull(changeLogClass, "changeLogClass");
        Objects.requireNonNull(changeSetMethod, "changeSetMethod");
        Objects.requireNonNull(body, "body");
    }

    public MigrationHistory.ChangeKey key() {
        return new MigrationHistory.ChangeKey(id, author);
    }

    public MigrationStep withBody(Runnable replacement) {
        return new MigrationStep(order, id, author, changeLogClass, changeSetMethod, replacement);
    }
}

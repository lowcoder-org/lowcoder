package org.lowcoder.runner.migrations;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * The change sets to run, in the order they run: ascending {@code order}, compared as text (so {@code "010"} follows
 * {@code "009"}). {@code order} and the pair {@code id}/{@code author} are each unique.
 */
public final class MigrationRegistry {

    private final List<MigrationStep> steps;

    public MigrationRegistry(List<MigrationStep> steps) {
        List<MigrationStep> sorted = steps.stream().sorted(Comparator.comparing(MigrationStep::order)).toList();
        Set<String> orders = new HashSet<>();
        Set<MigrationHistory.ChangeKey> keys = new HashSet<>();
        for (MigrationStep step : sorted) {
            if (!orders.add(step.order())) {
                throw new IllegalArgumentException("duplicate change set order " + step.order() + " (" + step.id() + ")");
            }
            if (!keys.add(step.key())) {
                throw new IllegalArgumentException("duplicate change set id/author " + step.key());
            }
        }
        this.steps = sorted;
    }

    public List<MigrationStep> steps() {
        return steps;
    }
}

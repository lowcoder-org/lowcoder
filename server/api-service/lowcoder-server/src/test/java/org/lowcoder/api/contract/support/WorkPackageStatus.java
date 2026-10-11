package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;

/**
 * The work packages marked done in {@value #FILE} ({@code {"done": ["WP0", ...]}}; docs/API_PAYLOAD_TEST_PLAN.md §6.1).
 * Both gates read it: a rule or group of a done WP fails the build, the others are reported.
 */
public final class WorkPackageStatus {

    public static final String FILE = "lowcoder-server/src/test/resources/json-contract/wp-status.json";
    public static final String DONE_FIELD = "done";
    public static final Pattern WP_NAME = Pattern.compile("WP(?:[0-9]|10)");

    private WorkPackageStatus() {
    }

    /** The done WPs; fails on a missing {@value #DONE_FIELD} array or a name that is not {@code WP0}–{@code WP10}. */
    public static Set<String> done(Path root) {
        JsonNode status;
        try {
            status = JsonUtils.getObjectMapper().readTree(Files.readString(root.resolve(FILE), StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + FILE, e);
        }
        JsonNode done = status.get(DONE_FIELD);
        if (done == null || !done.isArray()) {
            throw new IllegalStateException(FILE + " needs a '" + DONE_FIELD + "' array");
        }
        Set<String> names = new TreeSet<>();
        done.forEach(node -> {
            if (!node.isTextual() || !WP_NAME.matcher(node.asText()).matches()) {
                throw new IllegalStateException(FILE + ": not a work package name: " + node);
            }
            names.add(node.asText());
        });
        return names;
    }
}

package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * The §4.6 representative input of docs/API_PAYLOAD_TEST_PLAN.md for the modules other than {@code lowcoder-server}:
 * numbers on both sides of 2^31 and 2^63, trailing-zero decimals, exponents, booleans, nulls, nested and empty
 * containers, Unicode and escapes, with keys in an order that sorting would change.
 *
 * <p>It is the classpath resource {@value #RESOURCE} of this test-jar, a byte-identical copy of
 * {@code lowcoder-server/src/test/resources/json-contract/dynamic/representative.input.json};
 * {@code RepresentativeInputContractTest} in {@code lowcoder-server} fails when the two differ. Limit: being a
 * classpath resource, it has no fixture overlay ({@link GoldenJson}); the §8.2 mutation checks change the expected
 * fixtures instead.
 */
public final class RepresentativeInput {

    public static final String RESOURCE = "representative.input.json";
    /** The input text, exactly as in the resource. */
    public static final String TEXT = load();

    private RepresentativeInput() {
    }

    /** The input read by the production mapper into {@code Map<String, Object>}, as plugins read query configs. */
    public static Map<String, Object> map() {
        try {
            return JsonUtils.getObjectMapper().readValue(TEXT, new TypeReference<Map<String, Object>>() {
            });
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + RESOURCE, e);
        }
    }

    /** The input read by the production mapper into a tree. */
    public static JsonNode node() {
        try {
            return JsonUtils.getObjectMapper().readTree(TEXT);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + RESOURCE, e);
        }
    }

    private static String load() {
        try (InputStream stream = RepresentativeInput.class.getResourceAsStream(RESOURCE)) {
            if (stream == null) {
                throw new IllegalStateException("missing classpath resource " + RESOURCE + " next to " + RepresentativeInput.class.getName());
            }
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + RESOURCE, e);
        }
    }
}

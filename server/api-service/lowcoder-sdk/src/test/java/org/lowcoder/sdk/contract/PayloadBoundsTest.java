package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.core.exc.StreamConstraintsException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * The read limits of the production mapper (docs/API_PAYLOAD_TEST_PLAN.md §4.8, R11, E3), on a DSL
 * {@code Map<String,Object>}: {@code JsonUtils} sets no {@code StreamReadConstraints}, so the Jackson defaults apply and
 * can change with an upgrade. Each limit is read at its value and one past it: nesting depth 1000, a number of 1000
 * digits, a string of 20,000,000 characters. The configured values are asserted too, so a changed default is named
 * even where the behaviour still happens to pass.
 *
 * <p>Inputs are generated as streams ({@link #repeated}), never held as text; the largest test holds the parsed
 * 20,000,000-character string and Jackson's buffer for it. These tests run in every build (owner decision C10-A6).
 * Limits: the codec's 20 MB {@code maxInMemorySize} is the server module's {@code PayloadBoundsTest}; the other
 * Jackson 2.15 has only these three read constraints; the document- and name-length limits of later versions are not
 * seen here until an upgrade adds them to {@code StreamReadConstraints}.
 */
public class PayloadBoundsTest {

    static final int MAX_NESTING_DEPTH = 1000;
    static final int MAX_NUMBER_LENGTH = 1000;
    static final int MAX_STRING_LENGTH = 20_000_000;
    static final String DSL_KEY = "dsl";
    static final String DSL_PREFIX = "{\"" + DSL_KEY + "\":";
    static final String DSL_SUFFIX = "}";
    static final TypeReference<Map<String, Object>> DSL = new TypeReference<>() {
    };

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();

    @Test
    public void theMapperUsesTheJacksonDefaultLimits() {
        StreamReadConstraints constraints = MAPPER.getFactory().streamReadConstraints();
        System.out.println("[PayloadBoundsTest] read constraints: nesting " + constraints.getMaxNestingDepth() + ", number "
                + constraints.getMaxNumberLength() + ", string " + constraints.getMaxStringLength());
        assertEquals(MAX_NESTING_DEPTH, constraints.getMaxNestingDepth());
        assertEquals(MAX_NUMBER_LENGTH, constraints.getMaxNumberLength());
        assertEquals(MAX_STRING_LENGTH, constraints.getMaxStringLength());
    }

    @Test
    public void nestingDepthAtTheLimitIsRead() throws IOException {
        Map<String, Object> dsl = read(nested(MAX_NESTING_DEPTH));
        int arrays = 0;
        for (Object value = dsl.get(DSL_KEY); value instanceof List<?> list; value = list.isEmpty() ? null : list.get(0)) {
            arrays++;
        }
        System.out.println("[PayloadBoundsTest] depth " + MAX_NESTING_DEPTH + ": read, " + arrays + " nested arrays inside the DSL object");
        assertEquals(MAX_NESTING_DEPTH - 1, arrays, "the DSL object is level 1, the arrays the rest");
    }

    @Test
    public void nestingDepthBeyondTheLimitFails() {
        assertRejected("depth " + (MAX_NESTING_DEPTH + 1), nested(MAX_NESTING_DEPTH + 1));
    }

    @Test
    public void numberOfMaximumLengthIsRead() throws IOException {
        Object number = read(dslValue(repeated("9", MAX_NUMBER_LENGTH))).get(DSL_KEY);
        System.out.println("[PayloadBoundsTest] number of " + MAX_NUMBER_LENGTH + " digits: read as " + number.getClass().getName());
        assertEquals(BigInteger.class, number.getClass());
        assertEquals(MAX_NUMBER_LENGTH, number.toString().length());
    }

    @Test
    public void numberBeyondTheMaximumLengthFails() {
        assertRejected("number of " + (MAX_NUMBER_LENGTH + 1) + " digits", dslValue(repeated("9", MAX_NUMBER_LENGTH + 1)));
    }

    @Test
    public void stringOfMaximumLengthIsRead() throws IOException {
        long start = System.nanoTime();
        Object string = read(dslValue(quoted(MAX_STRING_LENGTH))).get(DSL_KEY);
        System.out.println("[PayloadBoundsTest] string of " + MAX_STRING_LENGTH + " characters: read in "
                + (System.nanoTime() - start) / 1_000_000 + " ms");
        assertEquals(String.class, string.getClass());
        assertEquals(MAX_STRING_LENGTH, ((String) string).length());
    }

    @Test
    public void stringBeyondTheMaximumLengthFails() {
        assertRejected("string of " + (MAX_STRING_LENGTH + 1) + " characters", dslValue(quoted(MAX_STRING_LENGTH + 1)));
    }

    private static Map<String, Object> read(InputStream json) throws IOException {
        try (json) {
            return MAPPER.readValue(json, DSL);
        }
    }

    private static void assertRejected(String what, InputStream json) {
        StreamConstraintsException e = assertThrows(StreamConstraintsException.class, () -> read(json));
        System.out.println("[PayloadBoundsTest] " + what + ": " + e.getClass().getName() + ": " + e.getOriginalMessage());
    }

    /** A DSL object whose value nests arrays, so the document's depth is {@code depth} (the object is level 1). */
    static InputStream nested(int depth) {
        return dslValue(sequence(repeated("[", depth - 1), repeated("]", depth - 1)));
    }

    /** {@code {"dsl":<value>}}. */
    static InputStream dslValue(InputStream value) {
        return sequence(text(DSL_PREFIX), value, text(DSL_SUFFIX));
    }

    /** A JSON string of {@code length} characters. */
    static InputStream quoted(int length) {
        return sequence(text("\""), repeated("a", length), text("\""));
    }

    /** {@code unit} (ASCII) {@code count} times, generated while it is read. */
    static InputStream repeated(String unit, long count) {
        byte[] bytes = unit.getBytes(StandardCharsets.US_ASCII);
        long total = bytes.length * count;
        return new InputStream() {
            private long position;

            @Override
            public int read() {
                return position < total ? bytes[(int) (position++ % bytes.length)] : -1;
            }

            @Override
            public int read(byte[] buffer, int offset, int length) {
                if (position >= total) {
                    return -1;
                }
                int n = (int) Math.min(length, total - position);
                for (int i = 0; i < n; i++) {
                    buffer[offset + i] = bytes[(int) (position++ % bytes.length)];
                }
                return n;
            }
        };
    }

    static InputStream text(String ascii) {
        return repeated(ascii, 1);
    }

    static InputStream sequence(InputStream... parts) {
        return new SequenceInputStream(Collections.enumeration(List.of(parts)));
    }
}

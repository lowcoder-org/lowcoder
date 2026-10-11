package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.SortedMap;
import java.util.SortedSet;

/**
 * Compares JSON documents by the JSON contract of docs/API_PAYLOAD_TEST_PLAN.md §1.2, and Java values bound from
 * JSON by their runtime classes.
 *
 * <p>Part of the contract, so a difference is a <b>failure</b>: property names and presence, value types, null
 * versus absent, number lexemes ({@code 1} versus {@code 1.0}), duplicate keys and the order of the values of one
 * key, array order. Not part of the contract, so a difference is only a <b>report</b>: whitespace (not even
 * reported), the order of different object members, and the escape form of strings and keys.
 *
 * <p>The documents are read with Jackson's streaming {@link JsonParser}, never with a mapper: number tokens keep
 * their lexeme ({@link JsonParser#getText()}) and every object keeps all its members, duplicates included, as a list
 * of (key, value) pairs. Members are grouped by key; groups are compared regardless of key order, and values inside
 * a group in order.
 *
 * <p>Limits: rendered text (SQL, Mongo, query strings) is compared exactly with {@link GoldenJson#assertText}, not
 * here. {@link #compareJava} compares leaf values with {@code equals}, so it is meant for values that JSON binding
 * produces (maps, collections, arrays, numbers, strings, booleans, records); a class without {@code equals} is
 * compared by identity.
 */
public final class CanonicalJson {

    public static final String ROOT_PATH = "$";
    public static final String REPORT_PREFIX = "[contract] report ";
    private static final JsonFactory FACTORY = JsonFactory.builder().build();
    private static final char QUOTE = '"';
    private static final char ESCAPE = '\\';

    private CanonicalJson() {
    }

    /** A parsed JSON value. */
    public sealed interface Node permits ObjectValue, ArrayValue, ScalarValue {
    }

    /** One object member as written, with the key's raw source text (escapes included). */
    public record Member(String key, String rawKey, Node value) {
    }

    public record ObjectValue(List<Member> members) implements Node {
    }

    public record ArrayValue(List<Node> elements) implements Node {
    }

    public enum ScalarKind {STRING, NUMBER, TRUE, FALSE, NULL}

    /** A scalar: {@code value} is the decoded string or the number lexeme; {@code raw} is the source text. */
    public record ScalarValue(ScalarKind kind, String value, String raw) implements Node {
    }

    /** Contract differences ({@code failures}) and differences outside the contract ({@code reports}). */
    public record Comparison(List<String> failures, List<String> reports) {

        public boolean equivalent() {
            return failures.isEmpty();
        }
    }

    /** Parses one JSON document, keeping number lexemes, duplicate members and raw string text. */
    public static Node parse(String json) {
        try (JsonParser parser = FACTORY.createParser(json)) {
            JsonToken first = parser.nextToken();
            if (first == null) {
                throw new IllegalArgumentException("empty JSON document");
            }
            Node node = read(parser, json);
            if (parser.nextToken() != null) {
                throw new IllegalArgumentException("trailing content after the JSON document at "
                        + parser.currentTokenLocation());
            }
            return node;
        } catch (IOException e) {
            throw new UncheckedIOException("not a JSON document: " + e.getMessage(), e);
        }
    }

    private static Node read(JsonParser parser, String source) throws IOException {
        JsonToken token = parser.currentToken();
        switch (token) {
            case START_OBJECT -> {
                List<Member> members = new ArrayList<>();
                while (parser.nextToken() == JsonToken.FIELD_NAME) {
                    String key = parser.currentName();
                    String rawKey = rawText(parser, source);
                    parser.nextToken();
                    members.add(new Member(key, rawKey, read(parser, source)));
                }
                return new ObjectValue(members);
            }
            case START_ARRAY -> {
                List<Node> elements = new ArrayList<>();
                while (parser.nextToken() != JsonToken.END_ARRAY) {
                    elements.add(read(parser, source));
                }
                return new ArrayValue(elements);
            }
            case VALUE_STRING -> {
                String value = parser.getText();
                return new ScalarValue(ScalarKind.STRING, value, rawText(parser, source));
            }
            case VALUE_NUMBER_INT, VALUE_NUMBER_FLOAT -> {
                String lexeme = parser.getText();
                return new ScalarValue(ScalarKind.NUMBER, lexeme, lexeme);
            }
            case VALUE_TRUE -> {
                return new ScalarValue(ScalarKind.TRUE, "true", "true");
            }
            case VALUE_FALSE -> {
                return new ScalarValue(ScalarKind.FALSE, "false", "false");
            }
            case VALUE_NULL -> {
                return new ScalarValue(ScalarKind.NULL, "null", "null");
            }
            default -> throw new IllegalStateException("unexpected token " + token + " at " + parser.currentTokenLocation());
        }
    }

    /**
     * The source text of the current string or field-name token, quotes included. It scans from the token's opening
     * quote to the first unescaped closing quote, because the parser's current location may already lie past the
     * following separator and value.
     */
    private static String rawText(JsonParser parser, String source) {
        int start = (int) parser.currentTokenLocation().getCharOffset();
        if (start < 0 || start >= source.length() || source.charAt(start) != QUOTE) {
            throw new IllegalStateException("no string token at offset " + start);
        }
        int index = start + 1;
        while (index < source.length() && source.charAt(index) != QUOTE) {
            index += source.charAt(index) == ESCAPE ? 2 : 1;
        }
        return source.substring(start, Math.min(index + 1, source.length()));
    }

    /** Compares two JSON documents by the §1.2 contract. */
    public static Comparison compare(String expectedJson, String actualJson) {
        List<String> failures = new ArrayList<>();
        List<String> reports = new ArrayList<>();
        compareNodes(ROOT_PATH, parse(expectedJson), parse(actualJson), failures, reports);
        return new Comparison(List.copyOf(failures), List.copyOf(reports));
    }

    /**
     * Fails with an {@link AssertionError} listing every contract difference; prints the differences outside the
     * contract to standard output, prefixed with {@link #REPORT_PREFIX}.
     */
    public static void assertEquivalent(String expectedJson, String actualJson) {
        Comparison comparison = compare(expectedJson, actualJson);
        comparison.reports().forEach(report -> System.out.println(REPORT_PREFIX + report));
        if (!comparison.equivalent()) {
            throw new AssertionError("JSON differs from the contract:\n  " + String.join("\n  ", comparison.failures())
                    + "\nexpected: " + expectedJson + "\nactual:   " + actualJson);
        }
    }

    private static void compareNodes(String path, Node expected, Node actual, List<String> failures, List<String> reports) {
        if (expected instanceof ObjectValue expectedObject && actual instanceof ObjectValue actualObject) {
            compareObjects(path, expectedObject, actualObject, failures, reports);
        } else if (expected instanceof ArrayValue expectedArray && actual instanceof ArrayValue actualArray) {
            compareArrays(path, expectedArray, actualArray, failures, reports);
        } else if (expected instanceof ScalarValue expectedScalar && actual instanceof ScalarValue actualScalar
                && expectedScalar.kind() == actualScalar.kind()) {
            compareScalars(path, expectedScalar, actualScalar, failures, reports);
        } else {
            failures.add(path + ": type differs, expected " + describe(expected) + ", actual " + describe(actual));
        }
    }

    private static void compareObjects(String path, ObjectValue expected, ObjectValue actual, List<String> failures,
            List<String> reports) {
        Map<String, List<Member>> expectedGroups = groupByKey(expected);
        Map<String, List<Member>> actualGroups = groupByKey(actual);
        for (String key : expectedGroups.keySet()) {
            if (!actualGroups.containsKey(key)) {
                failures.add(memberPath(path, key) + ": missing property");
            }
        }
        for (String key : actualGroups.keySet()) {
            if (!expectedGroups.containsKey(key)) {
                failures.add(memberPath(path, key) + ": unexpected property");
            }
        }
        for (Map.Entry<String, List<Member>> group : expectedGroups.entrySet()) {
            List<Member> actualMembers = actualGroups.get(group.getKey());
            if (actualMembers == null) {
                continue;
            }
            List<Member> expectedMembers = group.getValue();
            String keyPath = memberPath(path, group.getKey());
            if (expectedMembers.size() != actualMembers.size()) {
                failures.add(keyPath + ": key occurs " + expectedMembers.size() + " time(s) in expected, "
                        + actualMembers.size() + " in actual (duplicate keys are part of the contract)");
            }
            for (int i = 0; i < Math.min(expectedMembers.size(), actualMembers.size()); i++) {
                String occurrencePath = expectedMembers.size() > 1 ? keyPath + "#" + (i + 1) : keyPath;
                Member expectedMember = expectedMembers.get(i);
                Member actualMember = actualMembers.get(i);
                if (!expectedMember.rawKey().equals(actualMember.rawKey())) {
                    reports.add(occurrencePath + ": key escape form differs, expected " + expectedMember.rawKey()
                            + ", actual " + actualMember.rawKey());
                }
                compareNodes(occurrencePath, expectedMember.value(), actualMember.value(), failures, reports);
            }
        }
        List<String> expectedOrder = new ArrayList<>(expectedGroups.keySet());
        List<String> actualOrder = new ArrayList<>(actualGroups.keySet());
        expectedOrder.retainAll(actualGroups.keySet());
        actualOrder.retainAll(expectedGroups.keySet());
        if (!expectedOrder.equals(actualOrder)) {
            reports.add(path + ": member order differs, expected " + expectedOrder + ", actual " + actualOrder);
        }
    }

    private static Map<String, List<Member>> groupByKey(ObjectValue object) {
        Map<String, List<Member>> groups = new LinkedHashMap<>();
        for (Member member : object.members()) {
            groups.computeIfAbsent(member.key(), ignored -> new ArrayList<>()).add(member);
        }
        return groups;
    }

    private static void compareArrays(String path, ArrayValue expected, ArrayValue actual, List<String> failures,
            List<String> reports) {
        if (expected.elements().size() != actual.elements().size()) {
            failures.add(path + ": array length differs, expected " + expected.elements().size() + ", actual "
                    + actual.elements().size());
        }
        for (int i = 0; i < Math.min(expected.elements().size(), actual.elements().size()); i++) {
            compareNodes(path + "[" + i + "]", expected.elements().get(i), actual.elements().get(i), failures, reports);
        }
    }

    private static void compareScalars(String path, ScalarValue expected, ScalarValue actual, List<String> failures,
            List<String> reports) {
        if (!expected.value().equals(actual.value())) {
            String what = expected.kind() == ScalarKind.NUMBER ? "number lexeme" : "value";
            failures.add(path + ": " + what + " differs, expected " + expected.raw() + ", actual " + actual.raw());
        } else if (!expected.raw().equals(actual.raw())) {
            reports.add(path + ": string escape form differs, expected " + expected.raw() + ", actual " + actual.raw());
        }
    }

    private static String describe(Node node) {
        if (node instanceof ScalarValue scalar) {
            return scalar.kind().name().toLowerCase() + " " + scalar.raw();
        }
        return node instanceof ObjectValue ? "object" : "array";
    }

    private static String memberPath(String path, String key) {
        return path + "." + key;
    }

    /**
     * Compares two Java values deeply, including the runtime class of every value and container: {@code Integer}
     * versus {@code Long} and {@code HashSet} versus {@code LinkedHashSet} are differences. Ordered containers
     * (lists, arrays, {@link LinkedHashSet}, {@link SortedSet}, {@link LinkedHashMap}, {@link SortedMap}) are compared
     * in iteration order. Other maps are compared by key, then value by value; the elements of other sets are matched
     * one to one with an element that compares equal by this same deep comparison, so classes and order nested inside
     * a set element count too.
     */
    public static List<String> compareJava(Object expected, Object actual) {
        List<String> failures = new ArrayList<>();
        compareJava(ROOT_PATH, expected, actual, failures);
        return List.copyOf(failures);
    }

    /** Fails with an {@link AssertionError} listing every difference found by {@link #compareJava(Object, Object)}. */
    public static void assertSameJava(Object expected, Object actual) {
        List<String> failures = compareJava(expected, actual);
        if (!failures.isEmpty()) {
            throw new AssertionError("Java values differ:\n  " + String.join("\n  ", failures)
                    + "\nexpected: " + expected + "\nactual:   " + actual);
        }
    }

    private static void compareJava(String path, Object expected, Object actual, List<String> failures) {
        if (expected == null || actual == null) {
            if (expected != actual) {
                failures.add(path + ": expected " + typed(expected) + ", actual " + typed(actual));
            }
            return;
        }
        if (expected.getClass() != actual.getClass()) {
            failures.add(path + ": class differs, expected " + typed(expected) + ", actual " + typed(actual));
            return;
        }
        if (expected instanceof Map<?, ?> expectedMap) {
            compareMaps(path, expectedMap, (Map<?, ?>) actual, failures);
        } else if (expected instanceof Collection<?> expectedCollection) {
            compareCollections(path, expectedCollection, (Collection<?>) actual, failures);
        } else if (expected.getClass().isArray()) {
            compareCollections(path, arrayToList(expected), arrayToList(actual), failures);
        } else if (!Objects.equals(expected, actual)) {
            failures.add(path + ": value differs, expected " + typed(expected) + ", actual " + typed(actual));
        }
    }

    private static void compareMaps(String path, Map<?, ?> expected, Map<?, ?> actual, List<String> failures) {
        for (Object key : expected.keySet()) {
            if (!actual.containsKey(key)) {
                failures.add(path + "." + key + ": missing key " + typed(key));
            }
        }
        for (Object key : actual.keySet()) {
            if (!expected.containsKey(key)) {
                failures.add(path + "." + key + ": unexpected key " + typed(key));
            }
        }
        if (isOrdered(expected) && !new ArrayList<>(expected.keySet()).equals(new ArrayList<>(actual.keySet()))) {
            failures.add(path + ": key order differs, expected " + expected.keySet() + ", actual " + actual.keySet());
        }
        for (Map.Entry<?, ?> entry : expected.entrySet()) {
            if (actual.containsKey(entry.getKey())) {
                compareJava(path + "." + entry.getKey(), entry.getValue(), actual.get(entry.getKey()), failures);
            }
        }
    }

    private static void compareCollections(String path, Collection<?> expected, Collection<?> actual, List<String> failures) {
        if (expected.size() != actual.size()) {
            failures.add(path + ": size differs, expected " + expected.size() + ", actual " + actual.size());
        }
        if (isOrdered(expected)) {
            Iterator<?> expectedValues = expected.iterator();
            Iterator<?> actualValues = actual.iterator();
            for (int i = 0; expectedValues.hasNext() && actualValues.hasNext(); i++) {
                compareJava(path + "[" + i + "]", expectedValues.next(), actualValues.next(), failures);
            }
            return;
        }
        List<Object> unmatched = new ArrayList<>(actual);
        for (Object expectedValue : expected) {
            Iterator<Object> candidates = unmatched.iterator();
            boolean matched = false;
            while (!matched && candidates.hasNext()) {
                if (compareJava(expectedValue, candidates.next()).isEmpty()) {
                    candidates.remove();
                    matched = true;
                }
            }
            if (!matched) {
                failures.add(path + ": missing element " + typed(expectedValue));
            }
        }
        unmatched.forEach(value -> failures.add(path + ": unexpected element " + typed(value)));
    }

    private static boolean isOrdered(Map<?, ?> map) {
        return map instanceof LinkedHashMap<?, ?> || map instanceof SortedMap<?, ?>;
    }

    private static boolean isOrdered(Collection<?> collection) {
        return !(collection instanceof Set<?>) || collection instanceof LinkedHashSet<?> || collection instanceof SortedSet<?>;
    }

    /** Array contents as a list, so arrays are compared element by element. */
    private static List<Object> arrayToList(Object array) {
        List<Object> values = new ArrayList<>();
        for (int i = 0; i < Array.getLength(array); i++) {
            values.add(Array.get(array, i));
        }
        return values;
    }

    private static String typed(Object value) {
        return value == null ? "null" : value + " (" + value.getClass().getName() + ")";
    }
}

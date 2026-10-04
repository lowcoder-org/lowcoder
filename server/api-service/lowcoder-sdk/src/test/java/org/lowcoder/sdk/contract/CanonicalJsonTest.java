package org.lowcoder.sdk.contract;

import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Self-test of {@link CanonicalJson} (docs/API_PAYLOAD_TEST_PLAN.md §8.1): every contract difference of §1.2 must be
 * detected, and every excluded difference must pass and be reported.
 */
public class CanonicalJsonTest {

    private static final String LONG_TIMESTAMP = "1767225600";
    private static final String NANO_TIMESTAMP = "1767225600.000000000";

    private static CanonicalJson.Comparison compareVerbose(String name, String expected, String actual) {
        CanonicalJson.Comparison comparison = CanonicalJson.compare(expected, actual);
        System.out.println("[CanonicalJsonTest] " + name + ": expected=" + expected + " actual=" + actual
                + " failures=" + comparison.failures() + " reports=" + comparison.reports());
        return comparison;
    }

    private static void assertDetected(String name, String expected, String actual, String failureFragment) {
        CanonicalJson.Comparison comparison = compareVerbose(name, expected, actual);
        assertThat(comparison.equivalent()).as(name + " must be a contract difference").isFalse();
        assertThat(comparison.failures()).as(name).anySatisfy(failure -> assertThat(failure).contains(failureFragment));
    }

    private static void assertExcludedAndReported(String name, String expected, String actual, String reportFragment) {
        CanonicalJson.Comparison comparison = compareVerbose(name, expected, actual);
        assertThat(comparison.failures()).as(name + " must not be a contract difference").isEmpty();
        assertThat(comparison.reports()).as(name + " must be reported").anySatisfy(report -> assertThat(report).contains(reportFragment));
    }

    @Test
    public void integerVersusDecimalLexemeIsDetected() {
        assertDetected("1 vs 1.0", "{\"n\":1}", "{\"n\":1.0}", "$.n: number lexeme differs, expected 1, actual 1.0");
    }

    @Test
    public void trailingFractionZerosAreDetected() {
        assertDetected("timestamp lexeme", "{\"t\":" + NANO_TIMESTAMP + "}", "{\"t\":" + LONG_TIMESTAMP + "}", "number lexeme differs");
    }

    @Test
    public void duplicateVersusSingleKeyIsDetected() {
        assertDetected("duplicate key", "{\"a\":1,\"a\":2}", "{\"a\":2}", "key occurs 2 time(s) in expected, 1 in actual");
    }

    @Test
    public void orderOfDuplicateValuesIsDetected() {
        assertDetected("duplicate order", "{\"a\":1,\"b\":0,\"a\":2}", "{\"a\":2,\"b\":0,\"a\":1}", "$.a#1: number lexeme differs");
    }

    @Test
    public void missingPropertyIsDetected() {
        assertDetected("missing property", "{\"a\":1,\"b\":2}", "{\"a\":1}", "$.b: missing property");
    }

    @Test
    public void unexpectedPropertyIsDetected() {
        assertDetected("unexpected property", "{\"a\":1}", "{\"a\":1,\"b\":2}", "$.b: unexpected property");
    }

    @Test
    public void nullVersusAbsentIsDetected() {
        assertDetected("null vs absent", "{\"a\":null}", "{}", "$.a: missing property");
    }

    @Test
    public void stringVersusNumberIsDetected() {
        assertDetected("\"1\" vs 1", "{\"a\":\"1\"}", "{\"a\":1}", "$.a: type differs, expected string \"1\", actual number 1");
    }

    @Test
    public void reorderedArrayIsDetected() {
        assertDetected("array order", "[1,2]", "[2,1]", "$[0]: number lexeme differs");
    }

    @Test
    public void arrayLengthIsDetected() {
        assertDetected("array length", "[1,2]", "[1]", "$: array length differs, expected 2, actual 1");
    }

    @Test
    public void nestedValueIsDetectedWithItsPath() {
        assertDetected("nested", "{\"a\":{\"b\":[{\"c\":true}]}}", "{\"a\":{\"b\":[{\"c\":false}]}}", "$.a.b[0].c: type differs");
    }

    @Test
    public void whitespaceIsIgnored() {
        CanonicalJson.Comparison comparison = compareVerbose("whitespace", "{\"a\":[1,2]}", "{ \"a\" : [ 1 , 2 ] }\n");
        assertThat(comparison.failures()).isEmpty();
        assertThat(comparison.reports()).isEmpty();
    }

    @Test
    public void whitespaceBeforeStringValuesIsNotReportedAsEscapeForm() {
        CanonicalJson.Comparison comparison = compareVerbose("pretty string members",
                "{\"name\":\"x\",\"q\":\"a\\\"b\"}", "{\n  \"name\" : \"x\",\n  \"q\": \"a\\\"b\"\n}");
        assertThat(comparison.failures()).isEmpty();
        assertThat(comparison.reports()).isEmpty();
    }

    @Test
    public void memberOrderIsExcludedAndReported() {
        assertExcludedAndReported("member order", "{\"a\":1,\"b\":2}", "{\"b\":2,\"a\":1}", "$: member order differs, expected [a, b], actual [b, a]");
    }

    @Test
    public void stringEscapeFormIsExcludedAndReported() {
        assertExcludedAndReported("escape form", "{\"s\":\"é\"}", "{\"s\":\"\\u00e9\"}", "$.s: string escape form differs");
    }

    @Test
    public void keyEscapeFormIsExcludedAndReported() {
        assertExcludedAndReported("key escape form", "{\"é\":1}", "{\"\\u00e9\":1}", "key escape form differs");
    }

    @Test
    public void assertEquivalentFailsWithEveryDifference() {
        assertThatThrownBy(() -> CanonicalJson.assertEquivalent("{\"a\":1,\"b\":2}", "{\"a\":1.0}"))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("$.a: number lexeme differs")
                .hasMessageContaining("$.b: missing property");
    }

    @Test
    public void invalidJsonIsRejected() {
        assertThatThrownBy(() -> CanonicalJson.parse("{\"a\":")).isInstanceOf(RuntimeException.class);
        assertThatThrownBy(() -> CanonicalJson.parse("{} {}")).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("trailing content");
    }

    @Test
    public void integerVersusLongIsDetectedOnTheReadSide() {
        List<String> failures = CanonicalJson.compareJava(Map.of("n", 1), Map.of("n", 1L));
        System.out.println("[CanonicalJsonTest] Integer vs Long: " + failures);
        assertThat(failures).anySatisfy(failure -> assertThat(failure)
                .contains("$.n: class differs, expected 1 (java.lang.Integer), actual 1 (java.lang.Long)"));
    }

    @Test
    public void hashSetVersusLinkedHashSetIsDetected() {
        Set<String> hashSet = new HashSet<>(List.of("a", "b"));
        Set<String> linkedHashSet = new LinkedHashSet<>(List.of("a", "b"));
        List<String> failures = CanonicalJson.compareJava(hashSet, linkedHashSet);
        System.out.println("[CanonicalJsonTest] HashSet vs LinkedHashSet: " + failures);
        assertThat(failures).anySatisfy(failure -> assertThat(failure).contains("class differs")
                .contains("java.util.HashSet").contains("java.util.LinkedHashSet"));
    }

    @Test
    public void orderOfOrderedContainersIsDetected() {
        Map<String, Object> expected = new LinkedHashMap<>();
        expected.put("a", 1);
        expected.put("b", 2);
        Map<String, Object> actual = new LinkedHashMap<>();
        actual.put("b", 2);
        actual.put("a", 1);
        List<String> failures = CanonicalJson.compareJava(List.of(expected, new ArrayList<>(List.of(1, 2))),
                List.of(actual, new ArrayList<>(List.of(2, 1))));
        System.out.println("[CanonicalJsonTest] ordered containers: " + failures);
        assertThat(failures).anySatisfy(failure -> assertThat(failure).contains("$[0]: key order differs"));
        assertThat(failures).anySatisfy(failure -> assertThat(failure).contains("$[1][0]: value differs"));
    }

    @Test
    public void unorderedSetElementsAreComparedDeeply() {
        Map<String, Object> linked = new LinkedHashMap<>();
        linked.put("a", 1);
        linked.put("b", 2);
        Map<String, Object> reordered = new LinkedHashMap<>();
        reordered.put("b", 2);
        reordered.put("a", 1);
        Set<Object> withHashMap = new HashSet<>(List.of(new HashMap<>(linked)));
        Set<Object> withLinkedMap = new HashSet<>(List.of(linked));
        Set<Object> withReorderedMap = new HashSet<>(List.of(reordered));
        List<String> classFailures = CanonicalJson.compareJava(withHashMap, withLinkedMap);
        List<String> orderFailures = CanonicalJson.compareJava(withLinkedMap, withReorderedMap);
        System.out.println("[CanonicalJsonTest] set of HashMap vs set of LinkedHashMap: " + classFailures);
        System.out.println("[CanonicalJsonTest] set of LinkedHashMaps in different order: " + orderFailures);
        assertThat(classFailures).anySatisfy(failure -> assertThat(failure).contains("missing element"));
        assertThat(orderFailures).anySatisfy(failure -> assertThat(failure).contains("missing element"));
    }

    @Test
    public void equalJavaValuesPassIncludingUnorderedContainers() {
        Map<String, Object> expected = new HashMap<>(Map.of("a", new HashSet<>(List.of(1L, 2L)), "b", new int[]{1, 2}));
        Map<String, Object> actual = new HashMap<>(Map.of("b", new int[]{1, 2}, "a", new HashSet<>(List.of(2L, 1L))));
        assertThat(CanonicalJson.compareJava(expected, actual)).isEmpty();
        assertThatThrownBy(() -> CanonicalJson.assertSameJava(Map.of("a", 1), Map.of("a", 2)))
                .isInstanceOf(AssertionError.class).hasMessageContaining("$.a: value differs");
    }
}

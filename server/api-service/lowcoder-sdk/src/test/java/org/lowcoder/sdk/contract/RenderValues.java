package org.lowcoder.sdk.contract;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The request-parameter values of group {@code downstream-render} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5): one
 * value of every JSON type as a plugin receives it, by name. Lists and maps hold a string with quotes, a null, a
 * nested container and a {@link BigDecimal} with a trailing zero, so the text the production mapper ({@code toJson})
 * writes for them shows its escapes, nulls and number lexemes; the strings hold an apostrophe, double quotes, a
 * backslash, non-ASCII letters and a dollar sign, the characters SQL text and regular-expression replacements treat
 * specially.
 */
public final class RenderValues {

    public static final String LIST = "list";
    public static final String MAP = "map";

    private RenderValues() {
    }

    /** A fresh map of the values, in a fixed order. */
    public static Map<String, Object> values() {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("int", 1);
        values.put("long", 3_000_000_001L);
        values.put("decimal", 1.5);
        values.put("exponent", 1.0e20);
        values.put("bool", true);
        values.put("null", null);
        values.put("string", "it's \"q\" \\ žluť");
        values.put("dollar", "cost $1");
        values.put(LIST, Arrays.asList(1, "it's \"q\"", 2.5, null, List.of(true), Map.of("k", new BigDecimal("1.50"))));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("zeta", "it's");
        map.put("decimal", new BigDecimal("1.50"));
        map.put("nested", Arrays.asList(1, null));
        values.put(MAP, map);
        return values;
    }
}

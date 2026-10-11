package org.lowcoder.sdk.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.common.QueryExecutionUtils;

/**
 * The form-data path helpers and the duplicate-column finder of {@link QueryExecutionUtils}, which the plugins use to read
 * the query form (nested keys written as {@code a.b.c}).
 */
public class QueryExecutionFormDataTest {

    private static Map<String, Object> form() {
        Map<String, Object> inner = new HashMap<>();
        inner.put("c", "deep");
        inner.put("nothing", null);
        Map<String, Object> middle = new HashMap<>();
        middle.put("b", inner);
        Map<String, Object> form = new HashMap<>();
        form.put("a", middle);
        form.put("flat", 7);
        form.put("text", "t");
        return form;
    }

    @Test
    public void aFlatKeyAndADottedPathAreRead() {
        Map<String, Object> form = form();

        assertEquals(7, QueryExecutionUtils.getValueSafelyFromFormData(form, "flat"));
        assertEquals("deep", QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b.c"));
        assertEquals("deep", QueryExecutionUtils.getStringValueSafelyFromFormData(form, "a.b.c"));
        assertEquals("t", QueryExecutionUtils.getValueSafelyFromFormData(form, "text", String.class));
        assertSame(((Map<?, ?>) form.get("a")).get("b"), QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b"));
    }

    @Test
    public void aMissingKeyAnEmptyMapOrAMissingIntermediateMapGivesNullNotAnException() {
        Map<String, Object> form = form();

        assertNull(QueryExecutionUtils.getValueSafelyFromFormData(form, "absent"));
        assertNull(QueryExecutionUtils.getValueSafelyFromFormData(form, "a.x.c"), "missing intermediate map");
        assertNull(QueryExecutionUtils.getValueSafelyFromFormData(form, "absent.b.c"));
        assertNull(QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b.nothing"), "a null value");
        assertNull(QueryExecutionUtils.getValueSafelyFromFormData(new HashMap<>(), "a"));
        assertNull(QueryExecutionUtils.getValueSafelyFromFormData(null, "a.b"));
    }

    @Test
    public void defaultsApplyOnlyToAMissingOrNullValue() {
        Map<String, Object> form = form();

        assertEquals("fallback", QueryExecutionUtils.getValueSafelyFromFormData(form, "absent", String.class, "fallback"));
        assertEquals("fallback", QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b.nothing", String.class, "fallback"));
        assertEquals("deep", QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b.c", String.class, "fallback"));
        assertEquals("d", QueryExecutionUtils.getValueSafelyFromFormDataOrDefault(form, "a.q", "d"));
        assertEquals(7, QueryExecutionUtils.getValueSafelyFromFormDataOrDefault(form, "flat", "d"));
        assertTrue(QueryExecutionUtils.validConfigurationPresentInFormData(form, "a.b.c"));
        assertFalse(QueryExecutionUtils.validConfigurationPresentInFormData(form, "a.b.nothing"));
        assertFalse(QueryExecutionUtils.validConfigurationPresentInFormData(null, "a"));
    }

    @Test
    public void aDottedPathThroughAValueThatIsNotAMapFailsWithAClassCastException() {
        // observation: a.text is a String, so "text.x" cannot be walked; the helper does not check the intermediate type
        Map<String, Object> form = form();

        ClassCastException failure = assertThrows(ClassCastException.class, () -> QueryExecutionUtils.getValueSafelyFromFormData(form, "text.x"));

        System.out.println("[QueryExecutionFormDataTest] text.x -> " + failure.getMessage());
    }

    @Test
    public void setCreatesTheIntermediateMapsOverwritesAndKeepsTheSiblings() {
        Map<String, Object> form = form();

        QueryExecutionUtils.setValueSafelyInFormData(form, "n.m.k", 1);
        QueryExecutionUtils.setValueSafelyInFormData(form, "a.b.c", "new");
        QueryExecutionUtils.setValueSafelyInFormData(form, "a.b.d", "added");
        QueryExecutionUtils.setValueSafelyInFormData(form, "flat", 8);

        assertEquals(1, QueryExecutionUtils.getValueSafelyFromFormData(form, "n.m.k"));
        assertEquals("new", QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b.c"));
        assertEquals("added", QueryExecutionUtils.getValueSafelyFromFormData(form, "a.b.d"));
        assertEquals(8, QueryExecutionUtils.getValueSafelyFromFormData(form, "flat"));
        assertEquals("t", QueryExecutionUtils.getValueSafelyFromFormData(form, "text"));
    }

    @Test
    public void setOnANullMapWritesIntoAMapTheCallerNeverSees() {
        // documented behaviour: the parameter is reassigned inside the method, so nothing can be returned or observed
        QueryExecutionUtils.setValueSafelyInFormData(null, "a.b", 1);

        Map<String, Object> mine = new HashMap<>();
        QueryExecutionUtils.setValueSafelyInFormData(mine, "a.b", 1);
        assertEquals(1, QueryExecutionUtils.getValueSafelyFromFormData(mine, "a.b"));
    }

    @Test
    public void identicalColumnsAreTheNamesThatOccurMoreThanOnce() {
        assertEquals(List.of(), QueryExecutionUtils.getIdenticalColumns(List.of("a", "b", "c")));
        assertEquals(List.of(), QueryExecutionUtils.getIdenticalColumns(List.of()));
        assertEquals(java.util.Set.of("a", "c"), new java.util.HashSet<>(QueryExecutionUtils.getIdenticalColumns(List.of("a", "b", "a", "c", "c", "c"))));
        assertEquals(1, QueryExecutionUtils.getIdenticalColumns(List.of("x", "x")).size(), "reported once however often it repeats");
    }

    @Test
    public void theSharedSchedulerIsOneInstance() {
        assertSame(QueryExecutionUtils.querySharedScheduler(), QueryExecutionUtils.querySharedScheduler());
    }
}

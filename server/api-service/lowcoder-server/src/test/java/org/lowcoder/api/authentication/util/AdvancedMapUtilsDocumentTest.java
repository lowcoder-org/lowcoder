package org.lowcoder.api.authentication.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Tests of {@link AdvancedMapUtils#documentToMap} (used by migration 028 to turn a stored DSL document into a map) and
 * of {@link AdvancedMapUtils#getString} edge cases not covered by {@code AdvancedMapUtilsTest}.
 *
 * <p>Pinned under D-6, plan §9 row "malformed admin auth-config input fails with raw exceptions instead of a coded
 * error": a malformed index in a source-mapping key throws NumberFormatException / StringIndexOutOfBoundsException.
 */
class AdvancedMapUtilsDocumentTest {

    // ------------------------------------------------------------ documentToMap

    @Test
    void documentToMap_null_isAnEmptyMutableMap() {
        Map<String, Object> map = AdvancedMapUtils.documentToMap(null);

        assertThat(map).isEmpty();
        map.put("k", "v");
        assertThat(map).containsEntry("k", "v");
        System.out.println("[AdvancedMapUtilsDocumentTest] null document -> empty mutable map");
    }

    /** Catches a nested Document being left as a Document: it must become a plain Map, at every depth. */
    @Test
    void documentToMap_convertsNestedDocumentsRecursively() {
        Document document = new Document("name", "root")
                .append("a", new Document("b", new Document("c", "deep").append("n", 7)).append("flat", true));

        Map<String, Object> map = AdvancedMapUtils.documentToMap(document);

        assertThat(map.get("name")).isEqualTo("root");
        assertThat(map.get("a")).isInstanceOf(Map.class).isNotInstanceOf(Document.class);
        assertThat(((Map<?, ?>) ((Map<?, ?>) map.get("a")).get("b"))).isNotInstanceOf(Document.class);
        assertThat(AdvancedMapUtils.getString(map, "a.b.c")).isEqualTo("deep");
        assertThat(AdvancedMapUtils.getString(map, "a.b.n")).isEqualTo("7");
        assertThat(AdvancedMapUtils.getString(map, "a.flat")).isEqualTo("true");
        assertThat(map).as("a copy, not the document itself").isNotSameAs(document);
        System.out.println("[AdvancedMapUtilsDocumentTest] nested documents converted: " + map);
    }

    /**
     * Pins today's behaviour: only nested {@code Document} values are converted. A Document inside a List, an
     * ObjectId and a Date are passed through unchanged. (The analysis' "List/ObjectId/Date conversion" wording does not
     * match the code.) A Document is itself a {@code Map<String, Object>}, so Spring Data stores it as it is.
     */
    @Test
    void documentToMap_listsObjectIdsAndDatesPassThroughUnchanged() {
        ObjectId id = new ObjectId();
        Date date = new Date(0L);
        List<Object> list = List.of(new Document("k", "v"), "text");
        Document document = new Document("list", list).append("id", id).append("date", date);

        Map<String, Object> map = AdvancedMapUtils.documentToMap(document);

        assertThat(map.get("list")).isSameAs(list);
        assertThat(((List<?>) map.get("list")).get(0)).isInstanceOf(Document.class);
        assertThat(map.get("id")).isSameAs(id);
        assertThat(map.get("date")).isSameAs(date);
        System.out.println("[AdvancedMapUtilsDocumentTest] list/ObjectId/Date passed through, list element is a "
                + ((List<?>) map.get("list")).get(0).getClass().getSimpleName());
    }

    // ---------------------------------------------------------------- getString

    private static Map<String, Object> sample() {
        Map<String, Object> map = new HashMap<>();
        map.put("abc", List.of(Map.of("def", "first"), "second"));
        map.put("num", 42);
        map.put("scalar", "text");
        return map;
    }

    /** Catches a missing key, a wrong shape or a bad index being reported as a value instead of {@code null}. */
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource(nullValues = "NULL", value = {
            "NULL,NULL",            // null key
            "missing,NULL",         // absent key
            "missing.deeper,NULL",  // absent intermediate
            "abc[5].def,NULL",      // index past the end
            "abc[-1].def,NULL",     // negative index
            "scalar[0],NULL",       // array syntax on a non-list value
            "scalar.deeper,NULL",   // path through a non-map value
            "abc[0].def,first",     // list element then key
            "abc[1],second",        // terminal list element
            "num,42"                // non-string scalar: toString()
    })
    void getString_edgeCases(String key, String expected) {
        assertThat(AdvancedMapUtils.getString(sample(), key)).isEqualTo(expected);
        System.out.println("[AdvancedMapUtilsDocumentTest] getString(" + key + ") = " + expected);
    }

    @Test
    void getString_arraySyntaxOnANonMapParent_isNull() {
        assertThat(AdvancedMapUtils.getString(sample(), "scalar.x[0]")).isNull();
        System.out.println("[AdvancedMapUtilsDocumentTest] array syntax below a scalar -> null");
    }

    /**
     * Pins plan §9 row "malformed admin auth-config input fails with raw exceptions instead of a coded error": a
     * non-numeric or unterminated index throws a raw exception. A fix changes this test on purpose.
     */
    @Test
    void getString_malformedIndex_throwsRawExceptions_pinsRawExceptionDefect() {
        assertThatThrownBy(() -> AdvancedMapUtils.getString(sample(), "abc[x]")).isInstanceOf(NumberFormatException.class);
        assertThatThrownBy(() -> AdvancedMapUtils.getString(sample(), "abc[0")).isInstanceOf(StringIndexOutOfBoundsException.class);
        System.out.println("[AdvancedMapUtilsDocumentTest] abc[x] -> NumberFormatException, abc[0 -> StringIndexOutOfBoundsException");
    }
}

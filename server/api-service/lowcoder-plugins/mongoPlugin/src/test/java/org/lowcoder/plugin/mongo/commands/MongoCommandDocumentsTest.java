package org.lowcoder.plugin.mongo.commands;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.utils.MongoQueryUtils;
import org.lowcoder.sdk.exception.PluginException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit MG-4 (task L5-8c): the command document each Mongo form builds: {@code MongoQueryUtils.convertMongoFormInputToRawCommand}
 * picks the command and validates it, {@code parseCommand()} builds the document that {@code runCommand} gets. One section per
 * command: defaults, each field, the validity rules with the exact field names reported, and the error codes.
 *
 * <p>The form data has the shape the client sends ({@code compType}, {@code collection} and a {@code comp} map with the
 * command's fields; client/packages/lowcoder/src/comps/queries/mongoQuery.tsx). The delete and update options are the form's
 * {@code SINGLE} and {@code ALL} (mongoQuery.tsx:25-33), so only an API call can send another value.
 *
 * <p>Limits: documents are compared as their relaxed JSON text; nothing is sent to a server (MG-6).
 */
public class MongoCommandDocumentsTest {

    static final String COLLECTION = "orders";
    static final String ALL = "ALL";
    static final String SINGLE = "SINGLE";
    static final String INVALID_LIMIT = "INVALID_LIMIT_CONFIG";
    static final String INVALID_PARAMS = "INVALID_PARAM_CONFIG_PLZ_CHECK";
    static final int DEFAULT_TIMEOUT_MS = 8000;

    private static Map<String, Object> form(String type, String collection, Object... compKeysAndValues) {
        Map<String, Object> comp = new HashMap<>();
        for (int i = 0; i < compKeysAndValues.length; i += 2) {
            comp.put((String) compKeysAndValues[i], compKeysAndValues[i + 1]);
        }
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        if (collection != null) {
            form.put("collection", collection);
        }
        form.put("comp", comp);
        return form;
    }

    private static Document document(Map<String, Object> form) {
        MongoCommand command = MongoQueryUtils.convertMongoFormInputToRawCommand(form);
        Document document = command.parseCommand();
        System.out.println("[MongoCommandDocumentsTest] " + form.get("compType") + " " + form.get("comp") + " -> " + document.toJson());
        return document;
    }

    private static PluginException invalid(Map<String, Object> form) {
        PluginException thrown = assertThrows(PluginException.class, () -> MongoQueryUtils.convertMongoFormInputToRawCommand(form));
        System.out.println("[MongoCommandDocumentsTest] " + form.get("compType") + " " + form.get("comp") + " -> " + thrown.getMessageKey() + " " + Arrays.toString(thrown.getArgs()));
        return thrown;
    }

    private static void assertInvalidWith(Map<String, Object> form, String... fieldNames) {
        PluginException thrown = invalid(form);
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals(INVALID_PARAMS, thrown.getMessageKey());
        assertEquals(List.of(fieldNames), thrown.getArgs()[0]);
    }

    // ---- find

    @Test
    public void findWithEveryFieldBuildsFilterSortProjectionLimitBatchSizeAndSkip() {
        Document document = document(form("FIND", COLLECTION, "query", "{\"status\": \"open\"}", "sort", "{\"id\": -1}", "projection", "{\"id\": 1}", "limit", "25", "skip", "5"));
        assertEquals(COLLECTION, document.get("find"));
        assertEquals(Document.parse("{\"status\": \"open\"}"), document.get("filter"));
        assertEquals(Document.parse("{\"id\": -1}"), document.get("sort"));
        assertEquals(Document.parse("{\"id\": 1}"), document.get("projection"));
        assertEquals(25, document.get("limit"));
        assertEquals(25, document.get("batchSize"));
        assertEquals(5L, document.get("skip"));
    }

    @Test
    public void findDefaultsToAnEmptyFilterAndAnUnlimitedBatch() {
        Document document = document(form("FIND", COLLECTION));
        assertEquals(new Document(), document.get("filter"));
        assertEquals(Integer.MAX_VALUE, document.get("batchSize"));
        assertFalse(document.containsKey("limit"));
        assertFalse(document.containsKey("sort"));
        assertFalse(document.containsKey("projection"));
        assertFalse(document.containsKey("skip"));
        assertEquals(new Document(), document(form("FIND", COLLECTION, "query", "   ")).get("filter"), "a blank query is an empty filter");
    }

    @Test
    public void findLimitMustBeAPositiveInteger() {
        for (String limit : List.of("0", "-3", "abc", "1.5")) {
            PluginException thrown = assertThrows(PluginException.class, () -> document(form("FIND", COLLECTION, "limit", limit)), limit);
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals(INVALID_LIMIT, thrown.getMessageKey(), limit);
        }
    }

    @Test
    public void findMalformedJsonNamesTheField() {
        for (Map.Entry<String, String> field : Map.of("query", "Query", "sort", "Sort", "projection", "Projection").entrySet()) {
            PluginException thrown = assertThrows(PluginException.class, () -> document(form("FIND", COLLECTION, field.getKey(), "{not json")));
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals("INVALID_JSON_FORMAT", thrown.getMessageKey());
            assertEquals(field.getValue(), thrown.getArgs()[0]);
        }
    }

    @Test
    public void findNonNumericSkipIsARawNumberFormatExceptionAtCommandLevel() {
        assertThrows(NumberFormatException.class, () -> document(form("FIND", COLLECTION, "skip", "ten")));
    }

    // ---- insert

    @Test
    public void insertWrapsASingleObjectInAListAndKeepsAnArrayAsItIs() {
        Document single = document(form("INSERT", COLLECTION, "documents", "{\"a\": 1}"));
        assertEquals(COLLECTION, single.get("insert"));
        assertEquals(List.of(Document.parse("{\"a\": 1}")), single.get("documents"));
        Document many = document(form("INSERT", COLLECTION, "documents", " [{\"a\": 1}, {\"a\": 2}] "));
        org.bson.BsonArray parsed = assertInstanceOf(org.bson.BsonArray.class, many.get("documents"));
        assertEquals(2, parsed.size());
        assertEquals(2, parsed.get(1).asDocument().getInt32("a").getValue());
    }

    @Test
    public void insertEmptyArrayBecomesTheTextEmptyArray() {
        assertEquals("[]", document(form("INSERT", COLLECTION, "documents", "[]")).get("documents"));
    }

    @Test
    public void insertMalformedInputIsReportedPerForm() {
        PluginException object = assertThrows(PluginException.class, () -> document(form("INSERT", COLLECTION, "documents", "{\"a\": ")));
        assertEquals("INVALID_JSON_FORMAT", object.getMessageKey());
        assertEquals("Documents", object.getArgs()[0]);
    }

    static final List<String> BROKEN_ARRAYS = List.of("[}", "[{\"a\": ");

    /**
     * Pins the plan section 9 row "Insert/Aggregate: [} or a truncated array escapes as a raw BsonInvalidOperationException (catch handles JsonParseException only)" as observed. A fix (catching it) changes this test on purpose.
     * Most malformed arrays tried ({@link #BROKEN_ARRAYS}) escape as a raw BsonInvalidOperationException instead
     * of the INVALID_JSON_ARRAY_FORMAT error; only a JsonParseException input such as {@code [,]} or {@code [{'a':}]} is mapped.
     */
    @Test
    public void insertMalformedArraysEscapeAsRawBsonExceptionsExceptCommaOnly() {
        PluginException mapped = assertThrows(PluginException.class, () -> document(form("INSERT", COLLECTION, "documents", "[,]")));
        assertEquals("INVALID_JSON_ARRAY_FORMAT", mapped.getMessageKey());
        assertEquals("INVALID_JSON_ARRAY_FORMAT", assertThrows(PluginException.class, () -> document(form("INSERT", COLLECTION, "documents", "[{'a':}]"))).getMessageKey());
        for (String broken : BROKEN_ARRAYS) {
            assertThrows(org.bson.BsonInvalidOperationException.class, () -> document(form("INSERT", COLLECTION, "documents", broken)), broken);
        }
    }

    @Test
    public void insertWithoutDocumentsIsInvalid() {
        assertInvalidWith(form("INSERT", COLLECTION), "Documents");
        assertInvalidWith(form("INSERT", COLLECTION, "documents", "  "), "Documents");
    }

    // ---- update

    @Test
    public void updateTouchesOneDocumentUnlessTheOptionIsExactlyAll() {
        Document single = document(form("UPDATE", COLLECTION, "query", "{\"id\": 1}", "update", "{\"$set\": {\"a\": 2}}", "limit", SINGLE));
        Document defaulted = document(form("UPDATE", COLLECTION, "query", "{\"id\": 1}", "update", "{\"$set\": {\"a\": 2}}"));
        Document all = document(form("UPDATE", COLLECTION, "query", "{\"id\": 1}", "update", "{\"$set\": {\"a\": 2}}", "limit", ALL));
        Document lowerCase = document(form("UPDATE", COLLECTION, "query", "{\"id\": 1}", "update", "{\"$set\": {\"a\": 2}}", "limit", "all"));
        assertEquals(Boolean.FALSE, ((Document) ((List<?>) single.get("updates")).get(0)).get("multi"));
        assertEquals(Boolean.FALSE, ((Document) ((List<?>) defaulted.get("updates")).get(0)).get("multi"));
        assertEquals(Boolean.TRUE, ((Document) ((List<?>) all.get("updates")).get(0)).get("multi"));
        assertEquals(Boolean.FALSE, ((Document) ((List<?>) lowerCase.get("updates")).get(0)).get("multi"), "only the exact text ALL means all documents: a lower-case value stays single");
    }

    @Test
    public void updateDocumentHasTheCollectionAndOneUpdateStatement() {
        Document document = document(form("UPDATE", COLLECTION, "query", "{\"id\": 1}", "update", "{\"$set\": {\"a\": 2}}"));
        assertEquals(COLLECTION, document.get("update"));
        List<?> updates = assertInstanceOf(List.class, document.get("updates"));
        assertEquals(1, updates.size());
        Document statement = (Document) updates.get(0);
        assertEquals(Document.parse("{\"id\": 1}"), statement.get("q"));
        assertEquals(Document.parse("{\"$set\": {\"a\": 2}}"), statement.get("u"));
    }

    @Test
    public void updateNeedsQueryAndUpdateAndNamesWhatIsMissing() {
        assertInvalidWith(form("UPDATE", COLLECTION), "Query", "Update");
        assertInvalidWith(form("UPDATE", COLLECTION, "update", "{\"$set\": {}}"), "Query");
        assertInvalidWith(form("UPDATE", COLLECTION, "query", "{}"), "Update");
        assertInvalidWith(form("UPDATE", COLLECTION, "query", " ", "update", " "), "Query", "Update");
    }

    // ---- delete

    /** The data-loss test: one document by default, all only for the exact option ALL, never without a query. */
    @Test
    public void deleteRemovesOneDocumentUnlessTheOptionIsExactlyAll() {
        Map<String, Object> query = Map.of("query", "{\"id\": 1}");
        Document single = document(form("DELETE", COLLECTION, "query", "{\"id\": 1}", "limit", SINGLE));
        Document defaulted = document(form("DELETE", COLLECTION, "query", "{\"id\": 1}"));
        Document all = document(form("DELETE", COLLECTION, "query", "{\"id\": 1}", "limit", ALL));
        Document lowerCase = document(form("DELETE", COLLECTION, "query", "{\"id\": 1}", "limit", "all"));
        assertEquals(1, ((Document) ((List<?>) single.get("deletes")).get(0)).get("limit"));
        assertEquals(1, ((Document) ((List<?>) defaulted.get("deletes")).get(0)).get("limit"));
        assertEquals(0, ((Document) ((List<?>) all.get("deletes")).get(0)).get("limit"), "limit 0 deletes every matching document");
        assertEquals(1, ((Document) ((List<?>) lowerCase.get("deletes")).get(0)).get("limit"), "only the exact text ALL means all documents: a lower-case value stays single");
        assertEquals(query.get("query"), "{\"id\": 1}");
    }

    @Test
    public void deleteDocumentHasTheCollectionAndOneDeleteStatement() {
        Document document = document(form("DELETE", COLLECTION, "query", "{\"id\": 1}"));
        assertEquals(COLLECTION, document.get("delete"));
        Document statement = (Document) ((List<?>) document.get("deletes")).get(0);
        assertEquals(Document.parse("{\"id\": 1}"), statement.get("q"));
        assertEquals(1, ((List<?>) document.get("deletes")).size());
    }

    @Test
    public void deleteWithoutAQueryIsInvalidBecauseThereIsNoSmartDefault() {
        assertInvalidWith(form("DELETE", COLLECTION), "Query");
        assertInvalidWith(form("DELETE", COLLECTION, "query", "   ", "limit", ALL), "Query");
    }

    // ---- count and distinct

    @Test
    public void countDefaultsToAnEmptyQuery() {
        Document defaulted = document(form("COUNT", COLLECTION));
        assertEquals(COLLECTION, defaulted.get("count"));
        assertEquals(new Document(), defaulted.get("query"));
        assertEquals(Document.parse("{\"a\": 1}"), document(form("COUNT", COLLECTION, "query", "{\"a\": 1}")).get("query"));
        PluginException thrown = assertThrows(PluginException.class, () -> document(form("COUNT", COLLECTION, "query", "{")));
        assertEquals("INVALID_JSON_FORMAT", thrown.getMessageKey());
        assertEquals("Query", thrown.getArgs()[0]);
    }

    @Test
    public void distinctNeedsAKeyAndDefaultsToAnEmptyQuery() {
        Document document = document(form("DISTINCT", COLLECTION, "key", "city"));
        assertEquals(COLLECTION, document.get("distinct"));
        assertEquals("city", document.get("key"));
        assertEquals(new Document(), document.get("query"));
        assertEquals(Document.parse("{\"a\": 1}"), document(form("DISTINCT", COLLECTION, "key", "city", "query", "{\"a\": 1}")).get("query"));
        assertInvalidWith(form("DISTINCT", COLLECTION), "Key/Field");
        assertInvalidWith(form("DISTINCT", COLLECTION, "key", " "), "Key/Field");
    }

    // ---- aggregate

    @Test
    public void aggregateKeepsAnArrayPipelineAndWrapsASingleStage() {
        Document array = document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[{\"$match\": {\"a\": 1}}, {\"$limit\": 2}]", "limit", "50"));
        assertEquals(COLLECTION, array.get("aggregate"));
        assertEquals(2, assertInstanceOf(org.bson.BsonArray.class, array.get("pipeline")).size());
        Document single = document(form("AGGREGATE", COLLECTION, "arrayPipelines", "{\"$match\": {\"a\": 1}}", "limit", "50"));
        assertEquals(List.of(Document.parse("{\"$match\": {\"a\": 1}}")), single.get("pipeline"));
        assertEquals("[]", document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "50")).get("pipeline"), "an empty array becomes the text []");
    }

    /**
     * The absent-limit assertion pins the plan section 9 row "data missing: a mongo aggregate with no limit field sends cursor {batchSize: 0} and MongoDB 7.0 returns zero rows" (server side:
     * MongoEngineContainerTest.aggregateWithoutALimitFieldAgainstTheServer_pinsTheSection9Row). A fix (a default limit when the
     * field is absent) changes it on purpose.
     */
    @Test
    public void aggregateBatchSizeFollowsTheLimitField_pinsTheSection9Row() {
        assertEquals(Document.parse("{batchSize: 50}"), document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "50")).get("cursor"));
        assertEquals(Document.parse("{batchSize: " + Integer.MAX_VALUE + "}"), document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "  ")).get("cursor"), "a blank limit means unlimited");
        Document absent = document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]"));
        assertEquals(Document.parse("{batchSize: 0}"), absent.get("cursor"), "an absent limit field leaves the limit at 0: batchSize 0 (observed; MG-6 confirms the rows against a server)");
    }

    @Test
    public void aggregateLimitMustBeAPositiveIntegerAndFailsWhileTheCommandIsBuilt() {
        for (String limit : List.of("0", "-1", "x")) {
            PluginException thrown = assertThrows(PluginException.class, () -> MongoQueryUtils.convertMongoFormInputToRawCommand(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", limit)), limit);
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals(INVALID_LIMIT, thrown.getMessageKey(), limit);
        }
    }

    /** Aggregate side of the section 9 row named at {@link #insertMalformedArraysEscapeAsRawBsonExceptionsExceptCommaOnly}: Pins the plan section 9 row "Insert/Aggregate: [} or a truncated array escapes as a raw BsonInvalidOperationException (catch handles JsonParseException only)" as observed. */
    @Test
    public void aggregateMalformedPipelineAndMissingPipelineAreReported() {
        assertEquals("INVALID_MONGODB_BSON_ARRAY_FORMAT", assertThrows(PluginException.class, () -> document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[,]", "limit", "5"))).getMessageKey());
        for (String broken : BROKEN_ARRAYS) {
            assertThrows(org.bson.BsonInvalidOperationException.class, () -> document(form("AGGREGATE", COLLECTION, "arrayPipelines", broken, "limit", "5")), "observation: not mapped to INVALID_MONGODB_BSON_ARRAY_FORMAT: " + broken);
        }
        PluginException stage = assertThrows(PluginException.class, () -> document(form("AGGREGATE", COLLECTION, "arrayPipelines", "{\"$match\": ", "limit", "5")));
        assertEquals("INVALID_JSON_FORMAT", stage.getMessageKey());
        assertEquals("Array of Pipelines", stage.getArgs()[0]);
        assertInvalidWith(form("AGGREGATE", COLLECTION, "limit", "5"), "Array of Pipelines");
        assertInvalidWith(form("AGGREGATE", COLLECTION, "arrayPipelines", "", "limit", "5"), "Array of Pipelines");
    }

    // ---- collection, dispatch, timeout

    @Test
    public void everyCommandNeedsACollection() {
        for (String type : List.of("FIND", "INSERT", "UPDATE", "DELETE", "COUNT", "DISTINCT", "AGGREGATE")) {
            assertInvalidWith(form(type, null), "collection");
            assertInvalidWith(form(type, "   "), "collection");
        }
    }

    @Test
    public void commandTypeIsMatchedInAnyCaseAndUnknownTypesAreRejectedWithTheirName() {
        assertInstanceOf(Find.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("find", COLLECTION)));
        assertInstanceOf(Find.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("Find", COLLECTION)));
        assertInstanceOf(Insert.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("insert", COLLECTION, "documents", "{}")));
        assertInstanceOf(UpdateMany.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("update", COLLECTION, "query", "{}", "update", "{}")));
        assertInstanceOf(Delete.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("delete", COLLECTION, "query", "{}")));
        assertInstanceOf(Count.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("count", COLLECTION)));
        assertInstanceOf(Distinct.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("distinct", COLLECTION, "key", "k")));
        assertInstanceOf(Aggregate.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("aggregate", COLLECTION, "arrayPipelines", "[]", "limit", "1")));
        for (String unknown : Arrays.asList("MERGE", "", "RAW")) {
            PluginException thrown = invalid(form(unknown, COLLECTION));
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals("INVALID_MONGODB_REQUEST", thrown.getMessageKey());
            assertEquals(unknown, thrown.getArgs()[0]);
        }
        Map<String, Object> noType = new HashMap<>();
        noType.put("collection", COLLECTION);
        assertEquals("INVALID_MONGODB_REQUEST", invalid(noType).getMessageKey(), "a missing type is the empty type");
    }

    @Test
    public void rawIsDetectedInAnyCase() {
        assertTrue(MongoQueryUtils.isRawCommand(form("RAW", null)));
        assertTrue(MongoQueryUtils.isRawCommand(form("raw", null)));
        assertFalse(MongoQueryUtils.isRawCommand(form("FIND", null)));
        assertFalse(MongoQueryUtils.isRawCommand(new HashMap<>()));
    }

    /**
     * Pins defect D17 (analysis-plugins section 0.6; plan section 9 D1-D20 row: default-locale toUpperCase,
     * {@code MongoQueryUtils.java:90}): under a Turkish default locale the command type {@code insert} (lower case) becomes a
     * dotted capital I word and is rejected as unknown. The client sends upper-case types (mongoQuery.tsx:15-22), which a
     * Turkish locale does not change, so only an API call with a lower-case type reaches it. A fix ({@code Locale.ROOT})
     * changes this test on purpose. The default locale is global state: restored in finally.
     */
    @Test
    public void lowerCaseCommandTypeIsRejectedUnderATurkishDefaultLocale_pinsD17() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            System.out.println("[MongoCommandDocumentsTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            PluginException thrown = invalid(form("insert", COLLECTION, "documents", "{}"));
            assertEquals("INVALID_MONGODB_REQUEST", thrown.getMessageKey());
            assertInstanceOf(Insert.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("INSERT", COLLECTION, "documents", "{}")), "the upper-case type the client sends is unaffected");
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(Insert.class, MongoQueryUtils.convertMongoFormInputToRawCommand(form("insert", COLLECTION, "documents", "{}")), "locale restored: " + Locale.getDefault());
    }

    /**
     * Pins defect D12 (analysis-plugins section 0.6; plan section 9 D1-D20 row): the {@code timeout} form field is read into
     * {@code timeoutMs} (default 8000) and never reaches a command document: none of them carries {@code maxTimeMS}, so the
     * setting has no effect. A fix (adding {@code maxTimeMS}) changes this test on purpose.
     */
    @Test
    public void timeoutIsReadButNoCommandDocumentCarriesIt_pinsD12() {
        Map<String, Object> withTimeout = form("FIND", COLLECTION);
        withTimeout.put("timeout", 100);
        assertEquals(100, MongoQueryUtils.convertMongoFormInputToRawCommand(withTimeout).getTimeoutMs());
        assertEquals(DEFAULT_TIMEOUT_MS, MongoQueryUtils.convertMongoFormInputToRawCommand(form("FIND", COLLECTION)).getTimeoutMs());
        List<Map<String, Object>> forms = new ArrayList<>(List.of(
                form("FIND", COLLECTION), form("INSERT", COLLECTION, "documents", "{}"), form("UPDATE", COLLECTION, "query", "{}", "update", "{}"),
                form("DELETE", COLLECTION, "query", "{}"), form("COUNT", COLLECTION), form("DISTINCT", COLLECTION, "key", "k"),
                form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "1")));
        for (Map<String, Object> form : forms) {
            form.put("timeout", 100);
            Document document = MongoQueryUtils.convertMongoFormInputToRawCommand(form).parseCommand();
            assertFalse(document.containsKey("maxTimeMS"), form.get("compType") + ": " + document.toJson());
            assertNull(document.get("timeout"));
        }
    }
}

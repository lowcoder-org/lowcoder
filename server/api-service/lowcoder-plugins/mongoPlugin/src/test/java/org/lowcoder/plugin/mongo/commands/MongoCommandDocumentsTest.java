package org.lowcoder.plugin.mongo.commands;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.utils.MongoQueryUtils;
import org.lowcoder.sdk.exception.PluginException;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
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
    static final int QUERY_TIMEOUT_MS = 2500;

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

    /** BF-117 through another caller of parseSafely: a query, sort or projection that is an array is INVALID_JSON_FORMAT of its field. */
    @Test
    public void findFieldsThatAreNoDocumentAreCodedErrorsBF117() {
        for (String[] field : new String[][] {{"query", "Query"}, {"sort", "Sort"}, {"projection", "Projection"}}) {
            for (String notADocument : List.of("[]", "[{\"a\": 1}]", "[}")) {
                PluginException coded = assertThrows(PluginException.class, () -> document(form("FIND", COLLECTION, field[0], notADocument)), notADocument);
                System.out.println("[MongoCommandDocumentsTest] FIND " + field[0] + " " + notADocument + " -> " + coded.getMessageKey() + " " + coded.getArgs()[0]);
                assertEquals(QUERY_ARGUMENT_ERROR, coded.getError());
                assertEquals("INVALID_JSON_FORMAT", coded.getMessageKey());
                assertEquals(field[1], coded.getArgs()[0]);
            }
        }
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
     * BF-117 (fixed; was pinned as plan section 9 row "Insert/Aggregate: [} or a truncated array escapes as a raw
     * BsonInvalidOperationException"): a text that starts with {@code [} but does not end with {@code ]} ({@link #BROKEN_ARRAYS})
     * is not an array to {@code isArrayStr}, so it is parsed as one document by {@code MongoQueryUtils.parseSafely}, whose
     * {@code Document.parse} throws BsonInvalidOperationException for it; parseSafely now maps that to INVALID_JSON_FORMAT
     * with the field's name, as it does a JsonParseException. A malformed text in brackets ({@code [,]}, {@code [{'a':}]}) is
     * parsed as an array and is INVALID_JSON_ARRAY_FORMAT, as before.
     */
    @Test
    public void insertMalformedArraysAreCodedErrorsBF117() {
        PluginException mapped = assertThrows(PluginException.class, () -> document(form("INSERT", COLLECTION, "documents", "[,]")));
        assertEquals("INVALID_JSON_ARRAY_FORMAT", mapped.getMessageKey());
        assertEquals("INVALID_JSON_ARRAY_FORMAT", assertThrows(PluginException.class, () -> document(form("INSERT", COLLECTION, "documents", "[{'a':}]"))).getMessageKey());
        for (String broken : BROKEN_ARRAYS) {
            PluginException coded = assertThrows(PluginException.class, () -> document(form("INSERT", COLLECTION, "documents", broken)), broken);
            System.out.println("[MongoCommandDocumentsTest] INSERT " + broken + " -> " + coded.getError() + " " + coded.getMessageKey() + " " + coded.getMessage());
            assertEquals(QUERY_ARGUMENT_ERROR, coded.getError(), broken);
            assertEquals("INVALID_JSON_FORMAT", coded.getMessageKey(), broken);
            assertEquals("Documents", coded.getArgs()[0], broken);
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
     * BF-031 fixed: an absent limit field was sent as {@code {batchSize: 0}}, so the first batch was empty. It is now
     * unlimited like a blank limit (server side: MongoEngineContainerTest.aggregateWithoutALimitFieldReturnsEveryRowBF031).
     */
    @Test
    public void aggregateWithoutALimitIsUnlimitedLikeABlankLimitBF031() {
        assertEquals(Document.parse("{batchSize: 50}"), document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "50")).get("cursor"));
        assertEquals(Document.parse("{batchSize: " + Integer.MAX_VALUE + "}"), document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "  ")).get("cursor"), "a blank limit means unlimited");
        Document absent = document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]"));
        System.out.println("[MongoCommandDocumentsTest] aggregate without a limit field: cursor " + absent.get("cursor"));
        assertEquals(Document.parse("{batchSize: " + Integer.MAX_VALUE + "}"), absent.get("cursor"), "an absent limit field means unlimited");
    }

    @Test
    public void aggregateLimitMustBeAPositiveIntegerAndFailsWhileTheCommandIsBuilt() {
        for (String limit : List.of("0", "-1", "x")) {
            PluginException thrown = assertThrows(PluginException.class, () -> MongoQueryUtils.convertMongoFormInputToRawCommand(form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", limit)), limit);
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals(INVALID_LIMIT, thrown.getMessageKey(), limit);
        }
    }

    /** Aggregate side of BF-117 ({@link #insertMalformedArraysAreCodedErrorsBF117}): the broken arrays are INVALID_JSON_FORMAT of "Array of Pipelines". */
    @Test
    public void aggregateMalformedPipelineAndMissingPipelineAreReported() {
        assertEquals("INVALID_MONGODB_BSON_ARRAY_FORMAT", assertThrows(PluginException.class, () -> document(form("AGGREGATE", COLLECTION, "arrayPipelines", "[,]", "limit", "5"))).getMessageKey());
        for (String broken : BROKEN_ARRAYS) {
            PluginException coded = assertThrows(PluginException.class, () -> document(form("AGGREGATE", COLLECTION, "arrayPipelines", broken, "limit", "5")), broken);
            assertEquals("INVALID_JSON_FORMAT", coded.getMessageKey(), broken);
            assertEquals("Array of Pipelines", coded.getArgs()[0], broken);
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
     * BF-061 (formerly pinned as D12, "the timeout form field is read into timeoutMs and never reaches a command document"):
     * the query's timeout, which the server puts into the query config as {@code timeoutMs} (a number in text), is sent as
     * {@code maxTimeMS} in the read commands (find, aggregate, count, distinct), and not in the writes (insert, update,
     * delete). Without a positive {@code timeoutMs}, or with only the old {@code timeout} key, which nothing sends, no command
     * carries it.
     */
    @Test
    public void theQueryTimeoutIsSentAsMaxTimeMsInTheReadCommandsBF061() {
        List<Map<String, Object>> reads = List.of(form("FIND", COLLECTION), form("COUNT", COLLECTION), form("DISTINCT", COLLECTION, "key", "k"),
                form("AGGREGATE", COLLECTION, "arrayPipelines", "[]", "limit", "1"));
        List<Map<String, Object>> writes = List.of(form("INSERT", COLLECTION, "documents", "{}"), form("UPDATE", COLLECTION, "query", "{}", "update", "{}"),
                form("DELETE", COLLECTION, "query", "{}"));
        for (Map<String, Object> form : reads) {
            assertEquals(QUERY_TIMEOUT_MS, command(form, "timeoutMs", String.valueOf(QUERY_TIMEOUT_MS)).get("maxTimeMS"), String.valueOf(form.get("compType")));
            assertEquals(QUERY_TIMEOUT_MS, command(form, "timeoutMs", QUERY_TIMEOUT_MS).get("maxTimeMS"), "an Integer value too");
        }
        for (Map<String, Object> form : writes) {
            assertFalse(command(form, "timeoutMs", String.valueOf(QUERY_TIMEOUT_MS)).containsKey("maxTimeMS"), String.valueOf(form.get("compType")));
        }
        for (Map<String, Object> form : reads) {
            assertFalse(command(form, null, null).containsKey("maxTimeMS"), "no timeoutMs: " + form.get("compType"));
            assertFalse(command(form, "timeoutMs", "0").containsKey("maxTimeMS"), "0 would mean no limit: " + form.get("compType"));
            assertFalse(command(form, "timeoutMs", "abc").containsKey("maxTimeMS"), "not a number: " + form.get("compType"));
            assertFalse(command(form, "timeout", QUERY_TIMEOUT_MS).containsKey("maxTimeMS"), "the old key: " + form.get("compType"));
        }
    }

    private static Document command(Map<String, Object> form, String key, Object value) {
        Map<String, Object> withValue = new HashMap<>(form);
        if (key != null) {
            withValue.put(key, value);
        }
        Document document = MongoQueryUtils.convertMongoFormInputToRawCommand(withValue).parseCommand();
        System.out.println("[MongoCommandDocumentsTest] " + withValue.get("compType") + " " + key + "=" + value + " -> " + document.toJson());
        return document;
    }
}

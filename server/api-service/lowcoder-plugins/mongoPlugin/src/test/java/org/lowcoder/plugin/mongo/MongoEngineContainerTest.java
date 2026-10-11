package org.lowcoder.plugin.mongo;

import com.fasterxml.jackson.databind.JsonNode;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoConnection;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.plugin.mongo.model.MongoQueryExecutionContext;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.mongo.MongoContainerSupport.BLOCK_TIMEOUT;
import static org.lowcoder.plugin.mongo.MongoContainerSupport.DATABASE;
import static org.lowcoder.plugin.mongo.MongoContainerSupport.ENGINE;

/**
 * Unit MG-6 (task L5-8d): the Mongo engine against a real MongoDB 7.0 ({@link MongoContainerSupport}): connection and
 * test-connection, each command built from the form data the client sends and run through {@code buildQueryExecutionContext}
 * and {@code executeQuery}, the server's error mappings, and {@code getStructure}. Each test uses its own collection, so the
 * tests do not depend on order.
 *
 * <p>Limits: the image runs without authentication, TLS or SRV, so the auth-mechanism and ssl query parameters are not
 * exercised against a server; the commands are the single-statement commands the forms build.
 */
public class MongoEngineContainerTest {

    static final String TAG = "[MongoEngineContainerTest] ";
    static final String QUERY_CODE_OK = "OK";
    static final String UNREACHABLE_URI = "mongodb://127.0.0.1:1/nodb?serverSelectionTimeoutMS=300&connectTimeoutMS=300";
    static final long SLOW_FILTER_MILLIS = 1500;

    private static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();
    private static MongoConnection connection;
    private static final MongoDatasourceConfig CONFIG = MongoContainerSupport.hostConfig();

    @BeforeAll
    static void connect() {
        connection = ENGINE.createConnection(CONFIG).block(BLOCK_TIMEOUT);
    }

    @AfterAll
    static void disconnect() {
        ENGINE.destroyConnection(connection).block(BLOCK_TIMEOUT);
    }

    private static String collection(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static void seed(String collection, Document... documents) {
        Mono.from(connection.getDatabase().getCollection(collection).insertMany(List.of(documents))).block(BLOCK_TIMEOUT);
    }

    private static List<Document> stored(String collection) {
        return Flux.from(connection.getDatabase().getCollection(collection).find().sort(new Document("n", 1))).collectList().block(BLOCK_TIMEOUT);
    }

    private static Map<String, Object> form(String type, String collection, Object... compKeysAndValues) {
        Map<String, Object> comp = new HashMap<>();
        for (int i = 0; i < compKeysAndValues.length; i += 2) {
            comp.put((String) compKeysAndValues[i], compKeysAndValues[i + 1]);
        }
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        form.put("collection", collection);
        form.put("comp", comp);
        return form;
    }

    private static QueryExecutionResult run(MongoConnection on, Map<String, Object> form, Map<String, Object> params) {
        MongoQueryExecutionContext context = ENGINE.buildQueryExecutionContext(CONFIG, form, params, null);
        QueryExecutionResult result = ENGINE.executeQuery(on, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + context.getCommand().toJson() + " -> " + result.getQueryCode() + " " + result.getData());
        return result;
    }

    private static QueryExecutionResult run(Map<String, Object> form) {
        return run(connection, form, Map.of());
    }

    private static JsonNode data(QueryExecutionResult result) {
        assertEquals(QUERY_CODE_OK, result.getQueryCode());
        return (JsonNode) result.getData();
    }

    // ---- connection

    @Test
    public void hostAndUriConfigsConnectAndTestConnectionSucceeds() {
        assertTrue(ENGINE.testConnection(CONFIG).block(BLOCK_TIMEOUT).isSuccess());
        String uri = "mongodb://" + MongoContainerSupport.host() + ":" + MongoContainerSupport.port() + "/" + DATABASE;
        MongoDatasourceConfig uriConfig = MongoContainerSupport.uriConfig(uri);
        assertTrue(ENGINE.testConnection(uriConfig).block(BLOCK_TIMEOUT).isSuccess());
        MongoConnection viaUri = ENGINE.createConnection(uriConfig).block(BLOCK_TIMEOUT);
        try {
            Document pong = viaUri.ping().block(BLOCK_TIMEOUT);
            System.out.println(TAG + "ping through the URI config: " + pong.toJson());
            assertEquals(1.0, pong.get("ok"));
            assertEquals(DATABASE, viaUri.getDatabase().getName());
        } finally {
            ENGINE.destroyConnection(viaUri).block(BLOCK_TIMEOUT);
        }
    }

    @Test
    public void testConnectionReturnsAFailedResultForAnUnreachableServerInsteadOfThrowing() {
        DatasourceTestResult result = ENGINE.testConnection(MongoContainerSupport.uriConfig(UNREACHABLE_URI)).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "unreachable: success=" + result.isSuccess() + " message=" + result.getInvalidMessage(Locale.ENGLISH));
        assertEquals(false, result.isSuccess());
    }

    @Test
    public void aConfigWithANonMongoUriIsRejectedAtConnect() {
        MongoDatasourceConfig blank = MongoContainerSupport.uriConfig("  ");
        PluginException thrown = assertThrows(PluginException.class, () -> ENGINE.createConnection(blank).block(BLOCK_TIMEOUT));
        assertEquals("MONGODB_URL_EMPTY", thrown.getMessageKey());
        PluginException invalid = assertThrows(PluginException.class, () -> ENGINE.createConnection(MongoContainerSupport.uriConfig("http://x/y")).block(BLOCK_TIMEOUT));
        assertEquals("MONGODB_URL_EXTRACT_ERROR", invalid.getMessageKey());
    }

    @Test
    public void aClosedConnectionCanNoLongerRunCommands() {
        MongoConnection closing = ENGINE.createConnection(CONFIG).block(BLOCK_TIMEOUT);
        assertEquals(1.0, closing.ping().block(BLOCK_TIMEOUT).get("ok"));
        ENGINE.destroyConnection(closing).block(BLOCK_TIMEOUT);
        QueryExecutionResult after = run(closing, form("COUNT", collection("closed")), Map.of());
        assertEquals("MONGO_EXECUTION_ERROR", after.getQueryCode(), "observed: a closed client gives an error result, not an exception");
        assertEquals("MONGODB_EXECUTE_ERROR", after.getMessageKey());
    }

    // ---- commands

    @Test
    public void insertFindCountDistinctRunAgainstTheServer() {
        String c = collection("basic");
        assertEquals("{\"n\":1}", data(run(form("INSERT", c, "documents", "{\"n\": 1, \"city\": \"Oslo\"}"))).toString());
        assertEquals("{\"n\":2}", data(run(form("INSERT", c, "documents", "[{\"n\": 2, \"city\": \"Rome\"}, {\"n\": 3, \"city\": \"Oslo\"}]"))).toString());
        assertEquals(3, stored(c).size());

        JsonNode found = data(run(form("FIND", c, "query", "{\"city\": \"Oslo\"}", "sort", "{\"n\": -1}", "projection", "{\"n\": 1, \"_id\": 0}")));
        assertEquals("[{\"n\":3},{\"n\":1}]", found.toString());
        assertEquals("[{\"n\":2}]", data(run(form("FIND", c, "sort", "{\"n\": 1}", "projection", "{\"n\": 1, \"_id\": 0}", "limit", "1", "skip", "1"))).toString());
        assertEquals(3, data(run(form("FIND", c))).size());

        assertEquals(2, data(run(form("COUNT", c, "query", "{\"city\": \"Oslo\"}"))).get("n").asInt());
        assertEquals(3, data(run(form("COUNT", c))).get("n").asInt());

        JsonNode distinct = data(run(form("DISTINCT", c, "key", "city")));
        System.out.println(TAG + "distinct: " + distinct);
        assertTrue(distinct.toString().contains("Oslo") && distinct.toString().contains("Rome"));
    }

    @Test
    public void updateAndDeleteTouchOneDocumentOrAllAsTheOptionSays() {
        String c = collection("write");
        seed(c, new Document("n", 1).append("g", "a"), new Document("n", 2).append("g", "a"), new Document("n", 3).append("g", "b"));

        JsonNode single = data(run(form("UPDATE", c, "query", "{\"g\": \"a\"}", "update", "{\"$set\": {\"u\": 1}}", "limit", "SINGLE")));
        assertEquals(1, single.get("n").asInt());
        assertEquals(false, single.has("nModified"), "observed: the update result carries n only; parseResultBody returns on n before it reaches nModified");
        JsonNode all = data(run(form("UPDATE", c, "query", "{\"g\": \"a\"}", "update", "{\"$set\": {\"v\": 1}}", "limit", "ALL")));
        assertEquals(2, all.get("n").asInt());
        assertEquals(java.util.Arrays.asList(1, 1, null), stored(c).stream().map(d -> d.get("v")).toList());

        assertEquals(1, data(run(form("DELETE", c, "query", "{\"g\": \"a\"}", "limit", "SINGLE"))).get("n").asInt());
        assertEquals(2, stored(c).size(), "one document of group a is gone");
        assertEquals(1, data(run(form("DELETE", c, "query", "{\"g\": \"a\"}"))).get("n").asInt(), "the default is one document");
        seed(c, new Document("n", 4).append("g", "b"));
        assertEquals(2, data(run(form("DELETE", c, "query", "{\"g\": \"b\"}", "limit", "ALL"))).get("n").asInt());
        assertEquals(0, stored(c).size());
    }

    @Test
    public void aggregateGroupsAndRawCommandsRun() throws Exception {
        String c = collection("agg");
        seed(c, new Document("n", 1).append("g", "a"), new Document("n", 2).append("g", "a"), new Document("n", 3).append("g", "b"));
        JsonNode grouped = data(run(form("AGGREGATE", c, "arrayPipelines",
                "[{\"$group\": {\"_id\": \"$g\", \"total\": {\"$sum\": \"$n\"}}}, {\"$sort\": {\"_id\": 1}}]", "limit", "10")));
        assertEquals(JSON.readTree("[{\"_id\":\"a\",\"total\":3},{\"_id\":\"b\",\"total\":3}]"), grouped);

        Map<String, Object> raw = new HashMap<>();
        raw.put("compType", "RAW");
        raw.put("comp", new HashMap<>(Map.of("command", "{\"count\": \"{{coll}}\", \"query\": {\"g\": {{g}}}}")));
        assertEquals(2, data(run(connection, raw, Map.of("coll", c, "g", "a"))).get("n").asInt());
        raw.put("comp", new HashMap<>(Map.of("command", "{\"ping\": 1}")));
        QueryExecutionResult ping = run(connection, raw, Map.of());
        System.out.println(TAG + "raw ping: " + ping.getQueryCode() + " " + ping.getData());
        assertEquals(QUERY_CODE_OK, ping.getQueryCode());
    }

    /**
     * Pins the plan section 9 row "data missing: a mongo aggregate with no limit field sends cursor {batchSize: 0} and MongoDB 7.0 returns zero rows" as observed: a form without the aggregate's limit field builds the cursor
     * {@code {batchSize: 0}} (document pin: MongoCommandDocumentsTest.aggregateBatchSizeFollowsTheLimitField_pinsTheSection9Row)
     * and the server returns no rows, while a limit or a blank limit returns all of them. A fix (a default limit when the field
     * is absent) changes this test on purpose.
     */
    @Test
    public void aggregateWithoutALimitFieldAgainstTheServer_pinsTheSection9Row() {
        String c = collection("nolimit");
        seed(c, new Document("n", 1), new Document("n", 2), new Document("n", 3));
        String pipeline = "[{\"$match\": {}}, {\"$sort\": {\"n\": 1}}]";
        JsonNode withoutLimit = data(run(form("AGGREGATE", c, "arrayPipelines", pipeline)));
        JsonNode withLimit = data(run(form("AGGREGATE", c, "arrayPipelines", pipeline, "limit", "100")));
        JsonNode blankLimit = data(run(form("AGGREGATE", c, "arrayPipelines", pipeline, "limit", " ")));
        System.out.println(TAG + "rows without limit: " + withoutLimit.size() + ", with limit 100: " + withLimit.size() + ", blank limit: " + blankLimit.size());
        assertEquals(3, withLimit.size());
        assertEquals(3, blankLimit.size());
        assertEquals(OBSERVED_ROWS_WITHOUT_LIMIT, withoutLimit.size());
    }

    static final int OBSERVED_ROWS_WITHOUT_LIMIT = 0;

    /**
     * Pins defect D12 (analysis-plugins section 0.6; plan section 9 D1-D20 row) against a real server: the form's
     * {@code timeout} (1 ms) reaches no command, so a find that the server needs {@value #SLOW_FILTER_MILLIS} ms for runs to
     * completion and returns its row. The slow filter is {@code $where} with {@code sleep}, which MongoDB 7.0 runs by default
     * (server-side JavaScript is enabled). A fix (maxTimeMS in the Find document) makes the server abort it and this test fail
     * on purpose.
     */
    @Test
    public void formTimeoutDoesNotStopASlowFind_pinsD12() {
        String c = collection("slow");
        seed(c, new Document("n", 1));
        Map<String, Object> form = form("FIND", c, "query", "{\"$where\": \"sleep(" + SLOW_FILTER_MILLIS + ") || true\"}");
        form.put("timeout", "1");
        long start = System.nanoTime();
        QueryExecutionResult result = run(connection, form, Map.of());
        long elapsedMillis = (System.nanoTime() - start) / 1_000_000;
        System.out.println(TAG + "slow find with timeout=1 took " + elapsedMillis + " ms: " + result.getQueryCode());
        assertEquals(QUERY_CODE_OK, result.getQueryCode());
        assertEquals(1, ((JsonNode) result.getData()).size());
        assertTrue(elapsedMillis >= SLOW_FILTER_MILLIS, "the setting did not cut the command short: " + elapsedMillis);
    }

    // ---- server errors

    @Test
    public void serverCommandErrorsAreMappedToQueryArgumentErrorsWithTheServersText() {
        Map<String, Object> unknown = new HashMap<>();
        unknown.put("compType", "RAW");
        unknown.put("comp", new HashMap<>(Map.of("command", "{\"noSuchCommand\": 1}")));
        PluginException thrown = assertThrows(PluginException.class, () -> run(connection, unknown, Map.of()));
        System.out.println(TAG + "unknown command: " + thrown.getError() + " " + thrown.getMessageKey() + " " + List.of(thrown.getArgs()));
        assertEquals("QUERY_ARGUMENT_ERROR", thrown.getMessageKey());
        assertTrue(String.valueOf(thrown.getArgs()[0]).contains("noSuchCommand"));

        String c = collection("err");
        PluginException pipeline = assertThrows(PluginException.class,
                () -> run(form("AGGREGATE", c, "arrayPipelines", "[{\"$noSuchStage\": {}}]", "limit", "5")));
        assertEquals("QUERY_ARGUMENT_ERROR", pipeline.getMessageKey());
        assertTrue(String.valueOf(pipeline.getArgs()[0]).contains("$noSuchStage"));

        PluginException update = assertThrows(PluginException.class,
                () -> run(form("FIND", c, "query", "{\"$badOperator\": 1}")));
        assertEquals("QUERY_ARGUMENT_ERROR", update.getMessageKey());
    }

    // ---- structure

    @Test
    public void getStructureListsCollectionsWithColumnsFromAnExampleDocument() {
        String c = collection("shape");
        seed(c, new Document("_id", new ObjectId()).append("i", 1).append("l", 2L).append("d", 1.5d)
                .append("dec", new Decimal128(new BigDecimal("1.25"))).append("s", "x").append("arr", List.of(1))
                .append("date", new Date()).append("sub", new Document("k", "v")));
        String empty = collection("empty");
        Mono.from(connection.getDatabase().createCollection(empty)).block(BLOCK_TIMEOUT);

        DatasourceStructure structure = ENGINE.getStructure(connection, CONFIG).block(BLOCK_TIMEOUT);
        structure.getTables().forEach(t -> System.out.println(TAG + t.getType() + " " + t.getName() + " "
                + t.getColumns().stream().map(col -> col.getName() + ":" + col.getType()).toList()));
        DatasourceStructure.Table shape = structure.getTables().stream().filter(t -> c.equals(t.getName())).findFirst().orElseThrow();
        assertEquals(DatasourceStructure.TableType.COLLECTION, shape.getType());
        assertEquals(List.of("_id:ObjectId", "arr:Array", "d:Double", "date:Date", "dec:BigDecimal", "i:Integer", "l:Long", "s:String", "sub:Object"),
                shape.getColumns().stream().map(col -> col.getName() + ":" + col.getType()).toList());
        DatasourceStructure.Table emptyTable = structure.getTables().stream().filter(t -> empty.equals(t.getName())).findFirst().orElseThrow();
        assertTrue(emptyTable.getColumns().isEmpty(), "observed: an empty collection is listed with no columns, the call does not fail");
    }
}

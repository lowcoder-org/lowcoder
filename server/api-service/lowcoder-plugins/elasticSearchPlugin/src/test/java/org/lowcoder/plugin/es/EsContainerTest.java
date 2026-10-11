package org.lowcoder.plugin.es;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.es.EsContainerSupport.BLOCK_TIMEOUT;
import static org.lowcoder.plugin.es.EsContainerSupport.CONNECTOR;
import static org.lowcoder.plugin.es.EsContainerSupport.EXECUTOR;
import static org.lowcoder.plugin.es.EsContainerSupport.PASSWORD;
import static org.lowcoder.plugin.es.EsContainerSupport.USER;

/**
 * Unit ES-4 (task L4-14, lane L5), against a real Elasticsearch 8.15 single node with security on ({@link EsContainerSupport}):
 * {@code testConnection} with the right, a wrong and no password, the queries a user runs (create index, index, get, search,
 * bulk, count, delete) through {@code buildQueryExecutionContext} and {@code executeQuery}, the server's error answers, the
 * non-object answers, a HEAD request, a TLS connection string against the plain-HTTP node, and {@code destroyConnection}.
 * The stub-server cases (credentials sent or not, prefix, the disallowed-hosts guard, connection-string validation) are in other
 * classes of the module and are not repeated.
 *
 * <p>Heavy container (tag {@code heavy-container}): outside the gate, run under the heavy command only. Each test uses its own
 * index name, so the tests do not depend on order. Limits: one node, plain HTTP, the built-in {@code elastic} user.
 */
@Tag("heavy-container")
public class EsContainerTest {

    static final String TAG = "[EsContainerTest] ";
    static final String QUERY_CODE_OK = "OK";
    static final String ES_ERROR_CODE = "ES_EXECUTION_ERROR";
    static final String ES_QUERY_ERROR_KEY = "ES_QUERY_ERROR";

    private static EsConnection connection;

    @BeforeAll
    static void connect() {
        connection = CONNECTOR.createConnection(EsContainerSupport.config()).block(BLOCK_TIMEOUT);
    }

    @AfterAll
    static void disconnect() {
        CONNECTOR.destroyConnection(connection).block(BLOCK_TIMEOUT);
    }

    private static String index(String name) {
        return name + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static QueryExecutionResult run(String method, String path, String dsl) {
        Map<String, Object> queryConfig = new HashMap<>();
        queryConfig.put("httpMethod", method);
        queryConfig.put("path", path);
        if (dsl != null) {
            queryConfig.put("dsl", dsl);
        }
        var context = EXECUTOR.buildQueryExecutionContext(null, queryConfig, Map.of(), null);
        QueryExecutionResult result = EXECUTOR.executeQuery(connection, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + method + " /" + context.getPath() + " dsl=" + (dsl == null ? null : dsl.replace("\n", "\\n")) + " -> " + result.getQueryCode()
                + " " + result.getMessageKey() + " data=" + result.getData() + " args=" + (result.getMessageArgs() == null ? null : Arrays.toString(result.getMessageArgs())));
        return result;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> data(QueryExecutionResult result) {
        assertEquals(QUERY_CODE_OK, result.getQueryCode());
        return (Map<String, Object>) result.getData();
    }

    // ---- testConnection

    private static DatasourceTestResult test(String label, String connectionString, String user, String password) {
        DatasourceTestResult result = CONNECTOR.testConnection(EsContainerSupport.config(connectionString, user, password)).block(BLOCK_TIMEOUT);
        System.out.println(TAG + label + ": success=" + result.isSuccess() + (result.isSuccess() ? "" : " message=" + result.getInvalidMessage(Locale.ENGLISH)));
        return result;
    }

    @Test
    public void testConnectionSucceedsWithTheRightPasswordAndFailsWithAWrongOrMissingOne() {
        String url = EsContainerSupport.baseUrl();
        assertTrue(test("right password", url, USER, PASSWORD).isSuccess());
        DatasourceTestResult wrong = test("wrong password", url, USER, "wrong-password");
        assertFalse(wrong.isSuccess());
        assertTrue(wrong.getInvalidMessage(Locale.ENGLISH).contains("Unauthorized"), wrong.getInvalidMessage(Locale.ENGLISH));
        assertTrue(test("no credentials", url, null, null).getInvalidMessage(Locale.ENGLISH).contains("Unauthorized"));
        assertTrue(test("user without a password", url, USER, null).getInvalidMessage(Locale.ENGLISH).contains("Unauthorized"), "credentials are sent only when both are set");
        assertFalse(test("password without a user", url, null, PASSWORD).isSuccess());
    }

    /** A TLS connection string against the plain-HTTP node: the handshake fails, so the test connection reports a failure. */
    @Test
    public void tlsConnectionStringAgainstThePlainHttpNodeFails() {
        DatasourceTestResult result = test("https against http", "https://" + EsContainerSupport.host() + ":" + EsContainerSupport.port(), USER, PASSWORD);
        assertFalse(result.isSuccess());
    }

    // ---- queries

    @Test
    public void indexLifecycleThroughTheEngine() {
        String idx = index("lifecycle");
        Map<String, Object> created = data(run("PUT", idx, "{\"settings\": {\"number_of_shards\": 1, \"number_of_replicas\": 0}}"));
        assertEquals(true, created.get("acknowledged"));
        assertEquals(idx, created.get("index"));

        Map<String, Object> indexed = data(run("PUT", idx + "/_doc/1", "{\"title\": \"hello world\", \"views\": 3}"));
        assertEquals("created", indexed.get("result"));
        data(run("POST", idx + "/_refresh", null));

        Map<String, Object> fetched = data(run("GET", idx + "/_doc/1", null));
        assertEquals(true, fetched.get("found"));
        assertEquals("hello world", ((Map<?, ?>) fetched.get("_source")).get("title"));

        Map<String, Object> all = data(run("POST", idx + "/_search", "{\"query\": {\"match_all\": {}}}"));
        assertEquals(1, ((Map<?, ?>) ((Map<?, ?>) all.get("hits")).get("total")).get("value"));
        Map<String, Object> matching = data(run("POST", idx + "/_search", "{\"query\": {\"match\": {\"title\": \"hello\"}}}"));
        assertEquals(1, ((List<?>) ((Map<?, ?>) matching.get("hits")).get("hits")).size());
        Map<String, Object> none = data(run("POST", idx + "/_search", "{\"query\": {\"match\": {\"title\": \"absent\"}}}"));
        assertEquals(0, ((List<?>) ((Map<?, ?>) none.get("hits")).get("hits")).size());

        assertEquals(1, data(run("GET", idx + "/_count", null)).get("count"));
        assertEquals(true, data(run("DELETE", idx, null)).get("acknowledged"));
        QueryExecutionResult gone = run("GET", idx + "/_search", null);
        assertEquals(ES_ERROR_CODE, gone.getQueryCode());
    }

    /**
     * The bulk API takes newline-delimited JSON, and the server accepts such a body when it is sent as it is (the control, through
     * the connection's own client). The query path renders the DSL with {@code renderMustacheJsonString} first, which reads the text
     * as one JSON value: text that is not a single JSON value (as every valid bulk body is) comes out as one JSON string literal,
     * with the quotes and line breaks escaped and the final line break dropped. The server answers that with a 400, so a valid bulk
     * body cannot be run from a query. Pins the plan section 9 row "ES _bulk cannot be used: renderMustacheJsonString turns NDJSON into one
     * JSON string literal; server 400" against the real server, as observed, with the exact transformation. A fix (leaving a body
     * that is not one JSON value as it is) changes this test on purpose.
     */
    @Test
    public void validBulkBodyIsRewrittenIntoAJsonStringAndRefusedByTheServer_pinsTheSection9Row() throws Exception {
        String idx = index("bulk");
        String ndjson = "{\"index\": {\"_index\": \"" + idx + "\", \"_id\": \"1\"}}\n{\"title\": \"one\"}\n"
                + "{\"index\": {\"_index\": \"" + idx + "\", \"_id\": \"2\"}}\n{\"title\": \"two\"}\n";
        var context = EXECUTOR.buildQueryExecutionContext(null, Map.of("httpMethod", "POST", "path", "_bulk", "dsl", ndjson), Map.of(), null);
        System.out.println(TAG + "bulk dsl in : " + ndjson.replace("\n", "\\n"));
        System.out.println(TAG + "bulk dsl out: " + context.getDsl().replace("\n", "\\n"));
        String expected = "\"" + ndjson.substring(0, ndjson.length() - 1).replace("\"", "\\\"").replace("\n", "\\n") + "\"";
        assertEquals(expected, context.getDsl(), "the whole body becomes one JSON string literal without its final line break");

        QueryExecutionResult result = run("POST", "_bulk?refresh=true", ndjson);
        assertEquals(ES_ERROR_CODE, result.getQueryCode());
        assertEquals(ES_QUERY_ERROR_KEY, result.getMessageKey());
        assertTrue(String.valueOf(result.getMessageArgs()[0]).contains("400"), String.valueOf(result.getMessageArgs()[0]));

        org.elasticsearch.client.Request direct = new org.elasticsearch.client.Request("POST", "/_bulk?refresh=true");
        direct.setJsonEntity(ndjson);
        org.elasticsearch.client.Response control = connection.reactorRestClientAdaptor().request(direct).block(BLOCK_TIMEOUT);
        String body = org.apache.http.util.EntityUtils.toString(control.getEntity());
        System.out.println(TAG + "the same body sent as it is: " + control.getStatusLine() + " " + body);
        assertEquals(200, control.getStatusLine().getStatusCode());
        assertTrue(body.contains("\"errors\":false"), body);
        assertEquals(2, ((Map<?, ?>) ((Map<?, ?>) data(run("GET", idx + "/_search", null)).get("hits")).get("total")).get("value"));
    }

    @Test
    public void serverErrorsBecomeEsQueryErrorResultsWithTheServersText() {
        QueryExecutionResult missing = run("GET", index("no-such") + "/_search", null);
        assertEquals(ES_ERROR_CODE, missing.getQueryCode());
        assertEquals(ES_QUERY_ERROR_KEY, missing.getMessageKey());
        assertTrue(String.valueOf(missing.getMessageArgs()[0]).contains("index_not_found_exception"), String.valueOf(missing.getMessageArgs()[0]));
        assertTrue(String.valueOf(missing.getMessageArgs()[0]).contains("404"));
        assertNull(missing.getData());

        QueryExecutionResult malformed = run("POST", "_search", "{\"query\": {\"no_such_query\": {}}}");
        assertEquals(ES_ERROR_CODE, malformed.getQueryCode());
        assertEquals(ES_QUERY_ERROR_KEY, malformed.getMessageKey());
        assertTrue(String.valueOf(malformed.getMessageArgs()[0]).contains("400"), String.valueOf(malformed.getMessageArgs()[0]));
    }

    // ---- non-object answers and HEAD

    @Test
    public void answersThatAreNotJsonObjectsAreObservedAgainstTheRealServer() {
        String idx = index("cat");
        data(run("PUT", idx, null));
        QueryExecutionResult array = run("GET", "_cat/indices?format=json", null);
        QueryExecutionResult text = run("GET", "_cat/indices", null);
        System.out.println(TAG + "_cat json: " + array.getQueryCode() + " " + array.getMessageKey() + " data=" + array.getData());
        System.out.println(TAG + "_cat text: " + text.getQueryCode() + " " + text.getMessageKey() + " data=" + text.getData());
        assertEquals(OBSERVED_ARRAY_CODE, array.getQueryCode());
        assertNull(array.getData(), "a JSON array answer is a success with no data (the object parser returns null for it)");
        assertEquals(OBSERVED_TEXT_CODE, text.getQueryCode());
        assertNull(text.getData(), "a plain-text answer is a success with no data");
    }

    static final String OBSERVED_ARRAY_CODE = QUERY_CODE_OK;
    static final String OBSERVED_TEXT_CODE = QUERY_CODE_OK;

    /**
     * Pins the plan section 9 row "ES: a HEAD query ... answered 200 becomes a failed result" against the real server (the rows
     * pinned against a stub in another class of this module, EP3): HEAD on an existing index answers 200 with no body, and the
     * executor reads the missing entity as an error. A fix (reading a bodiless answer as success) changes this test on purpose.
     */
    @Test
    public void headOnAnExistingIndexBecomesAFailedResult_pinsTheSection9RowEP3() {
        String idx = index("head");
        data(run("PUT", idx, null));
        QueryExecutionResult exists = run("HEAD", idx, null);
        assertFalse(exists.isSuccess());
        assertEquals(ES_ERROR_CODE, exists.getQueryCode());
        assertEquals(ES_QUERY_ERROR_KEY, exists.getMessageKey());
        assertEquals("Entity may not be null", exists.getMessageArgs()[0]);
        assertNull(exists.getData());
        QueryExecutionResult absent = run("HEAD", index("head-absent"), null);
        assertEquals(ES_ERROR_CODE, absent.getQueryCode());
        assertEquals("Entity may not be null", absent.getMessageArgs()[0], "a missing index (404) gives the same result: the client does not raise a 404 for HEAD, so a HEAD query cannot tell an index exists");
    }

    // ---- destroy

    @Test
    public void destroyConnectionReleasesTheClient() {
        EsConnection own = CONNECTOR.createConnection(EsContainerSupport.config()).block(BLOCK_TIMEOUT);
        var context = EXECUTOR.buildQueryExecutionContext(null, Map.of("httpMethod", "GET", "path", "_cluster/health"), Map.of(), null);
        QueryExecutionResult before = EXECUTOR.executeQuery(own, context).block(BLOCK_TIMEOUT);
        assertEquals(QUERY_CODE_OK, before.getQueryCode());
        CONNECTOR.destroyConnection(own).block(BLOCK_TIMEOUT);
        QueryExecutionResult after = EXECUTOR.executeQuery(own, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "after destroy: " + after.getQueryCode() + " " + after.getMessageKey() + " " + Arrays.toString(after.getMessageArgs()));
        assertEquals(ES_ERROR_CODE, after.getQueryCode());
    }
}

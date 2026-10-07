package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.plugin.es.model.EsQueryExecutionContext;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * {@link EsQueryExecutor} against a local server: the HTTP method, path and body that reach it, and the path
 * normalisation of {@code buildQueryExecutionContext}, and the newline-delimited body of the bulk and multi-search endpoints
 * (BF-056). Response parsing is pinned by EsResultContractTest.
 */
public class EsQueryExecutorHttpTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String DSL = "{\"query\":{\"match_all\":{}}}";
    private static final String BULK_PATH = "/_bulk";
    private static final String OK_BODY = "{\"ok\":true}";

    private final EsQueryExecutor executor = new EsQueryExecutor();
    private final EsConnector connector = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
    private RecordingHttpServer server;
    private EsConnection connection;

    @BeforeEach
    public void connect() {
        RecordingHttpServer.Handler ok = request -> new Response(200, Map.of("Content-Type", List.of("application/json")),
                OK_BODY.getBytes(StandardCharsets.UTF_8));
        server = RecordingHttpServer.serve(Map.of("/idx/_doc", ok, BULK_PATH, ok));
        connection = connector.createConnection(connector.resolveConfig(Map.of("connectionString", server.baseUrl()))).block(TIMEOUT);
    }

    @AfterEach
    public void disconnect() throws Exception {
        connection.close();
        server.close();
    }

    private RecordingHttpServer.Request send(String method, String dsl) {
        Map<String, Object> queryConfig = Map.of("httpMethod", method, "path", "idx/_doc", "dsl", dsl);
        int before = server.requests().size();
        executor.executeQuery(connection, executor.buildQueryExecutionContext(null, queryConfig, Map.of(), null)).block(TIMEOUT);
        assertEquals(before + 1, server.requests().size());
        return server.requests().get(before);
    }

    /**
     * A HEAD with a DSL is not sent at all (the REST client refuses a body on HEAD before any request), so HEAD is only
     * checked without one; the outcome of a HEAD query is probe EP3, reported in log-L4.md and not pinned.
     */
    @Test
    public void theMethodPathAndBodyReachTheServerAndABlankDslSendsNoBody() {
        for (String method : List.of("GET", "POST", "PUT", "DELETE", "HEAD")) {
            RecordingHttpServer.Request withoutDsl = send(method, " ");
            assertEquals(method, withoutDsl.method());
            assertEquals("/idx/_doc", withoutDsl.pathAndQuery());
            assertEquals("", withoutDsl.bodyText(), method + " with a blank DSL sends no body");
            if (method.equals("HEAD")) {
                System.out.println("[EsQueryExecutorHttpTest] HEAD -> " + withoutDsl.pathAndQuery() + " without a body");
                continue;
            }
            RecordingHttpServer.Request withDsl = send(method, DSL);
            System.out.println("[EsQueryExecutorHttpTest] " + method + " -> " + withDsl.pathAndQuery() + " body '" + withDsl.bodyText()
                    + "', blank dsl -> body '" + withoutDsl.bodyText() + "'");
            assertEquals(method, withDsl.method());
            assertEquals("/idx/_doc", withDsl.pathAndQuery());
            assertEquals(DSL, withDsl.bodyText(), method + " sends the DSL as its JSON body");
            assertTrue(withDsl.header("Content-Type").get(0).startsWith("application/json"));
        }
    }

    @Test
    public void theResultOfASuccessfulRequestIsTheParsedJsonObject() {
        Map<String, Object> queryConfig = Map.of("httpMethod", "GET", "path", "idx/_doc");

        QueryExecutionResult result = executor.executeQuery(connection, executor.buildQueryExecutionContext(null, queryConfig, Map.of(), null))
                .block(TIMEOUT);

        assertTrue(result.isSuccess());
        assertEquals(Map.of("ok", true), result.getData());
    }

    @Test
    public void prefixPathAndSuffixAreTrimmedRenderedAndJoinedWithSingleSlashes() {
        Map<String, Object> params = Map.of("index", "logs-1", "id", "7");
        Map<String, Map<String, Object>> cases = new java.util.LinkedHashMap<>();
        cases.put("logs-1/_doc/7", Map.of("prefix", " /{{index}}/ ", "path", "//_doc//", "suffix", " {{id}} "));
        cases.put("a/b/c/d", Map.of("prefix", "a/b", "path", "c", "suffix", "d/"));
        cases.put("only", Map.of("path", " /only/ "));
        cases.put("", Map.of());
        cases.put("x", Map.of("prefix", " ", "path", "", "suffix", "/x"));
        cases.forEach((expected, parts) -> {
            Map<String, Object> queryConfig = new java.util.HashMap<>(parts);
            queryConfig.put("httpMethod", "GET");

            EsQueryExecutionContext context = executor.buildQueryExecutionContext(null, queryConfig, params, null);

            assertEquals(expected, context.getPath(), parts.toString());
            assertEquals("", context.getDsl());
        });
    }

    @Test
    public void ndjsonEndpointsAreRecognisedByTheirLastPathSegmentsBF056() {
        for (String path : List.of("_bulk", "logs/_bulk", "_bulk?refresh=true", "logs/_msearch", "_msearch/template", "logs/_msearch/template?x=1")) {
            assertTrue(EsQueryExecutor.isNdjsonEndpoint(path), path);
        }
        for (String path : List.of("", "logs/_search", "logs/_bulk_x", "my_bulk", "_bulk/x", "logs/_doc/1", "_search?q=_bulk", "_template")) {
            assertFalse(EsQueryExecutor.isNdjsonEndpoint(path), path);
        }
    }

    /**
     * BF-056: the body of an NDJSON endpoint is rendered line by line: placeholders inside a line are filled in as in any DSL,
     * blank lines and CR LF line ends are dropped, a line that is a single placeholder holding text is taken as NDJSON lines
     * as they are, one holding an object is written as JSON, and the body ends with a line break. Before, the whole text was
     * one JSON string literal.
     */
    @Test
    public void bulkBodyIsRenderedLineByLineAndReachesTheServerAsNdjsonBF056() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("idx", "logs");
        params.put("id", 7);
        params.put("title", "kůň \"q\"");
        params.put("more", "{\"delete\":{\"_index\":\"logs\",\"_id\":\"8\"}}\n{\"index\":{\"_index\":\"logs\"}}\n{\"n\":9}\n");
        params.put("doc", Map.of("n", 10));
        String dsl = "{\"index\": {\"_index\": \"{{idx}}\", \"_id\": {{id}}}}\r\n{\"title\": {{title}}}\n\n   \n{{more}}\n"
                + "{\"index\": {\"_index\": \"logs\"}}\n{{ doc }}";
        Map<String, Object> queryConfig = Map.of("httpMethod", "POST", "path", BULK_PATH, "dsl", dsl);
        EsQueryExecutionContext context = executor.buildQueryExecutionContext(null, queryConfig, params, null);
        System.out.println("[EsQueryExecutorHttpTest] bulk dsl in : " + dsl.replace("\r", "\\r").replace("\n", "\\n"));
        System.out.println("[EsQueryExecutorHttpTest] bulk dsl out: " + context.getDsl().replace("\n", "\\n"));

        String expected = "{\"index\":{\"_index\":\"logs\",\"_id\":7}}\n"
                + "{\"title\":\"kůň \\\"q\\\"\"}\n"
                + "{\"delete\":{\"_index\":\"logs\",\"_id\":\"8\"}}\n{\"index\":{\"_index\":\"logs\"}}\n{\"n\":9}\n"
                + "{\"index\":{\"_index\":\"logs\"}}\n"
                + "{\"n\":10}\n";
        assertEquals("_bulk", context.getPath());
        assertEquals(expected, context.getDsl());

        int before = server.requests().size();
        QueryExecutionResult result = executor.executeQuery(connection, context).block(TIMEOUT);
        RecordingHttpServer.Request request = server.requests().get(before);
        System.out.println("[EsQueryExecutorHttpTest] bulk request " + request.method() + " " + request.pathAndQuery() + " -> " + result.getQueryCode());
        assertEquals(BULK_PATH, request.pathAndQuery());
        assertEquals(expected, request.bodyText(), "the server receives the NDJSON body as rendered");
        assertTrue(result.isSuccess());
    }
}

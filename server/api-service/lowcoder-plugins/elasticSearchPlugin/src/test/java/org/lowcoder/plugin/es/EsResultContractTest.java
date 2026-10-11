package org.lowcoder.plugin.es;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Group {@code external-json} of {@code EsQueryExecutor} and its row of the §4.6 producer table
 * (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.10, task T8.2): a connection made by {@code EsConnector.createConnection}
 * (Elasticsearch's low-level REST client) sends each query to a local server ({@link RecordingHttpServer}) that
 * answers the case of {@link #RESPONSES}; {@code executeQuery} reads the body with {@code JsonUtils.fromJsonMap} and
 * puts the {@code Map} into the result. A body that is not a JSON object (an array, invalid JSON) is read as
 * {@code null}, so the query succeeds without data (O76); a status that is not 2xx is an {@code ES_QUERY_ERROR}
 * result. Each case's report ({@link QueryResults#report}) is pinned in {@value #REPORT}.
 *
 * <p>Limits: the server is not Elasticsearch; the error result's message arguments (which name the local port) are
 * not pinned.
 */
public class EsResultContractTest {

    static final String REPORT = "external-json/EsQueryExecutor.results.json";
    static final String CONTENT_TYPE = "Content-Type";
    static final String JSON = "application/json";
    static final String DSL = "{\"query\": {\"match_all\": {}}}";
    static final int OK = 200;
    static final int NOT_FOUND = 404;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Response> RESPONSES = responses();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    private final EsQueryExecutor executor = new EsQueryExecutor();

    @BeforeAll
    public static void startServer() {
        server = RecordingHttpServer.start(RESPONSES);
    }

    @AfterAll
    public static void stopServer() {
        server.close();
    }

    @BoundarySites("lowcoder-plugins/elasticSearchPlugin/src/main/java/org/lowcoder/plugin/es/EsQueryExecutor.java#EsQueryExecutor.executeQuery#fromJsonMap#1")
    @Test
    public void resultsAsPinned() throws IOException {
        EsConnector connector = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
        Map<String, Object> report = new LinkedHashMap<>();
        try (EsConnection connection = connector.createConnection(connector.resolveConfig(Map.of("connectionString", server.baseUrl())))
                .block(TIMEOUT)) {
            for (String path : RESPONSES.keySet()) {
                report.put(path, report(connection, path));
            }
        }
        String actual = ConfigBinding.write(report);
        System.out.println("[EsResultContractTest] " + server.requests().size() + " requests\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private Object report(EsConnection connection, String path) {
        Map<String, Object> queryConfig = Map.of("httpMethod", "POST", "path", path.substring(1), "dsl", DSL);
        try {
            QueryExecutionResult result = executor.executeQuery(connection,
                    executor.buildQueryExecutionContext(null, queryConfig, Map.of(), null)).block(TIMEOUT);
            return result == null ? null : QueryResults.report(result);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    private static Map<String, Response> responses() {
        Map<String, List<String>> json = Map.of(CONTENT_TYPE, List.of(JSON));
        Map<String, Response> responses = new LinkedHashMap<>();
        responses.put("/representative/_search", new Response(OK, json, utf8("{\"took\":1,\"hits\":{\"hits\":[{\"_source\":"
                + RepresentativeInput.TEXT + "}]}}")));
        responses.put("/array/_cat", new Response(OK, json, utf8("[{\"index\":\"logs\"}]")));
        responses.put("/invalid/_search", new Response(OK, json, utf8("{\"took\":")));
        responses.put("/missing/_search", new Response(NOT_FOUND, json, utf8("{\"error\":{\"type\":\"index_not_found_exception\"},\"status\":404}")));
        return responses;
    }

    private static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }
}

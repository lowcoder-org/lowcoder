package org.lowcoder.plugin.restapi;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.RenderValues;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Group {@code downstream-encode}, its {@code restApiPlugin} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5): a
 * body whose content type is {@value #JSON} is rendered into a node with the request parameters
 * ({@code RestApiExecutor.buildQueryExecutionContext}, {@code renderMustacheJson}) and handed to the client codecs as
 * that node ({@code buildBodyInserter}, {@code BodyInserters.fromValue}), which write it. A real executor POSTs each
 * body of {@link #BODIES} with the parameters {@link RenderValues} to a local server ({@link RecordingHttpServer});
 * what the server received, the content type and the body as sent ({@link RecordingHttpServer.Request#jsonBodyReport}),
 * is pinned by the §1.2 contract (number lexemes compared), one entry per body, in {@value #REPORT}.
 *
 * <p>Limits: the body bytes are read as UTF-8 JSON; a special-JSON type is {@code tree-text}'s
 * ({@code RestApiSpecialJsonBodyContractTest}), and form bodies are not JSON.
 */
public class RestApiJsonBodyContractTest {

    static final String REPORT = "downstream-encode/RestApiExecutor.jsonBody.json";
    static final String JSON = "application/json";
    static final String PATH = "/json";
    static final int OK = 200;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, String> BODIES = bodies();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    private final RestApiExecutor executor = new RestApiExecutor(new CommonConfig());
    private final QueryVisitorContext visitorContext = new QueryVisitorContext("userId1", "workspace1", 8080, null, null, null);

    @BeforeClass
    public static void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, new Response(OK, Map.of(RecordingHttpServer.CONTENT_TYPE, List.of("text/plain")),
                "ok".getBytes(StandardCharsets.UTF_8))));
    }

    @AfterClass
    public static void stopServer() {
        server.close();
    }

    @BoundarySites({
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.buildQueryExecutionContext#renderMustacheJson#1",
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.buildBodyInserter#BodyInserters.fromValue#4"})
    @Test
    public void jsonBodyAsSent() {
        Map<String, Object> report = new LinkedHashMap<>();
        BODIES.forEach((name, body) -> report.put(name, send(body)));
        String actual = ConfigBinding.write(report);
        System.out.println("[RestApiJsonBodyContractTest] " + server.requests().size() + " requests\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** What the server received for one POST of {@code body}, or the error. */
    private Object send(String body) {
        int before = server.requests().size();
        RestApiDatasourceConfig datasourceConfig = RestApiDatasourceConfig.builder().url(server.baseUrl()).build();
        Map<String, Object> queryConfig = Map.of("httpMethod", "POST", "path", PATH, "body", body,
                "headers", List.of(Map.of("key", RecordingHttpServer.CONTENT_TYPE, "value", JSON)));
        try {
            executor.doExecuteQuery(null, executor.doBuildQueryExecutionContext(datasourceConfig, queryConfig, RenderValues.values(), visitorContext))
                    .block(TIMEOUT);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        return server.requests().get(before).jsonBodyReport();
    }

    /** Every parameter as a member, the text ones also inside a string, and the §4.6 representative input. */
    static Map<String, String> bodies() {
        Map<String, String> bodies = new LinkedHashMap<>();
        bodies.put("parameters", "{" + RenderValues.values().keySet().stream().map(name -> "\"" + name + "\": {{" + name + "}}")
                .collect(Collectors.joining(", ")) + ", \"inText\": \"{{string}} {{dollar}}\", \"literal\": [1.50, 1e3, 2147483648]}");
        bodies.put("representativeInput", RepresentativeInput.TEXT.trim());
        return bodies;
    }
}

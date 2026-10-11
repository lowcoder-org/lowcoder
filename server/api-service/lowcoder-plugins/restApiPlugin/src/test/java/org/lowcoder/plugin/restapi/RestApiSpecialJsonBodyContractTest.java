package org.lowcoder.plugin.restapi;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Group {@code tree-text}, its {@code restApiPlugin} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.4): a body
 * whose content type is "special JSON" (a subtype with {@code -json}, {@code ContentTypeHelper.isSpecialJson}) is
 * rendered into a node and sent as {@code node.toString()} ({@code RestApiExecutor.buildBodyInserter}), the text of
 * Jackson's internal default mapper (E13), not the production mapper's. A real executor POSTs each body of
 * {@link #BODIES} to a local server ({@link RecordingHttpServer}); the bytes it receives are pinned exactly, one line
 * per body, with the content type it received, in {@value #REPORT}.
 *
 * <p>Limits: the received bytes are decoded as UTF-8 for the fixture; a body that is not special JSON goes through the
 * client codecs and is {@code downstream-encode}'s (T8.5).
 */
public class RestApiSpecialJsonBodyContractTest {

    static final String REPORT = "tree-text/RestApiExecutor.specialJsonBody.txt";
    static final String SPECIAL_JSON = "application/x-amz-json-1.1";
    static final String CONTENT_TYPE = "Content-Type";
    static final String PATH = "/special";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final int OK = 200;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Object> PARAMS = params();
    static final Map<String, String> BODIES = bodies();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    private final RestApiExecutor executor = new RestApiExecutor(new CommonConfig());
    private final QueryVisitorContext visitorContext = new QueryVisitorContext("userId1", "workspace1", 8080, null, null, null);

    @BeforeAll
    public static void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, new Response(OK, Map.of(CONTENT_TYPE, List.of("text/plain")), "ok".getBytes(StandardCharsets.UTF_8))));
    }

    @AfterAll
    public static void stopServer() {
        server.close();
    }

    @BoundarySites({
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#<file>#import#1",
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.buildBodyInserter#BodyInserters.fromValue#3"})
    @Test
    public void specialJsonBodyAsSent() {
        StringBuilder text = new StringBuilder();
        BODIES.forEach((name, body) -> text.append(name).append(SEPARATOR).append(send(body)).append(NEWLINE));
        System.out.println("[RestApiSpecialJsonBodyContractTest] " + server.requests().size() + " requests\n" + text);
        GOLDEN.assertText(REPORT, text.toString());
    }

    /** The content type and body the server received for one POST of {@code body}, or the error. */
    private String send(String body) {
        int before = server.requests().size();
        RestApiDatasourceConfig datasourceConfig = RestApiDatasourceConfig.builder().url(server.baseUrl()).build();
        Map<String, Object> queryConfig = Map.of("httpMethod", "POST", "path", PATH, "body", body,
                "headers", List.of(Map.of("key", CONTENT_TYPE, "value", SPECIAL_JSON)));
        try {
            executor.doExecuteQuery(null, executor.doBuildQueryExecutionContext(datasourceConfig, queryConfig, PARAMS, visitorContext)).block(TIMEOUT);
        } catch (RuntimeException e) {
            return "ERROR " + ConfigBinding.errorText(e);
        }
        Request request = server.requests().get(before);
        return request.header(CONTENT_TYPE) + SEPARATOR + request.bodyText();
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("int", 1);
        params.put("long", 3_000_000_001L);
        params.put("str", "žluť \"quoted\" \\ 🐎");
        Map<String, Object> kinds = new LinkedHashMap<>();
        kinds.put("bigInteger", new BigInteger("9223372036854775808"));
        kinds.put("bigDecimal", new BigDecimal("1.50"));
        kinds.put("double", 0.1);
        params.put("map", kinds);
        return params;
    }

    private static Map<String, String> bodies() {
        Map<String, String> bodies = new LinkedHashMap<>();
        bodies.put("representativeInput", RepresentativeInput.TEXT.trim());
        bodies.put("parameters", "{\"a\": {{int}}, \"b\": [{{long}}, 1.50, 1e3], \"c\": \"{{str}}\", \"d\": {{map}}}");
        bodies.put("text", "plain text");
        return bodies;
    }
}

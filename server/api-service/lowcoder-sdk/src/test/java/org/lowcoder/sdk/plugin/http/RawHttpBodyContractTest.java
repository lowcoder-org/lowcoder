package org.lowcoder.sdk.plugin.http;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Group {@code downstream-encode}, its {@code lowcoder-sdk} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5): for
 * a JSON content type, {@code RawHttpHandlerHelper.buildBodyInserter} reads the body text into a node
 * ({@code DataUtils.parseJsonBody}, {@code renderMustacheJson} without parameters) and hands that node to the client
 * codecs ({@code BodyInserters.fromValue}), which write it. Each body of {@link #BODIES} is POSTed with that inserter by
 * a client from {@link WebClientBuildHelper}, as the plugins build theirs, to a local server
 * ({@link RecordingHttpServer}); what the server received, the content type and the body as sent, is pinned by the §1.2
 * contract (number lexemes compared) in {@value #REPORT}.
 *
 * <p>Limits: no production class calls {@code RawHttpHandlerHelper} (it is SDK API for plugins), so the request is
 * sent by the test's own client; the body bytes are read as UTF-8 JSON.
 */
public class RawHttpBodyContractTest {

    static final String REPORT = "downstream-encode/RawHttpHandlerHelper.jsonBody.json";
    static final String PATH = "/raw";
    static final int OK = 200;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, String> BODIES = bodies();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    @BeforeAll
    public static void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, new Response(OK, Map.of(RecordingHttpServer.CONTENT_TYPE, List.of("text/plain")),
                "ok".getBytes(StandardCharsets.UTF_8))));
    }

    @AfterAll
    public static void stopServer() {
        server.close();
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/http/RawHttpHandlerHelper.java#RawHttpHandlerHelper.buildBodyInserter#BodyInserters.fromValue#3",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/restapi/DataUtils.java#DataUtils.parseJsonBody#renderMustacheJson#1"})
    @Test
    public void jsonBodyAsSent() {
        Map<String, Object> report = new LinkedHashMap<>();
        BODIES.forEach((name, body) -> report.put(name, send(body)));
        String actual = ConfigBinding.write(report);
        System.out.println("[RawHttpBodyContractTest] " + server.requests().size() + " requests\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** What the server received for one POST of {@code body}, or the error. */
    private static Object send(String body) {
        int before = server.requests().size();
        WebClient client = WebClientBuildHelper.builder().build();
        try {
            client.post().uri(server.baseUrl() + PATH).header(RecordingHttpServer.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(RawHttpHandlerHelper.buildBodyInserter(HttpMethod.POST, true, MediaType.APPLICATION_JSON_VALUE, body, List.<Property>of()))
                    .retrieve().toBodilessEntity().block(TIMEOUT);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        return server.requests().get(before).jsonBodyReport();
    }

    /**
     * The §4.6 representative input, number lexemes of every kind with text, a body with a parameter left unrendered,
     * and text that is not JSON.
     */
    private static Map<String, String> bodies() {
        Map<String, String> bodies = new LinkedHashMap<>();
        bodies.put("representativeInput", RepresentativeInput.TEXT.trim());
        bodies.put("literals", "{\"c\": [1, 1.50, 1e3, 1E+2, 2147483648, 3000000001, 0.1], "
                + "\"t\": \"it's \\\"q\\\" \\\\ žluť\"}");
        bodies.put("unrenderedParameter", "{\"a\": {{missing}}, \"b\": \"{{missing}}\", \"c\": [1.50, 1e3, 2147483648, 9223372036854775808]}");
        bodies.put("notJson", "plain text");
        return bodies;
    }
}

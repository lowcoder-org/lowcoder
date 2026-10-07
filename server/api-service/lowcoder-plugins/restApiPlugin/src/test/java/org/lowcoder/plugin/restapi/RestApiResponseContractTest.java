package org.lowcoder.plugin.restapi;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Groups {@code external-json} and {@code header-json} of {@code RestApiExecutor}, and its row of the §4.6 producer
 * table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.10, task T8.2). A real executor sends GET requests to a local server
 * ({@link RecordingHttpServer}) that answers each case of {@link #RESPONSES}; the result is what a query of the
 * REST API plugin returns:
 * <ul>
 *   <li>the response headers, written by the production mapper ({@code toJsonThrows}) and read back into a tree
 *       ({@code RestApiExecutor.java:445-460}), with a header of two values and headers whose bytes are not ASCII;</li>
 *   <li>the body by content type ({@code RestApiExecutor.java:412-443}): JSON, a {@code +json} type and
 *       {@code x-ndjson} read into a tree; an image base64-encoded into a {@code byte[]}, which the mapper
 *       base64-encodes again (O7); raw bytes; trimmed text; no body; and a JSON body that does not parse;</li>
 *   <li>{@code QueryExecutionResult.ofRestApiResult}, with the {@code HTTP...} code of a status that is not 2xx.</li>
 * </ul>
 * Each case's report ({@link QueryResults#report}: the Java classes of {@code data} and the text the production mapper
 * writes) is pinned in {@value #REPORT}, with the volatile {@code Date} header removed.
 *
 * <p>Limits: the JDK server sends header values as the ISO-8859-1 bytes of their characters; the UTF-8 case therefore
 * sends the UTF-8 bytes of {@value #UTF8_HEADER_TEXT} as such characters, which is what a server sending UTF-8 puts on
 * the wire.
 */
public class RestApiResponseContractTest {

    static final String REPORT = "external-json/RestApiExecutor.responses.json";
    static final String CONTENT_TYPE = "Content-Type";
    static final String MULTI_HEADER = "X-Multi";
    static final String LATIN1_HEADER = "X-Latin1";
    static final String UTF8_HEADER = "X-Utf8-Bytes";
    static final String UTF8_HEADER_TEXT = "žluť";
    static final byte[] IMAGE_BYTES = {(byte) 0x89, 'P', 'N', 'G', 0, 1, (byte) 0xFF};
    static final int OK = 200;
    static final int NO_CONTENT = 204;
    static final int UNPROCESSABLE = 422;
    static final int BAD_GATEWAY = 502;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Response> RESPONSES = responses();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    private final RestApiExecutor executor = new RestApiExecutor(new CommonConfig());
    private final QueryVisitorContext visitorContext = new QueryVisitorContext("userId1", "workspace1", 8080, null, null, null);

    @BeforeAll
    public static void startServer() {
        server = RecordingHttpServer.start(RESPONSES);
    }

    @AfterAll
    public static void stopServer() {
        server.close();
    }

    @BoundarySites({
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.parseResponseDataInfo#readTree#1",
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.parseExecuteResultHeaders#toJsonThrows#1",
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.parseExecuteResultHeaders#readTree#1"})
    @Test
    public void responsesAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        RESPONSES.keySet().forEach(path -> report.put(path, report(execute(path))));
        String actual = ConfigBinding.write(report);
        System.out.println("[RestApiResponseContractTest] " + server.requests().size() + " requests to " + server.baseUrl() + "\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private Object report(Object outcome) {
        return outcome instanceof QueryExecutionResult result
                ? QueryResults.report(result, Set.of(QueryResults.DATE_HEADER)) : outcome;
    }

    /** The result of a GET of {@code path}, or the error text when the query fails. */
    private Object execute(String path) {
        RestApiDatasourceConfig datasourceConfig = RestApiDatasourceConfig.builder().url(server.baseUrl()).build();
        Map<String, Object> queryConfig = Map.of("httpMethod", "GET", "path", path);
        try {
            QueryExecutionContext context = executor.doBuildQueryExecutionContext(datasourceConfig, queryConfig, Map.of(), visitorContext);
            return executor.doExecuteQuery(null, context).block(TIMEOUT);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    private static Map<String, Response> responses() {
        String latin1OfUtf8 = new String(UTF8_HEADER_TEXT.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);
        Map<String, List<String>> jsonHeaders = new LinkedHashMap<>();
        jsonHeaders.put(CONTENT_TYPE, List.of("application/json"));
        jsonHeaders.put(MULTI_HEADER, List.of("first", "second, with comma"));
        jsonHeaders.put(LATIN1_HEADER, List.of("café"));
        jsonHeaders.put(UTF8_HEADER, List.of(latin1OfUtf8));
        Map<String, Response> responses = new LinkedHashMap<>();
        responses.put("/json", new Response(OK, jsonHeaders, utf8(RepresentativeInput.TEXT)));
        responses.put("/problem-json", new Response(UNPROCESSABLE, Map.of(CONTENT_TYPE, List.of("application/problem+json")),
                utf8("{\"title\":\"Unprocessable\",\"status\":422,\"errors\":[{\"field\":\"name\",\"limit\":10.50}]}")));
        responses.put("/ndjson", new Response(OK, Map.of(CONTENT_TYPE, List.of("application/x-ndjson")),
                utf8("{\"line\":1}\n{\"line\":2}\n")));
        responses.put("/image", new Response(OK, Map.of(CONTENT_TYPE, List.of("image/png")), IMAGE_BYTES));
        responses.put("/binary", new Response(OK, Map.of(CONTENT_TYPE, List.of("application/octet-stream")), IMAGE_BYTES));
        responses.put("/text", new Response(OK, Map.of(CONTENT_TYPE, List.of("text/plain;charset=UTF-8")), utf8("  plain žluť text 1.50  ")));
        responses.put("/no-content", new Response(NO_CONTENT, Map.of(), null));
        responses.put("/invalid-json", new Response(BAD_GATEWAY, Map.of(CONTENT_TYPE, List.of("application/json")), utf8("{\"a\": 1,")));
        return responses;
    }

    private static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }
}

package org.lowcoder.plugin.graphql;

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
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Groups {@code external-json} and {@code header-json} of {@code GraphQLExecutor}, and its row of the §4.6 producer
 * table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.10, task T8.2). A real executor POSTs a GraphQL query to a local
 * server ({@link RecordingHttpServer}) that answers each case of {@link #RESPONSES}; the result is what a query of the
 * GraphQL plugin returns:
 * <ul>
 *   <li>the response headers, written by the production mapper ({@code toJsonThrows}) and read back into a tree
 *       ({@code GraphQLExecutor.parseExecuteResultHeaders}), with a header of two values and headers whose bytes are
 *       not ASCII, plus the {@code X-LOWCODER-RESPONSE-DATA-TYPE} array the executor adds;</li>
 *   <li>the body by content type ({@code GraphQLExecutor.parseResponseDataInfo}): only a type that
 *       {@code includes(application/json)} is read into a tree, so {@code +json} and {@code x-ndjson} bodies are text
 *       here, unlike the REST API plugin; an image and raw bytes base64-encoded into a {@code byte[]}, which the
 *       mapper base64-encodes again (O7); trimmed text; no body; and a JSON body that does not parse;</li>
 *   <li>{@code QueryExecutionResult.ofRestApiResult}, with the {@code HTTP...} code of a status that is not 2xx.</li>
 * </ul>
 * Each case's report ({@link QueryResults#report}) is pinned in {@value #REPORT}, with the volatile {@code Date} header
 * removed.
 *
 * <p>Limits: as for {@code RestApiResponseContractTest}, header values go on the wire as the ISO-8859-1 bytes of their
 * characters; the request body the executor builds is not pinned here.
 */
public class GraphQLResponseContractTest {

    static final String REPORT = "external-json/GraphQLExecutor.responses.json";
    static final String CONTENT_TYPE = "Content-Type";
    static final String MULTI_HEADER = "X-Multi";
    static final String LATIN1_HEADER = "X-Latin1";
    static final String UTF8_HEADER = "X-Utf8-Bytes";
    static final String UTF8_HEADER_TEXT = "žluť";
    static final String QUERY = "query { items { id } }";
    /** The query's variables as the editor sends them; {@code buildQueryExecutionContext} fails without the list. */
    static final List<Map<String, String>> VARIABLES = List.of(Map.of("key", "limit", "value", "10"));
    static final byte[] IMAGE_BYTES = {(byte) 0x89, 'P', 'N', 'G', 0, 1, (byte) 0xFF};
    static final int OK = 200;
    static final int NO_CONTENT = 204;
    static final int UNPROCESSABLE = 422;
    static final int BAD_GATEWAY = 502;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Response> RESPONSES = responses();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    private final GraphQLExecutor executor = new GraphQLExecutor(new CommonConfig());
    private final QueryVisitorContext visitorContext = new QueryVisitorContext("userId1", "workspace1", 8080, null, null, null);

    @BeforeClass
    public static void startServer() {
        server = RecordingHttpServer.start(RESPONSES);
    }

    @AfterClass
    public static void stopServer() {
        server.close();
    }

    @BoundarySites({
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/GraphQLExecutor.java#GraphQLExecutor.parseResponseDataInfo#readTree#1",
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/GraphQLExecutor.java#GraphQLExecutor.parseExecuteResultHeaders#toJsonThrows#1",
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/GraphQLExecutor.java#GraphQLExecutor.parseExecuteResultHeaders#readTree#1"})
    @Test
    public void responsesAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        RESPONSES.keySet().forEach(path -> report.put(path, report(execute(path))));
        String actual = ConfigBinding.write(report);
        System.out.println("[GraphQLResponseContractTest] " + server.requests().size() + " requests to " + server.baseUrl() + "\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private Object report(Object outcome) {
        return outcome instanceof QueryExecutionResult result
                ? QueryResults.report(result, Set.of(QueryResults.DATE_HEADER)) : outcome;
    }

    /** The result of a POST of {@link #QUERY} with {@link #VARIABLES} to {@code path}, or the error text when the query fails. */
    private Object execute(String path) {
        GraphQLDatasourceConfig datasourceConfig = GraphQLDatasourceConfig.builder().url(server.baseUrl()).build();
        Map<String, Object> queryConfig = Map.of("path", path, "body", QUERY, "variables", VARIABLES);
        try {
            return executor.executeQuery(null, executor.buildQueryExecutionContext(datasourceConfig, queryConfig, Map.of(), visitorContext))
                    .block(TIMEOUT);
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
        responses.put("/json", new Response(OK, jsonHeaders, utf8("{\"data\":" + RepresentativeInput.TEXT + "}")));
        responses.put("/json-charset", new Response(OK, Map.of(CONTENT_TYPE, List.of("application/json;charset=UTF-8")),
                utf8("{\"data\":null,\"errors\":[{\"message\":\"žluť\",\"locations\":[{\"line\":1,\"column\":9}],\"path\":[\"items\",0]}]}")));
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

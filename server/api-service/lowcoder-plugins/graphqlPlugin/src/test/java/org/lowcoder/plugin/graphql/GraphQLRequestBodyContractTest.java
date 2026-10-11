package org.lowcoder.plugin.graphql;

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
import org.lowcoder.sdk.contract.RenderValues;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Group {@code downstream-encode}, its {@code graphqlPlugin} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5):
 * each query variable is rendered into a node with the request parameters
 * ({@code GraphQLExecutor.buildQueryExecutionContext}, {@code renderMustacheJson}); the query and the variables become a
 * {@code Map} ({@code GraphQLBodyUtils.convertToGraphQLBody}) that the client codecs write
 * ({@code buildBodyInserter}, {@code BodyInserters.fromValue}). A real executor POSTs {@value #QUERY} with the
 * variables of {@link #VARIABLES} and the parameters {@link RenderValues} to a local server
 * ({@link RecordingHttpServer}); what the server received, the content type and the body as sent, is pinned by the §1.2
 * contract (number lexemes compared) in {@value #REPORT}, with a query without variables for comparison.
 *
 * <p>Limits: the body bytes are read as UTF-8 JSON; the body's member order is the {@code HashMap}'s, which the §1.2
 * contract ignores.
 */
public class GraphQLRequestBodyContractTest {

    static final String REPORT = "downstream-encode/GraphQLExecutor.requestBody.json";
    static final String QUERY = "query Items($int: Int) { items(limit: $int) { id } }";
    static final String PATH = "/graphql";
    static final int OK = 200;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final List<Map<String, String>> VARIABLES = variables();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static RecordingHttpServer server;

    private final GraphQLExecutor executor = new GraphQLExecutor(new CommonConfig());
    private final QueryVisitorContext visitorContext = new QueryVisitorContext("userId1", "workspace1", 8080, null, null, null);

    @BeforeAll
    public static void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, new Response(OK, Map.of(RecordingHttpServer.CONTENT_TYPE, List.of("application/json")),
                "{\"data\":null}".getBytes(StandardCharsets.UTF_8))));
    }

    @AfterAll
    public static void stopServer() {
        server.close();
    }

    @BoundarySites({
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/GraphQLExecutor.java#GraphQLExecutor.buildQueryExecutionContext#renderMustacheJson#1",
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/GraphQLExecutor.java#GraphQLExecutor.buildBodyInserter#BodyInserters.fromValue#2"})
    @Test
    public void requestBodyAsSent() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("variables", send(VARIABLES));
        report.put("noVariables", send(List.of()));
        String actual = ConfigBinding.write(report);
        System.out.println("[GraphQLRequestBodyContractTest] " + server.requests().size() + " requests\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** What the server received for one POST of {@link #QUERY} with {@code variables}, or the error. */
    private Object send(List<Map<String, String>> variables) {
        int before = server.requests().size();
        GraphQLDatasourceConfig datasourceConfig = GraphQLDatasourceConfig.builder().url(server.baseUrl()).build();
        Map<String, Object> queryConfig = Map.of("path", PATH, "body", QUERY, "variables", variables);
        try {
            executor.executeQuery(null, executor.buildQueryExecutionContext(datasourceConfig, queryConfig, RenderValues.values(), visitorContext))
                    .block(TIMEOUT);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        return server.requests().get(before).jsonBodyReport();
    }

    /** One variable per parameter, one with text around parameters, and one literal with number lexemes. */
    private static List<Map<String, String>> variables() {
        List<Map<String, String>> variables = new ArrayList<>();
        RenderValues.values().keySet().forEach(name -> variables.add(Map.of("key", name, "value", "{{" + name + "}}")));
        variables.add(Map.of("key", "inText", "value", "\"{{string}} {{dollar}}\""));
        variables.add(Map.of("key", "literal", "value", "[1.50, 1e3, 2147483648]"));
        return variables;
    }
}

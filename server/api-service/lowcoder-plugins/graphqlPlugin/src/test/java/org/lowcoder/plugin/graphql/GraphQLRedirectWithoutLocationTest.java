package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * DEFECT pinned for the GraphQL executor (plan section 9 row on a 3xx without Location, "restApi: a 3xx without
 * Location..." with its graphql clause; D-6, fix deferred): an answer with a 3xx status and no {@code Location} header,
 * for example 304 Not Modified, is treated as a redirect and {@code response.headers().header("Location").get(0)}
 * (GraphQLExecutor.java:344) reads an empty list. Unlike the REST executor, which throws a PluginException, the GraphQL
 * executor's error handler (:282-292) turns the index error into a failed {@code QueryExecutionResult} with query code
 * {@code GRAPHQL_EXECUTION_ERROR} and no data: the caller gets no exception and no status or header of the answer. One
 * request is sent. The obvious fix is to treat a 3xx without a Location as an ordinary response, which turns this test
 * red.
 */
class GraphQLRedirectWithoutLocationTest {

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @ParameterizedTest(name = "status {0}")
    @ValueSource(ints = {301, 302, 304})
    void aRedirectStatusWithoutALocationGivesAFailedResultWithoutDataOrStatus(int status) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/moved", new Response(status, Map.of(), null)))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(server.baseUrl() + "/moved").build();

            QueryExecutionResult result = support.run(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLRedirectWithoutLocationTest] " + status + " without Location -> success=" + result.isSuccess()
                    + " code=" + result.getQueryCode() + " data=" + result.getData());
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getQueryCode()).isEqualTo("GRAPHQL_EXECUTION_ERROR");
            assertThat(result.getData()).isNull();
            assertThat(server.requests()).hasSize(1);
        }
    }
}

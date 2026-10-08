package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * The last arm of the executor's error handler: an error that is neither a timeout nor a PluginException becomes a failed
 * result with query code {@code GRAPHQL_EXECUTION_ERROR} (GraphQLExecutor's {@code onErrorResume}). Since BF-113 a 3xx
 * without a Location no longer reaches it; an answer whose {@code Content-Type} is not a media type does: reading it
 * fails with Spring's InvalidMediaTypeException. One request is sent.
 * <p>
 * Limits: the result's message is not asserted, as the key {@code GRAPHQL_EXECUTION_ERROR} is in no locale bundle
 * (BF-115).
 */
class GraphQLUnreadableAnswerTest {

    private static final String PATH = "/graphql";
    private static final String NOT_A_MEDIA_TYPE = "not a media type";
    private static final String BODY = "{}";
    private static final int OK = 200;

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void anAnswerWithAContentTypeThatIsNotAMediaTypeIsAGraphQLExecutionErrorResult() {
        Response answer = new Response(OK, Map.of(RecordingHttpServer.CONTENT_TYPE, List.of(NOT_A_MEDIA_TYPE)), BODY.getBytes(StandardCharsets.UTF_8));
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, answer))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(server.baseUrl() + PATH).build();

            QueryExecutionResult result = support.run(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLUnreadableAnswerTest] Content-Type '" + NOT_A_MEDIA_TYPE + "' -> success=" + result.isSuccess()
                    + " code=" + result.getQueryCode() + " data=" + result.getData());
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getQueryCode()).isEqualTo(GraphQLError.GRAPHQL_EXECUTION_ERROR.name());
            assertThat(result.getData()).isNull();
            assertThat(server.requests()).hasSize(1);
        }
    }
}

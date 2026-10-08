package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * NEW-19 (GitHub #1929) through the GraphQL executor, which builds its url with {@code RestApiUriBuilder.buildUri} too: a
 * query string with spaces typed into the path field reaches the local server (port 0, loopback) with {@code %20}; before,
 * it failed with INVALID_REQUEST_URL and no request was sent.
 */
class GraphQLUrlSpaceEncodingTest {

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    /** Catches: the typed query string refused before any request is sent. */
    @Test
    void aQueryStringWithSpacesTypedIntoThePathFieldArrivesPercentEncodedNEW19() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/graphql", GraphQLCallSupport.json(200, "{\"data\":{}}")))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(server.baseUrl() + "/graphql").build();

            QueryExecutionResult result = support.run(datasource, GraphQLCallSupport.query(Map.of("path", "?name=a b")), GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLUrlSpaceEncodingTest] typed '?name=a b' -> " + result.getQueryCode() + ", requests "
                    + server.requests().stream().map(RecordingHttpServer.Request::pathAndQuery).toList());
            assertThat(server.requests()).hasSize(1);
            assertThat(server.requests().get(0).pathAndQuery()).isEqualTo("/graphql?name=a%20b");
        }
    }
}

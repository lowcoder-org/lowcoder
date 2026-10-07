package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * BF-059 for the second production caller (formerly pinned as the section 9 row "REST url: // inside a query value collapsed
 * to /"; the builder is tested in the sdk by RestApiUriBuilderCollapseTest). {@code GraphQLExecutor.java:246} passes the url
 * of the query context (datasource url plus path field) to {@code RestApiUriBuilder.buildUri}, which now collapses runs of
 * slashes only before the query, so a double slash typed into the query string of the path field reaches the local server
 * (port 0, loopback) as typed.
 */
class GraphQLUrlSlashCollapseTest {

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void aDoubleSlashTypedIntoTheQueryStringOfThePathFieldArrivesAsTypedBF059() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/graphql", GraphQLCallSupport.json(200, "{\"data\":{}}")))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(server.baseUrl() + "/graphql").build();

            support.run(datasource, GraphQLCallSupport.query(Map.of("path", "?u=a//b")), GraphQLCallSupport.visitor(null, null));

            String line = server.requests().get(0).pathAndQuery();
            System.out.println("[GraphQLUrlSlashCollapseTest] typed '?u=a//b' -> request line '" + line + "'");
            assertThat(server.requests()).hasSize(1);
            assertThat(line).isEqualTo("/graphql?u=a//b");
        }
    }
}

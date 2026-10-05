package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * DEFECT pinned for the second production caller (plan section 9 row "REST url: // inside a query value collapsed to /";
 * the builder is pinned in the sdk by RestApiUriBuilderCollapseTest; D-6, fix deferred). {@code GraphQLExecutor.java:246} passes
 * the url of the query context (datasource url plus path field) to {@code RestApiUriBuilder.buildUri}, whose
 * {@code replaceAll} (RestApiUriBuilder.java:41) turns a double slash typed into the query string of the path field into one
 * slash. The request line the local server (port 0, loopback) receives is asserted. A fix that collapses only the part before
 * the first {@code ?} turns it red.
 */
class GraphQLUrlSlashCollapseTest {

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void aDoubleSlashTypedIntoTheQueryStringOfThePathFieldArrivesAsOneSlashPinsTheSection9Row() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/graphql", GraphQLCallSupport.json(200, "{\"data\":{}}")))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(server.baseUrl() + "/graphql").build();

            support.run(datasource, GraphQLCallSupport.query(Map.of("path", "?u=a//b")), GraphQLCallSupport.visitor(null, null));

            String line = server.requests().get(0).pathAndQuery();
            System.out.println("[GraphQLUrlSlashCollapseTest] typed '?u=a//b' -> request line '" + line + "'");
            assertThat(server.requests()).hasSize(1);
            assertThat(line).isEqualTo("/graphql?u=a/b");
        }
    }
}

package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * Request body types of {@link GraphQLExecutor}: form and multipart bodies are built from the body parameters, and
 * {@code application/graphql} sends the query text as given. The default JSON body (query and variables) is pinned by
 * GraphQLRequestBodyContractTest and not repeated.
 */
class GraphQLBodyTypesTest {

    private static final String PATH = "/graphql";
    private static final String CONTENT_TYPE = "Content-Type";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    private RecordingHttpServer.Request send(String contentType, Map<String, Object> query) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, GraphQLCallSupport.json(200, "{}")))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(server.baseUrl() + PATH)
                    .headers(List.of(new Property(CONTENT_TYPE, contentType))).build();
            support.run(datasource, query, GraphQLCallSupport.visitor(null, null));
            assertThat(server.requests()).hasSize(1);
            return server.requests().get(0);
        }
    }

    @Test
    void aFormBodyIsEncodedFromTheBodyParameters() {
        RecordingHttpServer.Request request = send("application/x-www-form-urlencoded",
                GraphQLCallSupport.query(Map.of("bodyFormData", List.of(new Property("a", "x y&z"), new Property("b", "2")))));

        System.out.println("[GraphQLBodyTypesTest] form body " + request.bodyText());
        assertThat(String.join(",", request.header(CONTENT_TYPE))).startsWith("application/x-www-form-urlencoded");
        assertThat(request.bodyText().split("&")).containsExactlyInAnyOrder("a=x+y%26z", "b=2");
    }

    @Test
    void aMultipartBodyReachesTheServerWithItsPartsAndAContentLength() {
        RecordingHttpServer.Request request = send("multipart/form-data",
                GraphQLCallSupport.query(Map.of("bodyFormData", List.of(new Property("a", "1"), new Property("b", "two")))));

        System.out.println("[GraphQLBodyTypesTest] multipart headers " + request.headers().keySet() + " body length " + request.body().length);
        assertThat(String.join(",", request.header(CONTENT_TYPE))).startsWith("multipart/form-data;").contains("boundary=");
        assertThat(request.bodyText()).contains("name=\"a\"", "name=\"b\"", "two");
        assertThat(request.header("Content-Length")).containsExactly(String.valueOf(request.body().length));
        assertThat(request.header("Transfer-Encoding")).isEmpty();
    }

    @Test
    void applicationGraphqlSendsTheQueryTextAsGiven() {
        RecordingHttpServer.Request request = send("application/graphql", Map.of("body", GraphQLCallSupport.QUERY, "variables", List.of()));

        assertThat(request.header(CONTENT_TYPE)).containsExactly("application/graphql");
        assertThat(new String(request.body(), StandardCharsets.UTF_8)).isEqualTo(GraphQLCallSupport.QUERY);
    }

    @Test
    void theJsonBodyWrapsTheQueryAndOmitsAnEmptyVariablesObject() {
        RecordingHttpServer.Request request = send("application/json", GraphQLCallSupport.query());

        assertThat(String.join(",", request.header(CONTENT_TYPE))).startsWith("application/json");
        assertThat(request.bodyText()).isEqualTo("{\"query\":\"" + GraphQLCallSupport.QUERY + "\"}");
    }
}

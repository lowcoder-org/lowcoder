package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.graphql.model.GraphQLQueryExecutionContext;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * Rendering, validation and merging in {@link GraphQLExecutor#buildQueryExecutionContext}, and the one-line delegations of
 * {@link GraphQLConnector}. No request is sent: the context is inspected.
 */
class GraphQLRenderingTest {

    private static final String BASE = "http://example.invalid";
    private static final String CONTENT_TYPE = "Content-Type";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    private GraphQLQueryExecutionContext build(GraphQLDatasourceConfig datasource, Map<String, Object> query, Map<String, Object> params) {
        return support.buildContext(datasource, query, params, GraphQLCallSupport.visitor(null, null));
    }

    @Test
    void parametersAreRenderedInHeaderValuesPathAndVariablesAndBlankVariableRowsAreSkipped() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(BASE).build();
        Map<String, Object> query = GraphQLCallSupport.query(Map.of(
                "path", "/{{version}}/graphql",
                "headers", List.of(new Property("X-Name", "{{name}}")),
                "variables", List.of(new Property("who", "\"{{name}}\""), new Property("", ""), new Property("n", "{{count}}"))));

        GraphQLQueryExecutionContext context = build(datasource, query, Map.of("version", "v2", "name", "Luke", "count", 3));

        System.out.println("[GraphQLRenderingTest] url " + context.getUrl() + " headers " + context.getHeaders() + " variables " + context.getVariablesParams());
        assertThat(context.getUrl()).isEqualTo(BASE + "/v2/graphql");
        assertThat(context.getHeaders()).containsEntry("X-Name", "Luke");
        assertThat(context.getVariablesParams().toString()).isEqualTo("{\"who\":\"Luke\",\"n\":3}");
    }

    @Test
    void aQueryHeaderOverridesADatasourceHeaderBlankHeadersAreDroppedAndJsonIsTheDefaultContentType() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(BASE)
                .headers(List.of(new Property("X-A", "1"), new Property("X-Ds", "kept"))).build();
        Map<String, Object> query = GraphQLCallSupport.query(Map.of("headers",
                List.of(new Property("X-A", "2"), new Property("X-Blank", " "), new Property(" ", "v"))));

        GraphQLQueryExecutionContext context = build(datasource, query, Map.of());

        System.out.println("[GraphQLRenderingTest] headers " + context.getHeaders());
        assertThat(context.getHeaders()).containsEntry("X-A", "2").containsEntry("X-Ds", "kept")
                .doesNotContainKey("X-Blank").containsEntry(CONTENT_TYPE, "application/json");
        assertThat(context.getContentType()).isEqualTo("application/json");
    }

    @Test
    void aGivenContentTypeIsKeptAndLowerCased() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(BASE)
                .headers(List.of(new Property(CONTENT_TYPE, "Application/GraphQL"))).build();

        GraphQLQueryExecutionContext context = build(datasource, GraphQLCallSupport.query(), Map.of());

        assertThat(context.getContentType()).isEqualTo("application/graphql");
        assertThat(context.getHeaders()).containsEntry(CONTENT_TYPE, "Application/GraphQL");
    }

    @Test
    void queryParamsOverrideDatasourceParams() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(BASE)
                .params(List.of(new Property("p", "1"), new Property("q", "kept"))).build();

        GraphQLQueryExecutionContext context = build(datasource,
                GraphQLCallSupport.query(Map.of("params", List.of(new Property("p", "2")))), Map.of());

        assertThat(context.getUrlParams()).containsEntry("p", "2").containsEntry("q", "kept");
    }

    @Test
    void anEmptyUrlAnUnparsableUrlAndAnInvalidContentTypeAreRejected() {
        PluginException empty = assertThrows(PluginException.class,
                () -> build(GraphQLDatasourceConfig.builder().url("").build(), GraphQLCallSupport.query(), Map.of()));
        PluginException unparsable = assertThrows(PluginException.class,
                () -> build(GraphQLDatasourceConfig.builder().url("ht tp://x y").build(), GraphQLCallSupport.query(), Map.of()));
        PluginException contentType = assertThrows(PluginException.class, () -> build(GraphQLDatasourceConfig.builder().url(BASE)
                .headers(List.of(new Property(CONTENT_TYPE, "not a type"))).build(), GraphQLCallSupport.query(), Map.of()));

        System.out.println("[GraphQLRenderingTest] " + empty.getMessage() + " | " + unparsable.getMessage() + " | " + contentType.getMessage());
        assertThat(empty).hasMessageContaining("request URL is empty");
        assertThat(unparsable).hasMessageContaining("Invalid request URL").hasMessageContaining("ht tp://x y");
        assertThat(contentType).hasMessageContaining("Invalid Content-Type").hasMessageContaining("not a type");
    }

    @Test
    void theConnectorResolvesTheConfigAndAnswersTheTrivialCalls() {
        GraphQLConnector connector = new GraphQLConnector();

        GraphQLDatasourceConfig config = connector.resolveConfig(Map.of("url", BASE));

        assertThat(config.getUrl()).isEqualTo(BASE);
        assertThat(connector.validateConfig(config)).isEqualTo(Set.of());
        assertThat(connector.testConnection(config).block(GraphQLCallSupport.TIMEOUT).isSuccess()).isTrue();
        Object connection = connector.createConnection(config).block(GraphQLCallSupport.TIMEOUT);
        assertThat(connection).isNotNull();
        assertThat(connector.destroyConnection(connection).blockOptional(GraphQLCallSupport.TIMEOUT)).isEmpty();
    }
}

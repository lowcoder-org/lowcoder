package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * A request that fails before any answer arrives (the connection is refused) is reported as a {@link PluginException}
 * with the message key {@code QUERY_EXECUTION_ERROR} and the cause's text, which {@code executeQuery} rethrows as it is.
 * An error after an answer (an unreadable body) is not wrapped: {@code GraphQLUnreadableAnswerTest} pins that case.
 */
class GraphQLConnectionFailureTest {

    private static final String PATH = "/graphql";
    private static final String QUERY_EXECUTION_ERROR_KEY = "QUERY_EXECUTION_ERROR";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void aRefusedConnectionIsAQueryExecutionPluginException() {
        String closedUrl;
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of())) {
            closedUrl = server.baseUrl() + PATH;
        }
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(closedUrl).build();

        Throwable failure = support.failureOf(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

        System.out.println("[GraphQLConnectionFailureTest] " + closedUrl + " -> " + failure);
        assertThat(failure).as("the error of a refused connection to " + closedUrl).isInstanceOf(PluginException.class);
        PluginException pluginException = (PluginException) failure;
        assertThat(pluginException.getMessageKey()).as("message key of the wrapped connection error").isEqualTo(QUERY_EXECUTION_ERROR_KEY);
        assertThat(pluginException.getMessage()).as("the cause's text is in the message").isNotBlank();
    }
}

package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * BF-059 through the REST executor (formerly pinned as the section 9 row "REST url: // inside a query value collapsed to /";
 * the builder is tested in the sdk by RestApiUriBuilderCollapseTest). {@code RestApiExecutor.java:177} hands the datasource
 * url and the path field to {@code RestApiUriBuilder.buildUri}, which now collapses runs of slashes only before the query.
 * The request line the local server (port 0, loopback) receives keeps a double slash typed into the query of the path field,
 * or put there by a {@code {{ }}} expression, and a value in the Parameters table arrives intact as before.
 */
class RestApiUrlSlashCollapseTest {

    private static final String PATH = "/p";
    private final RestApiExecutor executor = executor();

    private static RestApiExecutor executor() {
        CommonConfig config = new CommonConfig();
        config.setCookieName(RestApiCallSupport.SESSION_COOKIE);
        return new RestApiExecutor(config);
    }

    private String requestLineFor(Map<String, Object> query, Map<String, Object> requestParams) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl()).build();

            executor.doExecuteQuery(null, executor.doBuildQueryExecutionContext(datasource, query, requestParams, RestApiCallSupport.visitor(null, null)))
                    .block(RestApiCallSupport.TIMEOUT);

            assertThat(server.requests()).hasSize(1);
            return server.requests().get(0).pathAndQuery();
        }
    }

    @Test
    void aDoubleSlashTypedIntoTheQueryStringOfThePathFieldArrivesAsTypedBF059() {
        String line = requestLineFor(Map.of("httpMethod", "GET", "path", "/p?u=a//b"), Map.of());

        System.out.println("[RestApiUrlSlashCollapseTest] typed '/p?u=a//b' -> request line '" + line + "'");
        assertThat(line).isEqualTo("/p?u=a//b");
    }

    @Test
    void aValueSubstitutedByAMustacheExpressionIntoThePathFieldArrivesAsItIsBF059() {
        String line = requestLineFor(Map.of("httpMethod", "GET", "path", "/p?u={{v}}"), Map.of("v", "a//b"));

        System.out.println("[RestApiUrlSlashCollapseTest] '/p?u={{v}}' with v='a//b' -> request line '" + line + "'");
        assertThat(line).isEqualTo("/p?u=a//b");
    }

    @Test
    void aParametersTableValueIsAddedAfterTheCollapseAndArrivesIntact() {
        String line = requestLineFor(Map.of("httpMethod", "GET", "path", "/p", "params", List.of(new Property("w", "a//b"))), Map.of());

        System.out.println("[RestApiUrlSlashCollapseTest] Parameters table w='a//b' -> request line '" + line + "'");
        assertThat(line).isEqualTo("/p?w=a%2F%2Fb");
    }
}

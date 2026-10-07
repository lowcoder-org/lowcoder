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
 * DEFECT pinned, through the REST executor (plan section 9 row "REST url: // inside a query value collapsed to /"; the
 * builder is pinned in the sdk by RestApiUriBuilderCollapseTest; D-6, fix deferred). {@code RestApiExecutor.java:177} hands the
 * datasource url and the path field to {@code RestApiUriBuilder.buildUri}, whose {@code replaceAll} (RestApiUriBuilder.java:41)
 * collapses every run of slashes except after {@code http:} / {@code https:}. The request line the local server (port 0,
 * loopback) receives therefore differs from the text typed into the path field, and from the value a {@code {{ }}} expression
 * puts there, while a value in the Parameters table arrives intact (it is added after the collapse). A fix that collapses only
 * the part before the first {@code ?} turns the first two assertions red.
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
    void aDoubleSlashTypedIntoTheQueryStringOfThePathFieldArrivesAsOneSlashPinsTheSection9Row() {
        String line = requestLineFor(Map.of("httpMethod", "GET", "path", "/p?u=a//b"), Map.of());

        System.out.println("[RestApiUrlSlashCollapseTest] typed '/p?u=a//b' -> request line '" + line + "'");
        assertThat(line).isEqualTo("/p?u=a/b");
    }

    @Test
    void aValueSubstitutedByAMustacheExpressionIntoThePathFieldArrivesCollapsedPinsTheSection9Row() {
        String line = requestLineFor(Map.of("httpMethod", "GET", "path", "/p?u={{v}}"), Map.of("v", "a//b"));

        System.out.println("[RestApiUrlSlashCollapseTest] '/p?u={{v}}' with v='a//b' -> request line '" + line + "'");
        assertThat(line).isEqualTo("/p?u=a/b");
    }

    @Test
    void aParametersTableValueIsAddedAfterTheCollapseAndArrivesIntact() {
        String line = requestLineFor(Map.of("httpMethod", "GET", "path", "/p", "params", List.of(new Property("w", "a//b"))), Map.of());

        System.out.println("[RestApiUrlSlashCollapseTest] Parameters table w='a//b' -> request line '" + line + "'");
        assertThat(line).isEqualTo("/p?w=a%2F%2Fb");
    }
}

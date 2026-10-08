package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * NEW-19 (GitHub #1929) through the REST executor: {@code RestApiExecutor} hands the datasource url and the path field to
 * {@code RestApiUriBuilder.buildUri}, which now percent-encodes the characters a URI cannot hold. The query of the issue,
 * typed into the path field or put there by a {@code {{ }}} expression, reaches the local server (port 0, loopback) with
 * {@code %20} for its spaces; before, the query failed with INVALID_REQUEST_URL and no request was sent.
 */
class RestApiUrlSpaceEncodingTest {

    private static final String PATH = "/devices";
    private static final String ISSUE_QUERY = "$filter=displayName eq 'computername'";
    private static final String SENT_QUERY = "$filter=displayName%20eq%20'computername'";
    private final RestApiExecutor executor = executor();

    private static RestApiExecutor executor() {
        CommonConfig config = new CommonConfig();
        config.setCookieName(RestApiCallSupport.SESSION_COOKIE);
        return new RestApiExecutor(config);
    }

    private String requestLineFor(String path, Map<String, Object> requestParams) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl()).build();

            QueryExecutionResult result = executor.doExecuteQuery(null, executor.doBuildQueryExecutionContext(datasource,
                    Map.of("httpMethod", "GET", "path", path), requestParams, RestApiCallSupport.visitor(null, null))).block(RestApiCallSupport.TIMEOUT);

            System.out.println("[RestApiUrlSpaceEncodingTest] path '" + path + "' " + requestParams + " -> " + result.getQueryCode() + ", requests "
                    + server.requests().stream().map(RecordingHttpServer.Request::pathAndQuery).toList());
            assertThat(server.requests()).hasSize(1);
            return server.requests().get(0).pathAndQuery();
        }
    }

    /** Catches: the typed query refused before any request is sent. */
    @Test
    void theIssuesQueryTypedWithSpacesArrivesPercentEncodedNEW19() {
        assertThat(requestLineFor(PATH + "?" + ISSUE_QUERY, Map.of())).isEqualTo(PATH + "?" + SENT_QUERY);
    }

    /** Catches: a value with spaces from a {@code {{ }}} expression refused. */
    @Test
    void aValueWithSpacesFromAMustacheExpressionArrivesPercentEncodedNEW19() {
        assertThat(requestLineFor(PATH + "?$filter={{f}}", Map.of("f", "displayName eq 'computername'"))).isEqualTo(PATH + "?" + SENT_QUERY);
    }
}

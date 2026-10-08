package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import reactor.core.publisher.Mono;

/**
 * BF-115 (fixed; was pinned as plan section 9 row "GRAPHQL_EXECUTION_ERROR in no locale bundle", D-6): every GraphQL
 * execution error is raised with the message key {@code GRAPHQL_EXECUTION_ERROR} (GraphQLExecutor.java, the constant
 * {@code DEFAULT_GRAPHQL_ERROR_CODE} and the {@code PluginException}s built with it), which is now in
 * {@code locale_en.properties}, {@code locale_de.properties} and {@code locale_zh.properties} with a text that names the
 * cause, as the REST executor's {@code REST_API_EXECUTION_ERROR} does. It was in none, so the text fell back to the generic
 * {@code INTERNAL_SERVER_ERROR} message and the cause was lost.
 *
 * <p>The path used is the OAuth "inherit from login" step with an empty token Mono, which reads
 * "$ACCESS_TOKEN parameter missing".
 */
class GraphQLMissingLocaleKeyTest {

    private static final String EXPECTED_TEXT = "GraphQL execution error: $ACCESS_TOKEN parameter missing..";
    private static final String GENERIC_TEXT = "Oops! Service is busy, please try again later.";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void anOauthErrorIsReportedWithItsCauseBF115() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url("http://example.invalid/graphql")
                .authConfig(OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build()).build();

        Throwable failure = support.failureOf(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, Mono.empty()));

        System.out.println("[GraphQLMissingLocaleKeyTest] message: " + (failure == null ? null : failure.getMessage()));
        assertThat(failure).isInstanceOf(PluginException.class);
        assertThat(failure.getMessage()).isEqualTo(EXPECTED_TEXT).isNotEqualTo(GENERIC_TEXT);
    }
}

package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import reactor.core.publisher.Mono;

/**
 * DEFECT pinned (plan section 9 row "GRAPHQL_EXECUTION_ERROR in no locale bundle"; D-6, fix deferred): every GraphQL
 * execution error is raised with the message key {@code GRAPHQL_EXECUTION_ERROR} (GraphQLExecutor.java, the constant
 * {@code DEFAULT_GRAPHQL_ERROR_CODE} and the {@code PluginException}s built with it), but the key has no entry in
 * {@code locale_en.properties}, {@code locale_de.properties} or {@code locale_zh.properties}. The text falls back to the
 * generic {@code INTERNAL_SERVER_ERROR} message, so the user is told the service is busy and the cause is lost. The REST
 * executor's equivalent key ({@code REST_API_EXECUTION_ERROR}) has a text that names the cause.
 *
 * <p>The path used is the OAuth "inherit from login" step with an empty token Mono, which should read
 * "$ACCESS_TOKEN parameter missing". The obvious fix, adding {@code GRAPHQL_EXECUTION_ERROR=GraphQL execution error: {0}.}
 * to the bundles, turns this test red.
 */
class GraphQLMissingLocaleKeyTest {

    private static final String GENERIC_TEXT = "Oops! Service is busy, please try again later.";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void anOauthErrorIsReportedWithTheGenericServiceBusyTextAndNotItsCause() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url("http://example.invalid/graphql")
                .authConfig(OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build()).build();

        Throwable failure = support.failureOf(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, Mono.empty()));

        System.out.println("[GraphQLMissingLocaleKeyTest] message: " + (failure == null ? null : failure.getMessage()));
        assertThat(failure).isInstanceOf(PluginException.class);
        assertThat(failure.getMessage()).isEqualTo(GENERIC_TEXT);
        assertThat(failure.getMessage()).doesNotContain("ACCESS_TOKEN");
    }
}

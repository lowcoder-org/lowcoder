package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.NoneAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import reactor.core.publisher.Mono;

/**
 * OAuth2 "inherit from login" of {@link GraphQLExecutor}: the visitor's token properties are added to the request, an
 * empty or failing token Mono stops the call before any request, and every other auth type leaves the token Mono alone.
 *
 * <p>Unlike the REST API plugin (defect P4 there), the GraphQL executor builds its URI after the token step, so the
 * token PARAMS do reach the URL; this class asserts that intended behaviour and it holds.
 */
class GraphQLOauthInheritTest {

    private static final String PATH = "/graphql";
    private static final String TOKEN_HEADER = "X-Token";

    private final GraphQLCallSupport support = new GraphQLCallSupport();
    private RecordingHttpServer server;

    @BeforeEach
    void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, GraphQLCallSupport.json(200, "{}")));
    }

    @AfterEach
    void stopServer() {
        server.close();
    }

    private GraphQLDatasourceConfig datasource(AuthConfig auth) {
        return GraphQLDatasourceConfig.builder().url(server.baseUrl() + PATH)
                .params(List.of(new Property("own", "1"), new Property("tok", "from-datasource")))
                .headers(List.of(new Property(TOKEN_HEADER, "from-datasource"), new Property("X-Own", "kept")))
                .authConfig(auth).build();
    }

    private static AuthConfig oauthInherit() {
        return OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build();
    }

    private RecordingHttpServer.Request onlyRequest() {
        assertThat(server.requests()).hasSize(1);
        return server.requests().get(0);
    }

    @Test
    void theTokenHeadersAndParamsOfTheLoginReachTheRequestOverTheDatasourceValues() {
        support.run(datasource(oauthInherit()), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, Mono.just(List.of(
                new Property(TOKEN_HEADER, "from-login", "header"), new Property("tok", "from-login", "param"), new Property("fresh", "new", "param")))));

        RecordingHttpServer.Request request = onlyRequest();
        System.out.println("[GraphQLOauthInheritTest] " + request.pathAndQuery() + " " + request.header(TOKEN_HEADER));
        assertThat(request.header(TOKEN_HEADER)).containsExactly("from-login");
        assertThat(request.header("X-Own")).containsExactly("kept");
        // the order of the params follows an unordered map, so it is not asserted
        assertThat(request.pathAndQuery().split("\\?")[1].split("&")).containsExactlyInAnyOrder("own=1", "tok=from-login", "fresh=new");
    }

    @Test
    void aTokenWithOnlyHeadersOrOnlyParamsAddsOnlyThatKind() {
        support.run(datasource(oauthInherit()), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null,
                Mono.just(List.of(new Property("only-header", "h", "header")))));
        support.run(datasource(oauthInherit()), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null,
                Mono.just(List.of(new Property("only-param", "p", "param")))));

        assertThat(server.requests()).hasSize(2);
        assertThat(server.requests().get(0).header("only-header")).containsExactly("h");
        assertThat(server.requests().get(0).pathAndQuery()).doesNotContain("only-param");
        assertThat(server.requests().get(1).header("only-header")).isEmpty();
        assertThat(server.requests().get(1).pathAndQuery()).contains("only-param=p");
    }

    @Test
    void anEmptyTokenMonoFailsWithAccessTokenMissingAndSendsNoRequest() {
        Throwable failure = support.failureOf(datasource(oauthInherit()), GraphQLCallSupport.query(),
                GraphQLCallSupport.visitor(null, Mono.empty()));

        System.out.println("[GraphQLOauthInheritTest] empty token -> " + failure);
        // The message is not asserted: the key GRAPHQL_EXECUTION_ERROR has no entry in any locale bundle, so the text is the
        // generic "Oops! Service is busy" (probe GP5, reported in log-L4.md, L4-10); the REST executor's message names the cause.
        assertThat(failure).isInstanceOf(PluginException.class);
        assertThat(server.requests()).isEmpty();
    }

    @Test
    void aFailingTokenMonoIsReportedAsAPluginExceptionAndSendsNoRequest() {
        Throwable failure = support.failureOf(datasource(oauthInherit()), GraphQLCallSupport.query(),
                GraphQLCallSupport.visitor(null, Mono.error(new IllegalStateException("login expired"))));

        System.out.println("[GraphQLOauthInheritTest] failing token -> " + failure);
        assertThat(failure).isInstanceOf(PluginException.class); // message not asserted, see the empty-token test
        assertThat(server.requests()).isEmpty();
    }

    @Test
    void otherAuthTypesNeverSubscribeToTheTokenMono() {
        AtomicInteger subscriptions = new AtomicInteger();
        Mono<List<Property>> token = Mono.defer(() -> {
            subscriptions.incrementAndGet();
            return Mono.error(new IllegalStateException("must not be read"));
        });
        AuthConfig basic = BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username("u").password("p").build();

        support.run(datasource(basic), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, token));
        support.run(datasource(NoneAuthConfig.builder().type(RestApiAuthType.NO_AUTH).build()), GraphQLCallSupport.query(),
                GraphQLCallSupport.visitor(null, token));
        support.run(datasource(null), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, token));

        assertThat(subscriptions).hasValue(0);
        assertThat(server.requests()).hasSize(3);
    }

    @Test
    void theTokenMonoIsReadExactlyOnce() {
        AtomicInteger subscriptions = new AtomicInteger();
        Mono<List<Property>> token = Mono.defer(() -> {
            subscriptions.incrementAndGet();
            return Mono.just(List.of(new Property(TOKEN_HEADER, "t", "header")));
        });

        support.run(datasource(oauthInherit()), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, token));

        assertThat(subscriptions).hasValue(1);
    }
}

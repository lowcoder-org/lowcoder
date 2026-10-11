package org.lowcoder.plugin.restapi;

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
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.NoneAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import reactor.core.publisher.Mono;

/**
 * OAuth2 "inherit from login" of {@link RestApiExecutor}: the visitor's token properties are added to the request, an
 * empty or failing token Mono stops the call before any request, and every other auth type leaves the token Mono
 * alone. The token Mono is the one {@code QueryVisitorContext} carries.
 */
class RestApiOauthInheritTest {

    private static final String PATH = "/api";
    private static final String TOKEN_HEADER = "X-Token";
    private static final String TOKEN_PARAM = "tok";

    private final RestApiCallSupport support = new RestApiCallSupport();
    private RecordingHttpServer server;

    @BeforeEach
    void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")));
    }

    @AfterEach
    void stopServer() {
        server.close();
    }

    private RestApiDatasourceConfig datasource(AuthConfig auth) {
        return RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH)
                .params(List.of(new Property("own", "1"), new Property(TOKEN_PARAM, "from-datasource")))
                .authConfig(auth).build();
    }

    private static AuthConfig oauthInherit() {
        return OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build();
    }

    private RecordingHttpServer.Request onlyRequest() {
        List<RecordingHttpServer.Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        return requests.get(0);
    }

    /**
     * The token header reaches the request, over a datasource header of the same name. What happens to the token
     * "param" properties is reported to the coordinator as probe P4 and not asserted (see log-L4.md, L4-9).
     */
    @Test
    void theTokenHeadersOfTheLoginAreAddedToTheRequest() {
        RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH)
                .headers(List.of(new Property(TOKEN_HEADER, "from-datasource"), new Property("X-Own", "kept")))
                .authConfig(oauthInherit()).build();

        support.run(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null,
                Mono.just(List.of(new Property(TOKEN_HEADER, "from-login", "header")))));

        RecordingHttpServer.Request request = onlyRequest();
        System.out.println("[RestApiOauthInheritTest] headers " + request.header(TOKEN_HEADER) + " / " + request.header("X-Own"));
        assertThat(request.header(TOKEN_HEADER)).containsExactly("from-login");
        assertThat(request.header("X-Own")).containsExactly("kept");
    }

    @Test
    void aTokenWithBothKindsOrWithOnlyOneKindStillSendsTheRequest() {
        support.run(datasource(oauthInherit()), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null,
                Mono.just(List.of(new Property("a", "1", "header"), new Property("b", "2", "param")))));
        support.run(datasource(oauthInherit()), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null,
                Mono.just(List.of(new Property("c", "3", "param")))));
        System.out.println("[RestApiOauthInheritTest] request after a token with a param: " + server.requests().get(1).pathAndQuery());
        support.run(datasource(oauthInherit()), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null,
                Mono.just(List.of(new Property("d", "4", "header")))));

        assertThat(server.requests()).hasSize(3);
        assertThat(server.requests().get(0).header("a")).containsExactly("1");
        assertThat(server.requests().get(1).header("c")).isEmpty();
        assertThat(server.requests().get(2).header("d")).containsExactly("4");
    }

    @Test
    void anEmptyTokenMonoFailsWithAccessTokenMissingAndSendsNoRequest() {
        Throwable failure = support.failureOf(datasource(oauthInherit()), Map.of("httpMethod", "GET"),
                RestApiCallSupport.visitor(null, Mono.empty()));

        System.out.println("[RestApiOauthInheritTest] empty token -> " + failure);
        assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("$ACCESS_TOKEN parameter missing");
        assertThat(server.requests()).isEmpty();
    }

    @Test
    void aFailingTokenMonoIsReportedAsAPluginExceptionAndSendsNoRequest() {
        Throwable failure = support.failureOf(datasource(oauthInherit()), Map.of("httpMethod", "GET"),
                RestApiCallSupport.visitor(null, Mono.error(new IllegalStateException("login expired"))));

        System.out.println("[RestApiOauthInheritTest] failing token -> " + failure);
        assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("login expired");
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

        support.run(datasource(basic), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, token));
        support.run(datasource(NoneAuthConfig.builder().type(RestApiAuthType.NO_AUTH).build()), Map.of("httpMethod", "GET"),
                RestApiCallSupport.visitor(null, token));
        support.run(datasource(null), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, token));

        assertThat(subscriptions).hasValue(0);
        assertThat(server.requests()).hasSize(3);
    }

    @Test
    void theTokenStepOfOauthInheritReadsTheMonoExactlyOnce() {
        AtomicInteger subscriptions = new AtomicInteger();
        Mono<List<Property>> token = Mono.defer(() -> {
            subscriptions.incrementAndGet();
            return Mono.just(List.of(new Property(TOKEN_HEADER, "t", "header")));
        });

        support.run(datasource(oauthInherit()), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, token));

        assertThat(subscriptions).hasValue(1);
    }
}

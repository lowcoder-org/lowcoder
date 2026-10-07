package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.plugin.graphql.GraphQLCallSupport.json;
import static org.lowcoder.plugin.graphql.GraphQLCallSupport.redirect;
import static org.lowcoder.plugin.graphql.GraphQLCallSupport.requestsTo;

import java.lang.reflect.Method;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Redirect handling of {@link GraphQLExecutor#executeQuery}. The redirect target is the {@code Location} header
 * resolved against the URI that answered.
 *
 * <p>Covers the two halves of defect D14 for the GraphQL executor (BF-009, BF-010): a relative {@code Location} goes to
 * the server that redirected, and a redirect to another origin is sent with only the content headers ({@code Accept},
 * {@code Accept-Language}, {@code Content-Type}, {@code User-Agent}), without the datasource's credentials, custom
 * headers and the forwarded cookies. Same code as RestApiExecutor.
 */
class GraphQLRedirectTest {

    /** {@code GraphQLExecutor.MAX_REDIRECTS}: calls 0 to 4 send a request, call 5 fails before sending one. */
    private static final int REQUEST_LIMIT = 5;
    private static final String USER = "user";
    private static final String PASSWORD = "secret";
    private static final String API_KEY_HEADER = "X-Api-Key";
    private static final String API_KEY = "datasource-key";
    private static final String JSON = "application/json";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    private static String absolute(RecordingHttpServer.Request request, String path) {
        return "http://" + request.header("Host").get(0) + path;
    }

    private static GraphQLDatasourceConfig datasource(RecordingHttpServer server, String path) {
        return GraphQLDatasourceConfig.builder().url(server.baseUrl() + path).build();
    }

    @Test
    void anAbsoluteRedirectIsFollowedAndTheAnswerOfTheTargetIsReturned() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(
                "/start", request -> redirect(302, absolute(request, "/target")),
                "/target", request -> json(200, "{\"landed\":true}")))) {

            QueryExecutionResult result = support.run(datasource(server, "/start"), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLRedirectTest] requests " + server.requests().stream().map(RecordingHttpServer.Request::pathAndQuery).toList());
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getData().toString()).isEqualTo("{\"landed\":true}");
            assertThat(server.requests()).extracting(RecordingHttpServer.Request::pathAndQuery).containsExactly("/start", "/target");
        }
    }

    @Test
    void aRedirectLoopEndsAfterFiveRequestsWithTheRedirectLimitError() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of("/loop", request -> redirect(302, absolute(request, "/loop"))))) {

            Throwable failure = support.failureOf(datasource(server, "/loop"), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLRedirectTest] loop -> " + failure + " after " + server.requests().size() + " requests");
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("maximum HTTP redirects");
            assertThat(server.requests()).hasSize(REQUEST_LIMIT);
        }
    }

    /**
     * BF-009 (D14, first half) for GraphQL: a relative {@code Location: /next} is resolved against the URI that answered,
     * so the next call goes to the server that redirected and not to a host-less URI (which the client sends to
     * {@code localhost} port 80, past the disallowed-hosts check). The second request never leaves the JVM: the private
     * {@code httpCall} is called through reflection with a WebClient whose exchange function is a stub, which answers the
     * first call 302 with {@code Location: /next} and records the URL of the second call.
     *
     * <p>Limits: it covers the redirect decision of {@code httpCall} (a private method, signature read in the source) and
     * not a real network; it breaks, on purpose, if the signature changes.
     */
    @Test
    void aRelativeLocationIsResolvedAgainstTheServerThatRedirected() throws ReflectiveOperationException {
        List<URI> called = new CopyOnWriteArrayList<>();
        ExchangeFunction stub = request -> {
            called.add(request.url());
            if (called.size() == 1) {
                return Mono.just(ClientResponse.create(HttpStatus.FOUND, ExchangeStrategies.withDefaults()).header("Location", "/next").build());
            }
            return Mono.just(ClientResponse.create(HttpStatus.OK, ExchangeStrategies.withDefaults())
                    .header("Content-Type", "application/json").body("{}").build());
        };
        WebClient client = WebClient.builder().exchangeFunction(stub).build();
        Method httpCall = GraphQLExecutor.class.getDeclaredMethod("httpCall", WebClient.class, HttpMethod.class, URI.class,
                BodyInserter.class, int.class, AuthConfig.class, Consumer.class, boolean.class);
        httpCall.setAccessible(true);
        URI origin = URI.create("http://origin.invalid:8080/start");

        Mono<?> call = (Mono<?>) httpCall.invoke(new GraphQLExecutor(new CommonConfig()), client, HttpMethod.POST, origin,
                BodyInserters.fromValue(new byte[0]), 0, null, (Consumer<HttpHeaders>) headers -> { }, false);
        call.block(GraphQLCallSupport.TIMEOUT);

        System.out.println("[GraphQLRedirectTest] URLs called for a relative Location: " + called);
        assertThat(called).hasSize(2);
        assertThat(called.get(0)).isEqualTo(origin);
        assertThat(called.get(1)).isEqualTo(URI.create("http://origin.invalid:8080/next"));
    }

    /**
     * BF-010 (D14, second half) for GraphQL: a redirect to another origin (here another port) is sent without the
     * datasource's Authorization header, its custom {@code X-Api-Key} header and the forwarded cookie, and with its
     * {@code Accept} header; the origin itself received all of them.
     */
    @Test
    void aRedirectToAnotherOriginDropsTheAuthorizationHeaderAndTheForwardedCookies() {
        try (RecordingHttpServer other = RecordingHttpServer.serve(Map.of("/landing", request -> json(200, "{}")))) {
            try (RecordingHttpServer origin = RecordingHttpServer.serve(Map.of("/start", request -> redirect(302, other.baseUrl() + "/landing")))) {
                GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(origin.baseUrl() + "/start")
                        .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username(USER).password(PASSWORD).build())
                        .headers(List.of(new Property(API_KEY_HEADER, API_KEY), new Property(HttpHeaders.ACCEPT, JSON)))
                        .forwardCookies(Set.of("a")).build();

                support.run(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(GraphQLCallSupport.cookies("a", "1"), null));

                RecordingHttpServer.Request atOrigin = requestsTo(origin, "/start").get(0);
                RecordingHttpServer.Request atOther = requestsTo(other, "/landing").get(0);
                System.out.println("[GraphQLRedirectTest] origin received Authorization " + atOrigin.header("Authorization")
                        + " Cookie " + atOrigin.header("Cookie") + "; other origin received Authorization "
                        + atOther.header("Authorization") + " Cookie " + atOther.header("Cookie"));
                assertThat(origin.port()).isNotEqualTo(other.port());
                assertThat(atOrigin.header("Authorization")).hasSize(1);
                assertThat(atOrigin.header("Authorization").get(0)).startsWith("Basic ");
                assertThat(atOrigin.header("Cookie")).containsExactly("a=1");
                assertThat(atOrigin.header(API_KEY_HEADER)).containsExactly(API_KEY);
                assertThat(atOther.header("Authorization")).isEmpty();
                assertThat(atOther.header("Cookie")).isEmpty();
                assertThat(atOther.header(API_KEY_HEADER)).as("a custom datasource header can be a credential").isEmpty();
                assertThat(atOther.header(HttpHeaders.ACCEPT)).as("a content header is kept").containsExactly(JSON);
            }
        }
    }

    /** A redirect inside the same origin keeps the datasource's Authorization header, its custom headers and the forwarded cookie. */
    @Test
    void aRedirectInsideTheSameOriginKeepsTheAuthorizationHeaderTheCustomHeadersAndTheForwardedCookies() {
        try (RecordingHttpServer origin = RecordingHttpServer.serve(Map.of(
                "/start", request -> redirect(302, "/landing"),
                "/landing", request -> json(200, "{}")))) {
            GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(origin.baseUrl() + "/start")
                    .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username(USER).password(PASSWORD).build())
                    .headers(List.of(new Property(API_KEY_HEADER, API_KEY)))
                    .forwardCookies(Set.of("a")).build();

            support.run(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(GraphQLCallSupport.cookies("a", "1"), null));

            RecordingHttpServer.Request landing = requestsTo(origin, "/landing").get(0);
            System.out.println("[GraphQLRedirectTest] same-origin relative redirect received Authorization "
                    + landing.header("Authorization") + " X-Api-Key " + landing.header(API_KEY_HEADER) + " Cookie " + landing.header("Cookie"));
            assertThat(landing.header("Authorization")).hasSize(1);
            assertThat(landing.header("Authorization").get(0)).startsWith("Basic ");
            assertThat(landing.header(API_KEY_HEADER)).containsExactly(API_KEY);
            assertThat(landing.header("Cookie")).containsExactly("a=1");
        }
    }

    @Test
    void aLocationThatIsNotAUriGivesAPluginExceptionAndNoSecondRequest() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of("/start", request -> redirect(302, "ht tp://x y")))) {

            Throwable failure = support.failureOf(datasource(server, "/start"), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLRedirectTest] bad Location -> " + failure);
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("Illegal character in scheme name");
            assertThat(server.requests()).hasSize(1);
        }
    }
}

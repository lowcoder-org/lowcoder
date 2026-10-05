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
 * Redirect handling of {@link GraphQLExecutor#executeQuery}. The redirect target comes from the {@code Location} header
 * as given.
 *
 * <p>Pins the two halves of defect D14 for the GraphQL executor (analysis-plugins section 0.6; plan section 9, row
 * "D1-D20 of analysis-plugins 0.6", and the row for a relative Location that the disallowed-hosts resolver does not
 * stop; fixes deferred under D-6): a relative {@code Location} is not resolved against the request, and a redirect to
 * another origin re-sends the datasource's credentials and the forwarded cookies. Same code as RestApiExecutor.
 */
class GraphQLRedirectTest {

    /** {@code GraphQLExecutor.MAX_REDIRECTS}: calls 0 to 4 send a request, call 5 fails before sending one. */
    private static final int REQUEST_LIMIT = 5;

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
     * DEFECT D14, first half, pinned for GraphQL (see the class comment; D-6, fix deferred): a relative
     * {@code Location: /next} is turned into a URI without a host ({@code new URI(redirectUrl)},
     * GraphQLExecutor.java:343-347) and the next call is made with that URI as given. The client's default for a host-less
     * URI is {@code localhost}, port 80, an uncontrolled port, so this test never lets the second request leave the JVM:
     * it calls the private {@code httpCall} through reflection with a WebClient whose exchange function is a stub,
     * answers the first call 302 with {@code Location: /next} and records the URL of the second call. The pin: that URL
     * is {@code /next}, not absolute, with no host. The obvious fix, {@code uri.resolve(redirectUrl)}, makes the second
     * URL absolute on the original host and turns this test red.
     *
     * <p>Limits: it pins the redirect decision of {@code httpCall} (a private method, signature read in the source) and not
     * what a real network does with the host-less URI; it breaks, on purpose, if the signature changes.
     */
    @Test
    void aRelativeLocationIsFollowedAsAHostlessUriTodayD14() throws ReflectiveOperationException {
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
                BodyInserter.class, int.class, AuthConfig.class, Consumer.class);
        httpCall.setAccessible(true);
        URI origin = URI.create("http://origin.invalid:8080/start");

        Mono<?> call = (Mono<?>) httpCall.invoke(new GraphQLExecutor(new CommonConfig()), client, HttpMethod.POST, origin,
                BodyInserters.fromValue(new byte[0]), 0, null, (Consumer<HttpHeaders>) headers -> { });
        call.block(GraphQLCallSupport.TIMEOUT);

        System.out.println("[GraphQLRedirectTest] URLs called for a relative Location: " + called);
        assertThat(called).hasSize(2);
        assertThat(called.get(0)).isEqualTo(origin);
        assertThat(called.get(1)).hasToString("/next");
        assertThat(called.get(1).isAbsolute()).isFalse();
        assertThat(called.get(1).getHost()).isNull();
    }

    /**
     * DEFECT D14, second half, pinned for GraphQL (see the class comment; D-6, fix deferred): the redirect is sent with
     * the same WebClient, whose default headers and cookies are the datasource's, so a redirect to another origin (here
     * another port) carries the datasource's Authorization header and the forwarded cookie. The intended behaviour,
     * dropping credentials when the host or port changes, would turn this test red.
     */
    @Test
    void aRedirectToAnotherOriginResendsTheAuthorizationHeaderAndTheForwardedCookiesD14() {
        try (RecordingHttpServer other = RecordingHttpServer.serve(Map.of("/landing", request -> json(200, "{}")))) {
            try (RecordingHttpServer origin = RecordingHttpServer.serve(Map.of("/start", request -> redirect(302, other.baseUrl() + "/landing")))) {
                GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(origin.baseUrl() + "/start")
                        .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username("user").password("secret").build())
                        .forwardCookies(Set.of("a")).build();

                support.run(datasource, GraphQLCallSupport.query(), GraphQLCallSupport.visitor(GraphQLCallSupport.cookies("a", "1"), null));

                RecordingHttpServer.Request atOther = requestsTo(other, "/landing").get(0);
                System.out.println("[GraphQLRedirectTest] other origin received Authorization " + atOther.header("Authorization")
                        + " Cookie " + atOther.header("Cookie"));
                assertThat(origin.port()).isNotEqualTo(other.port());
                assertThat(atOther.header("Authorization")).hasSize(1);
                assertThat(atOther.header("Authorization").get(0)).startsWith("Basic ");
                assertThat(atOther.header("Cookie")).containsExactly("a=1");
            }
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

package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.plugin.restapi.RestApiCallSupport.json;
import static org.lowcoder.plugin.restapi.RestApiCallSupport.redirect;
import static org.lowcoder.plugin.restapi.RestApiCallSupport.requestsTo;

import java.lang.reflect.Method;
import java.net.URI;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
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
 * Redirect and digest-challenge handling of {@link RestApiExecutor#executeQuery}. The redirect target comes from the
 * {@code Location} header as given.
 *
 * <p>Pins the two halves of defect D14 (analysis-plugins section 0.6; plan section 9, row "D1-D20 of analysis-plugins
 * 0.6"; fixes deferred under D-6): a relative {@code Location} is not resolved against the request, and a redirect to
 * another origin re-sends the datasource's credentials and the forwarded cookies.
 */
class RestApiRedirectTest {

    /** {@code RestApiExecutor.MAX_REDIRECTS}: calls 0 to 6 send a request, call 7 fails before sending one. */
    private static final int REQUEST_LIMIT = 7;
    private static final String HOST = "Host";
    private static final String USER = "user";
    private static final String PASSWORD = "secret";

    private final RestApiCallSupport support = new RestApiCallSupport();

    private static String absolute(RecordingHttpServer.Request request, String path) {
        return "http://" + request.header(HOST).get(0) + path;
    }

    private static RestApiDatasourceConfig get(RecordingHttpServer server, String path) {
        return RestApiDatasourceConfig.builder().url(server.baseUrl() + path).build();
    }

    private QueryExecutionResult runGet(RestApiDatasourceConfig datasource) {
        return support.run(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, null));
    }

    @Test
    void anAbsoluteRedirectIsFollowedAndTheAnswerOfTheTargetIsReturned() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(
                "/start", request -> redirect(302, absolute(request, "/target")),
                "/target", request -> json(200, "{\"landed\":true}")))) {

            QueryExecutionResult result = runGet(get(server, "/start"));

            System.out.println("[RestApiRedirectTest] requests " + server.requests().stream().map(RecordingHttpServer.Request::pathAndQuery).toList());
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getData().toString()).isEqualTo("{\"landed\":true}");
            assertThat(server.requests()).extracting(RecordingHttpServer.Request::pathAndQuery).containsExactly("/start", "/target");
        }
    }

    @Test
    void aRedirectLoopEndsAfterSevenRequestsWithTheRedirectLimitError() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(
                "/loop", request -> redirect(302, absolute(request, "/loop"))))) {

            Throwable failure = support.failureOf(get(server, "/loop"), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, null));

            System.out.println("[RestApiRedirectTest] loop -> " + failure + " after " + server.requests().size() + " requests");
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("maximum HTTP redirects");
            assertThat(server.requests()).hasSize(REQUEST_LIMIT);
        }
    }

    /**
     * DEFECT D14, first half, pinned (analysis-plugins section 0.6; plan section 9 "D1-D20" row; D-6, fix deferred): a
     * relative {@code Location: /next} is turned into a URI without a host ({@code new URI(redirectUrl)}, RestApiExecutor
     * .java:278-283) and the next call is made with that URI as given, so it is not sent to the server that redirected.
     * The client's default for a host-less URI is {@code localhost}, port 80: an uncontrolled port (a run of an earlier
     * version of this test reached whatever listens there, and a disallowed-hosts entry for {@code localhost} did not stop
     * it), and the request carries the datasource's headers and cookies. This test therefore never lets the second
     * request leave the JVM: it calls the private {@code httpCall} through reflection with a WebClient whose exchange
     * function is a stub (no connector), answers the first call 302 with {@code Location: /next} and records the URL of
     * the second call. The pin: that URL is {@code /next}, not absolute, with no host. The obvious fix,
     * {@code uri.resolve(redirectUrl)}, makes the second URL absolute on the original host and turns this test red.
     *
     * <p>Limits: it pins the redirect decision of {@code httpCall} (a private method, signature read in the source) and
     * not what a real network does with the host-less URI; it breaks, on purpose, if {@code httpCall}'s signature changes.
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
        Method httpCall = RestApiExecutor.class.getDeclaredMethod("httpCall", WebClient.class, HttpMethod.class, URI.class,
                BodyInserter.class, int.class, AuthConfig.class, Consumer.class);
        httpCall.setAccessible(true);
        URI origin = URI.create("http://origin.invalid:8080/start");

        Mono<?> call = (Mono<?>) httpCall.invoke(new RestApiExecutor(new CommonConfig()), client, HttpMethod.GET, origin,
                BodyInserters.fromValue(new byte[0]), 0, null, (Consumer<HttpHeaders>) headers -> { });
        call.block(RestApiCallSupport.TIMEOUT);

        System.out.println("[RestApiRedirectTest] URLs called for a relative Location: " + called);
        assertThat(called).hasSize(2);
        assertThat(called.get(0)).isEqualTo(origin);
        assertThat(called.get(1)).hasToString("/next");
        assertThat(called.get(1).isAbsolute()).isFalse();
        assertThat(called.get(1).getHost()).isNull();
    }

    /**
     * DEFECT D14, second half, pinned (analysis-plugins section 0.6; plan section 9 "D1-D20" row; D-6, fix deferred): the
     * redirect is sent with the same WebClient, whose default headers and cookies are those of the datasource, so a
     * redirect to another origin (here another port) carries the datasource's Authorization header and the forwarded
     * cookie. The intended behaviour, dropping credentials when the host or port changes, would turn this test red.
     */
    @Test
    void aRedirectToAnotherOriginResendsTheAuthorizationHeaderAndTheForwardedCookiesD14() {
        try (RecordingHttpServer other = RecordingHttpServer.serve(Map.of("/landing", request -> json(200, "{}")))) {
            try (RecordingHttpServer origin = RecordingHttpServer.serve(Map.of(
                    "/start", request -> redirect(302, other.baseUrl() + "/landing")))) {
                RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(origin.baseUrl() + "/start")
                        .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username(USER).password(PASSWORD).build())
                        .forwardCookies(Set.of("a")).build();

                support.run(datasource, Map.of("httpMethod", "GET"),
                        RestApiCallSupport.visitor(RestApiCallSupport.cookies("a", "1"), null));

                RecordingHttpServer.Request atOther = requestsTo(other, "/landing").get(0);
                System.out.println("[RestApiRedirectTest] other origin received Authorization " + atOther.header("Authorization")
                        + " Cookie " + atOther.header("Cookie"));
                assertThat(origin.port()).isNotEqualTo(other.port());
                assertThat(atOther.header("Authorization")).hasSize(1).allSatisfy(value -> assertThat(value).startsWith("Basic "));
                assertThat(atOther.header("Cookie")).containsExactly("a=1");
            }
        }
    }

    @Test
    void aLocationThatIsNotAUriGivesAPluginExceptionAndNoSecondRequest() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(
                "/start", request -> redirect(302, "ht tp://x y")))) {

            Throwable failure = support.failureOf(get(server, "/start"), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, null));

            System.out.println("[RestApiRedirectTest] bad Location -> " + failure);
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("Illegal character in scheme name");
            assertThat(server.requests()).hasSize(1);
        }
    }

    @Test
    void aDigestChallengeWithAMalformedHeaderGivesAPluginExceptionAndIsNotRetried() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/digest",
                new Response(401, Map.of("WWW-Authenticate", List.of("Digest garbage")), null)))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + "/digest")
                    .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.DIGEST_AUTH).username(USER).password(PASSWORD).build()).build();

            Throwable failure = support.failureOf(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, null));

            System.out.println("[RestApiRedirectTest] malformed digest challenge -> " + failure);
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("unexpected input");
            assertThat(server.requests()).hasSize(1);
        }
    }

    /** Behaviour, not a defect: without a challenge header a 401 is an ordinary answer, returned once. */
    @Test
    void aPlain401UnderDigestAuthIsReturnedAsTheResultAndNotRetried() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/digest", new Response(401, Map.of(), null)))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + "/digest")
                    .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.DIGEST_AUTH).username(USER).password(PASSWORD).build()).build();

            QueryExecutionResult result = runGet(datasource);

            System.out.println("[RestApiRedirectTest] plain 401 -> success=" + result.isSuccess() + " data=" + result.getData());
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getData()).hasToString("401 UNAUTHORIZED");
            assertThat(server.requests()).hasSize(1);
        }
    }
}

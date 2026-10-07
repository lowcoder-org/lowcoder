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
import org.lowcoder.sdk.models.Property;
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
 * Redirect and digest-challenge handling of {@link RestApiExecutor#executeQuery}. The redirect target is the
 * {@code Location} header resolved against the URI that answered.
 *
 * <p>Covers the two halves of defect D14 (BF-009, BF-010): a relative {@code Location} goes to the server that
 * redirected, and a redirect to another origin is sent without the datasource's credentials and forwarded cookies.
 */
class RestApiRedirectTest {

    /** {@code RestApiExecutor.MAX_REDIRECTS}: calls 0 to 6 send a request, call 7 fails before sending one. */
    private static final int REQUEST_LIMIT = 7;
    private static final String HOST = "Host";
    private static final String USER = "user";
    private static final String PASSWORD = "secret";
    private static final String API_KEY_HEADER = "X-Api-Key";
    private static final String API_KEY = "datasource-key";
    private static final String JSON = "application/json";

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
     * BF-009 (D14, first half): a relative {@code Location: /next} is resolved against the URI that answered, so the next
     * call goes to the server that redirected and not to a host-less URI (which the client sends to {@code localhost}
     * port 80, past the disallowed-hosts check). The second request never leaves the JVM: the private {@code httpCall} is
     * called through reflection with a WebClient whose exchange function is a stub (no connector), which answers the
     * first call 302 with {@code Location: /next} and records the URL of the second call.
     *
     * <p>Limits: it covers the redirect decision of {@code httpCall} (a private method, signature read in the source) and
     * not a real network; it breaks, on purpose, if {@code httpCall}'s signature changes.
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
        Method httpCall = RestApiExecutor.class.getDeclaredMethod("httpCall", WebClient.class, HttpMethod.class, URI.class,
                BodyInserter.class, int.class, AuthConfig.class, Consumer.class, boolean.class);
        httpCall.setAccessible(true);
        URI origin = URI.create("http://origin.invalid:8080/start");

        Mono<?> call = (Mono<?>) httpCall.invoke(new RestApiExecutor(new CommonConfig()), client, HttpMethod.GET, origin,
                BodyInserters.fromValue(new byte[0]), 0, null, (Consumer<HttpHeaders>) headers -> { }, false);
        call.block(RestApiCallSupport.TIMEOUT);

        System.out.println("[RestApiRedirectTest] URLs called for a relative Location: " + called);
        assertThat(called).hasSize(2);
        assertThat(called.get(0)).isEqualTo(origin);
        assertThat(called.get(1)).isEqualTo(URI.create("http://origin.invalid:8080/next"));
    }

    /**
     * BF-010 (D14, second half): a redirect to another origin (here another port) is sent without the datasource's
     * Authorization header, its custom {@code X-Api-Key} header and the forwarded cookie, and with its {@code Accept}
     * header; the origin itself received all of them.
     */
    @Test
    void aRedirectToAnotherOriginDropsTheAuthorizationHeaderAndTheForwardedCookies() {
        try (RecordingHttpServer other = RecordingHttpServer.serve(Map.of("/landing", request -> json(200, "{}")))) {
            try (RecordingHttpServer origin = RecordingHttpServer.serve(Map.of(
                    "/start", request -> redirect(302, other.baseUrl() + "/landing")))) {
                RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(origin.baseUrl() + "/start")
                        .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username(USER).password(PASSWORD).build())
                        .headers(List.of(new Property(API_KEY_HEADER, API_KEY), new Property(HttpHeaders.ACCEPT, JSON)))
                        .forwardCookies(Set.of("a")).build();

                support.run(datasource, Map.of("httpMethod", "GET"),
                        RestApiCallSupport.visitor(RestApiCallSupport.cookies("a", "1"), null));

                RecordingHttpServer.Request atOrigin = requestsTo(origin, "/start").get(0);
                RecordingHttpServer.Request atOther = requestsTo(other, "/landing").get(0);
                System.out.println("[RestApiRedirectTest] origin received Authorization " + atOrigin.header("Authorization")
                        + " Cookie " + atOrigin.header("Cookie") + "; other origin received Authorization "
                        + atOther.header("Authorization") + " Cookie " + atOther.header("Cookie"));
                assertThat(origin.port()).isNotEqualTo(other.port());
                assertThat(atOrigin.header("Authorization")).hasSize(1).allSatisfy(value -> assertThat(value).startsWith("Basic "));
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
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(origin.baseUrl() + "/start")
                    .authConfig(BasicAuthConfig.builder().type(RestApiAuthType.BASIC_AUTH).username(USER).password(PASSWORD).build())
                    .headers(List.of(new Property(API_KEY_HEADER, API_KEY)))
                    .forwardCookies(Set.of("a")).build();

            QueryExecutionResult result = support.run(datasource, Map.of("httpMethod", "GET"),
                    RestApiCallSupport.visitor(RestApiCallSupport.cookies("a", "1"), null));

            RecordingHttpServer.Request landing = requestsTo(origin, "/landing").get(0);
            System.out.println("[RestApiRedirectTest] same-origin relative redirect received Authorization "
                    + landing.header("Authorization") + " Cookie " + landing.header("Cookie"));
            assertThat(result.isSuccess()).isTrue();
            assertThat(landing.header("Authorization")).hasSize(1).allSatisfy(value -> assertThat(value).startsWith("Basic "));
            assertThat(landing.header(API_KEY_HEADER)).containsExactly(API_KEY);
            assertThat(landing.header("Cookie")).containsExactly("a=1");
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

package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.PluginException;
import org.springframework.http.HttpStatus;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;

/**
 * Basic and digest authentication of {@link GraphQLExecutor} against a local server. The REST API plugin has the same
 * code and an engine test for it; the GraphQL plugin had none.
 *
 * <p>BF-078 (fixed; was pinned under D-6 as the plan section 9 row on digest authentication, as for REST in
 * RestApiEngineTest): a digest challenge is answered once per request, so with a wrong password the query gets the
 * server's 401 after two requests instead of the redirect-limit error after five.
 */
class GraphQLAuthTest {

    private static final String PATH = "/graphql";
    private static final String USER = "postman";
    private static final String PASSWORD = "password";
    private static final String REALM = "Users";
    private static final String NONCE = "f2a8d2c6b1e04a7f9c3d5e6b7a8c9d0e";
    private static final String DIGEST = "Digest ";
    private static final Pattern DIGEST_PARAM = Pattern.compile("(\\w+)=(?:\"([^\"]*)\"|([^,\\s]+))");
    private static final String MOVED_PATH = "/graphql-moved";
    private static final String WRONG_PASSWORD = "wrong";
    private static final String UNAUTHORIZED_CODE = "HTTP" + HttpStatus.UNAUTHORIZED.name();

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    private static GraphQLDatasourceConfig datasource(RecordingHttpServer server, RestApiAuthType type, String password) {
        return GraphQLDatasourceConfig.builder().url(server.baseUrl() + PATH)
                .authConfig(BasicAuthConfig.builder().type(type).username(USER).password(password).build()).build();
    }

    @Test
    void basicAuthSendsTheAuthorizationHeaderWithTheEncodedCredentials() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, GraphQLCallSupport.json(200, "{}")))) {

            support.run(datasource(server, RestApiAuthType.BASIC_AUTH, PASSWORD), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(null, null));

            String expected = "Basic " + Base64.getEncoder().encodeToString((USER + ":" + PASSWORD).getBytes(StandardCharsets.UTF_8));
            System.out.println("[GraphQLAuthTest] Authorization " + server.requests().get(0).header("Authorization"));
            assertThat(server.requests()).hasSize(1);
            assertThat(server.requests().get(0).header("Authorization")).containsExactly(expected);
        }
    }

    @Test
    void digestAuthAnswersTheChallengeWithAValidResponseAndGetsTheResult() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(PATH, GraphQLAuthTest::digestServer))) {

            QueryExecutionResult result = support.run(datasource(server, RestApiAuthType.DIGEST_AUTH, PASSWORD), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLAuthTest] digest: " + server.requests().size() + " requests, authenticated=" + result.getData());
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getData().toString()).isEqualTo("{\"authenticated\":true}");
            assertThat(server.requests()).hasSize(2);
            assertThat(server.requests().get(0).header("Authorization")).isEmpty();
            assertThat(server.requests().get(1).header("Authorization")).hasSize(1);
        }
    }

    /**
     * BF-078: the server answers the digest attempt with a wrong password with a new challenge; the executor does not answer
     * it again, and the query result is the server's 401 (HTTPUNAUTHORIZED), after the challenged request and the answer.
     */
    @Test
    void digestAuthWithAWrongPasswordGetsTheServersUnauthorizedAfterOneAnswerBF078() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(PATH, GraphQLAuthTest::digestServer))) {

            QueryExecutionResult result = support.run(datasource(server, RestApiAuthType.DIGEST_AUTH, WRONG_PASSWORD), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLAuthTest] digest, wrong password: " + result.getQueryCode() + " after " + server.requests().size() + " requests");
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getQueryCode()).isEqualTo(UNAUTHORIZED_CODE);
            assertThat(server.requests()).hasSize(2);
            assertThat(server.requests().get(1).header("Authorization")).hasSize(1).allMatch(value -> value.startsWith(DIGEST));
        }
    }

    /**
     * BF-078, what "once per request" keeps: after a digest answer, a same-origin redirect to another path that challenges
     * again is answered there too (the first answer was computed for the old path), and the query gets the result.
     */
    @Test
    void aRedirectAfterADigestAnswerToAPathThatChallengesIsAnsweredAgainBF078() {
        Map<String, RecordingHttpServer.Handler> handlers = Map.of(
                PATH, request -> {
                    Response answer = digestServer(request);
                    return answer.status() == 200 ? new Response(307, Map.of("Location", List.of(MOVED_PATH)), null) : answer;
                },
                MOVED_PATH, GraphQLAuthTest::digestServer);
        try (RecordingHttpServer server = RecordingHttpServer.serve(handlers)) {

            QueryExecutionResult result = support.run(datasource(server, RestApiAuthType.DIGEST_AUTH, PASSWORD), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            List<String> paths = server.requests().stream().map(Request::pathAndQuery).toList();
            System.out.println("[GraphQLAuthTest] digest, redirect after the answer: " + paths + " -> " + result.getData());
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getData().toString()).isEqualTo("{\"authenticated\":true}");
            assertThat(paths).containsExactly(PATH, PATH, MOVED_PATH, MOVED_PATH);
        }
    }

    @Test
    void aMalformedDigestChallengeGivesAPluginExceptionAndIsNotRetried() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH,
                new Response(401, Map.of("WWW-Authenticate", List.of("Digest garbage")), null)))) {

            Throwable failure = support.failureOf(datasource(server, RestApiAuthType.DIGEST_AUTH, PASSWORD), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLAuthTest] malformed challenge -> " + failure);
            assertThat(failure).isInstanceOf(PluginException.class);
            assertThat(server.requests()).hasSize(1);
        }
    }

    /** Behaviour, not a defect: without a challenge header a 401 is an ordinary answer, returned once. */
    @Test
    void aPlain401UnderDigestAuthIsReturnedAsTheResultAndNotRetried() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, new Response(401, Map.of(), null)))) {

            QueryExecutionResult result = support.run(datasource(server, RestApiAuthType.DIGEST_AUTH, PASSWORD), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            assertThat(result.isSuccess()).isFalse();
            assertThat(server.requests()).hasSize(1);
        }
    }

    /**
     * Behaviour, not a defect: a server that answers without a challenge is not sent a digest answer; the first answer, sent
     * without an Authorization header, is the result. Since BF-078 this is the only test that has a non-401 answer reach the
     * digest check ({@code AuthHelper.shouldDigestAuth}): after a digest answer the check is no longer made.
     */
    @Test
    void digestAuthAgainstAServerThatDoesNotChallengeSendsOneRequestWithoutCredentials() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, GraphQLCallSupport.json(200, "{\"open\":true}")))) {

            QueryExecutionResult result = support.run(datasource(server, RestApiAuthType.DIGEST_AUTH, PASSWORD), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLAuthTest] digest, no challenge: " + server.requests().size() + " request(s), Authorization "
                    + server.requests().get(0).header("Authorization") + " -> " + result.getData());
            assertThat(result.isSuccess()).isTrue();
            assertThat(server.requests()).hasSize(1);
            assertThat(server.requests().get(0).header("Authorization")).isEmpty();
        }
    }

    /** RFC 7616 with MD5 and qop=auth: 401 with a challenge until the Authorization header carries a valid response. */
    private static Response digestServer(Request request) {
        String authorization = request.header("Authorization").stream().findFirst().orElse("");
        if (authorization.startsWith(DIGEST) && validDigest(request, digestParameters(authorization))) {
            return GraphQLCallSupport.json(200, "{\"authenticated\":true}");
        }
        String challenge = DIGEST + "realm=\"" + REALM + "\", nonce=\"" + NONCE + "\", qop=\"auth\"";
        return new Response(401, Map.of("WWW-Authenticate", List.of(challenge)), null);
    }

    private static boolean validDigest(Request request, Map<String, String> digest) {
        String path = request.pathAndQuery().split("\\?")[0];
        if (!USER.equals(digest.get("username")) || !REALM.equals(digest.get("realm")) || !NONCE.equals(digest.get("nonce"))
                || !path.equals(digest.get("uri"))) {
            return false;
        }
        String ha1 = md5(USER + ":" + REALM + ":" + PASSWORD);
        String ha2 = md5(request.method() + ":" + digest.get("uri"));
        String expected = md5(ha1 + ":" + NONCE + ":" + digest.get("nc") + ":" + digest.get("cnonce") + ":" + digest.get("qop") + ":" + ha2);
        return expected.equals(digest.get("response"));
    }

    private static Map<String, String> digestParameters(String authorization) {
        Map<String, String> parameters = new HashMap<>();
        Matcher matcher = DIGEST_PARAM.matcher(authorization.substring(DIGEST.length()));
        while (matcher.find()) {
            parameters.put(matcher.group(1), matcher.group(2) != null ? matcher.group(2) : matcher.group(3));
        }
        return parameters;
    }

    private static String md5(String text) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("MD5").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

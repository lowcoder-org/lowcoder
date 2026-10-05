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
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;

/**
 * Basic and digest authentication of {@link GraphQLExecutor} against a local server. The REST API plugin has the same
 * code and an engine test for it; the GraphQL plugin had none.
 *
 * <p>Pins, for the GraphQL executor (the same behaviour is pinned for REST in RestApiEngineTest; open, fix deferred
 * under D-6, plan section 9 row on digest authentication): with a wrong password a digest-authenticated query is not
 * answered "unauthorized"; the executor answers each new challenge until its request limit (5 in GraphQLExecutor) and
 * fails with the redirect-limit error.
 */
class GraphQLAuthTest {

    private static final String PATH = "/graphql";
    private static final String USER = "postman";
    private static final String PASSWORD = "password";
    private static final String REALM = "Users";
    private static final String NONCE = "f2a8d2c6b1e04a7f9c3d5e6b7a8c9d0e";
    private static final String DIGEST = "Digest ";
    private static final Pattern DIGEST_PARAM = Pattern.compile("(\\w+)=(?:\"([^\"]*)\"|([^,\\s]+))");
    /** {@code GraphQLExecutor.MAX_REDIRECTS} (private): calls 0 to 4 send a request, call 5 fails before sending one. */
    private static final int REQUEST_LIMIT = 5;

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
     * Pins the digest wrong-password behaviour for the GraphQL executor (see the class comment; the fix is deferred): the
     * server answers every attempt with a new challenge, the executor answers each one until its limit, and the query
     * fails with the redirect-limit error rather than an authentication failure. The obvious fix is to stop after a
     * challenge that follows an authenticated attempt, which turns this test red.
     */
    @Test
    void digestAuthWithAWrongPasswordRetriesUntilTheRequestLimitAndReportsTheRedirectLimit() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of(PATH, GraphQLAuthTest::digestServer))) {

            Throwable failure = support.failureOf(datasource(server, RestApiAuthType.DIGEST_AUTH, "wrong"), GraphQLCallSupport.query(),
                    GraphQLCallSupport.visitor(null, null));

            System.out.println("[GraphQLAuthTest] digest, wrong password: " + failure + " after " + server.requests().size() + " requests");
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("maximum HTTP redirects");
            assertThat(server.requests()).hasSize(REQUEST_LIMIT);
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

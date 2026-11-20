package org.lowcoder.plugin.graphql;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.SelfSignedCertificate;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The GraphQL executor against an HTTPS server with a self-signed certificate generated in the test
 * ({@link SelfSignedCertificate}, {@link RecordingHttpServer#startSecure}). The GraphQL datasource has no SSL setting (unlike
 * the REST API datasource: {@code GraphQLDatasourceConfig} has no {@code sslConfig}, and {@code GraphQLExecutor} builds its
 * WebClient without one), so the only mode is the JDK's default trust. The tests pin what that means: a self-signed server is
 * refused in the handshake and reaches no handler, also when the client sends the REST API datasource's
 * {@code sslConfig} with {@code DISABLED} (it is ignored, not applied); and the same server over plain HTTP, the control
 * of the same query on a {@link RecordingHttpServer}, is answered, so the refusal is the certificate's and not the query's.
 *
 * <p>Limits: no CA-signed certificate (the default trust is shown only by its refusal), no client certificate.
 */
public class GraphQLHttpsTest {

    static final String TAG = "[GraphQLHttpsTest] ";
    static final String PATH = "/graphql";
    static final String ANSWER_JSON = "{\"data\":{\"hero\":{\"name\":\"R2-D2\"}}}";
    static final String URL_KEY = "url";
    static final String SSL_KEY = "sslConfig";
    static final String TYPE_KEY = "sslCertVerificationType";
    static final String DISABLED = "DISABLED";
    static final int OK = 200;

    @TempDir
    static Path directory;
    private static RecordingHttpServer secure;
    private static RecordingHttpServer plain;

    private final GraphQLCallSupport calls = new GraphQLCallSupport();

    @BeforeAll
    static void startServers() {
        SelfSignedCertificate certificate = SelfSignedCertificate.generate(directory, "graphql");
        Response answer = new Response(OK, Map.of("Content-Type", List.of("application/json")), ANSWER_JSON.getBytes(StandardCharsets.UTF_8));
        secure = RecordingHttpServer.startSecure(certificate.serverContext(), Map.of(PATH, answer));
        plain = RecordingHttpServer.start(Map.of(PATH, answer));
        System.out.println(TAG + "HTTPS server on " + secure.baseUrl() + ", HTTP control on " + plain.baseUrl());
    }

    @AfterAll
    static void stopServers() {
        secure.close();
        plain.close();
    }

    private static GraphQLDatasourceConfig datasource(RecordingHttpServer server, Map<String, Object> sslConfig) {
        Map<String, Object> map = new HashMap<>();
        map.put(URL_KEY, server.baseUrl());
        if (sslConfig != null) {
            map.put(SSL_KEY, sslConfig);
        }
        return GraphQLDatasourceConfig.buildFrom(map);
    }

    private Throwable failureOver(Map<String, Object> sslConfig) {
        Throwable failure = calls.failureOf(datasource(secure, sslConfig), GraphQLCallSupport.query(Map.of("path", PATH)),
                GraphQLCallSupport.visitor(null, null));
        System.out.println(TAG + "sslConfig=" + sslConfig + " -> " + failure);
        return failure;
    }

    private static boolean causedByHandshake(Throwable failure) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            String text = t.getClass().getName() + " " + t.getMessage();
            if (text.contains("SSLHandshakeException") || text.contains("SSLException") || text.contains("PKIX") || text.contains("certificate")) {
                return true;
            }
        }
        return false;
    }

    @Test
    public void aSelfSignedServerIsRefusedByTheDefaultTrust() {
        int before = secure.requests().size();
        Throwable failure = failureOver(null);
        assertInstanceOf(Throwable.class, failure, "the call must fail");
        assertInstanceOf(PluginException.class, failure, "mapped to a PluginException: " + failure);
        assertTrue(causedByHandshake(failure), "the failure names the TLS handshake: " + failure + " / " + failure.getCause());
        assertEquals(before, secure.requests().size(), "a refused handshake reaches no handler");
    }

    @Test
    public void anSslConfigThatDisablesVerificationIsIgnoredBecauseTheDatasourceHasNoSslMode() {
        int before = secure.requests().size();
        Throwable failure = failureOver(Map.of(TYPE_KEY, DISABLED));
        assertInstanceOf(Throwable.class, failure, "DISABLED must not make the call succeed: the GraphQL datasource has no SSL setting");
        assertTrue(causedByHandshake(failure), "still a handshake failure: " + failure + " / " + failure.getCause());
        assertEquals(before, secure.requests().size(), "no request passed the handshake");
    }

    @Test
    public void theSameQueryOverPlainHttpIsAnswered() {
        var result = calls.run(datasource(plain, null), GraphQLCallSupport.query(Map.of("path", PATH)), GraphQLCallSupport.visitor(null, null));
        System.out.println(TAG + "plain HTTP control -> " + result.getQueryCode() + " " + result.getData());
        assertTrue(result.isSuccess(), "the control query succeeds: " + result);
        assertTrue(String.valueOf(result.getData()).contains("R2-D2"), "the answer body is returned: " + result.getData());
        assertEquals(1, plain.requests().size(), "one request reached the HTTP server");
        assertEquals("POST", plain.requests().get(0).method());
    }
}

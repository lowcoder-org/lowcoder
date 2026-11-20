package org.lowcoder.plugin.restapi;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.SelfSignedCertificate;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.ssl.DisableVerifySslConfig;
import org.lowcoder.sdk.plugin.common.ssl.SslCertVerificationType;
import org.lowcoder.sdk.plugin.common.ssl.VerifyCACertSslConfig;
import org.lowcoder.sdk.plugin.common.ssl.VerifySelfSignedCertSslConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The REST API executor against an HTTPS server with a self-signed certificate generated in the test
 * ({@link SelfSignedCertificate}, {@link RecordingHttpServer#startSecure}), once for each SSL mode the datasource offers
 * ({@code sslConfig.sslCertVerificationType}): the default (no {@code sslConfig}), {@code VERIFY_CA_CERT}, {@code DISABLED},
 * {@code VERIFY_SELF_SIGNED_CERT} with the server's certificate and with another certificate. The datasource is bound from
 * the JSON map the client sends ({@code RestApiDatasourceConfig.buildFrom}), so the polymorphic {@code sslConfig} binding is
 * part of the path. A request that passes the handshake is recorded by the server; one that is refused by it is not.
 *
 * <p>Limits: one self-signed certificate (CN=localhost, SAN 127.0.0.1); no CA-signed certificate, so "verify the CA" is
 * shown only by its refusal of the self-signed one; no client certificate.
 */
public class RestApiHttpsTest {

    static final String TAG = "[RestApiHttpsTest] ";
    static final String PATH = "/secure";
    static final String ANSWER_JSON = "{\"secure\":true}";
    static final String TYPE_KEY = "sslCertVerificationType";
    static final String CERT_KEY = "selfSignedCert";
    static final String SSL_KEY = "sslConfig";
    static final String URL_KEY = "url";
    static final int OK = 200;

    @TempDir
    static Path directory;
    private static SelfSignedCertificate serverCertificate;
    private static SelfSignedCertificate otherCertificate;
    private static RecordingHttpServer server;

    private final RestApiCallSupport calls = new RestApiCallSupport();

    @BeforeAll
    static void startServer() {
        serverCertificate = SelfSignedCertificate.generate(directory, "server");
        otherCertificate = SelfSignedCertificate.generate(directory, "other");
        server = RecordingHttpServer.startSecure(serverCertificate.serverContext(), Map.of(PATH,
                new Response(OK, Map.of("Content-Type", List.of("application/json")), ANSWER_JSON.getBytes(StandardCharsets.UTF_8))));
        System.out.println(TAG + "HTTPS server on " + server.baseUrl());
    }

    @AfterAll
    static void stopServer() {
        server.close();
    }

    private static RestApiDatasourceConfig datasource(Map<String, Object> sslConfig) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put(URL_KEY, server.baseUrl());
        if (sslConfig != null) {
            map.put(SSL_KEY, sslConfig);
        }
        return RestApiDatasourceConfig.buildFrom(map);
    }

    private Object call(Map<String, Object> sslConfig) {
        int before = server.requests().size();
        Object outcome;
        try {
            outcome = calls.run(datasource(sslConfig), Map.of("httpMethod", "GET", "path", PATH), RestApiCallSupport.visitor(null, null));
        } catch (RuntimeException e) {
            outcome = e;
        }
        System.out.println(TAG + "sslConfig=" + sslConfig + " -> " + outcome + " (requests recorded: " + (server.requests().size() - before) + ")");
        return outcome;
    }

    private static boolean causedBy(Throwable failure, String className) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            if (t.getClass().getName().contains(className) || String.valueOf(t.getMessage()).contains(className)) {
                return true;
            }
        }
        return false;
    }

    private void assertAnswered(Object outcome, int recordedBefore) {
        QueryExecutionResult result = assertInstanceOf(QueryExecutionResult.class, outcome, String.valueOf(outcome));
        assertTrue(result.isSuccess(), "the call over TLS succeeded: " + result);
        assertTrue(String.valueOf(result.getData()).contains("secure"), "the answer body is returned: " + result.getData());
        assertEquals(recordedBefore + 1, server.requests().size(), "the server recorded the request that passed the handshake");
    }

    private void assertRefused(Object outcome, int recordedBefore) {
        Throwable failure = assertInstanceOf(Throwable.class, outcome, "the call must fail, it returned " + outcome);
        assertInstanceOf(PluginException.class, failure, "the executor maps the failure to a PluginException: " + failure);
        assertTrue(causedBy(failure, "SSLHandshakeException") || causedBy(failure, "SSLException") || causedBy(failure, "PKIX")
                || causedBy(failure, "CertificateException") || causedBy(failure, "certificate"),
                "the failure names the TLS handshake: " + failure + " / " + failure.getCause());
        assertEquals(recordedBefore, server.requests().size(), "a refused handshake reaches no handler");
    }

    @Test
    public void withoutAnSslConfigTheDefaultTrustRefusesTheSelfSignedServer() {
        int before = server.requests().size();
        assertRefused(call(null), before);
    }

    @Test
    public void verifyCaCertRefusesTheSelfSignedServerLikeTheDefault() {
        int before = server.requests().size();
        assertRefused(call(Map.of(TYPE_KEY, SslCertVerificationType.VERIFY_CA_CERT.name())), before);
    }

    @Test
    public void disabledVerificationAcceptsTheSelfSignedServer() {
        RestApiDatasourceConfig bound = datasource(Map.of(TYPE_KEY, SslCertVerificationType.DISABLED.name()));
        assertInstanceOf(DisableVerifySslConfig.class, bound.getSslConfig(), "DISABLED binds to the disable-verification config");
        int before = server.requests().size();
        assertAnswered(call(Map.of(TYPE_KEY, SslCertVerificationType.DISABLED.name())), before);
    }

    @Test
    public void verifySelfSignedCertAcceptsTheServerWhoseCertificateIsGiven() {
        Map<String, Object> ssl = Map.of(TYPE_KEY, SslCertVerificationType.VERIFY_SELF_SIGNED_CERT.name(), CERT_KEY, serverCertificate.pem());
        RestApiDatasourceConfig bound = datasource(ssl);
        assertInstanceOf(VerifySelfSignedCertSslConfig.class, bound.getSslConfig(), "VERIFY_SELF_SIGNED_CERT binds to the pinned-certificate config");
        assertEquals(serverCertificate.pem(), ((VerifySelfSignedCertSslConfig) bound.getSslConfig()).getSelfSignedCert());
        int before = server.requests().size();
        assertAnswered(call(ssl), before);
    }

    @Test
    public void verifySelfSignedCertRefusesAServerWhoseCertificateIsNotTheGivenOne() {
        Map<String, Object> ssl = Map.of(TYPE_KEY, SslCertVerificationType.VERIFY_SELF_SIGNED_CERT.name(), CERT_KEY, otherCertificate.pem());
        int before = server.requests().size();
        assertRefused(call(ssl), before);
    }

    @Test
    public void anSslConfigWithoutATypeBindsToTheCaVerifyingDefault() {
        RestApiDatasourceConfig bound = datasource(Map.of());
        assertNotNull(bound.getSslConfig(), "an empty sslConfig object still binds");
        assertInstanceOf(VerifyCACertSslConfig.class, bound.getSslConfig(), "the default type is VERIFY_CA_CERT");
        int before = server.requests().size();
        assertRefused(call(Map.of()), before);
    }
}

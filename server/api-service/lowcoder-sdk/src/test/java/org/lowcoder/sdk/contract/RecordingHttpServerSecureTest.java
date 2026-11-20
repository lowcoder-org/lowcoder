package org.lowcoder.sdk.contract;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLException;
import javax.net.ssl.TrustManagerFactory;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The TLS variant of {@link RecordingHttpServer} with a certificate of {@link SelfSignedCertificate}: a client that trusts
 * only that certificate reads the answer and the server records the request; a client with the JDK's default trust refuses
 * the handshake, so the server never sees a request. The test is the proof that the variant really serves TLS and that the
 * generated certificate is the one the server presents.
 */
public class RecordingHttpServerSecureTest {

    static final String TAG = "[RecordingHttpServerSecureTest] ";
    static final String PATH = "/secure";
    static final String ANSWER = "over tls";
    static final String HTTPS_PREFIX = "https://127.0.0.1:";
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final int OK = 200;

    @TempDir
    static Path directory;
    private static SelfSignedCertificate certificate;

    @BeforeAll
    static void generate() {
        certificate = SelfSignedCertificate.generate(directory, "recording");
        System.out.println(TAG + "certificate PEM starts with " + certificate.pem().lines().findFirst().orElse("<empty>"));
    }

    private static Map<String, Response> answers() {
        return Map.of(PATH, new Response(OK, Map.of(), ANSWER.getBytes(StandardCharsets.UTF_8)));
    }

    private static SSLContext trusting(String pem) throws Exception {
        X509Certificate cert = (X509Certificate) CertificateFactory.getInstance("X.509")
                .generateCertificate(new ByteArrayInputStream(pem.getBytes(StandardCharsets.UTF_8)));
        KeyStore trust = KeyStore.getInstance(KeyStore.getDefaultType());
        trust.load(null, null);
        trust.setCertificateEntry("server", cert);
        TrustManagerFactory factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        factory.init(trust);
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(null, factory.getTrustManagers(), null);
        return context;
    }

    private static HttpResponse<String> get(HttpClient client, String url) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(url + PATH)).timeout(TIMEOUT).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    public void aClientTrustingTheGeneratedCertificateReadsTheAnswerAndTheRequestIsRecorded() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.startSecure(certificate.serverContext(), answers())) {
            assertTrue(server.baseUrl().startsWith(HTTPS_PREFIX), server.baseUrl());
            HttpClient client = HttpClient.newBuilder().sslContext(trusting(certificate.pem())).build();
            HttpResponse<String> response = get(client, server.baseUrl());
            System.out.println(TAG + server.baseUrl() + PATH + " -> " + response.statusCode() + " " + response.body());
            assertEquals(OK, response.statusCode());
            assertEquals(ANSWER, response.body());
            List<RecordingHttpServer.Request> requests = server.requests();
            assertEquals(1, requests.size(), "the server recorded exactly the one request: " + requests);
            assertEquals(PATH, requests.get(0).pathAndQuery());
        }
    }

    @Test
    public void aClientWithTheDefaultTrustRefusesTheSelfSignedHandshakeSoNoRequestIsRecorded() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.startSecure(certificate.serverContext(), answers())) {
            HttpClient client = HttpClient.newHttpClient();
            Exception failure = assertThrows(Exception.class, () -> get(client, server.baseUrl()));
            System.out.println(TAG + "default trust -> " + failure);
            assertInstanceOf(SSLException.class, failure.getCause() == null ? failure : failure.getCause(), failure.toString());
            assertEquals(0, server.requests().size(), "a refused handshake reaches no handler: " + server.requests());
        }
    }

    @Test
    public void aCertificateOfAnotherGenerationIsNotTheOneTheServerPresents() throws Exception {
        SelfSignedCertificate other = SelfSignedCertificate.generate(directory, "other");
        assertNotNull(other.pem());
        assertNotEquals(certificate.pem(), other.pem(), "two generations give two certificates");
        try (RecordingHttpServer server = RecordingHttpServer.startSecure(certificate.serverContext(), answers())) {
            HttpClient client = HttpClient.newBuilder().sslContext(trusting(other.pem())).build();
            Exception failure = assertThrows(Exception.class, () -> get(client, server.baseUrl()));
            System.out.println(TAG + "trusting the other certificate -> " + failure);
            assertEquals(0, server.requests().size(), "no request passed a handshake against an untrusted certificate");
        }
    }
}

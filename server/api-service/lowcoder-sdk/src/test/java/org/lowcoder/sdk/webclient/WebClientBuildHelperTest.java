package org.lowcoder.sdk.webclient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.common.ssl.DisableVerifySslConfig;
import org.lowcoder.sdk.plugin.common.ssl.SslCertVerificationType;
import org.lowcoder.sdk.plugin.common.ssl.VerifySelfSignedCertSslConfig;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.core.io.buffer.DataBufferLimitException;

import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsServer;

/**
 * {@link WebClientBuildHelper} against local servers only (loopback, port 0): the response and read timeout, the in-memory
 * size limit, the three TLS verification modes, and what the disallowed-hosts resolver does today. The self-signed
 * certificates are generated when the class starts with the JDK's {@code keytool} (SAN 127.0.0.1 and localhost) in a temporary
 * directory: no key or certificate is committed.
 *
 * <p>Not covered, and why: the {@code systemProxy} block (WebClientBuildHelper.java, the {@code http.proxy*} system properties
 * are read once in a static initializer, so the block is reachable only in a JVM started with them; accepted as unreachable
 * in this JVM, ruled), and the connect timeout (it is only configured; there is no unroutable address to test it with).
 */
public class WebClientBuildHelperTest {

    private static final String OK = "ok";
    private static final String STORE_PASSWORD = "changeit";
    private static final Duration WAIT = Duration.ofSeconds(20);

    @TempDir
    static Path directory;
    private static Path firstStore;
    private static String firstPem;
    private static String secondPem;
    private HttpsServer https;

    @BeforeAll
    static void generateCertificates() throws Exception {
        firstStore = directory.resolve("first.p12");
        firstPem = generate(firstStore);
        secondPem = generate(directory.resolve("second.p12"));
    }

    private static String generate(Path store) throws Exception {
        String keytool = Path.of(System.getProperty("java.home"), "bin", "keytool").toString();
        run(keytool, "-genkeypair", "-alias", "test", "-keyalg", "RSA", "-keysize", "2048", "-dname", "CN=localhost", "-ext",
                "san=ip:127.0.0.1,dns:localhost", "-validity", "1", "-storetype", "PKCS12", "-keystore", store.toString(),
                "-storepass", STORE_PASSWORD, "-keypass", STORE_PASSWORD);
        return run(keytool, "-exportcert", "-alias", "test", "-rfc", "-keystore", store.toString(), "-storepass", STORE_PASSWORD);
    }

    private static String run(String... command) throws Exception {
        Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
        String output;
        try (InputStream in = process.getInputStream()) {
            output = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        assertTrue(process.waitFor(60, TimeUnit.SECONDS));
        assertEquals(0, process.exitValue(), String.join(" ", command) + "\n" + output);
        return output;
    }

    private String startHttps() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream in = Files.newInputStream(firstStore)) {
            keyStore.load(in, STORE_PASSWORD.toCharArray());
        }
        KeyManagerFactory keyManagers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        keyManagers.init(keyStore, STORE_PASSWORD.toCharArray());
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(keyManagers.getKeyManagers(), null, null);
        https = HttpsServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        https.setHttpsConfigurator(new HttpsConfigurator(context));
        https.createContext("/", exchange -> {
            byte[] body = OK.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        https.start();
        return "https://127.0.0.1:" + https.getAddress().getPort() + "/";
    }

    @AfterEach
    void stopHttps() {
        if (https != null) {
            https.stop(0);
            https = null;
        }
    }

    private static String get(WebClient client, String url) {
        return client.get().uri(url).retrieve().bodyToMono(String.class).block(WAIT);
    }

    private static boolean causedBy(Throwable failure, String className) {
        for (Throwable t = failure; t != null; t = t.getCause()) {
            if (t.getClass().getName().contains(className)) {
                return true;
            }
        }
        return false;
    }

    @Test
    public void aDefaultClientReadsAnAnswerOverPlainHttp() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/x", new Response(200, Map.of(), OK.getBytes(StandardCharsets.UTF_8))))) {
            assertEquals(OK, get(WebClientBuildHelper.builder().build(), server.baseUrl() + "/x"));
            assertEquals(OK, get(WebClientBuildHelper.builder().toWebClientBuilder().build(), server.baseUrl() + "/x"));
        }
    }

    @Test
    public void anAnswerSlowerThanTheTimeoutFailsAndTheSameAnswerArrivesWithoutOne() {
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of("/slow", request -> {
            try {
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return new Response(200, Map.of(), OK.getBytes(StandardCharsets.UTF_8));
        }))) {
            WebClientRequestException failure = assertThrows(WebClientRequestException.class,
                    () -> get(WebClientBuildHelper.builder().timeoutMs(300).build(), server.baseUrl() + "/slow"));

            System.out.println("[WebClientBuildHelperTest] timeout 300 ms against a 1500 ms answer -> " + failure.getMessage());
            assertTrue(causedBy(failure, "ReadTimeoutException") || causedBy(failure, "TimeoutException") || failure.getMessage().toLowerCase().contains("timeout"),
                    failure.toString());
            assertEquals(OK, get(WebClientBuildHelper.builder().timeoutMs(10_000).build(), server.baseUrl() + "/slow"));
            assertEquals(OK, get(WebClientBuildHelper.builder().build(), server.baseUrl() + "/slow"));
        }
    }

    @Test
    public void aBodyLargerThanTheInMemoryLimitFailsAndASmallerOneIsRead() {
        byte[] body = "x".repeat(2000).getBytes(StandardCharsets.UTF_8);
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/big", new Response(200, Map.of(), body)))) {
            Throwable failure = assertThrows(Throwable.class, () -> get(WebClientBuildHelper.builder().maxInMemorySize(1000).build(), server.baseUrl() + "/big"));

            System.out.println("[WebClientBuildHelperTest] limit 1000 bytes, body 2000 -> " + failure);
            assertTrue(causedBy(failure, DataBufferLimitException.class.getSimpleName()), failure.toString());
            assertEquals(2000, get(WebClientBuildHelper.builder().maxInMemorySize(4000).build(), server.baseUrl() + "/big").length());
            assertEquals(2000, get(WebClientBuildHelper.builder().build(), server.baseUrl() + "/big").length(), "the default limit is 20 MB");
        }
    }

    @Test
    public void aSelfSignedServerIsRejectedByDefaultAcceptedWhenVerificationIsDisabledAndWhenItsCertificateIsGiven() throws Exception {
        String url = startHttps();

        Throwable rejected = assertThrows(Throwable.class, () -> get(WebClientBuildHelper.builder().build(), url));
        System.out.println("[WebClientBuildHelperTest] default client -> " + rejected.getClass().getSimpleName() + ": " + rejected.getMessage());
        assertTrue(causedBy(rejected, "SSLHandshakeException") || causedBy(rejected, "SSLException") || causedBy(rejected, "CertificateException"), rejected.toString());

        WebClient disabled = WebClientBuildHelper.builder()
                .sslConfig(DisableVerifySslConfig.builder().sslCertVerificationType(SslCertVerificationType.DISABLED).build()).build();
        assertEquals(OK, get(disabled, url));

        WebClient pinned = WebClientBuildHelper.builder().sslConfig(selfSigned(firstPem)).build();
        assertEquals(OK, get(pinned, url));
    }

    @Test
    public void aDifferentOrUnparsableCertificateDoesNotTrustTheServer() throws Exception {
        String url = startHttps();

        Throwable other = assertThrows(Throwable.class, () -> get(WebClientBuildHelper.builder().sslConfig(selfSigned(secondPem)).build(), url));
        Throwable garbage = assertThrows(Throwable.class, () -> get(WebClientBuildHelper.builder().sslConfig(selfSigned("not a certificate at all")).build(), url));

        System.out.println("[WebClientBuildHelperTest] other certificate -> " + other.getClass().getSimpleName() + "; garbage -> falls back to the default client: " + garbage.getClass().getSimpleName());
        assertTrue(causedBy(other, "SSLHandshakeException") || causedBy(other, "SSLException"), other.toString());
        assertTrue(causedBy(garbage, "SSLHandshakeException") || causedBy(garbage, "SSLException"), "the unparsable certificate is logged and the default verification applies");
    }

    @Test
    public void aBlankCertificateIsRejectedWhenTheClientIsBuilt() {
        BizException failure = assertThrows(BizException.class, () -> WebClientBuildHelper.builder().sslConfig(selfSigned(" ")).build());

        assertEquals("CERTIFICATE_EMPTY", failure.getMessageKey());
    }

    /**
     * Observation (the guard is {@link SafeHostResolverGroup}; its bypass for a literal address is the pinned L4-10 row "SSRF
     * guard bypass"): with {@code disallowedHosts} set, a request by NAME to a listed host does not reach the server, and a
     * request to the same server by its literal address, which Reactor Netty does not resolve, still does.
     */
    @Test
    public void aListedNameIsRefusedBeforeAnyRequestAndTheLiteralAddressIsStillReached() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/x", new Response(200, Map.of(), OK.getBytes(StandardCharsets.UTF_8))))) {
            WebClient guarded = WebClientBuildHelper.builder().disallowedHosts(Set.of("localhost")).build();
            String byName = "http://localhost:" + server.port() + "/x";

            Throwable refused = assertThrows(Throwable.class, () -> get(guarded, byName));
            int afterName = server.requests().size();
            String byAddress = get(guarded, server.baseUrl() + "/x");

            System.out.println("[WebClientBuildHelperTest] by name -> " + refused.getClass().getSimpleName() + ": " + refused.getMessage()
                    + "; requests at my server after it " + afterName + "; by literal address -> " + byAddress + ", requests " + server.requests().size());
            assertEquals(0, afterName, "the listed name never reached the server");
            assertEquals(OK, byAddress);
            assertEquals(1, server.requests().size());
            assertEquals(List.of("/x"), server.requests().stream().map(r -> r.pathAndQuery()).toList());
        }
    }

    private static VerifySelfSignedCertSslConfig selfSigned(String certificate) {
        return VerifySelfSignedCertSslConfig.builder().sslCertVerificationType(SslCertVerificationType.VERIFY_SELF_SIGNED_CERT)
                .selfSignedCert(certificate).build();
    }
}

package org.lowcoder.plugins;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.lowcoder.sdk.contract.ContainerImages;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.utility.DockerImageName;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The two smtp4dev containers of the SMTP STARTTLS tests (default build, not heavy-container: started once per test JVM on
 * first use, in parallel, removed by Testcontainers' reaper when the JVM exits): {@link #STARTTLS}, whose server offers
 * STARTTLS with the self-signed certificate smtp4dev generates at start ({@code ServerOptions__TlsMode=StartTls}), and
 * {@link #PLAIN}, the control that offers no TLS ({@code None}). No file is copied into either. Messages the servers received are
 * read from smtp4dev's HTTP API ({@code /api/messages}); {@link #capabilities} asks a server what its EHLO answer advertises.
 * A generic container, as elsewhere in this module's siblings. No Docker guard on purpose (owner decision D-7). Not a test.
 */
final class Smtp4DevContainerSupport {

    static final int SMTP_PORT = 25;
    static final int HTTP_PORT = 80;
    static final String TLS_MODE_ENV = "ServerOptions__TlsMode";
    static final String TLS_MODE_STARTTLS = "StartTls";
    static final String TLS_MODE_NONE = "None";
    static final String MESSAGES_PATH = "/api/messages";
    static final String STARTTLS_CAPABILITY = "STARTTLS";
    private static final String EHLO_NAME = "test.local";
    private static final int CONNECT_TIMEOUT_MILLIS = 5000;
    private static final int READ_TIMEOUT_MILLIS = 10_000;
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);
    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(10);
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newHttpClient();

    private Smtp4DevContainerSupport() {
    }

    /** A started smtp4dev and the ways to reach it. */
    static final class Server {
        private final GenericContainer<?> container;
        private final String name;

        private Server(String name, String tlsMode) {
            this.name = name;
            this.container = new GenericContainer<>(DockerImageName.parse(ContainerImages.SMTP4DEV_3_6))
                    .withEnv(TLS_MODE_ENV, tlsMode).withExposedPorts(SMTP_PORT, HTTP_PORT)
                    .waitingFor(Wait.forHttp(MESSAGES_PATH).forPort(HTTP_PORT).forStatusCode(200).withStartupTimeout(START_TIMEOUT));
        }

        String host() {
            return container.getHost();
        }

        int smtpPort() {
            return container.getMappedPort(SMTP_PORT);
        }

        /** The datasource config map of this server, without credentials (smtp4dev accepts any sender and needs no login). */
        Map<String, Object> configMap() {
            return Map.of("host", host(), "port", smtpPort());
        }

        /** The subjects of the messages the server has stored, in the order its API lists them. */
        List<String> subjects() {
            try {
                HttpResponse<String> response = HTTP.send(HttpRequest.newBuilder(URI.create("http://" + host() + ":"
                        + container.getMappedPort(HTTP_PORT) + MESSAGES_PATH)).timeout(HTTP_TIMEOUT).GET().build(),
                        HttpResponse.BodyHandlers.ofString());
                JsonNode results = JSON.readTree(response.body()).path("results");
                List<String> subjects = new ArrayList<>();
                results.forEach(message -> subjects.add(message.path("subject").asText()));
                return subjects;
            } catch (IOException e) {
                throw new UncheckedIOException("cannot read the messages of " + name, e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("interrupted while reading the messages of " + name, e);
            }
        }

        /** The capability lines of the server's answer to EHLO, read over a plain socket (the part of the answer after "250-" or "250 "). */
        List<String> capabilities() {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(host(), smtpPort()), CONNECT_TIMEOUT_MILLIS);
                socket.setSoTimeout(READ_TIMEOUT_MILLIS);
                BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.US_ASCII));
                in.readLine();
                socket.getOutputStream().write(("EHLO " + EHLO_NAME + "\r\n").getBytes(StandardCharsets.US_ASCII));
                socket.getOutputStream().flush();
                List<String> capabilities = new ArrayList<>();
                String line;
                while ((line = in.readLine()) != null) {
                    capabilities.add(line.substring(4));
                    if (line.charAt(3) == ' ') {
                        break;
                    }
                }
                return capabilities;
            } catch (IOException e) {
                throw new UncheckedIOException("cannot read the EHLO answer of " + name, e);
            }
        }

        @Override
        public String toString() {
            return name + " " + host() + ":" + smtpPort();
        }
    }

    static final Server STARTTLS;
    static final Server PLAIN;

    static {
        long start = System.nanoTime();
        Server starttls = new Server("smtp4dev-starttls", TLS_MODE_STARTTLS);
        Server plain = new Server("smtp4dev-plain", TLS_MODE_NONE);
        Startables.deepStart(starttls.container, plain.container).join();
        STARTTLS = starttls;
        PLAIN = plain;
        System.out.println("[Smtp4DevContainerSupport] " + ContainerImages.SMTP4DEV_3_6 + " started twice in "
                + (System.nanoTime() - start) / 1_000_000 + " ms: " + STARTTLS + ", " + PLAIN);
    }
}

package org.lowcoder.plugins;

import com.icegreen.greenmail.util.GreenMail;
import jakarta.mail.Session;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.models.DatasourceTestResult;

import java.net.ServerSocket;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugins.SmtpGreenMailSupport.LOGIN;
import static org.lowcoder.plugins.SmtpGreenMailSupport.LOOPBACK;
import static org.lowcoder.plugins.SmtpGreenMailSupport.PASSWORD;
import static org.lowcoder.plugins.SmtpGreenMailSupport.configMap;

/**
 * Unit SM-2 (task L5-10): {@code SmtpEngine.testConnection}, {@code createConnection} and {@code destroyConnection} against a
 * real SMTP server (GreenMail, {@link SmtpGreenMailSupport}): good and bad credentials, the no-user branch, an unreachable port,
 * the session's port setting, and closing the transport.
 *
 * <p>Limits: plain SMTP only; the unreachable port is one that was free a moment ago (a closed server socket), so another
 * process could in theory be listening on it; the test would then report a connection that succeeds.
 */
public class SmtpEngineConnectionTest {

    static final String TAG = "[SmtpEngineConnectionTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final int DEFAULT_SMTP_PORT = 25;
    static final long WAIT_MILLIS = 10_000;

    private static GreenMail server;
    private final SmtpEngine engine = new SmtpEngine();

    @BeforeAll
    static void start() {
        server = SmtpGreenMailSupport.startAuthenticating();
    }

    @AfterAll
    static void stop() {
        server.stop();
    }

    private DatasourceTestResult test(String label, Map<String, Object> config) {
        DatasourceTestResult result = engine.testConnection(engine.resolveConfig(config)).block(BLOCK_TIMEOUT);
        System.out.println(TAG + label + ": success=" + result.isSuccess() + (result.isSuccess() ? "" : " message=" + result.getInvalidMessage(Locale.ENGLISH)));
        return result;
    }

    @Test
    public void correctCredentialsSucceedAndWrongOnesFail() {
        assertTrue(test("good credentials", configMap(server, LOGIN, PASSWORD)).isSuccess());
        assertFalse(test("wrong password", configMap(server, LOGIN, "wrong")).isSuccess());
        assertFalse(test("unknown user", configMap(server, "nobody", PASSWORD)).isSuccess());
    }

    /**
     * Observation: an empty user name (the form leaves the field as typed: an emptied field is the empty string) takes the with-credentials
     * connect, which an authenticating server refuses. A user name that is absent altogether: see
     * {@link #noUserNameConnectsAndSendsWithoutCredentialsBF125} and {@link SmtpEngineOpenRelayTest} (BF-125).
     */
    @Test
    public void emptyUserNameAgainstAnAuthenticatingServerFails() {
        assertFalse(test("empty user", configMap(server, "", "")).isSuccess());
    }

    /**
     * BF-125: a config without a user name used to fail with a NullPointerException before connecting. It now connects without
     * credentials ({@code mail.smtp.auth} off), so the test and a send reach the server. Limits: this GreenMail server, though it
     * has a configured user, accepts mail without AUTH, so the test shows only that no credentials are needed to get there; a
     * server that requires AUTH refuses the mail with its own error, which is not reproduced here.
     */
    @Test
    public void noUserNameConnectsAndSendsWithoutCredentialsBF125() {
        Map<String, Object> config = configMap(server, null, null);
        assertTrue(test("no user", config).isSuccess());

        Session session = engine.createConnection(engine.resolveConfig(config)).block(BLOCK_TIMEOUT);
        Map<String, Object> query = new java.util.HashMap<>();
        query.put("from", "sender@example.com");
        query.put("to", "[\"rcpt@example.com\"]");
        query.put("subject", "no user");
        query.put("content", "x");
        int before = server.getReceivedMessages().length;
        var result = engine.executeQuery(session, engine.buildQueryExecutionContext(engine.resolveConfig(config), query, Map.of(), null)).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "no user: send " + result.getQueryCode());
        assertEquals("OK", result.getQueryCode());
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, before + 1), "the mail reaches the server");
    }

    @Test
    public void unreachablePortGivesAFailedResult() throws Exception {
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        Map<String, Object> config = new java.util.HashMap<>(configMap(server, LOGIN, PASSWORD));
        config.put("port", closedPort);
        assertFalse(test("closed port " + closedPort, config).isSuccess());
    }

    /**
     * BF-126: a session holds no connection ({@code Session.getTransport()} returns a new transport object on every call, and a
     * query sends with {@code Transport.send}, which closes its own), so {@code destroyConnection} has nothing to close and
     * completes empty, any number of times. It used to close a fresh transport that was never connected.
     */
    @Test
    public void destroyConnectionHasNothingToCloseAndCanRunTwiceBF126() throws Exception {
        Session session = engine.createConnection(engine.resolveConfig(configMap(server, LOGIN, PASSWORD))).block(BLOCK_TIMEOUT);
        assertNotNull(session);
        assertFalse(session.getTransport() == session.getTransport(), "every getTransport call is a new object");
        assertNull(engine.destroyConnection(session).block(BLOCK_TIMEOUT));
        assertNull(engine.destroyConnection(session).block(BLOCK_TIMEOUT));
    }

    /**
     * BF-126: {@code testConnection} connected {@code session.getTransport()} and never closed it, and the clean-up closed
     * another, fresh transport, so the tested connection stayed open until the garbage collector or the server dropped it. A
     * recording server shows the client now ends the tested connection with {@code QUIT}, which {@code Transport.close} sends.
     */
    @Test
    public void testConnectionClosesTheTransportItConnectedBF126() throws Exception {
        try (QuitRecordingSmtpServer recording = QuitRecordingSmtpServer.start()) {
            Map<String, Object> config = new java.util.HashMap<>();
            config.put("host", LOOPBACK);
            config.put("port", recording.port());

            assertTrue(test("recording server", config).isSuccess());

            boolean quit = recording.awaitQuit(WAIT_MILLIS);
            System.out.println(TAG + "commands the recording server saw: " + recording.commands());
            assertTrue(quit, "the tested connection is ended with QUIT: " + recording.commands());
        }
    }

    /**
     * BF-126: {@code closeQuietly} closes only a connected transport, and a close that fails does not escape (the test's answer
     * stays the connect's).
     */
    @Test
    public void closeQuietlyClosesAConnectedTransportAndSwallowsACloseFailureBF126() {
        java.util.concurrent.atomic.AtomicInteger closes = new java.util.concurrent.atomic.AtomicInteger();
        SmtpEngine.closeQuietly(transport(false, closes, false));
        assertEquals(0, closes.get(), "a transport that is not connected is not closed");
        SmtpEngine.closeQuietly(transport(true, closes, false));
        assertEquals(1, closes.get(), "a connected transport is closed");
        SmtpEngine.closeQuietly(transport(true, closes, true));
        assertEquals(2, closes.get(), "a failing close was attempted and did not escape");
        System.out.println(TAG + "closeQuietly: " + closes.get() + " closes, the failing one swallowed");
    }

    private static jakarta.mail.Transport transport(boolean connected, java.util.concurrent.atomic.AtomicInteger closes, boolean closeFails) {
        return new jakarta.mail.Transport(Session.getInstance(new java.util.Properties()), null) {
            @Override
            public boolean isConnected() {
                return connected;
            }

            @Override
            public synchronized void close() throws jakarta.mail.MessagingException {
                closes.incrementAndGet();
                if (closeFails) {
                    throw new jakarta.mail.MessagingException("close failed");
                }
            }

            @Override
            public void sendMessage(jakarta.mail.Message message, jakarta.mail.Address[] addresses) {
                throw new UnsupportedOperationException("not used");
            }
        };
    }

    /**
     * A one-connection SMTP server on the loopback that answers the greeting, EHLO and QUIT and records each command line, so a
     * test can see whether the client closed the connection (the client sends QUIT). No STARTTLS or AUTH is offered.
     */
    private static final class QuitRecordingSmtpServer implements AutoCloseable {

        private final ServerSocket socket;
        private final List<String> commands = new java.util.concurrent.CopyOnWriteArrayList<>();
        private final java.util.concurrent.CountDownLatch quit = new java.util.concurrent.CountDownLatch(1);
        private final Thread worker;

        private QuitRecordingSmtpServer(ServerSocket socket) {
            this.socket = socket;
            this.worker = new Thread(this::serveOne, "quit-recording-smtp");
            this.worker.setDaemon(true);
        }

        static QuitRecordingSmtpServer start() throws java.io.IOException {
            QuitRecordingSmtpServer server = new QuitRecordingSmtpServer(new ServerSocket(0, 1, java.net.InetAddress.getByName(LOOPBACK)));
            server.worker.start();
            return server;
        }

        int port() {
            return socket.getLocalPort();
        }

        List<String> commands() {
            return commands;
        }

        boolean awaitQuit(long millis) throws InterruptedException {
            return quit.await(millis, java.util.concurrent.TimeUnit.MILLISECONDS);
        }

        private void serveOne() {
            try (java.net.Socket client = socket.accept();
                 java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(client.getInputStream(), java.nio.charset.StandardCharsets.US_ASCII));
                 java.io.Writer out = new java.io.OutputStreamWriter(client.getOutputStream(), java.nio.charset.StandardCharsets.US_ASCII)) {
                reply(out, "220 recording ESMTP");
                String line;
                while ((line = in.readLine()) != null) {
                    commands.add(line);
                    String verb = line.split(" ", 2)[0].toUpperCase(Locale.ROOT);
                    if (verb.equals("QUIT")) {
                        reply(out, "221 bye");
                        quit.countDown();
                        return;
                    }
                    reply(out, "250 ok");
                }
            } catch (java.io.IOException e) {
                commands.add("server error: " + e);
            }
        }

        private static void reply(java.io.Writer out, String line) throws java.io.IOException {
            out.write(line + "\r\n");
            out.flush();
        }

        @Override
        public void close() throws java.io.IOException {
            socket.close();
        }
    }

    @Test
    public void sessionCarriesHostPortAndAuthSettings() {
        Session session = engine.createConnection(engine.resolveConfig(configMap(server, LOGIN, PASSWORD))).block(BLOCK_TIMEOUT);
        assertEquals(LOOPBACK, session.getProperty("mail.smtp.host"));
        assertEquals(server.getSmtp().getPort(), session.getProperties().get("mail.smtp.port"));
        assertEquals(true, session.getProperties().get("mail.smtp.auth"));
        assertEquals(LOGIN, session.getProperty("mail.smtp.username"));
        assertEquals("smtp", session.getProperty("mail.transport.protocol"));
    }

    @Test
    public void portZeroOrNegativeFallsBackToTheDefaultSmtpPort() {
        for (int port : new int[] {0, -1}) {
            Map<String, Object> config = new java.util.HashMap<>(configMap(server, LOGIN, PASSWORD));
            config.put("port", port);
            Session session = engine.createConnection(engine.resolveConfig(config)).block(BLOCK_TIMEOUT);
            assertEquals(DEFAULT_SMTP_PORT, session.getProperties().get("mail.smtp.port"), "port " + port);
        }
    }
}

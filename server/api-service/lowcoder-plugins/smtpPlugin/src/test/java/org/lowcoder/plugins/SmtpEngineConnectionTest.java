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
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
     * connect, which an authenticating server refuses. A user name that is absent altogether does not get that far: see
     * {@link SmtpEngineOpenRelayTest} (D19).
     */
    @Test
    public void emptyUserNameAgainstAnAuthenticatingServerFails() {
        assertFalse(test("empty user", configMap(server, "", "")).isSuccess());
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

    @Test
    public void destroyConnectionClosesTheTransportAndCanRunTwice() {
        Session session = engine.createConnection(engine.resolveConfig(configMap(server, LOGIN, PASSWORD))).block(BLOCK_TIMEOUT);
        assertNotNull(session);
        engine.destroyConnection(session).block(BLOCK_TIMEOUT);
        engine.destroyConnection(session).block(BLOCK_TIMEOUT);
    }

    /**
     * Observation (reported to the coordinator): {@code Session.getTransport()} returns a new transport object on every call, so
     * the transport that {@code testConnection} connects and the one {@code destroyConnection} closes are different objects: the
     * close is a no-op on a transport that was never connected, and the connected one is left to the garbage collector. The
     * mutation that removes the close call survives for the same reason.
     */
    @Test
    public void everyGetTransportCallIsANewObjectSoDestroyDoesNotCloseTheTestedConnection() throws Exception {
        Session session = engine.createConnection(engine.resolveConfig(configMap(server, LOGIN, PASSWORD))).block(BLOCK_TIMEOUT);
        jakarta.mail.Transport first = session.getTransport();
        first.connect(LOGIN, PASSWORD);
        try {
            assertTrue(first.isConnected());
            assertFalse(session.getTransport() == first);
            engine.destroyConnection(session).block(BLOCK_TIMEOUT);
            assertTrue(first.isConnected(), "destroyConnection did not close the connected transport");
        } finally {
            first.close();
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

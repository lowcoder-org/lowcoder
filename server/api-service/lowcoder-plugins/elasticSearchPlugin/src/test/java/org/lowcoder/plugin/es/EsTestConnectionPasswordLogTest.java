package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.ServerSocket;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.slf4j.LoggerFactory;

/**
 * BF-026 b (probe EP4; plan section 9 row "secret in log: failed ES testConnection logs toJson(config) with the plaintext
 * password"): {@code EsConnector.testConnection} logs the config at ERROR when the answer is not 200 (EsConnector.java:165,
 * "test es fail.") and when the call fails (:169, "test es error."), now in the {@code JsonViews.Public} view, which leaves
 * out the {@code JsonViews.Internal} password; connection string and user name are still logged. Limit: credentials
 * written into the connection string itself ({@code http://user:pass@host}) are logged with it. Only my own loopback
 * server on port 0 (and a port I opened and closed) is contacted.
 */
public class EsTestConnectionPasswordLogTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String USER = "elastic";
    private static final String PASSWORD = "s3cret-for-log";

    private final EsConnector connector = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
    private final Logger connectorLogger = (Logger) LoggerFactory.getLogger(EsConnector.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    public void captureLog() {
        logs.start();
        connectorLogger.addAppender(logs);
    }

    @AfterEach
    public void releaseLog() {
        connectorLogger.detachAppender(logs);
        logs.stop();
    }

    private List<ILoggingEvent> errors() {
        logs.list.forEach(event -> System.out.println("[EsTestConnectionPasswordLogTest] " + event.getLevel() + " "
                + event.getFormattedMessage().replace(PASSWORD, "<<PASSWORD>>") + (event.getFormattedMessage().contains(PASSWORD) ? "  [contains the password]" : "")));
        return logs.list.stream().filter(event -> event.getLevel() == Level.ERROR).collect(Collectors.toList());
    }

    private static void assertNoPasswordButTheConnection(ILoggingEvent event, String prefix) {
        String message = event.getFormattedMessage();
        assertTrue(message.startsWith(prefix), message);
        assertFalse(message.contains(PASSWORD), "no password in the log: " + message);
        assertFalse(message.contains("\"password\""), "no password field in the logged config: " + message);
        assertTrue(message.contains("\"username\":\"" + USER + "\""), "the user name is still logged: " + message);
    }

    @Test
    public void aNon200AnswerLogsTheConfigWithoutThePasswordBF026() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(204, Map.of(), null)))) {

            DatasourceTestResult result = connector.testConnection(
                    connector.resolveConfig(Map.of("connectionString", server.baseUrl(), "username", USER, "password", PASSWORD))).block(TIMEOUT);

            assertFalse(result.isSuccess());
            List<ILoggingEvent> errors = errors();
            assertEquals(1, errors.size(), "one ERROR event");
            assertNoPasswordButTheConnection(errors.get(0), "test es fail.");
            assertTrue(errors.get(0).getFormattedMessage().contains(server.baseUrl()));
        }
    }

    @Test
    public void aFailedCallLogsTheConfigWithoutThePasswordBF026() throws Exception {
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }

        DatasourceTestResult result = connector.testConnection(
                connector.resolveConfig(Map.of("connectionString", "127.0.0.1:" + closedPort, "username", USER, "password", PASSWORD))).block(TIMEOUT);

        assertFalse(result.isSuccess());
        List<ILoggingEvent> errors = errors();
        assertEquals(1, errors.size(), "exactly one ERROR event");
        assertNoPasswordButTheConnection(errors.get(0), "test es error.");
    }
}

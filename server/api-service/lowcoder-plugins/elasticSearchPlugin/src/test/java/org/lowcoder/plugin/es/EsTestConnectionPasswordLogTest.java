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
 * DEFECT pinned (probe EP4; plan section 9 row "secret in log: failed ES testConnection logs toJson(config) with the
 * plaintext password (:162, :166)", D8-adjacent; D-6, fix deferred). {@code EsConnector.testConnection} logs
 * {@code JsonUtils.toJson(connectionConfig)} at ERROR when the answer is not 200 (EsConnector.java:164, "test es
 * fail.") and when the call fails (:168, "test es error."). The JSON contains the plaintext password because no Jackson
 * view is active. The fix (log without the config, or with the password masked) makes the contains-password assertions
 * red. Only my own loopback server on port 0 (and a port I opened and closed) is contacted.
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

    private List<ILoggingEvent> errorsWithPassword() {
        logs.list.forEach(event -> System.out.println("[EsTestConnectionPasswordLogTest] " + event.getLevel() + " "
                + event.getFormattedMessage().replace(PASSWORD, "<<PASSWORD>>") + (event.getFormattedMessage().contains(PASSWORD) ? "  [contains the password]" : "")));
        return logs.list.stream().filter(event -> event.getLevel() == Level.ERROR && event.getFormattedMessage().contains(PASSWORD)).collect(Collectors.toList());
    }

    @Test
    public void aNon200AnswerLogsTheWholeConfigIncludingThePasswordAtErrorD8() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(204, Map.of(), null)))) {

            DatasourceTestResult result = connector.testConnection(
                    connector.resolveConfig(Map.of("connectionString", server.baseUrl(), "username", USER, "password", PASSWORD))).block(TIMEOUT);

            assertFalse(result.isSuccess());
            List<ILoggingEvent> leaking = errorsWithPassword();
            assertEquals(1, leaking.size(), "one ERROR event carries the password");
            assertTrue(leaking.get(0).getFormattedMessage().startsWith("test es fail."), leaking.get(0).getFormattedMessage());
            assertTrue(leaking.get(0).getFormattedMessage().contains(server.baseUrl()));
        }
    }

    @Test
    public void aFailedCallLogsTheWholeConfigIncludingThePasswordAtErrorD8() throws Exception {
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }

        DatasourceTestResult result = connector.testConnection(
                connector.resolveConfig(Map.of("connectionString", "127.0.0.1:" + closedPort, "username", USER, "password", PASSWORD))).block(TIMEOUT);

        assertFalse(result.isSuccess());
        List<ILoggingEvent> leaking = errorsWithPassword();
        assertEquals(1, leaking.size(), "exactly one ERROR event carries the password");
        assertTrue(leaking.get(0).getFormattedMessage().startsWith("test es error."), leaking.get(0).getFormattedMessage());
        assertTrue(leaking.get(0).getFormattedMessage().contains("\"username\":\"" + USER + "\""));
    }
}

package org.lowcoder.plugins;

import com.icegreen.greenmail.util.GreenMail;
import jakarta.mail.Session;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugins.SmtpGreenMailSupport.configMap;

/**
 * Unit SM-1 / SM-2 (task L5-10), the open relay and defect D19: against a server that does not ask for authentication, a config
 * without a user, with an empty user and with a user.
 *
 * <p>Limits: GreenMail's disabled-authentication mode; a real relay may answer differently to an AUTH attempt.
 */
public class SmtpEngineOpenRelayTest {

    static final String TAG = "[SmtpEngineOpenRelayTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final long WAIT_MILLIS = 10_000;

    private static GreenMail server;
    private final SmtpEngine engine = new SmtpEngine();

    @BeforeAll
    static void start() {
        server = SmtpGreenMailSupport.startOpenRelay();
    }

    @AfterAll
    static void stop() {
        server.stop();
    }

    private QueryExecutionResult send(Map<String, Object> config) {
        var datasource = engine.resolveConfig(config);
        Session session = engine.createConnection(datasource).block(BLOCK_TIMEOUT);
        Map<String, Object> query = new HashMap<>();
        query.put("from", "sender@example.com");
        query.put("to", "[\"rcpt@example.com\"]");
        query.put("subject", "open relay");
        query.put("content", "x");
        QueryExecutionResult result = engine.executeQuery(session, engine.buildQueryExecutionContext(datasource, query, Map.of(), null)).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "send " + config.keySet() + " -> " + result.getQueryCode() + " " + (result.getMessageArgs() == null ? null : result.getMessageArgs()[0]));
        return result;
    }

    /**
     * Pins defect D19 (analysis-plugins section 0.6; plan section 9 D1-D20 row), as it behaves: {@code createConnection} puts the
     * user name into {@code java.util.Properties} ({@code prop.put("mail.smtp.username", username)}), which refuses a null value, so a
     * datasource saved without a user name fails with a raw {@code NullPointerException} before any server is contacted: not only is
     * {@code mail.smtp.auth=true} always set, the no-user branch of {@code testConnection} ({@code session.getTransport().connect()})
     * and the open-relay case are unreachable. The analysis row words it differently (the client sends AUTH with a null user, or the
     * test connects without credentials); that is not what happens. The form leaves the user name optional
     * (client form.tsx:95-104, smtpDatasourceForm.tsx:26), so a user can save such a datasource. A fix (guarding the property) changes
     * these assertions on purpose.
     */
    @Test
    public void aConfigWithoutAUserFailsWithANullPointerExceptionBeforeAnyServerIsContacted_pinsD19() {
        Map<String, Object> config = configMap(server, null, null);
        NullPointerException create = assertThrows(NullPointerException.class, () -> engine.createConnection(engine.resolveConfig(config)));
        System.out.println(TAG + "createConnection without a user: " + create);
        assertThrows(NullPointerException.class, () -> engine.testConnection(engine.resolveConfig(config)).block(BLOCK_TIMEOUT));
        assertEquals(0, server.getReceivedMessages().length);
    }

    /** Observation: with an empty user name the connection is built (auth on) and a send through the open relay works. */
    @Test
    public void emptyUserNameSendsThroughTheOpenRelay() throws Exception {
        Map<String, Object> config = configMap(server, "", "");
        Session session = engine.createConnection(engine.resolveConfig(config)).block(BLOCK_TIMEOUT);
        assertEquals(true, session.getProperties().get("mail.smtp.auth"));
        QueryExecutionResult result = send(config);
        System.out.println(TAG + "empty user: " + result.getQueryCode());
        assertEquals("OK", result.getQueryCode());
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, 1));
    }

    @Test
    public void configWithAUserAlsoWorksAgainstTheOpenRelay() {
        QueryExecutionResult result = send(configMap(server, "anyone", "anything"));
        System.out.println(TAG + "with a user: " + result.getQueryCode());
        assertEquals("OK", result.getQueryCode());
    }
}

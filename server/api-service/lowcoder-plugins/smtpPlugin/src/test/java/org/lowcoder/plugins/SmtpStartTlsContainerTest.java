package org.lowcoder.plugins;

import jakarta.mail.Session;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugins.Smtp4DevContainerSupport.PLAIN;
import static org.lowcoder.plugins.Smtp4DevContainerSupport.STARTTLS;
import static org.lowcoder.plugins.Smtp4DevContainerSupport.STARTTLS_CAPABILITY;

/**
 * Unit SM-3: the SMTP engine against a server that offers STARTTLS with a self-signed certificate it generated itself
 * ({@link Smtp4DevContainerSupport#STARTTLS}, the pinned smtp4dev image; no certificate is made or copied by the test). The
 * engine enables STARTTLS ({@code mail.smtp.starttls.enable}) without a trust setting, so JavaMail upgrades the connection
 * and verifies the server's certificate against the JDK's default trust (the host name is not checked,
 * {@code mail.smtp.ssl.checkserveridentity=false}). The tests pin what that gives for an untrusted certificate: the TLS
 * handshake fails, test-connection reports a failed result naming it, a send is an error result and the server stores no
 * message. The control is the same engine against a server that offers no STARTTLS ({@link Smtp4DevContainerSupport#PLAIN}):
 * test-connection succeeds and the mail is stored, so the failure is the certificate's, not the engine's or the image's.
 *
 * <p>Limits: only the refusal of an untrusted certificate is shown; there is no setting for trusting one, so a successful
 * STARTTLS session with a trusted certificate is not tested; the TLS version is the engine's TLSv1.2.
 */
public class SmtpStartTlsContainerTest {

    static final String TAG = "[SmtpStartTlsContainerTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final String QUERY_CODE_OK = "OK";
    static final String FROM = "sender@example.com";
    static final String TO = "to@example.com";
    static final String CONNECT_FAILURE_TEXT = "Could not convert socket to TLS";
    static final String HANDSHAKE_TEXT = "SSLHandshakeException";
    static final String PKIX_TEXT = "PKIX path building failed";
    static final String QUERY_EXECUTION_ERROR_KEY = "QUERY_EXECUTION_ERROR";

    private final SmtpEngine engine = new SmtpEngine();

    private static Map<String, Object> query(String subject) {
        Map<String, Object> query = new HashMap<>();
        query.put("from", FROM);
        query.put("to", "[\"" + TO + "\"]");
        query.put("subject", subject);
        query.put("content", "<p>over STARTTLS?</p>");
        return query;
    }

    @Test
    public void theStarttlsServerAdvertisesStarttlsAndThePlainControlDoesNot() {
        List<String> starttls = STARTTLS.capabilities();
        List<String> plain = PLAIN.capabilities();
        System.out.println(TAG + "EHLO of " + STARTTLS + ": " + starttls);
        System.out.println(TAG + "EHLO of " + PLAIN + ": " + plain);
        assertTrue(starttls.contains(STARTTLS_CAPABILITY), "the STARTTLS server advertises STARTTLS: " + starttls);
        assertFalse(plain.contains(STARTTLS_CAPABILITY), "the control server does not: " + plain);
    }

    @Test
    public void testConnectionAgainstAnUntrustedStarttlsCertificateIsAFailedResultNamingTheHandshake() {
        DatasourceTestResult result = engine.testConnection(engine.resolveConfig(STARTTLS.configMap())).block(BLOCK_TIMEOUT);
        assertNotNull(result);
        String message = result.isSuccess() ? "" : result.getInvalidMessage(Locale.ENGLISH);
        System.out.println(TAG + "test connection against " + STARTTLS + ": success=" + result.isSuccess() + " message=" + message);
        assertFalse(result.isSuccess(), "an untrusted certificate must fail the test");
        assertTrue(message.contains(CONNECT_FAILURE_TEXT) || message.contains(HANDSHAKE_TEXT) || message.contains(PKIX_TEXT),
                "the message names the TLS failure: " + message);
    }

    @Test
    public void aSendThroughAnUntrustedStarttlsCertificateIsAnErrorResultNamingTheHandshakeAndTheServerStoresNothing() {
        var datasource = engine.resolveConfig(STARTTLS.configMap());
        Session session = engine.createConnection(datasource).block(BLOCK_TIMEOUT);
        String subject = "starttls-refused";
        var context = engine.buildQueryExecutionContext(datasource, query(subject), Map.of(), null);
        QueryExecutionResult result = engine.executeQuery(session, context).block(BLOCK_TIMEOUT);
        assertNotNull(result);
        System.out.println(TAG + "send against " + STARTTLS + ": code=" + result.getQueryCode() + " key=" + result.getMessageKey()
                + " args=" + Arrays.toString(result.getMessageArgs()));
        assertEquals(PluginCommonError.QUERY_EXECUTION_ERROR.name(), result.getQueryCode(), "the engine reports the refused TLS upgrade as an error result");
        assertEquals(QUERY_EXECUTION_ERROR_KEY, result.getMessageKey());
        String detail = Arrays.toString(result.getMessageArgs());
        assertTrue(detail.contains(CONNECT_FAILURE_TEXT) || detail.contains(HANDSHAKE_TEXT) || detail.contains(PKIX_TEXT),
                "the error names the TLS failure: " + detail);
        assertFalse(STARTTLS.subjects().contains(subject), "the refused send stored no message: " + STARTTLS.subjects());
    }

    @Test
    public void theSameEngineTestsAndSendsAgainstTheServerWithoutStarttls() {
        var datasource = engine.resolveConfig(PLAIN.configMap());
        DatasourceTestResult result = engine.testConnection(datasource).block(BLOCK_TIMEOUT);
        assertNotNull(result);
        System.out.println(TAG + "control test connection against " + PLAIN + ": success=" + result.isSuccess());
        assertTrue(result.isSuccess(), "the control server passes the test");

        Session session = engine.createConnection(datasource).block(BLOCK_TIMEOUT);
        String subject = "plain-control";
        var context = engine.buildQueryExecutionContext(datasource, query(subject), Map.of(), null);
        QueryExecutionResult sent = engine.executeQuery(session, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "control send -> " + sent.getQueryCode() + "; stored subjects " + PLAIN.subjects());
        assertEquals(QUERY_CODE_OK, sent.getQueryCode());
        assertTrue(PLAIN.subjects().contains(subject), "the control server stored the message: " + PLAIN.subjects());
    }
}

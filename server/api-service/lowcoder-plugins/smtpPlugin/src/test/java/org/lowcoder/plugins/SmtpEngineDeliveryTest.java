package org.lowcoder.plugins;

import com.icegreen.greenmail.util.GreenMail;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.io.InputStream;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugins.SmtpGreenMailSupport.LOGIN;
import static org.lowcoder.plugins.SmtpGreenMailSupport.PASSWORD;
import static org.lowcoder.plugins.SmtpGreenMailSupport.configMap;
import static org.lowcoder.plugins.SmtpGreenMailSupport.inboxOf;

/**
 * Unit SM-1 (task L5-10): a query executed against a real SMTP server (GreenMail, {@link SmtpGreenMailSupport}): the config is
 * bound by {@code resolveConfig}, the query config rendered by {@code buildQueryExecutionContext}, the mail sent by
 * {@code createConnection} + {@code executeQuery}, and the delivered message is read back from the recipients' mailboxes.
 *
 * <p>Limits: plain SMTP only (no STARTTLS or SSL); the server stores what it receives and does not relay.
 */
public class SmtpEngineDeliveryTest {

    static final String TAG = "[SmtpEngineDeliveryTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final long WAIT_MILLIS = 10_000;
    static final String QUERY_CODE_OK = "OK";
    static final String FROM = "sender@example.com";
    static final String TO_1 = "to1@example.com";
    static final String TO_2 = "to2@example.com";
    static final String CC = "cc@example.com";
    static final String BCC = "bcc@example.com";
    static final String REPLY_TO = "reply@example.com";

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

    @BeforeEach
    void purge() throws Exception {
        server.purgeEmailFromAllMailboxes();
    }

    private QueryExecutionResult send(Map<String, Object> config, Map<String, Object> queryConfig) {
        var datasource = engine.resolveConfig(config);
        Session session = engine.createConnection(datasource).block(BLOCK_TIMEOUT);
        var context = engine.buildQueryExecutionContext(datasource, queryConfig, Map.of(), null);
        QueryExecutionResult result = engine.executeQuery(session, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "sent " + queryConfig.get("subject") + " -> " + result.getQueryCode() + " " + result.getMessageKey());
        return result;
    }

    private static Map<String, Object> query(String to, String subject, String content) {
        Map<String, Object> query = new HashMap<>();
        query.put("from", FROM);
        query.put("to", to);
        query.put("subject", subject);
        query.put("content", content);
        return query;
    }

    private QueryExecutionResult sendAuthenticated(Map<String, Object> queryConfig) {
        return send(configMap(server, LOGIN, PASSWORD), queryConfig);
    }

    private static MimeMessage only(String email) throws Exception {
        List<MimeMessage> inbox = inboxOf(server, email);
        assertEquals(1, inbox.size(), email + " inbox");
        return inbox.get(0);
    }

    private static String addresses(Message message, Message.RecipientType type) throws Exception {
        return message.getRecipients(type) == null ? null : Arrays.toString(message.getRecipients(type));
    }

    @Test
    public void aMessageIsDeliveredWithItsAddressesSubjectAndHtmlBody() throws Exception {
        Map<String, Object> queryConfig = query("[\"" + TO_1 + "\"]", "Quarterly report", "<p>Hello <b>world</b></p>");
        queryConfig.put("cc", "[\"" + CC + "\"]");
        queryConfig.put("replyTo", "[\"" + REPLY_TO + "\"]");
        QueryExecutionResult result = sendAuthenticated(queryConfig);
        assertEquals(QUERY_CODE_OK, result.getQueryCode());
        assertNull(result.getData());
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, 2));

        MimeMessage toCopy = only(TO_1);
        MimeMessage ccCopy = only(CC);
        for (MimeMessage message : List.of(toCopy, ccCopy)) {
            assertEquals(FROM, ((InternetAddress) message.getFrom()[0]).getAddress());
            assertEquals("[" + TO_1 + "]", addresses(message, Message.RecipientType.TO));
            assertEquals("[" + CC + "]", addresses(message, Message.RecipientType.CC));
            assertEquals(REPLY_TO, ((InternetAddress) message.getReplyTo()[0]).getAddress());
            assertEquals("Quarterly report", message.getSubject());
            assertNotNull(message.getMessageID(), "Message-ID exists");
            assertNotNull(message.getSentDate(), "Date exists");
            Multipart multipart = (Multipart) message.getContent();
            assertEquals(1, multipart.getCount());
            assertTrue(multipart.getBodyPart(0).getContentType().startsWith("text/html"), multipart.getBodyPart(0).getContentType());
            assertEquals("<p>Hello <b>world</b></p>", multipart.getBodyPart(0).getContent());
        }
    }

    @Test
    public void everyAddressInToReceivesTheMail() throws Exception {
        sendAuthenticated(query("[\"" + TO_1 + "\", \"" + TO_2 + "\"]", "two recipients", "x"));
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, 2));
        for (String email : List.of(TO_1, TO_2)) {
            MimeMessage message = only(email);
            assertEquals("[" + TO_1 + ", " + TO_2 + "]", addresses(message, Message.RecipientType.TO), "both appear in the header of " + email);
        }
    }

    @Test
    public void bccRecipientReceivesTheMailButNoBccHeaderIsDelivered() throws Exception {
        Map<String, Object> queryConfig = query("[\"" + TO_1 + "\"]", "blind copy", "x");
        queryConfig.put("bcc", "[\"" + BCC + "\"]");
        assertEquals(QUERY_CODE_OK, sendAuthenticated(queryConfig).getQueryCode());
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, 2));
        MimeMessage blind = only(BCC);
        MimeMessage visible = only(TO_1);
        for (MimeMessage message : List.of(blind, visible)) {
            assertNull(message.getHeader("Bcc"), "no Bcc header in the delivered copy");
            assertEquals("[" + TO_1 + "]", addresses(message, Message.RecipientType.TO));
            assertNull(message.getRecipients(Message.RecipientType.BCC));
        }
    }

    @Test
    public void attachmentsArriveWithTheirNameTypeAndBytes() throws Exception {
        byte[] binary = new byte[256];
        for (int i = 0; i < binary.length; i++) {
            binary[i] = (byte) i;
        }
        String encoded = Base64.getEncoder().encodeToString(binary);
        String attachments = "[{\"name\": \"all-bytes.bin\", \"contentType\": \"application/octet-stream\", \"content\": \"" + encoded + "\"},"
                + " {\"name\": \"note.txt\", \"contentType\": \"text/plain\", \"content\": \"" + Base64.getEncoder().encodeToString("hello".getBytes()) + "\"}]";
        Map<String, Object> queryConfig = query("[\"" + TO_1 + "\"]", "with attachments", "see attached");
        queryConfig.put("attachments", attachments);
        assertEquals(QUERY_CODE_OK, sendAuthenticated(queryConfig).getQueryCode());
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, 1));
        Multipart multipart = (Multipart) only(TO_1).getContent();
        assertEquals(3, multipart.getCount(), "body plus two attachments");
        Part first = multipart.getBodyPart(1);
        assertEquals("all-bytes.bin", first.getFileName());
        assertEquals(Part.ATTACHMENT, first.getDisposition());
        assertTrue(first.getContentType().startsWith("application/octet-stream"), first.getContentType());
        try (InputStream in = first.getInputStream()) {
            assertArrayEquals(binary, in.readAllBytes());
        }
        Part second = multipart.getBodyPart(2);
        assertEquals("note.txt", second.getFileName());
        assertTrue(second.getContentType().startsWith("text/plain"), second.getContentType());
        try (InputStream in = second.getInputStream()) {
            assertEquals("hello", new String(in.readAllBytes()));
        }
    }

    /**
     * The subject is set with {@code MimeMessage.setSubject(String)}, which encodes with the JVM's default charset (no charset is
     * given). With a UTF-8 default (the case on a UTF-8 locale and on Java 18 and later) a non-ASCII subject survives; with any
     * other default (probed: {@code LC_ALL=C}, US-ASCII) every non-ASCII letter arrives as a question mark. The test asserts the
     * outcome that belongs to the charset of the JVM it runs in and prints both; the dependence on the environment is an
     * observation reported to the coordinator.
     */
    @Test
    public void nonAsciiSubjectDependsOnTheJvmDefaultCharset() throws Exception {
        String subject = "Příliš žluťoučký kůň";
        java.nio.charset.Charset charset = java.nio.charset.Charset.defaultCharset();
        sendAuthenticated(query("[\"" + TO_1 + "\"]", subject, "<p>Žluťoučký</p>"));
        assertTrue(server.waitForIncomingEmail(WAIT_MILLIS, 1));
        MimeMessage message = only(TO_1);
        System.out.println(TAG + "default charset " + charset + ", delivered subject: " + message.getSubject());
        if (charset.equals(java.nio.charset.StandardCharsets.UTF_8)) {
            assertEquals(subject, message.getSubject());
        } else {
            assertEquals(subject.chars().mapToObj(c -> c < 128 ? String.valueOf((char) c) : "?").collect(java.util.stream.Collectors.joining()), message.getSubject());
        }
    }

    @Test
    public void wrongPasswordAndUnknownUserGiveAnErrorResultNotAnException() throws Exception {
        QueryExecutionResult wrong = send(configMap(server, LOGIN, "wrong"), query("[\"" + TO_1 + "\"]", "bad password", "x"));
        assertEquals("QUERY_EXECUTION_ERROR", wrong.getQueryCode());
        assertEquals("QUERY_EXECUTION_ERROR", wrong.getMessageKey());
        System.out.println(TAG + "wrong password message: " + wrong.getMessageArgs()[0]);
        QueryExecutionResult unknown = send(configMap(server, "nobody", PASSWORD), query("[\"" + TO_1 + "\"]", "bad user", "x"));
        assertEquals("QUERY_EXECUTION_ERROR", unknown.getQueryCode());
        assertEquals(0, server.getReceivedMessages().length);
    }

    @Test
    public void stoppedServerGivesAnErrorResult() {
        GreenMail gone = SmtpGreenMailSupport.startAuthenticating();
        Map<String, Object> config = configMap(gone, LOGIN, PASSWORD);
        gone.stop();
        QueryExecutionResult result = send(config, query("[\"" + TO_1 + "\"]", "no server", "x"));
        assertEquals("QUERY_EXECUTION_ERROR", result.getQueryCode());
        System.out.println(TAG + "stopped server message: " + result.getMessageArgs()[0]);
    }

    /** Observation: a message with no recipient is refused by the mail library before anything is sent; the result is an error result, nothing is delivered. */
    @Test
    public void noRecipientGivesAnErrorResult() {
        QueryExecutionResult result = sendAuthenticated(query("", "no recipient", "x"));
        System.out.println(TAG + "no recipient: " + result.getQueryCode() + " " + (result.getMessageArgs() == null ? null : result.getMessageArgs()[0]));
        assertEquals("QUERY_EXECUTION_ERROR", result.getQueryCode());
        assertEquals(0, server.getReceivedMessages().length);
    }
}

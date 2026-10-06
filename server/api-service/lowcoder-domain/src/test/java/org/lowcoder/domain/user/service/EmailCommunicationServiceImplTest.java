package org.lowcoder.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Properties;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

/**
 * EmailCommunicationServiceImpl (unit U9, task L3-9). The sender is a mock that hands out a REAL MimeMessage, so the
 * recipients, subject and body that would leave the process are read back from the message that was sent.
 */
class EmailCommunicationServiceImplTest {

    private static final String PUBLIC_URL = "https://lowcoder.example";
    private static final String SENDER = "noreply@lowcoder.example";
    private static final String RECIPIENT = "user@example.com";
    private static final String RESET_SUBJECT = "Reset Your Lost Password";
    private static final String INVITE_SUBJECT = "You've been invited!";
    private static final String RESET_TEMPLATE = "<p>Hi, %s link: %s</p>";
    private static final String INVITE_TEMPLATE = "Join: %s";
    private static final String INVITE_LINK = PUBLIC_URL + "/invite/CODE";
    private static final String LINK_PREFIX = PUBLIC_URL + "/user/auth/lost-password?token=";
    private static final String HTML_WITH_LITERAL_PERCENT = "<table width=\"100%\"><tr><td>%s %s</td></tr></table>";

    private final JavaMailSender sender = mock(JavaMailSender.class);
    private final CommonConfig config = new CommonConfig();
    private final EmailCommunicationServiceImpl service = new EmailCommunicationServiceImpl(sender, config);

    @BeforeEach
    void configure() {
        config.setLowcoderPublicUrl(PUBLIC_URL);
        config.setNotificationsEmailSender(SENDER);
        when(sender.createMimeMessage()).thenAnswer(invocation -> new MimeMessage(Session.getInstance(new Properties())));
    }

    private MimeMessage sentOnce() throws Exception {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender, times(1)).send(captor.capture());
        MimeMessage message = captor.getValue();
        message.saveChanges(); // what a real sender does before transport: resolves the part content types
        return message;
    }

    private static String text(Object content) throws Exception {
        if (content instanceof Multipart multipart) {
            StringBuilder out = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart part = multipart.getBodyPart(i);
                out.append(text(part.getContent()));
            }
            return out.toString();
        }
        return String.valueOf(content);
    }

    private static boolean hasHtmlPart(Object content) throws Exception {
        if (content instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart part = multipart.getBodyPart(i);
                if (part.getContentType().toLowerCase().startsWith("text/html") || hasHtmlPart(part.getContent())) {
                    return true;
                }
            }
        }
        return false;
    }

    private static String body(MimeMessage message) throws Exception {
        return text(message.getContent());
    }

    private static String[] recipients(MimeMessage message) throws Exception {
        InternetAddress[] all = (InternetAddress[]) message.getRecipients(Message.RecipientType.TO);
        return all == null ? new String[0] : Arrays.stream(all).map(InternetAddress::getAddress).toArray(String[]::new);
    }

    /** Catches: arguments of String.format swapped, wrong path or subject, wrong sender, wrong recipient. */
    @Test
    void resetMailGoesToTheUserWithTheTemplateFilledWithAddressAndLink() throws Exception {
        assertThat(service.sendPasswordResetEmail(RECIPIENT, "tok", RESET_TEMPLATE)).isTrue();

        MimeMessage message = sentOnce();
        System.out.println("[EmailCommunicationServiceImplTest] reset body: " + body(message));
        assertThat(recipients(message)).containsExactly(RECIPIENT);
        assertThat(((InternetAddress) message.getFrom()[0]).getAddress()).isEqualTo(SENDER);
        assertThat(message.getSubject()).isEqualTo(RESET_SUBJECT);
        assertThat(hasHtmlPart(message.getContent())).as("sent as text/html so the link is clickable").isTrue();
        assertThat(body(message)).isEqualTo("<p>Hi, " + RECIPIENT + " link: " + LINK_PREFIX + "tok</p>");
    }

    /**
     * Catches: an unencoded token breaking the reset link. The generated passwords (UserServiceImpl.generateNewRandomPwd)
     * use & + % # which would split or corrupt the query string.
     */
    @Test
    void theTokenIsPercentEncodedInTheResetLink() throws Exception {
        String token = "a&b+c%d#e f";
        assertThat(service.sendPasswordResetEmail(RECIPIENT, token, "%s %s")).isTrue();

        String link = body(sentOnce()).substring((RECIPIENT + " ").length());
        System.out.println("[EmailCommunicationServiceImplTest] link: " + link);
        assertThat(link).startsWith(LINK_PREFIX);
        String query = link.substring(LINK_PREFIX.length());
        assertThat(query).doesNotContain("&", "#", "%d", " ");
        assertThat(URLDecoder.decode(query, StandardCharsets.UTF_8)).isEqualTo(token);
    }

    /** Catches: a failed send or a broken message being reported as success, or an exception escaping. */
    @Test
    void resetMailFailuresReturnFalseInsteadOfThrowing() {
        doThrow(new MailSendException("smtp down")).when(sender).send(any(MimeMessage.class));
        assertThat(service.sendPasswordResetEmail(RECIPIENT, "tok", RESET_TEMPLATE)).isFalse();

        JavaMailSender broken = mock(JavaMailSender.class);
        when(broken.createMimeMessage()).thenThrow(new IllegalStateException("no session"));
        assertThat(new EmailCommunicationServiceImpl(broken, config).sendPasswordResetEmail(RECIPIENT, "tok", RESET_TEMPLATE)).isFalse();

        assertThat(service.sendPasswordResetEmail(null, "tok", RESET_TEMPLATE)).isFalse();
        System.out.println("[EmailCommunicationServiceImplTest] send failure, session failure and null recipient all give false");
    }

    /** Catches: a template asking for more arguments than given being sent half formatted. */
    @Test
    void aTemplateWithTooManySpecifiersIsNotSent() {
        assertThat(service.sendPasswordResetEmail(RECIPIENT, "tok", "%s %s %s")).isFalse();
        verify(sender, never()).send(any(MimeMessage.class));
    }

    /**
     * Pins plan section 9 row "a customised reset or invite template containing a literal % makes the mail silently
     * fail (String.format; returns false)". Reachability: an org admin can store a template with
     * PUT .../commonSettings (OrganizationController:178 -> OrgApiServiceImpl:394), the default template
     * (OrganizationService:18-20) has only %s; today the stored value is never read (L3-2 row on the reset-template key,
     * UserServiceImpl:423), so the failure becomes live once that is fixed. A fix (escape or replace instead of
     * String.format) changes this test on purpose.
     */
    @Test
    void aLiteralPercentInATemplateMakesBothMailsFailSilently_pinsTheSection9Row() {
        assertThat(service.sendPasswordResetEmail(RECIPIENT, "tok", HTML_WITH_LITERAL_PERCENT)).isFalse();
        assertThat(service.sendInvitationEmails(new String[] {RECIPIENT}, INVITE_LINK, "<td width=\"100%\">%s</td>")).isFalse();
        verify(sender, never()).send(any(MimeMessage.class));
        System.out.println("[EmailCommunicationServiceImplTest] PINNED: literal % in a template -> false, nothing sent");
    }

    /** Catches: wrong recipients, subject, arguments of the invitation mail (the address is not a format argument). */
    @Test
    void invitationGoesToEveryRecipientWithTheLinkInTheTemplate() throws Exception {
        String[] to = {"a@example.com", "b@example.com"};
        assertThat(service.sendInvitationEmails(to, INVITE_LINK, INVITE_TEMPLATE)).isTrue();

        MimeMessage message = sentOnce();
        System.out.println("[EmailCommunicationServiceImplTest] invitation to " + Arrays.toString(recipients(message)) + ": " + body(message));
        assertThat(recipients(message)).containsExactly(to);
        assertThat(message.getSubject()).isEqualTo(INVITE_SUBJECT);
        assertThat(((InternetAddress) message.getFrom()[0]).getAddress()).isEqualTo(SENDER);
        assertThat(hasHtmlPart(message.getContent())).as("sent as text/html so the link is clickable").isTrue();
        assertThat(body(message)).isEqualTo("Join: " + INVITE_LINK);
    }

    /** Catches: an exception escaping to the controller, or a failure reported as success. */
    @Test
    void invitationFailuresReturnFalseInsteadOfThrowing() {
        assertThat(service.sendInvitationEmails(null, INVITE_LINK, INVITE_TEMPLATE)).isFalse();
        assertThat(service.sendInvitationEmails(new String[] {RECIPIENT}, INVITE_LINK, "%d")).isFalse();
        verify(sender, never()).send(any(MimeMessage.class));

        doThrow(new MailSendException("smtp down")).when(sender).send(any(MimeMessage.class));
        assertThat(service.sendInvitationEmails(new String[] {RECIPIENT}, INVITE_LINK, INVITE_TEMPLATE)).isFalse();
    }

    /**
     * Pins plan section 9 row "invitation mail with no recipients is sent and reports true". Reachable: POST
     * /email/invite with {"emails": [], "orgId": ...} goes InvitationController:62-66 -> InvitationApiServiceImpl.create
     * (which also stores an invitation) -> sendInvitationEmails(req.emails(), ...), with no validation of the array.
     * A fix (reject an empty array) changes this test on purpose.
     */
    @Test
    void anInvitationWithNoRecipientsIsSentAndReportsTrue_pinsTheSection9Row() throws Exception {
        assertThat(service.sendInvitationEmails(new String[0], INVITE_LINK, INVITE_TEMPLATE)).isTrue();

        MimeMessage message = sentOnce();
        System.out.println("[EmailCommunicationServiceImplTest] PINNED: no recipients, sent, recipients=" + Arrays.toString(recipients(message)));
        assertThat(recipients(message)).isEmpty();
    }
}

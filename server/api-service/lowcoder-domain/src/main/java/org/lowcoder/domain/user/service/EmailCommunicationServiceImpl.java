package org.lowcoder.domain.user.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.http.client.utils.URLEncodedUtils;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
@Service
@Slf4j(topic = "EmailCommunicationService")
public class EmailCommunicationServiceImpl implements EmailCommunicationService {

    private static final String PLACEHOLDER = "%s";
    private static final String ESCAPED_PERCENT = "%%";
    private static final char PERCENT = '%';

    private final JavaMailSender javaMailSender;
    private final CommonConfig config;

    @Override
    public boolean sendPasswordResetEmail(String to, String token, String message) {
        try {
            String subject = "Reset Your Lost Password";
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();

            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true);

            mimeMessageHelper.setFrom(config.getNotificationsEmailSender());
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);

            // Construct the message with the token link
            String resetLink = config.getLowcoderPublicUrl() + "/user/auth/lost-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
            String formattedMessage = fillTemplate(message, to, resetLink);
            mimeMessageHelper.setText(formattedMessage, true); // Set HTML to true to allow links

            javaMailSender.send(mimeMessage);

            return true;

        } catch (Exception e) {
            log.error("Failed to send mail to: {}, Exception: ", to, e);
            return false;
        }


    }

    /**
     * Fills an org-editable mail template (BF-099: {@code String.format} threw on a literal {@code %}, such as
     * {@code width="100%"}, and the mail was silently not sent). Each {@code %s} takes the next value in order and
     * {@code %%} is one {@code %}, as with {@code String.format}; any other {@code %} is kept as written. Other format
     * specifiers ({@code %1$s}, {@code %d}, {@code %n}) are not interpreted. More {@code %s} than values is an
     * {@link IllegalArgumentException}, so a half-filled mail is not sent; unused values are ignored. Values are inserted
     * as given, without HTML escaping.
     */
    static String fillTemplate(String template, String... values) {
        StringBuilder filled = new StringBuilder(template.length());
        int nextValue = 0;
        int i = 0;
        while (i < template.length()) {
            if (template.startsWith(ESCAPED_PERCENT, i)) {
                filled.append(PERCENT);
                i += ESCAPED_PERCENT.length();
            } else if (template.startsWith(PLACEHOLDER, i)) {
                if (nextValue == values.length) {
                    throw new IllegalArgumentException("The template has more " + PLACEHOLDER + " placeholders than the "
                            + values.length + " values to fill in");
                }
                filled.append(values[nextValue++]);
                i += PLACEHOLDER.length();
            } else {
                filled.append(template.charAt(i));
                i++;
            }
        }
        return filled.toString();
    }

    /**
     * The invitation template is a server constant ({@code InvitationController}), so it stays a format string. No
     * recipients is a failure: nothing is sent and the answer is false (BF-139: a mail to nobody was sent and reported
     * true).
     */
    @Override
    public boolean sendInvitationEmails(String[] to, String inviteLink, String message) {
        if (ArrayUtils.isEmpty(to)) {
            log.error("No recipients for the invitation mail, nothing sent");
            return false;
        }
        try {
            String subject = "You've been invited!";
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();

            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true);

            mimeMessageHelper.setFrom(config.getNotificationsEmailSender());
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);

            // Construct the message with the invite link
            String formattedMessage = String.format(message, inviteLink);
            mimeMessageHelper.setText(formattedMessage, true); // Set HTML to true to allow links

            javaMailSender.send(mimeMessage);

            return true;

        } catch (Exception e) {
            log.error("Failed to send mail to: {}, Exception: ", to, e);
            return false;
        }


    }

}

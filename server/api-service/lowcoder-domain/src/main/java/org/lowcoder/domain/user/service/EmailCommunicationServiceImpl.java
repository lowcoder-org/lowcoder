package org.lowcoder.domain.user.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.utils.URLEncodedUtils;
import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@RequiredArgsConstructor
@Service
@Slf4j(topic = "EmailCommunicationService")
public class EmailCommunicationServiceImpl implements EmailCommunicationService {

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
            String formattedMessage = String.format(message, to, resetLink);
            mimeMessageHelper.setText(formattedMessage, true); // Set HTML to true to allow links

            javaMailSender.send(mimeMessage);

            return true;

        } catch (Exception e) {
            log.error("Failed to send mail to: {}, Exception: ", to, e);
            return false;
        }


    }

    @Override
    public boolean sendInvitationEmail(Invitation invitation, Set<String> emails, String message) {
        try {
            String subject = "You've got invitation to lowcoder";
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();

            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true);

            mimeMessageHelper.setFrom(config.getNotificationsEmailSender());
            String[] to = emails.toArray(new String[0]);
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);

            // Construct the message with the token link
            String inviteLink = config.getLowcoderPublicUrl() + "/user/auth/invite?code=" + invitation.getId();
            String formattedMessage = String.format(message, inviteLink);
            mimeMessageHelper.setText(formattedMessage, true); // Set HTML to true to allow links

            javaMailSender.send(mimeMessage);

            return true;

        } catch (Exception e) {
            log.error("Failed to send mail, Exception: ", e);
            return false;
        }


    }

}

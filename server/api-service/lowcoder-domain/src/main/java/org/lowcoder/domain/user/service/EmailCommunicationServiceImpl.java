package org.lowcoder.domain.user.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

}

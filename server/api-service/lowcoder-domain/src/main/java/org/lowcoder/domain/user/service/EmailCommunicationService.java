package org.lowcoder.domain.user.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j(topic = "EmailCommunicationService")
public class EmailCommunicationService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${common.lowcoder_public_url}")
    private String lowcoderPublicUrl;

    public boolean sendPasswordResetEmail(String to, String token, String message) {
        try {
            String subject = "Reset Your Password";
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();

            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true);

            mimeMessageHelper.setFrom(fromEmail);
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);

            // Construct the message with the token link
            String resetLink = lowcoderPublicUrl + "/api/users/lost-password/" + token;
            String formattedMessage = String.format(message, to, resetLink);
            mimeMessageHelper.setText(formattedMessage, true); // Set HTML to true to allow links

            javaMailSender.send(mimeMessage);

            return true;

        } catch (Exception e) {
            log.error("Failed to send mail to: {}, Exception: {}", to, e);
            return false;
        }


    }

}

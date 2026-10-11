package org.lowcoder.domain.user.service;

public interface EmailCommunicationService {
    boolean sendPasswordResetEmail(String to, String token, String message);
    boolean sendInvitationEmails(String[] to, String inviteLink, String message);
}

package org.lowcoder.domain.user.service;

import org.lowcoder.domain.invitation.model.Invitation;

import java.util.Set;

public interface EmailCommunicationService {
    boolean sendPasswordResetEmail(String to, String token, String message);
    boolean sendInvitationEmail(Invitation invitation, Set<String> emails, String message);
}

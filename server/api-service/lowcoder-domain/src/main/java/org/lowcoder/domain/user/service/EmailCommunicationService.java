package org.lowcoder.domain.user.service;

public interface EmailCommunicationService {
    boolean sendPasswordResetEmail(String to, String token, String message);
}

package org.lowcoder.domain.encryption;

public interface EncryptionService {

    String encryptString(String plaintext);

    String encryptStringForNodeServer(String plaintext);

    String decryptString(String encryptedText);

    String encryptPassword(String plaintext);

    boolean matchPassword(String password1, String password2);

}

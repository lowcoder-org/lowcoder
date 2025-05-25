package org.lowcoder.domain.encryption;

import org.apache.commons.codec.binary.Hex;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfig.Encrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

@Service
public class EncryptionServiceImpl implements EncryptionService {

    private final TextEncryptor textEncryptor;
    private final TextEncryptor textEncryptorForNodeServer;
    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public EncryptionServiceImpl(
        CommonConfig commonConfig
    ) {
        Encrypt encrypt = commonConfig.getEncrypt();
        String saltInHex = Hex.encodeHexString(encrypt.getSalt().getBytes());
        this.textEncryptor = Encryptors.text(encrypt.getPassword(), saltInHex);
        if (!commonConfig.getJsExecutor().getSalt().isEmpty() && !commonConfig.getJsExecutor().getPassword().isEmpty()) {
            String saltInHexForNodeServer = Hex.encodeHexString(commonConfig.getJsExecutor().getSalt().getBytes());
            this.textEncryptorForNodeServer = Encryptors.text(commonConfig.getJsExecutor().getPassword(), saltInHexForNodeServer);
        } else this.textEncryptorForNodeServer = null;
    }

    @Override
    public String encryptString(String plaintext) {
        if (StringUtils.isEmpty(plaintext)) {
            return plaintext;
        }
        return textEncryptor.encrypt(plaintext);
    }
    @Override
    public String encryptStringForNodeServer(String plaintext) {
        if (StringUtils.isEmpty(plaintext)) {
            return plaintext;
        }
        return textEncryptorForNodeServer.encrypt(plaintext);
    }

    @Override
    public String decryptString(String encryptedText) {
        if (StringUtils.isEmpty(encryptedText)) {
            return encryptedText;
        }
        return textEncryptor.decrypt(encryptedText);
    }

    @Override
    public String encryptPassword(String plaintext) {
        if (StringUtils.isEmpty(plaintext)) {
            return StringUtils.EMPTY;
        }
        return bCryptPasswordEncoder.encode(plaintext);
    }

    @Override
    public boolean matchPassword(String rawPassword, String encodedPassword) {
        return bCryptPasswordEncoder.matches(rawPassword, encodedPassword);
    }
}

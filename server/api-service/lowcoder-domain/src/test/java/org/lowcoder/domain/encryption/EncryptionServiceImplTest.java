package org.lowcoder.domain.encryption;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfig.Encrypt;
import org.lowcoder.sdk.config.CommonConfig.JsExecutor;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EncryptionServiceImplTest {

    private EncryptionServiceImpl encryptionService;
    private TextEncryptor nodeServerEncryptor;
    private String nodePassword = "nodePassword";
    private String nodeSalt = "nodeSalt";

    @BeforeEach
    void setUp() {
        // Mock CommonConfig and its nested classes
        Encrypt encrypt = mock(Encrypt.class);
        when(encrypt.getPassword()).thenReturn("testPassword");
        when(encrypt.getSalt()).thenReturn("testSalt");

        JsExecutor jsExecutor = mock(JsExecutor.class);
        when(jsExecutor.getPassword()).thenReturn(nodePassword);
        when(jsExecutor.getSalt()).thenReturn(nodeSalt);

        CommonConfig commonConfig = mock(CommonConfig.class);
        when(commonConfig.getEncrypt()).thenReturn(encrypt);
        when(commonConfig.getJsExecutor()).thenReturn(jsExecutor);

        encryptionService = new EncryptionServiceImpl(commonConfig);

        // For direct comparison in test
        String saltInHexForNodeServer = org.apache.commons.codec.binary.Hex.encodeHexString(nodeSalt.getBytes());
        nodeServerEncryptor = Encryptors.text(nodePassword, saltInHexForNodeServer);
    }

    @Test
    void testEncryptStringForNodeServer_NullInput() {
        assertNull(encryptionService.encryptStringForNodeServer(null));
    }

    @Test
    void testEncryptStringForNodeServer_EmptyInput() {
        assertEquals("", encryptionService.encryptStringForNodeServer(""));
    }

    @Test
    void testEncryptStringForNodeServer_EncryptsAndDecryptsCorrectly() {
        String plain = "node secret";
        String encrypted = encryptionService.encryptStringForNodeServer(plain);
        assertNotNull(encrypted);
        assertNotEquals(plain, encrypted);

        // Decrypt using the same encryptor to verify correctness
        String decrypted = nodeServerEncryptor.decrypt(encrypted);
        assertEquals(plain, decrypted);
    }

    @Test
    void testEncryptStringForNodeServer_DifferentInputsProduceDifferentOutputs() {
        String encrypted1 = encryptionService.encryptStringForNodeServer("abc");
        String encrypted2 = encryptionService.encryptStringForNodeServer("def");
        assertNotEquals(encrypted1, encrypted2);
    }

    @Test
    void testEncryptStringForNodeServer_SameInputProducesDifferentOutputs() {
        String input = "repeat";
        String encrypted1 = encryptionService.encryptStringForNodeServer(input);
        String encrypted2 = encryptionService.encryptStringForNodeServer(input);
        // Spring's Encryptors.text uses random IV, so outputs should differ
        assertNotEquals(encrypted1, encrypted2);
    }
}
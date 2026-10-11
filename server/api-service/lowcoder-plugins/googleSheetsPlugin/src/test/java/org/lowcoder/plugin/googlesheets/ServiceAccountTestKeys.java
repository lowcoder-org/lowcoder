package org.lowcoder.plugin.googlesheets;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import org.lowcoder.sdk.util.JsonUtils;

/**
 * Builds service-account JSON text for tests. The RSA key is generated when the class is loaded and exists only in
 * memory: no private key is committed.
 */
final class ServiceAccountTestKeys {

    static final String CLIENT_ID = "1234567890";
    static final String CLIENT_EMAIL = "bot@project.iam.gserviceaccount.com";
    static final String PRIVATE_KEY_ID = "key-id-1";
    private static final int KEY_BITS = 2048;
    private static final int PEM_LINE = 64;

    /** The PKCS8 PEM of the generated key, as it appears in the {@code private_key} field of a Google JSON key file. */
    static final String PRIVATE_KEY_PEM = generatePem();

    private ServiceAccountTestKeys() {
    }

    private static String generatePem() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(KEY_BITS);
            KeyPair pair = generator.generateKeyPair();
            return "-----BEGIN PRIVATE KEY-----\n"
                    + Base64.getMimeEncoder(PEM_LINE, "\n".getBytes()).encodeToString(pair.getPrivate().getEncoded())
                    + "\n-----END PRIVATE KEY-----\n";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** A complete service-account JSON with the generated key. */
    static String json() {
        return json(PRIVATE_KEY_PEM);
    }

    static String json(String privateKey) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type", "service_account");
        map.put("client_id", CLIENT_ID);
        map.put("client_email", CLIENT_EMAIL);
        map.put("private_key", privateKey);
        map.put("private_key_id", PRIVATE_KEY_ID);
        return JsonUtils.toJson(map);
    }

    /** A distinctive fragment of the key body that must never appear in a log or {@code toString()}. */
    static String keyMarker() {
        String body = PRIVATE_KEY_PEM.split("\n")[1];
        return body.substring(0, 40);
    }
}

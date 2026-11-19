package org.lowcoder.plugin.googlesheets.model;

import java.util.Map;

import org.lowcoder.sdk.util.JsonUtils;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServiceAccountJsonUtils {

    /** Printed by {@code toString} in place of a secret that is set (BF-026 D9); a missing secret prints {@code null}. */
    static final String HIDDEN_SECRET = "<hidden>";

    private String clientId;
    private String clientEmail;
    private String privateKeyPkcs8;
    private String privateKeyId;

    public void getData(String jsonStr) {
        Map<String, Object> map = JsonUtils.fromJsonMap(jsonStr);
        // BF-118: text that is no JSON object, or a field that is no text, is the coded error, not an NPE or a ClassCastException
        if (map == null) {
            throw ServiceAccountCredentialsReader.invalidServiceAccount();
        }
        clientId = text(map, CLIENT_ID);
        clientEmail = text(map, CLIENT_EMAIL);
        privateKeyPkcs8 = text(map, PRIVATE_KEY);
        privateKeyId = text(map, PRIVATE_KEY_ID);
    }

    private static final String CLIENT_ID = "client_id";
    private static final String CLIENT_EMAIL = "client_email";
    private static final String PRIVATE_KEY = "private_key";
    private static final String PRIVATE_KEY_ID = "private_key_id";

    /** The field's text, null when it is absent or null, the coded error when it is another JSON type. */
    private static String text(Map<String, Object> map, String field) {
        Object value = map.get(field);
        if (value != null && !(value instanceof String)) {
            throw ServiceAccountCredentialsReader.invalidServiceAccount();
        }
        return (String) value;
    }

    @Override
    public String toString() {
        return "ServiceAccountJsonUtils{" +
                "clientId='" + clientId + '\'' +
                ", clientEmail='" + clientEmail + '\'' +
                ", privateKeyPkcs8=" + hidden(privateKeyPkcs8) +
                ", privateKeyId='" + privateKeyId + '\'' +
                '}';
    }

    /** {@link #HIDDEN_SECRET} for a secret that is set, {@code null} for none, so a log still shows whether it was present. */
    static String hidden(String secret) {
        return secret == null ? null : HIDDEN_SECRET;
    }
}

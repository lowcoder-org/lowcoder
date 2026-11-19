package org.lowcoder.plugin.googlesheets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.model.ServiceAccountCredentialsReader;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.JsonUtils;

import com.google.auth.oauth2.ServiceAccountCredentials;

/**
 * BF-118: {@link ServiceAccountCredentialsReader#read} turns a valid service-account key JSON into credentials and every
 * key it cannot read into the coded DATASOURCE_ARGUMENT_ERROR / GOOGLESHEETS_DATASOURCE_CONFIG_ERROR. The cases are the
 * failures observed before the fix: an IOException (not PKCS#8 data), an IllegalArgumentException (a PEM body that is not
 * base64, a null text), a NullPointerException (no private_key, no client_email, text that is no JSON object) and a
 * ClassCastException (a field that is no text).
 */
class ServiceAccountCredentialsReaderTest {

    private static final String INVALID_SERVICE_ACCOUNT_KEY = "GOOGLESHEETS_DATASOURCE_CONFIG_ERROR";
    private static final String NOT_BASE64_PEM = "-----BEGIN PRIVATE KEY-----\n@@@@\n-----END PRIVATE KEY-----";
    private static final int NUMERIC_CLIENT_ID = 5;

    @Test
    void aValidKeyGivesCredentialsWithItsIdentityBF118() {
        ServiceAccountCredentials credentials = ServiceAccountCredentialsReader.read(ServiceAccountTestKeys.json());

        System.out.println("[ServiceAccountCredentialsReaderTest] valid key -> " + credentials.getClientEmail());
        assertEquals(ServiceAccountTestKeys.CLIENT_EMAIL, credentials.getClientEmail());
        assertEquals(ServiceAccountTestKeys.CLIENT_ID, credentials.getClientId());
        assertEquals(ServiceAccountTestKeys.PRIVATE_KEY_ID, credentials.getPrivateKeyId());
    }

    @Test
    void everyKeyThatCannotBeReadIsTheCodedDatasourceConfigErrorBF118() {
        Map<String, String> keys = new LinkedHashMap<>();
        keys.put("not PKCS#8", ServiceAccountTestKeys.json("not a key"));
        keys.put("empty private_key", ServiceAccountTestKeys.json(""));
        keys.put("PEM body not base64", ServiceAccountTestKeys.json(NOT_BASE64_PEM));
        keys.put("no private_key", without("private_key"));
        keys.put("no client_email", without("client_email"));
        keys.put("numeric client_id", with("client_id", NUMERIC_CLIENT_ID));
        keys.put("JSON array", "[1]");
        keys.put("no JSON", "garbage");
        keys.put("blank", "   ");
        keys.put("null", null);

        keys.forEach((name, json) -> {
            PluginException failure = assertThrows(PluginException.class, () -> ServiceAccountCredentialsReader.read(json), name);
            System.out.println("[ServiceAccountCredentialsReaderTest] " + name + " -> " + failure.getError() + " / " + failure.getMessageKey());
            assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, failure.getError(), name);
            assertEquals(INVALID_SERVICE_ACCOUNT_KEY, failure.getMessageKey(), name);
        });
    }

    private static String without(String field) {
        Map<String, Object> key = new LinkedHashMap<>(JsonUtils.fromJsonMap(ServiceAccountTestKeys.json()));
        key.remove(field);
        return JsonUtils.toJson(key);
    }

    private static String with(String field, Object value) {
        Map<String, Object> key = new LinkedHashMap<>(JsonUtils.fromJsonMap(ServiceAccountTestKeys.json()));
        key.put(field, value);
        return JsonUtils.toJson(key);
    }
}

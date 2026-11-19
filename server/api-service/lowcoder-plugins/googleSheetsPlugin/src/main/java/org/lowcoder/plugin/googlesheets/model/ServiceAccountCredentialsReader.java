package org.lowcoder.plugin.googlesheets.model;

import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;

import java.io.IOException;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.PluginException;

import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.oauth2.ServiceAccountCredentials;

/**
 * The credentials of the service-account key JSON a user pastes in the Google Sheets datasource form (BF-118: a key that
 * could not be read failed with a raw RuntimeException wrapping the IOException, or with a NullPointerException or a
 * ClassCastException, instead of a coded error).
 * <p>
 * Limits: the key is only read, nothing is sent to Google, so a well-formed key of a deleted or unauthorised service
 * account is accepted here and fails when a request is made.
 */
public final class ServiceAccountCredentialsReader {

    static final String INVALID_SERVICE_ACCOUNT = "GOOGLESHEETS_DATASOURCE_CONFIG_ERROR";

    private ServiceAccountCredentialsReader() {
    }

    /**
     * The credentials of {@code serviceAccount}, or a PluginException DATASOURCE_ARGUMENT_ERROR /
     * GOOGLESHEETS_DATASOURCE_CONFIG_ERROR when it is blank, no JSON object, has a field that is no text, has no
     * {@code client_email} or {@code private_key}, or its private key is not a PKCS#8 PEM.
     */
    public static ServiceAccountCredentials read(String serviceAccount) {
        if (StringUtils.isBlank(serviceAccount)) {
            throw invalidServiceAccount();
        }
        ServiceAccountJsonUtils key = new ServiceAccountJsonUtils();
        key.getData(serviceAccount);
        if (StringUtils.isBlank(key.getClientEmail()) || StringUtils.isBlank(key.getPrivateKeyPkcs8())) {
            throw invalidServiceAccount();
        }
        try {
            return ServiceAccountCredentials.fromPkcs8(key.getClientId(), key.getClientEmail(), key.getPrivateKeyPkcs8(),
                    key.getPrivateKeyId(), SheetsScopes.all());
        } catch (IOException | IllegalArgumentException e) {
            // IOException: not PKCS#8 data; IllegalArgumentException: the PEM body is not base64
            throw invalidServiceAccount();
        }
    }

    static PluginException invalidServiceAccount() {
        return new PluginException(DATASOURCE_ARGUMENT_ERROR, INVALID_SERVICE_ACCOUNT);
    }
}

package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.lowcoder.plugin.googlesheets.GoogleSheetError.GOOGLESHEETS_REQUEST_ERROR;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

import org.lowcoder.plugin.googlesheets.model.GoogleSheetsActionRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsAppendDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsQueryExecutionContext;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsUpdateDataRequest;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.Sheets.Builder;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

public class GoogleSheetsGetPreParameters {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Test-only seam (plan section 5 D-1). {@code null} in production, which keeps Google's root URL. It is
     * package-private, so neither a datasource configuration nor any class outside {@code queryhandler} can set it. It is a
     * JVM-wide static: a test that sets it must reset it, and it does NOT guard against another test class running
     * concurrently in the same JVM while it is set (so tests that set it must not run in parallel with other Sheets tests).
     */
    private static volatile String rootUrlOverride;

    /**
     * Test-only: points {@link #GetSheetsService} at {@code rootUrl}; {@code null} restores Google's root URL. Package-private
     * and JVM-wide, see {@link #rootUrlOverride}.
     */
    static void setRootUrlForTests(String rootUrl) {
        rootUrlOverride = rootUrl;
    }

    public static Sheets GetSheetsService(GoogleSheetsQueryExecutionContext context) {
        HttpTransport httpTransport;
        try {
            httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (GeneralSecurityException | IOException e) {
            throw new PluginException(GOOGLESHEETS_REQUEST_ERROR, "GOOGLESHEETS_REQUEST_ERROR", e.getMessage());
        }
        final GoogleCredentials googleCredentials = context.getServiceAccountCredentials();
        HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(googleCredentials);
        Builder builder = new Builder(httpTransport, JSON_FACTORY, requestInitializer);
        String rootUrl = rootUrlOverride;
        if (rootUrl != null) {
            builder.setRootUrl(rootUrl);
        }
        return builder.build();
    }

    public static SheetChangeSetRow getChangeSet(GoogleSheetsQueryExecutionContext context) {
        GoogleSheetsActionRequest googleSheetsActionRequest = context.getGoogleSheetsActionRequest();
        SheetChangeSetRow changeSetItems = null;
        if (googleSheetsActionRequest instanceof GoogleSheetsAppendDataRequest googleSheetsAppendDataRequest) {
            changeSetItems = googleSheetsAppendDataRequest.getChangeSetItems();
        }
        if (googleSheetsActionRequest instanceof GoogleSheetsUpdateDataRequest googleSheetsUpdateDataRequest) {
            changeSetItems = googleSheetsUpdateDataRequest.getChangeSetItems();
        }
        return changeSetItems;
    }

    /**
     * The first row of the {@code values} of a {@code spreadsheets.values.get} answer, or an empty list when there is none:
     * the API leaves {@code values} out for an empty range (BF-120: the handlers dereferenced it and failed with the
     * JVM's NullPointerException text).
     */
    public static List<Object> firstRow(List<List<Object>> values) {
        if (values == null || values.isEmpty() || values.get(0) == null) {
            return List.of();
        }
        return values.get(0);
    }
}

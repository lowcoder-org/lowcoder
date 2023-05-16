package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.lowcoder.plugin.googlesheets.GoogleSheetError.GOOGLESHEETS_REQUEST_ERROR;

import java.io.IOException;
import java.security.GeneralSecurityException;

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

    public static Sheets GetSheetsService(GoogleSheetsQueryExecutionContext context) {
        HttpTransport httpTransport;
        try {
            httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (GeneralSecurityException | IOException e) {
            throw new PluginException(GOOGLESHEETS_REQUEST_ERROR, "GOOGLESHEETS_REQUEST_ERROR", e.getMessage());
        }
        final GoogleCredentials googleCredentials = context.getServiceAccountCredentials();
        HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(googleCredentials);
        return new Builder(httpTransport, JSON_FACTORY, requestInitializer).build();
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
}

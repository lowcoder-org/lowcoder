package org.lowcoder.plugin.googlesheets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsAppendDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsClearDataRequst;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsDeleteDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsQueryExecutionContext;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsReadDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsUpdateDataRequest;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsActionHandler;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsActionHandlerFactory;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsAppendDataHandler;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsClearDataHandler;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsDeleteDataHandler;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsGetPreParameters;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsReadDataHandler;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsUpdateDataHandler;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow;
import org.lowcoder.sdk.query.QueryVisitorContext;

import com.google.api.services.sheets.v4.Sheets;

/**
 * The handler registry, {@code GoogleSheetsGetPreParameters.getChangeSet} and the Sheets client factory. The handler
 * {@code execute} bodies call the live Google API and are not run here (no network).
 */
public class GoogleSheetsHandlerFactoryTest {

    private static final Map<String, Object> CHANGE_SET = Map.of("compType", "KEY_VALUE_PAIRS", "comp", java.util.List.of(Map.of("column", "name", "value", "Ann")));

    @Test
    public void everyActionTypeResolvesToItsOwnHandlerAndAnUnknownOneIsRejected() {
        Map<String, Class<? extends GoogleSheetsActionHandler>> expected = new java.util.LinkedHashMap<>();
        expected.put("readData", GoogleSheetsReadDataHandler.class);
        expected.put("appendData", GoogleSheetsAppendDataHandler.class);
        expected.put("updateData", GoogleSheetsUpdateDataHandler.class);
        expected.put("clearData", GoogleSheetsClearDataHandler.class);
        expected.put("deleteData", GoogleSheetsDeleteDataHandler.class);
        for (Map.Entry<String, Class<? extends GoogleSheetsActionHandler>> entry : expected.entrySet()) {
            GoogleSheetsActionHandler handler = GoogleSheetsActionHandlerFactory.getGoogleSheetsActionHandler(entry.getKey());
            System.out.println("[GoogleSheetsHandlerFactoryTest] " + entry.getKey() + " -> " + handler.getClass().getSimpleName());
            assertInstanceOf(entry.getValue(), handler);
            assertEquals(entry.getKey(), handler.getActionType());
            assertSame(handler, GoogleSheetsActionHandlerFactory.getGoogleSheetsActionHandler(entry.getKey()), "handlers are shared");
        }
        for (String unknown : new String[] {"", "raw", "READDATA"}) {
            PluginException failure = assertThrows(PluginException.class, () -> GoogleSheetsActionHandlerFactory.getGoogleSheetsActionHandler(unknown), unknown);
            assertEquals(PluginCommonError.QUERY_ARGUMENT_ERROR, failure.getError());
            assertEquals("GOOGLESHEETS_QUERY_PARAM_ERROR", failure.getMessageKey());
        }
        assertThrows(PluginException.class, () -> GoogleSheetsActionHandlerFactory.getGoogleSheetsActionHandler(null));
    }

    @Test
    public void theChangeSetIsReturnedForAppendAndUpdateOnly() {
        Map<String, Object> command = Map.of("spreadsheetId", "a", "sheetName", "b", "rowIndexString", "1", "changeSet", CHANGE_SET);
        GoogleSheetsAppendDataRequest append = GoogleSheetsAppendDataRequest.from(command);
        append.renderParams(Map.of());
        GoogleSheetsUpdateDataRequest update = GoogleSheetsUpdateDataRequest.from(command);
        update.renderParams(Map.of());

        assertSame(append.getChangeSetItems(), GoogleSheetsGetPreParameters.getChangeSet(contextWith(append)));
        assertSame(update.getChangeSetItems(), GoogleSheetsGetPreParameters.getChangeSet(contextWith(update)));
        SheetChangeSetRow row = GoogleSheetsGetPreParameters.getChangeSet(contextWith(append));
        assertEquals(Set.of("name"), row.getColumns());
        for (Object other : new Object[] {new GoogleSheetsReadDataRequest(), new GoogleSheetsClearDataRequst(), new GoogleSheetsDeleteDataRequest(), null}) {
            assertNull(GoogleSheetsGetPreParameters.getChangeSet(contextWith((org.lowcoder.plugin.googlesheets.model.GoogleSheetsActionRequest) other)), String.valueOf(other));
        }
    }

    private static GoogleSheetsQueryExecutionContext contextWith(org.lowcoder.plugin.googlesheets.model.GoogleSheetsActionRequest request) {
        GoogleSheetsQueryExecutionContext context = new GoogleSheetsQueryExecutionContext();
        context.setGoogleSheetsActionRequest(request);
        return context;
    }

    @Test
    public void theSheetsClientIsBuiltFromTheContextCredentialsWithoutAnyRequest() {
        GoogleSheetsPlugin.GoogleSheetsEngine engine = new GoogleSheetsPlugin.GoogleSheetsEngine();
        GoogleSheetsQueryExecutionContext context = engine.buildQueryExecutionContext(
                engine.resolveConfig(Map.of("serviceAccount", ServiceAccountTestKeys.json())),
                Map.of("commandType", "readData", "command", Map.of("spreadsheetId", "a", "sheetName", "b")), Map.of(),
                new QueryVisitorContext("v", "o", 0, null, null, Set.of()));

        Sheets sheets = GoogleSheetsGetPreParameters.GetSheetsService(context);

        System.out.println("[GoogleSheetsHandlerFactoryTest] root " + sheets.getRootUrl() + " base " + sheets.getBaseUrl() + " initializer "
                + sheets.getRequestFactory().getInitializer().getClass().getSimpleName());
        assertEquals("https://sheets.googleapis.com/", sheets.getRootUrl());
        assertEquals("https://sheets.googleapis.com/", sheets.getBaseUrl());
        assertInstanceOf(com.google.auth.http.HttpCredentialsAdapter.class, sheets.getRequestFactory().getInitializer());
    }
}

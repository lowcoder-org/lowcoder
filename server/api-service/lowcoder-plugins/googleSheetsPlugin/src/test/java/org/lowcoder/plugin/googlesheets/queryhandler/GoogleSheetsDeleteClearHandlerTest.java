package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsQueryExecutionContext;
import org.lowcoder.sdk.contract.RecordingHttpServer.Handler;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * {@link GoogleSheetsDeleteDataHandler} and {@link GoogleSheetsClearDataHandler} against a local server. Per the Sheets v4
 * reference: delete reads the sheets with {@code spreadsheets.get} ({@code GET /v4/spreadsheets/{id}}, whose
 * {@code sheets[].properties} carry {@code title} and {@code sheetId}) and sends {@code spreadsheets.batchUpdate}
 * ({@code POST /v4/spreadsheets/{id}:batchUpdate}) with a {@code deleteDimension} request over a zero-based, end-exclusive
 * range; clear is {@code spreadsheets.values.clear} ({@code POST /v4/spreadsheets/{id}/values/{range}:clear}, empty body).
 * Row index {@code 4} of the query form is sheet row 5, that is zero-based index 4.
 */
public class GoogleSheetsDeleteClearHandlerTest extends GoogleSheetsCallSupport {

    private static final String SPREADSHEET_PATH = V4 + SPREADSHEET;
    private static final String BATCH_PATH = SPREADSHEET_PATH + ":batchUpdate";
    private static final String SHEETS = "{\"spreadsheetId\":\"sid\",\"sheets\":[{\"properties\":{\"sheetId\":111,\"title\":\"Other\"}},"
            + "{\"properties\":{\"sheetId\":222,\"title\":\"Orders\"}}]}";
    private static final String CLEAR_PATH = SPREADSHEET_PATH + "/values/Sheet1!5:5:clear";

    private static Map<String, Object> deleteCommand(String sheetName) {
        return Map.of("spreadsheetId", SPREADSHEET, "sheetName", sheetName, "rowIndexString", "4");
    }

    private void startDelete() {
        Map<String, Handler> routes = new HashMap<>();
        routes.put(SPREADSHEET_PATH, request -> json(SHEETS));
        routes.put(BATCH_PATH, request -> json("{\"spreadsheetId\":\"sid\",\"replies\":[{}]}"));
        start(routes);
    }

    private static Map<String, Object> deleteBody(int sheetId) {
        return Map.of("requests", List.of(Map.of("deleteDimension", Map.of("range",
                Map.of("sheetId", sheetId, "dimension", "ROWS", "startIndex", 4, "endIndex", 5)))));
    }

    @Test
    public void deleteTargetsTheSheetWhoseTitleMatchesWithAZeroBasedEndExclusiveRowRange() {
        startDelete();

        QueryExecutionResult result = run("deleteData", deleteCommand("Orders"));

        List<Request> api = apiRequests();
        System.out.println("[GoogleSheetsDeleteClearHandlerTest] " + api.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList() + " body " + bodyText(api.get(1)));
        assertTrue(result.isSuccess(), String.valueOf(result.getMessageArgs()));
        assertEquals(List.of("GET " + SPREADSHEET_PATH, "POST " + BATCH_PATH), api.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList());
        assertEquals(deleteBody(222), body(api.get(1)));
        assertEquals(List.of("Bearer " + TOKEN), api.get(1).header("Authorization"));
    }

    /**
     * Defect D10 fixed (BF-029): when no sheet has the named title, the delete fails with
     * {@code GOOGLESHEETS_QUERY_PARAM_ERROR} naming the sheet (GoogleSheetsDeleteDataHandler.java:47) and no
     * {@code batchUpdate} is sent, so a misspelt sheet name no longer deletes the row on the sheet with id 0.
     */
    @Test
    public void aSheetNameThatDoesNotExistIsRefusedAndNothingIsDeletedBF029() {
        startDelete();

        QueryExecutionResult result = run("deleteData", deleteCommand("Missing"));

        List<Request> api = apiRequests();
        System.out.println("[GoogleSheetsDeleteClearHandlerTest] missing sheet -> success " + result.isSuccess() + ", " + result.getMessageKey()
                + ", requests " + api.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList());
        assertFalse(result.isSuccess(), "the delete is refused");
        System.out.println("[GoogleSheetsDeleteClearHandlerTest] missing sheet message: " + failureText(result));
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertTrue(failureText(result).contains("Missing"), failureText(result));
        assertEquals(List.of("GET " + SPREADSHEET_PATH), api.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList(), "no batchUpdate is sent");
    }

    @Test
    public void clearPostsTheRowRangeWithAnEmptyBody() {
        start(CLEAR_PATH, json("{\"spreadsheetId\":\"sid\",\"clearedRange\":\"Sheet1!A5:Z5\"}"));

        QueryExecutionResult result = run("clearData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1", "rowIndexString", "4"));

        List<Request> api = apiRequests();
        System.out.println("[GoogleSheetsDeleteClearHandlerTest] clear -> " + api.get(0).method() + " " + api.get(0).pathAndQuery() + " body '" + bodyText(api.get(0)) + "' -> " + result.getData());
        assertTrue(result.isSuccess(), String.valueOf(result.getMessageArgs()));
        assertEquals(1, api.size());
        assertEquals("POST", api.get(0).method());
        assertEquals(CLEAR_PATH, api.get(0).pathAndQuery());
        assertEquals(Map.of(), body(api.get(0)));
        assertEquals(List.of("Bearer " + TOKEN), api.get(0).header("Authorization"));
        assertTrue(String.valueOf(result.getData()).contains("Sheet1!A5:Z5"), String.valueOf(result.getData()));
    }

    /**
     * Observation: delete and clear build the Sheets client before they create the Mono (GoogleSheetsDeleteDataHandler.java:37,
     * GoogleSheetsClearDataHandler.java:25), so a failure there (here: no credentials) is thrown to the caller of
     * {@code execute} and is not turned into a failed result by the engine's {@code onErrorResume}, unlike the other three
     * handlers, which build it inside the Mono.
     */
    @Test
    public void deleteAndClearBuildTheClientOutsideTheMonoSoAFailureIsThrown() {
        start(Map.of());
        GoogleSheetsQueryExecutionContext deleteContext = context("deleteData", deleteCommand("Orders"), Map.of());
        GoogleSheetsQueryExecutionContext clearContext = context("clearData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1", "rowIndexString", "4"), Map.of());
        deleteContext.setServiceAccountCredentials(null);
        clearContext.setServiceAccountCredentials(null);

        assertThrows(NullPointerException.class, () -> new GoogleSheetsDeleteDataHandler().execute(new Object(), deleteContext));
        assertThrows(NullPointerException.class, () -> new GoogleSheetsClearDataHandler().execute(new Object(), clearContext));
        GoogleSheetsQueryExecutionContext readContext = context("readData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1"), Map.of());
        readContext.setServiceAccountCredentials(null);
        QueryExecutionResult read = new org.lowcoder.plugin.googlesheets.GoogleSheetsPlugin.GoogleSheetsEngine()
                .executeQuery(new Object(), readContext).block();
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", read.getMessageKey(), "read builds the client inside the Mono: a failed result");
    }
}

package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer.Handler;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * {@link GoogleSheetsUpdateDataHandler} against a local server. Per the Sheets v4 reference: the header row
 * ({@code Sheet1!1:1}) and the row to change ({@code Sheet1!{n+1}:{n+1}}) are read with {@code spreadsheets.values.get},
 * then {@code spreadsheets.values.update} is
 * {@code PUT /v4/spreadsheets/{id}/values/{range}?valueInputOption=RAW&includeValuesInResponse=true} with a ValueRange body.
 * Row index {@code 7} of the query form is sheet row 8.
 */
public class GoogleSheetsUpdateHandlerTest extends GoogleSheetsCallSupport {

    private static final String HEADER_PATH = V4 + SPREADSHEET + "/values/Sheet1!1:1";
    private static final String ROW_PATH = V4 + SPREADSHEET + "/values/Sheet1!8:8";
    private static final String HEADER = "{\"range\":\"Sheet1!A1:C1\",\"majorDimension\":\"ROWS\",\"values\":[[\"name\",\"age\",\"city\"]]}";
    private static final String UPDATED = "{\"spreadsheetId\":\"sid\",\"updatedRange\":\"Sheet1!A8:C8\",\"updatedRows\":1,\"updatedColumns\":3,"
            + "\"updatedCells\":3,\"updatedData\":{\"range\":\"Sheet1!A8:C8\",\"values\":[[\"x\",\"6\",\"y\"]]}}";

    private static Map<String, Object> command(String column, String value) {
        return Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1", "rowIndexString", "7",
                "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", column, "value", value))));
    }

    private void startWith(String rowAnswer) {
        Map<String, Handler> routes = new HashMap<>();
        routes.put(HEADER_PATH, request -> json(HEADER));
        routes.put(ROW_PATH, request -> request.method().equals("PUT") ? json(UPDATED) : json(rowAnswer));
        start(routes);
    }

    @Test
    public void updateChangesOnlyTheNamedColumnsAndKeepsTheStoredCells() {
        startWith("{\"range\":\"Sheet1!A8:C8\",\"majorDimension\":\"ROWS\",\"values\":[[\"x\",\"5\",\"y\"]]}");

        QueryExecutionResult result = run("updateData", command("age", "6"));

        List<Request> api = apiRequests();
        System.out.println("[GoogleSheetsUpdateHandlerTest] " + api.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList() + " body " + bodyText(api.get(2)));
        assertTrue(result.isSuccess(), String.valueOf(result.getMessageArgs()));
        assertEquals(List.of("GET " + HEADER_PATH, "GET " + ROW_PATH), api.subList(0, 2).stream().map(r -> r.method() + " " + r.pathAndQuery()).toList());
        Request put = api.get(2);
        assertEquals("PUT", put.method());
        assertTrue(put.pathAndQuery().startsWith(ROW_PATH + "?"), put.pathAndQuery());
        assertEquals(Set.of("valueInputOption=RAW", "includeValuesInResponse=true"),
                Set.of(put.pathAndQuery().substring(put.pathAndQuery().indexOf('?') + 1).split("&")));
        assertEquals(Map.of("majorDimension", "ROWS", "values", List.of(List.of("x", "6", "y"))), body(put));
        assertEquals(List.of("Bearer " + TOKEN), put.header("Authorization"));
        assertTrue(String.valueOf(result.getData()).contains("Sheet1!A8:C8"), String.valueOf(result.getData()));
    }

    /**
     * BF-120 (NEW-38): a row with cells right of the last header was copied into an array sized by the header row, which
     * threw ArrayIndexOutOfBoundsException. Those cells have no column: the update writes the header's columns only, so
     * Sheets leaves the cells right of them as they are.
     */
    @Test
    public void aRowWiderThanTheHeaderRowUpdatesTheHeaderColumnsBF120() {
        startWith("{\"range\":\"Sheet1!A8:E8\",\"majorDimension\":\"ROWS\",\"values\":[[\"x\",\"5\",\"y\",\"extra\",\"more\"]]}");

        QueryExecutionResult result = run("updateData", command("age", "6"));

        List<Request> api = apiRequests();
        System.out.println("[GoogleSheetsUpdateHandlerTest] row wider than the header -> success=" + result.isSuccess() + " "
                + api.stream().map(Request::method).toList() + (api.size() > 2 ? " body " + bodyText(api.get(2)) : ""));
        assertTrue(result.isSuccess(), String.valueOf(result.getMessageArgs()));
        assertEquals(List.of("GET", "GET", "PUT"), api.stream().map(Request::method).toList());
        assertEquals(Map.of("majorDimension", "ROWS", "values", List.of(List.of("x", "6", "y"))), body(api.get(2)));
    }

    @Test
    public void aRowBeyondTheDataFailsAndNothingIsPut() {
        startWith("{\"range\":\"Sheet1!A8:Z8\",\"majorDimension\":\"ROWS\"}");

        QueryExecutionResult result = run("updateData", command("age", "6"));

        System.out.println("[GoogleSheetsUpdateHandlerTest] row beyond the data -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertEquals("Google Sheets request failed.", failureText(result), "the handler's own PluginException, not a JVM message");
        assertEquals(List.of("GET", "GET"), apiRequests().stream().map(Request::method).toList());
    }

    @Test
    public void whenNoChangeSetColumnMatchesAHeaderTheCallFailsAndNothingIsPut() {
        startWith("{\"range\":\"Sheet1!A8:C8\",\"majorDimension\":\"ROWS\",\"values\":[[\"x\",\"5\",\"y\"]]}");

        QueryExecutionResult result = run("updateData", command("nothing", "6"));

        assertFalse(result.isSuccess());
        assertEquals("Google Sheets query parameter is empty.", failureText(result));
        assertEquals(List.of("GET", "GET"), apiRequests().stream().map(Request::method).toList());
    }
}

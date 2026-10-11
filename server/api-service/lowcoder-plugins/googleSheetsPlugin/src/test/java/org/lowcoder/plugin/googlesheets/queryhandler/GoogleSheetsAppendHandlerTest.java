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
 * {@link GoogleSheetsAppendDataHandler} against a local server. Per the Sheets v4 reference: the header row is read with
 * {@code spreadsheets.values.get}, then {@code spreadsheets.values.append} is
 * {@code POST /v4/spreadsheets/{id}/values/{range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS} with a
 * ValueRange body ({@code range}, {@code majorDimension}, {@code values}).
 */
public class GoogleSheetsAppendHandlerTest extends GoogleSheetsCallSupport {

    private static final String READ_PATH = V4 + SPREADSHEET + "/values/Sheet1";
    private static final String APPEND_PATH = V4 + SPREADSHEET + "/values/Sheet1!A1:append";
    private static final String APPENDED = "{\"spreadsheetId\":\"sid\",\"tableRange\":\"Sheet1!A1:C2\",\"updates\":{\"spreadsheetId\":\"sid\","
            + "\"updatedRange\":\"Sheet1!A3:C3\",\"updatedRows\":1,\"updatedColumns\":3,\"updatedCells\":3}}";

    private static Map<String, Object> command(String column, String value) {
        return Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1",
                "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(
                        Map.of("column", column, "value", value), Map.of("column", "name", "value", "Ann"), Map.of("column", "other", "value", "ignored"))));
    }

    private Map<String, Handler> routes(String readAnswer) {
        Map<String, Handler> routes = new HashMap<>();
        routes.put(READ_PATH, request -> json(readAnswer));
        routes.put(APPEND_PATH, request -> json(APPENDED));
        return routes;
    }

    private static Set<String> queryOf(Request request) {
        return Set.of(request.pathAndQuery().substring(request.pathAndQuery().indexOf('?') + 1).split("&"));
    }

    @Test
    public void appendPostsOneRowInHeaderOrderWithBlanksForColumnsWithoutAValue() {
        start(routes("{\"range\":\"Sheet1!A1:C2\",\"values\":[[\"name\",\"age\",\"city\"],[\"x\",\"1\",\"y\"]]}"));

        QueryExecutionResult result = run("appendData", command("city", "Brno"));

        List<Request> api = apiRequests();
        System.out.println("[GoogleSheetsAppendHandlerTest] " + api.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList() + " body " + bodyText(api.get(1)));
        assertTrue(result.isSuccess(), String.valueOf(result.getMessageArgs()));
        assertEquals(2, api.size());
        assertEquals("GET", api.get(0).method());
        assertEquals(READ_PATH, api.get(0).pathAndQuery());
        Request post = api.get(1);
        assertEquals("POST", post.method());
        assertTrue(post.pathAndQuery().startsWith(APPEND_PATH + "?"), post.pathAndQuery());
        assertEquals(Set.of("valueInputOption=RAW", "insertDataOption=INSERT_ROWS"), queryOf(post));
        assertEquals(Map.of("majorDimension", "ROWS", "range", "Sheet1!A1", "values", List.of(List.of("Ann", "", "Brno"))), body(post));
        assertEquals(List.of("Bearer " + TOKEN), post.header("Authorization"));
        assertTrue(String.valueOf(result.getData()).contains("Sheet1!A3:C3"), String.valueOf(result.getData()));
    }

    @Test
    public void whenNoChangeSetColumnMatchesAHeaderTheCallFailsAndNothingIsPosted() {
        start(routes("{\"range\":\"Sheet1!A1:B2\",\"values\":[[\"age\",\"city\"]]}"));

        QueryExecutionResult result = run("appendData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1",
                "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "nothing", "value", "v")))));

        System.out.println("[GoogleSheetsAppendHandlerTest] no matching column -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertEquals("Google Sheets query parameter is empty.", failureText(result));
        assertEquals(List.of("GET"), apiRequests().stream().map(Request::method).toList());
    }

    /**
     * DEFECT D11 pinned (analysis-plugins section 0.6; plan section 9 "D1-D20" row; D-6, fix deferred): appending to an empty
     * sheet, for which the API answers a ValueRange without {@code values}, does {@code values.get(0)} on null
     * (GoogleSheetsAppendDataHandler.java:46-48). The caller gets no PluginException but the NPE text of the JVM as the
     * message, and nothing is appended. A fix that treats missing values as an empty sheet (or throws a PluginException)
     * turns these assertions red.
     */
    @Test
    public void appendingToAnEmptySheetFailsWithARawNullPointerMessageD11() {
        start(routes("{\"range\":\"Sheet1!A1:Z1000\",\"majorDimension\":\"ROWS\"}"));

        QueryExecutionResult result = run("appendData", command("city", "Brno"));

        System.out.println("[GoogleSheetsAppendHandlerTest] empty sheet -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertEquals("Cannot invoke \"java.util.List.get(int)\" because \"values\" is null", failureText(result));
        assertEquals(List.of("GET"), apiRequests().stream().map(Request::method).toList(), "nothing is appended");
    }
}

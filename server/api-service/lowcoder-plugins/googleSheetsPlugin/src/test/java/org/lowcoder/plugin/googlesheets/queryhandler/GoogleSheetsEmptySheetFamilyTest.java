package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer.Handler;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * BF-120, the D11 family: the API leaves {@code values} out of its answer for an empty range, and the handlers dereferenced
 * it without a check, so the caller got a failed GOOGLESHEETS_REQUEST_ERROR result carrying the JVM's NullPointerException
 * text. The append case is in {@link GoogleSheetsAppendHandlerTest}. Here:
 * <ul>
 *   <li>read of an empty sheet ({@code values.size()} in GoogleSheetsReadDataHandler.transformToFinalValues, R3): it has no
 *   rows, so the result is a success with an empty list;</li>
 *   <li>update when the header row is empty ({@code values1.get(0)} in GoogleSheetsUpdateDataHandler, U5): no change-set
 *   column matches, so the coded GOOGLESHEETS_QUERY_PARAM_EMPTY, and nothing is put;</li>
 *   <li>{@link GoogleSheetsGetPreParameters#firstRow}, which both append and update use.</li>
 * </ul>
 */
public class GoogleSheetsEmptySheetFamilyTest extends GoogleSheetsCallSupport {

    private static final String EMPTY_SHEET = "{\"range\":\"Sheet1!A1:Z1000\",\"majorDimension\":\"ROWS\"}";
    private static final String QUERY_PARAM_EMPTY_TEXT = "Google Sheets query parameter is empty.";

    @Test
    public void readingAnEmptySheetSucceedsWithNoRowsBF120() {
        start(V4 + SPREADSHEET + "/values/Sheet1", json(EMPTY_SHEET));

        QueryExecutionResult result = run("readData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1"));

        System.out.println("[GoogleSheetsEmptySheetFamilyTest] read empty sheet -> success=" + result.isSuccess() + " data=" + result.getData());
        assertTrue(result.isSuccess(), String.valueOf(result.getMessageArgs()));
        assertEquals(List.of(), result.getData());
        assertEquals(List.of("GET"), apiRequests().stream().map(Request::method).toList());
    }

    @Test
    public void updatingWithAnEmptyHeaderRowIsTheCodedQueryParamEmptyErrorBF120() {
        Map<String, Handler> routes = new HashMap<>();
        routes.put(V4 + SPREADSHEET + "/values/Sheet1!1:1", request -> json("{\"range\":\"Sheet1!A1:Z1\",\"majorDimension\":\"ROWS\"}"));
        routes.put(V4 + SPREADSHEET + "/values/Sheet1!8:8", request -> json("{\"range\":\"Sheet1!A8:B8\",\"values\":[[\"x\",\"5\"]]}"));
        start(routes);

        QueryExecutionResult result = run("updateData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1", "rowIndexString", "7",
                "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "name", "value", "Ann")))));

        System.out.println("[GoogleSheetsEmptySheetFamilyTest] update with empty header -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertEquals(QUERY_PARAM_EMPTY_TEXT, failureText(result));
        assertEquals(List.of("GET", "GET"), apiRequests().stream().map(Request::method).toList(), "nothing is put");
    }

    @Test
    public void firstRowIsTheHeaderRowOrEmptyWhenThereIsNoneBF120() {
        List<Object> header = List.of("name", "age");
        List<List<Object>> nullFirstRow = new ArrayList<>(Arrays.asList((List<Object>) null));
        Map<String, List<List<Object>>> noHeader = new java.util.LinkedHashMap<>();
        noHeader.put("no values", null);
        noHeader.put("no rows", List.of());
        noHeader.put("null first row", nullFirstRow);
        noHeader.put("empty first row", List.of(List.of(), List.of("x")));

        noHeader.forEach((name, values) -> {
            System.out.println("[GoogleSheetsEmptySheetFamilyTest] firstRow(" + name + ") -> " + GoogleSheetsGetPreParameters.firstRow(values));
            assertEquals(List.of(), GoogleSheetsGetPreParameters.firstRow(values), name);
        });
        assertEquals(header, GoogleSheetsGetPreParameters.firstRow(List.of(header, List.of("Ann", "5"))));
    }
}

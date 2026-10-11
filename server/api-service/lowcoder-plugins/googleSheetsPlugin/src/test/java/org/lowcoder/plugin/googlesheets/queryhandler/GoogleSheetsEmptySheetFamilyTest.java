package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer.Handler;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * The D11 family (analysis-plugins section 0.6; plan section 9 "D1-D20" row, D11: a missing {@code values} in a Sheets
 * answer, which the API sends for an empty range, is dereferenced without a check; D-6, fix deferred). The append case is
 * pinned in {@link GoogleSheetsAppendHandlerTest}. The same defect, found by the L4-13b probes, is pinned here for:
 * <ul>
 *   <li>read of an empty sheet: {@code values.size()} in GoogleSheetsReadDataHandler.transformToFinalValues (R3);</li>
 *   <li>update when the header row is empty: {@code values1.get(0)} in GoogleSheetsUpdateDataHandler (U5).</li>
 * </ul>
 * Each caller gets a failed GOOGLESHEETS_REQUEST_ERROR result whose message is the JVM's NPE text, not a coded error. A fix
 * that treats missing values as empty (read: an empty list; update: a coded PluginException) turns these assertions red.
 */
public class GoogleSheetsEmptySheetFamilyTest extends GoogleSheetsCallSupport {

    @Test
    public void readingAnEmptySheetFailsWithARawNullPointerMessageR3() {
        start(V4 + SPREADSHEET + "/values/Sheet1", json("{\"range\":\"Sheet1!A1:Z1000\",\"majorDimension\":\"ROWS\"}"));

        QueryExecutionResult result = run("readData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1"));

        System.out.println("[GoogleSheetsEmptySheetFamilyTest] read empty sheet -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertEquals("Cannot invoke \"java.util.List.size()\" because \"values\" is null", failureText(result));
        assertEquals(List.of("GET"), apiRequests().stream().map(Request::method).toList());
    }

    @Test
    public void updatingWithAnEmptyHeaderRowFailsWithARawNullPointerMessageU5() {
        Map<String, Handler> routes = new HashMap<>();
        routes.put(V4 + SPREADSHEET + "/values/Sheet1!1:1", request -> json("{\"range\":\"Sheet1!A1:Z1\",\"majorDimension\":\"ROWS\"}"));
        routes.put(V4 + SPREADSHEET + "/values/Sheet1!8:8", request -> json("{\"range\":\"Sheet1!A8:B8\",\"values\":[[\"x\",\"5\"]]}"));
        start(routes);

        QueryExecutionResult result = run("updateData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Sheet1", "rowIndexString", "7",
                "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "name", "value", "Ann")))));

        System.out.println("[GoogleSheetsEmptySheetFamilyTest] update with empty header -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertEquals("Cannot invoke \"java.util.List.get(int)\" because \"values1\" is null", failureText(result));
        assertEquals(List.of("GET", "GET"), apiRequests().stream().map(Request::method).toList(), "nothing is put");
    }
}

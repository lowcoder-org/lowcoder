package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * {@link GoogleSheetsReadDataHandler} against a local server. Request shape per the Sheets v4 reference,
 * {@code spreadsheets.values.get}: {@code GET /v4/spreadsheets/{spreadsheetId}/values/{range}}, the range being the sheet
 * name. The token request is part of the exchange (see {@link GoogleSheetsCallSupport}).
 */
public class GoogleSheetsReadHandlerTest extends GoogleSheetsCallSupport {

    private static final String READ_PATH = V4 + SPREADSHEET + "/values/Sheet1";
    private static final String ANSWER = "{\"range\":\"Sheet1!A3:D6\",\"majorDimension\":\"ROWS\",\"values\":"
            + "[[\"name\",\"\",\"name\"],[\"a\",\"1\"],[\"b\",\"2\",\"x\",\"extra\"]]}";
    private static final Map<String, Object> COMMAND = Map.of("spreadsheetId", "{{id}}", "sheetName", "{{sheet}}");

    private static Map<String, String> row(String... pairs) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            row.put(pairs[i], pairs[i + 1]);
        }
        return row;
    }

    @Test
    public void readIssuesOneGetWithTheServedTokenAndReturnsTheRowsWithOffsetsAndRenamedHeaders() {
        start(READ_PATH, json(ANSWER));

        QueryExecutionResult result = run("readData", COMMAND, Map.of("id", SPREADSHEET, "sheet", "Sheet1"));

        List<Request> all = requests();
        System.out.println("[GoogleSheetsReadHandlerTest] requests " + all.stream().map(r -> r.method() + " " + r.pathAndQuery()).toList() + " -> " + result.getData());
        assertEquals(2, all.size());
        // 1: the token request carries the jwt-bearer grant for the service account and the Sheets scope
        Request token = all.get(0);
        assertEquals("POST", token.method());
        assertEquals(TOKEN_PATH, token.pathAndQuery());
        assertTrue(token.header("Content-Type").get(0).startsWith("application/x-www-form-urlencoded"));
        assertTrue(token.bodyText().contains("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer"), token.bodyText());
        Map<String, Object> assertion = assertionPayload(token);
        assertEquals("bot@project.iam.gserviceaccount.com", assertion.get("iss"));
        assertTrue(String.valueOf(assertion.get("scope")).contains("https://www.googleapis.com/auth/spreadsheets"), String.valueOf(assertion));
        // 2: the API request uses the served token
        Request api = all.get(1);
        assertEquals("GET", api.method());
        assertEquals(READ_PATH, api.pathAndQuery());
        assertEquals(List.of("Bearer " + TOKEN), api.header("Authorization"));
        // result: row indexes start at the answered range's first row, blank and repeated headers are renamed, short rows padded
        assertTrue(result.isSuccess());
        assertEquals(List.of(
                row("rowIndex", "3", "name", "a", "Column-2", "1", "name_1", "", "Column-4", ""),
                row("rowIndex", "4", "name", "b", "Column-2", "2", "name_1", "x", "Column-4", "extra")), result.getData());
    }

    @Test
    public void anApiErrorAnswerBecomesAFailedResultCarryingTheApiMessage() {
        start(READ_PATH, json(403, "{\"error\":{\"code\":403,\"message\":\"The caller does not have permission\",\"status\":\"PERMISSION_DENIED\"}}"));

        QueryExecutionResult result = run("readData", COMMAND, Map.of("id", SPREADSHEET, "sheet", "Sheet1"));

        System.out.println("[GoogleSheetsReadHandlerTest] 403 -> " + result.getMessageKey() + " " + failureText(result));
        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertTrue(failureText(result).contains("403"), failureText(result));
        assertTrue(failureText(result).contains("The caller does not have permission"), failureText(result));
        assertEquals(1, apiRequests().size());
    }

    @Test
    public void aSheetThatTheServerDoesNotKnowAnswers404AsAFailedResult() {
        start(READ_PATH, json(ANSWER));

        QueryExecutionResult result = run("readData", Map.of("spreadsheetId", SPREADSHEET, "sheetName", "Other"));

        assertFalse(result.isSuccess());
        assertEquals("GOOGLESHEETS_REQUEST_ERROR", result.getMessageKey());
        assertTrue(failureText(result).contains("404"), failureText(result));
    }
}

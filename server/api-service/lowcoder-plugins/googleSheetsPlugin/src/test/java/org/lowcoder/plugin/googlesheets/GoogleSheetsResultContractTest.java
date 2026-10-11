package org.lowcoder.plugin.googlesheets;

import com.google.api.client.json.GenericJson;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.model.AppendValuesResponse;
import com.google.api.services.sheets.v4.model.BatchUpdateSpreadsheetResponse;
import com.google.api.services.sheets.v4.model.ClearValuesResponse;
import com.google.api.services.sheets.v4.model.UpdateValuesResponse;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.model.ServiceAccountJsonUtils;
import org.lowcoder.plugin.googlesheets.queryhandler.GoogleSheetsReadDataHandler;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The Google Sheets rows of the §4.6 producer table and group {@code external-json} of
 * {@code ServiceAccountJsonUtils} (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.10, task T8.2).
 * <ul>
 *   <li>Read: {@code GoogleSheetsReadDataHandler.transformToFinalValues} on a {@link ValueRange} parsed from a Sheets
 *       API answer the way the Google client parses it ({@link GsonFactory}); the result is a {@code List} of
 *       {@code Map<String,String>} with {@code rowIndex}, renamed blank and repeated headers. A cell that is not text
 *       (an unformatted number) fails with a {@link ClassCastException} (O76).</li>
 *   <li>Append, update, delete, clear: {@code response.values()} of each response class parsed from an API answer
 *       ({@code GenericData} values, nested response objects included): a list of the values without their names (O77).</li>
 *   <li>The service-account key: {@code ServiceAccountJsonUtils.getData} reads the key text with
 *       {@code JsonUtils.fromJsonMap} and keeps four strings; a non-string value fails with a
 *       {@link ClassCastException} (O76).</li>
 * </ul>
 * Pinned in {@value #REPORT}.
 *
 * <p>Limits: no Google API is called; the answers are parsed with the client's own JSON factory.
 */
public class GoogleSheetsResultContractTest {

    static final String REPORT = "external-json/GoogleSheets.results.json";
    static final String READ_ANSWER = "{\"range\":\"Sheet1!A3:D6\",\"majorDimension\":\"ROWS\",\"values\":"
            + "[[\"name\",\"\",\"name\"],[\"žluť\",\"1.50\"],[\"b\",\"2\",\"x\",\"extra\"]]}";
    static final String UNFORMATTED_READ_ANSWER = "{\"range\":\"Sheet1!A1:B2\",\"values\":[[\"n\"],[1.5]]}";
    static final String UPDATE_ANSWER = "{\"spreadsheetId\":\"s1\",\"updatedRange\":\"Sheet1!A7:B7\",\"updatedRows\":1,"
            + "\"updatedColumns\":2,\"updatedCells\":2,\"updatedData\":{\"range\":\"Sheet1!A7:B7\",\"values\":[[\"a\",\"1.50\"]]}}";
    static final String APPEND_ANSWER = "{\"spreadsheetId\":\"s1\",\"tableRange\":\"Sheet1!A1:B6\",\"updates\":" + UPDATE_ANSWER + "}";
    static final String DELETE_ANSWER = "{\"spreadsheetId\":\"s1\",\"replies\":[{}]}";
    static final String CLEAR_ANSWER = "{\"spreadsheetId\":\"s1\",\"clearedRange\":\"Sheet1!A7:Z7\"}";
    static final String SERVICE_ACCOUNT = "{\"type\":\"service_account\",\"client_id\":\"1234567890\",\"client_email\":"
            + "\"bot@p.iam.gserviceaccount.com\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\nMIIE\\u002Bž\\n-----END PRIVATE KEY-----\\n\","
            + "\"private_key_id\":\"k1\"}";
    static final String NUMERIC_CLIENT_ID = "{\"client_id\":1234567890}";

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites("lowcoder-plugins/googleSheetsPlugin/src/main/java/org/lowcoder/plugin/googlesheets/model/ServiceAccountJsonUtils.java#ServiceAccountJsonUtils.getData#fromJsonMap#1")
    @Test
    public void resultsAsPinned() throws IOException {
        GoogleSheetsReadDataHandler readHandler = new GoogleSheetsReadDataHandler();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("read", result(() -> readHandler.transformToFinalValues(parse(READ_ANSWER, ValueRange.class))));
        report.put("readUnformattedNumber", result(() -> readHandler.transformToFinalValues(parse(UNFORMATTED_READ_ANSWER, ValueRange.class))));
        report.put("append", result(() -> parse(APPEND_ANSWER, AppendValuesResponse.class).values()));
        report.put("update", result(() -> parse(UPDATE_ANSWER, UpdateValuesResponse.class).values()));
        report.put("delete", result(() -> parse(DELETE_ANSWER, BatchUpdateSpreadsheetResponse.class).values()));
        report.put("clear", result(() -> parse(CLEAR_ANSWER, ClearValuesResponse.class).values()));
        report.put("serviceAccount", serviceAccount(SERVICE_ACCOUNT));
        report.put("serviceAccountNumericClientId", serviceAccount(NUMERIC_CLIENT_ID));
        String actual = ConfigBinding.write(report);
        System.out.println("[GoogleSheetsResultContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The value a handler produces. */
    interface Producer {
        Object produce() throws IOException;
    }

    /** The report of {@code QueryExecutionResult.success(value)}, as each handler returns it, or the error. */
    private static Object result(Producer producer) {
        try {
            return QueryResults.report(QueryExecutionResult.success(producer.produce()));
        } catch (IOException | RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    private static <T extends GenericJson> T parse(String answer, Class<T> type) throws IOException {
        return JSON_FACTORY.fromString(answer, type);
    }

    private static Object serviceAccount(String key) {
        ServiceAccountJsonUtils utils = new ServiceAccountJsonUtils();
        try {
            utils.getData(key);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("clientId", utils.getClientId());
        fields.put("clientEmail", utils.getClientEmail());
        fields.put("privateKeyPkcs8", utils.getPrivateKeyPkcs8());
        fields.put("privateKeyId", utils.getPrivateKeyId());
        return fields;
    }
}

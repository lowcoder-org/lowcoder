package org.lowcoder.plugin.googlesheets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.GoogleSheetsPlugin.GoogleSheetsEngine;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsActionRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsAppendDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsClearDataRequst;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsDatasourceConfig;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsDeleteDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsQueryExecutionContext;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsReadDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsUpdateDataRequest;
import org.lowcoder.plugin.googlesheets.model.ServiceAccountJsonUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.query.QueryVisitorContext;

import com.google.api.services.sheets.v4.SheetsScopes;

/**
 * {@link GoogleSheetsEngine}: configuration checks, the connection stubs, {@code buildQueryExecutionContext} for every
 * action type and for invalid input, {@code executeQuery} with an unknown action type, defect D9 ({@code toString()}
 * printed the private key; fixed by BF-026) and the testConnection row (reports success without using the service
 * account). The service account is generated at test time ({@link ServiceAccountTestKeys}); no network is used.
 */
public class GoogleSheetsEngineTest {

    private static final String VISITOR = "visitor-1";
    private static final Map<String, Object> PARAMS = Map.of("id", "sheet-id-9", "name", "Orders", "row", "7", "who", "Ann");
    private static final Map<String, Object> CHANGE_SET = Map.of("compType", "KEY_VALUE_PAIRS",
            "comp", List.of(Map.of("column", "name", "value", "{{who}}")));

    private final GoogleSheetsEngine engine = new GoogleSheetsEngine();
    private final GoogleSheetsDatasourceConfig config = engine.resolveConfig(Map.of("serviceAccount", ServiceAccountTestKeys.json()));
    private final QueryVisitorContext visitor = new QueryVisitorContext(VISITOR, "org-1", 0, null, null, Set.of());

    private static Map<String, Object> queryConfig(String commandType, Map<String, Object> command) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("commandType", commandType);
        map.put("command", command);
        return map;
    }

    private static Map<String, Object> command(Object... extra) {
        Map<String, Object> command = new java.util.HashMap<>(Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}"));
        for (int i = 0; i < extra.length; i += 2) {
            command.put((String) extra[i], extra[i + 1]);
        }
        return command;
    }

    private GoogleSheetsQueryExecutionContext build(String commandType, Map<String, Object> command) {
        return engine.buildQueryExecutionContext(config, queryConfig(commandType, command), PARAMS, visitor);
    }

    private PluginException invalid(String commandType, Map<String, Object> command) {
        return assertThrows(PluginException.class, () -> build(commandType, command), commandType);
    }

    @Test
    public void validateConfigRequiresAServiceAccountAndTheConnectionIsASharedStub() {
        assertEquals(Set.of(), engine.validateConfig(config));
        for (String blank : new String[] {null, "", "  "}) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("serviceAccount", blank);
            assertEquals(Set.of("GOOGLESHEETS_DATASOURCE_CONFIG_ERROR"), engine.validateConfig(engine.resolveConfig(map)), String.valueOf(blank));
        }
        Object first = engine.createConnection(config).block();
        Object second = engine.createConnection(null).block();
        System.out.println("[GoogleSheetsEngineTest] connection objects " + first + " / " + second);
        assertNotNull(first);
        assertSame(first, second, "one shared stub, whatever the config");
        assertEquals(null, engine.destroyConnection(first).block());
    }

    @Test
    public void everyActionTypeBuildsItsRequestWithRenderedValuesAndCredentialsFromTheKey() throws IOException {
        Map<String, Class<? extends GoogleSheetsActionRequest>> expected = new java.util.LinkedHashMap<>();
        expected.put("readData", GoogleSheetsReadDataRequest.class);
        expected.put("appendData", GoogleSheetsAppendDataRequest.class);
        expected.put("updateData", GoogleSheetsUpdateDataRequest.class);
        expected.put("clearData", GoogleSheetsClearDataRequst.class);
        expected.put("deleteData", GoogleSheetsDeleteDataRequest.class);
        for (Map.Entry<String, Class<? extends GoogleSheetsActionRequest>> entry : expected.entrySet()) {
            Map<String, Object> command = command("rowIndexString", "{{row}}", "changeSet", CHANGE_SET);

            GoogleSheetsQueryExecutionContext context = build(entry.getKey(), command);

            System.out.println("[GoogleSheetsEngineTest] " + entry.getKey() + " -> " + context.getGoogleSheetsActionRequest().getClass().getSimpleName());
            assertEquals(entry.getKey(), context.getActionType());
            assertEquals(VISITOR, context.getVisitorId());
            assertEquals(ServiceAccountTestKeys.json(), context.getServiceAccount());
            assertInstanceOf(entry.getValue(), context.getGoogleSheetsActionRequest());
            assertEquals(ServiceAccountTestKeys.CLIENT_EMAIL, context.getServiceAccountCredentials().getClientEmail());
            assertEquals(ServiceAccountTestKeys.CLIENT_ID, context.getServiceAccountCredentials().getClientId());
            assertEquals(ServiceAccountTestKeys.PRIVATE_KEY_ID, context.getServiceAccountCredentials().getPrivateKeyId());
            assertEquals(SheetsScopes.all(), Set.copyOf(context.getServiceAccountCredentials().getScopes()));
        }
        GoogleSheetsUpdateDataRequest update = (GoogleSheetsUpdateDataRequest) build("updateData", command("rowIndexString", "{{row}}", "changeSet", CHANGE_SET))
                .getGoogleSheetsActionRequest();
        assertEquals("sheet-id-9", update.getSpreadsheetId());
        assertEquals("Orders", update.getSheetName());
        assertEquals(7, update.getRowIndex());
        assertEquals("Ann", update.getChangeSetItems().getItem("name").renderedValue());
    }

    @Test
    public void anUnknownOrBlankCommandTypeAndBlankIdentifiersAreRejectedAsEmptyQueryParam() {
        for (String type : new String[] {"", "dropTable", "READDATA"}) {
            PluginException failure = invalid(type, command());
            System.out.println("[GoogleSheetsEngineTest] type '" + type + "' -> " + failure.getError() + " " + failure.getMessageKey());
            assertEquals(GoogleSheetError.GOOGLESHEETS_EMPTY_QUERY_PARAM, failure.getError());
            assertEquals("GOOGLESHEETS_QUERY_PARAM_EMPTY", failure.getMessageKey());
        }
        for (String type : new String[] {"readData", "clearData", "deleteData", "appendData", "updateData"}) {
            Map<String, Object> noSheet = command("rowIndexString", "1", "changeSet", CHANGE_SET);
            noSheet.put("sheetName", " ");
            Map<String, Object> noId = command("rowIndexString", "1", "changeSet", CHANGE_SET);
            noId.put("spreadsheetId", "{{missing}}");
            assertEquals(GoogleSheetError.GOOGLESHEETS_EMPTY_QUERY_PARAM, invalid(type, noSheet).getError(), type + " blank sheet name");
            assertEquals(GoogleSheetError.GOOGLESHEETS_EMPTY_QUERY_PARAM, invalid(type, noId).getError(), type + " id renders to nothing");
        }
    }

    /**
     * DEFECT pinned (new plan section 9 row "Google Sheets: a malformed service-account key fails with a raw
     * RuntimeException"; D-6, fix deferred). A user pastes the service-account JSON in the datasource form, and
     * validateConfig only checks that it is not blank. When the key is not a PKCS8 PEM,
     * {@code ServiceAccountCredentials.fromPkcs8} throws an IOException that GoogleSheetsPlugin.java:125-127 wraps in a
     * plain RuntimeException, not a PluginException with a message key, so the caller gets no coded error. A fix that
     * throws a PluginException turns the type assertions red.
     */
    @Test
    public void aMalformedPrivateKeyFailsWithARawRuntimeException() {
        Map<String, Object> bad = Map.of("serviceAccount", ServiceAccountTestKeys.json("not a key"));
        GoogleSheetsDatasourceConfig badConfig = engine.resolveConfig(bad);

        assertEquals(Set.of(), engine.validateConfig(badConfig), "validateConfig does not look at the key");
        RuntimeException failure = assertThrows(RuntimeException.class,
                () -> engine.buildQueryExecutionContext(badConfig, queryConfig("readData", command()), PARAMS, visitor));

        System.out.println("[GoogleSheetsEngineTest] malformed key -> " + failure.getClass().getName() + ": " + failure.getMessage()
                + " (cause " + failure.getCause() + ")");
        assertEquals(RuntimeException.class, failure.getClass());
        assertInstanceOf(IOException.class, failure.getCause());
    }

    /**
     * Observed, no defect row (ruled): the client always sends {@code commandType} and {@code command}
     * (googleSheetsQuery.tsx:72-79 builds the query as a type-and-children component keyed "commandType"/"command" with
     * default "readData"), so a missing {@code command} is only reachable through a direct API caller. Today it is an
     * empty-query-parameter error for read, clear and delete and an NPE in {@code from(null)} for append and update, and a service account that is not JSON object text fails inside
     * {@code ServiceAccountJsonUtils.getData}: JSON without a private_key fails inside the Google library (NPE), a JSON array in getData's map (NPE); the same family as the malformed-key row, asserted as observed.
     */
    @Test
    public void aMissingCommandMapAndAnUnreadableServiceAccountFailWithRawExceptionsAsObserved() {
        for (String type : new String[] {"readData", "clearData", "deleteData", "appendData", "updateData"}) {
            Map<String, Object> noCommand = new java.util.HashMap<>();
            noCommand.put("commandType", type);
            RuntimeException missing = assertThrows(RuntimeException.class, () -> engine.buildQueryExecutionContext(config, noCommand, PARAMS, visitor), type);
            System.out.println("[GoogleSheetsEngineTest] missing command, " + type + " -> " + missing);
            // read, clear and delete bind "null" to nothing and are rejected as an empty query parameter (:93-95);
            // append and update call from(null) and fail with an NPE
            if (type.equals("appendData") || type.equals("updateData")) {
                assertEquals(NullPointerException.class, missing.getClass(), type);
            } else {
                assertEquals(GoogleSheetError.GOOGLESHEETS_EMPTY_QUERY_PARAM, ((PluginException) missing).getError(), type);
            }
        }

        for (String account : new String[] {"{\"client_email\":\"a@b\"}", "[1]"}) {
            GoogleSheetsDatasourceConfig odd = engine.resolveConfig(Map.of("serviceAccount", account));
            RuntimeException failure = assertThrows(RuntimeException.class,
                    () -> engine.buildQueryExecutionContext(odd, queryConfig("readData", command()), PARAMS, visitor), account);
            System.out.println("[GoogleSheetsEngineTest] service account " + account + " -> " + failure);
            assertEquals(NullPointerException.class, failure.getClass(), account);
        }
    }

    /**
     * Not an error result: {@code executeQuery} looks the handler up before it builds the Mono, so an unknown action type
     * is thrown to the caller (GoogleSheetsPlugin.java:131-132, factory :28) and the {@code onErrorResume} mapping to
     * GOOGLESHEETS_REQUEST_ERROR is never reached for it.
     */
    @Test
    public void executeQueryWithAnUnknownActionTypeThrowsBeforeAnyResultIsBuilt() {
        GoogleSheetsQueryExecutionContext context = new GoogleSheetsQueryExecutionContext();
        context.setActionType("dropTable");

        PluginException failure = assertThrows(PluginException.class, () -> engine.executeQuery(new Object(), context));

        System.out.println("[GoogleSheetsEngineTest] executeQuery unknown type -> " + failure.getError() + " " + failure.getMessage());
        assertEquals(org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR, failure.getError());
        assertEquals("GOOGLESHEETS_QUERY_PARAM_ERROR", failure.getMessageKey());
    }

    /**
     * DEFECT pinned (new plan section 9 row "Google Sheets testConnection reports success without using the service
     * account"; D-6, fix deferred). {@code testConnection} (GoogleSheetsPlugin.java:64-66) is
     * {@code Mono.just(testSuccess())}: it succeeds for a service account that is garbage or has a key that cannot be
     * parsed, and for a config that validateConfig rejects. A fix that parses the key (or makes an authenticated call)
     * turns the garbage and bad-key assertions red.
     */
    @Test
    public void testConnectionSucceedsForAnyConfigWithoutLookingAtTheServiceAccountD() {
        List<String> accounts = new java.util.ArrayList<>(List.of("garbage", ServiceAccountTestKeys.json("not a key"), ServiceAccountTestKeys.json()));
        accounts.add(null);
        for (String account : accounts) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("serviceAccount", account);
            DatasourceTestResult result = engine.testConnection(engine.resolveConfig(map)).block();
            System.out.println("[GoogleSheetsEngineTest] testConnection(" + (account == null ? null : account.substring(0, Math.min(12, account.length()))) + ") -> success " + result.isSuccess());
            assertTrue(result.isSuccess());
        }
    }

    /**
     * Defect D9 fixed (BF-026 d): {@code GoogleSheetsQueryExecutionContext.toString()} (:20) prints
     * {@code <hidden>} for the service-account JSON and the credentials built from it, and
     * {@code ServiceAccountJsonUtils.toString()} (:31) for {@code privateKeyPkcs8}; the non-secret fields are still printed.
     */
    @Test
    public void toStringOfTheContextAndOfTheKeyReaderHideThePrivateKeyBF026() {
        GoogleSheetsQueryExecutionContext context = build("readData", command());
        ServiceAccountJsonUtils reader = new ServiceAccountJsonUtils();
        reader.getData(ServiceAccountTestKeys.json());

        String contextText = context.toString();
        String readerText = reader.toString();

        System.out.println("[GoogleSheetsEngineTest] context.toString() has the key: " + contextText.contains(ServiceAccountTestKeys.keyMarker())
                + ", reader.toString() has the key: " + readerText.contains(ServiceAccountTestKeys.keyMarker()));
        System.out.println("[GoogleSheetsEngineTest] context: " + contextText + "; reader: " + readerText);
        assertFalse(contextText.contains(ServiceAccountTestKeys.keyMarker()), "the context hides the key");
        assertFalse(contextText.contains(ServiceAccountTestKeys.CLIENT_EMAIL), "the context hides the whole service-account JSON");
        assertTrue(contextText.contains("serviceAccount=<hidden>"), contextText);
        assertTrue(contextText.contains("actionType='readData'"), contextText);
        assertFalse(readerText.contains(ServiceAccountTestKeys.keyMarker()), "the key reader hides the key");
        assertTrue(readerText.contains("privateKeyPkcs8=<hidden>"), readerText);
        assertTrue(readerText.contains(ServiceAccountTestKeys.CLIENT_EMAIL), "non-secret fields are still printed");
    }
}

package org.lowcoder.plugin.googlesheets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsActionRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsAppendDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsClearDataRequst;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsDatasourceConfig;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsDeleteDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsReadDataRequest;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsUpdateDataRequest;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow;
import org.lowcoder.sdk.util.JsonUtils;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

/**
 * The request classes (binding, mustache rendering, row index, {@code hasInvalidData}) and
 * {@link GoogleSheetsDatasourceConfig} (merge, encrypt/decrypt, and the D8 log).
 */
public class GoogleSheetsRequestModelsTest {

    private static final Map<String, Object> PARAMS = Map.of("id", "sheet-9", "name", "Orders", "row", "12", "col", "age", "n", 41);
    private static final String SERVICE_ACCOUNT = ServiceAccountTestKeys.json();

    private final Logger configLogger = (Logger) LoggerFactory.getLogger(GoogleSheetsDatasourceConfig.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    public void captureLog() {
        logs.start();
        configLogger.addAppender(logs);
    }

    @AfterEach
    public void releaseLog() {
        configLogger.detachAppender(logs);
        logs.stop();
    }

    private static Map<String, Object> changeSet() {
        return Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "{{col}}x", "value", "{{n}}"), Map.of("column", "name", "value", "Ann")));
    }

    private static <T> T bind(Class<T> type, Map<String, Object> map) {
        return JsonUtils.fromJson(JsonUtils.toJson(map), type);
    }

    @Test
    public void readRequestIsBoundFromJsonAndRendersIdNameAndRangeButNotLimitAndOffset() {
        GoogleSheetsReadDataRequest request = bind(GoogleSheetsReadDataRequest.class,
                Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}", "range", "A{{row}}:B{{row}}", "limit", 5, "offset", 2));

        request.renderParams(PARAMS);

        assertEquals("sheet-9", request.getSpreadsheetId());
        assertEquals("Orders", request.getSheetName());
        assertEquals("A12:B12", request.getRange());
        assertEquals(5, request.getLimit());
        assertEquals(2, request.getOffset());
        assertFalse(request.hasInvalidData());
    }

    @Test
    public void appendAndUpdateRequestsRenderTheChangeSetAndUpdateParsesTheRowIndex() {
        Map<String, Object> command = Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}", "rowIndexString", "{{row}}", "changeSet", changeSet());

        GoogleSheetsAppendDataRequest append = GoogleSheetsAppendDataRequest.from(command);
        append.renderParams(PARAMS);
        GoogleSheetsUpdateDataRequest update = GoogleSheetsUpdateDataRequest.from(command);
        update.renderParams(PARAMS);

        for (Map.Entry<String, SheetChangeSetRow> entry : Map.of("append", append.getChangeSetItems(), "update", update.getChangeSetItems()).entrySet()) {
            System.out.println("[GoogleSheetsRequestModelsTest] " + entry.getKey() + " columns " + entry.getValue().getColumns());
            assertEquals(java.util.Set.of("name", "{{col}}x"), entry.getValue().getColumns(), "column names are not rendered");
            assertEquals("Ann", entry.getValue().getItem("name").renderedValue());
            assertEquals(41, entry.getValue().getItem("{{col}}x").renderedValue(), "the value is rendered and typed");
        }
        assertEquals("sheet-9", append.getSpreadsheetId());
        assertEquals("Orders", update.getSheetName());
        assertEquals(12, update.getRowIndex());
        assertFalse(append.hasInvalidData());
        assertFalse(update.hasInvalidData());
    }

    @Test
    public void deleteAndClearRequestsParseTheRowIndexAndRejectANonNumber() {
        for (GoogleSheetsActionRequest request : List.of(
                bind(GoogleSheetsDeleteDataRequest.class, Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}", "rowIndexString", " {{row}}")),
                bind(GoogleSheetsClearDataRequst.class, Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}", "rowIndexString", " {{row}}")))) {
            String type = request.getClass().getSimpleName();
            PluginException failure = assertThrows(PluginException.class, () -> request.renderParams(PARAMS), type + " with a blank-padded index");
            System.out.println("[GoogleSheetsRequestModelsTest] " + type + " ' 12' -> " + failure.getMessageKey());
            assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, failure.getError());
        }
        GoogleSheetsDeleteDataRequest delete = bind(GoogleSheetsDeleteDataRequest.class, Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}", "rowIndexString", "{{row}}"));
        GoogleSheetsClearDataRequst clear = bind(GoogleSheetsClearDataRequst.class, Map.of("spreadsheetId", "{{id}}", "sheetName", "{{name}}", "rowIndexString", "3"));
        delete.renderParams(PARAMS);
        clear.renderParams(PARAMS);
        assertEquals("Orders", delete.getSheetName());
        assertEquals("Orders", clear.getSheetName());
        assertEquals(12, delete.getRowIndex());
        assertEquals(3, clear.getRowIndex());
        assertEquals("sheet-9", clear.getSpreadsheetId());
        for (String bad : new String[] {"x", "", "1.5", "{{missing}}"}) {
            GoogleSheetsUpdateDataRequest update = GoogleSheetsUpdateDataRequest.from(
                    Map.of("spreadsheetId", "a", "sheetName", "b", "rowIndexString", bad, "changeSet", changeSet()));
            assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, assertThrows(PluginException.class, () -> update.renderParams(PARAMS), bad).getError());
        }
    }

    @Test
    public void everyRequestClassIsInvalidWhenTheIdOrTheSheetNameIsBlank() {
        Map<String, Function<Map<String, Object>, GoogleSheetsActionRequest>> factories = new java.util.LinkedHashMap<>();
        factories.put("read", map -> bind(GoogleSheetsReadDataRequest.class, map));
        factories.put("delete", map -> bind(GoogleSheetsDeleteDataRequest.class, map));
        factories.put("clear", map -> bind(GoogleSheetsClearDataRequst.class, map));
        factories.put("append", GoogleSheetsAppendDataRequest::from);
        factories.put("update", GoogleSheetsUpdateDataRequest::from);
        for (Map.Entry<String, Function<Map<String, Object>, GoogleSheetsActionRequest>> entry : factories.entrySet()) {
            for (String[] ids : new String[][] {{"a", "b", "valid"}, {"", "b", "invalid"}, {"a", " ", "invalid"}, {"{{missing}}", "b", "invalid"}}) {
                GoogleSheetsActionRequest request = entry.getValue().apply(Map.of("spreadsheetId", ids[0], "sheetName", ids[1], "rowIndexString", "1", "changeSet", changeSet()));
                request.renderParams(PARAMS);
                assertEquals(ids[2].equals("invalid"), request.hasInvalidData(), entry.getKey() + " " + String.join("|", ids));
            }
        }
    }

    @Test
    public void aCommandWithoutAChangeSetIsRejectedForAppendAndUpdate() {
        for (Map<String, Object> badSet : List.<Map<String, Object>>of(Map.of(), Map.of("changeSet", Map.of()), Map.of("changeSet", Map.of("comp", List.of())))) {
            PluginException append = assertThrows(PluginException.class, () -> GoogleSheetsAppendDataRequest.from(badSet), String.valueOf(badSet));
            PluginException update = assertThrows(PluginException.class, () -> GoogleSheetsUpdateDataRequest.from(badSet), String.valueOf(badSet));
            assertEquals(PluginCommonError.INVALID_GUI_SETTINGS, append.getError());
            assertEquals(PluginCommonError.INVALID_GUI_SETTINGS, update.getError());
        }
    }

    @Test
    public void configMergeKeepsTheStoredServiceAccountAndRejectsAForeignConfig() {
        GoogleSheetsDatasourceConfig stored = GoogleSheetsDatasourceConfig.buildFrom(Map.of("serviceAccount", "stored"));

        GoogleSheetsDatasourceConfig kept = (GoogleSheetsDatasourceConfig) stored.mergeWithUpdatedConfig(GoogleSheetsDatasourceConfig.builder().build());
        GoogleSheetsDatasourceConfig replaced = (GoogleSheetsDatasourceConfig) stored.mergeWithUpdatedConfig(GoogleSheetsDatasourceConfig.builder().serviceAccount("new").build());

        assertNotSame(stored, kept);
        assertEquals("stored", kept.getServiceAccount());
        assertEquals("new", replaced.getServiceAccount());
        DatasourceConnectionConfig foreign = new DatasourceConnectionConfig() {
            @Override
            public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
                return this;
            }

            @Override
            public DatasourceConnectionConfig doEncrypt(Function<String, String> encryptFunc) {
                return this;
            }

            @Override
            public DatasourceConnectionConfig doDecrypt(Function<String, String> decryptFunc) {
                return this;
            }
        };
        PluginException failure = assertThrows(PluginException.class, () -> stored.mergeWithUpdatedConfig(foreign));
        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, failure.getError());
        assertEquals("GOOGLESHEETS_DATASOURCE_CONFIG_ERROR", failure.getMessageKey());
        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR,
                assertThrows(PluginException.class, () -> GoogleSheetsDatasourceConfig.buildFrom(null)).getError(), "a null map binds to nothing");
    }

    @Test
    public void encryptAndDecryptApplyTheFunctionToTheServiceAccount() {
        GoogleSheetsDatasourceConfig config = GoogleSheetsDatasourceConfig.buildFrom(Map.of("serviceAccount", "abc"));

        assertSame(config, config.doEncrypt(text -> "[" + text + "]"));
        assertEquals("[abc]", config.getServiceAccount());
        assertSame(config, config.doDecrypt(text -> text.substring(1, text.length() - 1)));
        assertEquals("abc", config.getServiceAccount());
        assertTrue(logs.list.isEmpty());
    }

    /**
     * DEFECT D8 pinned, Google Sheets half (analysis-plugins section 0.6; plan section 9 D1-D20 row; D-6, fix deferred):
     * when the function throws, {@code GoogleSheetsDatasourceConfig} logs {@code "fail to encrypt password: {}"} (:51) and
     * {@code "fail to decrypt password: {}"} (:61) at ERROR with the whole service-account JSON, private key included,
     * as the argument, and returns the object unchanged. The fix is to log without the value; it turns the log
     * assertions red.
     */
    @Test
    public void whenTheFunctionThrowsTheServiceAccountJsonIsWrittenToTheLogD8() {
        Function<String, String> failing = text -> {
            throw new IllegalStateException("key unavailable");
        };
        GoogleSheetsDatasourceConfig forEncrypt = GoogleSheetsDatasourceConfig.buildFrom(Map.of("serviceAccount", SERVICE_ACCOUNT));
        GoogleSheetsDatasourceConfig forDecrypt = GoogleSheetsDatasourceConfig.buildFrom(Map.of("serviceAccount", SERVICE_ACCOUNT));

        assertSame(forEncrypt, forEncrypt.doEncrypt(failing));
        assertSame(forDecrypt, forDecrypt.doDecrypt(failing));

        assertEquals(SERVICE_ACCOUNT, forEncrypt.getServiceAccount());
        assertEquals(SERVICE_ACCOUNT, forDecrypt.getServiceAccount());
        logs.list.forEach(event -> System.out.println("[GoogleSheetsRequestModelsTest] " + event.getLevel() + " "
                + event.getFormattedMessage().replace(ServiceAccountTestKeys.keyMarker(), "<<KEY>>").substring(0, 60) + "... contains key: "
                + event.getFormattedMessage().contains(ServiceAccountTestKeys.keyMarker())));
        assertEquals(2, logs.list.size());
        for (ILoggingEvent event : logs.list) {
            assertEquals(Level.ERROR, event.getLevel());
            assertTrue(event.getFormattedMessage().contains(ServiceAccountTestKeys.keyMarker()), "the private key is in the log");
            assertTrue(event.getThrowableProxy().getMessage().contains("key unavailable"));
        }
        assertTrue(logs.list.get(0).getFormattedMessage().startsWith("fail to encrypt"));
        assertTrue(logs.list.get(1).getFormattedMessage().startsWith("fail to decrypt"));
    }
}

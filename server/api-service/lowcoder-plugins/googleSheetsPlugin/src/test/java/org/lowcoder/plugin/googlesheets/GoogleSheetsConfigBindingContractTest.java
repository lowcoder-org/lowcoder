package org.lowcoder.plugin.googlesheets;

import org.apache.commons.collections4.MapUtils;
import org.junit.Test;
import org.lowcoder.plugin.googlesheets.GoogleSheetsPlugin.GoogleSheetsEngine;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Map;

/**
 * The {@code googleSheetsPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1):
 * {@code GoogleSheetsEngine.resolveConfig} for {@code GoogleSheetsDatasourceConfig}, and the {@code requestClass}
 * dispatch of {@code parseGoogleSheetsActionRequest} ({@code GoogleSheetsPlugin.java:85-92}) for the read, clear and
 * delete requests, which binds {@code command} to the class its {@code commandType} names.
 *
 * <p>The dispatch is a private method of the engine; it is called by reflection with the two values
 * {@code buildQueryExecutionContext} passes it ({@code GoogleSheetsPlugin.java:102-105}), because that caller then
 * builds service-account credentials from a real private key. The append and update requests are built by hand
 * ({@code GoogleSheetsPlugin.java:79-84}); their change sets are group {@code node-conversion}'s.
 */
public class GoogleSheetsConfigBindingContractTest {

    static final String DISPATCH_METHOD = "parseGoogleSheetsActionRequest";
    static final String COMMAND_TYPE = "commandType";
    static final String COMMAND = "command";
    /** The default {@code buildQueryExecutionContext} reads a missing {@code commandType} as. */
    static final String NO_COMMAND_TYPE = "";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/googleSheetsPlugin/src/main/java/org/lowcoder/plugin/googlesheets/model/GoogleSheetsDatasourceConfig.java#GoogleSheetsDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-plugins/googleSheetsPlugin/src/main/java/org/lowcoder/plugin/googlesheets/model/GoogleSheetsDatasourceConfig.java#GoogleSheetsDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void datasourceConfig() {
        GoogleSheetsEngine engine = new GoogleSheetsEngine();
        ConfigBinding.assertBinding(GOLDEN, "config-binding/GoogleSheetsDatasourceConfig.input.json",
                "config-binding/GoogleSheetsDatasourceConfig.json", Map.of("GoogleSheetsEngine.resolveConfig", engine::resolveConfig));
    }

    @BoundarySites({
            "lowcoder-plugins/googleSheetsPlugin/src/main/java/org/lowcoder/plugin/googlesheets/GoogleSheetsPlugin.java#GoogleSheetsPlugin.GoogleSheetsEngine.parseGoogleSheetsActionRequest#toJson#1",
            "lowcoder-plugins/googleSheetsPlugin/src/main/java/org/lowcoder/plugin/googlesheets/GoogleSheetsPlugin.java#GoogleSheetsPlugin.GoogleSheetsEngine.parseGoogleSheetsActionRequest#fromJson#1"})
    @Test
    public void actionRequestDispatch() throws NoSuchMethodException {
        GoogleSheetsEngine engine = new GoogleSheetsEngine();
        Method dispatch = GoogleSheetsEngine.class.getDeclaredMethod(DISPATCH_METHOD, String.class, Map.class);
        dispatch.setAccessible(true);
        ConfigBinding.assertBinding(GOLDEN, "config-binding/GoogleSheetsActionRequest.input.json",
                "config-binding/GoogleSheetsActionRequest.json", Map.of(DISPATCH_METHOD, queryConfig -> invoke(dispatch, engine, queryConfig)));
    }

    /** Calls the dispatch as {@code buildQueryExecutionContext} does, rethrowing what it throws. */
    @SuppressWarnings("unchecked")
    private static Object invoke(Method dispatch, GoogleSheetsEngine engine, Map<String, Object> queryConfig) {
        try {
            return dispatch.invoke(engine, MapUtils.getString(queryConfig, COMMAND_TYPE, NO_COMMAND_TYPE), (Map<String, Object>) queryConfig.get(COMMAND));
        } catch (InvocationTargetException e) {
            if (e.getCause() instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw new IllegalStateException(e.getCause());
        } catch (IllegalAccessException e) {
            throw new IllegalStateException(e);
        }
    }
}

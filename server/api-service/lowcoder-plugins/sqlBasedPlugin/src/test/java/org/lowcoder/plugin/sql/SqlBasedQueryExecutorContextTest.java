package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresUpdateCommand;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.sql.H2SqlTestSupport.assertPluginError;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit SB-5 (task L5-1): {@link SqlBasedQueryExecutor#buildQueryExecutionContext} and
 * {@link SqlBasedQueryExecutor#sanitizeQueryConfig}: what decides whether parameters are bound or rendered into the SQL.
 */
public class SqlBasedQueryExecutorContextTest {

    static final String EMPTY_CONFIG_KEY = "EMPTY_SQL_QUERY_CONFIG";
    static final Map<String, Object> PARAMS = Map.of("x", 1);

    private final H2SqlTestSupport.H2Executor executor = new H2SqlTestSupport.H2Executor(new GeneralSqlExecutor());

    private static H2SqlTestSupport.H2Config datasource(boolean enableTurnOffPreparedStatement) {
        return new H2SqlTestSupport.H2Config("localhost", "db", enableTurnOffPreparedStatement, null);
    }

    private SqlBasedQueryExecutionContext build(boolean datasourceFlag, Map<String, Object> queryConfig) {
        return executor.buildQueryExecutionContext(datasource(datasourceFlag), queryConfig, PARAMS, null);
    }

    private static Map<String, Object> updateDetail() {
        return Map.of("table", "t", "allowMultiModify", true,
                "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "{{c}}"))),
                "filterBy", List.of(Map.of("column", "id", "condition", "=", "value", "{{key}}")));
    }

    @Test
    public void commentsAreStrippedSoNoPhantomParameterRemains() {
        SqlBasedQueryExecutionContext context = build(false, H2SqlTestSupport.sqlConfig("select 1 -- {{x}}\n from dual"));
        System.out.println("[SqlBasedQueryExecutorContextTest] query after comment removal: [" + context.getQuery() + "]");
        assertFalse(context.getQuery().contains("{{"), "a mustache inside a comment must not survive: " + context.getQuery());
        assertTrue(context.getQuery().contains("select 1"));
        assertEquals(PARAMS, context.getRequestParams());
        assertNull(context.getGuiSqlCommand());
    }

    @Test
    public void blankAndCommentOnlySqlIsSqlEmpty() {
        for (String sql : new String[] {"", "   ", "-- nothing {{x}}"}) {
            assertPluginError(QUERY_ARGUMENT_ERROR, "SQL_EMPTY", () -> build(false, H2SqlTestSupport.sqlConfig(sql)));
        }
        System.out.println("[SqlBasedQueryExecutorContextTest] blank and comment-only SQL -> SQL_EMPTY");
    }

    @Test
    public void guiModeWithoutATypeIsGuiCommandTypeEmpty() {
        for (String type : new String[] {null, "", " "}) {
            assertPluginError(QUERY_ARGUMENT_ERROR, "GUI_COMMAND_TYPE_EMPTY",
                    () -> build(false, H2SqlTestSupport.guiConfig(type, updateDetail())));
        }
    }

    @Test
    public void guiModeWithoutADetailIsInvalidGuiParam() {
        assertPluginError(QUERY_ARGUMENT_ERROR, "INVALID_GUI_PARAM", () -> build(false, H2SqlTestSupport.guiConfig(H2SqlTestSupport.GUI_UPDATE, null)));
        assertPluginError(QUERY_ARGUMENT_ERROR, "INVALID_GUI_PARAM", () -> build(false, H2SqlTestSupport.guiConfig(H2SqlTestSupport.GUI_UPDATE, Map.of())));
    }

    @Test
    public void guiModeBuildsTheCommandAndNoQuery() {
        SqlBasedQueryExecutionContext context = build(true, H2SqlTestSupport.guiConfig(H2SqlTestSupport.GUI_UPDATE, updateDetail()));
        assertInstanceOf(PostgresUpdateCommand.class, context.getGuiSqlCommand());
        assertNull(context.getQuery());
        assertEquals(PARAMS, context.getRequestParams());
        assertFalse(context.isDisablePreparedStatement(), "GUI commands are always prepared");
        System.out.println("[SqlBasedQueryExecutorContextTest] GUI context: " + context.getGuiSqlCommand().getClass().getSimpleName());
    }

    @Test
    public void preparedStatementIsDisabledOnlyWhenBothFlagsAreSet() {
        for (boolean datasourceFlag : new boolean[] {false, true}) {
            for (boolean queryFlag : new boolean[] {false, true}) {
                Map<String, Object> queryConfig = new HashMap<>(H2SqlTestSupport.sqlConfig("select {{x}}"));
                queryConfig.put(H2SqlTestSupport.PREPARED_OFF_KEY, queryFlag);
                boolean disabled = build(datasourceFlag, queryConfig).isDisablePreparedStatement();
                System.out.println("[SqlBasedQueryExecutorContextTest] datasource flag " + datasourceFlag + ", query flag " + queryFlag
                        + " -> prepared statement disabled: " + disabled);
                assertEquals(datasourceFlag && queryFlag, disabled, "datasource " + datasourceFlag + ", query " + queryFlag);
            }
        }
    }

    @Test
    public void emptyQueryConfigIsRejected() {
        assertPluginError(INVALID_QUERY_SETTINGS, EMPTY_CONFIG_KEY, () -> build(false, Map.of()));
        assertPluginError(INVALID_QUERY_SETTINGS, EMPTY_CONFIG_KEY, () -> build(false, null));
        assertPluginError(INVALID_QUERY_SETTINGS, EMPTY_CONFIG_KEY, () -> executor.sanitizeQueryConfig(Map.of()));
    }

    @Test
    public void sanitizeQueryConfigReturnsTheMustacheKeysForSql() {
        Map<String, Object> sanitized = executor.sanitizeQueryConfig(H2SqlTestSupport.sqlConfig("select {{a}}, {{ b }} from t where c = {{a}}"));
        System.out.println("[SqlBasedQueryExecutorContextTest] sql fields: " + sanitized);
        assertEquals(Set.of("{{a}}", "{{ b }}"), sanitized.get("fields"));
        assertEquals(Set.of(), executor.sanitizeQueryConfig(H2SqlTestSupport.sqlConfig("select 1")).get("fields"));
    }

    @Test
    public void sanitizeQueryConfigReturnsTheMustacheKeysForGui() {
        Map<String, Object> sanitized = executor.sanitizeQueryConfig(H2SqlTestSupport.guiConfig(H2SqlTestSupport.GUI_UPDATE, updateDetail()));
        System.out.println("[SqlBasedQueryExecutorContextTest] gui fields: " + sanitized);
        assertEquals(Set.of("{{c}}", "{{key}}"), sanitized.get("fields"));
    }
}

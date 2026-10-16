package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresUpdateCommand;
import org.lowcoder.sdk.util.MustacheHelper;

import java.sql.Connection;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
    /** A comment with an apostrophe and hyphens between two columns, the second a literal containing "--". */
    static final String COMMENTED_SQL = "select 7 as one-- don't-a-b\n, 'x--y' as two";
    static final String FIELDS_KEY = "fields";
    static final String SQL_EMPTY_KEY = "SQL_EMPTY";
    /**
     * A key in the SQL (twice), in a literal, in a {@code --} comment, in a block comment, in a block comment inside a
     * subscript (STANDARD rules) and in an optimizer hint: the keys of the literal and the hint stay with the SQL.
     */
    static final String KEYS_IN_AND_OUT_OF_COMMENTS_SQL =
            "select {{a}}, '{{e}} -- text' from t -- {{b}}\nwhere x = {{a}} /* {{c}} */ and y = arr[1 /* {{s}} */] /*+ {{d}} */";
    /** An unterminated block comment is kept to the end of the query, its key with it. */
    static final String UNTERMINATED_COMMENT_SQL = "select {{a}} /* {{b}}";
    /** After {@code 'C:\'}, a literal a backslash makes ambiguous, block comments are kept. */
    static final String AFTER_AMBIGUOUS_LITERAL_SQL = "select 'C:\\' /* {{k}} */ from t";
    /** A block comment inside a mustache is removed with the rest, so the key is the mustache without it. */
    static final String COMMENT_INSIDE_A_MUSTACHE_SQL = "select {{ a /* x */ }} from t";
    static final String COMMENTS_ONLY_SQL = "-- {{only}}\n/* {{also}} */";

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

    /**
     * BF-046 through the executor and a database: an apostrophe in a {@code --} comment no longer cuts the query at the
     * {@code --} of a later literal, and hyphens in the comment no longer delete the value before it; H2 answers both
     * columns as written.
     */
    @Test
    public void aQuoteAndHyphensInACommentKeepTheQueryThatRunsBF046() throws Exception {
        SqlBasedQueryExecutionContext context = build(false, H2SqlTestSupport.sqlConfig(COMMENTED_SQL));
        System.out.println("[SqlBasedQueryExecutorContextTest] [" + COMMENTED_SQL.replace("\n", "\\n") + "] -> [" + context.getQuery().replace("\n", "\\n") + "]");
        assertEquals("select 7 as one\n, 'x--y' as two", context.getQuery());
        try (Connection connection = H2SqlTestSupport.open(H2SqlTestSupport.newUrl("comments"))) {
            Object data = new GeneralSqlExecutor().execute(connection, context).getData();
            System.out.println("[SqlBasedQueryExecutorContextTest] H2 answers " + data);
            assertEquals(List.of(Map.of("one", 7, "two", "x--y")), data);
        }
    }

    /**
     * BF-092 through the executor: a block comment holding a mustache is removed. The default quoting rules
     * ({@code quotingRules}, STANDARD) read brackets as subscripts, so a comment inside one is removed too; after
     * {@code 'C:\'}, a literal a backslash makes ambiguous, the block comment is kept as before BF-092.
     */
    @Test
    public void aBlockCommentIsRemovedInsideASubscriptAndKeptAfterABackslashAmbiguousLiteralBF092() {
        SqlBasedQueryExecutionContext context = build(false,
                H2SqlTestSupport.sqlConfig("select arr[1 /* {{x}} */], 'C:\\' /* {{x}} */ from t"));
        System.out.println("[SqlBasedQueryExecutorContextTest] block comments -> [" + context.getQuery() + "]");
        assertEquals("select arr[1  ], 'C:\\' /* {{x}} */ from t", context.getQuery());
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

    /**
     * NEW-33: the fields a published app's viewer gets are the mustache tokens of the template execution builds, so a key
     * written only in a removed comment is not listed and a key in a kept comment is. Each case is checked against its
     * expected set and against the tokens of {@code buildQueryExecutionContext}'s query, the template whose values execution
     * looks up. Catches: the raw SQL's keys (comments included), or other quoting rules than the executor's.
     */
    @Test
    public void sanitizeQueryConfigListsTheKeysExecutionLooksUpNEW33() {
        Map<String, Set<String>> expectedFields = new LinkedHashMap<>();
        expectedFields.put(KEYS_IN_AND_OUT_OF_COMMENTS_SQL, Set.of("{{a}}", "{{e}}", "{{d}}"));
        expectedFields.put(UNTERMINATED_COMMENT_SQL, Set.of("{{a}}", "{{b}}"));
        expectedFields.put(AFTER_AMBIGUOUS_LITERAL_SQL, Set.of("{{k}}"));
        expectedFields.put(COMMENT_INSIDE_A_MUSTACHE_SQL, Set.of("{{ a   }}"));
        for (Map.Entry<String, Set<String>> entry : expectedFields.entrySet()) {
            String sql = entry.getKey();
            Object fields = executor.sanitizeQueryConfig(H2SqlTestSupport.sqlConfig(sql)).get(FIELDS_KEY);
            String executed = build(false, H2SqlTestSupport.sqlConfig(sql)).getQuery();
            System.out.println("[SqlBasedQueryExecutorContextTest] [" + sql.replace("\n", "\\n") + "] -> fields " + fields
                    + ", executed [" + executed.replace("\n", "\\n") + "]");
            assertEquals(entry.getValue(), fields, "fields of [" + sql + "]");
            assertEquals(MustacheHelper.extractMustacheKeysWithCurlyBraces(executed), fields,
                    "fields against the tokens of the executed query [" + executed + "]");
        }
    }

    /**
     * NEW-33: a query of only comments lists no field; it never runs, building its context is refused with SQL_EMPTY.
     * Catches: the keys of its comments listed.
     */
    @Test
    public void aQueryOfOnlyCommentsListsNoFieldsNEW33() {
        Object fields = executor.sanitizeQueryConfig(H2SqlTestSupport.sqlConfig(COMMENTS_ONLY_SQL)).get(FIELDS_KEY);
        System.out.println("[SqlBasedQueryExecutorContextTest] [" + COMMENTS_ONLY_SQL.replace("\n", "\\n") + "] -> fields " + fields);
        assertEquals(Set.of(), fields, "fields of a query of only comments");
        assertPluginError(QUERY_ARGUMENT_ERROR, SQL_EMPTY_KEY, () -> build(false, H2SqlTestSupport.sqlConfig(COMMENTS_ONLY_SQL)));
    }

    @Test
    public void sanitizeQueryConfigReturnsTheMustacheKeysForGui() {
        Map<String, Object> sanitized = executor.sanitizeQueryConfig(H2SqlTestSupport.guiConfig(H2SqlTestSupport.GUI_UPDATE, updateDetail()));
        System.out.println("[SqlBasedQueryExecutorContextTest] gui fields: " + sanitized);
        assertEquals(Set.of("{{c}}", "{{key}}"), sanitized.get("fields"));
    }
}

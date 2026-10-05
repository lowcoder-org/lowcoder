package org.lowcoder.plugin.postgres;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.UpdateCount;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresBulkInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresBulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresUpdateCommand;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit PG-2 (task L5-4): what {@link PostgresExecutor} binds for a prepared query with explicit casts, on the
 * {@link FakeJdbc} connection that records every {@code set...} call (the executor goes through
 * {@code PostgresResultContractTest.wrap}, the same never-started pool), and the GUI command dispatch.
 */
public class PostgresExecutorPreparedInputTest {

    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Object> KEY_VALUES = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "1")));
    static final List<Map<String, Object>> FILTER = List.of(Map.of("column", "id", "condition", "=", "value", "1"));
    static final Map<String, Map<String, Object>> DETAILS = Map.of(
            "insert", Map.of("table", "t", "changeSet", KEY_VALUES),
            "update", Map.of("table", "t", "changeSet", KEY_VALUES, "filterBy", FILTER),
            "delete", Map.of("table", "t", "filterBy", FILTER),
            "bulk_insert", Map.of("table", "t", "records", "[{\"a\":1}]"),
            "bulk_update", Map.of("table", "t", "primaryKey", "a", "records", "[{\"a\":1}]"));
    static final Map<String, Class<? extends GuiSqlCommand>> TYPES = Map.of(
            "insert", PostgresInsertCommand.class, "update", PostgresUpdateCommand.class, "delete", PostgresDeleteCommand.class,
            "bulk_insert", PostgresBulkInsertCommand.class, "bulk_update", PostgresBulkUpdateCommand.class);

    private final PostgresExecutor executor = new PostgresExecutor();

    private List<String> binds(String sql, Map<String, Object> params) {
        List<String> binds = new ArrayList<>();
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query(sql).requestParams(params).build();
        executor.executeQuery(PostgresResultContractTest.wrap(FakeJdbc.connection(List.of(new UpdateCount(1, null)), binds)), context).block(TIMEOUT);
        System.out.println("[PostgresExecutorPreparedInputTest] " + sql + " " + params + " -> " + binds);
        return binds;
    }

    @Test
    public void castBindsTheCastJavaTypeAtTheRightPosition() {
        assertEquals(List.of("setInt(1, java.lang.Integer:41)"), binds("select {{n}}::int4 + 1", Map.of("n", "41")));
        assertEquals(List.of("setDate(1, java.sql.Date:2024-02-29)"), binds("select {{d}}::date", Map.of("d", "2024-02-29")));
        assertEquals(List.of("setString(1, java.lang.String:5)"), binds("select {{t}}::text", Map.of("t", 5)));
        List<String> mixed = binds("select {{a}}::bool, {{b}}, {{c}}::varchar", Map.of("a", "true", "b", 7, "c", 8));
        assertEquals(List.of("setBoolean(1, java.lang.Boolean:true)", "setInt(2, java.lang.Integer:7)", "setString(3, java.lang.String:8)"), mixed);
    }

    /**
     * Pins the plan section 9 row "PostgresDataTypeUtils' cast scanner reads the whole prepared SQL" (D-6: fix deferred): the
     * scanner finds every {@code ?} of the SQL text, not only the parameters, so a {@code ?::bool} inside a string literal takes
     * the cast slot of the first parameter, and the jsonb {@code ??} operator shifts the casts by one. A fix (a scanner that
     * skips literals and escaped operators) changes this test on purpose.
     */
    @Test
    public void castScannerReadsTheWholeSqlSoALiteralAndTheJsonbOperatorShiftTheCasts() {
        assertEquals(List.of("setBoolean(1, java.lang.Boolean:false)"), binds("select '?::bool', {{b}}::int4", Map.of("b", "5")),
                "the cast of the literal is applied to the parameter: 5 becomes false");
        assertEquals(List.of("setString(1, java.lang.String:5)"), binds("select data ?? 'k' from t where x = {{b}}::int4", Map.of("b", "5")),
                "the ?? operator takes the cast slot: 5 stays a string");
    }

    /** The row of {@code PostgresDataTypeUtilsTest.castPatternReadsLettersOnly_int8IsReadAsInt}, seen through the executor. */
    @Test
    public void int8CastIsReadAsIntSoABigNumberFailsWithARawNumberFormatException() {
        assertThrows(NumberFormatException.class, () -> binds("select {{a}}::int8", Map.of("a", "3000000001")));
        assertEquals(List.of("setString(1, java.lang.String:0.1)"), binds("select {{a}}::float8", Map.of("a", "0.1")), "float8 is not cast at all");
    }

    @Test
    public void queryWithoutPlaceholdersBindsNothing() {
        assertEquals(List.of(), binds("select 1", Map.of("unused", 1)));
    }

    @Test
    public void missingKeyIsBoundValueNotMatchAndNullValueIsBoundAsNull() {
        PluginException thrown = assertThrows(PluginException.class, () -> binds("select {{missing}}::int4", Map.of("other", 1)));
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertEquals("BOUND_VALUE_NOT_MATCH", thrown.getMessageKey());
        assertEquals("missing", thrown.getArgs()[0]);
        Map<String, Object> withNull = new HashMap<>();
        withNull.put("n", null);
        List<String> nullBinds = binds("select {{n}}", withNull);
        assertEquals(1, nullBinds.size());
        assertEquals(true, nullBinds.get(0).startsWith("setNull(1,"), nullBinds.get(0));
    }

    @Test
    public void parseSqlCommandMapsEachGuiTypeInAnyCase() {
        TYPES.forEach((type, commandClass) -> {
            assertInstanceOf(commandClass, executor.parseSqlCommand(type, DETAILS.get(type)), type);
            assertInstanceOf(commandClass, executor.parseSqlCommand(type.toUpperCase(Locale.ROOT), DETAILS.get(type)), type.toUpperCase(Locale.ROOT));
        });
        PluginException thrown = assertThrows(PluginException.class, () -> executor.parseSqlCommand("merge", DETAILS.get("insert")));
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals("INVALID_GUI_COMMAND_TYPE", thrown.getMessageKey());
        assertEquals("merge", thrown.getArgs()[0]);
    }

    /**
     * Pins defect D17 (plan section 9: default-locale toUpperCase): under a Turkish default locale "insert" becomes a dotted
     * capital I word and falls into the error branch. A fix ({@code Locale.ROOT}) changes this test on purpose. The default
     * locale is global state: restored in finally.
     */
    @Test
    public void guiTypeInsertFailsUnderATurkishDefaultLocale_pinsD17() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            System.out.println("[PostgresExecutorPreparedInputTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            PluginException thrown = assertThrows(PluginException.class, () -> executor.parseSqlCommand("insert", DETAILS.get("insert")));
            assertEquals("INVALID_GUI_COMMAND_TYPE", thrown.getMessageKey());
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(PostgresInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }
}

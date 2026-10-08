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
import static org.lowcoder.sdk.exception.PluginCommonError.PREPARED_STATEMENT_BIND_PARAMETERS_ERROR;
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
     * BF-045 fixed: the cast scanner read the whole prepared SQL, so a {@code ?::bool} inside a string literal took the cast
     * slot of the first parameter (5 was bound as false) and the jsonb {@code ??} operator shifted the casts by one (5 stayed
     * a string). Each parameter now gets its own cast.
     */
    @Test
    public void aLiteralAndTheJsonbOperatorNoLongerShiftTheCastsBF045() {
        assertEquals(List.of("setInt(1, java.lang.Integer:5)"), binds("select '?::bool', {{b}}::int4", Map.of("b", "5")));
        assertEquals(List.of("setInt(1, java.lang.Integer:5)"), binds("select data ?? 'k' from t where x = {{b}}::int4", Map.of("b", "5")));
    }

    /**
     * BF-045 fixed, seen through the executor: {@code ?::int8} was read as {@code int}, so a number above the int range
     * failed with a raw NumberFormatException, and {@code ?::float8} was not cast at all. They are cast to a Long and a
     * Double; the shared binder hands a Double to the driver through {@code setBigDecimal}.
     */
    @Test
    public void int8AndFloat8CastsBindALongAndADoubleBF045() {
        assertEquals(List.of("setLong(1, java.lang.Long:3000000001)"), binds("select {{a}}::int8", Map.of("a", "3000000001")));
        assertEquals(List.of("setBigDecimal(1, java.math.BigDecimal:0.1)"), binds("select {{a}}::float8", Map.of("a", "0.1")));
    }

    /**
     * A placeholder inside a dollar-quoted string is no driver parameter, so the scanner finds fewer casts than there are
     * placeholders: the value is bound as is (the driver itself then reports the mismatch) instead of failing on the
     * missing cast.
     */
    @Test
    public void aPlaceholderInsideADollarQuoteIsBoundAsIs() {
        assertEquals(List.of("setString(1, java.lang.String:5)"), binds("select $$ {{x}} $$", Map.of("x", "5")));
    }

    @Test
    public void queryWithoutPlaceholdersBindsNothing() {
        assertEquals(List.of(), binds("select 1", Map.of("unused", 1)));
    }

    /**
     * BF-106, seen through the executor: a bound text that does not parse as its explicit cast fails the query with the
     * coded PREPARED_STATEMENT_BIND_PARAMETERS_ERROR before anything is bound; the JDK's NumberFormatException used to
     * escape the plugin.
     */
    @Test
    public void aTextThatDoesNotParseAsItsCastIsAPreparedStatementBindErrorBF106() {
        List<String> bound = new ArrayList<>();
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query("select {{n}}::int4").requestParams(Map.of("n", "12.5")).build();

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.executeQuery(PostgresResultContractTest.wrap(FakeJdbc.connection(List.of(new UpdateCount(1, null)), bound)), context).block(TIMEOUT));

        System.out.println("[PostgresExecutorPreparedInputTest] 12.5::int4 -> " + thrown.getError() + " " + thrown.getArgs()[0] + ", bound " + bound + " (BF-106)");
        assertEquals(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, thrown.getError());
        assertEquals("\"12.5\" is not a valid INTEGER", thrown.getArgs()[0]);
        assertEquals(List.of(), bound);
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

    /** The default locale under which upper-casing "i" gives a dotted capital I. */
    private static final Locale TURKISH = Locale.forLanguageTag("tr-TR");

    /**
     * BF-122 (D17): the GUI type was upper-cased with the default locale, so under a Turkish default locale "insert" became a
     * dotted capital I word and fell into the error branch (INVALID_GUI_COMMAND_TYPE). It is upper-cased with
     * {@code Locale.ROOT} now. The default locale is global state: restored in finally.
     */
    @Test
    public void guiTypeInsertIsReadUnderATurkishDefaultLocaleBF122() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(TURKISH);
            System.out.println("[PostgresExecutorPreparedInputTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            assertInstanceOf(PostgresInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "under " + Locale.getDefault());
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(PostgresInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }
}

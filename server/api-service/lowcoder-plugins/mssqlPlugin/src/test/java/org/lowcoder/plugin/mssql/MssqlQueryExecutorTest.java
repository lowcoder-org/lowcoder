package org.lowcoder.plugin.mssql;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mssql.gui.MssqlBulkInsertCommand;
import org.lowcoder.plugin.mssql.gui.MssqlBulkUpdateCommand;
import org.lowcoder.plugin.mssql.gui.MssqlDeleteCommand;
import org.lowcoder.plugin.mssql.gui.MssqlInsertCommand;
import org.lowcoder.plugin.mssql.gui.MssqlUpdateCommand;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.FailingCell;
import org.lowcoder.sdk.contract.FakeJdbc.Rows;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;

import java.sql.Timestamp;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit MS-3 (task L5-5a), the executor half: {@link MssqlQueryExecutor} on a {@link FakeJdbc} connection (through the
 * never-started pool of {@link MssqlFakeConnections#wrap}): the anonymous {@code parseDataRows} turns every row of the
 * result set into a column-ordered map through the MSSQL parser, and {@code parseSqlCommand} picks the GUI command class
 * by type name.
 */
public class MssqlQueryExecutorTest {

    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final String QUERY = "select * from items";
    static final Map<String, Object> KEY_VALUES = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "1")));
    static final List<Map<String, Object>> FILTER = List.of(Map.of("column", "id", "condition", "=", "value", "1"));
    static final Map<String, Map<String, Object>> DETAILS = Map.of(
            "insert", Map.of("table", "t", "changeSet", KEY_VALUES),
            "update", Map.of("table", "t", "changeSet", KEY_VALUES, "filterBy", FILTER),
            "delete", Map.of("table", "t", "filterBy", FILTER),
            "bulk_insert", Map.of("table", "t", "records", "[{\"a\":1}]"),
            "bulk_update", Map.of("table", "t", "primaryKey", "a", "records", "[{\"a\":1}]"));
    static final Map<String, Class<? extends GuiSqlCommand>> TYPES = Map.of(
            "insert", MssqlInsertCommand.class, "update", MssqlUpdateCommand.class, "delete", MssqlDeleteCommand.class,
            "bulk_insert", MssqlBulkInsertCommand.class, "bulk_update", MssqlBulkUpdateCommand.class);

    private final MssqlQueryExecutor executor = new MssqlQueryExecutor();

    private QueryExecutionResult run(List<Column> columns, List<List<Object>> rows) {
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query(QUERY).requestParams(Map.of()).build();
        QueryExecutionResult result = executor.executeQuery(MssqlFakeConnections.wrap(
                FakeJdbc.connection(List.of(new Rows(MssqlFakeConnections.resultSet(columns, rows))))), context).block(TIMEOUT);
        System.out.println("[MssqlQueryExecutorTest] " + columns + " -> " + (result == null ? null : result.getData()));
        return result;
    }

    @Test
    public void everyRowBecomesAColumnOrderedMapThroughTheMssqlParser() {
        List<Column> columns = List.of(new Column("id", "int"), new Column("created", "datetime2"), new Column("note", "nvarchar"));
        QueryExecutionResult result = run(columns, List.of(
                new ArrayList<>(java.util.Arrays.asList(1, Timestamp.valueOf("2024-02-29 13:14:15.5"), "žluť")),
                new ArrayList<>(java.util.Arrays.asList(2, null, null))));
        assertTrue(result.isSuccess());
        List<?> data = assertInstanceOf(List.class, result.getData());
        assertEquals(2, data.size());
        Map<?, ?> first = assertInstanceOf(Map.class, data.get(0));
        assertEquals(List.of("id", "created", "note"), new ArrayList<>(first.keySet()));
        assertEquals(1, first.get("id"));
        assertEquals("2024-02-29 13:14:15", first.get("created"));
        assertEquals("žluť", first.get("note"));
        Map<?, ?> second = assertInstanceOf(Map.class, data.get(1));
        assertEquals(2, second.get("id"));
        assertEquals(null, second.get("created"));
        assertEquals(null, second.get("note"));
    }

    @Test
    public void emptyResultIsAnEmptySuccessfulList() {
        QueryExecutionResult result = run(List.of(new Column("id", "int")), List.of());
        assertTrue(result.isSuccess());
        assertEquals(List.of(), result.getData());
    }

    @Test
    public void aFailingCellFailsTheQueryWithAnExecutionError() {
        PluginException thrown = assertThrows(PluginException.class, () -> run(List.of(new Column("d", "date")),
                List.of(List.of(new FailingCell("cannot read the value", "text")))));
        System.out.println("[MssqlQueryExecutorTest] failing cell: " + thrown.getError() + " " + thrown.getMessageKey());
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
    }

    @Test
    public void parseSqlCommandMapsEachGuiTypeInAnyCase() {
        TYPES.forEach((type, commandClass) -> {
            assertInstanceOf(commandClass, executor.parseSqlCommand(type, DETAILS.get(type)), type);
            assertInstanceOf(commandClass, executor.parseSqlCommand(type.toUpperCase(Locale.ROOT), DETAILS.get(type)), type.toUpperCase(Locale.ROOT));
        });
    }

    @Test
    public void unknownGuiTypeIsRejectedWithItsName() {
        PluginException thrown = assertThrows(PluginException.class, () -> executor.parseSqlCommand("merge", DETAILS.get("insert")));
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals("INVALID_GUI_COMMAND_TYPE", thrown.getMessageKey());
        assertEquals("merge", thrown.getArgs()[0]);
    }

    /**
     * Pins defect D17 (analysis-plugins section 0.6; plan section 9 row D1-D20: default-locale toUpperCase): under a
     * Turkish default locale "insert" becomes a dotted capital I word and falls into the error branch. A fix
     * ({@code Locale.ROOT}) changes this test on purpose. The default locale is global state: restored in finally.
     */
    @Test
    public void guiTypeInsertFailsUnderATurkishDefaultLocale_pinsD17() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            System.out.println("[MssqlQueryExecutorTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            PluginException thrown = assertThrows(PluginException.class, () -> executor.parseSqlCommand("insert", DETAILS.get("insert")));
            assertEquals("INVALID_GUI_COMMAND_TYPE", thrown.getMessageKey());
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(MssqlInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }
}

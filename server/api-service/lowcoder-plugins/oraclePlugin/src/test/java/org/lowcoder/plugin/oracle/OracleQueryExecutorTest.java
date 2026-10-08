package org.lowcoder.plugin.oracle;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.oracle.gui.OracleBulkInsertCommand;
import org.lowcoder.plugin.oracle.gui.OracleBulkUpdateCommand;
import org.lowcoder.plugin.oracle.gui.OracleDeleteCommand;
import org.lowcoder.plugin.oracle.gui.OracleInsertCommand;
import org.lowcoder.plugin.oracle.gui.OracleUpdateCommand;
import org.lowcoder.plugin.oracle.model.OracleDatasourceConfig;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.FailingCell;
import org.lowcoder.sdk.contract.FakeJdbc.Rows;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit OR-1 (task L5-6), the executor half: {@link OracleQueryExecutor} on a {@link FakeJdbc} connection (through the
 * never-started pool of {@link OracleFakeConnections#wrap}): a query result goes through the shared
 * {@code GeneralSqlExecutor}, {@code getStructure} reads the rows of the sdk {@code StructureParser} query into tables, and
 * {@code parseSqlCommand} picks the GUI command class by type name.
 *
 * <p>Limits: the structure rows are what {@code user_tab_cols} is assumed to return (upper-case names), built by hand; the
 * real server is the heavy unit OR-3.
 */
public class OracleQueryExecutorTest {

    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final String QUERY = "select * from items";
    static final String TABLE_NAME = "table_name";
    static final String COLUMN_NAME = "column_name";
    static final String DATA_TYPE = "data_type";
    static final Map<String, Object> KEY_VALUES = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "1")));
    static final List<Map<String, Object>> FILTER = List.of(Map.of("column", "id", "condition", "=", "value", "1"));
    static final Map<String, Map<String, Object>> DETAILS = Map.of(
            "insert", Map.of("table", "t", "changeSet", KEY_VALUES),
            "update", Map.of("table", "t", "changeSet", KEY_VALUES, "filterBy", FILTER),
            "delete", Map.of("table", "t", "filterBy", FILTER),
            "bulk_insert", Map.of("table", "t", "records", "[{\"a\":1}]"),
            "bulk_update", Map.of("table", "t", "primaryKey", "a", "records", "[{\"a\":1}]"));
    static final Map<String, Class<? extends GuiSqlCommand>> TYPES = Map.of(
            "insert", OracleInsertCommand.class, "update", OracleUpdateCommand.class, "delete", OracleDeleteCommand.class,
            "bulk_insert", OracleBulkInsertCommand.class, "bulk_update", OracleBulkUpdateCommand.class);

    private final OracleQueryExecutor executor = new OracleQueryExecutor();
    private final OracleDatasourceConfig config = OracleDatasourceConfig.builder().host("h").serviceName("S").build();

    private QueryExecutionResult run(List<Column> columns, List<List<Object>> rows) {
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query(QUERY).requestParams(Map.of()).build();
        QueryExecutionResult result = executor.executeQuery(OracleFakeConnections.wrap(
                FakeJdbc.connection(List.of(new Rows(FakeJdbc.resultSet(columns, rows))))), context).block(TIMEOUT);
        System.out.println("[OracleQueryExecutorTest] " + columns + " -> " + (result == null ? null : result.getData()));
        return result;
    }

    private static List<Object> row(Object... cells) {
        return new ArrayList<>(Arrays.asList(cells));
    }

    @Test
    public void everyRowBecomesAColumnOrderedMap() {
        QueryExecutionResult result = run(List.of(new Column("ID", "NUMBER"), new Column("NAME", "VARCHAR2")), List.of(row(1, "žluť"), row(2, null)));
        assertTrue(result.isSuccess());
        List<?> data = assertInstanceOf(List.class, result.getData());
        assertEquals(2, data.size());
        Map<?, ?> first = assertInstanceOf(Map.class, data.get(0));
        assertEquals(List.of("ID", "NAME"), new ArrayList<>(first.keySet()));
        assertEquals(1, first.get("ID"));
        assertEquals("žluť", first.get("NAME"));
        assertNull(assertInstanceOf(Map.class, data.get(1)).get("NAME"));
    }

    @Test
    public void aFailingCellFailsTheQueryWithAnExecutionError() {
        PluginException thrown = assertThrows(PluginException.class, () -> run(List.of(new Column("D", "DATE")), List.of(List.of(new FailingCell("cannot read the value", "text")))));
        System.out.println("[OracleQueryExecutorTest] failing cell: " + thrown.getError() + " " + thrown.getMessageKey());
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
    }

    @Test
    public void structureGroupsTheRowsIntoTablesWithTheirColumnsInTheGivenOrder() {
        List<Column> columns = List.of(new Column(TABLE_NAME, "VARCHAR2"), new Column(COLUMN_NAME, "VARCHAR2"), new Column(DATA_TYPE, "VARCHAR2"));
        DatasourceStructure structure = executor.getStructure(OracleFakeConnections.wrap(OracleFakeConnections.connectionAnswering(FakeJdbc.resultSet(columns, List.of(
                row("ORDERS", "ID", "NUMBER"), row("CUSTOMERS", "NAME", "VARCHAR2"), row("ORDERS", "NOTE", "CLOB"), row("ORDERS", "CREATED", "TIMESTAMP(6)"))))), config).block(TIMEOUT);
        List<Table> tables = structure.getTables().stream().sorted(java.util.Comparator.comparing(Table::getName)).toList();
        System.out.println("[OracleQueryExecutorTest] tables: " + tables.stream().map(t -> t.getName() + t.getColumns().stream().map(c -> c.getName() + ":" + c.getType()).toList()).toList());
        assertEquals(List.of("CUSTOMERS", "ORDERS"), tables.stream().map(Table::getName).toList());
        Table orders = tables.get(1);
        assertEquals(TableType.TABLE, orders.getType());
        assertNull(orders.getSchema());
        assertEquals(List.of("ID", "NOTE", "CREATED"), orders.getColumns().stream().map(DatasourceStructure.Column::getName).toList());
        assertEquals(List.of("NUMBER", "CLOB", "TIMESTAMP(6)"), orders.getColumns().stream().map(DatasourceStructure.Column::getType).toList());
        assertEquals(List.of(), orders.getKeys(), "keys are not read");
        assertEquals(List.of("NAME"), tables.get(0).getColumns().stream().map(DatasourceStructure.Column::getName).toList());
    }

    @Test
    public void structureOfAnEmptyResultHasNoTables() {
        List<Column> columns = List.of(new Column(TABLE_NAME, "VARCHAR2"), new Column(COLUMN_NAME, "VARCHAR2"), new Column(DATA_TYPE, "VARCHAR2"));
        DatasourceStructure structure = executor.getStructure(OracleFakeConnections.wrap(OracleFakeConnections.connectionAnswering(FakeJdbc.resultSet(columns, List.of()))), config).block(TIMEOUT);
        assertEquals(List.of(), structure.getTables());
    }

    @Test
    public void aFailingStructureReadIsAStructureError() {
        List<Column> columns = List.of(new Column(TABLE_NAME, "VARCHAR2"), new Column(COLUMN_NAME, "VARCHAR2"), new Column(DATA_TYPE, "VARCHAR2"));
        List<List<Object>> rows = List.of(row(new FailingCell("cannot read the table name", "t"), "ID", "NUMBER"));
        PluginException thrown = assertThrows(PluginException.class, () -> executor.getStructure(
                OracleFakeConnections.wrap(OracleFakeConnections.connectionAnswering(FakeJdbc.resultSet(columns, rows))), config).block(TIMEOUT));
        System.out.println("[OracleQueryExecutorTest] failing structure: " + thrown.getError() + " " + thrown.getMessageKey() + " " + Arrays.toString(thrown.getArgs()));
        assertEquals(DATASOURCE_GET_STRUCTURE_ERROR, thrown.getError());
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
            System.out.println("[OracleQueryExecutorTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            assertInstanceOf(OracleInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "under " + Locale.getDefault());
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(OracleInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }
}

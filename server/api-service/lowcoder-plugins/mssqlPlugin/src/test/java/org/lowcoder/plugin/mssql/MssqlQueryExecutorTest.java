package org.lowcoder.plugin.mssql;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mssql.gui.MssqlBulkInsertCommand;
import org.lowcoder.plugin.mssql.gui.MssqlBulkUpdateCommand;
import org.lowcoder.plugin.mssql.gui.MssqlDeleteCommand;
import org.lowcoder.plugin.mssql.gui.MssqlInsertCommand;
import org.lowcoder.plugin.mssql.gui.MssqlUpdateCommand;
import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.FailingCell;
import org.lowcoder.sdk.contract.FakeJdbc.Rows;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
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
import static org.lowcoder.plugin.mssql.util.MssqlStructureParser.COLUMNS_QUERY;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit MS-3 (task L5-5a), the executor half: {@link MssqlQueryExecutor} on a {@link FakeJdbc} connection (through the
 * never-started pool of {@link MssqlFakeConnections#wrap}): the anonymous {@code parseDataRows} turns every row of the
 * result set into a column-ordered map through the MSSQL parser, and {@code parseSqlCommand} picks the GUI command class
 * by type name; {@code getDatabaseMetadata} groups the rows of {@code COLUMNS_QUERY} into one table per name.
 */
public class MssqlQueryExecutorTest {

    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final String QUERY = "select * from items";
    static final String BRACKET_SQL = "select [a/*b*/], [c--d], [e]]/*f*/] from items /* {{x}} */";
    static final String BRACKET_SQL_WITHOUT_COMMENT = "select [a/*b*/], [c--d], [e]]/*f*/] from items";
    static final String MODE_KEY = "mode";
    static final String SQL_MODE = "SQL";
    static final String SQL_KEY = "sql";
    static final Map<String, Object> KEY_VALUES = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "1")));
    static final List<Map<String, Object>> FILTER = List.of(Map.of("column", "id", "condition", "=", "value", "1"));
    static final Map<String, Map<String, Object>> DETAILS = Map.of(
            "insert", Map.of("table", "t", "changeSet", KEY_VALUES),
            "update", Map.of("table", "t", "changeSet", KEY_VALUES, "filterBy", FILTER),
            "delete", Map.of("table", "t", "filterBy", FILTER),
            "bulk_insert", Map.of("table", "t", "records", "[{\"a\":1}]"),
            "bulk_update", Map.of("table", "t", "primaryKey", "a", "records", "[{\"a\":1}]"));
    static final String STRUCTURE_FAILURE = "structure query failed on purpose";
    /**
     * Rows of {@code COLUMNS_QUERY}, ordered by table name as the query orders them, with only the labels the parser reads
     * ({@code ordinal_position}, {@code column_default} and {@code is_nullable} are not read).
     */
    static final List<Map<String, String>> COLUMN_ROWS = List.of(
            Map.of("table_schema", "dbo", "table_name", "dbo.items", "column_name", "id", "column_type", "int"),
            Map.of("table_schema", "dbo", "table_name", "dbo.items", "column_name", "name", "column_type", "varchar"),
            Map.of("table_schema", "sales", "table_name", "sales.orders", "column_name", "item_id", "column_type", "int"));
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

    /**
     * BF-092: SQL Server quotes identifiers with brackets ({@code ]]} is an escaped bracket), so a comment start inside
     * {@code [...]} is part of the identifier and kept, while the block comment after it is removed with its mustache.
     */
    @Test
    public void aCommentStartInsideABracketIdentifierIsKeptBF092() {
        MssqlDatasourceConfig datasource = new MssqlDatasourceConfig("db", "user", "password", "localhost", 1433L, false, null, false,
                false, null);
        SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(datasource,
                Map.of(MODE_KEY, SQL_MODE, SQL_KEY, BRACKET_SQL), Map.of(), null);
        System.out.println("[MssqlQueryExecutorTest] [" + BRACKET_SQL + "] -> [" + context.getQuery() + "]");
        assertEquals(BRACKET_SQL_WITHOUT_COMMENT, context.getQuery());
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
            System.out.println("[MssqlQueryExecutorTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            assertInstanceOf(MssqlInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "under " + Locale.getDefault());
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(MssqlInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }

    /** What a fake answers for one interface call; {@code Object} methods are answered by {@link #fake}. */
    private interface FakeCall {
        Object answer(Method method, Object[] args) throws Throwable;
    }

    /** A proxy of {@code type} whose {@code equals} and {@code hashCode} are by identity and whose {@code toString} is a fixed name, as in {@code FakeJdbc}. */
    private static <T> T fake(Class<T> type, FakeCall call) {
        return type.cast(Proxy.newProxyInstance(MssqlQueryExecutorTest.class.getClassLoader(), new Class<?>[] {type}, (self, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                return switch (method.getName()) {
                    case "equals" -> self == args[0];
                    case "hashCode" -> System.identityHashCode(self);
                    default -> "fake " + type.getSimpleName();
                };
            }
            return call.answer(method, args);
        }));
    }

    /**
     * A connection whose statement answers {@code COLUMNS_QUERY} with {@code rows} read by column label, or fails with
     * {@code failure}; each close of the result set or the statement is recorded in {@code closed}. Not {@code FakeJdbc}:
     * its statements do not answer {@code executeQuery} and its result sets read cells by index only, while the parser
     * calls {@code executeQuery} and {@code getString(String)}. Any other call fails with a {@code SQLFeatureNotSupportedException}, as in {@code FakeJdbc}.
     */
    private static Connection structureConnection(List<Map<String, String>> rows, SQLException failure, List<String> closed) {
        int[] row = {-1};
        ResultSet resultSet = fake(ResultSet.class, (method, args) -> switch (method.getName()) {
            case "next" -> ++row[0] < rows.size();
            case "getString" -> rows.get(row[0]).get((String) args[0]);
            case "close" -> closed.add("resultSet");
            default -> throw new SQLFeatureNotSupportedException("ResultSet." + method.getName());
        });
        Statement statement = fake(Statement.class, (method, args) -> switch (method.getName()) {
            case "executeQuery" -> {
                assertEquals(COLUMNS_QUERY, args[0]);
                if (failure != null) {
                    throw failure;
                }
                yield resultSet;
            }
            case "close" -> closed.add("statement");
            default -> throw new SQLFeatureNotSupportedException("Statement." + method.getName());
        });
        return fake(Connection.class, (method, args) -> switch (method.getName()) {
            case "createStatement" -> statement;
            default -> throw new SQLFeatureNotSupportedException("Connection." + method.getName());
        });
    }

    @Test
    public void structureHasOneTableOfColumnsPerTableName() {
        List<String> closed = new ArrayList<>();

        DatasourceStructure structure = executor.getDatabaseMetadata(structureConnection(COLUMN_ROWS, null, closed), null);

        System.out.println("[MssqlQueryExecutorTest] structure: " + structure.getTables() + ", closed " + closed);
        List<Table> tables = structure.getTables();
        assertEquals(List.of("dbo.items", "sales.orders"), tables.stream().map(Table::getName).toList());
        assertEquals(List.of("dbo", "sales"), tables.stream().map(Table::getSchema).toList());
        assertEquals(List.of("id:int", "name:varchar"), tables.get(0).getColumns().stream().map(c -> c.getName() + ":" + c.getType()).toList());
        assertEquals(List.of("item_id:int"), tables.get(1).getColumns().stream().map(c -> c.getName() + ":" + c.getType()).toList());
        assertTrue(tables.stream().allMatch(table -> table.getKeys().isEmpty()), "COLUMNS_QUERY reads no keys");
        assertEquals(List.of("resultSet", "statement"), closed);
    }

    @Test
    public void aFailingStructureQueryIsAStructureErrorWithItsMessage() {
        List<String> closed = new ArrayList<>();

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.getDatabaseMetadata(structureConnection(List.of(), new SQLException(STRUCTURE_FAILURE), closed), null));

        System.out.println("[MssqlQueryExecutorTest] structure failure: " + thrown.getMessage() + ", closed " + closed);
        assertEquals(DATASOURCE_GET_STRUCTURE_ERROR, thrown.getError());
        assertEquals("DATASOURCE_GET_STRUCTURE_ERROR", thrown.getMessageKey());
        assertEquals(STRUCTURE_FAILURE, thrown.getArgs()[0]);
        assertEquals(List.of("statement"), closed, "no result set was opened; the statement is closed");
    }
    // ---- BF-146 (T145): bind values against placeholders with sort maps

    static final Map<String, Object> SORT_PARAMS_BF146 = Map.of("s", Map.of("sort", "desc"));
    static final Map<String, Object> SORT_VALUES_BF146 = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "{{s}}")));
    static final List<Map<String, Object>> SORT_FILTER_BF146 = List.of(Map.of("column", "id", "condition", "=", "value", "{{s}}"));
    static final String SORT_RECORDS_BF146 = "[{\"a\":1,\"b\":{\"sort\":\"desc\"}}]";
    static final Map<String, Map<String, Object>> SORT_DETAILS_BF146 = Map.of(
            "insert", Map.of("table", "t", "changeSet", SORT_VALUES_BF146),
            "update", Map.of("table", "t", "changeSet", SORT_VALUES_BF146, "filterBy", SORT_FILTER_BF146),
            "delete", Map.of("table", "t", "filterBy", SORT_FILTER_BF146),
            "bulk_insert", Map.of("table", "t", "records", SORT_RECORDS_BF146),
            "bulk_update", Map.of("table", "t", "primaryKey", "a", "records", SORT_RECORDS_BF146));

    /**
     * BF-146 (T145, verify first): {@code GeneralSqlExecutor}'s sort rewrite would loop endlessly on a bind value that is a
     * map with a {@code sort} key and no {@code ?} of its own. Every GUI type of this dialect, rendered with such maps as its
     * values, filter values and record values, binds them as text, never as a map, and binds no more values than its SQL has
     * {@code ?} (counted as the rewrite counts them, literal ones included), the guard select of a single-row result too.
     * Each render must bind the sort value (as its JSON text), so a renderer that dropped it would fail too.
     * Catches: a renderer of this dialect that binds a value without writing its {@code ?}, or that binds a map.
     */
    @Test
    public void everyGuiTypeBindsNoMapAndNoMoreValuesThanPlaceholdersBF146() {
        int sortTexts = 0;
        for (String type : TYPES.keySet()) {
            for (boolean multi : new boolean[] {false, true}) {
                Map<String, Object> detail = new java.util.HashMap<>(SORT_DETAILS_BF146.get(type));
                detail.put("allowMultiModify", multi);
                GuiSqlCommand.GuiSqlCommandRenderResult result = executor.parseSqlCommand(type, detail).render(SORT_PARAMS_BF146);
                System.out.println("[BF-146] " + type + " multi=" + multi + " -> [" + result.sql().replace('\n', ' ') + "] " + result.bindParams());
                assertNoMapAndEnoughPlaceholdersBF146(type, result.sql(), result.bindParams());
                long reached = result.bindParams().stream().filter(value -> value instanceof String text && text.contains("\"sort\"")).count();
                org.junit.jupiter.api.Assertions.assertTrue(reached > 0, type + " multi=" + multi + ": the sort value must reach the bind list");
                sortTexts += (int) reached;
                if (result instanceof org.lowcoder.sdk.plugin.sqlcommand.command.UpdateOrDeleteSingleCommandRenderResult single) {
                    assertNoMapAndEnoughPlaceholdersBF146(type + " guard", single.getSelectQuery(), single.getSelectBindParams());
                }
            }
        }
        System.out.println("[BF-146] " + sortTexts + " sort values bound as JSON text, none as a map, none without a placeholder");
    }

    private static void assertNoMapAndEnoughPlaceholdersBF146(String label, String sql, List<Object> bindParams) {
        int placeholders = sql.split("\\?", -1).length - 1;
        org.junit.jupiter.api.Assertions.assertTrue(bindParams.size() <= placeholders, label + ": " + bindParams.size() + " values, " + placeholders + " ?");
        org.junit.jupiter.api.Assertions.assertTrue(bindParams.stream().noneMatch(Map.class::isInstance), label + ": a map is bound");
    }
}

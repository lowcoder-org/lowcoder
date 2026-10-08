package org.lowcoder.plugin.snowflake;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.CONNECTION_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit SN-1 (task L5-7): {@link SnowflakeQueryExecutor} over an in-memory H2 database ({@link SnowflakeH2Support}): the forced
 * non-prepared execution, the structure query and its schema filter, and the GUI-mode refusal (BF-160). Snowflake is a hosted service,
 * so H2 stands in for the SQL dialect and for {@code INFORMATION_SCHEMA} ({@code COLUMNS_QUERY} runs on it unchanged, with its
 * schema bound by H2's driver, not by Snowflake's).
 *
 * <p>Limits: H2's {@code INFORMATION_SCHEMA} also lists its own system tables (asserted where the schema filter is absent);
 * what Snowflake returns for its account is not tested.
 */
public class SnowflakeQueryExecutorTest {

    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final String SCHEMA_KEY = "schema";
    static final String PUBLIC_SCHEMA = "PUBLIC";
    static final String OTHER_SCHEMA = "SALES";
    static final String INJECTION_SCHEMA = "PUBLIC' or '1'='1";
    static final String BACKSLASH_INJECTION_SCHEMA = "PUBLIC\\' or '1'='1";
    static final String QUOTED_SCHEMA = "O'NEIL";
    static final String INSERT = "INSERT";
    /** The GUI types of the other SQL executors, in both cases, and one no executor knows. */
    static final List<String> GUI_TYPES = List.of("insert", INSERT, "update", "delete", "bulk_insert", "bulk_update", "unknown");
    static final String INVALID_GUI_COMMAND_TYPE_KEY = "INVALID_GUI_COMMAND_TYPE";
    /** INVALID_GUI_COMMAND_TYPE in the English bundle, for {@link #INSERT}. */
    static final String INVALID_GUI_COMMAND_TYPE_MESSAGE = "Invalid GUI command type INSERT.";

    private final SnowflakeQueryExecutor executor = new SnowflakeQueryExecutor();

    private static SnowflakeDatasourceConfig config(Map<String, Object> extParams) {
        return SnowflakeDatasourceConfig.builder().host("account").database("db").username("u").password("p").extParams(extParams).build();
    }

    private static Map<String, Object> sqlConfig(String sql, Boolean disablePreparedStatement) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("mode", "SQL");
        config.put("sql", sql);
        if (disablePreparedStatement != null) {
            config.put("disablePreparedStatement", disablePreparedStatement);
        }
        return config;
    }

    private Object run(SnowflakeH2Support h2, String sql, Boolean disablePreparedStatement, Map<String, Object> params) {
        SnowflakeDatasourceConfig config = config(Map.of());
        SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(config, sqlConfig(sql, disablePreparedStatement), params, null);
        QueryExecutionResult result = executor.executeQuery(h2.pool, context).block(TIMEOUT);
        assertNotNull(result);
        System.out.println("[SnowflakeQueryExecutorTest] " + sql + " " + params + " -> " + result.getData());
        return result.getData();
    }

    private Set<String> structureNames(SnowflakeH2Support h2, Map<String, Object> extParams) {
        DatasourceStructure structure = executor.getStructure(h2.pool, config(extParams)).block(TIMEOUT);
        Set<String> names = structure.getTables().stream().map(Table::getName).collect(Collectors.toSet());
        System.out.println("[SnowflakeQueryExecutorTest] ext params " + extParams + " -> " + names.stream().sorted().limit(8).toList() + " (" + names.size() + " tables)");
        return names;
    }

    private static void createTables(SnowflakeH2Support h2) {
        h2.execute("create schema if not exists " + OTHER_SCHEMA,
                "create table public.orders (id int, note varchar(20), created timestamp)",
                "create table " + OTHER_SCHEMA + ".customers (name varchar(20), id int)");
    }

    // ---- non-prepared execution

    @Test
    public void preparedStatementsAreAlwaysDisabledWhateverTheQueryConfigSays() {
        SnowflakeDatasourceConfig config = SnowflakeDatasourceConfig.builder().host("a").database("d").enableTurnOffPreparedStatement(true).build();
        for (Boolean flag : new Boolean[] {Boolean.FALSE, Boolean.TRUE, null}) {
            SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(config, sqlConfig("select 1", flag), Map.of(), null);
            System.out.println("[SnowflakeQueryExecutorTest] query config flag " + flag + " -> disablePreparedStatement " + context.isDisablePreparedStatement());
            assertTrue(context.isDisablePreparedStatement(), "flag " + flag);
            assertEquals("select 1", context.getQuery());
        }
    }

    @Test
    public void placeholdersAreRenderedIntoTheSqlAndAnInsertReturnsNoGeneratedKeys() {
        try (SnowflakeH2Support h2 = new SnowflakeH2Support()) {
            h2.execute("create table t (id int auto_increment primary key, name varchar(30))");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rows = (List<Map<String, Object>>) run(h2, "select {{n}} + 1 as r, '{{s}}' as s from dual", false, Map.of("n", 41, "s", "abc"));
            assertEquals(1, rows.size());
            assertEquals(42, ((Number) rows.get(0).get("R")).intValue());
            assertEquals("abc", rows.get(0).get("S"), "the value is rendered into the statement text");

            Object inserted = run(h2, "insert into t (name) values ('{{s}}')", false, Map.of("s", "x"));
            assertEquals(Map.of("affectedRows", 1), inserted, "no generatedKeys: the executor does not ask for them");
            assertEquals(List.of(Map.of("ID", 1, "NAME", "x")), h2.rows("select * from t"));
        }
    }

    // ---- structure

    @Test
    public void structureNamesTablesBySchemaAndKeepsTheColumnOrder() {
        try (SnowflakeH2Support h2 = new SnowflakeH2Support()) {
            createTables(h2);
            DatasourceStructure structure = executor.getStructure(h2.pool, config(Map.of(SCHEMA_KEY, PUBLIC_SCHEMA))).block(TIMEOUT);
            Table orders = structure.getTables().stream().filter(t -> t.getName().equals("PUBLIC.ORDERS")).findFirst().orElseThrow();
            assertEquals(TableType.TABLE, orders.getType());
            assertEquals("PUBLIC", orders.getSchema());
            assertEquals(List.of("ID", "NOTE", "CREATED"), orders.getColumns().stream().map(Column::getName).toList(), "columns in ordinal order");
            assertEquals(List.of("INTEGER", "CHARACTER VARYING", "TIMESTAMP"), orders.getColumns().stream().map(Column::getType).toList());
            assertEquals(List.of(false, false, false), orders.getColumns().stream().map(Column::getIsAutogenerated).toList());
            assertEquals(List.of(), orders.getKeys());
            System.out.println("[SnowflakeQueryExecutorTest] PUBLIC.ORDERS columns " + orders.getColumns().stream().map(c -> c.getName() + ":" + c.getType()).toList());
        }
    }

    @Test
    public void schemaExtParamLimitsTheStructureAndWithoutItEverySchemaIsListed() {
        try (SnowflakeH2Support h2 = new SnowflakeH2Support()) {
            createTables(h2);
            Set<String> publicOnly = structureNames(h2, Map.of(SCHEMA_KEY, PUBLIC_SCHEMA));
            assertEquals(Set.of("PUBLIC.ORDERS"), publicOnly);
            assertEquals(Set.of("SALES.CUSTOMERS"), structureNames(h2, Map.of(SCHEMA_KEY, OTHER_SCHEMA)));
            for (Map<String, Object> blank : List.of(Map.<String, Object>of(), Map.<String, Object>of(SCHEMA_KEY, "  "), Map.<String, Object>of(SCHEMA_KEY, "")) ) {
                Set<String> all = structureNames(h2, blank);
                assertTrue(all.containsAll(Set.of("PUBLIC.ORDERS", "SALES.CUSTOMERS")), "ext params " + blank);
                assertTrue(all.stream().anyMatch(n -> n.startsWith("INFORMATION_SCHEMA.")), "H2's system schema is listed too: " + blank);
                DatasourceStructure structure = executor.getStructure(h2.pool, config(blank)).block(TIMEOUT);
                Table orders = structure.getTables().stream().filter(t -> t.getName().equals("PUBLIC.ORDERS")).findFirst().orElseThrow();
                assertEquals(List.of("ID", "NOTE", "CREATED"), orders.getColumns().stream().map(Column::getName).toList(), "columns in ordinal order without the filter too: " + blank);
                assertEquals("PUBLIC", orders.getSchema());
            }
        }
    }

    @Test
    public void aFailingStructureReadIsAStructureErrorAndAClosedPoolAConnectionError() throws Exception {
        try (SnowflakeH2Support h2 = new SnowflakeH2Support()) {
            java.sql.Connection closed = h2.connection();
            closed.close();
            PluginException thrown = assertThrows(PluginException.class, () -> executor.getDatabaseMetadata(closed, config(Map.of())));
            System.out.println("[SnowflakeQueryExecutorTest] closed connection: " + thrown.getError() + " " + thrown.getMessageKey());
            assertEquals(DATASOURCE_GET_STRUCTURE_ERROR, thrown.getError());
            assertEquals("DATASOURCE_GET_STRUCTURE_ERROR", thrown.getMessageKey());
        }
        SnowflakeH2Support closedPool = new SnowflakeH2Support();
        closedPool.close();
        PluginException thrown = assertThrows(PluginException.class, () -> executor.getStructure(closedPool.pool, config(Map.of())).block(TIMEOUT));
        System.out.println("[SnowflakeQueryExecutorTest] closed pool: " + thrown.getError() + " " + thrown.getMessageKey());
        assertEquals(CONNECTION_ERROR, thrown.getError());
    }

    /**
     * BF-069 / D20 (fixed; was pinned as "the schema ext param is concatenated into the SQL"): the {@code schema} ext param (a
     * free text field of the data source form, pages/datasource/form/snowflakeDatasourceForm.tsx in the client) is bound to
     * the structure query, so {@code PUBLIC' or '1'='1}, which listed the tables of every schema, is now a schema name that
     * matches nothing, as is the same value with a backslash before the quote. A schema whose name has a quote is listed.
     */
    @Test
    public void schemaExtParamIsBoundSoAQuoteDoesNotChangeTheStatementBF069() {
        try (SnowflakeH2Support h2 = new SnowflakeH2Support()) {
            createTables(h2);
            h2.execute("create schema \"" + QUOTED_SCHEMA + "\"", "create table \"" + QUOTED_SCHEMA + "\".items (id int)");
            assertEquals(Set.of(), structureNames(h2, Map.of(SCHEMA_KEY, INJECTION_SCHEMA)), "no schema has this name");
            assertEquals(Set.of(), structureNames(h2, Map.of(SCHEMA_KEY, BACKSLASH_INJECTION_SCHEMA)), "no schema has this name");
            assertEquals(Set.of(QUOTED_SCHEMA + ".ITEMS"), structureNames(h2, Map.of(SCHEMA_KEY, QUOTED_SCHEMA)));
        }
    }

    // ---- GUI mode

    private static Map<String, Object> guiConfig(String commandType) {
        Map<String, Object> guiConfig = new LinkedHashMap<>();
        guiConfig.put("mode", "GUI");
        guiConfig.put("commandType", commandType);
        guiConfig.put("command", Map.of("table", "t", "changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "1")))));
        return guiConfig;
    }

    /** Asserts the refusal of a GUI type: QUERY_ARGUMENT_ERROR, INVALID_GUI_COMMAND_TYPE, the type as the argument. */
    private static void assertInvalidGuiCommandType(Throwable error, String type) {
        PluginException plugin = assertInstanceOf(PluginException.class, error, type);
        assertEquals(QUERY_ARGUMENT_ERROR, plugin.getError(), type);
        assertEquals(INVALID_GUI_COMMAND_TYPE_KEY, plugin.getMessageKey(), type);
        assertArrayEquals(new Object[] {type}, plugin.getArgs(), type);
    }

    /**
     * BF-160 (was pinned here as a bare {@link UnsupportedOperationException}): GUI mode is refused for every type as the other
     * SQL executors refuse a type they do not know, from {@code parseSqlCommand}, {@code buildQueryExecutionContext} and
     * {@code sanitizeQueryConfig}. The client does not offer GUI mode for Snowflake (the type is listed in
     * NOT_SUPPORT_GUI_SQL_QUERY, comps/queries/sqlQuery/SQLQuery.tsx:264-269, and the mode selector is hidden for it,
     * comps/queries/queryComp/queryPropertyView.tsx:378-379), so only a hand-made query config reaches this.
     * Catches: the bare exception back, or a refusal that does not name the type.
     */
    @Test
    public void guiModeIsRefusedAsAnInvalidGuiCommandTypeBF160() {
        for (String type : GUI_TYPES) {
            assertInvalidGuiCommandType(assertThrows(RuntimeException.class, () -> executor.parseSqlCommand(type, Map.of()), type), type);
        }
        assertInvalidGuiCommandType(assertThrows(RuntimeException.class,
                () -> executor.buildQueryExecutionContext(config(Map.of()), guiConfig(INSERT), Map.of(), null)), INSERT);
        assertInvalidGuiCommandType(assertThrows(RuntimeException.class, () -> executor.sanitizeQueryConfig(guiConfig(INSERT))), INSERT);
        System.out.println("[SnowflakeQueryExecutorTest] GUI mode refused for " + GUI_TYPES);
    }

    /**
     * BF-160 on the execution path ({@code QueryExecutionServiceImpl} builds the context with
     * {@code buildQueryExecutionContextMono}): the error names the type, where the bare exception was wrapped as
     * "Illegal query configuration: null.".
     */
    @Test
    public void guiModeOnTheExecutionPathNamesTheTypeBF160() {
        StepVerifier.create(executor.buildQueryExecutionContextMono(config(Map.of()), guiConfig(INSERT), Map.of(), null))
                .expectErrorSatisfies(error -> {
                    System.out.println("[SnowflakeQueryExecutorTest] GUI mode on the execution path: " + error.getMessage());
                    assertInvalidGuiCommandType(error, INSERT);
                    assertEquals(INVALID_GUI_COMMAND_TYPE_MESSAGE, error.getMessage());
                })
                .verify(TIMEOUT);
    }
}

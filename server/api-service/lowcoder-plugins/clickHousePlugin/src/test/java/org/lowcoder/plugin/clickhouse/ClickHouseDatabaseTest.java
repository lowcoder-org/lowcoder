package org.lowcoder.plugin.clickhouse;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.clickhouse.model.ClickHouseDatasourceConfig;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.net.ServerSocket;
import java.sql.Connection;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.DATABASE;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.PASSWORD;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.config;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.connect;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.connector;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.execute;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.executor;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.host;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.jdbc;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.port;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.rows;
import static org.lowcoder.plugin.clickhouse.ClickHouseContainerSupport.run;
import static org.lowcoder.sdk.exception.PluginCommonError.CONNECTION_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.PREPARED_STATEMENT_BIND_PARAMETERS_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit CH-2 (task L5-3): {@code ClickHouseConnector}, {@code ClickHouseQueryExecutor} and {@code ClickHouseStructureParser}
 * against a real ClickHouse (the image pinned in {@code ContainerImages.CLICKHOUSE_24_8}, the module's
 * {@code clickhouse-jdbc 0.3.2-patch11} driver over HTTP). Each test uses its own tables, or its own database for the
 * structure tests.
 */
public class ClickHouseDatabaseTest {

    static final String WRONG_PASSWORD = "not-the-password";
    static final String CLOSED_MESSAGE = "hikari datasource closed.";
    static final int FAILING_RUNS = 3;

    private static Object column(QueryExecutionResult result, int row, String name) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) result.getData();
        return rows.get(row).get(name);
    }

    private static void close(HikariDataSource pool) {
        connector().destroyConnection(pool).block();
    }

    // ---- connector

    @Test
    public void createConnectionAndTestConnectionSucceed() {
        ClickHouseDatasourceConfig config = config();
        HikariDataSource pool = connect(config);
        try {
            assertTrue(pool.isRunning());
            assertEquals("com.clickhouse.jdbc.ClickHouseDriver", pool.getDriverClassName());
            assertEquals("jdbc:clickhouse:http://" + host() + ":" + port() + "/" + DATABASE, pool.getJdbcUrl());
            assertEquals(1, ((Number) column(run(pool, config, "select 1 as one", Map.of()), 0, "one")).intValue());
            DatasourceTestResult test = connector().testConnection(config).block();
            assertNotNull(test);
            assertTrue(test.isSuccess());
            System.out.println("[ClickHouseDatabaseTest] pool " + pool.getJdbcUrl() + ", test connection succeeded");
        } finally {
            close(pool);
        }
    }

    @Test
    public void wrongPasswordAndClosedPortGiveCodedErrors() throws Exception {
        ClickHouseDatasourceConfig wrongPassword = config(DATABASE, WRONG_PASSWORD, false, false, false, host(), port());
        PluginException thrown = assertThrows(PluginException.class, () -> connect(wrongPassword));
        System.out.println("[ClickHouseDatabaseTest] wrong password: " + thrown.getError() + " " + thrown.getMessage());
        assertEquals(DATASOURCE_ARGUMENT_ERROR, thrown.getError());
        DatasourceTestResult failed = connector().testConnection(wrongPassword).block();
        assertFalse(failed.isSuccess());

        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        ClickHouseDatasourceConfig noServer = config(DATABASE, PASSWORD, false, false, false, host(), closedPort);
        PluginException refused = assertThrows(PluginException.class, () -> connect(noServer));
        System.out.println("[ClickHouseDatabaseTest] closed port: " + refused.getError() + " " + refused.getMessage());
        assertEquals(DATASOURCE_ARGUMENT_ERROR, refused.getError());
        assertFalse(connector().testConnection(noServer).block().isSuccess());
    }

    @Test
    public void destroyConnectionClosesThePoolAndNullIsSafe() {
        connector().destroyConnection(null).block();
        HikariDataSource pool = connect(config());
        connector().destroyConnection(pool).block();
        assertTrue(pool.isClosed());
    }

    @Test
    public void closedPoolIsRejectedBeforeAnyQuery() {
        ClickHouseDatasourceConfig config = config();
        HikariDataSource pool = connect(config);
        close(pool);
        PluginException query = assertThrows(PluginException.class, () -> run(pool, config, "select 1", Map.of()));
        assertEquals(CONNECTION_ERROR, query.getError());
        assertEquals(CLOSED_MESSAGE, query.getArgs()[0]);
        PluginException structure = assertThrows(PluginException.class, () -> executor().getStructure(pool, config).block());
        assertEquals(CONNECTION_ERROR, structure.getError());
        assertEquals(CLOSED_MESSAGE, structure.getArgs()[0]);
        System.out.println("[ClickHouseDatabaseTest] closed pool: " + query.getArgs()[0]);
    }

    @Test
    public void usingSslSwitchesTheSchemeToHttps() {
        ClickHouseDatasourceConfig https = config(DATABASE, PASSWORD, true, false, false, host(), port());
        PluginException thrown = assertThrows(PluginException.class, () -> connect(https));
        System.out.println("[ClickHouseDatabaseTest] https against the HTTP port: " + thrown.getError() + " " + thrown.getMessage());
        assertEquals(DATASOURCE_ARGUMENT_ERROR, thrown.getError());
    }

    @Test
    public void readonlyFlagReachesThePoolAndTheDriversBehaviourIsObserved() throws Exception {
        try (Connection jdbc = jdbc(DATABASE)) {
            execute(jdbc, "drop table if exists t_readonly", "create table t_readonly (i Int32) engine=Memory");
            ClickHouseDatasourceConfig readonly = config(DATABASE, PASSWORD, false, true, false, host(), port());
            HikariDataSource pool = connect(readonly);
            try {
                assertTrue(pool.isReadOnly());
                String outcome;
                try {
                    outcome = String.valueOf(run(pool, readonly, "insert into t_readonly values (1)", Map.of()).getData());
                } catch (PluginException e) {
                    outcome = e.getError() + " " + e.getMessage();
                }
                System.out.println("[ClickHouseDatabaseTest] insert through a read-only pool: " + outcome + " ; rows now " + rows(jdbc, "select * from t_readonly"));
            } finally {
                close(pool);
            }
        }
    }

    // ---- executor

    @Test
    public void eachSupportedJavaTypeIsBoundAndReadBack() throws Exception {
        ClickHouseDatasourceConfig config = config();
        HikariDataSource pool = connect(config);
        try (Connection jdbc = jdbc(DATABASE)) {
            execute(jdbc, "drop table if exists t_types", "create table t_types (i Int32, l Int64, d Decimal(38,20), b Bool, s String, j String, n Nullable(String)) engine=Memory");
            Map<String, Object> params = new java.util.HashMap<>();
            params.put("i", 7);
            params.put("l", 3_000_000_001L);
            params.put("d", 0.1d);
            params.put("b", true);
            params.put("s", "it's \"q\" žluť");
            params.put("j", Map.of("k", 1));
            params.put("n", null);
            run(pool, config, "insert into t_types values ({{i}}, {{l}}, {{d}}, {{b}}, {{s}}, {{j}}, {{n}})", params);
            QueryExecutionResult read = run(pool, config, "select i, l, d, b, s, j, n from t_types", Map.of());
            System.out.println("[ClickHouseDatabaseTest] read back: " + read.getData());
            assertEquals(7, ((Number) column(read, 0, "i")).intValue());
            assertEquals(3_000_000_001L, ((Number) column(read, 0, "l")).longValue());
            assertEquals(0, new java.math.BigDecimal("0.1").compareTo(new java.math.BigDecimal(String.valueOf(column(read, 0, "d")))));
            assertTrue(String.valueOf(column(read, 0, "b")).equals("true") || String.valueOf(column(read, 0, "b")).equals("1"), String.valueOf(column(read, 0, "b")));
            assertEquals("it's \"q\" žluť", column(read, 0, "s"));
            assertEquals("{\"k\":1}", column(read, 0, "j"));
            assertEquals(null, column(read, 0, "n"));
        } finally {
            close(pool);
        }
    }

    /** Unlike {@code GeneralSqlExecutor} (defect D2: the name is always empty), this executor names the parameter. */
    @Test
    public void unsupportedBindTypeNamesTheParameter() {
        ClickHouseDatasourceConfig config = config();
        HikariDataSource pool = connect(config);
        try {
            PluginException thrown = assertThrows(PluginException.class,
                    () -> run(pool, config, "select {{ts}} as v", Map.of("ts", new Timestamp(0))));
            assertEquals(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, thrown.getError());
            assertEquals("PS_BIND_ERROR", thrown.getMessageKey());
            assertEquals(List.of("ts", "Timestamp"), Arrays.asList(thrown.getArgs()));
            System.out.println("[ClickHouseDatabaseTest] unsupported type: " + Arrays.toString(thrown.getArgs()));
        } finally {
            close(pool);
        }
    }

    @Test
    public void affectedRowsOfDdlAndInsertsOnARealServer() throws Exception {
        ClickHouseDatasourceConfig config = config(DATABASE, PASSWORD, false, false, true, host(), port());
        HikariDataSource pool = connect(config);
        try {
            Object ddl = run(pool, config, "create table if not exists t_affected (i Int32) engine=Memory", Map.of()).getData();
            Object prepared = run(pool, config, "insert into t_affected values ({{i}})", Map.of("i", 1)).getData();
            Object plain = run(pool, config, "insert into t_affected values (2)", true, Map.of()).getData();
            System.out.println("[ClickHouseDatabaseTest] affected rows: ddl " + ddl + ", prepared insert " + prepared + ", plain insert " + plain);
            assertEquals(Map.of("affectedRows", 0), ddl);
            assertEquals(Map.of("affectedRows", 1), prepared);
            assertEquals(Map.of("affectedRows", 1), plain);
        } finally {
            close(pool);
        }
    }

    @Test
    public void disabledPreparedStatementRendersTheValueIntoTheSql() {
        ClickHouseDatasourceConfig config = config(DATABASE, PASSWORD, false, false, true, host(), port());
        HikariDataSource pool = connect(config);
        try {
            Map<String, Object> params = Map.of("v", "x' || 'y");
            Object bound = column(run(pool, config, "select {{v}} as v", false, params), 0, "v");
            Object rendered = column(run(pool, config, "select '{{v}}' as v", true, params), 0, "v");
            System.out.println("[ClickHouseDatabaseTest] bound -> " + bound + " ; rendered into the SQL -> " + rendered);
            assertEquals("x' || 'y", bound);
            assertEquals("xy", rendered);
        } finally {
            close(pool);
        }
    }

    @Test
    public void invalidSqlIsQueryExecutionErrorAndTheConnectionComesBack() {
        ClickHouseDatasourceConfig config = config();
        HikariDataSource pool = connect(config);
        try {
            for (int i = 0; i < FAILING_RUNS; i++) {
                PluginException thrown = assertThrows(PluginException.class, () -> run(pool, config, "selec nothing from nowhere", Map.of()));
                assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
            }
            run(pool, config, "select 1", Map.of());
            assertEquals(0, pool.getHikariPoolMXBean().getActiveConnections(), "connections must go back to the pool");
            System.out.println("[ClickHouseDatabaseTest] active connections after " + FAILING_RUNS + " failures: " + pool.getHikariPoolMXBean().getActiveConnections());
        } finally {
            close(pool);
        }
    }

    @Test
    public void duplicateColumnNamesGiveAHintMessage() {
        ClickHouseDatasourceConfig config = config();
        HikariDataSource pool = connect(config);
        try {
            QueryExecutionResult result = run(pool, config, "select 1, 1", Map.of());
            assertEquals(1, result.getHintLocaleMessages().size());
            assertEquals("DUPLICATE_COLUMN", result.getHintLocaleMessages().get(0).messageKey());
            assertEquals(List.of("1"), Arrays.asList(result.getHintLocaleMessages().get(0).args()));
        } finally {
            close(pool);
        }
    }

    // ---- structure

    /**
     * BF-053 fixed (plan section 9 row "ClickHouseStructureParser's COLUMNS_QUERY uses col.is_nullable != 0"): the columns
     * query compared {@code col.is_nullable}, a String on the pinned server, with a number (code 386, NO_COMMON_TYPE), so
     * {@code getStructure} failed for every database. It now lists the tables of the configured database with their columns
     * in order, and not the tables of another database.
     */
    @Test
    public void structureListsTheTablesAndColumnsOfTheConfiguredDatabaseOnlyBF053() throws Exception {
        String database = "struct_db";
        String otherDatabase = "struct_other_db";
        try (Connection jdbc = jdbc(DATABASE)) {
            execute(jdbc, "drop database if exists " + database, "create database " + database,
                    "drop database if exists " + otherDatabase, "create database " + otherDatabase,
                    "create table " + database + ".a_table (id Int32, name String) engine=Memory",
                    "create table " + database + ".b_table (code Nullable(String), created DateTime) engine=Memory",
                    "create table " + otherDatabase + ".other_table (x Int32) engine=Memory");
        }
        ClickHouseDatasourceConfig config = config(database);
        HikariDataSource pool = connect(config);
        try {
            DatasourceStructure structure = executor().getStructure(pool, config).block();
            Map<String, List<String>> columns = new LinkedHashMap<>();
            structure.getTables().forEach(table -> columns.put(table.getName(),
                    table.getColumns().stream().map(column -> column.getName() + " " + column.getType()).toList()));
            System.out.println("[ClickHouseDatabaseTest] getStructure: " + columns);
            assertEquals(Map.of("a_table", List.of("id Int32", "name String"), "b_table", List.of("code Nullable(String)", "created DateTime")), columns);
            assertEquals(0, pool.getHikariPoolMXBean().getActiveConnections(), "the connection must go back to the pool");
        } finally {
            close(pool);
        }
    }
}

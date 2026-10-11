package org.lowcoder.plugin.oracle;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.oracle.model.OracleDatasourceConfig;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.math.BigDecimal;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.ADMIN_PASSWORD;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.ADMIN_USER;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.CONNECTOR;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.EXECUTOR;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.PASSWORD;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.SERVICE;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.SID;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.USER;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.config;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.connect;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.destroy;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.execute;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.guiConfig;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.host;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.jdbc;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.port;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.rows;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.run;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.serviceConfig;
import static org.lowcoder.plugin.oracle.OracleContainerSupport.sql;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit OR-3 (task L5-6): {@code OracleConnector}, {@code OracleQueryExecutor} (structure), the shared result parsing and the
 * GUI commands against a real Oracle Free 23 (the image pinned in {@code ContainerImages.ORACLE_FREE_23}, the module's
 * {@code ojdbc11 23.7.0.25.01} driver), started once per JVM by {@link OracleContainerSupport}. Heavy-container tag: the
 * default build does not run it (run command in log-L5.md). Each test uses its own tables in the schema of user {@code app}
 * (created without quotes, so their names and the columns the structure reports are upper case; the GUI tests use those
 * names).
 */
@Tag("heavy-container")
public class OracleDatabaseTest {

    static final String WRONG_PASSWORD = "not-the-password";
    static final int ORACLE_POOL_SIZE = 50;
    static final String DRIVER = "oracle.jdbc.OracleDriver";
    static final String INJECTION = "x'; drop table t_gui; --";
    static final String LOGON_DENIED = "ORA-01017";
    static final long INIT_TIMEOUT_MILLIS = 10_000;

    private static Map<String, Object> keyValues(Object... columnsAndValues) {
        List<Map<String, Object>> comp = new ArrayList<>();
        for (int i = 0; i < columnsAndValues.length; i += 2) {
            comp.add(Map.of("column", columnsAndValues[i], "value", columnsAndValues[i + 1]));
        }
        return Map.of("compType", "KEY_VALUE_PAIRS", "comp", comp);
    }

    private static Map<String, Object> filterOn(String table, String column, boolean allowMultiModify) {
        Map<String, Object> command = new HashMap<>();
        command.put("table", table);
        command.put("allowMultiModify", allowMultiModify);
        command.put("filterBy", List.of(Map.of("column", column, "condition", "=", "value", "{{key}}")));
        return command;
    }

    private Object gui(String type, Map<String, Object> command, Map<String, Object> params) {
        OracleDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            return run(pool, config, guiConfig(type, command), params);
        } finally {
            destroy(pool);
        }
    }

    private static Object cell(Object data, String column) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) data;
        return rows.get(0).get(column);
    }

    private static List<Object> column(Connection jdbc, String sql, String column) {
        return rows(jdbc, sql).stream().map(row -> row.get(column)).toList();
    }

    // ---- connector

    @Test
    public void poolOpensByServiceNameRunsQueriesAndTestConnectionSucceeds() {
        OracleDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            HikariDataSource dataSource = (HikariDataSource) pool.getHikariDataSource();
            assertTrue(dataSource.isRunning());
            assertEquals(DRIVER, dataSource.getDriverClassName());
            assertEquals(ORACLE_POOL_SIZE, dataSource.getMaximumPoolSize());
            assertEquals("jdbc:oracle:thin:@//" + host() + ":" + port() + "/" + SERVICE, dataSource.getJdbcUrl());
            assertEquals(BigDecimal.ONE, cell(sql(pool, config, "select 1 as \"one\" from dual", Map.of()), "one"));
            assertEquals(new BigDecimal(42), cell(sql(pool, config, "select {{a}} + 1 as \"r\" from dual", Map.of("a", 41)), "r"), "a bound parameter reaches the server");
            DatasourceTestResult test = CONNECTOR.testConnection(config).block();
            assertNotNull(test);
            assertTrue(test.isSuccess());
            System.out.println("[OracleDatabaseTest] pool " + dataSource.getJdbcUrl() + ", test connection succeeded");
        } finally {
            destroy(pool);
        }
    }

    @Test
    public void sidExplicitUrlAndServiceNameReachTheirDatabases() {
        RuntimeException appViaSid = assertThrows(RuntimeException.class, () -> connect(
                OracleDatasourceConfig.builder().host(host()).port((long) port()).sid(SID).username(USER).password(PASSWORD).build()));
        System.out.println("[OracleDatabaseTest] app user by SID " + SID + ": " + appViaSid.getMessage());
        assertTrue(appViaSid.getMessage().contains(LOGON_DENIED), "the SID names the container root, where the application user does not exist: " + appViaSid.getMessage());

        OracleDatasourceConfig systemViaSid = OracleDatasourceConfig.builder().host(host()).port((long) port()).sid(SID).username(ADMIN_USER).password(ADMIN_PASSWORD).build();
        HikariPerfWrapper rootPool = connect(systemViaSid);
        try {
            assertEquals("CDB$ROOT", cell(sql(rootPool, systemViaSid, "select sys_context('USERENV', 'CON_NAME') as \"con\" from dual", Map.of()), "con"));
        } finally {
            destroy(rootPool);
        }

        OracleDatasourceConfig explicit = OracleDatasourceConfig.builder().jdbcUrl("jdbc:oracle:thin:@//" + host() + ":" + port() + "/" + SERVICE).username(USER).password(PASSWORD).build();
        HikariPerfWrapper explicitPool = connect(explicit);
        try {
            assertEquals(SERVICE, cell(sql(explicitPool, explicit, "select sys_context('USERENV', 'CON_NAME') as \"con\" from dual", Map.of()), "con"));
        } finally {
            destroy(explicitPool);
        }
    }

    @Test
    public void wrongPasswordIsReportedWithinTheInitTimeout() {
        long start = System.nanoTime();
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(serviceConfig(USER, WRONG_PASSWORD, false)));
        long millis = (System.nanoTime() - start) / 1_000_000;
        System.out.println("[OracleDatabaseTest] wrong password: " + thrown.getClass().getSimpleName() + " after " + millis + " ms: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains(LOGON_DENIED), thrown.getMessage());
        assertTrue(millis < INIT_TIMEOUT_MILLIS, "took " + millis + " ms");
    }

    /**
     * Pins the plan section 9 row "read-only not enforced" (D-6: fix deferred) for Oracle: the connector hands
     * {@code readOnly} to Hikari (asserted in {@code OracleConnectorConfigTest}), but the Oracle driver treats
     * {@code Connection.setReadOnly} as a hint and sends nothing to the server, so an insert through a read-only pool succeeds
     * and the row is stored. The driver ignores it; the connector does set it. A fix (a read-only transaction on the
     * connection) changes this test on purpose.
     */
    @Test
    public void readonlyFlagDoesNotStopAWriteBecauseTheDriverIgnoresIt() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_readonly", "create table t_readonly (id number)");
            OracleDatasourceConfig readonly = serviceConfig(USER, PASSWORD, true);
            HikariPerfWrapper pool = connect(readonly);
            try {
                assertTrue(((HikariDataSource) pool.getHikariDataSource()).isReadOnly(), "the connector set read-only on the pool");
                Object result = sql(pool, readonly, "insert into t_readonly values (1)", Map.of());
                System.out.println("[OracleDatabaseTest] insert through a read-only pool: " + result);
                assertEquals(1, ((Map<?, ?>) result).get("affectedRows"));
            } finally {
                destroy(pool);
            }
            assertEquals(List.of(BigDecimal.ONE), column(jdbc, "select id as \"id\" from t_readonly", "id"), "the write reached the table");
        }
    }

    // ---- structure

    private static Table table(DatasourceStructure structure, String name) {
        return structure.getTables().stream().filter(t -> t.getName().equals(name)).findFirst().orElseThrow();
    }

    @Test
    public void structureListsTheTablesAndViewsOfTheConnectedUserWithUpperCaseNames() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop view v_alpha", "drop table beta", "drop table alpha");
            execute(jdbc, "create table alpha (zeta number primary key, \"mixed\" varchar2(20), mid timestamp)",
                    "create table beta (id number, ref number references alpha(zeta))", "create view v_alpha as select zeta from alpha");
        }
        OracleDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            DatasourceStructure structure = EXECUTOR.getStructure(pool, config).block();
            Set<String> names = structure.getTables().stream().map(Table::getName).collect(Collectors.toSet());
            System.out.println("[OracleDatabaseTest] tables: " + names);
            assertTrue(names.containsAll(Set.of("ALPHA", "BETA", "V_ALPHA")), names.toString());
            assertTrue(names.stream().noneMatch(n -> n.startsWith("SYS") || n.contains(".")), "only the user's own objects, without a schema prefix: " + names);
            Table alpha = table(structure, "ALPHA");
            assertEquals(TableType.TABLE, alpha.getType());
            assertNull(alpha.getSchema());
            assertEquals(Set.of("ZETA", "mixed", "MID"), alpha.getColumns().stream().map(DatasourceStructure.Column::getName).collect(Collectors.toSet()), "a quoted mixed-case column keeps its case");
            assertEquals(Set.of("NUMBER", "VARCHAR2", "TIMESTAMP(6)"), alpha.getColumns().stream().map(DatasourceStructure.Column::getType).collect(Collectors.toSet()));
            assertEquals(List.of(), alpha.getKeys(), "keys are not read: the primary key of ZETA and the foreign key of BETA are not listed");
            assertEquals(List.of(), table(structure, "BETA").getKeys());
            assertEquals(TableType.TABLE, table(structure, "V_ALPHA").getType(), "a view is listed as a TABLE");
        } finally {
            destroy(pool);
        }
    }

    // ---- results

    @Test
    public void realDriverReturnsWhatTheSharedResultParserMakesOfEachType() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_types");
            execute(jdbc, "create table t_types (c_num number, c_int number(10), c_float float, c_bd binary_double, c_date date, c_dtime date, c_ts timestamp, c_v varchar2(40), "
                    + "c_nv nvarchar2(20), c_raw raw(4), c_blob blob, c_char char(3))");
            execute(jdbc, "insert into t_types values (12.5, 42, 1.5, 2.25, date '2024-02-29', to_date('2024-02-29 13:14:15', 'YYYY-MM-DD HH24:MI:SS'), timestamp '2024-02-29 13:14:15.123456', "
                    + "'žluťoučký', 'žluť', hextoraw('0001FF'), hextoraw('0001FF'), 'ab')");
            execute(jdbc, "insert into t_types (c_v) values (null)");
            OracleDatasourceConfig config = config();
            HikariPerfWrapper pool = connect(config);
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> data = (List<Map<String, Object>>) sql(pool, config, "select * from t_types", Map.of());
                System.out.println("[OracleDatabaseTest] parsed rows: " + data);
                Map<String, Object> first = data.get(0);
                assertEquals(new BigDecimal("12.5"), first.get("C_NUM"));
                assertEquals(new BigDecimal("42"), first.get("C_INT"));
                assertEquals(new BigDecimal("1.5"), first.get("C_FLOAT"));
                assertEquals(2.25d, first.get("C_BD"));
                assertEquals("2024-02-29", first.get("C_DATE"));
                assertEquals("2024-02-29", first.get("C_DTIME"), "an Oracle DATE with a time part is returned as its date only");
                assertEquals("2024-02-29 13:14:15", first.get("C_TS"), "the fraction is dropped");
                assertEquals("žluťoučký", first.get("C_V"));
                assertEquals("žluť", first.get("C_NV"));
                assertArrayEquals(new byte[] {0, 1, (byte) 0xFF}, (byte[]) first.get("C_RAW"));
                assertEquals("AAH/", first.get("C_BLOB"), "a blob comes back as base64 text");
                assertEquals("ab ", first.get("C_CHAR"), "a char column is blank-padded");
                Map<String, Object> second = data.get(1);
                assertEquals(new ArrayList<>(first.keySet()), new ArrayList<>(second.keySet()), "column order is the same on every row");
                second.forEach((name, value) -> assertNull(value, name));
            } finally {
                destroy(pool);
            }
        }
    }

    /**
     * Pins the plan section 9 row "CLOB/TIMESTAMPTZ/INTERVALDS cells as driver objects, toJson empty" (D-6: fix deferred): the shared result parser hands {@code CLOB}, {@code TIMESTAMP WITH TIME ZONE} and {@code INTERVAL DAY TO SECOND} cells to the result
     * as the driver's own objects ({@code oracle.sql.CLOB}, {@code oracle.sql.TIMESTAMPTZ}, {@code oracle.sql.INTERVALDS}) instead of text, so the query
     * result holds objects that are not readable data, and writing the result as JSON gives an empty string. A fix (reading them as text) changes this test on purpose.
     */
    @Test
    public void lobTimeZoneAndIntervalCellsReachTheResultAsDriverObjects_pinsTheSection9Row() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_lob", "create table t_lob (c_clob clob, c_tstz timestamp with time zone, c_intv interval day to second)");
            execute(jdbc, "insert into t_lob values ('long text', timestamp '2024-02-29 13:14:15.123 +05:30', interval '1 02:03:04' day to second)");
            OracleDatasourceConfig config = config();
            HikariPerfWrapper pool = connect(config);
            try {
                Object data = sql(pool, config, "select * from t_lob", Map.of());
                Object clob = cell(data, "C_CLOB");
                Object tstz = cell(data, "C_TSTZ");
                Object interval = cell(data, "C_INTV");
                System.out.println("[OracleDatabaseTest] clob " + clob.getClass().getName() + ", timestamptz " + tstz.getClass().getName() + ", interval " + interval.getClass().getName());
                assertEquals("oracle.sql.INTERVALDS", interval.getClass().getName());
                assertEquals("oracle.sql.CLOB", clob.getClass().getName());
                assertEquals("oracle.sql.TIMESTAMPTZ", tstz.getClass().getName());
                String json = org.lowcoder.sdk.util.JsonUtils.toJson(data);
                System.out.println("[OracleDatabaseTest] json of the result: '" + json + "'");
                assertEquals("", json, "the result with these objects cannot be written as JSON: the JSON helper returns an empty string");
            } finally {
                destroy(pool);
            }
        }
    }

    // ---- GUI commands

    @Test
    public void guiCommandsChangeTheRealTableAndAnInjectionValueIsStoredAsText() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_gui", "create table t_gui (id number primary key, name varchar2(100))");
            Object inserted = gui("insert", Map.of("table", "t_gui", "changeSet", keyValues("ID", "{{id}}", "NAME", "{{name}}")), Map.of("id", 1, "name", INJECTION));
            System.out.println("[OracleDatabaseTest] insert: " + inserted);
            assertEquals(1, ((Map<?, ?>) inserted).get("affectedRows"));
            assertEquals(List.of(Map.of("ID", BigDecimal.ONE, "NAME", INJECTION)), rows(jdbc, "select id, name from t_gui"), "the value is stored as text, the table is intact");

            Map<String, Object> updateDetail = filterOn("t_gui", "ID", true);
            updateDetail.put("changeSet", keyValues("NAME", "{{name}}"));
            gui("UPDATE", updateDetail, Map.of("key", 1, "name", "o'brien"));
            assertEquals(List.of("o'brien"), column(jdbc, "select name from t_gui where id = 1", "NAME"));

            execute(jdbc, "insert into t_gui values (2, 'b')", "insert into t_gui values (3, 'c')");
            gui("BULK_UPDATE", Map.of("table", "t_gui", "primaryKey", "ID", "records", "[{\"ID\":2,\"NAME\":\"B\"},{\"ID\":3,\"NAME\":\"C\"}]"), Map.of());
            assertEquals(List.of("o'brien", "B", "C"), column(jdbc, "select name from t_gui order by id", "NAME"));

            gui("DELETE", filterOn("t_gui", "ID", false), Map.of("key", 3));
            assertEquals(List.of(BigDecimal.ONE, new BigDecimal(2)), column(jdbc, "select id from t_gui order by id", "ID"));
        }
    }

    @Test
    public void rownumOneChangesAndDeletesExactlyOneOfThreeMatchingRows() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_top", "create table t_top (id number, grp number, marker varchar2(10))",
                    "insert into t_top values (1, 1, 'orig')", "insert into t_top values (2, 1, 'orig')", "insert into t_top values (3, 1, 'orig')", "insert into t_top values (4, 2, 'orig')");

            Map<String, Object> update = filterOn("t_top", "GRP", false);
            update.put("changeSet", keyValues("MARKER", "changed"));
            Object updated = gui("UPDATE", update, Map.of("key", 1));
            System.out.println("[OracleDatabaseTest] update rownum=1: " + updated);
            assertEquals(1, ((Map<?, ?>) updated).get("affectedRows"));
            assertEquals(1, rows(jdbc, "select * from t_top where marker = 'changed'").size(), "exactly one row changed");

            Object deleted = gui("DELETE", filterOn("t_top", "GRP", false), Map.of("key", 1));
            assertEquals(1, ((Map<?, ?>) deleted).get("affectedRows"));
            assertEquals(3, rows(jdbc, "select * from t_top").size(), "exactly one of the three matching rows is gone");

            Object all = gui("DELETE", filterOn("t_top", "GRP", true), Map.of("key", 1));
            assertEquals(2, ((Map<?, ?>) all).get("affectedRows"));
            assertEquals(List.of(new BigDecimal(4)), column(jdbc, "select id from t_top", "ID"), "the row of the other group stays");

            Map<String, Object> multiUpdate = filterOn("t_top", "GRP", true);
            multiUpdate.put("changeSet", keyValues("MARKER", "all"));
            assertEquals(1, ((Map<?, ?>) gui("UPDATE", multiUpdate, Map.of("key", 2))).get("affectedRows"));
            assertEquals(List.of("all"), column(jdbc, "select marker from t_top", "MARKER"));
        }
    }

    /**
     * Pins the plan section 9 row "bulk insert of two or more records fails with ORA-63809" (D-6: fix deferred): the bulk insert renders one {@code insert ... values (?,?),(?,?)} (a table value constructor) and
     * the executor asks for generated keys, which Oracle 23 refuses for such a statement (ORA-63809), so a bulk insert of two
     * or more records fails and nothing is written; a single record works.
     */
    @Test
    public void bulkInsertOfTwoRecordsFailsOnOracleWhileOneRecordWorks_pinsTheSection9Row() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_bulk", "create table t_bulk (id number, name varchar2(10))");
            Object one = gui("BULK_INSERT", Map.of("table", "t_bulk", "records", "[{\"ID\":1,\"NAME\":\"a\"}]"), Map.of());
            System.out.println("[OracleDatabaseTest] bulk insert of one record: " + one);
            assertEquals(1, rows(jdbc, "select * from t_bulk").size());
            PluginException thrown = assertThrows(PluginException.class, () -> gui("BULK_INSERT",
                    Map.of("table", "t_bulk", "records", "[{\"ID\":2,\"NAME\":\"b\"},{\"ID\":3,\"NAME\":\"c\"}]"), Map.of()));
            System.out.println("[OracleDatabaseTest] bulk insert of two records: " + thrown.getError() + " " + thrown.getMessage());
            assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
            assertTrue(thrown.getMessage().contains("ORA-63809"), thrown.getMessage());
            assertEquals(1, rows(jdbc, "select * from t_bulk").size(), "nothing of the failed bulk insert was written");
        }
    }
}

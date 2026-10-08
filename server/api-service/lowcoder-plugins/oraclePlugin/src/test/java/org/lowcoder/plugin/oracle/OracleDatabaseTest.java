package org.lowcoder.plugin.oracle;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.oracle.model.OracleDatasourceConfig;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.math.BigDecimal;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
    static final String AFFECTED_ROWS = "affectedRows";
    static final String GENERATED_KEYS = "generatedKeys";

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
     * BF-052 fixed (plan section 9 row "CLOB/TIMESTAMPTZ/INTERVALDS cells as driver objects, toJson empty"): the shared
     * result parser handed {@code CLOB}, {@code TIMESTAMP WITH TIME ZONE} and {@code INTERVAL DAY TO SECOND} cells, and
     * their siblings {@code NCLOB}, {@code TIMESTAMP WITH LOCAL TIME ZONE}, {@code INTERVAL YEAR TO MONTH} and
     * {@code ROWID}, to the result as the driver's own objects, so the result was written as an empty string. They are text
     * now, the result is written as JSON, and the null cells of a row stay null (its rowid is text like any other).
     */
    @Test
    public void lobTimeZoneIntervalAndRowidCellsReachTheResultAsTextBF052() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_lob", "create table t_lob (c_clob clob, c_nclob nclob, c_tstz timestamp with time zone, "
                            + "c_tstz_region timestamp with time zone, c_tsltz timestamp with local time zone, c_intv interval day to second, "
                            + "c_iym interval year to month)",
                    "insert into t_lob values ('long text', N'žluťoučký', timestamp '2024-02-29 13:14:15.123 +05:30', "
                            + "timestamp '2024-02-29 13:14:15.123 Europe/Prague', timestamp '2024-02-29 13:14:15.123', "
                            + "interval '1 02:03:04.5' day to second, interval '2-3' year to month)",
                    "insert into t_lob (c_clob) values (null)");
            String rowid = column(jdbc, "select rowidtochar(rowid) as r from t_lob where c_clob is not null", "R").get(0).toString();
            String localTimeZone = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(
                    LocalDateTime.parse("2024-02-29T13:14:15.123").atZone(ZoneId.systemDefault()).toOffsetDateTime());
            OracleDatasourceConfig config = config();
            HikariPerfWrapper pool = connect(config);
            try {
                Object data = sql(pool, config, "select t.*, rowid as c_rowid from t_lob t order by c_intv nulls last", Map.of());
                String json = org.lowcoder.sdk.util.JsonUtils.toJson(data);
                System.out.println("[OracleDatabaseTest] lob, time zone, interval and rowid cells: " + json);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data;
                Map<String, Object> expected = new LinkedHashMap<>();
                expected.put("C_CLOB", "long text");
                expected.put("C_NCLOB", "žluťoučký");
                expected.put("C_TSTZ", "2024-02-29T13:14:15.123+05:30");
                expected.put("C_TSTZ_REGION", "2024-02-29T13:14:15.123+01:00");
                expected.put("C_TSLTZ", localTimeZone);
                expected.put("C_INTV", "PT26H3M4.5S");
                expected.put("C_IYM", "P2Y3M");
                expected.put("C_ROWID", rowid);
                assertEquals(expected, rows.get(0));
                Map<String, Object> nulls = new LinkedHashMap<>(rows.get(1));
                assertTrue(nulls.remove("C_ROWID") instanceof String rowOfNulls && !rowOfNulls.isBlank(), "every row has a rowid");
                nulls.forEach((column, value) -> assertNull(value, column));
                assertTrue(json.contains("\"C_CLOB\":\"long text\""), "the result is written as JSON: " + json);
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

    /**
     * BF-051 on a real Oracle: a table whose key column was created quoted in lower case ({@code "id"}). The bulk update
     * quotes the key in its CASE WHEN; the where clause wrote it raw, which Oracle folds to {@code ID}, a column that does
     * not exist (ORA-00904). Both now quote it, and the two named rows change while the third keeps its value.
     */
    @Test
    public void bulkUpdateWithALowerCaseQuotedKeyChangesTheNamedRowsBF051() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_bulk_key", "create table t_bulk_key (\"id\" number primary key, \"name\" varchar2(10))",
                    "insert into t_bulk_key values (1, 'a')", "insert into t_bulk_key values (2, 'b')", "insert into t_bulk_key values (3, 'c')");
            Object updated = gui("BULK_UPDATE", Map.of("table", "t_bulk_key", "primaryKey", "id",
                    "records", "[{\"id\":1,\"name\":\"A\"},{\"id\":3,\"name\":\"C\"}]"), Map.of());
            System.out.println("[OracleDatabaseTest] bulk update with the lower-case key \"id\": " + updated);
            assertEquals(2, ((Map<?, ?>) updated).get(AFFECTED_ROWS));
            assertEquals(List.of("A", "b", "C"), column(jdbc, "select \"name\" from t_bulk_key order by \"id\"", "name"));
        }
    }

    /**
     * F01 (GitHub #1641) on a real Oracle: a bulk update with a filter changes the records' rows that match it; a record whose
     * row the filter excludes keeps its value (the filter used to be ignored, so that row was updated too).
     */
    @Test
    public void guiBulkUpdateWithAFilterLeavesTheRowTheFilterExcludesF01() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_bulk_filter", "create table t_bulk_filter (id number primary key, name varchar2(20), status varchar2(10))",
                    "insert into t_bulk_filter values (1, 'a', 'open')", "insert into t_bulk_filter values (2, 'b', 'closed')",
                    "insert into t_bulk_filter values (3, 'c', 'open')");
            Object updated = gui("BULK_UPDATE", Map.of("table", "t_bulk_filter", "primaryKey", "ID",
                    "records", "[{\"ID\":1,\"NAME\":\"A\"},{\"ID\":2,\"NAME\":\"B\"}]",
                    "filterBy", List.of(Map.of("column", "STATUS", "condition", "=", "value", "{{status}}"))), Map.of("status", "open"));
            System.out.println("[OracleDatabaseTest] F01 bulk update with filter STATUS = open: " + updated);
            assertEquals(1, ((Map<?, ?>) updated).get(AFFECTED_ROWS));
            assertEquals(List.of("A", "b", "c"), column(jdbc, "select name from t_bulk_filter order by id", "NAME"));
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
     * BF-050 fixed (plan section 9 row "bulk insert of two or more records fails with ORA-63809"): the bulk insert renders
     * one {@code insert ... values (?,?),(?,?)} and the executor asked for generated keys, which Oracle 23 refuses for such
     * a statement (ORA-63809), so nothing was written. A bulk insert of two records now runs without generated keys and
     * answers its affected rows; a single record still answers its generated key (the ROWID).
     */
    @Test
    public void bulkInsertOfTwoRecordsWritesBothAndOneRecordKeepsItsGeneratedKeyBF050() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table t_bulk", "create table t_bulk (id number, name varchar2(10))");
            Object one = gui("BULK_INSERT", Map.of("table", "t_bulk", "records", "[{\"ID\":1,\"NAME\":\"a\"}]"), Map.of());
            Object two = gui("BULK_INSERT", Map.of("table", "t_bulk", "records", "[{\"ID\":2,\"NAME\":\"b\"},{\"ID\":3,\"NAME\":\"c\"}]"), Map.of());
            System.out.println("[OracleDatabaseTest] bulk insert of one record: " + one + ", of two records: " + two);
            assertEquals(1, ((Map<?, ?>) one).get(AFFECTED_ROWS));
            assertEquals(1, ((List<?>) ((Map<?, ?>) one).get(GENERATED_KEYS)).size(), "the single-row insert keeps its generated key");
            assertEquals(Map.of(AFFECTED_ROWS, 2), two, "affected rows only: Oracle has no generated keys for a multi-row insert");
            assertEquals(List.of(new BigDecimal(1), new BigDecimal(2), new BigDecimal(3)), column(jdbc, "select id from t_bulk order by id", "ID"));
        }
    }
}

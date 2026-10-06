package org.lowcoder.plugin.postgres;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.ForeignKey;
import org.lowcoder.sdk.models.DatasourceStructure.PrimaryKey;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.sql.Connection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.CONNECTOR;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.EXECUTOR;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.PASSWORD;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.port;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.host;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.USER;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.config;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.connect;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.destroy;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.execute;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.guiConfig;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.jdbc;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.rows;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.run;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.sql;
import static org.lowcoder.plugin.postgres.PostgresContainerSupport.sqlConfig;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Units PG-4, PG-5 and PG-6 (task L5-4): {@code PostgresConnector}, {@code PostgresExecutor}, {@code PostgresResultParser}
 * and the GUI commands against a real {@code postgres:16-alpine} (the image pinned in {@code ContainerImages.POSTGRES_16}, the
 * module's {@code postgresql 42.3.8} driver). Each test uses its own tables, or its own schemas. TLS behaviour of the pinned
 * image: none is configured, so a pool with usingSsl fails with "The server does not support SSL".
 */
public class PostgresDatabaseTest {

    static final String WRONG_PASSWORD = "not-the-password";
    static final int POSTGRES_POOL_SIZE = 100;
    static final String INJECTION = "x'; drop table t_gui; --";

    private static Object cell(Object data, String column) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) data;
        return rows.get(0).get(column);
    }

    private static Map<String, Object> keyValues(Object... columnsAndValues) {
        List<Map<String, Object>> comp = new ArrayList<>();
        for (int i = 0; i < columnsAndValues.length; i += 2) {
            comp.add(Map.of("column", columnsAndValues[i], "value", columnsAndValues[i + 1]));
        }
        return Map.of("compType", "KEY_VALUE_PAIRS", "comp", comp);
    }

    private static Map<String, Object> filterOn(String column, boolean allowMultiModify) {
        return Map.of("allowMultiModify", allowMultiModify, "filterBy", List.of(Map.of("column", column, "condition", "=", "value", "{{key}}")));
    }

    // ---- PG-4: connector

    @Test
    public void poolOpensRunsAQueryAndTestConnectionSucceeds() {
        PostgresDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            HikariDataSource dataSource = (HikariDataSource) pool.getHikariDataSource();
            assertTrue(dataSource.isRunning());
            assertEquals("org.postgresql.Driver", dataSource.getDriverClassName());
            assertEquals(POSTGRES_POOL_SIZE, dataSource.getMaximumPoolSize());
            assertEquals("jdbc:postgresql://" + PostgresContainerSupport.host() + ":" + PostgresContainerSupport.port() + "/app", dataSource.getJdbcUrl());
            assertEquals(1, cell(sql(pool, config, "select 1 as one", Map.of()), "one"));
            DatasourceTestResult test = CONNECTOR.testConnection(config).block();
            assertNotNull(test);
            assertTrue(test.isSuccess());
            System.out.println("[PostgresDatabaseTest] pool " + dataSource.getJdbcUrl() + ", test connection succeeded");
        } finally {
            destroy(pool);
        }
    }

    @Test
    public void wrongPasswordIsReportedWithinTheInitTimeout() {
        long start = System.nanoTime();
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(config(WRONG_PASSWORD, false, false, false)));
        long millis = (System.nanoTime() - start) / 1_000_000;
        System.out.println("[PostgresDatabaseTest] wrong password: " + thrown.getClass().getSimpleName() + " after " + millis + " ms: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains("password authentication failed"), thrown.getMessage());
        assertTrue(millis < 10_000, "took " + millis + " ms");
    }

    @Test
    public void readonlyPoolRejectsWritesAndWritablePoolAccepts() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists t_readonly", "create table t_readonly (id int)");
            PostgresDatasourceConfig readonly = config(PASSWORD, false, true, false);
            HikariPerfWrapper readonlyPool = connect(readonly);
            try {
                PluginException thrown = assertThrows(PluginException.class, () -> sql(readonlyPool, readonly, "insert into t_readonly values (1)", Map.of()));
                assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
                System.out.println("[PostgresDatabaseTest] read-only insert refused: " + thrown.getMessage());
                assertTrue(thrown.getMessage().contains("read-only"), thrown.getMessage());
            } finally {
                destroy(readonlyPool);
            }
            assertEquals(0, rows(jdbc, "select * from t_readonly").size());
            PostgresDatasourceConfig writable = config();
            HikariPerfWrapper writablePool = connect(writable);
            try {
                sql(writablePool, writable, "insert into t_readonly values (1)", Map.of());
            } finally {
                destroy(writablePool);
            }
            assertEquals(1, rows(jdbc, "select * from t_readonly").size());
        }
    }

    @Test
    public void sslAgainstAServerWithoutTlsFailsAndSslOffWorks() {
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(config(PASSWORD, true, false, false)));
        System.out.println("[PostgresDatabaseTest] ssl against the non-TLS image: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains("does not support SSL"), thrown.getMessage());
        destroy(connect(config(PASSWORD, false, false, false)));
    }

    /**
     * BF-027 through the server: a database whose name looks like URL parameters ({@code app?ssl=true}, against this
     * non-TLS image) is reached by that exact name; the name no longer turns SSL on.
     */
    @Test
    public void aDatabaseNamedLikeUrlParametersIsReachedByItsNameBF027() throws Exception {
        String database = "app?ssl=true";
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop database if exists \"" + database + "\"", "create database \"" + database + "\"");
        }
        PostgresDatasourceConfig config = PostgresDatasourceConfig.builder().database(database).username(USER).password(PASSWORD)
                .host(host()).port((long) port()).usingSsl(false).build();
        HikariPerfWrapper pool = connect(config);
        try {
            Object answer = sql(pool, config, "select current_database() as name", Map.of());
            System.out.println("[PostgresDatabaseTest] database '" + database + "' answers " + answer);
            assertEquals(List.of(Map.of("name", database)), answer);
        } finally {
            destroy(pool);
        }
    }

    /**
     * Shows through the server the plan section 9 row "PostgresDataTypeUtils maps an explicit ?::decimal cast to FLOAT":
     * the decimals of the bound text are gone when the database answers. A fix (BigDecimal) changes this test on purpose.
     */
    @Test
    public void explicitCastsRoundTripAndDecimalLosesItsDigitsThroughTheServer() {
        PostgresDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            Object data = sql(pool, config, "select {{a}}::int4 as a, {{b}}::decimal as b, {{c}}::date as c, {{d}}::bool as d, {{e}}::text as e, {{f}}::float8 as f",
                    Map.of("a", "42", "b", "12345678.123456", "c", "2024-02-29", "d", "true", "e", "x", "f", "0.1"));
            System.out.println("[PostgresDatabaseTest] casts through the server: " + data);
            assertEquals(42, cell(data, "a"));
            assertEquals("2024-02-29", cell(data, "c"));
            assertEquals(true, cell(data, "d"));
            assertEquals("x", cell(data, "e"));
            assertEquals(0.1d, ((Number) cell(data, "f")).doubleValue());
            assertEquals("12345678", String.valueOf(cell(data, "b")), "the digits after the point of ?::decimal are lost");
        } finally {
            destroy(pool);
        }
    }

    @Test
    public void realDriverReturnsWhatTheResultContractCellsAssume() {
        PostgresDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            Object data = sql(pool, config, """
                    select '{"zeta": 1, "alpha": [1.50, 3000000001, null]}'::jsonb as jb, '{"a":1}'::json as js, null::json as jn,
                      array[1,null,3] as ai, array['a','žluť'] as at, array[1.50::numeric] as an, '192.168.0.1'::inet as ip,
                      timestamptz '2024-02-29 13:14:15.123+05:30' as tz, timestamp '2024-02-29 13:14:15.123' as ts, date '2024-02-29' as d,
                      time '13:14:15' as t, timetz '13:14:15+02' as ttz, interval '1 year 2 mons 3 days 04:05:06.5' as iv,
                      '123e4567-e89b-12d3-a456-426614174000'::uuid as u, 10.50::numeric as n, 9223372036854775807::int8 as i8, 0.1::float8 as f8,
                      true as b, '\\x0001ff'::bytea as by""", Map.of());
            assertEquals("{\"zeta\":1,\"alpha\":[1.5,3000000001,null]}", String.valueOf(cell(data, "jb")));
            assertEquals("{\"a\":1}", String.valueOf(cell(data, "js")));
            assertEquals(null, cell(data, "jn"));
            assertEquals(Arrays.asList(1, null, 3), Arrays.asList((Object[]) cell(data, "ai")));
            assertEquals(List.of("a", "žluť"), Arrays.asList((Object[]) cell(data, "at")));
            assertEquals(1, ((Object[]) cell(data, "an")).length);
            assertEquals("192.168.0.1", cell(data, "ip"), "a type JDBC does not know reaches the result as the text of its PGobject");
            assertEquals("2024-02-29T07:44:15.123Z", cell(data, "tz"));
            assertEquals("2024-02-29 13:14:15", cell(data, "ts"));
            assertEquals("2024-02-29", cell(data, "d"));
            assertEquals("13:14:15", cell(data, "t"));
            assertEquals("13:14:15+02", cell(data, "ttz"));
            assertEquals("1 years 2 mons 3 days 4 hours 5 mins 6.5 secs", cell(data, "iv"));
            assertEquals(java.util.UUID.fromString("123e4567-e89b-12d3-a456-426614174000"), cell(data, "u"));
            assertEquals(new java.math.BigDecimal("10.50"), cell(data, "n"));
            assertEquals(Long.MAX_VALUE, cell(data, "i8"));
            assertEquals(0.1d, cell(data, "f8"));
            assertEquals(true, cell(data, "b"));
            assertTrue(Arrays.equals(new byte[] {0, 1, (byte) 0xFF}, (byte[]) cell(data, "by")));
        } finally {
            destroy(pool);
        }
    }

    // ---- PG-5: structure

    private static Table table(DatasourceStructure structure, String fullName) {
        return structure.getTables().stream().filter(t -> t.getName().equals(fullName)).findFirst().orElseThrow();
    }

    @Test
    public void structureOfTablesViewsSerialAndKeys() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop schema if exists struct_a cascade", "drop schema if exists struct_b cascade", "create schema struct_a", "create schema struct_b",
                    "create table struct_b.remote (id int primary key)",
                    "create table struct_a.parent (id serial primary key, id2 int, note text default 'n', unique (id, id2))",
                    "create view struct_a.v_parent as select id from struct_a.parent",
                    "create table struct_a.pk2 (a int, b int, c int, primary key (a, b))",
                    "create table struct_a.child (cid int not null, pid int, pid2 int, oid int, "
                            + "constraint fk_same foreign key (pid, pid2) references struct_a.parent (id, id2), "
                            + "constraint fk_other foreign key (oid) references struct_b.remote (id))",
                    // the primary key is added last and named to sort after the foreign keys, so the query is likely to return it last
                    "alter table struct_a.child add constraint zz_pk primary key (cid)");
        }
        PostgresDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            DatasourceStructure structure = EXECUTOR.getStructure(pool, config).block();
            List<String> names = structure.getTables().stream().map(Table::getName).toList();
            System.out.println("[PostgresDatabaseTest] tables: " + names);
            assertTrue(names.containsAll(List.of("struct_a.parent", "struct_a.v_parent", "struct_a.pk2", "struct_a.child", "struct_b.remote")), names.toString());
            assertTrue(names.stream().noneMatch(n -> n.startsWith("pg_catalog.") || n.startsWith("information_schema.")), "system schemas are not listed");

            Table parent = table(structure, "struct_a.parent");
            assertEquals(TableType.TABLE, parent.getType());
            assertEquals("struct_a", parent.getSchema());
            assertEquals(List.of("id", "id2", "note"), parent.getColumns().stream().map(Column::getName).toList());
            assertEquals(List.of(true, false, false), parent.getColumns().stream().map(Column::getIsAutogenerated).toList(), "only the serial column is generated");
            assertEquals(TableType.VIEW, table(structure, "struct_a.v_parent").getType());

            PrimaryKey composite = assertInstanceOf(PrimaryKey.class, table(structure, "struct_a.pk2").getKeys().get(0));
            assertEquals(List.of("a", "b"), composite.getColumnNames());

            List<DatasourceStructure.Key> keys = table(structure, "struct_a.child").getKeys();
            assertEquals(3, keys.size());
            assertInstanceOf(PrimaryKey.class, keys.get(0), "keys are sorted, the primary key before the foreign keys");
            ForeignKey same = keys.stream().filter(ForeignKey.class::isInstance).map(ForeignKey.class::cast).filter(k -> k.getName().equals("fk_same")).findFirst().orElseThrow();
            ForeignKey other = keys.stream().filter(ForeignKey.class::isInstance).map(ForeignKey.class::cast).filter(k -> k.getName().equals("fk_other")).findFirst().orElseThrow();
            assertEquals(List.of("pid", "pid2"), same.getFromColumns());
            assertEquals(List.of("parent.id", "parent.id2"), same.getToColumns(), "same schema: no schema prefix");
            assertEquals(List.of("struct_b.remote.id"), other.getToColumns(), "other schema: prefixed");
            assertEquals(1, parent.getKeys().size(), "the unique constraint is not a key of the structure");
        } finally {
            destroy(pool);
        }
    }

    // ---- PG-6: GUI commands, guard, sort

    private Object gui(String type, Map<String, Object> command, Map<String, Object> params) {
        PostgresDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            return run(pool, config, guiConfig(type, command), params);
        } finally {
            destroy(pool);
        }
    }

    @Test
    public void guiCommandsChangeTheRealTableAndAnInjectionValueIsStoredAsText() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists t_gui", "drop table if exists \"Odd \"\"name\"", "create table t_gui (id int primary key, name text)",
                    "create table \"Odd \"\"name\" (id int primary key, name text)");
            Object inserted = gui("insert", Map.of("table", "t_gui", "changeSet", keyValues("id", "{{id}}", "name", "{{name}}")), Map.of("id", 1, "name", INJECTION));
            System.out.println("[PostgresDatabaseTest] insert: " + inserted);
            assertEquals(1, ((Map<?, ?>) inserted).get("affectedRows"));
            assertEquals(List.of(Map.of("id", 1, "name", INJECTION)), rows(jdbc, "select id, name from t_gui"), "the value is stored as text, the table and schema are intact");

            gui("UPDATE", Map.of("table", "t_gui", "changeSet", keyValues("name", "{{name}}"), "allowMultiModify", true,
                    "filterBy", List.of(Map.of("column", "id", "condition", "=", "value", "{{id}}"))), Map.of("id", 1, "name", "o'brien"));
            assertEquals("o'brien", rows(jdbc, "select name from t_gui where id = 1").get(0).get("name"));

            gui("BULK_INSERT", Map.of("table", "t_gui", "records", "[{\"id\":2,\"name\":\"b\"},{\"id\":3,\"name\":\"c\"}]"), Map.of());
            assertEquals(List.of("o'brien", "b", "c"), rows(jdbc, "select name from t_gui order by id").stream().map(r -> r.get("name")).toList());
            gui("BULK_UPDATE", Map.of("table", "t_gui", "primaryKey", "id", "records", "[{\"id\":2,\"name\":\"B\"},{\"id\":3,\"name\":\"C\"}]"), Map.of());
            assertEquals(List.of("o'brien", "B", "C"), rows(jdbc, "select name from t_gui order by id").stream().map(r -> r.get("name")).toList());

            Map<String, Object> deleteDetail = new HashMap<>(filterOn("id", false));
            deleteDetail.put("table", "t_gui");
            gui("DELETE", deleteDetail, Map.of("key", 3));
            assertEquals(List.of(1, 2), rows(jdbc, "select id from t_gui order by id").stream().map(r -> r.get("id")).toList());

            gui("INSERT", Map.of("table", "\"Odd \"\"name\"", "changeSet", keyValues("id", "{{id}}", "name", "{{name}}")), Map.of("id", 7, "name", "quoted"));
            assertEquals("quoted", rows(jdbc, "select name from \"Odd \"\"name\"").get(0).get("name"));
        }
    }

    /**
     * BF-007 and BF-008 end to end for the raw-SQL dialect: every element of a GUI {@code IN} filter is dollar-quoted, so
     * an element written to break out of a quoted string ({@code x' or '1'='1}) is compared as text and deletes nothing
     * else; a column name with a {@code "} stays one identifier, and a table name that is not an identifier is refused.
     */
    @Test
    public void guiDeleteWithAnInListEscapesEveryElementAndRefusesATableThatIsNotAnIdentifier() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists t_gui_in", "create table t_gui_in (id int primary key, name text, \"odd\"\"col\" int)",
                    "insert into t_gui_in values (1, 'ann', 10), (2, 'bob', 20), (3, 'x'' or ''1''=''1', 30)");
            Map<String, Object> inFilter = Map.of("column", "name", "condition", "IN", "value", "{{names}}");

            Object none = gui("DELETE", Map.of("table", "t_gui_in", "filterBy", List.of(inFilter), "allowMultiModify", true),
                    Map.of("names", List.of("nobody' or '1'='1")));
            System.out.println("[PostgresDatabaseTest] IN delete with an injection element: " + none);
            assertEquals(0, ((Map<?, ?>) none).get("affectedRows"), "the element is a value, not SQL");
            assertEquals(3, rows(jdbc, "select id from t_gui_in").size());

            Object two = gui("DELETE", Map.of("table", "t_gui_in", "filterBy", List.of(inFilter), "allowMultiModify", true),
                    Map.of("names", List.of("ann", "x' or '1'='1")));
            System.out.println("[PostgresDatabaseTest] IN delete of ann and the literal text: " + two);
            assertEquals(2, ((Map<?, ?>) two).get("affectedRows"));
            assertEquals(List.of(2), rows(jdbc, "select id from t_gui_in").stream().map(r -> r.get("id")).toList());

            Object byOddColumn = gui("DELETE", Map.of("table", "t_gui_in", "allowMultiModify", true,
                    "filterBy", List.of(Map.of("column", "odd\"col", "condition", "=", "value", "{{v}}"))), Map.of("v", 20));
            System.out.println("[PostgresDatabaseTest] delete by the column odd\"col: " + byOddColumn);
            assertEquals(1, ((Map<?, ?>) byOddColumn).get("affectedRows"));

            execute(jdbc, "insert into t_gui_in values (4, 'dan', 40)");
            PluginException refused = assertThrows(PluginException.class, () -> gui("DELETE", Map.of("table", "t_gui_in; delete from t_gui_in",
                    "filterBy", List.of(inFilter), "allowMultiModify", true), Map.of("names", List.of("nobody"))));
            System.out.println("[PostgresDatabaseTest] table that is not an identifier: " + refused.getMessageKey());
            assertEquals("GUI_INVALID_TABLE_NAME", refused.getMessageKey());
            assertEquals(1, rows(jdbc, "select id from t_gui_in").size(), "nothing ran");
        }
    }

    @Test
    public void singleRowGuardOnARealServer() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists t_guard", "create table t_guard (id int, grp int, marker text)",
                    "insert into t_guard values (1, 1, 'orig'), (2, 1, 'orig'), (3, 2, 'orig')");
            Map<String, Object> update = new HashMap<>(filterOn("grp", false));
            update.put("table", "t_guard");
            update.put("changeSet", keyValues("marker", "changed"));
            PluginException thrown = assertThrows(PluginException.class, () -> gui("UPDATE", update, Map.of("key", 1)));
            assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
            assertEquals("AFFECT_MORE_THAN_ONE_ROWS_FOR_SINGLE_COMMAND", thrown.getMessageKey());
            assertEquals(3, rows(jdbc, "select * from t_guard where marker = 'orig'").size(), "nothing changes when the guard refuses");
            assertEquals(1, ((Map<?, ?>) gui("UPDATE", update, Map.of("key", 2))).get("affectedRows"));
            assertEquals(1, rows(jdbc, "select * from t_guard where marker = 'changed'").size());
            Map<String, Object> delete = new HashMap<>(filterOn("grp", false));
            delete.put("table", "t_guard");
            assertThrows(PluginException.class, () -> gui("DELETE", delete, Map.of("key", 1)));
            assertEquals(3, rows(jdbc, "select * from t_guard").size());
            assertEquals(1, ((Map<?, ?>) gui("DELETE", delete, Map.of("key", 2))).get("affectedRows"));
            assertEquals(2, rows(jdbc, "select * from t_guard").size());
        }
    }

    @Test
    public void sortPlaceholderOrdersRowsAndAnInjectedValueFallsBackToAsc() throws Exception {
        PostgresDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists t_sort", "create table t_sort (id int)", "insert into t_sort values (1), (2), (3)");
            String query = "select id from t_sort order by id {{dir}}";
            assertEquals(List.of(3, 2, 1), ids(sql(pool, config, query, Map.of("dir", Map.of("sort", "desc")))));
            assertEquals(List.of(1, 2, 3), ids(sql(pool, config, query, Map.of("dir", Map.of("sort", "x; drop table t_sort")))));
            assertEquals(3, rows(jdbc, "select * from t_sort").size(), "the table survives the injected sort value");
        } finally {
            destroy(pool);
        }
    }

    private static List<Object> ids(Object data) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) data;
        return rows.stream().map(r -> r.get("id")).toList();
    }
}

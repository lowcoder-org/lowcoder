package org.lowcoder.plugin.mysql;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.ForeignKey;
import org.lowcoder.sdk.models.DatasourceStructure.PrimaryKey;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.app;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.config;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.connect;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.destroy;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.execute;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.guiConfig;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.rows;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.run;
import static org.lowcoder.plugin.mysql.MysqlContainerSupport.sqlConfig;

/**
 * Unit MY-1 (task L5-2): {@code MysqlConnector}, {@code MysqlQueryExecutor} and {@code MysqlStructureParser} against a real
 * {@code mysql:8.0} (the image pinned in {@code ContainerImages.MYSQL_8_0}). Each test uses its own tables, or its own
 * schema for the structure tests, so tests do not depend on order.
 *
 * <p>Error paths assert the MissingResourceException (key INTERNAL_SERVER_ERROR) that stands in for the PluginException and
 * the effect on the data: the module's own empty {@code locale.properties} shadows the SDK's message bundle (plan section 9
 * row "mysqlPlugin's empty locale.properties and locale_en.properties", D-6: fix deferred; the contract fixture
 * {@code MysqlQueryConfig.json} shows the same).
 * TLS behaviour of the pinned image ({@code mysql:8.0}): the server offers TLS with a generated certificate, so a pool with
 * usingSsl (useSSL and requireSSL true, no certificate verification) negotiates TLS 1.3.
 */
public class MysqlDatabaseTest {

    static final String WRONG_PASSWORD = "not-the-password";
    static final String TRUE = "true";
    static final int MYSQL_POOL_SIZE = 50;

    private static Object value(Object data, int row, String column) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) data;
        return rows.get(row).get(column);
    }

    private static Map<String, Object> keyValueChangeSet(Object... columnsAndValues) {
        List<Map<String, Object>> comp = new java.util.ArrayList<>();
        for (int i = 0; i < columnsAndValues.length; i += 2) {
            comp.add(Map.of("column", columnsAndValues[i], "value", columnsAndValues[i + 1]));
        }
        return Map.of("compType", "KEY_VALUE_PAIRS", "comp", comp);
    }

    private static Map<String, Object> filterOnId() {
        return Map.of("column", "id", "condition", "=", "value", "{{id}}");
    }

    // ---- (a) connector

    @Test
    public void poolOpensAndReturnsRealColumnTypes() throws Exception {
        MysqlDatasourceConfig config = config();
        HikariPerfWrapper wrapper = connect(config);
        try (Connection app = app()) {
            execute(app, "drop table if exists t_pool", "create table t_pool (id int primary key, name varchar(20), price decimal(10,2), created datetime)",
                    "insert into t_pool values (1, 'ann', 10.50, '2024-02-29 13:14:15')");
            HikariDataSource dataSource = (HikariDataSource) wrapper.getHikariDataSource();
            assertTrue(dataSource.isRunning());
            assertEquals(MYSQL_POOL_SIZE, dataSource.getMaximumPoolSize());
            Object data = run(wrapper, config, sqlConfig("select id, name, price, created from t_pool", false), Map.of());
            System.out.println("[MysqlDatabaseTest] rows from MySQL: " + data);
            assertEquals(1, value(data, 0, "id"));
            assertEquals("ann", value(data, 0, "name"));
            assertEquals(new java.math.BigDecimal("10.50"), value(data, 0, "price"));
            assertEquals("2024-02-29 13:14:15", String.valueOf(value(data, 0, "created")).replace('T', ' '));
        } finally {
            destroy(wrapper);
        }
    }

    @Test
    public void wrongPasswordFailsTheConnectionCreation() {
        long start = System.nanoTime();
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(config(MysqlContainerSupport.DATABASE, WRONG_PASSWORD, false, false, false)));
        System.out.println("[MysqlDatabaseTest] wrong password: " + thrown.getClass().getSimpleName() + " after "
                + (System.nanoTime() - start) / 1_000_000 + " ms: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains("Public Key Retrieval is not allowed"), "without SSL a wrong password ends in the RSA step: " + thrown.getMessage());
        RuntimeException withSsl = assertThrows(RuntimeException.class, () -> connect(config(MysqlContainerSupport.DATABASE, WRONG_PASSWORD, true, false, false)));
        System.out.println("[MysqlDatabaseTest] wrong password over SSL: " + withSsl.getMessage());
        assertTrue(withSsl.getMessage().contains("Access denied"), withSsl.getMessage());
    }

    @Test
    public void readonlyPoolRejectsWritesAndWritablePoolAccepts() throws Exception {
        try (Connection app = app()) {
            execute(app, "drop table if exists t_readonly", "create table t_readonly (id int primary key)");
            MysqlDatasourceConfig readonly = config(MysqlContainerSupport.DATABASE, MysqlContainerSupport.PASSWORD, false, true, false);
            HikariPerfWrapper readonlyPool = connect(readonly);
            try {
                RuntimeException thrown = EmptyLocaleBundle.assertThrown(
                        () -> run(readonlyPool, readonly, sqlConfig("insert into t_readonly values (1)", false), Map.of()));
                System.out.println("[MysqlDatabaseTest] read-only insert refused: " + thrown);
            } finally {
                destroy(readonlyPool);
            }
            assertEquals(0, rows(app, "select * from t_readonly").size());
            MysqlDatasourceConfig writable = config();
            HikariPerfWrapper writablePool = connect(writable);
            try {
                run(writablePool, writable, sqlConfig("insert into t_readonly values (1)", false), Map.of());
            } finally {
                destroy(writablePool);
            }
            assertEquals(1, rows(app, "select * from t_readonly").size());
        }
    }

    @Test
    public void sslFlagReachesTheDriver() {
        MysqlDatasourceConfig off = config(MysqlContainerSupport.DATABASE, MysqlContainerSupport.PASSWORD, false, false, false);
        MysqlDatasourceConfig on = config(MysqlContainerSupport.DATABASE, MysqlContainerSupport.PASSWORD, true, false, false);
        String cipherOff = cipher(off);
        String cipherOn = cipher(on);
        System.out.println("[MysqlDatabaseTest] Ssl_cipher with ssl off: [" + cipherOff + "], with ssl on: [" + cipherOn + "]");
        assertEquals("", cipherOff);
        assertTrue(!cipherOn.isEmpty(), "with usingSsl the session must be encrypted");
    }

    /**
     * The pool without SSL cannot make the first login of a user the server has not cached ({@code caching_sha2_password}
     * needs TLS or the RSA key, and the connector does not set {@code allowPublicKeyRetrieval}). Pins the plan section 9 row
     * "the MySQL connector does not set allowPublicKeyRetrieval" (D-6: fix deferred); a fix changes this test, and the
     * wrong-password test above, on purpose.
     */
    @Test
    public void sslOffFirstLoginOfAUserTheServerHasNotCachedFails() throws Exception {
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "drop user if exists 'fresh'@'%'", "create user 'fresh'@'%' identified by 'freshpw'", "grant all on app.* to 'fresh'@'%'");
        }
        RuntimeException thrown = assertThrows(RuntimeException.class,
                () -> connect(config(MysqlContainerSupport.DATABASE, "fresh", "freshpw", false, false, false)));
        System.out.println("[MysqlDatabaseTest] first login without SSL: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains("Public Key Retrieval is not allowed"), thrown.getMessage());
        HikariPerfWrapper overSsl = connect(config(MysqlContainerSupport.DATABASE, "fresh", "freshpw", true, false, false));
        destroy(overSsl);
        HikariPerfWrapper afterwards = connect(config(MysqlContainerSupport.DATABASE, "fresh", "freshpw", false, false, false));
        destroy(afterwards);
    }

    private String cipher(MysqlDatasourceConfig config) {
        HikariPerfWrapper wrapper = connect(config);
        try {
            return String.valueOf(value(run(wrapper, config, sqlConfig("show session status like 'Ssl_cipher'", false), Map.of()), 0, "Value"));
        } finally {
            destroy(wrapper);
        }
    }

    @Test
    public void allowMultiQueriesReturnsEachResultAndRunsStackedStatements() throws Exception {
        MysqlDatasourceConfig config = config(MysqlContainerSupport.DATABASE, MysqlContainerSupport.PASSWORD, false, false, true);
        HikariPerfWrapper wrapper = connect(config);
        try (Connection app = app()) {
            execute(app, "drop table if exists t_multi", "create table t_multi (id int primary key)");
            Object two = run(wrapper, config, sqlConfig("select 1 as a; select 2 as b", true), Map.of());
            System.out.println("[MysqlDatabaseTest] two result sets: " + two);
            assertEquals(2, ((List<?>) two).size());
            assertEquals(1L, value(((List<?>) two).get(0), 0, "a"));
            assertEquals(2L, value(((List<?>) two).get(1), 0, "b"));
            Object stacked = run(wrapper, config, sqlConfig("insert into t_multi values (1); insert into t_multi values (2)", true), Map.of());
            System.out.println("[MysqlDatabaseTest] stacked inserts: " + stacked);
            assertEquals(2, ((List<?>) stacked).size());
            assertEquals(2, rows(app, "select * from t_multi").size());
        } finally {
            destroy(wrapper);
        }
    }

    @Test
    public void zeroDateIsReturnedAsNullNotAnException() throws Exception {
        MysqlDatasourceConfig config = config();
        HikariPerfWrapper wrapper = connect(config);
        try (Connection app = app()) {
            execute(app, "drop table if exists t_zero", "create table t_zero (id int primary key, created datetime)",
                    "set session sql_mode=''", "insert into t_zero values (1, '0000-00-00 00:00:00')");
            Object data = run(wrapper, config, sqlConfig("select id, created from t_zero", false), Map.of());
            System.out.println("[MysqlDatabaseTest] zero date row: " + data);
            assertEquals(1, value(data, 0, "id"));
            assertNull(value(data, 0, "created"));
        } finally {
            destroy(wrapper);
        }
    }

    // ---- (b) structure: each test in its own schema

    private DatasourceStructure structureOf(String schema) {
        MysqlDatasourceConfig config = config(schema, MysqlContainerSupport.PASSWORD, false, false, false);
        HikariPerfWrapper wrapper = connect(config);
        try {
            return MysqlContainerSupport.EXECUTOR.getStructure(wrapper, config).block();
        } finally {
            destroy(wrapper);
        }
    }

    private static Table table(DatasourceStructure structure, String name) {
        return structure.getTables().stream().filter(t -> t.getName().equals(name)).findFirst().orElseThrow();
    }

    @Test
    public void structureListsTablesColumnsAndAutogeneratedFlags() throws Exception {
        String schema = "struct_columns";
        MysqlContainerSupport.newSchema(schema);
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "use " + schema,
                    "create table b_table (id int auto_increment primary key, code varchar(10) not null, created timestamp default current_timestamp not null, "
                            + "uid varchar(36) default (uuid()), note varchar(10))",
                    "create table a_table (x bigint)", "create view a_view as select id from b_table");
        }
        DatasourceStructure structure = structureOf(schema);
        System.out.println("[MysqlDatabaseTest] structure: " + structure);
        assertEquals(List.of("a_table", "b_table"), structure.getTables().stream().map(Table::getName).toList(), "tables sorted, the view is not listed");
        assertEquals(List.of("id", "code", "created", "uid", "note"), table(structure, "b_table").getColumns().stream().map(Column::getName).toList());
        assertEquals(List.of("int", "varchar", "timestamp", "varchar", "varchar"), table(structure, "b_table").getColumns().stream().map(Column::getType).toList());
        assertEquals(List.of(true, false, true, true, false), table(structure, "b_table").getColumns().stream().map(Column::getIsAutogenerated).toList(),
                "auto_increment, timestamp default current_timestamp and default (uuid()) are generated");
    }

    @Test
    public void singleAndCompositePrimaryKeys() throws Exception {
        String schema = "struct_pk";
        MysqlContainerSupport.newSchema(schema);
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "use " + schema, "create table single_pk (id int primary key, v int)",
                    "create table composite_pk (a int, b int, c int, primary key (a, b))");
        }
        DatasourceStructure structure = structureOf(schema);
        PrimaryKey single = assertInstanceOf(PrimaryKey.class, table(structure, "single_pk").getKeys().get(0));
        PrimaryKey composite = assertInstanceOf(PrimaryKey.class, table(structure, "composite_pk").getKeys().get(0));
        System.out.println("[MysqlDatabaseTest] keys: " + single + " ; " + composite);
        assertEquals(List.of("id"), single.getColumnNames());
        assertEquals("PRIMARY", composite.getName());
        assertEquals(List.of("a", "b"), composite.getColumnNames().stream().sorted().toList(),
                "the columns, not their order: KEYS_QUERY orders by position_in_unique_constraint, which is NULL for a primary key, so the server may return them in either order (seen: this test failed once in the scratch runs)");
        assertEquals(1, table(structure, "composite_pk").getKeys().size(), "one key, not one per column");
    }

    @Test
    public void foreignKeysInTheSameAndInAnotherSchema() throws Exception {
        String schema = "struct_fk";
        String other = "struct_fk_other";
        MysqlContainerSupport.newSchema(other);
        MysqlContainerSupport.newSchema(schema);
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "create table " + other + ".remote (id int primary key)",
                    "use " + schema,
                    "create table parent (id int, id2 int, unique key u (id, id2))",
                    "create table child (pid int, pid2 int, oid int, "
                            + "constraint fk_same foreign key (pid, pid2) references parent (id, id2), "
                            + "constraint fk_other foreign key (oid) references " + other + ".remote (id))");
        }
        DatasourceStructure structure = structureOf(schema);
        List<DatasourceStructure.Key> keys = table(structure, "child").getKeys();
        System.out.println("[MysqlDatabaseTest] child keys: " + keys);
        assertEquals(2, keys.size());
        ForeignKey same = keys.stream().filter(ForeignKey.class::isInstance).map(ForeignKey.class::cast).filter(k -> k.getName().equals("fk_same")).findFirst().orElseThrow();
        ForeignKey remote = keys.stream().filter(ForeignKey.class::isInstance).map(ForeignKey.class::cast).filter(k -> k.getName().equals("fk_other")).findFirst().orElseThrow();
        assertEquals(List.of("pid", "pid2"), same.getFromColumns());
        assertEquals(List.of("parent.id", "parent.id2"), same.getToColumns(), "same schema: no schema prefix");
        assertEquals(List.of("oid"), remote.getFromColumns());
        assertEquals(List.of(other + ".remote.id"), remote.getToColumns(), "other schema: prefixed");
        assertTrue(table(structure, "parent").getKeys().stream().noneMatch(ForeignKey.class::isInstance));
    }

    @Test
    public void keysAreSortedPrimaryBeforeForeign() throws Exception {
        String schema = "struct_sort";
        MysqlContainerSupport.newSchema(schema);
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "use " + schema, "create table target (id int primary key)",
                    "create table both_keys (id int primary key, tid int, constraint a_fk foreign key (tid) references target (id))");
        }
        List<DatasourceStructure.Key> keys = table(structureOf(schema), "both_keys").getKeys();
        System.out.println("[MysqlDatabaseTest] keys of both_keys: " + keys);
        assertEquals(2, keys.size());
        assertInstanceOf(PrimaryKey.class, keys.get(0), "the query returns the foreign key first (a_fk < PRIMARY); the executor sorts it behind");
        assertInstanceOf(ForeignKey.class, keys.get(1));
    }

    // ---- (c) GUI commands end to end

    private Object gui(String type, Map<String, Object> command, Map<String, Object> params) {
        MysqlDatasourceConfig config = config();
        HikariPerfWrapper wrapper = connect(config);
        try {
            return run(wrapper, config, guiConfig(type, command), params);
        } finally {
            destroy(wrapper);
        }
    }

    @Test
    public void guiInsertThenUpdateThenDeleteChangeTheRealTable() throws Exception {
        try (Connection app = app()) {
            execute(app, "drop table if exists t_gui", "create table t_gui (id int primary key, name varchar(20))");
            Object inserted = gui("insert", Map.of("table", "t_gui", "changeSet", keyValueChangeSet("id", "{{id}}", "name", "{{name}}")),
                    Map.of("id", 1, "name", "ann"));
            System.out.println("[MysqlDatabaseTest] insert: " + inserted);
            assertEquals(1, ((Map<?, ?>) inserted).get("affectedRows"));
            assertEquals("ann", rows(app, "select name from t_gui where id = 1").get(0).get("name"));

            Object updated = gui("UPDATE", Map.of("table", "t_gui", "changeSet", keyValueChangeSet("name", "{{name}}"),
                    "filterBy", List.of(filterOnId()), "allowMultiModify", false), Map.of("id", 1, "name", "bob"));
            assertEquals(1, ((Map<?, ?>) updated).get("affectedRows"));
            assertEquals("bob", rows(app, "select name from t_gui where id = 1").get(0).get("name"));

            execute(app, "insert into t_gui values (2, 'cy')");
            Object deleted = gui("DELETE", Map.of("table", "t_gui", "filterBy", List.of(filterOnId()), "allowMultiModify", false), Map.of("id", 1));
            assertEquals(1, ((Map<?, ?>) deleted).get("affectedRows"));
            assertEquals(List.of(2), rows(app, "select id from t_gui").stream().map(r -> r.get("id")).toList());
        }
    }

    /**
     * BF-007 and BF-008 end to end: the elements of a GUI {@code IN} filter are bind parameters, so an element written to
     * break out of a quoted string ({@code x' or '1'='1}) matches only a row holding exactly that text and deletes nothing
     * else; a column name with a backtick is one identifier.
     */
    @Test
    public void guiDeleteWithAnInListBindsEveryElementAndAQuotedColumnNameStaysOneIdentifier() throws Exception {
        try (Connection app = app()) {
            execute(app, "drop table if exists t_gui_in", "create table t_gui_in (id int primary key, name varchar(30), `odd``col` int)",
                    "insert into t_gui_in values (1, 'ann', 10), (2, 'bob', 20), (3, 'x'' or ''1''=''1', 30)");
            Map<String, Object> inFilter = Map.of("column", "name", "condition", "IN", "value", "{{names}}");

            Object none = gui("DELETE", Map.of("table", "t_gui_in", "filterBy", List.of(inFilter), "allowMultiModify", true),
                    Map.of("names", List.of("nobody' or '1'='1")));
            System.out.println("[MysqlDatabaseTest] IN delete with an injection element: " + none);
            assertEquals(0, ((Map<?, ?>) none).get("affectedRows"), "the element is a value, not SQL");
            assertEquals(3, rows(app, "select id from t_gui_in").size());

            Object two = gui("DELETE", Map.of("table", "t_gui_in", "filterBy", List.of(inFilter), "allowMultiModify", true),
                    Map.of("names", List.of("ann", "x' or '1'='1")));
            System.out.println("[MysqlDatabaseTest] IN delete of ann and the literal text: " + two);
            assertEquals(2, ((Map<?, ?>) two).get("affectedRows"));
            assertEquals(List.of(2), rows(app, "select id from t_gui_in").stream().map(r -> r.get("id")).toList());

            Object byOddColumn = gui("DELETE", Map.of("table", "t_gui_in", "allowMultiModify", true,
                    "filterBy", List.of(Map.of("column", "odd`col", "condition", "=", "value", "{{v}}"))), Map.of("v", 20));
            System.out.println("[MysqlDatabaseTest] delete by the column odd`col: " + byOddColumn);
            assertEquals(1, ((Map<?, ?>) byOddColumn).get("affectedRows"));
            assertEquals(0, rows(app, "select id from t_gui_in").size());
        }
    }

    /**
     * BF-008: the table names {@code getStructure} returns (the names the client's table dropdown offers) and the GUI
     * table check. A plain name is accepted as returned. A name with a space is refused unquoted: written into the SQL as
     * returned, it never addressed that table (the statement the commands built before the check reads {@code spaced}
     * as the table and {@code items} as its alias, and fails here because there is no table {@code spaced}), and it works when
     * quoted with backticks. A name that is not an identifier is refused before any statement runs. The refusals are
     * asserted through {@link EmptyLocaleBundle} (the module's empty locale bundle turns the PluginException with key
     * GUI_INVALID_TABLE_NAME into a MissingResourceException, BF-127); the key itself is asserted in the sdk's
     * SqlGuiUtilsTest and PostgresDatabaseTest.
     */
    @Test
    public void guiTableCheckAcceptsStructureNamesThatAreIdentifiersAndRefusesTheRestBeforeRunning() throws Exception {
        String schema = "struct_gui_tables";
        MysqlContainerSupport.newSchema(schema);
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "use " + schema, "create table plain_items (id int primary key)", "create table `spaced items` (id int primary key)",
                    "insert into plain_items values (1), (2)", "insert into `spaced items` values (1), (2)");
        }
        List<String> names = structureOf(schema).getTables().stream().map(Table::getName).sorted().toList();
        System.out.println("[MysqlDatabaseTest] table names from getStructure: " + names);
        assertEquals(List.of("plain_items", "spaced items"), names);

        MysqlDatasourceConfig config = config(schema, MysqlContainerSupport.PASSWORD, false, false, false);
        HikariPerfWrapper wrapper = connect(config);
        try (Connection root = MysqlContainerSupport.root()) {
            execute(root, "use " + schema);
            Map<String, Object> idFilter = Map.of("column", "id", "condition", "=", "value", "{{id}}");
            Object plain = run(wrapper, config, guiConfig("DELETE", Map.of("table", "plain_items", "filterBy", List.of(idFilter),
                    "allowMultiModify", true)), Map.of("id", 1));
            System.out.println("[MysqlDatabaseTest] delete from the structure name plain_items: " + plain);
            assertEquals(1, ((Map<?, ?>) plain).get("affectedRows"));

            RuntimeException unquoted = EmptyLocaleBundle.assertThrown(() -> run(wrapper, config, guiConfig("DELETE",
                    Map.of("table", "spaced items", "filterBy", List.of(idFilter), "allowMultiModify", true)), Map.of("id", 1)));
            IllegalStateException before = assertThrows(IllegalStateException.class,
                    () -> execute(root, "delete from spaced items where `id` = 1"));
            System.out.println("[MysqlDatabaseTest] unquoted 'spaced items' refused: " + unquoted
                    + "; the statement built before the check fails on the server too: " + before.getCause());
            assertInstanceOf(java.sql.SQLSyntaxErrorException.class, before.getCause());

            Object quoted = run(wrapper, config, guiConfig("DELETE", Map.of("table", "`spaced items`", "filterBy", List.of(idFilter),
                    "allowMultiModify", true)), Map.of("id", 1));
            assertEquals(1, ((Map<?, ?>) quoted).get("affectedRows"));

            RuntimeException injected = EmptyLocaleBundle.assertThrown(() -> run(wrapper, config, guiConfig("DELETE",
                    Map.of("table", "plain_items; delete from plain_items", "filterBy", List.of(idFilter), "allowMultiModify", true)),
                    Map.of("id", 99)));
            System.out.println("[MysqlDatabaseTest] table that is not an identifier refused: " + injected);
            assertEquals(1, rows(root, "select id from plain_items").size(), "nothing ran");
            assertEquals(1, rows(root, "select id from `spaced items`").size());
        } finally {
            destroy(wrapper);
        }
    }

    @Test
    public void guiUpsertInsertsThenUpdatesTheSameKey() throws Exception {
        try (Connection app = app()) {
            execute(app, "drop table if exists t_upsert", "create table t_upsert (id int primary key, name varchar(20))");
            Map<String, Object> command = Map.of("table", "t_upsert",
                    "insertChangeSet", keyValueChangeSet("id", "{{id}}", "name", "{{name}}"),
                    "updateChangeSet", keyValueChangeSet("name", "{{name}}"));
            gui("UPSERT", command, Map.of("id", 1, "name", "first"));
            gui("UPSERT", command, Map.of("id", 1, "name", "second"));
            List<Map<String, Object>> rows = rows(app, "select id, name from t_upsert");
            System.out.println("[MysqlDatabaseTest] after two upserts: " + rows);
            assertEquals(1, rows.size());
            assertEquals("second", rows.get(0).get("name"));
        }
    }

    @Test
    public void guiBulkInsertAndBulkUpdateChangeSeveralRows() throws Exception {
        try (Connection app = app()) {
            execute(app, "drop table if exists t_bulk", "create table t_bulk (id int primary key, name varchar(20))");
            gui("BULK_INSERT", Map.of("table", "t_bulk", "records", "[{\"id\":1,\"name\":\"a\"},{\"id\":2,\"name\":\"b\"}]"), Map.of());
            assertEquals(List.of("a", "b"), rows(app, "select name from t_bulk order by id").stream().map(r -> r.get("name")).toList());
            gui("BULK_UPDATE", Map.of("table", "t_bulk", "primaryKey", "id", "records", "[{\"id\":1,\"name\":\"A\"},{\"id\":2,\"name\":\"B\"}]"), Map.of());
            assertEquals(List.of("A", "B"), rows(app, "select name from t_bulk order by id").stream().map(r -> r.get("name")).toList());
        }
    }
}

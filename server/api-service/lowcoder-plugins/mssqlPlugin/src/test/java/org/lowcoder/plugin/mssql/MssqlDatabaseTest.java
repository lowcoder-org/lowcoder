package org.lowcoder.plugin.mssql;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.CONNECTOR;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.EXECUTOR;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.PASSWORD;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.USER;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.config;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.connect;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.destroy;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.execute;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.guiConfig;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.jdbc;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.rows;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.run;
import static org.lowcoder.plugin.mssql.MssqlContainerSupport.sql;

/**
 * Unit MS-4 (task L5-5b): {@code MssqlConnector}, {@code MssqlQueryExecutor}, {@code MssqlStructureParser},
 * {@code MssqlResultParser} and the GUI commands against a real SQL Server 2022 (the image pinned in
 * {@code ContainerImages.MSSQL_2022}, the module's {@code mssql-jdbc 10.2.1.jre11} driver), started once per JVM by
 * {@link MssqlContainerSupport}. Heavy-container tag: the default build does not run it (run command in log-L5.md).
 * Each test uses its own tables or schemas in database {@code app}. The self-signed certificate of the image is not
 * trusted, so a pool with usingSsl fails; {@code readOnly} is not enforced by the driver (see
 * {@link #readonlyFlagDoesNotStopAWriteBecauseTheDriverIgnoresIt}).
 */
@Tag("heavy-container")
public class MssqlDatabaseTest {

    static final String WRONG_PASSWORD = "not-the-password";
    static final int MSSQL_POOL_SIZE = 50;
    static final String DRIVER = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
    static final String INJECTION = "x'; drop table t_gui; --";
    static final String D4_USER = "d4user";
    static final String D4_PASSWORD = "Str0ng;Pass}word1";
    static final String SEMICOLON_USER = "semiuser";
    static final String SEMICOLON_PASSWORD = "Str0ng;Pass1";
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
        MssqlDatasourceConfig config = config();
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

    private static void createLogin(Connection jdbc, String login, String password) {
        execute(jdbc, "if exists (select 1 from sys.database_principals where name = '" + login + "') drop user " + login,
                "if exists (select 1 from sys.server_principals where name = '" + login + "') drop login " + login);
        execute(jdbc, "create login " + login + " with password = '" + password + "', check_policy = off",
                "create user " + login + " for login " + login, "alter role db_owner add member " + login);
    }

    // ---- connector

    @Test
    public void poolOpensRunsQueriesAndTestConnectionSucceeds() {
        MssqlDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            HikariDataSource dataSource = (HikariDataSource) pool.getHikariDataSource();
            assertTrue(dataSource.isRunning());
            assertEquals(DRIVER, dataSource.getDriverClassName());
            assertEquals(MSSQL_POOL_SIZE, dataSource.getMaximumPoolSize());
            assertEquals("jdbc:sqlserver://" + MssqlContainerSupport.host() + ":" + MssqlContainerSupport.port() + ";databaseName=app;user=" + USER
                    + ";password=" + PASSWORD + ";encrypt=false;", dataSource.getJdbcUrl());
            assertEquals(1, cell(sql(pool, config, "select 1 as one", Map.of()), "one"));
            assertEquals(42, cell(sql(pool, config, "select {{a}} + 1 as r", Map.of("a", 41)), "r"), "a bound parameter reaches the server");
            DatasourceTestResult test = CONNECTOR.testConnection(config).block();
            assertNotNull(test);
            assertTrue(test.isSuccess());
            System.out.println("[MssqlDatabaseTest] pool url (password included, see D4): " + dataSource.getJdbcUrl() + ", test connection succeeded");
        } finally {
            destroy(pool);
        }
    }

    @Test
    public void wrongPasswordIsReportedWithinTheInitTimeout() {
        long start = System.nanoTime();
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(config(USER, WRONG_PASSWORD, false, false)));
        long millis = (System.nanoTime() - start) / 1_000_000;
        System.out.println("[MssqlDatabaseTest] wrong password: " + thrown.getClass().getSimpleName() + " after " + millis + " ms: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains("Login failed for user 'sa'"), thrown.getMessage());
        assertTrue(millis < INIT_TIMEOUT_MILLIS, "took " + millis + " ms");
    }

    private void createD4Logins() {
        try (Connection admin = jdbc()) {
            createLogin(admin, D4_USER, D4_PASSWORD);
            createLogin(admin, SEMICOLON_USER, SEMICOLON_PASSWORD);
            assertEquals(1, rows(admin, "select 1 as one from sys.server_principals where name = '" + D4_USER + "'").size(), "the login exists");
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * Pins defect D4 (analysis-plugins section 0.6; plan section 9 D1-D20 row) as the real driver shows it: the password is
     * appended raw into the JDBC URL, so a password with {@code ;} and {@code }} that the server accepts for a login makes
     * the pool fail before any connection: the driver does not accept the URL. A password with only a {@code ;} fails the
     * same way. A fix (braces in the URL) changes this test on purpose.
     */
    @Test
    public void passwordWithSemicolonAndBraceCannotConnect_pinsD4() {
        createD4Logins();
        RuntimeException braces = assertThrows(RuntimeException.class, () -> connect(config(D4_USER, D4_PASSWORD, false, false)));
        System.out.println("[MssqlDatabaseTest] D4 password with ; and }: " + braces.getClass().getSimpleName() + ": " + braces.getMessage());
        assertTrue(braces.getMessage().contains("claims to not accept jdbcUrl"), braces.getMessage());
        RuntimeException semicolon = assertThrows(RuntimeException.class, () -> connect(config(SEMICOLON_USER, SEMICOLON_PASSWORD, false, false)));
        System.out.println("[MssqlDatabaseTest] D4 password with ; only: " + semicolon.getClass().getSimpleName() + ": " + semicolon.getMessage());
        assertTrue(semicolon.getMessage().contains("claims to not accept jdbcUrl"), semicolon.getMessage());
    }

    /**
     * Pins the plan section 9 row "secret in error text" (D-6: fix deferred): the pool failure of the previous test carries
     * the URL with the password masked only up to its first {@code ;}, so everything after it is in the exception message
     * (here {@code Pass}word1} and {@code Pass1}). A fix (braces quoting, so the URL is accepted, or masking the whole
     * password) changes this test on purpose.
     */
    @Test
    public void failureTextContainsThePasswordTailAfterTheFirstSemicolon_pinsTheSecretInErrorTextRow() {
        createD4Logins();
        for (String[] login : new String[][] {{D4_USER, D4_PASSWORD}, {SEMICOLON_USER, SEMICOLON_PASSWORD}}) {
            String tail = login[1].substring(login[1].indexOf(';') + 1);
            RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(config(login[0], login[1], false, false)));
            System.out.println("[MssqlDatabaseTest] password tail '" + tail + "' in the failure text: " + thrown.getMessage());
            assertTrue(thrown.getMessage().contains("password=<masked>;" + tail + ";"), "the tail after the first ';' is in the message: " + thrown.getMessage());
            assertTrue(!thrown.getMessage().contains(login[1]), "the part before the ';' is masked: " + thrown.getMessage());
        }
    }

    @Test
    public void sslAgainstTheSelfSignedCertificateFailsAndSslOffWorks() {
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> connect(config(USER, PASSWORD, true, false)));
        System.out.println("[MssqlDatabaseTest] ssl against the self-signed certificate: " + thrown.getMessage());
        assertTrue(thrown.getMessage().contains("could not establish a secure connection"), thrown.getMessage());
        assertTrue(thrown.getMessage().contains("PKIX path building failed"), thrown.getMessage());
        destroy(connect(config(USER, PASSWORD, false, false)));
    }

    /**
     * Shows where the read-only switch stops: the connector hands {@code readOnly} to Hikari (asserted in
     * {@code MssqlConnectorUrlTest}), but the SQL Server driver treats {@code Connection.setReadOnly} as a hint and sends
     * nothing to the server, so an insert through a read-only pool succeeds and the row is stored. Pins the plan section 9 row
     * "read-only not enforced" (D-6: fix deferred): the driver ignores the hint, the connector does set it, and even an
     * {@code applicationIntent=ReadOnly} property does not make this server refuse the write.
     */
    @Test
    public void readonlyFlagDoesNotStopAWriteBecauseTheDriverIgnoresIt() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists dbo.t_readonly", "create table dbo.t_readonly (id int)");
            MssqlDatasourceConfig readonly = config(USER, PASSWORD, false, true);
            HikariPerfWrapper pool = connect(readonly);
            try {
                assertTrue(((HikariDataSource) pool.getHikariDataSource()).isReadOnly(), "the connector set read-only on the pool");
                Object result = sql(pool, readonly, "insert into dbo.t_readonly values (1)", Map.of());
                System.out.println("[MssqlDatabaseTest] insert through a read-only pool: " + result);
                assertEquals(1, ((Map<?, ?>) result).get("affectedRows"));
            } finally {
                destroy(pool);
            }
            assertEquals(List.of(1), column(jdbc, "select id from dbo.t_readonly", "id"), "the write reached the table");
        }
    }

    // ---- structure

    private static Table table(DatasourceStructure structure, String fullName) {
        return structure.getTables().stream().filter(t -> t.getName().equals(fullName)).findFirst().orElseThrow();
    }

    @Test
    public void structureListsTablesAndViewsWithSchemaNamesAndOrdinalColumnOrder() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop view if exists s_a.v_alpha", "drop table if exists s_a.alpha", "drop table if exists s_b.alpha",
                    "drop schema if exists s_a", "drop schema if exists s_b");
            execute(jdbc, "create schema s_a", "create schema s_b");
            execute(jdbc, "create table s_a.alpha (zeta int not null primary key, alpha nvarchar(20) null, mid datetime2 null, ident int identity(1,1))",
                    "create table s_b.alpha (id int)", "create view s_a.v_alpha as select zeta from s_a.alpha");
        }
        MssqlDatasourceConfig config = config();
        HikariPerfWrapper pool = connect(config);
        try {
            DatasourceStructure structure = EXECUTOR.getStructure(pool, config).block();
            List<String> names = structure.getTables().stream().map(Table::getName).toList();
            System.out.println("[MssqlDatabaseTest] tables: " + names);
            assertTrue(names.containsAll(List.of("s_a.alpha", "s_a.v_alpha", "s_b.alpha")), names.toString());
            assertTrue(names.stream().noneMatch(n -> n.startsWith("sys.") || n.startsWith("INFORMATION_SCHEMA.")), "system schemas are not listed: " + names);
            assertEquals(names.stream().sorted().toList(), names, "the tables come ordered by their schema.table name");
            assertEquals(1, names.stream().filter("s_b.alpha"::equals).count(), "one entry per table");

            Table alpha = table(structure, "s_a.alpha");
            assertEquals(TableType.TABLE, alpha.getType());
            assertEquals("s_a", alpha.getSchema());
            assertEquals(List.of("zeta", "alpha", "mid", "ident"), alpha.getColumns().stream().map(Column::getName).toList(), "columns in ordinal order, not name order");
            assertEquals(List.of("int", "nvarchar", "datetime2", "int"), alpha.getColumns().stream().map(Column::getType).toList());
            assertEquals(List.of(false, false, false, false), alpha.getColumns().stream().map(Column::getIsAutogenerated).toList(), "the parser never marks a column as generated, the identity column included");
            assertEquals(List.of(), alpha.getKeys(), "keys are not read: the primary key of zeta is not listed");
            Table view = table(structure, "s_a.v_alpha");
            assertEquals(TableType.TABLE, view.getType(), "a view is listed as a TABLE");
            assertEquals(List.of("zeta"), view.getColumns().stream().map(Column::getName).toList());
            assertEquals(List.of("id"), table(structure, "s_b.alpha").getColumns().stream().map(Column::getName).toList());
        } finally {
            destroy(pool);
        }
    }

    // ---- results

    @Test
    public void realDriverReturnsWhatTheResultParserAssumes() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists dbo.t_types");
            execute(jdbc, "create table dbo.t_types (c_datetime datetime, c_datetime2 datetime2, c_small smalldatetime, c_date date, c_time time, c_dto datetimeoffset, "
                    + "c_guid uniqueidentifier, c_money money, c_bit bit, c_nv nvarchar(20), c_bin varbinary(4), c_dec decimal(10,2), c_big bigint)");
            execute(jdbc, "insert into dbo.t_types values ('2024-02-29 13:14:15.123', '2024-02-29 13:14:15.1234567', '2024-02-29 13:15:00', '2024-02-29', '13:14:15.123', "
                    + "'2024-02-29 13:14:15.123 +05:30', '123e4567-e89b-12d3-a456-426614174000', 10.5, 1, N'žluťoučký', 0x0001FF, 12345678.12, 9223372036854775807)");
            execute(jdbc, "insert into dbo.t_types (c_nv) values (null)");

            List<String> typeNames = new ArrayList<>();
            try (Statement statement = jdbc.createStatement(); ResultSet resultSet = statement.executeQuery("select * from dbo.t_types")) {
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    typeNames.add(metaData.getColumnTypeName(i));
                }
            }
            System.out.println("[MssqlDatabaseTest] driver type names: " + typeNames);
            assertEquals(List.of("datetime", "datetime2", "smalldatetime", "date", "time", "datetimeoffset", "uniqueidentifier", "money", "bit",
                    "nvarchar", "varbinary", "decimal", "bigint"), typeNames, "the driver reports lower-case type names, so the case-sensitive match of D16 does not bite for this driver");

            MssqlDatasourceConfig config = config();
            HikariPerfWrapper pool = connect(config);
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> data = (List<Map<String, Object>>) sql(pool, config, "select * from dbo.t_types", Map.of());
                System.out.println("[MssqlDatabaseTest] parsed rows: " + data);
                Map<String, Object> first = data.get(0);
                assertEquals("2024-02-29 13:14:15", first.get("c_datetime"));
                assertEquals("2024-02-29 13:14:15", first.get("c_datetime2"), "the fraction is dropped");
                assertEquals("2024-02-29 13:15:00", first.get("c_small"));
                assertEquals("2024-02-29", first.get("c_date"));
                assertEquals("13:14:15.1230000", first.get("c_time"));
                assertEquals("2024-02-29T13:14:15.123+05:30", first.get("c_dto"));
                assertEquals("123E4567-E89B-12D3-A456-426614174000", first.get("c_guid"), "the driver gives the guid as upper-case text");
                assertEquals(new BigDecimal("10.5000"), first.get("c_money"));
                assertEquals(true, first.get("c_bit"));
                assertEquals("žluťoučký", first.get("c_nv"));
                assertArrayEquals(new byte[] {0, 1, (byte) 0xFF}, (byte[]) first.get("c_bin"));
                assertEquals(new BigDecimal("12345678.12"), first.get("c_dec"));
                assertEquals(Long.MAX_VALUE, first.get("c_big"));
                Map<String, Object> second = data.get(1);
                assertEquals(13, second.size());
                second.forEach((name, value) -> assertNull(value, name));
                assertEquals(new ArrayList<>(first.keySet()), new ArrayList<>(second.keySet()), "column order is the same on every row");
            } finally {
                destroy(pool);
            }
        }
    }

    /**
     * Pins the plan section 9 row "timestamp (rowversion) columns cannot be read" (D-6: fix deferred): {@code MssqlResultParser}
     * formats the type name {@code timestamp} with {@code getTimestamp}, but on SQL Server {@code timestamp} is the binary
     * row version, which the driver refuses to convert. So {@code select *} from a table with a rowversion column fails the
     * whole query. A fix (reading {@code timestamp} as bytes) changes this test on purpose.
     */
    @Test
    public void tableWithARowversionColumnCannotBeQueried_pinsTheRowversionRow() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists dbo.t_rowversion", "create table dbo.t_rowversion (id int, rv rowversion)", "insert into dbo.t_rowversion (id) values (1)");
            MssqlDatasourceConfig config = config();
            HikariPerfWrapper pool = connect(config);
            try {
                assertEquals(1, cell(sql(pool, config, "select id from dbo.t_rowversion", Map.of()), "id"), "without the rowversion column the table reads fine");
                PluginException thrown = assertThrows(PluginException.class, () -> sql(pool, config, "select * from dbo.t_rowversion", Map.of()));
                System.out.println("[MssqlDatabaseTest] select * with a rowversion column: " + thrown.getError() + " " + thrown.getMessage());
                assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
                assertTrue(thrown.getMessage().contains("The conversion from timestamp to TIMESTAMP is unsupported"), thrown.getMessage());
            } finally {
                destroy(pool);
            }
        }
    }

    // ---- GUI commands

    @Test
    public void guiCommandsChangeTheRealTableAndAnInjectionValueIsStoredAsText() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists dbo.t_gui", "create table dbo.t_gui (id int primary key, name nvarchar(100))");
            Object inserted = gui("insert", Map.of("table", "dbo.t_gui", "changeSet", keyValues("id", "{{id}}", "name", "{{name}}")), Map.of("id", 1, "name", INJECTION));
            System.out.println("[MssqlDatabaseTest] insert: " + inserted);
            assertEquals(1, ((Map<?, ?>) inserted).get("affectedRows"));
            assertEquals(List.of(Map.of("id", 1, "name", INJECTION)), rows(jdbc, "select id, name from dbo.t_gui"), "the value is stored as text, the table is intact");

            Map<String, Object> updateDetail = filterOn("dbo.t_gui", "id", true);
            updateDetail.put("changeSet", keyValues("name", "{{name}}"));
            gui("UPDATE", updateDetail, Map.of("key", 1, "name", "o'brien"));
            assertEquals(List.of("o'brien"), column(jdbc, "select name from dbo.t_gui where id = 1", "name"));

            gui("BULK_INSERT", Map.of("table", "dbo.t_gui", "records", "[{\"id\":2,\"name\":\"b\"},{\"id\":3,\"name\":\"c\"}]"), Map.of());
            assertEquals(List.of("o'brien", "b", "c"), column(jdbc, "select name from dbo.t_gui order by id", "name"));
            gui("BULK_UPDATE", Map.of("table", "dbo.t_gui", "primaryKey", "id", "records", "[{\"id\":2,\"name\":\"B\"},{\"id\":3,\"name\":\"C\"}]"), Map.of());
            assertEquals(List.of("o'brien", "B", "C"), column(jdbc, "select name from dbo.t_gui order by id", "name"));

            gui("DELETE", filterOn("dbo.t_gui", "id", false), Map.of("key", 3));
            assertEquals(List.of(1, 2), column(jdbc, "select id from dbo.t_gui order by id", "id"));
        }
    }

    @Test
    public void topOneChangesAndDeletesExactlyOneOfThreeMatchingRows() throws Exception {
        try (Connection jdbc = jdbc()) {
            execute(jdbc, "drop table if exists dbo.t_top", "create table dbo.t_top (id int, grp int, marker nvarchar(10))",
                    "insert into dbo.t_top values (1, 1, 'orig'), (2, 1, 'orig'), (3, 1, 'orig'), (4, 2, 'orig')");

            Map<String, Object> update = filterOn("dbo.t_top", "grp", false);
            update.put("changeSet", keyValues("marker", "changed"));
            Object updated = gui("UPDATE", update, Map.of("key", 1));
            System.out.println("[MssqlDatabaseTest] update top (1): " + updated);
            assertEquals(1, ((Map<?, ?>) updated).get("affectedRows"));
            assertEquals(1, rows(jdbc, "select * from dbo.t_top where marker = 'changed'").size(), "exactly one row changed, the server accepts the double space");

            Object deleted = gui("DELETE", filterOn("dbo.t_top", "grp", false), Map.of("key", 1));
            assertEquals(1, ((Map<?, ?>) deleted).get("affectedRows"));
            assertEquals(3, rows(jdbc, "select * from dbo.t_top").size(), "exactly one of the three matching rows is gone");

            Object all = gui("DELETE", filterOn("dbo.t_top", "grp", true), Map.of("key", 1));
            assertEquals(2, ((Map<?, ?>) all).get("affectedRows"));
            assertEquals(List.of(4), column(jdbc, "select id from dbo.t_top", "id"), "the row of the other group stays");

            Map<String, Object> multiUpdate = filterOn("dbo.t_top", "grp", true);
            multiUpdate.put("changeSet", keyValues("marker", "all"));
            assertEquals(1, ((Map<?, ?>) gui("UPDATE", multiUpdate, Map.of("key", 2))).get("affectedRows"));
            assertEquals(List.of("all"), column(jdbc, "select marker from dbo.t_top", "marker"));
        }
    }
}

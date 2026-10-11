package org.lowcoder.plugin.mssql;

import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;
import org.lowcoder.sdk.contract.ContainerImages;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The shared SQL Server 2022 container of the L5-5b tests (heavy-container tag: one per test JVM, started on first
 * use, removed by Testcontainers' reaper when the JVM exits; the port is the one Docker assigns) and the helpers around
 * it. A generic container, not the module's MSSQLServerContainer: the module classes need commons-lang3 3.18 and this
 * module's classpath resolves 3.13.0 (see log-L5.md). The EULA is accepted through {@code ACCEPT_EULA=Y}. No Docker
 * guard on purpose (owner decision D-7). Not a test.
 */
final class MssqlContainerSupport {

    static final String DATABASE = "app";
    static final String USER = "sa";
    static final String PASSWORD = "Str0ng!Passw0rd";
    static final int MSSQL_PORT = 1433;
    private static final String READY_PATTERN = ".*SQL Server is now ready for client connections.*";
    private static final Duration START_TIMEOUT = Duration.ofMinutes(3);
    private static final int CONNECT_ATTEMPTS = 60;
    private static final long CONNECT_PAUSE_MILLIS = 1000;

    private static final GenericContainer<?> MSSQL = new GenericContainer<>(DockerImageName.parse(ContainerImages.MSSQL_2022))
            .withEnv("ACCEPT_EULA", "Y").withEnv("MSSQL_SA_PASSWORD", PASSWORD)
            .withExposedPorts(MSSQL_PORT)
            .waitingFor(Wait.forLogMessage(READY_PATTERN, 1).withStartupTimeout(START_TIMEOUT));

    static {
        long start = System.nanoTime();
        MSSQL.start();
        System.out.println("[MssqlContainerSupport] " + ContainerImages.MSSQL_2022 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + MSSQL.getHost() + ":" + MSSQL.getMappedPort(MSSQL_PORT));
        createDatabase();
    }

    static final MssqlConnector CONNECTOR = new MssqlConnector();
    static final MssqlQueryExecutor EXECUTOR = new MssqlQueryExecutor();

    private MssqlContainerSupport() {
    }

    static String host() {
        return MSSQL.getHost();
    }

    static int port() {
        return MSSQL.getMappedPort(MSSQL_PORT);
    }

    static MssqlDatasourceConfig config(String user, String password, boolean ssl, boolean readonly) {
        return new MssqlDatasourceConfig(DATABASE, user, password, host(), (long) port(), ssl, null, readonly, false, null);
    }

    static MssqlDatasourceConfig config() {
        return config(USER, PASSWORD, false, false);
    }

    static HikariPerfWrapper connect(MssqlDatasourceConfig config) {
        return CONNECTOR.createConnection(config).block();
    }

    static void destroy(HikariPerfWrapper wrapper) {
        CONNECTOR.destroyConnection(wrapper).block();
    }

    /** Runs a query config through the executor as the server does: build the context, execute, return the data. */
    static Object run(HikariPerfWrapper wrapper, MssqlDatasourceConfig config, Map<String, Object> queryConfig, Map<String, Object> params) {
        SqlBasedQueryExecutionContext context = EXECUTOR.buildQueryExecutionContext(config, queryConfig, params, null);
        return EXECUTOR.executeQuery(wrapper, context).block().getData();
    }

    static Object sql(HikariPerfWrapper wrapper, MssqlDatasourceConfig config, String sql, Map<String, Object> params) {
        return run(wrapper, config, sqlConfig(sql), params);
    }

    static Map<String, Object> sqlConfig(String sql) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("mode", "SQL");
        config.put("sql", sql);
        config.put("disablePreparedStatement", false);
        return config;
    }

    static Map<String, Object> guiConfig(String type, Map<String, Object> command) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("mode", "GUI");
        config.put("commandType", type);
        config.put("command", command);
        return config;
    }

    /** A plain JDBC connection of the administrator {@code sa} to {@code database} (not the code under test). */
    static Connection jdbc(String database) {
        try {
            return DriverManager.getConnection("jdbc:sqlserver://" + host() + ":" + port() + ";databaseName=" + database
                    + ";user=" + USER + ";password=" + PASSWORD + ";encrypt=false;");
        } catch (SQLException e) {
            throw new IllegalStateException("cannot connect", e);
        }
    }

    static Connection jdbc() {
        return jdbc(DATABASE);
    }

    private static void createDatabase() {
        SQLException last = null;
        for (int attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
            try (Connection connection = jdbc("master")) {
                execute(connection, "if db_id('" + DATABASE + "') is null create database " + DATABASE);
                System.out.println("[MssqlContainerSupport] database " + DATABASE + " ready after " + attempt + " attempt(s)");
                return;
            } catch (IllegalStateException | SQLException e) {
                last = e instanceof SQLException sql ? sql : e.getCause() instanceof SQLException cause ? cause : null;
                try {
                    Thread.sleep(CONNECT_PAUSE_MILLIS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("interrupted while waiting for the server", interrupted);
                }
            }
        }
        throw new IllegalStateException("the server did not accept the administrator connection", last);
    }

    static void execute(Connection connection, String... statements) {
        try (Statement statement = connection.createStatement()) {
            for (String sql : statements) {
                statement.execute(sql);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("statement failed", e);
        }
    }

    static List<Map<String, Object>> rows(Connection connection, String sql) {
        List<Map<String, Object>> rows = new ArrayList<>();
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql)) {
            ResultSetMetaData metaData = resultSet.getMetaData();
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    row.put(metaData.getColumnLabel(i), resultSet.getObject(i));
                }
                rows.add(row);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("read failed: " + sql, e);
        }
        return rows;
    }
}

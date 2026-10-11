package org.lowcoder.plugin.postgres;

import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;
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
 * The shared {@code postgres:16-alpine} container of the L5-4 tests (one per test JVM, started on first use, removed by
 * Testcontainers' reaper when the JVM exits; the port is the one Docker assigns) and the helpers around it. A generic
 * container, not the module's PostgreSQLContainer: that one copies files into the container, which needs commons-lang3
 * 3.18, and this module's classpath resolves 3.13.0 (see log-L5.md). No Docker guard on purpose (owner decision D-7).
 * Not a test.
 */
final class PostgresContainerSupport {

    static final String DATABASE = "app";
    static final String USER = "appuser";
    static final String PASSWORD = "apppass";
    static final int PG_PORT = 5432;
    private static final int READY_MESSAGES = 2;
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);

    private static final GenericContainer<?> POSTGRES = new GenericContainer<>(DockerImageName.parse(ContainerImages.POSTGRES_16))
            .withEnv("POSTGRES_DB", DATABASE).withEnv("POSTGRES_USER", USER).withEnv("POSTGRES_PASSWORD", PASSWORD)
            .withExposedPorts(PG_PORT)
            .waitingFor(Wait.forLogMessage(".*database system is ready to accept connections.*", READY_MESSAGES).withStartupTimeout(START_TIMEOUT));

    static {
        long start = System.nanoTime();
        POSTGRES.start();
        System.out.println("[PostgresContainerSupport] " + ContainerImages.POSTGRES_16 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + POSTGRES.getHost() + ":" + POSTGRES.getMappedPort(PG_PORT));
    }

    static final PostgresConnector CONNECTOR = new PostgresConnector();
    static final PostgresExecutor EXECUTOR = new PostgresExecutor();

    private PostgresContainerSupport() {
    }

    static String host() {
        return POSTGRES.getHost();
    }

    static int port() {
        return POSTGRES.getMappedPort(PG_PORT);
    }

    static PostgresDatasourceConfig config(String password, boolean ssl, boolean readonly, boolean enableTurnOffPreparedStatement) {
        return PostgresDatasourceConfig.builder().database(DATABASE).username(USER).password(password).host(host()).port((long) port())
                .usingSsl(ssl).isReadonly(readonly).enableTurnOffPreparedStatement(enableTurnOffPreparedStatement).build();
    }

    static PostgresDatasourceConfig config() {
        return config(PASSWORD, false, false, false);
    }

    static HikariPerfWrapper connect(PostgresDatasourceConfig config) {
        return CONNECTOR.createConnection(config).block();
    }

    static void destroy(HikariPerfWrapper wrapper) {
        CONNECTOR.destroyConnection(wrapper).block();
    }

    /** Runs a query config through the executor as the server does: build the context, execute, return the data. */
    static Object run(HikariPerfWrapper wrapper, PostgresDatasourceConfig config, Map<String, Object> queryConfig, Map<String, Object> params) {
        SqlBasedQueryExecutionContext context = EXECUTOR.buildQueryExecutionContext(config, queryConfig, params, null);
        return EXECUTOR.executeQuery(wrapper, context).block().getData();
    }

    static Object sql(HikariPerfWrapper wrapper, PostgresDatasourceConfig config, String sql, Map<String, Object> params) {
        return run(wrapper, config, sqlConfig(sql, false), params);
    }

    static Map<String, Object> sqlConfig(String sql, boolean disablePreparedStatement) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("mode", "SQL");
        config.put("sql", sql);
        config.put("disablePreparedStatement", disablePreparedStatement);
        return config;
    }

    static Map<String, Object> guiConfig(String type, Map<String, Object> command) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("mode", "GUI");
        config.put("commandType", type);
        config.put("command", command);
        return config;
    }

    /** A plain JDBC connection of the application user (not the code under test). */
    static Connection jdbc() {
        try {
            return DriverManager.getConnection("jdbc:postgresql://" + host() + ":" + port() + "/" + DATABASE + "?sslmode=disable", USER, PASSWORD);
        } catch (SQLException e) {
            throw new IllegalStateException("cannot connect", e);
        }
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

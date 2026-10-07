package org.lowcoder.plugin.mysql;

import org.lowcoder.sdk.contract.ContainerImages;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;
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
 * The shared {@code mysql:8.0} container of the L5-2 tests (one per test JVM, started on first use, removed by
 * Testcontainers' reaper when the JVM exits; the port is the one Docker assigns) and the helpers around it. No Docker
 * guard on purpose: without a Docker daemon the first use fails, as the other container tests of the build do (owner
 * decision D-7). Not a test.
 */
final class MysqlContainerSupport {

    static final String DATABASE = "app";
    static final String USER = "appuser";
    static final String PASSWORD = "apppass";
    static final String ROOT = "root";

    static final int MYSQL_PORT = 3306;
    /** The URL parameter of the plain JDBC helpers ({@link #app()}, {@link #root()}): TLS required. */
    private static final String HELPER_SSL_MODE = "?sslMode=REQUIRED";
    /** The final server logs its TCP port; the temporary one of the image's init phase logs "port: 0". */
    private static final String READY_PATTERN = ".*ready for connections.*port: 3306.*";
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);

    /**
     * A generic container, not the module's {@code MySQLContainer}: that one copies files into the container, which needs
     * commons-lang3 3.18 ({@code ArrayFill}, used by commons-compress), and this module's classpath resolves 3.13.0 from
     * lowcoder-sdk. A pom override would fix it for the module; it is outside the lane's files, so it is reported instead.
     */
    private static final GenericContainer<?> MYSQL = new GenericContainer<>(DockerImageName.parse(ContainerImages.MYSQL_8_0))
            .withEnv("MYSQL_DATABASE", DATABASE).withEnv("MYSQL_USER", USER).withEnv("MYSQL_PASSWORD", PASSWORD)
            .withEnv("MYSQL_ROOT_PASSWORD", PASSWORD)
            .withExposedPorts(MYSQL_PORT)
            .waitingFor(Wait.forLogMessage(READY_PATTERN, 1).withStartupTimeout(START_TIMEOUT));

    static {
        long start = System.nanoTime();
        MYSQL.start();
        System.out.println("[MysqlContainerSupport] " + ContainerImages.MYSQL_8_0 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + MYSQL.getHost() + ":" + MYSQL.getMappedPort(MYSQL_PORT));
    }

    static final MysqlConnector CONNECTOR = new MysqlConnector();
    static final MysqlQueryExecutor EXECUTOR = new MysqlQueryExecutor();

    private MysqlContainerSupport() {
    }

    static MysqlDatasourceConfig config(String database, String password, boolean ssl, boolean readonly, boolean enableTurnOffPreparedStatement) {
        return config(database, USER, password, ssl, readonly, enableTurnOffPreparedStatement);
    }

    static MysqlDatasourceConfig config(String database, String user, String password, boolean ssl, boolean readonly, boolean enableTurnOffPreparedStatement) {
        return config(database, user, password, ssl, readonly, enableTurnOffPreparedStatement, null);
    }

    static MysqlDatasourceConfig config(String database, String user, String password, boolean ssl, boolean readonly, boolean enableTurnOffPreparedStatement,
            Map<String, Object> extParams) {
        return new MysqlDatasourceConfig(database, user, password, MYSQL.getHost(), (long) MYSQL.getMappedPort(MYSQL_PORT), ssl, null,
                readonly, enableTurnOffPreparedStatement, extParams);
    }

    static MysqlDatasourceConfig config() {
        return config(DATABASE, PASSWORD, false, false, false);
    }

    static HikariPerfWrapper connect(MysqlDatasourceConfig config) {
        return CONNECTOR.createConnection(config).block();
    }

    static void destroy(HikariPerfWrapper wrapper) {
        CONNECTOR.destroyConnection(wrapper).block();
    }

    /** Runs a query config through the executor, as the server does: build the context, execute, return the data. */
    static Object run(HikariPerfWrapper wrapper, MysqlDatasourceConfig config, Map<String, Object> queryConfig, Map<String, Object> params) {
        SqlBasedQueryExecutionContext context = EXECUTOR.buildQueryExecutionContext(config, queryConfig, params, null);
        return EXECUTOR.executeQuery(wrapper, context).block().getData();
    }

    /** A plain JDBC connection of the application user (not the code under test). */
    static Connection app() {
        return open(DATABASE, USER, PASSWORD);
    }

    static Connection root() {
        return open(DATABASE, ROOT, PASSWORD);
    }

    /**
     * Over TLS ({@code sslMode=REQUIRED}, the certificate not verified), so the first login of a user the server has not
     * cached needs no RSA key and this helper works whatever the order of the tests; the connector's own path without SSL is
     * tested in MysqlDatabaseTest.
     */
    private static Connection open(String database, String user, String password) {
        try {
            return DriverManager.getConnection("jdbc:mysql://" + MYSQL.getHost() + ":" + MYSQL.getMappedPort(MYSQL_PORT) + "/" + database
                    + HELPER_SSL_MODE, user, password);
        } catch (SQLException e) {
            throw new IllegalStateException("cannot connect as " + user, e);
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

    /** Creates an empty schema the application user may use (through the root user), so a test sees only its own tables. */
    static void newSchema(String name) {
        try (Connection root = root()) {
            execute(root, "drop database if exists " + name, "create database " + name,
                    "grant all on " + name + ".* to '" + USER + "'@'%'");
        } catch (SQLException e) {
            throw new IllegalStateException("cannot create schema " + name, e);
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
}

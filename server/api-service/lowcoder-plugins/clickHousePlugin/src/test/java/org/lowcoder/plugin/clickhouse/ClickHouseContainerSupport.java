package org.lowcoder.plugin.clickhouse;

import com.zaxxer.hikari.HikariDataSource;
import org.lowcoder.plugin.clickhouse.model.ClickHouseDatasourceConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.ContainerImages;
import org.lowcoder.sdk.models.QueryExecutionResult;
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
 * The shared ClickHouse container of the L5-3 tests (one per test JVM, started on first use, removed by Testcontainers'
 * reaper when the JVM exits; the port is the one Docker assigns) and the helpers around it. A generic container, not the
 * module's ClickHouseContainer: that one copies files into the container, which needs commons-lang3 3.18, and this module's
 * classpath resolves 3.13.0 (see log-L5.md). No Docker guard on purpose (owner decision D-7). Not a test.
 */
final class ClickHouseContainerSupport {

    static final String DATABASE = "app";
    static final String USER = "appuser";
    static final String PASSWORD = "apppass";
    static final int HTTP_PORT = 8123;
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);

    private static final GenericContainer<?> CLICKHOUSE = new GenericContainer<>(DockerImageName.parse(ContainerImages.CLICKHOUSE_24_8))
            .withEnv("CLICKHOUSE_DB", DATABASE).withEnv("CLICKHOUSE_USER", USER).withEnv("CLICKHOUSE_PASSWORD", PASSWORD)
            .withExposedPorts(HTTP_PORT)
            .waitingFor(Wait.forHttp("/ping").forStatusCode(200).withStartupTimeout(START_TIMEOUT));

    static {
        long start = System.nanoTime();
        CLICKHOUSE.start();
        System.out.println("[ClickHouseContainerSupport] " + ContainerImages.CLICKHOUSE_24_8 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + CLICKHOUSE.getHost() + ":" + CLICKHOUSE.getMappedPort(HTTP_PORT));
    }

    private ClickHouseContainerSupport() {
    }

    static String host() {
        return CLICKHOUSE.getHost();
    }

    static int port() {
        return CLICKHOUSE.getMappedPort(HTTP_PORT);
    }

    static ClickHouseDatasourceConfig config(String database, String password, boolean ssl, boolean readonly, boolean enableTurnOffPreparedStatement,
            String host, int port) {
        return ClickHouseDatasourceConfig.builder().database(database).username(USER).password(password).host(host).port((long) port)
                .usingSsl(ssl).isReadonly(readonly).enableTurnOffPreparedStatement(enableTurnOffPreparedStatement).build();
    }

    static ClickHouseDatasourceConfig config() {
        return config(DATABASE, PASSWORD, false, false, false, host(), port());
    }

    static ClickHouseDatasourceConfig config(String database) {
        return config(database, PASSWORD, false, false, false, host(), port());
    }

    static ClickHouseConnector connector() {
        return new ClickHouseConnector(new ConfigCenterForTest());
    }

    static ClickHouseQueryExecutor executor() {
        return new ClickHouseQueryExecutor(new ConfigCenterForTest());
    }

    static HikariDataSource connect(ClickHouseDatasourceConfig config) {
        return connector().createConnection(config).block();
    }

    /** Runs a query config through the executor as the server does: build the context, execute. */
    static QueryExecutionResult run(HikariDataSource pool, ClickHouseDatasourceConfig config, String sql, boolean disablePreparedStatement,
            Map<String, Object> params) {
        ClickHouseQueryExecutor executor = executor();
        Map<String, Object> queryConfig = new LinkedHashMap<>();
        queryConfig.put("sql", sql);
        queryConfig.put("disablePreparedStatement", disablePreparedStatement);
        SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(config, queryConfig, params, null);
        return executor.executeQuery(pool, context).block();
    }

    static QueryExecutionResult run(HikariDataSource pool, ClickHouseDatasourceConfig config, String sql, Map<String, Object> params) {
        return run(pool, config, sql, false, params);
    }

    /** A plain JDBC connection of the application user, to the database {@code database} (not the code under test). */
    static Connection jdbc(String database) {
        try {
            return DriverManager.getConnection("jdbc:clickhouse:http://" + host() + ":" + port() + "/" + database, USER, PASSWORD);
        } catch (SQLException e) {
            throw new IllegalStateException("cannot connect to " + database, e);
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

package org.lowcoder.plugin.oracle;

import org.lowcoder.plugin.oracle.model.OracleDatasourceConfig;
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
 * The shared Oracle Free 23 container of the L5-6 tests (heavy-container tag: one per test JVM, started on first use,
 * removed by Testcontainers' reaper when the JVM exits; the port is the one Docker assigns) and the helpers around it. A
 * generic container, not the module's OracleContainer: the module classes need commons-lang3 3.18 and this module's
 * classpath resolves 3.13.0 (see log-L5.md). The image creates the application user in the pluggable database
 * {@value #SERVICE}. No Docker guard on purpose (owner decision D-7). Not a test.
 */
final class OracleContainerSupport {

    static final String SERVICE = "FREEPDB1";
    static final String SID = "FREE";
    static final String ADMIN_USER = "system";
    static final String ADMIN_PASSWORD = "AdminPass1";
    static final String USER = "app";
    static final String PASSWORD = "apppass";
    static final int ORACLE_PORT = 1521;
    private static final String READY_PATTERN = ".*DATABASE IS READY TO USE!.*";
    private static final Duration START_TIMEOUT = Duration.ofMinutes(5);

    private static final GenericContainer<?> ORACLE = new GenericContainer<>(DockerImageName.parse(ContainerImages.ORACLE_FREE_23))
            .withEnv("ORACLE_PASSWORD", ADMIN_PASSWORD).withEnv("APP_USER", USER).withEnv("APP_USER_PASSWORD", PASSWORD)
            .withExposedPorts(ORACLE_PORT)
            .waitingFor(Wait.forLogMessage(READY_PATTERN, 1).withStartupTimeout(START_TIMEOUT));

    static {
        long start = System.nanoTime();
        ORACLE.start();
        System.out.println("[OracleContainerSupport] " + ContainerImages.ORACLE_FREE_23 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + ORACLE.getHost() + ":" + ORACLE.getMappedPort(ORACLE_PORT));
    }

    static final OracleConnector CONNECTOR = new OracleConnector();
    static final OracleQueryExecutor EXECUTOR = new OracleQueryExecutor();

    private OracleContainerSupport() {
    }

    static String host() {
        return ORACLE.getHost();
    }

    static int port() {
        return ORACLE.getMappedPort(ORACLE_PORT);
    }

    static OracleDatasourceConfig serviceConfig(String user, String password, boolean readonly) {
        return OracleDatasourceConfig.builder().host(host()).port((long) port()).serviceName(SERVICE).username(user).password(password).isReadonly(readonly).build();
    }

    static OracleDatasourceConfig config() {
        return serviceConfig(USER, PASSWORD, false);
    }

    static HikariPerfWrapper connect(OracleDatasourceConfig config) {
        return CONNECTOR.createConnection(config).block();
    }

    static void destroy(HikariPerfWrapper wrapper) {
        CONNECTOR.destroyConnection(wrapper).block();
    }

    /** Runs a query config through the executor as the server does: build the context, execute, return the data. */
    static Object run(HikariPerfWrapper wrapper, OracleDatasourceConfig config, Map<String, Object> queryConfig, Map<String, Object> params) {
        SqlBasedQueryExecutionContext context = EXECUTOR.buildQueryExecutionContext(config, queryConfig, params, null);
        return EXECUTOR.executeQuery(wrapper, context).block().getData();
    }

    static Object sql(HikariPerfWrapper wrapper, OracleDatasourceConfig config, String sql, Map<String, Object> params) {
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

    /** A plain JDBC connection of the application user (not the code under test). */
    static Connection jdbc() {
        try {
            return DriverManager.getConnection("jdbc:oracle:thin:@//" + host() + ":" + port() + "/" + SERVICE, USER, PASSWORD);
        } catch (SQLException e) {
            throw new IllegalStateException("cannot connect", e);
        }
    }

    /** Runs each statement, ignoring ORA-00942 (table or view does not exist) so that a test can drop what it creates. */
    static void execute(Connection connection, String... statements) {
        try (Statement statement = connection.createStatement()) {
            for (String sql : statements) {
                try {
                    statement.execute(sql);
                } catch (SQLException e) {
                    if (!(sql.startsWith("drop ") && e.getErrorCode() == 942)) {
                        throw e;
                    }
                }
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

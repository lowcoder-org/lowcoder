package org.lowcoder.plugin.sql;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Assertions;
import org.lowcoder.sdk.exception.PluginError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresUpdateCommand;
import org.junit.jupiter.api.function.Executable;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Shared helpers of the L5-1 tests (task L5-1, units SB-1 to SB-6): an in-memory H2 database in PostgreSQL mode with
 * lower-case names (the label of {@code count(1) as count} is then {@code count}, the key the single-row guard reads),
 * and a minimal connector, executor and datasource config over it. Not a test.
 */
final class H2SqlTestSupport {

    static final String H2_DRIVER = "org.h2.Driver";
    static final String H2_USER = "sa";
    static final String GUI_UPDATE = "update";
    static final String GUI_DELETE = "delete";
    static final String GUI_INSERT = "insert";
    static final String GUI_MODE = "GUI";
    static final String SQL_MODE = "SQL";
    static final String QUERY_ERROR_KEY = "QUERY_EXECUTION_ERROR";
    static final String SQL_KEY = "sql";
    static final String MODE_KEY = "mode";
    static final String PREPARED_OFF_KEY = "disablePreparedStatement";
    static final String COMMAND_TYPE_KEY = "commandType";
    static final String COMMAND_KEY = "command";

    private static final AtomicInteger DB_COUNTER = new AtomicInteger();

    private H2SqlTestSupport() {
    }

    /** A URL of a database no other test class shares; it lives as long as the JVM ({@code DB_CLOSE_DELAY=-1}). */
    static String newUrl(String owner) {
        return "jdbc:h2:mem:" + owner + "_" + DB_COUNTER.incrementAndGet()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
    }

    static Connection open(String url) {
        try {
            return DriverManager.getConnection(url, H2_USER, "");
        } catch (SQLException e) {
            throw new IllegalStateException("cannot open " + url, e);
        }
    }

    static void run(Connection connection, String... statements) {
        try (Statement statement = connection.createStatement()) {
            for (String sql : statements) {
                statement.execute(sql);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("setup statement failed", e);
        }
    }

    /** Reads rows with plain JDBC (not the code under test); values as {@code getObject} gives them. */
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

    static Object scalar(Connection connection, String sql) {
        List<Map<String, Object>> rows = rows(connection, sql);
        Assertions.assertEquals(1, rows.size(), "one row expected for " + sql);
        return rows.get(0).values().iterator().next();
    }

    /** Asserts that {@code action} throws a {@link PluginException} of this error and message key; returns it. */
    static PluginException assertPluginError(PluginError error, String messageKey, Executable action) {
        PluginException thrown = Assertions.assertThrows(PluginException.class, action);
        Assertions.assertEquals(error, thrown.getError(), "error code of " + thrown);
        Assertions.assertEquals(messageKey, thrown.getMessageKey(), "message key of " + thrown);
        return thrown;
    }

    static Map<String, Object> sqlConfig(String sql) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put(MODE_KEY, SQL_MODE);
        config.put(SQL_KEY, sql);
        return config;
    }

    static Map<String, Object> guiConfig(String type, Map<String, Object> command) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put(MODE_KEY, GUI_MODE);
        config.put(COMMAND_TYPE_KEY, type);
        config.put(COMMAND_KEY, command);
        return config;
    }

    /** The datasource config of the tests: only the fields the code under test reads. */
    static final class H2Config extends SqlBasedDatasourceConnectionConfig {

        H2Config(String host, String database, boolean enableTurnOffPreparedStatement, Map<String, Object> extParams) {
            super(database, H2_USER, "", host, null, false, null, false, enableTurnOffPreparedStatement, extParams);
        }

        @Override
        protected long defaultPort() {
            return 9092L;
        }
    }

    /** A connector over one H2 URL; registers the Hikari pool as an MBean under {@code poolName} while it lives. */
    static class H2Connector extends SqlBasedConnector<H2Config> {

        private final String url;
        private final String driver;
        private final String poolName;

        H2Connector(String url, String driver, String poolName, int maxPoolSize) {
            super(maxPoolSize);
            this.url = url;
            this.driver = driver;
            this.poolName = poolName;
        }

        @Override
        protected String getJdbcDriver() {
            return driver;
        }

        @Override
        protected void setUpConfigs(H2Config datasourceConfig, HikariConfig config) {
            config.setJdbcUrl(url);
            config.setUsername(H2_USER);
            config.setPoolName(poolName);
            config.setRegisterMbeans(true);
        }
    }

    /** An executor whose GUI commands are the sdk PostgreSQL insert, update and delete; structure is an empty one. */
    static class H2Executor extends SqlBasedQueryExecutor {

        H2Executor(GeneralSqlExecutor generalSqlExecutor) {
            super(generalSqlExecutor);
        }

        @Override
        protected GuiSqlCommand parseSqlCommand(String guiStatementType, Map<String, Object> detail) {
            return switch (guiStatementType) {
                case GUI_INSERT -> PostgresInsertCommand.from(detail);
                case GUI_UPDATE -> PostgresUpdateCommand.from(detail);
                case GUI_DELETE -> PostgresDeleteCommand.from(detail);
                default -> throw new IllegalArgumentException("not a command of this test executor: " + guiStatementType);
            };
        }

        @Override
        protected DatasourceStructure getDatabaseMetadata(Connection connection, SqlBasedDatasourceConnectionConfig connectionConfig) {
            return new DatasourceStructure(List.of());
        }
    }
}

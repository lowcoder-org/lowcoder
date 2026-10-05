package org.lowcoder.plugin.oracle;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Test support for the executor unit of task L5-6: the never-started pool wrapper (the same shape as
 * {@code PostgresResultContractTest.wrap}) that hands out a {@code FakeJdbc} connection, and a connection whose plain
 * statement answers {@code executeQuery} with a given result set ({@code FakeJdbc} statements only implement
 * {@code execute}; the structure query uses {@code executeQuery}). Not a test.
 */
final class OracleFakeConnections {

    private OracleFakeConnections() {
    }

    /** A data source that is never started: it reports running with an idle pool and hands out {@code connection}. */
    static HikariPerfWrapper wrap(Connection connection) {
        HikariPoolMXBean pool = (HikariPoolMXBean) Proxy.newProxyInstance(HikariPoolMXBean.class.getClassLoader(),
                new Class<?>[] {HikariPoolMXBean.class}, (self, method, args) -> 0);
        HikariDataSource dataSource = new HikariDataSource() {
            @Override
            public Connection getConnection() throws SQLException {
                return connection;
            }

            @Override
            public HikariPoolMXBean getHikariPoolMXBean() {
                return pool;
            }

            @Override
            public boolean isRunning() {
                return true;
            }
        };
        return HikariPerfWrapper.wrap(dataSource, () -> 0, () -> 0, () -> 0, () -> 0, null, null);
    }

    /** A connection whose {@code createStatement().executeQuery(sql)} returns {@code resultSet} for any SQL text. */
    static Connection connectionAnswering(ResultSet resultSet) {
        Statement statement = (Statement) Proxy.newProxyInstance(Statement.class.getClassLoader(), new Class<?>[] {Statement.class}, (self, method, args) -> switch (method.getName()) {
            case "executeQuery" -> resultSet;
            case "close" -> null;
            default -> throw new UnsupportedOperationException("not implemented by the test connection: " + method.getName());
        });
        return (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[] {Connection.class}, (self, method, args) -> switch (method.getName()) {
            case "createStatement" -> statement;
            case "close" -> null;
            case "isClosed" -> false;
            default -> throw new UnsupportedOperationException("not implemented by the test connection: " + method.getName());
        });
    }
}

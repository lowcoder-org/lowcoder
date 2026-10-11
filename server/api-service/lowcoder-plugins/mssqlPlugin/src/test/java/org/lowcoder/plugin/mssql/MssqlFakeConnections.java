package org.lowcoder.plugin.mssql;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

/**
 * Test support for the MSSQL result and executor units (task L5-5a): a {@link FakeJdbc} result set that also answers
 * {@code getTimestamp(int)} (which {@code MssqlResultParser} calls for the datetime types and {@code FakeJdbc} does not
 * implement), and the never-started pool wrapper the executor runs on (the same shape as
 * {@code PostgresResultContractTest.wrap}).
 *
 * <p>Limits: public only because the parser test lives in another package; a {@code getTimestamp} cell must be a {@link Timestamp}; any other call goes to {@code FakeJdbc} unchanged.
 */
public final class MssqlFakeConnections {

    private MssqlFakeConnections() {
    }

    /** A {@code FakeJdbc} result set of {@code rows} that also reads timestamp cells through {@code getTimestamp}. */
    public static ResultSet resultSet(List<Column> columns, List<List<Object>> rows) {
        ResultSet delegate = FakeJdbc.resultSet(columns, rows);
        return (ResultSet) Proxy.newProxyInstance(MssqlFakeConnections.class.getClassLoader(), new Class<?>[] {ResultSet.class}, (self, method, args) -> {
            if (method.getName().equals("getTimestamp") && args.length == 1) {
                return (Timestamp) delegate.getObject((int) args[0]);
            }
            try {
                return method.invoke(delegate, args);
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        });
    }

    /** A data source that is never started: it reports running with an idle pool and hands out {@code connection}. */
    public static HikariPerfWrapper wrap(Connection connection) {
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
}

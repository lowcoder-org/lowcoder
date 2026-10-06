package org.lowcoder.plugin.sql;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * BF-025: an executor whose {@code rollsBackEveryQuery} answers true runs each query in a transaction it rolls back, so a
 * driver that ignores {@code Connection.setReadOnly} (SQL Server; H2 too, which makes it a fair stand-in here) keeps no write.
 * The pool (one connection) hands out H2 connections through a proxy that counts the physical connections, records the
 * transaction calls and can make {@code rollback} fail.
 */
public class SqlBasedQueryExecutorRollbackTest {

    static final String TABLE_DDL = "create table item (id int primary key)";
    static final String INSERT = "insert into item (id) values (1)";
    static final String COUNT = "select count(1) as count from item";
    static final String FAILING_QUERY = "insert into no_such_table (id) values (1)";
    static final String ROLLBACK_FAILURE = "rollback failed on purpose";
    static final String SET_AUTO_COMMIT = "setAutoCommit";
    static final String ROLLBACK = "rollback";
    static final String AFFECTED_ROWS = "affectedRows";
    static final int POOL_SIZE = 1;

    private String url;
    private Connection reader;
    private HikariPerfWrapper pool;
    private final List<String> calls = new CopyOnWriteArrayList<>();
    private final AtomicInteger opened = new AtomicInteger();
    private volatile boolean recording;
    private volatile boolean failRollback;

    @BeforeEach
    void setUp() {
        url = H2SqlTestSupport.newUrl("rollback");
        reader = H2SqlTestSupport.open(url);
        H2SqlTestSupport.run(reader, TABLE_DDL);
        pool = new RecordingConnector().blockingCreateConnection(new H2SqlTestSupport.H2Config("h", "d", false, null));
    }

    @AfterEach
    void tearDown() throws SQLException {
        new RecordingConnector().blockingDestroyConnection(pool);
        reader.close();
    }

    private QueryExecutionResult execute(boolean rollsBack, String sql) {
        recording = true;
        try {
            return new RollbackExecutor(rollsBack).blockingExecuteQuery(pool,
                    SqlBasedQueryExecutionContext.builder().query(sql).requestParams(Map.of()).build());
        } finally {
            recording = false;
            System.out.println("[SqlBasedQueryExecutorRollbackTest] rollsBack=" + rollsBack + " '" + sql + "' -> calls " + calls
                    + ", physical connections opened " + opened.get());
        }
    }

    private long rowCount() {
        return ((Number) H2SqlTestSupport.scalar(reader, COUNT)).longValue();
    }

    /** Auto-commit off and the rollback by the executor, then auto-commit back on by the pool when the connection is returned. */
    static final List<String> ROLLBACK_CALLS = List.of(SET_AUTO_COMMIT + "(false)", ROLLBACK, SET_AUTO_COMMIT + "(true)");

    @Test
    public void aWriteIsRolledBackButItsAffectedRowsAreStillReported() {
        QueryExecutionResult result = execute(true, INSERT);

        assertEquals(1, ((Map<?, ?>) result.getData()).get(AFFECTED_ROWS), "the answer of the rolled-back statement: " + result.getData());
        assertEquals(0L, rowCount(), "nothing the query wrote is kept");
        assertEquals(ROLLBACK_CALLS, calls);
    }

    /** The executor relies on the pool to turn auto-commit back on: a later auto-commit query on the same connection keeps its write. */
    @Test
    public void theConnectionGoesBackToThePoolWithAutoCommitOn() {
        execute(true, INSERT);
        execute(false, INSERT);

        assertEquals(1L, rowCount(), "the second insert was committed");
        assertEquals(1, opened.get(), "both queries ran on the one pooled connection");
    }

    @Test
    public void aReadStillAnswersWhenEveryQueryIsRolledBack() {
        H2SqlTestSupport.run(reader, INSERT);

        assertEquals(List.of(Map.of("count", 1L)), execute(true, COUNT).getData());
    }

    @Test
    public void aWriteIsKeptWhenThePoolDoesNotRollBack() {
        execute(false, INSERT);

        assertEquals(1L, rowCount(), "the default keeps the write");
        assertTrue(calls.stream().noneMatch(ROLLBACK::equals), "no rollback by default: " + calls);
    }

    @Test
    public void aFailingQueryIsRolledBackAndKeepsItsOwnError() {
        PluginException thrown = assertThrows(PluginException.class, () -> execute(true, FAILING_QUERY));

        System.out.println("[SqlBasedQueryExecutorRollbackTest] query failure: " + thrown.getMessage());
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertTrue(thrown.getMessage().contains("NO_SUCH_TABLE") || thrown.getMessage().contains("no_such_table"),
                "the query's own error: " + thrown.getMessage());
        assertEquals(ROLLBACK_CALLS, calls);
        assertEquals(0L, rowCount());
    }

    /** A connection whose rollback failed may still hold the transaction, so it is evicted and the next query gets a new one. */
    private void assertTheNextQueryRunsOnANewConnection() {
        failRollback = false;
        assertEquals(List.of(Map.of("count", 0L)), execute(true, COUNT).getData(), "the pool still answers");
        assertEquals(2, opened.get(), "the connection whose rollback failed was evicted");
    }

    @Test
    public void aRollbackFailureAfterASuccessfulQueryIsTheQueryError() {
        failRollback = true;

        PluginException thrown = assertThrows(PluginException.class, () -> execute(true, INSERT));

        System.out.println("[SqlBasedQueryExecutorRollbackTest] rollback failure: " + thrown.getMessage());
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertTrue(thrown.getMessage().contains(ROLLBACK_FAILURE), "the rollback failure is reported: " + thrown.getMessage());
        assertTheNextQueryRunsOnANewConnection();
    }

    @Test
    public void aRollbackFailureAfterAFailingQueryIsSuppressedOnTheQueryError() {
        failRollback = true;

        PluginException thrown = assertThrows(PluginException.class, () -> execute(true, FAILING_QUERY));

        System.out.println("[SqlBasedQueryExecutorRollbackTest] query failure " + thrown.getMessage() + ", suppressed "
                + Arrays.toString(thrown.getSuppressed()));
        assertTrue(!thrown.getMessage().contains(ROLLBACK_FAILURE), "the query's own error stays first: " + thrown.getMessage());
        assertTrue(Arrays.stream(thrown.getSuppressed()).anyMatch(e -> ROLLBACK_FAILURE.equals(e.getMessage())),
                "the rollback failure is kept as suppressed");
        assertTheNextQueryRunsOnANewConnection();
    }

    /** The test executor with a fixed answer to {@code rollsBackEveryQuery}. */
    private static final class RollbackExecutor extends H2SqlTestSupport.H2Executor {

        private final boolean rollsBack;

        RollbackExecutor(boolean rollsBack) {
            super(new GeneralSqlExecutor());
            this.rollsBack = rollsBack;
        }

        @Override
        protected boolean rollsBackEveryQuery(com.zaxxer.hikari.HikariDataSource dataSource) {
            return rollsBack;
        }
    }

    /** A connector whose pool takes its connections from {@link RecordingDataSource}. */
    private final class RecordingConnector extends H2SqlTestSupport.H2Connector {

        RecordingConnector() {
            super(url, H2SqlTestSupport.H2_DRIVER, "SqlBasedQueryExecutorRollbackTest", POOL_SIZE);
        }

        @Override
        protected void setUpConfigs(H2SqlTestSupport.H2Config datasourceConfig, HikariConfig config) {
            config.setDataSource(new RecordingDataSource());
        }
    }

    /** H2 connections whose transaction calls are recorded while a query runs, and whose rollback can be made to fail. */
    private final class RecordingDataSource implements DataSource {

        @Override
        public Connection getConnection() {
            Connection target = H2SqlTestSupport.open(url);
            opened.incrementAndGet();
            return (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[]{Connection.class},
                    (proxy, method, args) -> {
                        if (recording && SET_AUTO_COMMIT.equals(method.getName())) {
                            calls.add(SET_AUTO_COMMIT + "(" + args[0] + ")");
                        }
                        if (recording && ROLLBACK.equals(method.getName()) && method.getParameterCount() == 0) {
                            calls.add(ROLLBACK);
                            if (failRollback) {
                                throw new SQLException(ROLLBACK_FAILURE);
                            }
                        }
                        try {
                            return method.invoke(target, args);
                        } catch (InvocationTargetException e) {
                            throw e.getCause();
                        }
                    });
        }

        @Override
        public Connection getConnection(String username, String password) {
            return getConnection();
        }

        @Override
        public PrintWriter getLogWriter() {
            return null;
        }

        @Override
        public void setLogWriter(PrintWriter out) {
        }

        @Override
        public void setLoginTimeout(int seconds) {
        }

        @Override
        public int getLoginTimeout() {
            return 0;
        }

        @Override
        public Logger getParentLogger() throws SQLFeatureNotSupportedException {
            throw new SQLFeatureNotSupportedException();
        }

        @Override
        public <T> T unwrap(Class<T> iface) throws SQLException {
            throw new SQLException("not a wrapper");
        }

        @Override
        public boolean isWrapperFor(Class<?> iface) {
            return false;
        }
    }
}

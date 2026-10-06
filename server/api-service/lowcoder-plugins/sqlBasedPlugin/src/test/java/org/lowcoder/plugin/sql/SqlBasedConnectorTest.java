package org.lowcoder.plugin.sql;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import javax.management.MBeanServer;
import javax.management.ObjectName;
import java.lang.management.ManagementFactory;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.sql.H2SqlTestSupport.assertPluginError;
import static org.lowcoder.sdk.exception.PluginCommonError.CONNECTION_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit SB-6 (task L5-1): {@link SqlBasedConnector} and the pool-state parts of {@link SqlBasedQueryExecutor} on H2:
 * pool creation, ext-param filtering, test and destroy (observed through the pool's JMX registration, which Hikari
 * removes on close), the unknown driver, {@code validateConfig}, a closed pool and the structure call.
 * Finding checked here: defect D3 (NPE on a null host) does not apply to this class, because
 * {@code SqlBasedDatasourceConnectionConfig.getHost()} returns the host trimmed to the empty string.
 */
public class SqlBasedConnectorTest {

    static final int POOL_SIZE = 3;
    static final String VALID_PROPERTY = "IGNORECASE";
    static final String HOST_EMPTY = "HOST_EMPTY_PLZ_CHECK";
    static final String HOST_COLON = "HOST_WITH_COLON";
    static final String DATABASE_EMPTY = "DATABASE_NAME_EMPTY";
    static final String CLOSED_MESSAGE = "hikari datasource closed.";
    static final String CLOSE_FAILURE = "close failed on purpose";
    static final String VALID_HOST = "db.example.org";
    static final String VALID_DATABASE = "app";

    private static final MBeanServer MBEANS = ManagementFactory.getPlatformMBeanServer();

    private final H2SqlTestSupport.H2Executor executor = new H2SqlTestSupport.H2Executor(new GeneralSqlExecutor());

    private static H2SqlTestSupport.H2Connector connector(String poolName) {
        return new H2SqlTestSupport.H2Connector(H2SqlTestSupport.newUrl("connector"), H2SqlTestSupport.H2_DRIVER, poolName, POOL_SIZE);
    }

    private static H2SqlTestSupport.H2Config config(Map<String, Object> extParams) {
        return new H2SqlTestSupport.H2Config(VALID_HOST, VALID_DATABASE, false, extParams);
    }

    private static boolean poolRegistered(String poolName) throws Exception {
        return MBEANS.isRegistered(new ObjectName("com.zaxxer.hikari:type=Pool (" + poolName + ")"));
    }

    private static SqlBasedQueryExecutionContext select(String sql) {
        return SqlBasedQueryExecutionContext.builder().query(sql).requestParams(Map.of()).build();
    }

    @Test
    public void createdPoolRunsAgainstH2AndAppliesTheConnectorSettings() throws Exception {
        String poolName = "SqlBasedConnectorTest-create";
        H2SqlTestSupport.H2Connector connector = connector(poolName);
        HikariPerfWrapper wrapper = connector.blockingCreateConnection(config(null));
        try {
            HikariDataSource dataSource = (HikariDataSource) wrapper.getHikariDataSource();
            assertTrue(dataSource.isRunning());
            assertEquals(H2SqlTestSupport.H2_DRIVER, dataSource.getDriverClassName());
            assertEquals(POOL_SIZE, dataSource.getMaximumPoolSize(), "the constructor's pool size must reach Hikari");
            assertTrue(poolRegistered(poolName), "a live pool is registered");
            assertEquals(List.of(Map.of("one", 1)), executor.blockingExecuteQuery(wrapper, select("select 1 as one")).getData());
            System.out.println("[SqlBasedConnectorTest] pool running, driver " + dataSource.getDriverClassName() + ", max size "
                    + dataSource.getMaximumPoolSize() + ", idle " + wrapper.getIdleConnections());
        } finally {
            connector.blockingDestroyConnection(wrapper);
        }
    }

    @Test
    public void blankAndNullExtParamsAreSkippedAndAValidOneIsPassedOn() {
        Map<String, Object> ext = new LinkedHashMap<>();
        ext.put("", "ignored-by-blank-key");
        ext.put("  ", "ignored-by-blank-key");
        ext.put("NULL_VALUE", null);
        ext.put("BLANK_VALUE", "   ");
        ext.put(VALID_PROPERTY, "TRUE");
        H2SqlTestSupport.H2Connector connector = connector("SqlBasedConnectorTest-ext");
        HikariPerfWrapper wrapper = connector.blockingCreateConnection(config(ext));
        try {
            assertEquals(Set.of(VALID_PROPERTY), wrapper.getDatasourceProperties().keySet());
            assertEquals("TRUE", wrapper.getDatasourceProperties().get(VALID_PROPERTY));
            System.out.println("[SqlBasedConnectorTest] data source properties: " + wrapper.getDatasourceProperties());
        } finally {
            connector.blockingDestroyConnection(wrapper);
        }
    }

    @Test
    public void testConnectionSucceedsAndClosesItsPool() throws Exception {
        String poolName = "SqlBasedConnectorTest-test";
        DatasourceTestResult result = connector(poolName).testConnection(config(null)).block();
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertFalse(poolRegistered(poolName), "the pool made for a test must be closed (leak)");
        System.out.println("[SqlBasedConnectorTest] test connection succeeded, pool closed");
    }

    @Test
    public void destroyConnectionIsSafeForNullAndClosesARealPool() throws Exception {
        String poolName = "SqlBasedConnectorTest-destroy";
        H2SqlTestSupport.H2Connector connector = connector(poolName);
        connector.destroyConnection(null).block();
        HikariPerfWrapper wrapper = connector.blockingCreateConnection(config(null));
        connector.destroyConnection(wrapper).block();
        assertTrue(((HikariDataSource) wrapper.getHikariDataSource()).isClosed());
        assertFalse(poolRegistered(poolName));
        System.out.println("[SqlBasedConnectorTest] destroy(null) safe, destroy(pool) closed it");
    }

    @Test
    public void unknownDriverIsLoadSqlJdbcError() {
        H2SqlTestSupport.H2Connector connector = new H2SqlTestSupport.H2Connector(H2SqlTestSupport.newUrl("nodriver"), "no.such.Driver",
                "SqlBasedConnectorTest-nodriver", POOL_SIZE);
        assertPluginError(QUERY_EXECUTION_ERROR, "LOAD_SQL_JDBC_ERROR", () -> connector.blockingCreateConnection(config(null)));
    }

    @Test
    public void validateConfigNamesEachInvalidField() {
        H2SqlTestSupport.H2Connector connector = connector("SqlBasedConnectorTest-validate");
        assertEquals(Set.of(), connector.validateConfig(new H2SqlTestSupport.H2Config(VALID_HOST, VALID_DATABASE, false, null)));
        assertEquals(Set.of(HOST_COLON), connector.validateConfig(new H2SqlTestSupport.H2Config("db:5432", VALID_DATABASE, false, null)));
        assertEquals(Set.of(HOST_COLON), connector.validateConfig(new H2SqlTestSupport.H2Config("db/app", VALID_DATABASE, false, null)));
        assertEquals(Set.of(DATABASE_EMPTY), connector.validateConfig(new H2SqlTestSupport.H2Config(VALID_HOST, " ", false, null)));
        assertEquals(Set.of(HOST_EMPTY), connector.validateConfig(new H2SqlTestSupport.H2Config("  ", VALID_DATABASE, false, null)));
        assertEquals(Set.of(HOST_COLON, DATABASE_EMPTY), connector.validateConfig(new H2SqlTestSupport.H2Config("a:b/c", "", false, null)));
        System.out.println("[SqlBasedConnectorTest] validateConfig: each invalid field gives its own message key");
    }

    /**
     * Defect D3 (a blank host adds HOST_EMPTY and then {@code host.contains} throws a NullPointerException) does not apply
     * here: the config's {@code getHost()} trims null to "", so a null host gives only HOST_EMPTY_PLZ_CHECK. Pins that.
     */
    @Test
    public void nullHostAndNullDatabaseGiveOnlyTheEmptyMessages() {
        H2SqlTestSupport.H2Connector connector = connector("SqlBasedConnectorTest-nullhost");
        Set<String> invalids = connector.validateConfig(new H2SqlTestSupport.H2Config(null, null, false, null));
        assertEquals(Set.of(HOST_EMPTY, DATABASE_EMPTY), invalids);
        System.out.println("[SqlBasedConnectorTest] null host and database: " + invalids + " (no NullPointerException)");
    }

    @Test
    public void executingOnAClosedPoolIsAConnectionErrorNotAHang() {
        H2SqlTestSupport.H2Connector connector = connector("SqlBasedConnectorTest-closed");
        HikariPerfWrapper wrapper = connector.blockingCreateConnection(config(null));
        connector.blockingDestroyConnection(wrapper);
        PluginException thrown = assertPluginError(CONNECTION_ERROR, "CONNECTION_ERROR", () -> executor.blockingExecuteQuery(wrapper, select("select 1")));
        assertEquals(CLOSED_MESSAGE, thrown.getArgs()[0], "the executor's own check must answer, not the driver's");
        PluginException structure = assertPluginError(CONNECTION_ERROR, "CONNECTION_ERROR",
                () -> executor.blockingGetStructure(wrapper, config(null)));
        assertEquals(CLOSED_MESSAGE, structure.getArgs()[0]);
        System.out.println("[SqlBasedConnectorTest] closed pool: " + thrown.getArgs()[0]);
    }

    @Test
    public void aMissingDataSourceIsAConnectionErrorForStructure() {
        HikariPerfWrapper wrapper = HikariPerfWrapper.wrap(null, () -> 0, () -> 0, () -> 0, () -> 0, java.util.Properties::new, java.util.Properties::new);
        PluginException thrown = assertPluginError(CONNECTION_ERROR, "CONNECTION_ERROR", () -> executor.blockingGetStructure(wrapper, config(null)));
        assertEquals(CLOSED_MESSAGE, thrown.getArgs()[0]);
    }

    /** A pool that was never started is neither closed nor running; the executor refuses it before asking for a connection. */
    @Test
    public void aPoolThatWasNeverStartedIsAConnectionErrorForStructure() {
        try (HikariDataSource neverStarted = new HikariDataSource()) {
            System.out.println("[SqlBasedConnectorTest] never started: closed " + neverStarted.isClosed() + ", running " + neverStarted.isRunning());
            assertFalse(neverStarted.isClosed(), "the case is the not-running branch, not the closed one");
            assertFalse(neverStarted.isRunning(), "a pool that was never started does not run");
            HikariPerfWrapper wrapper = HikariPerfWrapper.wrap(neverStarted, () -> 0, () -> 0, () -> 0, () -> 0, java.util.Properties::new, java.util.Properties::new);
            PluginException thrown = assertPluginError(CONNECTION_ERROR, "CONNECTION_ERROR", () -> executor.blockingGetStructure(wrapper, config(null)));
            assertEquals(CLOSED_MESSAGE, thrown.getArgs()[0]);
        }
    }

    /**
     * A connection that fails to close when the structure call hands it back turns the call into a query error. The test
     * executor's structure is a fixed empty one that does not use the connection, so only the close is exercised here.
     */
    @Test
    public void aConnectionThatFailsToCloseWhenHandedBackIsAQueryErrorForStructure() {
        Connection failsToClose = (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[] {Connection.class},
                (self, method, args) -> {
                    if ("close".equals(method.getName())) {
                        throw new SQLException(CLOSE_FAILURE);
                    }
                    throw new UnsupportedOperationException("Connection." + method.getName());
                });
        try (HikariDataSource running = new HikariDataSource() {
            @Override
            public Connection getConnection() {
                return failsToClose;
            }

            @Override
            public boolean isRunning() {
                return true;
            }
        }) {
            HikariPerfWrapper wrapper = HikariPerfWrapper.wrap(running, () -> 0, () -> 0, () -> 0, () -> 0, java.util.Properties::new, java.util.Properties::new);
            PluginException thrown = assertPluginError(QUERY_EXECUTION_ERROR, H2SqlTestSupport.QUERY_ERROR_KEY,
                    () -> executor.blockingGetStructure(wrapper, config(null)));
            System.out.println("[SqlBasedConnectorTest] close failure: " + thrown.getMessage());
            assertEquals(CLOSE_FAILURE, thrown.getArgs()[0]);
        }
    }

    @Test
    public void getStructureReturnsTheSubclassStructureAndReturnsTheConnection() {
        H2SqlTestSupport.H2Connector connector = connector("SqlBasedConnectorTest-structure");
        HikariPerfWrapper wrapper = connector.blockingCreateConnection(config(null));
        try {
            DatasourceStructure structure = executor.blockingGetStructure(wrapper, config(null));
            assertEquals(List.of(), structure.getTables());
            assertEquals(0, wrapper.getActiveConnections(), "the structure call must hand its connection back");
            System.out.println("[SqlBasedConnectorTest] structure " + structure + ", active connections " + wrapper.getActiveConnections());
        } finally {
            connector.blockingDestroyConnection(wrapper);
        }
    }
}

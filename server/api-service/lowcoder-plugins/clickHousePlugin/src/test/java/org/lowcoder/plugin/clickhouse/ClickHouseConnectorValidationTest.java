package org.lowcoder.plugin.clickhouse;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.clickhouse.model.ClickHouseDatasourceConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit CH-1 (task L5-3), no server: {@link ClickHouseConnector#validateConfig} and
 * {@link ClickHouseQueryExecutor#buildQueryExecutionContext}.
 */
public class ClickHouseConnectorValidationTest {

    static final String VALID_HOST = "ch.example.org";
    static final String VALID_DATABASE = "app";
    static final String HOST_EMPTY = "HOST_EMPTY";
    static final String HOST_COLON = "HOST_WITH_COLON";
    static final String INVALID_HOST = "INVALID_HOST";
    static final String DATABASE_EMPTY = "DATABASE_NAME_EMPTY";

    private final ClickHouseConnector connector = new ClickHouseConnector(new ConfigCenterForTest());
    private final ClickHouseQueryExecutor executor = new ClickHouseQueryExecutor(new ConfigCenterForTest());

    private static ClickHouseDatasourceConfig datasource(String host, String database, boolean enableTurnOffPreparedStatement) {
        return ClickHouseDatasourceConfig.builder().host(host).database(database).enableTurnOffPreparedStatement(enableTurnOffPreparedStatement).build();
    }

    private Set<String> invalids(String host, String database) {
        return connector.validateConfig(datasource(host, database, false));
    }

    private SqlBasedQueryExecutionContext build(boolean datasourceSwitch, Map<String, Object> queryConfig) {
        return executor.buildQueryExecutionContext(datasource(VALID_HOST, VALID_DATABASE, datasourceSwitch), queryConfig, Map.of("x", 1), null);
    }

    @Test
    public void validateConfigNamesEachInvalidField() {
        assertEquals(Set.of(), invalids(VALID_HOST, VALID_DATABASE));
        assertEquals(Set.of(HOST_COLON), invalids("ch:8123", VALID_DATABASE));
        assertEquals(Set.of(HOST_COLON), invalids("ch/db", VALID_DATABASE));
        for (String loopback : new String[] {"localhost", "LOCALHOST", "127.0.0.1"}) {
            assertEquals(Set.of(INVALID_HOST), invalids(loopback, VALID_DATABASE), loopback);
        }
        for (String notLoopback : new String[] {"127.0.0.2", "localhost.example.org"}) {
            assertEquals(Set.of(), invalids(notLoopback, VALID_DATABASE), notLoopback);
        }
        assertEquals(Set.of(DATABASE_EMPTY), invalids(VALID_HOST, " "));
        assertEquals(Set.of(HOST_EMPTY), invalids("  ", VALID_DATABASE));
        System.out.println("[ClickHouseConnectorValidationTest] validateConfig: one message key per invalid field");
    }

    /**
     * Defect D3 (a null host adds HOST_EMPTY and then {@code host.contains} throws a NullPointerException) does not
     * reproduce: the config's {@code getHost()} trims null to "", so a null host gives only HOST_EMPTY.
     */
    @Test
    public void nullHostAndDatabaseGiveOnlyTheEmptyMessages_d3DoesNotApply() {
        Set<String> invalids = invalids(null, null);
        assertEquals(Set.of(HOST_EMPTY, DATABASE_EMPTY), invalids);
        System.out.println("[ClickHouseConnectorValidationTest] null host and database: " + invalids + " (no NullPointerException)");
    }

    @Test
    public void buildContextRemovesCommentsAndKeepsTheParameters() {
        SqlBasedQueryExecutionContext context = build(false, Map.of("sql", "select 1 -- {{x}}\n from t"));
        System.out.println("[ClickHouseConnectorValidationTest] query after comment removal: [" + context.getQuery() + "]");
        assertFalse(context.getQuery().contains("{{"));
        assertTrue(context.getQuery().contains("from t"));
        assertEquals(Map.of("x", 1), context.getRequestParams());
        assertFalse(context.isDisablePreparedStatement());
    }

    @Test
    public void blankOrCommentOnlySqlIsSqlEmpty() {
        for (String sql : new String[] {"", "   ", "-- only a comment {{x}}"}) {
            PluginException thrown = assertThrows(PluginException.class, () -> build(false, Map.of("sql", sql)));
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals("SQL_EMPTY", thrown.getMessageKey());
        }
    }

    @Test
    public void disablePreparedStatementNeedsTheDatasourceSwitch() {
        Map<String, Object> disabled = Map.of("sql", "select {{x}}", "disablePreparedStatement", true);
        PluginException thrown = assertThrows(PluginException.class, () -> build(false, disabled));
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals("CLICKHOUSE_PS_ERROR", thrown.getMessageKey());
        assertTrue(build(true, disabled).isDisablePreparedStatement(), "both set: prepared statements are off");
        assertFalse(build(true, Map.of("sql", "select {{x}}")).isDisablePreparedStatement(), "the datasource switch alone changes nothing");
        System.out.println("[ClickHouseConnectorValidationTest] query flag without the datasource switch: " + thrown.getMessageKey());
    }

    /**
     * BF-093 (the plan section 9 row on {@code SqlQueryConfig.getSql()}, also for {@code ClickHouseQueryConfig}; was pinned):
     * a query config without a {@code sql} key is SQL_EMPTY, like a blank query, instead of a NullPointerException.
     */
    @Test
    public void configWithoutSqlKeyIsSqlEmptyBF093() {
        PluginException thrown = assertThrows(PluginException.class, () -> build(false, Map.of("disablePreparedStatement", false)));
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals("SQL_EMPTY", thrown.getMessageKey());
        System.out.println("[ClickHouseConnectorValidationTest] no sql key: " + thrown.getMessageKey());
    }
}

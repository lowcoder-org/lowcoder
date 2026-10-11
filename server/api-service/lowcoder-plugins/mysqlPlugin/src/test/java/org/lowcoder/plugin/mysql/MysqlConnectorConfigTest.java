package org.lowcoder.plugin.mysql;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit MY-2 (task L5-2): what {@link MysqlConnector#setUpConfigs} puts on the Hikari config for each datasource flag,
 * without a server (the fast guard next to the container tests of {@code MysqlDatabaseTest}).
 */
public class MysqlConnectorConfigTest {

    static final String HOST = "db.example.org";
    static final long PORT = 3307L;
    static final String DATABASE = "app";
    static final String USER = "appuser";
    static final String PASSWORD = "secret";
    static final String DRIVER = "com.mysql.cj.jdbc.Driver";
    static final String TRUE = "true";
    static final String FALSE = "false";

    private final MysqlConnector connector = new MysqlConnector();

    private HikariConfig configured(String database, String username, String password, Long port, boolean ssl, boolean readonly) {
        MysqlDatasourceConfig datasource = new MysqlDatasourceConfig(database, username, password, HOST, port, ssl, null, readonly, false, null);
        HikariConfig config = new HikariConfig();
        connector.setUpConfigs(datasource, config);
        return config;
    }

    @Test
    public void jdbcUrlAndCredentialsFollowTheConfig() {
        HikariConfig config = configured(DATABASE, USER, PASSWORD, PORT, false, false);
        assertEquals("jdbc:mysql://" + HOST + ":" + PORT + "/" + DATABASE, config.getJdbcUrl());
        assertEquals(USER, config.getUsername());
        assertEquals(PASSWORD, config.getPassword());
        System.out.println("[MysqlConnectorConfigTest] url " + config.getJdbcUrl() + ", user " + config.getUsername());
    }

    @Test
    public void blankDatabaseDefaultPortAndBlankCredentialsAreHandled() {
        HikariConfig config = configured(" ", "", null, null, false, false);
        assertEquals("jdbc:mysql://" + HOST + ":3306/", config.getJdbcUrl(), "blank database gives an empty path, no port gives 3306");
        assertNull(config.getUsername(), "an empty user name must not be set");
        assertNull(config.getPassword(), "a null password must not be set");
        System.out.println("[MysqlConnectorConfigTest] blank database / default port url " + config.getJdbcUrl());
    }

    @Test
    public void sslFlagMapsToUseSslAndRequireSsl() {
        Properties on = configured(DATABASE, USER, PASSWORD, PORT, true, false).getDataSourceProperties();
        Properties off = configured(DATABASE, USER, PASSWORD, PORT, false, false).getDataSourceProperties();
        assertEquals(TRUE, on.get("useSSL"));
        assertEquals(TRUE, on.get("requireSSL"));
        assertEquals(FALSE, off.get("useSSL"));
        assertEquals(FALSE, off.get("requireSSL"));
        System.out.println("[MysqlConnectorConfigTest] ssl on " + on + " ; ssl off " + off);
    }

    @Test
    public void fixedDriverPropertiesAreSetForBothSslSettings() {
        for (boolean ssl : new boolean[] {false, true}) {
            Properties properties = configured(DATABASE, USER, PASSWORD, PORT, ssl, false).getDataSourceProperties();
            assertEquals("convertToNull", properties.get("zeroDateTimeBehavior"), "ssl " + ssl);
            assertEquals(TRUE, properties.get("allowMultiQueries"), "ssl " + ssl);
        }
        assertEquals(DRIVER, connector.getJdbcDriver());
        System.out.println("[MysqlConnectorConfigTest] zeroDateTimeBehavior and allowMultiQueries set, driver " + connector.getJdbcDriver());
    }

    @Test
    public void readonlyFlagMapsToHikariReadOnly() {
        assertTrue(configured(DATABASE, USER, PASSWORD, PORT, false, true).isReadOnly());
        assertFalse(configured(DATABASE, USER, PASSWORD, PORT, false, false).isReadOnly());
    }
}

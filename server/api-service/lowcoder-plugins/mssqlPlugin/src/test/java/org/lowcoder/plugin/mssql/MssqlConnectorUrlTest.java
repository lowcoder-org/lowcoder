package org.lowcoder.plugin.mssql;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;

import com.microsoft.sqlserver.jdbc.SQLServerDriver;

import java.sql.DriverPropertyInfo;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit MS-2 (task L5-5a): the JDBC URL and the Hikari settings {@link MssqlConnector#setUpConfigs} builds for each
 * datasource shape, without a server. The URL carries the braced host as {@code serverName} with {@code portNumber} (an
 * instance name drops the port), the optional braced database and {@code encrypt} from the SSL flag; user and password go
 * to Hikari only (BF-027); read-only goes to Hikari. The injection cases are also read back through the driver's own
 * parser ({@code SQLServerDriver.getPropertyInfo}).
 */
public class MssqlConnectorUrlTest {

    static final String HOST = "db.example.org";
    static final String INSTANCE_HOST = "WINBOX\\SQLEXPRESS01";
    static final long PORT = 1444L;
    static final long DEFAULT_PORT = 1433L;
    static final String DATABASE = "shop";
    static final String USER = "sa";
    static final String PASSWORD = "secret";
    static final String DRIVER = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
    static final String PREFIX = "jdbc:sqlserver://";

    private final MssqlConnector connector = new MssqlConnector();

    private static String url(String host, String portAndDatabase) {
        return PREFIX + ";serverName={" + host + "}" + portAndDatabase + ";encrypt=false;";
    }

    /** The properties the SQL Server driver itself reads from the URL. */
    private static Map<String, String> parsed(String jdbcUrl) throws Exception {
        Map<String, String> properties = new LinkedHashMap<>();
        for (DriverPropertyInfo info : new SQLServerDriver().getPropertyInfo(jdbcUrl, new Properties())) {
            properties.put(info.name, info.value);
        }
        return properties;
    }

    private HikariConfig configured(String host, Long port, String database, String username, String password, boolean ssl, boolean readonly) {
        MssqlDatasourceConfig datasource = new MssqlDatasourceConfig(database, username, password, host, port, ssl, null, readonly, false, null);
        HikariConfig config = new HikariConfig();
        connector.setUpConfigs(datasource, config);
        System.out.println("[MssqlConnectorUrlTest] url " + config.getJdbcUrl() + ", user " + config.getUsername() + ", read-only " + config.isReadOnly());
        return config;
    }

    @Test
    public void urlHasHostPortDatabaseAndEncryptOffAndTheCredentialsGoToHikariOnly() {
        HikariConfig config = configured(HOST, PORT, DATABASE, USER, PASSWORD, false, false);
        assertEquals(url(HOST, ";portNumber=" + PORT + ";databaseName={" + DATABASE + "}"), config.getJdbcUrl());
        assertFalse(config.getJdbcUrl().contains(PASSWORD), "no password in the URL");
        assertEquals(USER, config.getUsername());
        assertEquals(PASSWORD, config.getPassword());
        assertEquals(DRIVER, connector.getJdbcDriver());
        assertFalse(config.isReadOnly());
    }

    @Test
    public void missingPortUsesTheDefault1433() {
        assertEquals(url(HOST, ";portNumber=" + DEFAULT_PORT), configured(HOST, null, "", "", null, false, false).getJdbcUrl());
    }

    @Test
    public void instanceNameInTheHostDropsThePort() {
        HikariConfig config = configured(INSTANCE_HOST, PORT, DATABASE, USER, PASSWORD, false, false);
        assertEquals(url(INSTANCE_HOST, ";databaseName={" + DATABASE + "}"), config.getJdbcUrl());
        assertFalse(config.getJdbcUrl().contains(String.valueOf(PORT)), "the port must not appear next to an instance name");
    }

    @Test
    public void blankDatabaseUserAndPasswordAreLeftOutOfTheUrl() {
        HikariConfig blank = configured(HOST, PORT, "  ", "  ", "  ", false, false);
        assertEquals(url(HOST, ";portNumber=" + PORT), blank.getJdbcUrl(), "a blank database is not in the URL");
        assertNull(blank.getUsername(), "a blank user trims to empty and is not set");
        assertEquals("  ", blank.getPassword(), "a blank, not empty, password is still set on Hikari (only the URL checks blank)");
        HikariConfig none = configured(HOST, PORT, null, null, null, false, false);
        assertEquals(url(HOST, ";portNumber=" + PORT), none.getJdbcUrl());
        assertNull(none.getUsername());
        assertNull(none.getPassword());
    }

    @Test
    public void sslFlagBecomesEncryptAndReadonlyGoesToHikari() {
        HikariConfig on = configured(HOST, PORT, DATABASE, USER, PASSWORD, true, true);
        assertTrue(on.getJdbcUrl().endsWith(";encrypt=true;"), on.getJdbcUrl());
        assertTrue(on.isReadOnly());
        HikariConfig off = configured(HOST, PORT, DATABASE, USER, PASSWORD, false, false);
        assertTrue(off.getJdbcUrl().endsWith(";encrypt=false;"), off.getJdbcUrl());
        assertFalse(off.isReadOnly());
    }

    /**
     * BF-027 (defect D4): a password with {@code ;} is no longer in the URL, so it cannot add properties; Hikari hands it to
     * the driver unchanged, closing brace included.
     */
    @Test
    public void passwordWithSemicolonOrBraceStaysOutOfTheUrlBF027() throws Exception {
        for (String password : List.of("p;encrypt=false", "a}b;c")) {
            HikariConfig config = configured(HOST, PORT, DATABASE, USER, password, true, false);
            assertEquals(PREFIX + ";serverName={" + HOST + "};portNumber=" + PORT + ";databaseName={" + DATABASE + "};encrypt=true;", config.getJdbcUrl());
            assertEquals(password, config.getPassword());
            assertEquals("true", parsed(config.getJdbcUrl()).get("encrypt"), "the driver reads one encrypt property, the real one");
        }
    }

    /**
     * BF-027: a host or database with {@code ;}, {@code =} and {@code }} is one braced property value; the driver reads it back
     * unchanged and sees no injected property.
     */
    @Test
    public void hostAndDatabaseWithSemicolonsAreReadBackAsOneValueBF027() throws Exception {
        String host = "h;encrypt=false;trustServerCertificate=true";
        String database = "a;b}c;encrypt=false";
        HikariConfig config = configured(host, PORT, database, USER, PASSWORD, true, false);
        Map<String, String> properties = parsed(config.getJdbcUrl());
        System.out.println("[MssqlConnectorUrlTest] injection attempt " + config.getJdbcUrl() + " -> serverName '" + properties.get("serverName")
                + "', databaseName '" + properties.get("databaseName") + "', encrypt " + properties.get("encrypt")
                + ", trustServerCertificate " + properties.get("trustServerCertificate"));
        assertEquals(host, properties.get("serverName"));
        assertEquals(database, properties.get("databaseName"));
        assertEquals("true", properties.get("encrypt"));
        assertEquals("false", properties.get("trustServerCertificate"));
    }

    @Test
    public void bracedDoublesAClosingBrace() {
        assertEquals("{a}}b}", MssqlConnector.braced("a}b"));
        assertEquals("{}", MssqlConnector.braced(""));
    }
}

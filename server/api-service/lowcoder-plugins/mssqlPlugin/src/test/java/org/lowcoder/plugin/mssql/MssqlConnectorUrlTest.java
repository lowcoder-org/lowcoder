package org.lowcoder.plugin.mssql;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit MS-2 (task L5-5a): the JDBC URL and the Hikari settings {@link MssqlConnector#setUpConfigs} builds for each
 * datasource shape, without a server. The URL carries host and port (or the instance name, which drops the port),
 * the optional database, user and password, and {@code encrypt} from the SSL flag; read-only goes to Hikari.
 *
 * <p>Limits: the URL is compared as text; the MSSQL driver is not asked to parse it (that is the container unit
 * MS-4, not part of this task).
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

    private HikariConfig configured(String host, Long port, String database, String username, String password, boolean ssl, boolean readonly) {
        MssqlDatasourceConfig datasource = new MssqlDatasourceConfig(database, username, password, host, port, ssl, null, readonly, false, null);
        HikariConfig config = new HikariConfig();
        connector.setUpConfigs(datasource, config);
        System.out.println("[MssqlConnectorUrlTest] url " + config.getJdbcUrl() + ", user " + config.getUsername() + ", read-only " + config.isReadOnly());
        return config;
    }

    @Test
    public void urlHasHostPortDatabaseCredentialsAndEncryptOff() {
        HikariConfig config = configured(HOST, PORT, DATABASE, USER, PASSWORD, false, false);
        assertEquals(PREFIX + HOST + ":" + PORT + ";databaseName=" + DATABASE + ";user=" + USER + ";password=" + PASSWORD + ";encrypt=false;", config.getJdbcUrl());
        assertEquals(USER, config.getUsername());
        assertEquals(PASSWORD, config.getPassword());
        assertEquals(DRIVER, connector.getJdbcDriver());
        assertFalse(config.isReadOnly());
    }

    @Test
    public void missingPortUsesTheDefault1433() {
        assertEquals(PREFIX + HOST + ":" + DEFAULT_PORT + ";encrypt=false;", configured(HOST, null, "", "", null, false, false).getJdbcUrl());
    }

    @Test
    public void instanceNameInTheHostDropsThePort() {
        HikariConfig config = configured(INSTANCE_HOST, PORT, DATABASE, USER, PASSWORD, false, false);
        assertEquals(PREFIX + INSTANCE_HOST + ";databaseName=" + DATABASE + ";user=" + USER + ";password=" + PASSWORD + ";encrypt=false;", config.getJdbcUrl());
        assertFalse(config.getJdbcUrl().contains(String.valueOf(PORT)), "the port must not appear next to an instance name");
    }

    @Test
    public void blankDatabaseUserAndPasswordAreLeftOutOfTheUrl() {
        HikariConfig blank = configured(HOST, PORT, "  ", "  ", "  ", false, false);
        assertEquals(PREFIX + HOST + ":" + PORT + ";encrypt=false;", blank.getJdbcUrl(), "blank database, user and password are not in the URL");
        assertNull(blank.getUsername(), "a blank user trims to empty and is not set");
        assertEquals("  ", blank.getPassword(), "a blank, not empty, password is still set on Hikari (only the URL checks blank)");
        HikariConfig none = configured(HOST, PORT, null, null, null, false, false);
        assertEquals(PREFIX + HOST + ":" + PORT + ";encrypt=false;", none.getJdbcUrl());
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
     * Pins defect D4 (analysis-plugins section 0.6; plan section 9 row D1-D20): the password (and user) are appended raw
     * into the JDBC URL, so a password containing {@code ;} adds connection properties of its own. Here the password
     * {@code p;encrypt=false} turns the single {@code encrypt} property of an SSL data source into two, the injected
     * {@code false} before the real {@code true}. A fix (wrapping the value in braces with {@code }} doubled) changes this
     * test on purpose. The Hikari password stays the raw text either way.
     */
    @Test
    public void passwordWithSemicolonInjectsConnectionProperties_pinsD4() {
        String injected = "p;encrypt=false";
        HikariConfig config = configured(HOST, PORT, DATABASE, USER, injected, true, false);
        assertEquals(PREFIX + HOST + ":" + PORT + ";databaseName=" + DATABASE + ";user=" + USER + ";password=" + injected + ";encrypt=true;", config.getJdbcUrl());
        List<String> properties = Arrays.asList(config.getJdbcUrl().substring((PREFIX + HOST + ":" + PORT + ";").length()).split(";"));
        System.out.println("[MssqlConnectorUrlTest] D4 properties after the host: " + properties);
        assertEquals(List.of("databaseName=" + DATABASE, "user=" + USER, "password=p", "encrypt=false", "encrypt=true"), properties,
                "the password text is read as two properties, so encrypt appears twice");
        assertEquals(injected, config.getPassword());
        String braces = "a}b;c";
        assertTrue(configured(HOST, PORT, DATABASE, USER, braces, false, false).getJdbcUrl().contains(";password=" + braces + ";"), "a closing brace is not doubled either");
    }
}

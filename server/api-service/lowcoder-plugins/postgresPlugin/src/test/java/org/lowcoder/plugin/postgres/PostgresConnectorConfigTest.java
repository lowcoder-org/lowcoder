package org.lowcoder.plugin.postgres;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Unit PG-3 (task L5-4), no server: what {@link PostgresConnector#setUpConfigs} puts on the Hikari config. */
public class PostgresConnectorConfigTest {

    static final String HOST = "db.example.org";
    static final long PORT = 6543L;
    static final String DATABASE = "app";
    static final String USER = "appuser";
    static final String PASSWORD = "secret";

    private final PostgresConnector connector = new PostgresConnector();

    private HikariConfig configured(String database, String username, String password, Long port, boolean ssl, boolean readonly) {
        PostgresDatasourceConfig datasource = PostgresDatasourceConfig.builder().database(database).username(username).password(password)
                .host(HOST).port(port).usingSsl(ssl).isReadonly(readonly).build();
        HikariConfig config = new HikariConfig();
        connector.setUpConfigs(datasource, config);
        return config;
    }

    @Test
    public void jdbcUrlAndCredentialsFollowTheConfig() {
        HikariConfig config = configured(DATABASE, USER, PASSWORD, PORT, false, false);
        assertEquals("jdbc:postgresql://" + HOST + ":" + PORT + "/" + DATABASE, config.getJdbcUrl());
        assertEquals(USER, config.getUsername());
        assertEquals(PASSWORD, config.getPassword());
        HikariConfig blank = configured(" ", "", null, null, false, false);
        assertEquals("jdbc:postgresql://" + HOST + ":5432/", blank.getJdbcUrl(), "blank database gives an empty path, no port gives 5432");
        assertNull(blank.getUsername());
        assertNull(blank.getPassword());
        System.out.println("[PostgresConnectorConfigTest] url " + config.getJdbcUrl() + " ; blank " + blank.getJdbcUrl());
    }

    @Test
    public void sslFlagMapsToSslAndSslmode() {
        Properties on = configured(DATABASE, USER, PASSWORD, PORT, true, false).getDataSourceProperties();
        Properties off = configured(DATABASE, USER, PASSWORD, PORT, false, false).getDataSourceProperties();
        assertEquals("true", on.get("ssl"));
        assertEquals("require", on.get("sslmode"));
        assertEquals("false", off.get("ssl"));
        assertEquals("disable", off.get("sslmode"));
    }

    @Test
    public void readonlyFlagMapsToHikariAndReadOnlyMode() {
        HikariConfig readonly = configured(DATABASE, USER, PASSWORD, PORT, false, true);
        assertTrue(readonly.isReadOnly());
        assertEquals("always", readonly.getDataSourceProperties().get("readOnlyMode"));
        HikariConfig writable = configured(DATABASE, USER, PASSWORD, PORT, false, false);
        assertFalse(writable.isReadOnly());
        assertNull(writable.getDataSourceProperties().get("readOnlyMode"));
    }

    /**
     * Pins the plan section 9 row "PostgresConnector builds the JDBC URL ... without encoding" (connection-property
     * injection, the same class as D4; D-6: fix deferred): a database name carries driver properties into the URL verbatim.
     * A fix (URL-encoding the name) changes this test on purpose.
     */
    @Test
    public void databaseNameIsPutIntoTheUrlUnencoded() {
        String sslOff = configured("app?ssl=false", USER, PASSWORD, PORT, true, false).getJdbcUrl();
        String second = configured("app?ApplicationName=injected&options=-c%20search_path=evil", USER, PASSWORD, PORT, false, false).getJdbcUrl();
        System.out.println("[PostgresConnectorConfigTest] urls: " + sslOff + " ; " + second);
        assertEquals("jdbc:postgresql://" + HOST + ":" + PORT + "/app?ssl=false", sslOff);
        assertEquals("jdbc:postgresql://" + HOST + ":" + PORT + "/app?ApplicationName=injected&options=-c%20search_path=evil", second);
    }
}

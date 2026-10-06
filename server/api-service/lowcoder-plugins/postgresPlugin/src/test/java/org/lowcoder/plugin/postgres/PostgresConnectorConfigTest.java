package org.lowcoder.plugin.postgres;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.postgresql.Driver;

import java.util.List;
import java.util.Properties;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
     * BF-027 (plan section 9 row "PostgresConnector builds the JDBC URL ... without encoding"): the database name is
     * URL-encoded, and pgjdbc's own parser ({@code Driver.parseURL}) reads it back as the whole name, with no URL parameter.
     */
    @Test
    public void databaseNameIsEncodedAndReadBackWithoutParametersBF027() {
        for (String database : List.of("app?ssl=false", "app?ApplicationName=injected&options=-c%20search_path=evil", "my db+\u00fc/%")) {
            String url = configured(database, USER, PASSWORD, PORT, true, false).getJdbcUrl();
            Properties parsed = Driver.parseURL(url, new Properties());
            System.out.println("[PostgresConnectorConfigTest] database '" + database + "' -> " + url + " -> " + parsed);
            assertEquals(database, parsed.getProperty("PGDBNAME"));
            assertEquals(Set.of("PGHOST", "PGPORT", "PGDBNAME"), parsed.stringPropertyNames(), "no property from the name");
        }
    }

    /**
     * BF-027: a host list ({@code a,b}) would make pgjdbc connect to a second host; it is refused at connect time with
     * {@code INVALID_HOST}, and on save by {@code validateConfig}.
     */
    @Test
    public void aHostListIsRefusedOnConnectAndOnSaveBF027() {
        String hosts = HOST + ",evil.example.org";
        PostgresDatasourceConfig datasource = PostgresDatasourceConfig.builder().database(DATABASE).host(hosts).port(PORT).build();
        System.out.println("[PostgresConnectorConfigTest] pgjdbc reads '" + hosts + "' as " + Driver.parseURL("jdbc:postgresql://" + hosts + ":" + PORT + "/" + DATABASE, new Properties()));

        PluginException thrown = assertThrows(PluginException.class, () -> connector.setUpConfigs(datasource, new HikariConfig()));

        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, thrown.getError());
        assertEquals(PostgresConnector.INVALID_HOST, thrown.getMessageKey());
        assertTrue(connector.validateConfig(datasource).contains(PostgresConnector.INVALID_HOST));
        assertFalse(connector.validateConfig(PostgresDatasourceConfig.builder().database(DATABASE).host(HOST).port(PORT).build())
                .contains(PostgresConnector.INVALID_HOST), "one host is valid");
    }
}

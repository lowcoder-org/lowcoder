package org.lowcoder.plugin.snowflake;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit SN-2 (task L5-7): what {@link SnowflakeConnector#setUpConfigs} puts on the Hikari config: the JDBC URL of the account
 * and the {@code db}, {@code user} and {@code password} data-source properties, without a server.
 *
 * <p>Limits: the URL is compared as text; the Snowflake driver is not asked to parse it (there is no Snowflake account in the
 * tests). The data source form that produces the config is in the client, not here.
 */
public class SnowflakeConnectorConfigTest {

    static final String ACCOUNT = "xy-12345";
    static final String SUFFIX = ".snowflakecomputing.com";
    static final String DATABASE = "analytics";
    static final String USER = "loader";
    static final String PASSWORD = "secret";
    static final String DRIVER = "net.snowflake.client.jdbc.SnowflakeDriver";
    static final String URL_PREFIX = "jdbc:snowflake://";

    private final SnowflakeConnector connector = new SnowflakeConnector();

    private HikariConfig configured(String host, String database, String username, String password) {
        SnowflakeDatasourceConfig datasource = SnowflakeDatasourceConfig.builder().host(host).database(database).username(username).password(password).build();
        HikariConfig config = new HikariConfig();
        connector.setUpConfigs(datasource, config);
        System.out.println("[SnowflakeConnectorConfigTest] url " + config.getJdbcUrl() + ", properties " + describe(config.getDataSourceProperties()));
        return config;
    }

    private static String describe(Properties properties) {
        return new java.util.TreeMap<>(properties).toString();
    }

    @Test
    public void urlIsTheAccountHostAndPropertiesCarryDatabaseUserAndPassword() {
        HikariConfig config = configured(ACCOUNT, DATABASE, USER, PASSWORD);
        assertEquals(URL_PREFIX + ACCOUNT + SUFFIX + "/", config.getJdbcUrl());
        Properties properties = config.getDataSourceProperties();
        assertEquals(DATABASE, properties.get("db"));
        assertEquals(USER, properties.get("user"));
        assertEquals(PASSWORD, properties.get("password"));
        assertEquals(3, properties.size(), "only db, user and password are set");
        assertEquals(DRIVER, connector.getJdbcDriver());
    }

    @Test
    public void hostDatabaseAndUserAreTrimmedByTheConfigAndThePasswordIsNot() {
        HikariConfig config = configured("  " + ACCOUNT + "  ", "  " + DATABASE + " ", " " + USER + " ", " " + PASSWORD + " ");
        assertEquals(URL_PREFIX + ACCOUNT + SUFFIX + "/", config.getJdbcUrl());
        assertEquals(DATABASE, config.getDataSourceProperties().get("db"));
        assertEquals(USER, config.getDataSourceProperties().get("user"));
        assertEquals(" " + PASSWORD + " ", config.getDataSourceProperties().get("password"));
    }

    @Test
    public void blankDatabaseAndUserAreSetAsEmptyStrings() {
        HikariConfig config = configured(ACCOUNT, null, null, PASSWORD);
        assertEquals("", config.getDataSourceProperties().get("db"));
        assertEquals("", config.getDataSourceProperties().get("user"));
    }

    /**
     * Shows what the account host is used for: it is put in front of the suffix as given. An account identifier that already
     * ends in the suffix (the form's help text shows the full host name) gets it twice, and a value with a slash gives a URL
     * with a path inside the host part. Asserted as today's text; reported to the coordinator, no defect claimed here.
     */
    @Test
    public void hostIsUsedAsGivenSoASuffixOrASlashEndsUpInTheUrl() {
        assertEquals(URL_PREFIX + ACCOUNT + SUFFIX + SUFFIX + "/", configured(ACCOUNT + SUFFIX, DATABASE, USER, PASSWORD).getJdbcUrl(), "the suffix is added twice");
        assertEquals(URL_PREFIX + "xy/12345" + SUFFIX + "/", configured("xy/12345", DATABASE, USER, PASSWORD).getJdbcUrl(), "a slash stays in the host part");
        assertEquals(URL_PREFIX + SUFFIX + "/", configured(null, DATABASE, USER, PASSWORD).getJdbcUrl(), "no host gives an empty account");
    }

    /**
     * Pins the plan section 9 row "Snowflake connector NPE on a null password (addDataSourceProperty)" (D-6: fix deferred):
     * the config returns the password as stored, and a data source saved without one (the form's password field is not
     * required, pages/datasource/form.tsx in the client) has {@code null}; {@code HikariConfig.addDataSourceProperty} puts it
     * into a {@code Properties}, which rejects null values, so setting up the pool fails with a bare
     * {@link NullPointerException}. A fix (skipping a null password, as the other connectors do) changes this test on purpose.
     */
    @Test
    public void nullPasswordFailsWithANullPointerException_pinsTheSection9Row() {
        NullPointerException thrown = assertThrows(NullPointerException.class, () -> configured(ACCOUNT, DATABASE, USER, null));
        System.out.println("[SnowflakeConnectorConfigTest] null password: " + thrown + " at " + thrown.getStackTrace()[0] + " / " + thrown.getStackTrace()[1]);
        assertEquals("java.util.concurrent.ConcurrentHashMap", thrown.getStackTrace()[0].getClassName(), "the Properties map of the Hikari config rejects the null value");
        assertEquals("", configured(ACCOUNT, DATABASE, USER, "").getDataSourceProperties().get("password"), "an empty password is accepted");
    }
}

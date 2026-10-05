package org.lowcoder.plugin.oracle;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.oracle.model.OracleDatasourceConfig;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIG_TYPE;

/**
 * Unit OR-2 (task L5-6): the JDBC URL {@link OracleDatasourceConfig#getJdbcUrl()} builds (explicit URL, then SID, then
 * service name), what {@link OracleConnector#setUpConfigs} puts on the Hikari config, {@link OracleConnector#validateConfig}
 * and {@link OracleDatasourceConfig#mergeWithUpdatedConfig}, without a server.
 *
 * <p>Limits: the URL is compared as text; the Oracle driver is not asked to parse it (the real server is the heavy unit
 * OR-3).
 */
public class OracleConnectorConfigTest {

    static final String HOST = "db.example.org";
    static final long PORT = 1522L;
    static final long DEFAULT_PORT = 1521L;
    static final String SID = "ORCL";
    static final String SERVICE = "FREEPDB1";
    static final String USER = "app";
    static final String PASSWORD = "secret";
    static final String EXPLICIT_URL = "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=h)(PORT=1)))";
    static final String DRIVER = "oracle.jdbc.OracleDriver";

    private final OracleConnector connector = new OracleConnector();

    private static OracleDatasourceConfig.OracleDatasourceConfigBuilder<?, ?> builder() {
        return OracleDatasourceConfig.builder().host(HOST).username(USER).password(PASSWORD);
    }

    private HikariConfig configured(OracleDatasourceConfig datasource) {
        HikariConfig config = new HikariConfig();
        connector.setUpConfigs(datasource, config);
        System.out.println("[OracleConnectorConfigTest] url " + config.getJdbcUrl() + ", user " + config.getUsername() + ", read-only " + config.isReadOnly());
        return config;
    }

    @Test
    public void explicitUrlWinsOverSidAndServiceNameAndSidWinsOverServiceName() {
        assertEquals(EXPLICIT_URL, builder().port(PORT).sid(SID).serviceName(SERVICE).jdbcUrl(EXPLICIT_URL).build().getJdbcUrl());
        assertEquals("jdbc:oracle:thin:@" + HOST + ":" + PORT + ":" + SID, builder().port(PORT).sid(SID).serviceName(SERVICE).build().getJdbcUrl());
        assertEquals("jdbc:oracle:thin:@//" + HOST + ":" + PORT + "/" + SERVICE, builder().port(PORT).serviceName(SERVICE).build().getJdbcUrl());
    }

    @Test
    public void missingPortUsesTheDefault1521AndBlankValuesFallThrough() {
        assertEquals("jdbc:oracle:thin:@" + HOST + ":" + DEFAULT_PORT + ":" + SID, builder().sid(SID).build().getJdbcUrl());
        assertEquals("jdbc:oracle:thin:@//" + HOST + ":" + DEFAULT_PORT + "/" + SERVICE, builder().serviceName(SERVICE).build().getJdbcUrl());
        assertEquals("jdbc:oracle:thin:@" + HOST + ":" + DEFAULT_PORT + ":" + SID, builder().jdbcUrl("  ").sid(SID).serviceName(SERVICE).build().getJdbcUrl(), "a blank URL is ignored");
        assertEquals("jdbc:oracle:thin:@//" + HOST + ":" + DEFAULT_PORT + "/" + SERVICE, builder().jdbcUrl("").sid(" ").serviceName(SERVICE).build().getJdbcUrl(), "a blank sid is ignored");
    }

    @Test
    public void setUpConfigsSetsDriverUrlCredentialsAndReadOnly() {
        HikariConfig config = configured(builder().port(PORT).serviceName(SERVICE).isReadonly(true).build());
        assertEquals(DRIVER, config.getDriverClassName());
        assertEquals("jdbc:oracle:thin:@//" + HOST + ":" + PORT + "/" + SERVICE, config.getJdbcUrl());
        assertEquals(USER, config.getUsername());
        assertEquals(PASSWORD, config.getPassword());
        assertTrue(config.isReadOnly());
        assertEquals(DRIVER, connector.getJdbcDriver());
        assertFalse(configured(builder().serviceName(SERVICE).build()).isReadOnly());
    }

    @Test
    public void blankCredentialsAreNotSet() {
        HikariConfig config = configured(OracleDatasourceConfig.builder().host(HOST).username("  ").password("").serviceName(SERVICE).build());
        assertNull(config.getUsername());
        assertNull(config.getPassword());
        HikariConfig none = configured(OracleDatasourceConfig.builder().host(HOST).serviceName(SERVICE).build());
        assertNull(none.getUsername());
        assertNull(none.getPassword());
    }

    /**
     * Pins the plan section 9 row "validateConfig never fires" (D-6: fix deferred): {@code validateConfig} tests {@code isBlank(getJdbcUrl())}, but {@code getJdbcUrl()} is the
     * computed URL (explicit URL, else built from host, port and sid or service name), which is never blank, so the check
     * never fires and every config, an empty one included, is accepted. A fix (testing the stored URL) changes this test on
     * purpose.
     */
    @Test
    public void validateConfigNeverFiresBecauseTheComputedUrlIsNeverBlank_pinsTheSection9Row() {
        assertEquals(Set.of(), connector.validateConfig(builder().sid(SID).build()));
        assertEquals(Set.of(), connector.validateConfig(builder().serviceName(SERVICE).build()));
        assertEquals(Set.of(), connector.validateConfig(OracleDatasourceConfig.builder().jdbcUrl(EXPLICIT_URL).build()));
        OracleDatasourceConfig empty = OracleDatasourceConfig.builder().build();
        System.out.println("[OracleConnectorConfigTest] empty config: url '" + empty.getJdbcUrl() + "', validate " + connector.validateConfig(empty));
        assertEquals("jdbc:oracle:thin:@//:" + DEFAULT_PORT + "/null", empty.getJdbcUrl(), "the computed URL of an empty config is not blank");
        assertEquals(Set.of(), connector.validateConfig(empty), "an empty config is accepted");
        assertEquals(Set.of(), connector.validateConfig(builder().build()), "a host without sid or service name is accepted");
        assertEquals(Set.of(), connector.validateConfig(builder().sid(" ").serviceName("").jdbcUrl(" ").build()), "blank values are accepted too");
    }

    @Test
    public void mergeKeepsTheStoredPasswordWhenTheUpdateHasNoneAndTakesTheRestFromTheUpdate() {
        OracleDatasourceConfig stored = builder().port(PORT).sid(SID).build();
        OracleDatasourceConfig update = OracleDatasourceConfig.builder().host("new.example.org").username("other").serviceName(SERVICE).isReadonly(true).build();
        OracleDatasourceConfig merged = (OracleDatasourceConfig) stored.mergeWithUpdatedConfig(update);
        System.out.println("[OracleConnectorConfigTest] merged url " + merged.getJdbcUrl() + ", user " + merged.getUsername() + ", read-only " + merged.isReadonly());
        assertEquals(PASSWORD, merged.getPassword(), "the stored password is kept");
        assertEquals("other", merged.getUsername());
        assertEquals("new.example.org", merged.getHost());
        assertEquals(DEFAULT_PORT, merged.getPort(), "the port comes from the update (its default), not from the stored config");
        assertEquals("jdbc:oracle:thin:@//new.example.org:" + DEFAULT_PORT + "/" + SERVICE, merged.getJdbcUrl());
        assertEquals(null, merged.getSid());
        assertTrue(merged.isReadonly());
        OracleDatasourceConfig withPassword = (OracleDatasourceConfig) stored.mergeWithUpdatedConfig(builder().password("new").serviceName(SERVICE).build());
        assertEquals("new", withPassword.getPassword(), "a password in the update replaces the stored one");
    }

    @Test
    public void mergeWithAnEmptyPasswordReplacesTheStoredOne() {
        OracleDatasourceConfig stored = builder().serviceName(SERVICE).build();
        OracleDatasourceConfig merged = (OracleDatasourceConfig) stored.mergeWithUpdatedConfig(
                OracleDatasourceConfig.builder().host(HOST).username(USER).password("").serviceName(SERVICE).build());
        System.out.println("[OracleConnectorConfigTest] merge with an empty password: '" + merged.getPassword() + "'");
        assertEquals("", merged.getPassword(), "only null keeps the stored password: an empty string is taken from the update");
    }

    @Test
    public void mergeRejectsAForeignConfigType() {
        OracleDatasourceConfig stored = builder().serviceName(SERVICE).build();
        MysqlDatasourceConfig foreign = new MysqlDatasourceConfig("db", USER, PASSWORD, HOST, 3306L, false, null, false, false, null);
        BizException thrown = assertThrows(BizException.class, () -> stored.mergeWithUpdatedConfig(foreign));
        System.out.println("[OracleConnectorConfigTest] foreign config: " + thrown.getError() + " " + thrown.getMessageKey() + " " + java.util.Arrays.toString(thrown.getArgs()));
        assertEquals(INVALID_DATASOURCE_CONFIG_TYPE, thrown.getError());
        assertEquals("INVALID_DATASOURCE_CONFIG_TYPE", thrown.getMessageKey());
        assertEquals("MysqlDatasourceConfig", thrown.getArgs()[0]);
    }
}

package org.lowcoder.plugin.postgres;

import static org.apache.commons.lang3.StringUtils.isNotBlank;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;
import org.lowcoder.plugin.sql.SqlBasedConnector;
import org.lowcoder.sdk.exception.PluginException;
import org.pf4j.Extension;

import com.zaxxer.hikari.HikariConfig;

@Extension
public class PostgresConnector extends SqlBasedConnector<PostgresDatasourceConfig> {

    /** Separates the hosts of a pgjdbc multi-host URL; one datasource names one host (BF-027). */
    static final String HOST_LIST_SEPARATOR = ",";
    static final String INVALID_HOST = "INVALID_HOST";

    public PostgresConnector() {
        super(100);
    }

    @Override
    protected String getJdbcDriver() {
        return "org.postgresql.Driver";
    }

    @Override
    protected void setUpConfigs(PostgresDatasourceConfig datasourceConfig, HikariConfig config) {

        // Set authentication properties
        String username = datasourceConfig.getUsername();
        if (StringUtils.isNotEmpty(username)) {
            config.setUsername(username);
        }
        String password = datasourceConfig.getPassword();
        if (StringUtils.isNotEmpty(password)) {
            config.setPassword(password);
        }

        String host = datasourceConfig.getHost();
        long port = datasourceConfig.getPort();
        String database = datasourceConfig.getDatabase();
        if (isHostList(host)) {
            throw new PluginException(DATASOURCE_ARGUMENT_ERROR, INVALID_HOST);
        }
        // pgjdbc URL-decodes the database name, so the encoded name arrives unchanged and cannot add URL parameters (BF-027)
        String url = "jdbc:postgresql://" + host + ":" + port + "/"
                + (isNotBlank(database) ? URLEncoder.encode(database, StandardCharsets.UTF_8) : "");
        config.setJdbcUrl(url);

        if (datasourceConfig.isUsingSsl()) {
            config.addDataSourceProperty("ssl", "true");
            config.addDataSourceProperty("sslmode", "require");
        } else {
            config.addDataSourceProperty("ssl", "false");
            config.addDataSourceProperty("sslmode", "disable");
        }

        if (datasourceConfig.isReadonly()) {
            config.setReadOnly(true);
            config.addDataSourceProperty("readOnlyMode", "always");
        } else {
            config.setReadOnly(false);
        }
    }

    /** Adds {@code INVALID_HOST} for a host list, which the save path refuses as {@link #setUpConfigs} does at connect time. */
    @Override
    public Set<String> validateConfig(PostgresDatasourceConfig connectionConfig) {
        Set<String> invalids = super.validateConfig(connectionConfig);
        if (isHostList(connectionConfig.getHost())) {
            invalids.add(INVALID_HOST);
        }
        return invalids;
    }

    /**
     * Whether the host is a pgjdbc host list ({@code a,b}), which would connect to a second host that host checks done on the
     * whole text never see. Limit: other characters pass; a {@code ?} or {@code /} makes pgjdbc refuse the URL, and the
     * sql validation refuses {@code :} and {@code /} on save.
     */
    static boolean isHostList(String host) {
        return host != null && host.contains(HOST_LIST_SEPARATOR);
    }
}

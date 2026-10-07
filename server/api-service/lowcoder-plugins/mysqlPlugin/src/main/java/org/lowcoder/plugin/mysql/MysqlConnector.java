package org.lowcoder.plugin.mysql;

import static org.apache.commons.lang3.StringUtils.isNotBlank;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.sql.SqlBasedConnector;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;
import org.pf4j.Extension;

import com.zaxxer.hikari.HikariConfig;

@Extension
public class MysqlConnector extends SqlBasedConnector<MysqlDatasourceConfig> {

    private static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";

    /**
     * Lets the driver ask the server for its RSA public key. Without TLS, the first login of a user the server has not
     * cached ({@code caching_sha2_password}, the MySQL 8 default) sends the password encrypted with that key, so without
     * this property such a login failed with "Public Key Retrieval is not allowed", and so did every wrong password
     * (BF-054). Set only when the datasource does not use SSL: over TLS the password is sent on the encrypted channel.
     * <p>
     * Limits: the key is not verified, so an active man in the middle of the unencrypted connection can hand over its own
     * key and read the password (the queries and their data on that connection are readable to it anyway). A datasource
     * can turn it off with {@code allowPublicKeyRetrieval=false} in its {@code extParams}, which {@code SqlBasedConnector}
     * applies after these properties; only through the API, as the MySQL form has no field for them, and a later save from
     * the form drops them again ({@code SqlBasedDatasourceConnectionConfig.mergeWithUpdatedConfig} takes the update's
     * {@code extParams}).
     */
    static final String ALLOW_PUBLIC_KEY_RETRIEVAL = "allowPublicKeyRetrieval";

    public MysqlConnector() {
        super(50);
    }

    @Override
    protected String getJdbcDriver() {
        return JDBC_DRIVER;
    }

    @Override
    protected void setUpConfigs(MysqlDatasourceConfig datasourceConfig, HikariConfig config) {
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
        String url = "jdbc:mysql://" + host + ":" + port + "/" + (isNotBlank(database) ? database : "");
        config.setJdbcUrl(url);

        config.addDataSourceProperty("zeroDateTimeBehavior", "convertToNull");
        config.addDataSourceProperty("allowMultiQueries", "true");

        if (datasourceConfig.isUsingSsl()) {
            config.addDataSourceProperty("useSSL", "true");
            config.addDataSourceProperty("requireSSL", "true");
        } else {
            config.addDataSourceProperty("useSSL", "false");
            config.addDataSourceProperty("requireSSL", "false");
            config.addDataSourceProperty(ALLOW_PUBLIC_KEY_RETRIEVAL, "true");
        }
        config.setReadOnly(datasourceConfig.isReadonly());
    }
}

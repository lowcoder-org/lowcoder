package org.lowcoder.plugin.postgres;

import static org.apache.commons.lang3.StringUtils.isNotBlank;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;
import org.lowcoder.plugin.sql.SqlBasedConnector;
import org.pf4j.Extension;

import com.zaxxer.hikari.HikariConfig;

@Extension
public class PostgresConnector extends SqlBasedConnector<PostgresDatasourceConfig> {

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
        String url = "jdbc:postgresql://" + host + ":" + port + "/" + (isNotBlank(database) ? database : "");
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

        // Fix for PostgreSQL prepared statement parameter binding issues
        // Disable prepared statement caching to prevent S_1, S_2, S_11 errors
        config.addDataSourceProperty("preparedStatementCacheQueries", "0");
        config.addDataSourceProperty("preparedStatementCacheSizeMiB", "0");
        
        // Add connection validation to reset prepared statement state
        config.addDataSourceProperty("testOnBorrow", "true");
        config.addDataSourceProperty("validationQuery", "SELECT 1");
        
        // Additional PostgreSQL-specific optimizations
        config.addDataSourceProperty("reWriteBatchedInserts", "true");
        config.addDataSourceProperty("cachePrepStmts", "false");
        config.addDataSourceProperty("useServerPrepStmts", "false");
    }
}

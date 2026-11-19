package org.lowcoder.plugin.snowflake;

import org.lowcoder.plugin.sql.SqlBasedConnector;
import org.pf4j.Extension;

import com.zaxxer.hikari.HikariConfig;

@Extension
public class SnowflakeConnector extends SqlBasedConnector<SnowflakeDatasourceConfig> {

    private static final String JDBC_DRIVER = "net.snowflake.client.jdbc.SnowflakeDriver";
    private static final String DB_PROPERTY = "db";
    private static final String USER_PROPERTY = "user";
    private static final String PASSWORD_PROPERTY = "password";

    public SnowflakeConnector() {
        super(50);
    }

    @Override
    protected String getJdbcDriver() {
        return JDBC_DRIVER;
    }

    @Override
    protected void setUpConfigs(SnowflakeDatasourceConfig datasourceConfig, HikariConfig config) {
        String host = datasourceConfig.getHost();
        String database = datasourceConfig.getDatabase();

        String url = "jdbc:snowflake://" + host + ".snowflakecomputing.com/";
        config.setJdbcUrl(url);
        config.addDataSourceProperty(DB_PROPERTY, database);
        config.addDataSourceProperty(USER_PROPERTY, datasourceConfig.getUsername());
        // BF-112: the form's password is optional and the data-source properties reject null; an empty password is still set
        if (datasourceConfig.getPassword() != null) {
            config.addDataSourceProperty(PASSWORD_PROPERTY, datasourceConfig.getPassword());
        }
    }
}

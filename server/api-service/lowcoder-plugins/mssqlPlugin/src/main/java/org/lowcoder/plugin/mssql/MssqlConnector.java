package org.lowcoder.plugin.mssql;

import static org.apache.commons.lang3.StringUtils.isNotBlank;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;
import org.lowcoder.plugin.sql.SqlBasedConnector;
import org.pf4j.Extension;

import com.zaxxer.hikari.HikariConfig;

@Extension
public class MssqlConnector extends SqlBasedConnector<MssqlDatasourceConfig> {
    private static final String JDBC_DRIVER = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
    private static final String URL_PREFIX = "jdbc:sqlserver://";
    private static final String BRACE_OPEN = "{";
    private static final String BRACE_CLOSE = "}";

    protected MssqlConnector() {
        super(50);
    }

    @Override
    protected String getJdbcDriver() {
        return JDBC_DRIVER;
    }

    @Override
    protected void setUpConfigs(MssqlDatasourceConfig datasourceConfig, HikariConfig config) {
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

        // User and password reach the driver only through Hikari's properties above, never through the URL (BF-027, and
        // BF-026 c: Hikari masks a URL password only up to its first ';'). Host and database are braced property values,
        // so a ';' in them cannot add a property of its own.
        StringBuilder urlBuilder = new StringBuilder(URL_PREFIX);
        urlBuilder.append(";serverName=").append(braced(host));

        // SQL Server supports instanceName like this: serverName=INNOWAVE-99\SQLEXPRESS01
        // And when host contains instanceName, port should be ignored, see https://stackoverflow.com/a/40830281/2139436
        if (!host.contains("\\")) {
            urlBuilder.append(";portNumber=").append(port);
        }

        if (isNotBlank(database)) {
            urlBuilder.append(";databaseName=").append(braced(database));
        }

        urlBuilder.append(";encrypt=")
                .append(datasourceConfig.isUsingSsl())
                .append(";");

        config.setJdbcUrl(urlBuilder.toString());
        config.setReadOnly(datasourceConfig.isReadonly());
    }

    /**
     * A connection-string property value in braces, a closing brace doubled, as the SQL Server driver reads it: the value
     * cannot end the property or start another one. Limit: it keeps the value from adding properties, it does not check
     * that the value is a reachable host or an existing database.
     */
    static String braced(String value) {
        return BRACE_OPEN + value.replace(BRACE_CLOSE, BRACE_CLOSE + BRACE_CLOSE) + BRACE_CLOSE;
    }

}

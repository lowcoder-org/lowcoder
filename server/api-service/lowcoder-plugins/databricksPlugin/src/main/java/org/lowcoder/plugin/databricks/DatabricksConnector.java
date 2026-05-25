package org.lowcoder.plugin.databricks;

import com.zaxxer.hikari.HikariConfig;
import org.lowcoder.plugin.databricks.model.*;
import org.apache.commons.lang3.StringUtils;

import java.util.Set;
import java.util.HashSet;

public class DatabricksConnector {

    private static final String JDBC_DRIVER = "com.databricks.client.jdbc.Driver";

    public DatabricksConnector() {
        super();
    }

    protected String getJdbcDriver() {
        return JDBC_DRIVER;
    }

    protected void setUpConfigs(DatabricksDatasourceConfig databricksDatasourceConfig, HikariConfig config) {

        config.setDriverClassName(JDBC_DRIVER);

        String catalog = databricksDatasourceConfig.getCatalog();
        String schema = databricksDatasourceConfig.getDatabase();
        String httpPath = databricksDatasourceConfig.getHttpPath();
        String password = databricksDatasourceConfig.getPassword();
        Boolean usingSsl = databricksDatasourceConfig.isUsingSsl();
        DatabricksAuthMechanism authMechanism = databricksDatasourceConfig.getAuthMechanism();
        String username = databricksDatasourceConfig.getUsername();

        // Build JDBC URL with schema in path if provided
        String url = buildJdbcUrl(databricksDatasourceConfig);

        config.setJdbcUrl(url);
        config.addDataSourceProperty("HttpPath", httpPath);
        config.addDataSourceProperty("AuthMech", authMechanism.getValue());
        config.addDataSourceProperty("UID", username);
        config.addDataSourceProperty("PWD", password);
        if (catalog != null && !catalog.isEmpty()) {
            config.addDataSourceProperty("ConnCatalog", catalog);
        }
        if (schema != null && !schema.isEmpty()) {
            config.addDataSourceProperty("ConnSchema", schema);
        }

        if (usingSsl != null && usingSsl) {
            config.addDataSourceProperty("ssl", "true");
            config.addDataSourceProperty("sslmode", "require");
        } else {
            config.addDataSourceProperty("ssl", "false");
            config.addDataSourceProperty("sslmode", "disable");
        }

        // Readonly is optional, set to false by default
        config.setReadOnly(false);
    }

    public Set<String> validateConfig(DatabricksDatasourceConfig connectionConfig) {
        Set<String> validates = new HashSet<>();
        if (StringUtils.isBlank(connectionConfig.getHost())) {
            validates.add("INVALID_HOST_CONFIG");
        }
        // Optionally validate other required fields here
        return validates;
    }

    private String buildJdbcUrl(DatabricksDatasourceConfig config) {
        String url;
        if (config.isUsingUri()) {
            if (StringUtils.isBlank(config.getUri())) {
                throw new IllegalArgumentException("JDBC URI must be provided when usingUri is true");
            }
            url = config.getUri();
        } else {
            if (config.getSchema() != null && !config.getSchema().isEmpty()) {
                url = String.format("jdbc:databricks://%s:%d/%s", config.getHost(), config.getPort(), config.getSchema());
            } else {
                url = String.format("jdbc:databricks://%s:%d", config.getHost(), config.getPort());
            }
        }
        return url;
    }
}

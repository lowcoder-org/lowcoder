package org.lowcoder.plugin.oracle;

import static org.apache.commons.lang3.StringUtils.isAllBlank;
import static org.apache.commons.lang3.StringUtils.isBlank;

import java.util.HashSet;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.oracle.model.OracleDatasourceConfig;
import org.lowcoder.plugin.sql.SqlBasedConnector;
import org.pf4j.Extension;

import com.zaxxer.hikari.HikariConfig;

@Extension
public class OracleConnector extends SqlBasedConnector<OracleDatasourceConfig> {

    private static final String JDBC_DRIVER = "oracle.jdbc.OracleDriver";
    static final String INVALID_JDBC_URL_CONFIG = "INVALID_JDBC_URL_CONFIG";

    public OracleConnector() {
        super(50);
    }

    @Override
    protected String getJdbcDriver() {
        return JDBC_DRIVER;
    }

    @Override
    protected void setUpConfigs(OracleDatasourceConfig oracleDatasourceConfig, HikariConfig config) {

        config.setDriverClassName(JDBC_DRIVER);
        //username & password
        if (StringUtils.isNotBlank(oracleDatasourceConfig.getUsername())) {
            config.setUsername(oracleDatasourceConfig.getUsername());
        }
        if (StringUtils.isNotBlank(oracleDatasourceConfig.getPassword())) {
            config.setPassword(oracleDatasourceConfig.getPassword());
        }
        config.setJdbcUrl(oracleDatasourceConfig.getJdbcUrl());

        config.setReadOnly(oracleDatasourceConfig.isReadonly());
    }

    /**
     * A config needs a JDBC URL, or a host with a sid or a service name (BF-111: the computed URL was tested, which is
     * never blank, so every config passed). Limits: the URL, host, sid and service name are tested for blankness only.
     */
    @Override
    public Set<String> validateConfig(OracleDatasourceConfig connectionConfig) {
        Set<String> validates = new HashSet<>();
        if (!connectionConfig.hasJdbcUrl()
                && (isBlank(connectionConfig.getHost()) || isAllBlank(connectionConfig.getSid(), connectionConfig.getServiceName()))) {
            validates.add(INVALID_JDBC_URL_CONFIG);
        }
        return validates;
    }
}

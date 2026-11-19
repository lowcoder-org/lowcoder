package org.lowcoder.plugin.oracle.model;

import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIG_TYPE;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

import java.util.Map;

import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.experimental.SuperBuilder;

@SuperBuilder
@Jacksonized
public class OracleDatasourceConfig extends SqlBasedDatasourceConnectionConfig {
    private final String sid;
    private final String serviceName;
    private final String jdbcUrl;

    @JsonCreator
    private OracleDatasourceConfig(String username, String password, String host,
            Long port, String sid, String serviceName, String jdbcUrl,
            boolean enableTurnOffPreparedStatement, boolean isReadonly, Map<String, Object> extParams) {
        super("", username, password, host, port, false, "", isReadonly, enableTurnOffPreparedStatement, extParams);
        this.sid = sid;
        this.serviceName = serviceName;
        this.jdbcUrl = jdbcUrl;
    }

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
        if (!(detailConfig instanceof OracleDatasourceConfig newConfig)) {
            throw ofException(INVALID_DATASOURCE_CONFIG_TYPE, "INVALID_DATASOURCE_CONFIG_TYPE",
                    detailConfig.getClass().getSimpleName());
        }

        return OracleDatasourceConfig.builder()
                .username(newConfig.getUsername())
                .password(ObjectUtils.firstNonNull(newConfig.getPassword(), getPassword()))
                .host(newConfig.getHost())
                .port(newConfig.getPort())
                .jdbcUrl(newConfig.jdbcUrl)
                .sid(newConfig.getSid())
                .serviceName(newConfig.getServiceName())
                .enableTurnOffPreparedStatement(newConfig.isEnableTurnOffPreparedStatement())
                .isReadonly(newConfig.isReadonly())
                .extParams(newConfig.getExtParams())
                .build();
    }

    public String getSid() {
        return sid;
    }

    public String getServiceName() {
        return serviceName;
    }

    /**
     * Whether a JDBC URL was configured, as opposed to the one {@link #getJdbcUrl()} builds from host, port and sid or
     * service name, which is never blank (BF-111). Not a getter, so it is not a JSON property. A merge takes the update's
     * configured URL, not its computed one, so this holds for a merged config too.
     * <p>
     * Limits: {@link #getJdbcUrl()} is what Jackson writes as {@code jdbcUrl}, so a config read back from its JSON (a stored
     * one) has the computed URL as its configured one and this is true for it.
     */
    public boolean hasJdbcUrl() {
        return StringUtils.isNotBlank(jdbcUrl);
    }

    public String getJdbcUrl() {
        if (hasJdbcUrl()) {
            return jdbcUrl;
        }
        if (StringUtils.isNotBlank(sid)) {
            return String.format("jdbc:oracle:thin:@%s:%s:%s", getHost(), getPort(), getSid());
        }
        return String.format("jdbc:oracle:thin:@//%s:%s/%s", getHost(), getPort(), getServiceName());
    }

    @Override
    protected long defaultPort() {
        return 1521;
    }

}

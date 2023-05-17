package org.lowcoder.plugin.postgres.model;

import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import com.google.common.annotations.VisibleForTesting;

import lombok.Builder;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PostgresDatasourceConfig extends SqlBasedDatasourceConnectionConfig {

    private static final long DEFAULT_PORT = 5432L;

    @Builder
    public PostgresDatasourceConfig(String database, String username, String password, String host, Long port, boolean usingSsl,
            String serverTimezone,
            boolean isReadonly, boolean enableTurnOffPreparedStatement, Map<String, Object> extParams) {
        super(database, username, password, host, port, usingSsl, serverTimezone, isReadonly, enableTurnOffPreparedStatement, extParams);
    }

    @Override
    protected long defaultPort() {
        return DEFAULT_PORT;
    }

    public static PostgresDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        PostgresDatasourceConfig result = fromJson(toJson(requestMap), PostgresDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "INVALID_PG_CONFIG");
        }
        return result;
    }

    @VisibleForTesting
    public PostgresDatasourceConfigBuilder toBuilder() {
        return builder()
                .database(getDatabase())
                .username(getUsername())
                .password(getPassword())
                .usingSsl(isUsingSsl())
                .host(getHost())
                .port(getPort())
                .serverTimezone(getServerTimezone())
                .enableTurnOffPreparedStatement(isEnableTurnOffPreparedStatement());
    }

}

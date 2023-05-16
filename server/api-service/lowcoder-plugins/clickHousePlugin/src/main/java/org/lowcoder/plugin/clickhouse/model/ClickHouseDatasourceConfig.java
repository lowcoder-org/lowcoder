package org.lowcoder.plugin.clickhouse.model;

import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import lombok.Builder;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ClickHouseDatasourceConfig extends SqlBasedDatasourceConnectionConfig {

    private static final long DEFAULT_PORT = 8123L;

    @Builder
    protected ClickHouseDatasourceConfig(String database, String username, String password, String host, Long port, boolean usingSsl,
            String serverTimezone, boolean isReadonly, boolean enableTurnOffPreparedStatement, Map<String, Object> extParams) {
        super(database, username, password, host, port, usingSsl, serverTimezone, isReadonly, enableTurnOffPreparedStatement, extParams);
    }

    @Override
    protected long defaultPort() {
        return DEFAULT_PORT;
    }

    public static ClickHouseDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        ClickHouseDatasourceConfig result = fromJson(toJson(requestMap), ClickHouseDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "INVALID_CLICKHOUSE_CONFIG");
        }
        return result;
    }


}

package org.lowcoder.plugin.mssql.model;

import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import lombok.Builder;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@SuperBuilder
@Jacksonized
public class MssqlDatasourceConfig extends SqlBasedDatasourceConnectionConfig {

    private static final long DEFAULT_PORT = 1433L;

    @Override
    protected long defaultPort() {
        return DEFAULT_PORT;
    }

    public static MssqlDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        MssqlDatasourceConfig result = fromJson(toJson(requestMap), MssqlDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "INVALID_SQLSERVER_CONFIG");
        }
        return result;
    }
}

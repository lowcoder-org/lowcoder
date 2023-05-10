package org.lowcoder.plugin.snowflake;

import java.util.Map;

import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import lombok.Builder;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@ToString
@Slf4j
public class SnowflakeDatasourceConfig extends SqlBasedDatasourceConnectionConfig {

    @Builder
    public SnowflakeDatasourceConfig(String database, String username, String password, String host,
            Long port, boolean usingSsl, String serverTimezone,
            boolean isReadonly, boolean enableTurnOffPreparedStatement, Map<String, Object> extParams) {
        super(database, username, password, host, port, usingSsl, serverTimezone, isReadonly, enableTurnOffPreparedStatement, extParams);
    }

    @Override
    protected long defaultPort() {
        return -1;
    }

}

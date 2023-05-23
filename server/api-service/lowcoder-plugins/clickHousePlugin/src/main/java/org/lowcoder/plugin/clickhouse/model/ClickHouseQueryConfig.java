package org.lowcoder.plugin.clickhouse.model;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.lowcoder.sdk.exception.PluginException;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Getter;

@Getter
public class ClickHouseQueryConfig {

    private final String sql;
    private final boolean disablePreparedStatement;
    private final int timeout;

    @JsonCreator
    private ClickHouseQueryConfig(String sql, boolean disablePreparedStatement, int timeout) {
        this.sql = sql;
        this.disablePreparedStatement = disablePreparedStatement;
        this.timeout = timeout;
    }

    public static ClickHouseQueryConfig from(Map<String, Object> queryConfigs) {
        if (MapUtils.isEmpty(queryConfigs)) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "CLICKHOUSE_CONFIG_EMPTY");
        }

        ClickHouseQueryConfig result = fromJson(toJson(queryConfigs), ClickHouseQueryConfig.class);
        if (result == null) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_CLICKHOUSE");
        }
        return result;

    }

    public String getSql() {
        return sql.trim();
    }

}

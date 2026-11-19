package org.lowcoder.plugin.clickhouse.model;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import lombok.Builder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.collections4.MapUtils;
import org.lowcoder.sdk.exception.PluginException;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Getter;

@Getter
@Builder
@Jacksonized
public class ClickHouseQueryConfig {

    private final String sql;
    private final boolean disablePreparedStatement;
    private final int timeout;

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

    /** The SQL, trimmed; empty without a {@code sql} key (BF-093: that was a NullPointerException), so the query is SQL_EMPTY. */
    public String getSql() {
        return org.apache.commons.lang3.StringUtils.trimToEmpty(sql);
    }

}

package org.lowcoder.plugin.postgres.model;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.lowcoder.sdk.exception.PluginException;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;

@Getter
public class PostgresQueryConfig {

    private final String sql;
    private final boolean disablePreparedStatement;

    private final String mode;

    private final String guiStatementType;
    private final Map<String, Object> guiStatementDetail;

    @JsonCreator
    private PostgresQueryConfig(String sql, boolean disablePreparedStatement,
            String mode,
            @JsonProperty("commandType") String guiStatementType,
            @JsonProperty("command") Map<String, Object> guiStatementDetail) {
        this.sql = sql;
        this.disablePreparedStatement = disablePreparedStatement;
        this.mode = mode;
        this.guiStatementType = guiStatementType;
        this.guiStatementDetail = guiStatementDetail;
    }

    public static PostgresQueryConfig from(Map<String, Object> queryConfigs) {
        if (MapUtils.isEmpty(queryConfigs)) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_PG_QUERY_CONFIG_EMPTY");
        }

        PostgresQueryConfig result = fromJson(toJson(queryConfigs), PostgresQueryConfig.class);
        if (result == null) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_PG");
        }
        return result;
    }

    public boolean isGuiMode() {
        return "GUI".equalsIgnoreCase(mode);
    }

}

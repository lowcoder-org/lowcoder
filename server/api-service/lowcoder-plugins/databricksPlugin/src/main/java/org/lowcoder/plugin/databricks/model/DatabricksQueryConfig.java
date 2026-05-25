package org.lowcoder.plugin.databricks.model;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;

import lombok.Builder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.collections4.MapUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.plugin.databricks.model.DatabricksAuthMechanism;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;

@Getter
@Builder
@Jacksonized
public class DatabricksQueryConfig {

    private final String sql;
    private final boolean disablePreparedStatement;
    private final String mode;
    // Use standard names for GUI command support
    private final String guiStatementType;
    private final Map<String, Object> guiStatementDetail;

    @JsonCreator
    public DatabricksQueryConfig(
            @JsonProperty("sql") String sql,
            @JsonProperty("disablePreparedStatement") boolean disablePreparedStatement,
            @JsonProperty("mode") String mode,
            @JsonProperty("commandType") String guiStatementType,
            @JsonProperty("command") Map<String, Object> guiStatementDetail
    ) {
        this.sql = sql;
        this.disablePreparedStatement = disablePreparedStatement;
        this.mode = mode;
        this.guiStatementType = guiStatementType;
        this.guiStatementDetail = guiStatementDetail;
    }

    public static DatabricksQueryConfig from(Map<String, Object> queryConfigs) {
        if (MapUtils.isEmpty(queryConfigs)) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "DATABRICKS_QUERY_CONFIG_EMPTY");
        }
        // Accept both new and legacy keys
        DatabricksQueryConfig result = fromJson(toJson(queryConfigs), DatabricksQueryConfig.class);
        if (result == null) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_DATABRICKS_CONFIG_0");
        }
        return result;
    }

    public boolean isGuiMode() {
        return "GUI".equalsIgnoreCase(mode);
    }

    public String getSql() {
        return sql == null ? null : sql.trim();
    }

    // For compatibility with QueryExecutor
    public String getStatementType() {
        return guiStatementType;
    }

    public Map<String, Object> getStatementDetail() {
        return guiStatementDetail;
    }
}

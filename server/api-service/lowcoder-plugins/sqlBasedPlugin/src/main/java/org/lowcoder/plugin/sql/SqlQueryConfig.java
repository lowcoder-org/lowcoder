package org.lowcoder.plugin.sql;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.collections4.MapUtils;
import org.lowcoder.sdk.exception.PluginException;

import java.util.Map;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Getter
@Builder
@Jacksonized
public class SqlQueryConfig {

    private final String sql;
    private final boolean disablePreparedStatement;
    private final String mode;

    @JsonAlias("commandType")
    private final String guiStatementType;
    @JsonAlias("command")
    private final Map<String, Object> guiStatementDetail;

    @JsonCreator
    private SqlQueryConfig(String sql, boolean disablePreparedStatement,
            String mode,
            String guiStatementType,
            Map<String, Object> guiStatementDetail) {
        this.sql = sql;
        this.disablePreparedStatement = disablePreparedStatement;
        this.mode = mode;
        this.guiStatementType = guiStatementType;
        this.guiStatementDetail = guiStatementDetail;
    }

    public static SqlQueryConfig from(Map<String, Object> queryConfigs) {
        if (MapUtils.isEmpty(queryConfigs)) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "EMPTY_SQL_QUERY_CONFIG");
        }

        SqlQueryConfig result = fromJson(toJson(queryConfigs), SqlQueryConfig.class);
        if (result == null) {
            throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_SQL_QUERY_CONFIG");
        }
        return result;
    }

    public boolean isGuiMode() {
        return "GUI".equalsIgnoreCase(mode);
    }

    public String getSql() {
        return sql.trim();
    }
}

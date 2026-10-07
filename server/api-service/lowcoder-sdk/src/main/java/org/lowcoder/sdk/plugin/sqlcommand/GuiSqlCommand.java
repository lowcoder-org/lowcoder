package org.lowcoder.sdk.plugin.sqlcommand;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.plugin.common.constant.Constants.ALLOW_MULTI_MODIFY_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.TABLE_KEY;

public interface GuiSqlCommand {

    GuiSqlCommandRenderResult render(Map<String, Object> requestMap);

    class GuiSqlCommandRenderResult {

        private final String sql;
        private final List<Object> bindParams;
        private final boolean returnsGeneratedKeys;

        public GuiSqlCommandRenderResult(String sql, List<Object> bindParams) {
            this(sql, bindParams, true);
        }

        /**
         * @param returnsGeneratedKeys whether the executor asks the driver for the generated keys of this statement; false for
         *         a statement the database refuses to run with them (BF-050: a multi-row insert on Oracle)
         */
        public GuiSqlCommandRenderResult(String sql, List<Object> bindParams, boolean returnsGeneratedKeys) {
            this.sql = sql;
            this.bindParams = bindParams;
            this.returnsGeneratedKeys = returnsGeneratedKeys;
        }

        public String sql() {
            return sql;
        }

        public List<Object> bindParams() {
            return bindParams;
        }

        public boolean returnsGeneratedKeys() {
            return returnsGeneratedKeys;
        }
    }

    static String parseTable(Map<String, Object> commandDetail) {
        String table = MapUtils.getString(commandDetail, TABLE_KEY, null);
        if (StringUtils.isBlank(table)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_FIELD_EMPTY");
        }
        return table;
    }

    static boolean parseAllowMultiModify(Map<String, Object> commandDetail) {
        return MapUtils.getBoolean(commandDetail, ALLOW_MULTI_MODIFY_KEY, false);
    }

    boolean isInsertCommand();

    Set<String> extractMustacheKeys();

    default boolean isRenderWithRawSql() {
        return false;
    }

    default EscapeSql escapeStrFunc() {
        return s -> {
            throw new UnsupportedOperationException("This func should be implemented by each SQL dialect if needed");
        };
    }
}

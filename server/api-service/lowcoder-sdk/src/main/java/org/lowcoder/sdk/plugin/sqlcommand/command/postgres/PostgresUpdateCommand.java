package org.lowcoder.sdk.plugin.sqlcommand.command.postgres;

import static com.google.common.collect.Lists.newArrayList;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_UPDATE_COMMAND;
import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.POSTGRES_COLUMN_DELIMITER;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;
import static org.lowcoder.sdk.util.SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE;

import java.util.List;
import java.util.Map;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRow;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateOrDeleteSingleCommandRenderResult;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

import com.google.common.annotations.VisibleForTesting;

public class PostgresUpdateCommand extends UpdateCommand {

    private PostgresUpdateCommand(Map<String, Object> commandDetail) {
        super(commandDetail, POSTGRES_COLUMN_DELIMITER, POSTGRES_COLUMN_DELIMITER);
    }

    @VisibleForTesting
    protected PostgresUpdateCommand(String table, ChangeSet changeSet, FilterSet filterSet, boolean allowMultiModify) {
        super(table, changeSet, filterSet, allowMultiModify, POSTGRES_COLUMN_DELIMITER, POSTGRES_COLUMN_DELIMITER);
    }

    public static PostgresUpdateCommand from(Map<String, Object> commandDetail) {
        return new PostgresUpdateCommand(commandDetail);
    }

    @Override
    public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {
        if (allowMultiModify) {
            return super.render(requestMap);
        }

        String renderedTable = renderMustacheString(table, requestMap);
        ChangeSetRow updateRow = changeSet.render(requestMap);
        if (updateRow.isEmpty()) {
            throw new PluginException(INVALID_UPDATE_COMMAND, "UPDATE_DATA_EMPTY");
        }

        StringBuilder selectSql = new StringBuilder("select count(1) as count from " + renderedTable);
        List<Object> selectBindParams = newArrayList();
        appendFilter(requestMap, selectSql, selectBindParams);

        StringBuilder updateSql = new StringBuilder();
        List<Object> updateBindParams = newArrayList();
        appendTable(renderedTable, updateSql);
        appendSet(updateRow, updateSql, updateBindParams);
        if (filterSet.isEmpty()) {
            return new UpdateOrDeleteSingleCommandRenderResult(selectSql.toString(), selectBindParams, updateSql.toString(), updateBindParams);
        }

        appendFilter(requestMap, updateSql, updateBindParams);
        // there is no limit 1 here

        return new UpdateOrDeleteSingleCommandRenderResult(selectSql.toString(), selectBindParams, updateSql.toString(), updateBindParams);

    }

    @Override
    public boolean isRenderWithRawSql() {
        return true;
    }

    @Override
    public EscapeSql escapeStrFunc() {
        return POSTGRES_SQL_STR_ESCAPE;
    }
}

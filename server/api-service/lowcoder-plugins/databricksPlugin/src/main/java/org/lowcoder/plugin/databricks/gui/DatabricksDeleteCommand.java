package org.lowcoder.plugin.databricks.gui;

import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet.parseFilterSet;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import java.util.Map;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.DeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;

public class DatabricksDeleteCommand extends DeleteCommand {

    protected DatabricksDeleteCommand(String table, FilterSet filterSet, boolean allowMultiModify) {
        super(table, filterSet, allowMultiModify, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    public static DeleteCommand from(Map<String, Object> commandDetail) {
        if (commandDetail == null || commandDetail.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "DELETE_COMMAND_DETAIL_EMPTY");
        }
        String table = GuiSqlCommand.parseTable(commandDetail);
        FilterSet filterSet = parseFilterSet(commandDetail);
        boolean allowMultiModify = GuiSqlCommand.parseAllowMultiModify(commandDetail);
        if (table == null || table.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "DELETE_COMMAND_MISSING_TABLE");
        }
        return new DatabricksDeleteCommand(table, filterSet, allowMultiModify);
    }

    @Override
    public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {
        return super.render(requestMap);
    }

    @Override
    protected void renderTable(String renderedTable, StringBuilder sb) {
        sb.append("delete from ").append(renderedTable);
    }

    @Override
    protected void renderLimit(StringBuilder sb) {
        if (allowMultiModify) {
            sb.append(" limit 1");
        }
    }
}

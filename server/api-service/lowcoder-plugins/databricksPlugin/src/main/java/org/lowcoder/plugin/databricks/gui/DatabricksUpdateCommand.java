package org.lowcoder.plugin.databricks.gui;

import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import java.util.Map;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;

import com.google.common.annotations.VisibleForTesting;

public class DatabricksUpdateCommand extends UpdateCommand {

    private DatabricksUpdateCommand(Map<String, Object> commandDetail) {
        super(commandDetail, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    @VisibleForTesting
    protected DatabricksUpdateCommand(String table, ChangeSet changeSet, FilterSet filterSet, boolean allowMultiModify) {
        super(table, changeSet, filterSet, allowMultiModify, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    @Override
    protected void appendTable(String renderedTable, StringBuilder sb) {
        sb.append("update ").append(renderedTable);
    }

    @Override
    protected void appendLimit(StringBuilder sb) {
        if (allowMultiModify) {
            sb.append(" limit 1");
        }
    }

    public static DatabricksUpdateCommand from(Map<String, Object> commandDetail) {
        if (commandDetail == null || commandDetail.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "UPDATE_COMMAND_DETAIL_EMPTY");
        }
        // Optionally validate required fields, e.g. "table" and "set"
        if (!commandDetail.containsKey("table") || !commandDetail.containsKey("set")) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "UPDATE_COMMAND_MISSING_FIELDS");
        }
        return new DatabricksUpdateCommand(commandDetail);
    }
}

package org.lowcoder.plugin.databricks.gui;

import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import java.util.Map;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.InsertCommand;

import com.google.common.annotations.VisibleForTesting;

public class DatabricksInsertCommand extends InsertCommand {

    private DatabricksInsertCommand(Map<String, Object> commandDetail) {
        super(commandDetail, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    @VisibleForTesting
    protected DatabricksInsertCommand(String table, ChangeSet changeSet) {
        super(table, changeSet, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    public static DatabricksInsertCommand from(Map<String, Object> detail) {
        if (detail == null || detail.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "INSERT_COMMAND_DETAIL_EMPTY");
        }
        // Optionally validate required fields, e.g. "table" and "values"
        if (!detail.containsKey("table") || !detail.containsKey("values")) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "INSERT_COMMAND_MISSING_FIELDS");
        }
        return new DatabricksInsertCommand(detail);
    }

    // No changes needed for DatabricksInsertCommand
}

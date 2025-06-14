package org.lowcoder.plugin.databricks.gui;

import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkInsertCommand;

import java.util.Map;

public class DatabricksBulkInsertCommand extends BulkInsertCommand {

    protected DatabricksBulkInsertCommand(String table, BulkObjectChangeSet bulkObjectChangeSet) {
        super(table, bulkObjectChangeSet, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    public static BulkInsertCommand from(Map<String, Object> commandDetail) {
        if (commandDetail == null || commandDetail.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "BULK_INSERT_COMMAND_DETAIL_EMPTY");
        }
        String table = GuiSqlCommand.parseTable(commandDetail);
        String recordStr = BulkObjectChangeSet.parseBulkRecords(commandDetail);
        if (table == null || table.isEmpty() || recordStr == null || recordStr.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "BULK_INSERT_COMMAND_MISSING_FIELDS");
        }
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new DatabricksBulkInsertCommand(table, bulkObjectChangeSet);
    }
}

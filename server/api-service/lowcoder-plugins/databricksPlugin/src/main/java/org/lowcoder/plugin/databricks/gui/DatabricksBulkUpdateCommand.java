package org.lowcoder.plugin.databricks.gui;

import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.plugin.databricks.gui.GuiConstants.DATABRICKS_COLUMN_DELIMITER_BACK;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkUpdateCommand;

import java.util.Map;

public class DatabricksBulkUpdateCommand extends BulkUpdateCommand {

    protected DatabricksBulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet, String primaryKey) {
        super(table, bulkObjectChangeSet, primaryKey, DATABRICKS_COLUMN_DELIMITER_FRONT, DATABRICKS_COLUMN_DELIMITER_BACK);
    }

    public static DatabricksBulkUpdateCommand from(Map<String, Object> commandDetail) {
        if (commandDetail == null || commandDetail.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "BULK_UPDATE_COMMAND_DETAIL_EMPTY");
        }
        String table = GuiSqlCommand.parseTable(commandDetail);
        String recordStr = BulkObjectChangeSet.parseBulkRecords(commandDetail);
        String primaryKey = BulkObjectChangeSet.parsePrimaryKey(commandDetail);
        if (table == null || table.isEmpty() || recordStr == null || recordStr.isEmpty() || primaryKey == null || primaryKey.isEmpty()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "BULK_UPDATE_COMMAND_MISSING_FIELDS");
        }
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new DatabricksBulkUpdateCommand(table, bulkObjectChangeSet, primaryKey);
    }
}

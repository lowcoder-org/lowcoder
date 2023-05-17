package org.lowcoder.plugin.mssql.gui;

import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.parseTable;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parseBulkRecords;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parsePrimaryKey;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkUpdateCommand;

public class MssqlBulkUpdateCommand extends BulkUpdateCommand {

    protected MssqlBulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet, String primaryKey) {
        super(table, bulkObjectChangeSet, primaryKey, MSSQL_COLUMN_DELIMITER_FRONT, MSSQL_COLUMN_DELIMITER_BACK);
    }

    public static MssqlBulkUpdateCommand from(Map<String, Object> commandDetail) {
        String table = parseTable(commandDetail);
        String recordStr = parseBulkRecords(commandDetail);
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new MssqlBulkUpdateCommand(table, bulkObjectChangeSet, parsePrimaryKey(commandDetail));
    }

}

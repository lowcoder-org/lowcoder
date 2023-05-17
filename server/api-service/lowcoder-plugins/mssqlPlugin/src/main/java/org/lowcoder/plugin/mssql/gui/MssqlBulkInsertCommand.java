package org.lowcoder.plugin.mssql.gui;

import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parseBulkRecords;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkInsertCommand;

public class MssqlBulkInsertCommand extends BulkInsertCommand {
    protected MssqlBulkInsertCommand(String table, BulkObjectChangeSet bulkObjectChangeSet) {
        super(table, bulkObjectChangeSet, MSSQL_COLUMN_DELIMITER_FRONT, MSSQL_COLUMN_DELIMITER_BACK);
    }

    public static BulkInsertCommand from(Map<String, Object> commandDetail) {
        String table = GuiSqlCommand.parseTable(commandDetail);
        String recordStr = parseBulkRecords(commandDetail);
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new MssqlBulkInsertCommand(table, bulkObjectChangeSet);
    }
}

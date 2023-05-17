package org.lowcoder.sdk.plugin.sqlcommand.command.postgres;

import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parseBulkRecords;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parsePrimaryKey;
import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.POSTGRES_COLUMN_DELIMITER;
import static org.lowcoder.sdk.util.SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkUpdateCommand;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

public class PostgresBulkUpdateCommand extends BulkUpdateCommand {

    protected PostgresBulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet,
            String primaryKey) {
        super(table, bulkObjectChangeSet, primaryKey, POSTGRES_COLUMN_DELIMITER, POSTGRES_COLUMN_DELIMITER);
    }

    public static PostgresBulkUpdateCommand from(Map<String, Object> commandDetail) {
        String table = GuiSqlCommand.parseTable(commandDetail);
        String recordStr = parseBulkRecords(commandDetail);
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new PostgresBulkUpdateCommand(table, bulkObjectChangeSet, parsePrimaryKey(commandDetail));
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

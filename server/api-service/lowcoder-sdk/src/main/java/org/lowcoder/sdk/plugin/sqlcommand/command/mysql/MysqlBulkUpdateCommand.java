package org.lowcoder.sdk.plugin.sqlcommand.command.mysql;

import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;

import java.util.Map;

import static org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.parseTable;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parseBulkRecords;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parsePrimaryKey;
import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.MYSQL_COLUMN_DELIMITER;
import static org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet.parseOptionalFilterSet;

public class MysqlBulkUpdateCommand extends BulkUpdateCommand {

    protected MysqlBulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet,
            String primaryKey, FilterSet filterSet) {
        super(table, bulkObjectChangeSet, primaryKey, filterSet, MYSQL_COLUMN_DELIMITER, MYSQL_COLUMN_DELIMITER);
    }

    public static MysqlBulkUpdateCommand from(Map<String, Object> commandDetail) {
        String table = parseTable(commandDetail);
        String recordStr = parseBulkRecords(commandDetail);
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new MysqlBulkUpdateCommand(table, bulkObjectChangeSet, parsePrimaryKey(commandDetail),
                parseOptionalFilterSet(commandDetail));
    }

}

package org.lowcoder.sdk.plugin.sqlcommand.command.postgres;

import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

import java.util.Map;

import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parseBulkRecords;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parsePrimaryKey;
import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.POSTGRES_COLUMN_DELIMITER;
import static org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet.parseOptionalFilterSet;
import static org.lowcoder.sdk.util.SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE;

public class PostgresBulkUpdateCommand extends BulkUpdateCommand {

    protected PostgresBulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet,
            String primaryKey, FilterSet filterSet) {
        super(table, bulkObjectChangeSet, primaryKey, filterSet, POSTGRES_COLUMN_DELIMITER, POSTGRES_COLUMN_DELIMITER);
    }

    public static PostgresBulkUpdateCommand from(Map<String, Object> commandDetail) {
        String table = GuiSqlCommand.parseTable(commandDetail);
        String recordStr = parseBulkRecords(commandDetail);
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new PostgresBulkUpdateCommand(table, bulkObjectChangeSet, parsePrimaryKey(commandDetail),
                parseOptionalFilterSet(commandDetail));
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

package org.lowcoder.sdk.plugin.sqlcommand.command.postgres;

import com.google.common.annotations.VisibleForTesting;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.InsertCommand;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

import java.util.Map;

import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.POSTGRES_COLUMN_DELIMITER;
import static org.lowcoder.sdk.util.SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE;

public class PostgresInsertCommand extends InsertCommand {

    private PostgresInsertCommand(Map<String, Object> commandDetail) {
        super(commandDetail, POSTGRES_COLUMN_DELIMITER);
    }

    @VisibleForTesting
    protected PostgresInsertCommand(String table, ChangeSet changeSet) {
        super(table, changeSet, POSTGRES_COLUMN_DELIMITER, POSTGRES_COLUMN_DELIMITER);
    }

    public static PostgresInsertCommand from(Map<String, Object> commandDetail) {
        return new PostgresInsertCommand(commandDetail);
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

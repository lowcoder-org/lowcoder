package org.lowcoder.sdk.plugin.sqlcommand.command.mysql;

import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.MYSQL_COLUMN_DELIMITER;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.InsertCommand;

import com.google.common.annotations.VisibleForTesting;

public class MysqlInsertCommand extends InsertCommand {

    private MysqlInsertCommand(Map<String, Object> commandDetail) {
        super(commandDetail, MYSQL_COLUMN_DELIMITER);
    }

    @VisibleForTesting
    protected MysqlInsertCommand(String table, ChangeSet changeSet) {
        super(table, changeSet, MYSQL_COLUMN_DELIMITER, MYSQL_COLUMN_DELIMITER);
    }

    public static MysqlInsertCommand from(Map<String, Object> commandDetail) {
        return new MysqlInsertCommand(commandDetail);
    }


}

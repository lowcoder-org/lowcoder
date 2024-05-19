package org.lowcoder.sdk.plugin.sqlcommand.command.mysql;

import com.google.common.annotations.VisibleForTesting;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;

import java.util.Map;

import static org.lowcoder.sdk.plugin.sqlcommand.command.GuiConstants.MYSQL_COLUMN_DELIMITER;

public class MysqlUpdateCommand extends UpdateCommand {

    private MysqlUpdateCommand(Map<String, Object> commandDetail) {
        super(commandDetail, MYSQL_COLUMN_DELIMITER, MYSQL_COLUMN_DELIMITER);
    }

    @VisibleForTesting
    protected MysqlUpdateCommand(String table, ChangeSet changeSet, FilterSet filterSet, boolean allowMultiModify) {
        super(table, changeSet, filterSet, allowMultiModify, MYSQL_COLUMN_DELIMITER, MYSQL_COLUMN_DELIMITER);
    }

    public static MysqlUpdateCommand from(Map<String, Object> commandDetail) {
        return new MysqlUpdateCommand(commandDetail);
    }
}

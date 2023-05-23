package org.lowcoder.plugin.mssql.gui;

import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_FRONT;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.InsertCommand;

import com.google.common.annotations.VisibleForTesting;

public class MssqlInsertCommand extends InsertCommand {

    private MssqlInsertCommand(Map<String, Object> commandDetail) {
        super(commandDetail, MSSQL_COLUMN_DELIMITER_FRONT, MSSQL_COLUMN_DELIMITER_BACK);
    }

    @VisibleForTesting
    protected MssqlInsertCommand(String table, ChangeSet changeSet) {
        super(table, changeSet, MSSQL_COLUMN_DELIMITER_FRONT, MSSQL_COLUMN_DELIMITER_BACK);
    }

    public static MssqlInsertCommand from(Map<String, Object> commandDetail) {
        return new MssqlInsertCommand(commandDetail);
    }


}

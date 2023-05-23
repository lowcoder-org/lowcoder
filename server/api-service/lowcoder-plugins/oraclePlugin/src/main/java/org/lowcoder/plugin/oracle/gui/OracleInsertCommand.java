package org.lowcoder.plugin.oracle.gui;

import static org.lowcoder.plugin.oracle.gui.GuiConstants.COLUMN_DELIMITER_FRONT;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.InsertCommand;

import com.google.common.annotations.VisibleForTesting;

public class OracleInsertCommand extends InsertCommand {

    private OracleInsertCommand(Map<String, Object> commandDetail) {
        super(commandDetail, COLUMN_DELIMITER_FRONT);
    }

    @VisibleForTesting
    protected OracleInsertCommand(String table, ChangeSet changeSet) {
        super(table, changeSet, COLUMN_DELIMITER_FRONT, COLUMN_DELIMITER_FRONT);
    }

    public static OracleInsertCommand from(Map<String, Object> commandDetail) {
        return new OracleInsertCommand(commandDetail);
    }


}

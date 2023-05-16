package org.lowcoder.plugin.mssql.gui;

import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_BACK;
import static org.lowcoder.plugin.mssql.gui.GuiConstants.MSSQL_COLUMN_DELIMITER_FRONT;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;

import com.google.common.annotations.VisibleForTesting;

public class MssqlUpdateCommand extends UpdateCommand {

    private MssqlUpdateCommand(Map<String, Object> commandDetail) {
        super(commandDetail, MSSQL_COLUMN_DELIMITER_FRONT, MSSQL_COLUMN_DELIMITER_BACK);
    }

    @VisibleForTesting
    protected MssqlUpdateCommand(String table, ChangeSet changeSet, FilterSet filterSet, boolean allowMultiModify) {
        super(table, changeSet, filterSet, allowMultiModify, MSSQL_COLUMN_DELIMITER_FRONT, MSSQL_COLUMN_DELIMITER_BACK);
    }

    @Override
    protected void appendTable(String renderedTable, StringBuilder sb) {
        sb.append("update ");
        if (!allowMultiModify) {
            sb.append(" top (1) ");
        }
        sb.append(renderedTable);
    }

    @Override
    protected void appendLimit(StringBuilder sb) {
        // do nothing
    }

    public static MssqlUpdateCommand from(Map<String, Object> commandDetail) {
        return new MssqlUpdateCommand(commandDetail);
    }
}

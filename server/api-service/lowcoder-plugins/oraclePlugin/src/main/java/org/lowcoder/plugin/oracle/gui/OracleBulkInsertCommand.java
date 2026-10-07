package org.lowcoder.plugin.oracle.gui;

import static org.lowcoder.plugin.oracle.gui.GuiConstants.COLUMN_DELIMITER_FRONT;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet.parseBulkRecords;

import java.util.Map;

import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.command.BulkInsertCommand;

public class OracleBulkInsertCommand extends BulkInsertCommand {

    private static final int SINGLE_ROW = 1;

    protected OracleBulkInsertCommand(String table, BulkObjectChangeSet bulkObjectChangeSet) {
        super(table, bulkObjectChangeSet, COLUMN_DELIMITER_FRONT);
    }

    public static BulkInsertCommand from(Map<String, Object> commandDetail) {
        String table = GuiSqlCommand.parseTable(commandDetail);
        String recordStr = parseBulkRecords(commandDetail);
        BulkObjectChangeSet bulkObjectChangeSet = new BulkObjectChangeSet(recordStr);
        return new OracleBulkInsertCommand(table, bulkObjectChangeSet);
    }

    /**
     * Only a single row is inserted with the generated keys requested. For them the Oracle driver appends {@code RETURNING
     * ROWID INTO ?}, which Oracle accepts only for a single-row {@code VALUES}: the multi-row {@code values (..),(..)} this
     * command renders fails with ORA-63809 and writes nothing (BF-050), and so would {@code INSERT ALL} or
     * {@code INSERT ... SELECT} (ORA-03048). A multi-row insert therefore answers its affected rows without generated keys.
     */
    @Override
    protected boolean returnsGeneratedKeys(int rowCount) {
        return rowCount == SINGLE_ROW;
    }
}

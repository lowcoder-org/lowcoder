package org.lowcoder.sdk.plugin.sqlcommand.command;

import com.google.common.base.Joiner;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetItem;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRow;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRows;
import org.lowcoder.sdk.util.SqlGuiUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.google.common.collect.Lists.newArrayList;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_INSERT_COMMAND;

public class BulkInsertCommand implements GuiSqlCommand {

    protected final String table;
    protected final BulkObjectChangeSet bulkObjectChangeSet;
    private final String columnFrontDelimiter;
    private final String columnBackDelimiter;

    protected BulkInsertCommand(String table, BulkObjectChangeSet bulkObjectChangeSet,
            String columnFrontDelimiter, String columnBackDelimiter) {
        this.table = table;
        this.bulkObjectChangeSet = bulkObjectChangeSet;
        this.columnFrontDelimiter = columnFrontDelimiter;
        this.columnBackDelimiter = columnBackDelimiter;
    }

    protected BulkInsertCommand(String table, BulkObjectChangeSet bulkObjectChangeSet,
            String columnDelimiter) {
        this(table, bulkObjectChangeSet, columnDelimiter, columnDelimiter);
    }

    @SuppressWarnings("DuplicatedCode")
    public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {
        String renderedTable = SqlGuiUtils.renderTableName(table, requestMap, columnFrontDelimiter, columnBackDelimiter);
        ChangeSetRows insertRows = bulkObjectChangeSet.render(requestMap);
        if (insertRows.isEmpty()) {
            throw new PluginException(INVALID_INSERT_COMMAND, "INSERT_DATA_EMPTY");
        }
        if (!insertRows.checkRowColumnAligned()) {
            throw new PluginException(INVALID_INSERT_COMMAND, "INVALID_INSERT_DATA");
        }

        StringBuilder sb = new StringBuilder();
        List<Object> bindParams = newArrayList();

        sb.append("insert into ")
                .append(renderedTable)
                .append(" (");

        Set<String> columns = insertRows.getColumns();
        columns.forEach(column ->
                sb.append(SqlGuiUtils.quoteIdentifier(column, columnFrontDelimiter, columnBackDelimiter)).append(",")
        );

        sb.deleteCharAt(sb.length() - 1).append(") values ");

        if (isRenderWithRawSql()) {
            for (ChangeSetRow row : insertRows) {
                sb.append("(");
                for (String column : columns) {
                    ChangeSetItem item = row.getItem(column);
                    sb.append(item.guiSqlValue().getConcatSqlStr(escapeStrFunc())).append(",");
                }
                sb.deleteCharAt(sb.length() - 1).append("),");
            }
        } else {
            for (ChangeSetRow row : insertRows) {
                appendQuestionMarks(sb, columns);
                for (String column : columns) {
                    ChangeSetItem item = row.getItem(column);
                    bindParams.add(item.guiSqlValue().getValue());
                }
            }
        }
        sb.deleteCharAt(sb.length() - 1);

        return new GuiSqlCommandRenderResult(sb.toString(), bindParams, returnsGeneratedKeys(insertRows.rows().size()));
    }

    /** Whether the insert of {@code rowCount} rows is run with the generated keys requested; true unless a dialect says otherwise. */
    protected boolean returnsGeneratedKeys(int rowCount) {
        return true;
    }

    private static void appendQuestionMarks(StringBuilder sb, Set<String> columns) {
        sb.append("(")
                .append(Joiner.on(",").join(Collections.nCopies(columns.size(), "?")))
                .append("),");
    }

    @Override
    public boolean isInsertCommand() {
        return true;
    }

    @Override
    public Set<String> extractMustacheKeys() {
        return bulkObjectChangeSet.extractMustacheKeys();
    }
}

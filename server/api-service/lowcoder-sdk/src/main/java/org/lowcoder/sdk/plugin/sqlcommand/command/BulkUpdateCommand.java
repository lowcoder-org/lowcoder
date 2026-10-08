package org.lowcoder.sdk.plugin.sqlcommand.command;

import com.google.common.base.Joiner;
import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Sets;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRows;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;
import org.lowcoder.sdk.util.SqlGuiUtils;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.google.common.collect.Lists.newArrayList;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_INSERT_COMMAND;

/**
 * The GUI bulk update: one {@code UPDATE} that sets each record's columns by its primary key, for the rows whose key is
 * among the records' keys and, when the command has a filter, that also match it (F01, GitHub #1641: the filter used to
 * be ignored, so a record outside it was updated too). A bulk update without {@code filterBy} renders as before.
 */
public class BulkUpdateCommand implements GuiSqlCommand {

    private static final String FILTER_START = " and (";
    private static final String FILTER_END = ")";

    protected final String table;
    protected final BulkObjectChangeSet bulkObjectChangeSet;
    protected final String primaryKey;
    protected final FilterSet filterSet;
    protected final String columnFrontDelimiter;
    protected final String columnBackDelimiter;

    protected BulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet, String primaryKey, FilterSet filterSet,
            String columnFrontDelimiter, String columnBackDelimiter) {
        this.table = table;
        this.bulkObjectChangeSet = bulkObjectChangeSet;
        this.primaryKey = primaryKey;
        this.filterSet = filterSet;
        this.columnFrontDelimiter = columnFrontDelimiter;
        this.columnBackDelimiter = columnBackDelimiter;
    }

    protected BulkUpdateCommand(String table, BulkObjectChangeSet bulkObjectChangeSet, String primaryKey, FilterSet filterSet,
            String columnDelimiter) {
        this(table, bulkObjectChangeSet, primaryKey, filterSet, columnDelimiter, columnDelimiter);
    }

    @Override
    public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {

        String renderedTable = SqlGuiUtils.renderTableName(table, requestMap, columnFrontDelimiter, columnBackDelimiter);

        ChangeSetRows updateRows = bulkObjectChangeSet.render(requestMap);
        if (updateRows.isEmpty()) {
            throw new PluginException(INVALID_INSERT_COMMAND, "UPDATE_DATA_EMPTY");
        }

        if (updateRows.stream()
                .anyMatch(row -> !row.getColumns().contains(primaryKey))) {
            throw new PluginException(INVALID_INSERT_COMMAND, "BULK_UPDATE_DATA_NOT_CONTAIN_PRIMARY_KEY");
        }

        StringBuilder sb = new StringBuilder();
        List<Object> bindParams = newArrayList();

        sb.append("UPDATE ").append(renderedTable).append(" set\n");
        appendCaseWhen(updateRows, sb, bindParams);
        appendWhere(updateRows, sb, bindParams);
        appendFilter(requestMap, sb, bindParams);

        return new GuiSqlCommandRenderResult(sb.toString(), bindParams);
    }

    private void appendWhere(ChangeSetRows updateRows, StringBuilder sb, List<Object> bindParams) {
        if (isRenderWithRawSql()) {
            String pkStr = updateRows.stream()
                    .map(row -> row.getItem(primaryKey).guiSqlValue().getConcatSqlStr(escapeStrFunc()))
                    .collect(Collectors.joining(","));
            sb.append("where ").append(quotedPrimaryKey())
                    .append(" in (")
                    .append(pkStr)
                    .append(")");
            return;
        }

        String questionMarks = Joiner.on(",").join(Collections.nCopies(updateRows.size(), "?"));
        sb.append("where ").append(quotedPrimaryKey())
                .append(" in (")
                .append(questionMarks)
                .append(")");
        bindParams.addAll(updateRows.stream()
                .map(row -> row.getItem(primaryKey).guiSqlValue().getValue())
                .toList());
    }

    /** The filter's conditions, ANDed to the primary key list; its bind values follow the keys', as its sql does. */
    private void appendFilter(Map<String, Object> requestMap, StringBuilder sb, List<Object> bindParams) {
        if (filterSet.isEmpty()) {
            return;
        }
        GuiSqlCommandRenderResult conditions = filterSet.renderConditions(requestMap, columnFrontDelimiter, columnBackDelimiter,
                isRenderWithRawSql(), escapeStrFunc());
        sb.append(FILTER_START).append(conditions.sql()).append(FILTER_END);
        bindParams.addAll(conditions.bindParams());
    }

    private void appendCaseWhen(ChangeSetRows updateRows, StringBuilder sb, List<Object> bindParams) {
        // column_1 = CASE WHEN any_column = value THEN column_1_value end,
        ArrayListMultimap<String, Pair<Object, Object>> columnToIdAndValue = ArrayListMultimap.create();

        updateRows.stream().forEach(row -> {
            Object pkValue = row.getItem(primaryKey).guiSqlValue().getValue();
                    row.stream()
                            .filter(changeSetItem -> !primaryKey.equals(changeSetItem.column()))
                            .forEach(changeSetItem -> {
                                String column = changeSetItem.column();
                                Object value = changeSetItem.guiSqlValue().getValue();
                                columnToIdAndValue.put(column, Pair.of(pkValue, value));
                            });
                }
        );
        columnToIdAndValue.asMap().forEach((column, pkAndValues) -> {
                    String columnWithDelimiter = SqlGuiUtils.quoteIdentifier(column, columnFrontDelimiter, columnBackDelimiter);
                    String primaryKeyWithDelimiter = quotedPrimaryKey();
                    sb.append(columnWithDelimiter)
                            .append(" = CASE ");
                    pkAndValues.forEach(pkAndValue -> {
                        Object pkValue = pkAndValue.getKey();
                        Object updateValue = pkAndValue.getValue();

                        if (isRenderWithRawSql()) {
                            sb.append("WHEN ")
                                    .append(primaryKeyWithDelimiter)
                                    .append(" = ")
                                    .append(GuiSqlValue.from(pkValue).getConcatSqlStr(escapeStrFunc()))
                                    .append(" THEN ")
                                    .append(GuiSqlValue.from(updateValue).getConcatSqlStr(escapeStrFunc()))
                                    .append(" ");
                        } else {
                            sb.append("WHEN ")
                                    .append(primaryKeyWithDelimiter)
                                    .append(" = ? THEN ? ");
                            bindParams.add(pkValue);
                            bindParams.add(updateValue);
                        }
                    });
                    sb.append("ELSE ").append(columnWithDelimiter).append(" END,\n");
                }
        );
        sb.deleteCharAt(sb.length() - 1)
                .deleteCharAt(sb.length() - 1)
                .append("\n");
    }

    /**
     * The primary key as the dialect quotes it, in the {@code CASE WHEN} and in the {@code WHERE} alike (BF-051: the
     * {@code WHERE} named it unquoted, so a key whose quoted name differs from its unquoted folding, such as a lower-case
     * key on Oracle, named another column there and failed with ORA-00904).
     */
    private String quotedPrimaryKey() {
        return SqlGuiUtils.quoteIdentifier(primaryKey, columnFrontDelimiter, columnBackDelimiter);
    }

    @Override
    public boolean isInsertCommand() {
        return false;
    }

    @Override
    public Set<String> extractMustacheKeys() {
        return Sets.union(filterSet.extractMustacheKeys(), bulkObjectChangeSet.extractMustacheKeys());
    }
}

package org.lowcoder.sdk.plugin.sqlcommand.command;

import com.google.common.collect.Sets;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRow;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.google.common.collect.Lists.newArrayList;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_UPDATE_COMMAND;
import static org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSet.parseChangeSet;
import static org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet.parseFilterSet;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;

@SuppressWarnings("DuplicatedCode")
public class UpdateCommand implements GuiSqlCommand {

    protected final String table;
    protected final ChangeSet changeSet;
    protected final FilterSet filterSet;
    protected final boolean allowMultiModify;
    private final String columnFrontDelimiter;
    private final String columnBackDelimiter;

    protected UpdateCommand(String table, ChangeSet changeSet,
            FilterSet filterSet, boolean allowMultiModify,
            String columnFrontDelimiter, String columnBackDelimiter) {
        this.table = table;
        this.changeSet = changeSet;
        this.filterSet = filterSet;
        this.allowMultiModify = allowMultiModify;
        this.columnFrontDelimiter = columnFrontDelimiter;
        this.columnBackDelimiter = columnBackDelimiter;
    }

    protected UpdateCommand(Map<String, Object> commandDetail, String columnFrontDelimiter, String columnBackDelimiter) {
        this(GuiSqlCommand.parseTable(commandDetail),
                parseChangeSet(commandDetail),
                parseFilterSet(commandDetail),
                GuiSqlCommand.parseAllowMultiModify(commandDetail),
                columnFrontDelimiter,
                columnBackDelimiter);
    }

    @Override
    public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {

        String renderedTable = renderMustacheString(table, requestMap);
        ChangeSetRow updateRow = changeSet.render(requestMap);
        if (updateRow.isEmpty()) {
            throw new PluginException(INVALID_UPDATE_COMMAND, "UPDATE_DATA_EMPTY");
        }

        StringBuilder sb = new StringBuilder();
        List<Object> bindParams = newArrayList();

        appendTable(renderedTable, sb);
        appendSet(updateRow, sb, bindParams);

        if (filterSet.isEmpty()) {
            return new GuiSqlCommandRenderResult(sb.toString(), bindParams);
        }

        appendFilter(requestMap, sb, bindParams);
        appendLimit(sb);

        return new GuiSqlCommandRenderResult(sb.toString(), bindParams);
    }

    protected void appendSet(ChangeSetRow updateRow, StringBuilder sb, List<Object> bindParams) {

        if (isRenderWithRawSql()) {
            sb.append(" set ");
            updateRow
                    .forEach(item -> sb.append(columnFrontDelimiter)
                            .append(item.column())
                            .append(columnBackDelimiter)
                            .append("=")
                            .append(item.guiSqlValue().getConcatSqlStr(escapeStrFunc()))
                            .append(",")
                    );
            sb.deleteCharAt(sb.length() - 1);
            return;
        }

        List<Object> setValueParams = updateRow.stream()
                .map(it -> it.guiSqlValue().getValue())
                .toList();
        bindParams.addAll(setValueParams);

        sb.append(" set ");
        updateRow.getColumns()
                .forEach(column -> sb.append(columnFrontDelimiter)
                        .append(column)
                        .append(columnBackDelimiter)
                        .append("=?,")
                );
        sb.deleteCharAt(sb.length() - 1);
    }

    protected void appendTable(String renderedTable, StringBuilder sb) {
        sb.append("update ").append(renderedTable);
    }

    protected void appendFilter(Map<String, Object> requestMap, StringBuilder sb, List<Object> bindParams) {
        GuiSqlCommandRenderResult render = filterSet.render(requestMap,
                columnFrontDelimiter, columnBackDelimiter, isRenderWithRawSql(), escapeStrFunc());
        sb.append(render.sql());
        bindParams.addAll(render.bindParams());
    }

    protected void appendLimit(StringBuilder sb) {
        if (!allowMultiModify) {
            sb.append(" limit 1");
        }
    }

    @Override
    public boolean isInsertCommand() {
        return false;
    }

    @Override
    public Set<String> extractMustacheKeys() {
        return Sets.union(filterSet.extractMustacheKeys(), changeSet.extractMustacheKeys());
    }
}

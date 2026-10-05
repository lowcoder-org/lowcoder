package org.lowcoder.sdk.util;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.RenderValues;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateOrDeleteSingleCommandRenderResult;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresBulkInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresBulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresUpdateCommand;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Group {@code downstream-render}, its {@code lowcoder-sdk} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5):
 * values written by the production mapper ({@code toJson}) into SQL text and bind values. Every entry point renders
 * {@link #VALUES} ({@link RenderValues}), one value of every JSON type, and the <em>exact text</em> it produces is pinned, one line per value
 * ({@link GoldenJson#assertText}), under {@value #DIRECTORY}:
 * <ul>
 *   <li>{@code MustacheHelper}: a value rendered into a template, a list rendered into {@code in (...)}, and values
 *       combined inside a quoted SQL string, the three {@code toJson} sites of prepared-statement rendering;</li>
 *   <li>{@code GuiSqlValue.getValue} (the bind value) and {@code getConcatSqlStr} (the SQL text);</li>
 *   <li>the callers of {@code getConcatSqlStr}, each run through its Postgres GUI command (the dialect that
 *       renders raw SQL): insert, update, bulk insert, bulk update (where and both case-when values), and the filter
 *       set (a comparison and an {@code in} list, whose elements are each written by {@code getConcatSqlStr} in
 *       {@code getEscapedCollectionStr}).</li>
 * </ul>
 *
 * <p>Limits: the Postgres string escape wraps text in a random dollar-quote tag
 * ({@code SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE}); the fixture has each tag replaced by {@value #TAG} ({@link #DOLLAR_TAG}).
 * The SQL is pinned as rendered; no database runs it.
 */
public class DownstreamRenderContractTest {

    static final String DIRECTORY = "downstream-render/";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final String TAG = "$tag$";
    /** The random tag of {@code POSTGRES_SQL_STR_ESCAPE}: seven letters between dollar signs. */
    static final Pattern DOLLAR_TAG = Pattern.compile("\\$[A-Za-z]{7}\\$");
    static final String VALUE_PARAM = "v";
    static final String TABLE = "items";
    static final String PRIMARY_KEY = "id";
    /** The values every site renders, by name. */
    static final Map<String, Object> VALUES = RenderValues.values();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/MustacheHelper.java#MustacheHelper.convertToStringValue#toJson#1")
    @Test
    public void renderMustacheString() {
        assertLines("MustacheHelper.renderMustacheString.txt", value -> MustacheHelper.renderMustacheString("v = {{v}}", params(value)));
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/MustacheHelper.java#MustacheHelper.replaceParamWithInOperator#toJson#1")
    @Test
    public void inOperator() {
        assertLines("MustacheHelper.inOperator.txt", value -> prepared("select * from items where id in ({{v}})", Collections.singletonList(value)));
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/MustacheHelper.java#MustacheHelper.generateNewValue#toJson#1")
    @Test
    public void valueInsideQuotes() {
        assertLines("MustacheHelper.valueInsideQuotes.txt", value -> prepared("select * from items where name like '%{{v}}%'", value));
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/SqlGuiUtils.java#SqlGuiUtils.GuiSqlValue.getValue#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/SqlGuiUtils.java#SqlGuiUtils.GuiSqlValue.getConcatSqlStr#toJson#1"})
    @Test
    public void guiSqlValue() {
        assertLines("SqlGuiUtils.GuiSqlValue.txt", value -> {
            GuiSqlValue guiSqlValue = GuiSqlValue.from(value);
            Object bindValue = guiSqlValue.getValue();
            return (bindValue == null ? "null" : bindValue.getClass().getName() + ":" + bindValue)
                    + SEPARATOR + guiSqlValue.getConcatSqlStr(SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE);
        });
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/command/InsertCommand.java#InsertCommand.buildRawSql#getConcatSqlStr#1")
    @Test
    public void insertCommand() {
        assertLines("InsertCommand.txt", value -> sql(PostgresInsertCommand.from(detail(keyValueChangeSet()))));
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/command/UpdateCommand.java#UpdateCommand.appendSet#getConcatSqlStr#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/filter/FilterSet.java#FilterSet.renderCondition#getConcatSqlStr#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/filter/FilterSet.java#FilterSet.getEscapedCollectionStr#getConcatSqlStr#1"})
    @Test
    public void updateCommandWithFilters() {
        assertLines("UpdateCommand.txt", value -> {
            Map<String, Object> detail = detail(keyValueChangeSet());
            detail.put("allowMultiModify", true);
            detail.put("filterBy", List.of(filter(PRIMARY_KEY, "=", "{{v}}"), filter("tags", "in", "{{list}}")));
            return sql(PostgresUpdateCommand.from(detail));
        });
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/command/BulkInsertCommand.java#BulkInsertCommand.render#getConcatSqlStr#1")
    @Test
    public void bulkInsertCommand() {
        assertLines("BulkInsertCommand.txt", value -> {
            Map<String, Object> detail = detail(null);
            detail.put("records", "[{\"id\": 1, \"v\": {{v}}}, {\"id\": 2, \"v\": {{list}}}]");
            return sql(PostgresBulkInsertCommand.from(detail));
        });
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/command/BulkUpdateCommand.java#BulkUpdateCommand.appendWhere#getConcatSqlStr#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/command/BulkUpdateCommand.java#BulkUpdateCommand.appendCaseWhen#getConcatSqlStr#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/command/BulkUpdateCommand.java#BulkUpdateCommand.appendCaseWhen#getConcatSqlStr#2"})
    @Test
    public void bulkUpdateCommand() {
        assertLines("BulkUpdateCommand.txt", value -> {
            Map<String, Object> detail = detail(null);
            detail.put("records", "[{\"id\": {{v}}, \"v\": {{v}}}, {\"id\": {{map}}, \"v\": {{list}}}]");
            detail.put("primaryKey", PRIMARY_KEY);
            return sql(PostgresBulkUpdateCommand.from(detail));
        });
    }

    /** One line per value, {@code name<TAB>text}, or the error in place of the text; dollar-quote tags replaced. */
    private static void assertLines(String fixture, Function<Object, String> render) {
        StringBuilder text = new StringBuilder();
        VALUES.forEach((name, value) -> {
            String rendered;
            try {
                CURRENT.set(value);
                rendered = render.apply(value);
            } catch (RuntimeException e) {
                rendered = "ERROR " + ConfigBinding.errorText(e);
            } finally {
                CURRENT.remove();
            }
            text.append(name).append(SEPARATOR).append(DOLLAR_TAG.matcher(rendered.replace(NEWLINE, " ")).replaceAll(Matcher.quoteReplacement(TAG))).append(NEWLINE);
        });
        System.out.println("[DownstreamRenderContractTest] " + fixture + "\n" + text);
        GOLDEN.assertText(DIRECTORY + fixture, text.toString());
    }

    /** The value being rendered, for the GUI commands, which read it as the request parameter {@code v}. */
    private static final ThreadLocal<Object> CURRENT = new ThreadLocal<>();

    /** {@code sql<TAB>binds}, with a single-row command's select and its statement. */
    private static String sql(GuiSqlCommand command) {
        GuiSqlCommandRenderResult result = command.render(params(CURRENT.get()));
        String text = result.sql() + SEPARATOR + result.bindParams();
        if (result instanceof UpdateOrDeleteSingleCommandRenderResult single) {
            text += SEPARATOR + single.getSelectQuery() + SEPARATOR + single.getSelectBindParams();
        }
        return text;
    }

    /** The prepared SQL, the remaining binding keys and the values bound to them. */
    private static String prepared(String sql, Object value) {
        Map<String, Object> params = params(value);
        List<String> keys = new ArrayList<>(MustacheHelper.extractMustacheKeysInOrder(sql));
        String prepared = MustacheHelper.doPrepareStatement(sql, keys, params);
        List<Object> bound = keys.stream().map(params::get).toList();
        return prepared + SEPARATOR + keys + SEPARATOR + bound;
    }

    /** The request parameters: the value as {@code v}, and a list and a map of mixed values. */
    private static Map<String, Object> params(Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put(VALUE_PARAM, value);
        params.put(RenderValues.LIST, VALUES.get(RenderValues.LIST));
        params.put(RenderValues.MAP, VALUES.get(RenderValues.MAP));
        return params;
    }

    private static Map<String, Object> keyValueChangeSet() {
        Map<String, Object> changeSet = new LinkedHashMap<>();
        changeSet.put("compType", "KEY_VALUE_PAIRS");
        changeSet.put("comp", List.of(Map.of("column", "v", "value", "{{v}}"), Map.of("column", "tags", "value", "{{list}}")));
        return changeSet;
    }

    private static Map<String, Object> detail(Map<String, Object> changeSet) {
        Map<String, Object> detail = new HashMap<>();
        detail.put("table", TABLE);
        if (changeSet != null) {
            detail.put("changeSet", changeSet);
        }
        return detail;
    }

    private static Map<String, Object> filter(String column, String condition, String value) {
        Map<String, Object> filter = new LinkedHashMap<>();
        filter.put("column", column);
        filter.put("condition", condition);
        filter.put("value", value);
        return filter;
    }
}

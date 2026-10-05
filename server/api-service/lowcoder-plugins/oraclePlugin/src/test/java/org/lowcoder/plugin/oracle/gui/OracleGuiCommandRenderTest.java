package org.lowcoder.plugin.oracle.gui;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_INSERT_COMMAND;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_UPDATE_COMMAND;

/**
 * Unit OR-1 (task L5-6), the GUI half: the SQL text and the bind parameters of the five Oracle GUI commands, rendered
 * from the same command-detail maps the executor receives ({@code from(Map)}). Pins the Oracle specifics: a delete or
 * update that does not allow multi modify adds the raw condition {@code rownum=1} to its where clause (and there is no
 * limit clause), double-quoted column delimiters, values bound and never inlined (also an injection-looking value).
 *
 * <p>Limits: the table name is rendered as given (never quoted) and a {@code "} inside a column name is not doubled
 * ({@link #identifiersAreRenderedUnescaped_pinsTheSection9Row}); the command classes keep one filter set, which D15
 * ({@link #renderingTheSameCommandTwiceAddsRownumTwice_pinsD15}) shows.
 */
public class OracleGuiCommandRenderTest {

    static final String TABLE = "ITEMS";
    static final String INJECTION = "'; drop table t; --";
    static final String KEY_TABLE = "table";
    static final String KEY_FILTER = "filterBy";
    static final String KEY_CHANGE_SET = "changeSet";
    static final String KEY_MULTI = "allowMultiModify";
    static final String KEY_RECORDS = "records";
    static final String KEY_PRIMARY = "primaryKey";
    static final Map<String, Object> ID_FILTER = Map.of("column", "id", "condition", "=", "value", "{{id}}");
    static final Map<String, Object> NAME_SET = Map.of("compType", "KEY_VALUE_PAIRS",
            "comp", List.of(Map.of("column", "name", "value", "{{name}}"), Map.of("column", "qty", "value", "3")));

    private static GuiSqlCommandRenderResult print(String label, GuiSqlCommandRenderResult result) {
        System.out.println("[OracleGuiCommandRenderTest] " + label + " -> " + result.sql().replace("\n", "\\n") + " " + result.bindParams());
        return result;
    }

    private static Map<String, Object> detail(Object... keyValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put(KEY_TABLE, TABLE);
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }

    @Test
    public void deleteHasRownumOneUnlessMultiModifyAndBindsTheFilterValue() {
        GuiSqlCommandRenderResult one = print("delete single", OracleDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER))).render(Map.of("id", 7)));
        assertEquals("delete from ITEMS where \"id\" = ?  and rownum=1", one.sql());
        assertEquals(List.of(7), one.bindParams());
        GuiSqlCommandRenderResult many = print("delete multi", OracleDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true)).render(Map.of("id", 7)));
        assertEquals("delete from ITEMS where \"id\" = ? ", many.sql());
        assertEquals(List.of(7), many.bindParams());
    }

    @Test
    public void deleteWithoutFilterIsLimitedByRownumOnlyWhenSingle() {
        GuiSqlCommandRenderResult single = print("delete no filter single", OracleDeleteCommand.from(detail(KEY_FILTER, List.of())).render(Map.of()));
        assertEquals("delete from ITEMS where rownum=1", single.sql());
        assertEquals(List.of(), single.bindParams());
        GuiSqlCommandRenderResult multi = print("delete no filter multi", OracleDeleteCommand.from(detail(KEY_FILTER, List.of(), KEY_MULTI, true)).render(Map.of()));
        assertEquals("delete from ITEMS", multi.sql());
    }

    @Test
    public void deleteBindsAnInjectionLookingValueInsteadOfInliningIt() {
        GuiSqlCommandRenderResult result = print("delete injection", OracleDeleteCommand.from(detail(KEY_FILTER, List.of(
                Map.of("column", "name", "condition", "=", "value", "{{name}}")), KEY_MULTI, true)).render(Map.of("name", INJECTION)));
        assertEquals("delete from ITEMS where \"name\" = ? ", result.sql());
        assertEquals(List.of(INJECTION), result.bindParams());
    }

    @Test
    public void updateHasRownumOneUnlessMultiModify() {
        Map<String, Object> params = Map.of("id", 7, "name", "bob");
        GuiSqlCommandRenderResult one = print("update single", OracleUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER))).render(params));
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=? where \"id\" = ?  and rownum=1", one.sql());
        assertEquals(List.of("bob", 3, 7), one.bindParams());
        GuiSqlCommandRenderResult many = print("update multi", OracleUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true)).render(params));
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=? where \"id\" = ? ", many.sql());
        assertEquals(List.of("bob", 3, 7), many.bindParams());
    }

    @Test
    public void updateWithoutFilterIsLimitedByRownumOnlyWhenSingleAndBindsAnInjectionValue() {
        GuiSqlCommandRenderResult single = print("update no filter single", OracleUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of())).render(Map.of("name", INJECTION)));
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=? where rownum=1", single.sql());
        assertEquals(List.of(INJECTION, 3), single.bindParams());
        GuiSqlCommandRenderResult multi = print("update no filter multi", OracleUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(), KEY_MULTI, true)).render(Map.of("name", "bob")));
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=?", multi.sql());
    }

    /**
     * Pins defect D15 (analysis-plugins section 0.6; plan section 9 D1-D20 row): {@code render()} adds the {@code rownum=1}
     * condition to the command's own filter set on every call, so rendering the same command object twice gives the condition
     * twice. Reachable through the class API only: the server builds a new command for every execution and
     * {@code sanitizeQueryConfig} only extracts the keys, so a normal query run renders each command once. A fix (rendering
     * on a copy of the filter set) changes this test on purpose.
     */
    @Test
    public void renderingTheSameCommandTwiceAddsRownumTwice_pinsD15() {
        GuiSqlCommand delete = OracleDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER)));
        assertEquals("delete from ITEMS where \"id\" = ?  and rownum=1", print("delete render 1", delete.render(Map.of("id", 7))).sql());
        assertEquals("delete from ITEMS where \"id\" = ?  and rownum=1 and rownum=1", print("delete render 2", delete.render(Map.of("id", 7))).sql());
        GuiSqlCommand update = OracleUpdateCommand.from(detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER)));
        Map<String, Object> params = Map.of("id", 7, "name", "bob");
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=? where \"id\" = ?  and rownum=1", print("update render 1", update.render(params)).sql());
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=? where \"id\" = ?  and rownum=1 and rownum=1", print("update render 2", update.render(params)).sql());
    }

    /**
     * Pins the plan section 9 row "GUI SQL commands render identifiers unescaped" (SQL injection; D-6: fix deferred; the
     * render is in the shared sdk classes) for Oracle: the table name is put into the SQL as given (never quoted), and a
     * {@code "} inside a column name is not doubled, so a column name can close its quote and continue with SQL of its own.
     * A fix (quote and escape the identifiers) changes these assertions on purpose.
     */
    @Test
    public void identifiersAreRenderedUnescaped_pinsTheSection9Row() {
        Map<String, Object> deleteDetail = detail(KEY_FILTER, List.of(Map.of("column", "a\"=1 or \"b", "condition", "=", "value", "1")), KEY_MULTI, true);
        deleteDetail.put(KEY_TABLE, "t; drop table x; --");
        GuiSqlCommandRenderResult delete = print("delete raw table and column breakout", OracleDeleteCommand.from(deleteDetail).render(Map.of()));
        assertEquals("delete from t; drop table x; -- where \"a\"=1 or \"b\" = ? ", delete.sql(), "the table is raw and the column closes its quote");
        assertEquals(List.of(1), delete.bindParams());
        GuiSqlCommandRenderResult insert = print("insert column with a quote", OracleInsertCommand.from(detail(KEY_CHANGE_SET, Map.of("compType", "KEY_VALUE_PAIRS",
                "comp", List.of(Map.of("column", "a\"b", "value", "1"))))).render(Map.of()));
        assertEquals("insert into ITEMS (\"a\"b\") values (?)", insert.sql(), "the quote of the column name is not doubled");
        assertEquals(List.of(1), insert.bindParams());
    }

    @Test
    public void insertRendersQuotedColumnsAndBoundValues() {
        GuiSqlCommandRenderResult result = print("insert", OracleInsertCommand.from(detail(KEY_CHANGE_SET, NAME_SET)).render(Map.of("name", INJECTION)));
        assertEquals("insert into ITEMS (\"name\",\"qty\") values (?,?)", result.sql());
        assertEquals(List.of(INJECTION, 3), result.bindParams());
    }

    @Test
    public void aChangeSetWithoutColumnsIsRejectedForInsertAndUpdate() {
        Map<String, Object> noColumns = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of());
        for (String type : List.of("insert", "update")) {
            Map<String, Object> command = detail(KEY_CHANGE_SET, noColumns, KEY_FILTER, List.of(ID_FILTER));
            PluginException thrown = assertThrows(PluginException.class, () -> {
                GuiSqlCommand parsed = type.equals("insert") ? OracleInsertCommand.from(command) : OracleUpdateCommand.from(command);
                parsed.render(Map.of("id", 1));
            });
            System.out.println("[OracleGuiCommandRenderTest] " + type + " without columns: " + thrown.getError() + " " + thrown.getMessageKey());
            assertEquals(type.equals("insert") ? INVALID_INSERT_COMMAND : INVALID_UPDATE_COMMAND, thrown.getError());
            assertEquals(type.equals("insert") ? "INSERT_DATA_EMPTY" : "UPDATE_DATA_EMPTY", thrown.getMessageKey());
        }
    }

    @Test
    public void bulkInsertRendersOneRowOfPlaceholdersPerRecord() {
        GuiSqlCommandRenderResult result = print("bulk insert", OracleBulkInsertCommand.from(detail(
                KEY_RECORDS, "[{\"name\":\"{{n1}}\",\"qty\":1},{\"name\":\"b\",\"qty\":2}]")).render(Map.of("n1", INJECTION)));
        assertEquals("insert into ITEMS (\"name\",\"qty\") values (?,?),(?,?)", result.sql());
        assertEquals(List.of(INJECTION, 1, "b", 2), result.bindParams());
    }

    @Test
    public void bulkUpdateRendersCaseWhenPerColumnAndTheKeysInTheWhere() {
        GuiSqlCommandRenderResult result = print("bulk update", OracleBulkUpdateCommand.from(detail(KEY_PRIMARY, "id",
                KEY_RECORDS, "[{\"id\":1,\"name\":\"a\"},{\"id\":2,\"name\":\"b\"}]")).render(Map.of()));
        assertEquals("UPDATE ITEMS set\n\"name\" = CASE WHEN \"id\" = ? THEN ? WHEN \"id\" = ? THEN ? ELSE \"name\" END\nwhere id in (?,?)", result.sql());
        assertEquals(List.of(1, "a", 2, "b", 1, 2), result.bindParams());
        PluginException missingKey = assertThrows(PluginException.class, () -> OracleBulkUpdateCommand.from(detail(KEY_PRIMARY, "id",
                KEY_RECORDS, "[{\"name\":\"a\"}]")).render(Map.of()));
        assertEquals("BULK_UPDATE_DATA_NOT_CONTAIN_PRIMARY_KEY", missingKey.getMessageKey());
    }

    @Test
    public void mustacheKeysAreExtractedFromFilterAndChangeSet() {
        assertEquals(Set.of("{{id}}"), OracleDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER))).extractMustacheKeys());
        assertEquals(Set.of("{{id}}", "{{name}}"), OracleUpdateCommand.from(detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER))).extractMustacheKeys());
        assertEquals(false, OracleDeleteCommand.from(detail(KEY_FILTER, List.of())).isInsertCommand());
        assertEquals(true, OracleInsertCommand.from(detail(KEY_CHANGE_SET, NAME_SET)).isInsertCommand());
    }

    /** The constructors kept for tests render like the commands built from a detail map. */
    @Test
    public void testConstructorsRenderLikeTheDetailMapCommands() {
        Map<String, Object> columns = new LinkedHashMap<>();
        columns.put("name", "{{name}}");
        columns.put("qty", "3");
        org.lowcoder.sdk.plugin.sqlcommand.changeset.KeyValuePairChangeSet changeSet = org.lowcoder.sdk.plugin.sqlcommand.changeset.KeyValuePairChangeSet.buildForTest(columns);
        GuiSqlCommandRenderResult insert = print("insert (test constructor)", new OracleInsertCommand(TABLE, changeSet).render(Map.of("name", "bob")));
        assertEquals("insert into ITEMS (\"name\",\"qty\") values (?,?)", insert.sql());
        assertEquals(List.of("bob", 3), insert.bindParams());
        org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet filterSet = new org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet();
        filterSet.addCondition("id", "=", "{{id}}");
        GuiSqlCommandRenderResult update = print("update (test constructor)", new OracleUpdateCommand(TABLE, changeSet, filterSet, false).render(Map.of("name", "bob", "id", 7)));
        assertEquals("update ITEMS set \"name\"=?,\"qty\"=? where \"id\" = ?  and rownum=1", update.sql());
        assertEquals(List.of("bob", 3, 7), update.bindParams());
    }

    /**
     * Pins the plan section 9 row "bulk update renders the primary key unquoted while columns are quoted" (D-6: fix deferred;
     * the render is in the shared sdk {@code BulkUpdateCommand}): the key column is double-quoted inside the {@code CASE WHEN}
     * parts but written raw in the {@code where ... in (...)}, and Oracle folds an unquoted name to upper case, so for a
     * mixed-case or lower-case quoted key the statement names a column that does not exist (ORA-00904 on a real server, seen
     * in the L5-6 probe). A fix (quoting the key in the where clause) changes this test on purpose.
     */
    @Test
    public void bulkUpdateRendersTheKeyUnquotedInTheWhereClauseWhileColumnsAreQuoted_pinsTheSection9Row() {
        GuiSqlCommandRenderResult result = print("bulk update mixed-case key", OracleBulkUpdateCommand.from(detail(KEY_PRIMARY, "Id",
                KEY_RECORDS, "[{\"Id\":1,\"name\":\"a\"}]")).render(Map.of()));
        assertEquals("UPDATE ITEMS set\n\"name\" = CASE WHEN \"Id\" = ? THEN ? ELSE \"name\" END\nwhere Id in (?)", result.sql(),
                "the key is quoted in the CASE WHEN and raw in the where clause");
        assertEquals(List.of(1, "a", 1), result.bindParams());
    }
}

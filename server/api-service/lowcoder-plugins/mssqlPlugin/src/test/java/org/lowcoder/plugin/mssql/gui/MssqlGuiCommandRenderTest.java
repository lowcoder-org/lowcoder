package org.lowcoder.plugin.mssql.gui;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_INSERT_COMMAND;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_UPDATE_COMMAND;

/**
 * Unit MS-1 (task L5-5a): the SQL text and the bind parameters of the five MSSQL GUI commands, rendered from the same
 * command-detail maps the executor receives ({@code from(Map)}). Pins the MSSQL specifics: {@code top (1)} for a
 * delete or update that does not allow multi modify (and no limit clause), square-bracket column delimiters, values
 * bound and never inlined (also for a value that looks like an injection).
 *
 * <p>The table name is rendered as given when it is an identifier (never bracketed by the command) and refused
 * otherwise; a {@code ]} inside a column name is doubled (BF-008). The update render with {@code top (1)} has two spaces
 * after {@code update} today; that is asserted as the current rendering, no defect is claimed.
 */
public class MssqlGuiCommandRenderTest {

    static final String TABLE = "dbo.items";
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
        System.out.println("[MssqlGuiCommandRenderTest] " + label + " -> " + result.sql().replace("\n", "\\n") + " " + result.bindParams());
        return result;
    }

    private static Map<String, Object> detail(Object... keyValues) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put(KEY_TABLE, TABLE);
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }

    @Test
    public void deleteHasTopOneUnlessMultiModifyAndBindsTheFilterValue() {
        GuiSqlCommand single = MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER)));
        GuiSqlCommandRenderResult one = print("delete single", single.render(Map.of("id", 7)));
        assertEquals("delete top (1) from dbo.items where [id] = ? ", one.sql());
        assertEquals(List.of(7), one.bindParams());

        GuiSqlCommand multi = MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true));
        GuiSqlCommandRenderResult many = print("delete multi", multi.render(Map.of("id", 7)));
        assertEquals("delete from dbo.items where [id] = ? ", many.sql());
        assertEquals(List.of(7), many.bindParams());
    }

    @Test
    public void deleteWithoutFilterHasNoWhereAndNoBinds() {
        GuiSqlCommandRenderResult single = print("delete no filter single", MssqlDeleteCommand.from(detail(KEY_FILTER, List.of())).render(Map.of()));
        assertEquals("delete top (1) from dbo.items", single.sql());
        assertEquals(List.of(), single.bindParams());
        GuiSqlCommandRenderResult multi = print("delete no filter multi", MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(), KEY_MULTI, true)).render(Map.of()));
        assertEquals("delete from dbo.items", multi.sql());
    }

    @Test
    public void deleteBindsAnInjectionLookingValueInsteadOfInliningIt() {
        GuiSqlCommandRenderResult result = print("delete injection", MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(
                Map.of("column", "name", "condition", "=", "value", "{{name}}")))).render(Map.of("name", INJECTION)));
        assertEquals("delete top (1) from dbo.items where [name] = ? ", result.sql());
        assertEquals(List.of(INJECTION), result.bindParams());
    }

    @Test
    public void deleteFilterOperatorsRenderAsTheSharedFilterSetDoes() {
        GuiSqlCommandRenderResult result = print("delete operators", MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(
                Map.of("column", "a", "condition", "!=", "value", "{{a}}"),
                Map.of("column", "b", "condition", "is", "value", "null"),
                Map.of("column", "c", "condition", "in", "value", "{{ids}}")), KEY_MULTI, true))
                .render(Map.of("a", 1, "ids", List.of(1, 2))));
        assertEquals("delete from dbo.items where [a] != ?  and [b] IS null  and [c] IN (?,?)", result.sql());
        assertEquals(List.of(1, 1, 2), result.bindParams());
        PluginException invalid = assertThrows(PluginException.class, () -> MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(
                Map.of("column", "a", "condition", "like", "value", "x")))).render(Map.of()));
        assertEquals(INVALID_GUI_SETTINGS, invalid.getError());
        assertEquals("GUI_INVALID_FILTER_FIELD", invalid.getMessageKey());
    }

    @Test
    public void updateHasTopOneWithTheCurrentDoubleSpaceUnlessMultiModify() {
        Map<String, Object> params = Map.of("id", 7, "name", "bob");
        GuiSqlCommandRenderResult one = print("update single", MssqlUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER))).render(params));
        assertEquals("update  top (1) dbo.items set [name]=?,[qty]=? where [id] = ? ", one.sql(), "two spaces after update: today's rendering");
        assertEquals(List.of("bob", 3, 7), one.bindParams());

        GuiSqlCommandRenderResult many = print("update multi", MssqlUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true)).render(params));
        assertEquals("update dbo.items set [name]=?,[qty]=? where [id] = ? ", many.sql());
        assertEquals(List.of("bob", 3, 7), many.bindParams());
    }

    @Test
    public void updateWithoutFilterHasNoWhereAndNoLimit() {
        GuiSqlCommandRenderResult result = print("update no filter", MssqlUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of())).render(Map.of("name", "bob")));
        assertEquals("update  top (1) dbo.items set [name]=?,[qty]=?", result.sql());
        assertEquals(List.of("bob", 3), result.bindParams());
    }

    @Test
    public void updateBindsAnInjectionLookingValue() {
        GuiSqlCommandRenderResult result = print("update injection", MssqlUpdateCommand.from(
                detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true)).render(Map.of("id", 1, "name", INJECTION)));
        assertEquals("update dbo.items set [name]=?,[qty]=? where [id] = ? ", result.sql());
        assertEquals(List.of(INJECTION, 3, 1), result.bindParams());
    }

    @Test
    public void insertRendersBracketedColumnsAndBoundValues() {
        GuiSqlCommandRenderResult result = print("insert", MssqlInsertCommand.from(detail(KEY_CHANGE_SET, NAME_SET)).render(Map.of("name", INJECTION)));
        assertEquals("insert into dbo.items ([name],[qty]) values (?,?)", result.sql());
        assertEquals(List.of(INJECTION, 3), result.bindParams());
    }

    @Test
    public void aChangeSetWithoutColumnsIsRejectedWhileParsingTheCommand() {
        Map<String, Object> noColumns = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of());
        for (String type : List.of("insert", "update")) {
            Map<String, Object> command = detail(KEY_CHANGE_SET, noColumns, KEY_FILTER, List.of(ID_FILTER));
            PluginException thrown = assertThrows(PluginException.class, () -> {
                GuiSqlCommand parsed = type.equals("insert") ? MssqlInsertCommand.from(command) : MssqlUpdateCommand.from(command);
                print(type + " without columns", parsed.render(Map.of("id", 1)));
            });
            System.out.println("[MssqlGuiCommandRenderTest] " + type + " without columns: " + thrown.getError() + " " + thrown.getMessageKey());
            assertEquals(type.equals("insert") ? INVALID_INSERT_COMMAND : INVALID_UPDATE_COMMAND, thrown.getError());
            assertEquals(type.equals("insert") ? "INSERT_DATA_EMPTY" : "UPDATE_DATA_EMPTY", thrown.getMessageKey());
        }
    }

    @Test
    public void bulkInsertRendersOneRowOfPlaceholdersPerRecord() {
        GuiSqlCommandRenderResult result = print("bulk insert", MssqlBulkInsertCommand.from(detail(
                KEY_RECORDS, "[{\"name\":\"{{n1}}\",\"qty\":1},{\"name\":\"b\",\"qty\":2}]")).render(Map.of("n1", INJECTION)));
        assertEquals("insert into dbo.items ([name],[qty]) values (?,?),(?,?)", result.sql());
        assertEquals(List.of(INJECTION, 1, "b", 2), result.bindParams());
    }

    @Test
    public void bulkUpdateRendersCaseWhenPerColumnAndTheKeysInTheWhere() {
        GuiSqlCommandRenderResult result = print("bulk update", MssqlBulkUpdateCommand.from(detail(KEY_PRIMARY, "id",
                KEY_RECORDS, "[{\"id\":1,\"name\":\"a\"},{\"id\":2,\"name\":\"b\"}]")).render(Map.of()));
        assertEquals("UPDATE dbo.items set\n[name] = CASE WHEN [id] = ? THEN ? WHEN [id] = ? THEN ? ELSE [name] END\nwhere [id] in (?,?)", result.sql());
        assertEquals(List.of(1, "a", 2, "b", 1, 2), result.bindParams());
        PluginException missingKey = assertThrows(PluginException.class, () -> MssqlBulkUpdateCommand.from(detail(KEY_PRIMARY, "id",
                KEY_RECORDS, "[{\"name\":\"a\"}]")).render(Map.of()));
        assertEquals("BULK_UPDATE_DATA_NOT_CONTAIN_PRIMARY_KEY", missingKey.getMessageKey());
    }

    /** F01 (GitHub #1641): the bulk update's filter is ANDed to the keys in brackets, its value bound after the keys. */
    @Test
    public void bulkUpdateAndsItsFilterToTheKeysF01() {
        GuiSqlCommandRenderResult result = print("bulk update with filter", MssqlBulkUpdateCommand.from(detail(KEY_PRIMARY, "id",
                KEY_RECORDS, "[{\"id\":1,\"name\":\"a\"},{\"id\":2,\"name\":\"b\"}]", KEY_FILTER, List.of(ID_FILTER))).render(Map.of("id", 1)));
        assertEquals("UPDATE dbo.items set\n[name] = CASE WHEN [id] = ? THEN ? WHEN [id] = ? THEN ? ELSE [name] END\nwhere [id] in (?,?) and ([id] = ? )",
                result.sql());
        assertEquals(List.of(1, "a", 2, "b", 1, 2, 1), result.bindParams());
    }

    @Test
    public void mustacheKeysAreExtractedFromFilterAndChangeSet() {
        assertEquals(Set.of("{{id}}"), MssqlDeleteCommand.from(detail(KEY_FILTER, List.of(ID_FILTER))).extractMustacheKeys());
        assertEquals(Set.of("{{id}}", "{{name}}"), MssqlUpdateCommand.from(detail(KEY_CHANGE_SET, NAME_SET, KEY_FILTER, List.of(ID_FILTER))).extractMustacheKeys());
        assertEquals(false, MssqlDeleteCommand.from(detail(KEY_FILTER, List.of())).isInsertCommand());
        assertEquals(true, MssqlInsertCommand.from(detail(KEY_CHANGE_SET, NAME_SET)).isInsertCommand());
    }

    /**
     * BF-008 (SQL injection through GUI identifiers): a table name that is not an identifier is refused before any SQL is
     * built, and a {@code ]} inside a column name is doubled, so the column name stays one bracketed identifier.
     */
    @Test
    public void aTableThatIsNotAnIdentifierIsRefusedAndAClosingBracketInAColumnIsDoubled() {
        Map<String, Object> breakoutTable = detail(KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true);
        breakoutTable.put(KEY_TABLE, "t]; drop table x; --");
        PluginException refused = assertThrows(PluginException.class, () -> MssqlDeleteCommand.from(breakoutTable).render(Map.of("id", 1)));
        System.out.println("[MssqlGuiCommandRenderTest] table breakout -> " + refused.getMessageKey() + " " + List.of(refused.getArgs()));
        assertEquals(INVALID_GUI_SETTINGS, refused.getError());
        assertEquals("GUI_INVALID_TABLE_NAME", refused.getMessageKey());

        Map<String, Object> deleteDetail = detail(KEY_FILTER, List.of(
                Map.of("column", "a]=1 or [b", "condition", "=", "value", "1")), KEY_MULTI, true);
        GuiSqlCommandRenderResult delete = print("delete column breakout", MssqlDeleteCommand.from(deleteDetail).render(Map.of()));
        assertEquals("delete from dbo.items where [a]]=1 or [b] = ? ", delete.sql(), "the column's closing bracket is doubled");
        assertEquals(List.of(1), delete.bindParams());

        Map<String, Object> insertDetail = detail(KEY_CHANGE_SET, Map.of("compType", "KEY_VALUE_PAIRS",
                "comp", List.of(Map.of("column", "a]b", "value", "1"))));
        GuiSqlCommandRenderResult insert = print("insert column with a closing bracket", MssqlInsertCommand.from(insertDetail).render(Map.of()));
        assertEquals("insert into dbo.items ([a]]b]) values (?)", insert.sql(), "the closing bracket of the column name is doubled");
        assertEquals(List.of(1), insert.bindParams());

        Map<String, Object> bracketedTable = detail(KEY_FILTER, List.of(ID_FILTER), KEY_MULTI, true);
        bracketedTable.put(KEY_TABLE, "[dbo].[My Items]");
        GuiSqlCommandRenderResult quoted = print("bracketed table", MssqlDeleteCommand.from(bracketedTable).render(Map.of("id", 1)));
        assertEquals("delete from [dbo].[My Items] where [id] = ? ", quoted.sql(), "a bracketed table name is kept as written");
    }
}

package org.lowcoder.sdk.plugin.sheet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.sdk.plugin.common.constant.Constants.CHANGE_SET_FORM_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.COMP_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.COMP_TYPE_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.RECORD_FORM_KEY;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetBulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSet;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRows;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetKeyValuePairChangeSet;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.KeyValuePairChangeSet;

/**
 * Parsing and rendering of the change sets of the sheet (Google Sheets) GUI commands: the twins of the
 * {@code sqlcommand.changeset} classes. The sqlcommand classes are covered by ChangeSetParseTest; where the twins
 * differ, this class says so.
 */
class SheetChangeSetTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static void assertPluginError(Runnable action, String messageKey, Object... args) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(PluginException.class, e -> {
            assertThat(e.getError()).isEqualTo(PluginCommonError.INVALID_GUI_SETTINGS);
            assertThat(e.getMessageKey()).isEqualTo(messageKey);
            assertThat(e.getArgs()).containsExactly(args);
        });
        System.out.println("[SheetChangeSetTest] rejected with " + messageKey);
    }

    private static Map<String, Object> changeSet(String type, Object comp) {
        Map<String, Object> map = new HashMap<>();
        if (type != null) {
            map.put(COMP_TYPE_KEY, type);
        }
        if (comp != null) {
            map.put(COMP_KEY, comp);
        }
        return map;
    }

    private static Map<String, Object> detail(Object changeSetValue) {
        Map<String, Object> detail = new HashMap<>();
        if (changeSetValue != null) {
            detail.put(CHANGE_SET_FORM_KEY, changeSetValue);
        }
        return detail;
    }

    private static Map<String, Object> pair(Object column, Object value) {
        Map<String, Object> pair = new HashMap<>();
        pair.put("column", column);
        pair.put("value", value);
        return pair;
    }

    private static JsonNode json(String text) {
        try {
            return MAPPER.readTree(text);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException(text, e);
        }
    }

    private static Object valueOf(SheetChangeSetRow row, String column) {
        return row.getItem(column).renderedValue();
    }

    static Stream<Arguments> parseErrorCases() {
        return Stream.of(
                Arguments.of("change set missing", detail(null), "GUI_OPERATION_DATA_EMPTY", new Object[0]),
                Arguments.of("change set not a map", detail("text"), "GUI_OPERATION_DATA_EMPTY", new Object[0]),
                Arguments.of("change set an empty map", detail(new HashMap<>()), "GUI_OPERATION_DATA_EMPTY", new Object[0]),
                Arguments.of("type missing", detail(changeSet(null, List.of())), "GUI_OPERATION_DATA_TYPE_ERROR", new Object[0]),
                Arguments.of("type blank", detail(changeSet("  ", List.of())), "GUI_OPERATION_DATA_TYPE_ERROR", new Object[0]),
                Arguments.of("type unknown (reported upper-cased)", detail(changeSet("foo", List.of())), "GUI_INVALID_DATA_TYPE", new Object[]{"FOO"}),
                Arguments.of("object type with a number", detail(changeSet("OBJECT", 5)), "GUI_INVALID_PARAM", new Object[]{"Integer"}));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("parseErrorCases")
    void sheetParseChangeSetRejectsMalformedChangeSets(String label, Map<String, Object> detail, String messageKey, Object[] args) {
        assertPluginError(() -> SheetChangeSet.parseChangeSet(detail), messageKey, args);
    }

    @Test
    void sheetParseChangeSetBuildsTheTypeNamedInTheDetailIgnoringCase() {
        assertThat(SheetChangeSet.parseChangeSet(detail(changeSet("key_value_pairs", List.of(pair("a", "1")))))).isInstanceOf(SheetKeyValuePairChangeSet.class);
        assertThat(SheetChangeSet.parseChangeSet(detail(changeSet("object", "{\"a\":1}")))).isInstanceOf(SheetObjectChangeSet.class);
        System.out.println("[SheetChangeSetTest] key_value_pairs -> SheetKeyValuePairChangeSet, object -> SheetObjectChangeSet");
    }

    /**
     * Pins the twin of the plan section 9 row "ChangeSet.parseChangeSet: an object-type change set without data throws a
     * NullPointerException instead of a PluginException" (D-6, fix deferred): the sheet class has the same
     * {@code data.getClass()} and is named in that row. A fix changes this test on purpose.
     */
    @Test
    void sheetParseChangeSetObjectTypeWithoutDataThrowsNullPointerException() {
        assertThatThrownBy(() -> SheetChangeSet.parseChangeSet(detail(changeSet("OBJECT", null)))).isInstanceOf(NullPointerException.class);
        System.out.println("[SheetChangeSetTest] object type without data -> NullPointerException (plan section 9 U5 row twin, pinned)");
    }

    @Test
    void sheetKeyValueChangeSetRendersValuesThroughMustacheJsonAndKeepsTheLastDuplicate() {
        List<Object> comp = new ArrayList<>(List.of(pair("n", "{{n}}"), pair("text", "plain"), pair("list", "[1, {{n}}]"), pair("n", "{{m}}")));

        SheetChangeSetRow row = new SheetKeyValuePairChangeSet(comp).render(Map.of("n", 5, "m", 6));

        assertThat(row.getColumns()).containsExactlyInAnyOrder("n", "text", "list");
        assertThat(valueOf(row, "n")).as("the last of two entries for a column wins, rendered").isEqualTo(6);
        assertThat(valueOf(row, "text")).isEqualTo("plain");
        assertThat(valueOf(row, "list")).isEqualTo(List.of(1, 5));
        assertThat(row.isEmpty()).isFalse();
        assertThat(row.iterator().hasNext()).isTrue();
        System.out.println("[SheetChangeSetTest] rendered row: n=" + valueOf(row, "n") + " text=" + valueOf(row, "text") + " list=" + valueOf(row, "list"));
    }

    @Test
    void sheetKeyValueChangeSetRejectsNonMapElementsAndBlankColumns() {
        assertPluginError(() -> new SheetKeyValuePairChangeSet(List.of("text")), "GUI_CHANGE_SET_TYPE_ERROR", "String");
        assertPluginError(() -> new SheetKeyValuePairChangeSet(List.of(pair(" ", "1"))), "GUI_CHANGE_SET_FIELD_EMPTY");
        assertPluginError(() -> new SheetKeyValuePairChangeSet(List.of(pair(null, "1"))), "GUI_CHANGE_SET_FIELD_EMPTY");
    }

    /**
     * BF-047 fixed: {@code Collectors.toMap} refused a null value, so a GUI command that set a column to NULL failed with
     * a NullPointerException when the change set was built; an entry with no {@code value} key ({@code c}) is the same. The SQL change set now renders the column as NULL (bound as
     * null, or the literal {@code null} in an inlined statement); the sheet change set writes an empty cell, since a sheet
     * has no NULL and its handlers write every value as text. The other column keeps its value in both.
     */
    @Test
    void keyValueChangeSetsKeepAnEntryWithoutValueBF047() {
        List<Object> withoutValue = List.of(pair("a", null), pair("b", 1), Map.of("column", "c"));

        List<String> sql = new ArrayList<>();
        new KeyValuePairChangeSet(withoutValue).render(Map.of()).forEach(item -> sql.add(item.column() + "=" + item.guiSqlValue().getValue()
                + " inlined as " + item.guiSqlValue().getConcatSqlStr(text -> "'" + text + "'")));
        List<Object> sheet = new ArrayList<>();
        new SheetKeyValuePairChangeSet(withoutValue).render(Map.of()).forEach(item -> sheet.add(item.column() + "=[" + item.renderedValue() + "]"));

        System.out.println("[SheetChangeSetTest] entry without value -> sql " + sql + ", sheet " + sheet);
        assertThat(sql).containsExactly("a=null inlined as null", "b=1 inlined as 1", "c=null inlined as null");
        assertThat(sheet).containsExactlyInAnyOrder("a=[]", "b=[1]", "c=[]");
    }

    /**
     * Pins today's behaviour, not a defect: the twins differ. The sheet change set accepts a {@code comp} that is not a
     * list as an empty change set, while the sqlcommand {@link KeyValuePairChangeSet} rejects it with GUI_INVALID_PARAM.
     */
    @Test
    void sheetKeyValueChangeSetAcceptsANonListCompAsEmptyWhereTheSqlTwinRejectsIt() {
        SheetChangeSetRow row = new SheetKeyValuePairChangeSet("not a list").render(Map.of());

        assertThat(row.isEmpty()).isTrue();
        assertThat(row.getColumns()).isEmpty();
        assertThatThrownBy(() -> new KeyValuePairChangeSet("not a list")).isInstanceOfSatisfying(PluginException.class,
                e -> assertThat(e.getMessageKey()).isEqualTo("GUI_INVALID_PARAM"));
        System.out.println("[SheetChangeSetTest] sheet twin: non-list comp -> empty row; sql twin: GUI_INVALID_PARAM");
    }

    @Test
    void sheetBulkObjectChangeSetParsesAndRendersRows() {
        Map<String, Object> detail = new HashMap<>();
        detail.put(RECORD_FORM_KEY, "[{\"a\":\"{{v}}\",\"b\":1},{\"a\":2,\"b\":3}]");

        SheetChangeSetRows rows = SheetBulkObjectChangeSet.parseBulkRecords(detail).render(Map.of("v", "x"));

        assertThat(rows.isEmpty()).isFalse();
        List<SheetChangeSetRow> list = new ArrayList<>();
        rows.forEach(list::add);
        assertThat(list).hasSize(2);
        assertThat(valueOf(list.get(0), "a")).isEqualTo("x");
        assertThat(valueOf(list.get(1), "b")).isEqualTo(3);
        assertThat(list.get(0).getColumns()).containsExactlyInAnyOrder("a", "b");
        assertThat(new SheetBulkObjectChangeSet("[]").render(Map.of()).isEmpty()).isTrue();
    }

    @Test
    void sheetBulkObjectChangeSetRejectsMissingRecordsAndMalformedJson() {
        Map<String, Object> wrongType = new HashMap<>();
        wrongType.put(RECORD_FORM_KEY, 5);
        assertPluginError(() -> SheetBulkObjectChangeSet.parseBulkRecords(wrongType), "GUI_CHANGE_SET_EMPTY");
        assertPluginError(() -> SheetBulkObjectChangeSet.parseBulkRecords(Map.of()), "GUI_CHANGE_SET_EMPTY");
        assertPluginError(() -> new SheetBulkObjectChangeSet("{\"a\":1}").render(Map.of()), "GUI_INVALID_JSON_ARRAY_FORMAT");
        // a request map whose lookup fails reaches the catch around the mustache rendering
        Map<String, Object> failing = new HashMap<>() {
            @Override
            public Object get(Object key) {
                throw new IllegalStateException("lookup failed");
            }
        };
        assertPluginError(() -> new SheetBulkObjectChangeSet("{{x}}").render(failing), "GUI_INVALID_JSON_ARRAY_FORMAT");
    }

    @Test
    void sheetRowsAndRowRejectNonArrayAndNonObjectJson() {
        assertPluginError(() -> SheetChangeSetRows.fromJsonNode(json("{\"a\":1}")), "GUI_INVALID_JSON_ARRAY_FORMAT");
        assertPluginError(() -> SheetChangeSetRows.fromJsonNode(json("[1,2]")), "GUI_INVALID_JSON_MAP_TYPE");
        assertPluginError(() -> SheetChangeSetRow.fromJsonNode(json("\"text\"")), "GUI_INVALID_JSON_MAP_TYPE");
        assertThat(SheetChangeSetRow.fromJsonNode(json("{\"a\":1,\"b\":null}")).getItem("b").renderedValue()).isNull();
    }
}

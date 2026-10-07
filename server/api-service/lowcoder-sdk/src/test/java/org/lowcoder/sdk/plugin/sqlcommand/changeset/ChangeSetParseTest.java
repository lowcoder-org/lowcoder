package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.sdk.plugin.common.constant.Constants.CHANGE_SET_FORM_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.COMP_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.COMP_TYPE_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.PRIMARY_KEY_FORM_KEY;
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

/**
 * Parsing and rendering of the change sets behind the GUI insert/update/upsert commands. The non-list {@code comp}
 * message of {@link KeyValuePairChangeSet} is pinned by KeyValuePairChangeSetErrorMessageContractTest and not repeated.
 */
class ChangeSetParseTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static void assertPluginError(Runnable action, String messageKey, Object... args) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(PluginException.class, e -> {
            assertThat(e.getError()).isEqualTo(PluginCommonError.INVALID_GUI_SETTINGS);
            assertThat(e.getMessageKey()).isEqualTo(messageKey);
            assertThat(e.getArgs()).containsExactly(args);
        });
        System.out.println("[ChangeSetParseTest] rejected with " + messageKey);
    }

    /** a request map whose lookups fail, to reach the catch blocks around the mustache rendering */
    private static Map<String, Object> failingRequestMap() {
        return new HashMap<>() {
            @Override
            public Object get(Object key) {
                throw new IllegalStateException("lookup failed");
            }

            @Override
            public boolean containsKey(Object key) {
                throw new IllegalStateException("lookup failed");
            }
        };
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

    private static Map<String, Object> pair(Object column, Object value) {
        Map<String, Object> pair = new HashMap<>();
        pair.put("column", column);
        pair.put("value", value);
        return pair;
    }

    static Stream<Arguments> parseErrorCases() {
        Map<String, Object> missingKey = new HashMap<>();
        Map<String, Object> notAMap = new HashMap<>();
        notAMap.put(CHANGE_SET_FORM_KEY, "text");
        Map<String, Object> emptyMap = new HashMap<>();
        emptyMap.put(CHANGE_SET_FORM_KEY, new HashMap<>());
        Map<String, Object> noType = new HashMap<>();
        noType.put(CHANGE_SET_FORM_KEY, changeSet(null, List.of()));
        Map<String, Object> blankType = new HashMap<>();
        blankType.put(CHANGE_SET_FORM_KEY, changeSet("  ", List.of()));
        Map<String, Object> unknownType = new HashMap<>();
        unknownType.put(CHANGE_SET_FORM_KEY, changeSet("foo", List.of()));
        Map<String, Object> objectWithNumber = new HashMap<>();
        objectWithNumber.put(CHANGE_SET_FORM_KEY, changeSet("OBJECT", 5));
        return Stream.of(
                Arguments.of("change set missing", missingKey, "GUI_OPERATION_DATA_EMPTY", new Object[0]),
                Arguments.of("change set not a map", notAMap, "GUI_OPERATION_DATA_EMPTY", new Object[0]),
                Arguments.of("change set an empty map", emptyMap, "GUI_OPERATION_DATA_EMPTY", new Object[0]),
                Arguments.of("type missing", noType, "GUI_OPERATION_DATA_TYPE_ERROR", new Object[0]),
                Arguments.of("type blank", blankType, "GUI_OPERATION_DATA_TYPE_ERROR", new Object[0]),
                Arguments.of("type unknown (reported upper-cased)", unknownType, "GUI_INVALID_DATA_TYPE", new Object[]{"FOO"}),
                Arguments.of("object type with a number", objectWithNumber, "GUI_INVALID_PARAM", new Object[]{"Integer"}));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("parseErrorCases")
    void parseChangeSetRejectsMalformedChangeSets(String label, Map<String, Object> detail, String messageKey, Object[] args) {
        assertPluginError(() -> ChangeSet.parseChangeSet(detail), messageKey, args);
    }

    @Test
    void parseChangeSetBuildsTheTypeNamedInTheDetailIgnoringCaseAndHonoursTheKeyName() {
        Map<String, Object> detail = new HashMap<>();
        detail.put(CHANGE_SET_FORM_KEY, changeSet("key_value_pairs", List.of(pair("a", 1))));
        detail.put("other", changeSet("object", "{\"a\":1}"));

        assertThat(ChangeSet.parseChangeSet(detail)).isInstanceOf(KeyValuePairChangeSet.class);
        assertThat(ChangeSet.parseChangeSet(detail, "other")).isInstanceOf(ObjectChangeSet.class);
        System.out.println("[ChangeSetParseTest] key_value_pairs -> KeyValuePairChangeSet, object -> ObjectChangeSet");
    }

    /**
     * BF-094 (the plan section 9 row "ChangeSet.parseChangeSet: an object-type change set without data throws a
     * NullPointerException instead of a PluginException", was pinned): an object change set without data is
     * GUI_OPERATION_DATA_EMPTY.
     */
    @Test
    void parseChangeSetObjectTypeWithoutDataIsOperationDataEmptyBF094() {
        Map<String, Object> detail = new HashMap<>();
        detail.put(CHANGE_SET_FORM_KEY, changeSet("OBJECT", null));

        assertPluginError(() -> ChangeSet.parseChangeSet(detail), "GUI_OPERATION_DATA_EMPTY");
    }

    @Test
    void keyValuePairChangeSetRejectsNonMapElementsAndBlankColumns() {
        assertPluginError(() -> new KeyValuePairChangeSet(List.of("text")), "GUI_CHANGE_SET_TYPE_ERROR", "String");
        assertPluginError(() -> new KeyValuePairChangeSet(List.of(pair(" ", 1))), "GUI_CHANGE_SET_FIELD_EMPTY");
        assertPluginError(() -> new KeyValuePairChangeSet(List.of(pair(null, 1))), "GUI_CHANGE_SET_FIELD_EMPTY");
    }

    @Test
    void keyValuePairChangeSetKeepsTheLastValueOfADuplicateColumnAndTheColumnOrder() {
        List<Object> comp = new ArrayList<>(List.of(pair("a", 1), pair("b", 2), pair("a", 3)));

        ChangeSetRow row = new KeyValuePairChangeSet(comp).render(Map.of());

        assertThat(row.getColumns()).containsExactly("a", "b");
        assertThat(row.getItem("a").guiSqlValue().getValue()).isEqualTo(3);
    }

    @Test
    void keyValuePairChangeSetMustacheKeysComeFromStringValuesOnly() {
        KeyValuePairChangeSet changeSet = new KeyValuePairChangeSet(List.of(pair("a", "{{x}}"), pair("b", 5), pair("c", "p {{y}}")));

        assertThat(changeSet.extractMustacheKeys()).containsExactlyInAnyOrder("{{x}}", "{{y}}");
    }

    @Test
    void objectChangeSetRendersAJsonObjectAndRejectsOtherJson() {
        ChangeSetRow row = new ObjectChangeSet("{\"a\":\"{{v}}\",\"b\":2}").render(Map.of("v", "x"));

        assertThat(row.getColumns()).containsExactly("a", "b");
        assertThat(row.getItem("a").guiSqlValue().getValue()).isEqualTo("x");
        assertThat(new ObjectChangeSet("{\"a\":\"{{v}}\"}").extractMustacheKeys()).containsExactly("{{v}}");
        assertPluginError(() -> new ObjectChangeSet("[1]").render(Map.of()), "GUI_INVALID_JSON_MAP_TYPE");
        // malformed text is read leniently as a text node and then rejected by the row factory, with the same key
        assertPluginError(() -> new ObjectChangeSet("not json").render(Map.of()), "GUI_INVALID_JSON_MAP_TYPE");
    }

    @Test
    void aRenderingFailureOfAnObjectOrBulkChangeSetIsReportedAsInvalidJson() {
        assertPluginError(() -> new ObjectChangeSet("{{x}}").render(failingRequestMap()), "GUI_INVALID_JSON_MAP_TYPE");
        assertPluginError(() -> new BulkObjectChangeSet("{{x}}").render(failingRequestMap()), "GUI_INVALID_JSON_ARRAY_FORMAT");
    }

    @Test
    void bulkObjectChangeSetRendersRowsAndRejectsNonArrayJson() {
        ChangeSetRows rows = new BulkObjectChangeSet("[{\"a\":\"{{v}}\"},{\"a\":2}]").render(Map.of("v", "x"));

        assertThat(rows.size()).isEqualTo(2);
        assertThat(rows.getColumns()).containsExactly("a");
        assertThat(rows.stream().map(r -> r.getItem("a").guiSqlValue().getValue())).containsExactly("x", 2);
        assertPluginError(() -> new BulkObjectChangeSet("{\"a\":1}").render(Map.of()), "GUI_INVALID_JSON_ARRAY_FORMAT");
        assertPluginError(() -> new BulkObjectChangeSet("not json").render(Map.of()), "GUI_INVALID_JSON_ARRAY_FORMAT");
        assertThat(new BulkObjectChangeSet("{{rows}}").extractMustacheKeys()).containsExactly("{{rows}}");
    }

    @Test
    void parseBulkRecordsAndPrimaryKeyRequireStrings() {
        Map<String, Object> detail = new HashMap<>();
        detail.put(RECORD_FORM_KEY, "[]");
        detail.put(PRIMARY_KEY_FORM_KEY, "id");
        assertThat(BulkObjectChangeSet.parseBulkRecords(detail)).isEqualTo("[]");
        assertThat(BulkObjectChangeSet.parsePrimaryKey(detail)).isEqualTo("id");

        Map<String, Object> wrongTypes = new HashMap<>();
        wrongTypes.put(RECORD_FORM_KEY, 5);
        wrongTypes.put(PRIMARY_KEY_FORM_KEY, List.of());
        assertPluginError(() -> BulkObjectChangeSet.parseBulkRecords(wrongTypes), "GUI_CHANGE_SET_EMPTY");
        assertPluginError(() -> BulkObjectChangeSet.parsePrimaryKey(wrongTypes), "GUI_PRIMARY_KEY_EMPTY");
        assertPluginError(() -> BulkObjectChangeSet.parseBulkRecords(Map.of()), "GUI_CHANGE_SET_EMPTY");
        assertPluginError(() -> BulkObjectChangeSet.parsePrimaryKey(Map.of()), "GUI_PRIMARY_KEY_EMPTY");
    }

    private static JsonNode json(String text) {
        try {
            return MAPPER.readTree(text);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException(text, e);
        }
    }

    private static ChangeSetRows rows(String json) {
        JsonNode node = json(json);
        return ChangeSetRows.fromJsonNode(node);
    }

    @Test
    void changeSetRowsCheckColumnAlignmentByNamesAndCount() {
        assertThat(rows("[{\"a\":1,\"b\":2},{\"b\":3,\"a\":4}]").checkRowColumnAligned()).as("same names, other order").isTrue();
        assertThat(rows("[{\"a\":1},{\"b\":2}]").checkRowColumnAligned()).as("same count, other names").isFalse();
        assertThat(rows("[{\"a\":1,\"b\":2},{\"a\":3}]").checkRowColumnAligned()).as("other count").isFalse();
        assertThat(rows("[]").isEmpty()).isTrue();
    }

    @Test
    void changeSetRowsAndRowsRejectNonArrayAndNonObjectNodes() {
        assertPluginError(() -> ChangeSetRows.fromJsonNode(json("{\"a\":1}")), "GUI_INVALID_JSON_ARRAY_FORMAT");
        assertPluginError(() -> ChangeSetRows.fromJsonNode(json("[1,2]")), "GUI_INVALID_JSON_MAP_TYPE");
        assertPluginError(() -> new ChangeSetRow(json("\"text\"")), "GUI_INVALID_JSON_MAP_TYPE");
    }
}

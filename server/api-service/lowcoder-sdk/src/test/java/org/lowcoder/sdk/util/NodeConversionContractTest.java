package org.lowcoder.sdk.util;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FieldTree;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.plugin.restapi.DataUtils;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetBulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetItem;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRows;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetKeyValuePairChangeSet;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.BulkObjectChangeSet;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetItem;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRow;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ChangeSetRows;
import org.lowcoder.sdk.plugin.sqlcommand.changeset.ObjectChangeSet;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Group {@code node-conversion} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, §4.10, task T8.3): GUI query strings parsed by
 * the non-Jackson {@code rjson} parser, turned into Jackson nodes by hand ({@code RjsonMustacheParser}), Java values
 * of request parameters turned into nodes with {@code valueToTree}, and nodes read back with
 * {@code jsonNodeToObject} ({@code treeToValue(node, Object.class)}). The {@link #TEMPLATES} (int, long, double,
 * {@code BigDecimal}, {@code BigInteger}, boolean, null, text, nested map and list parameters, literals on both sides
 * of 2^31 and 2^63, decimals with trailing zeros and exponents) are rendered with {@link #PARAMS}: one by one by
 * {@code renderMustacheJson}, {@code renderPsBindValue} and the sheet key-value change set; inside one object
 * ({@link #OBJECT_TEMPLATE}) or an array of it by the object and bulk change sets, which also get one case per
 * template of {@link #FAIL_INSIDE_JSON} ({@link #failingCases}). {@code convertToMultiformFileValue} accepts only
 * file objects and gets file templates of its own. Each report pins the Java class of every value it produces ({@link JavaValueWalker}) and
 * the text the production mapper writes for it, or the error. One golden per entry point, under
 * {@value #DIRECTORY}.
 *
 * <p>Limits: the reports pin the values the SDK hands to the SQL and Google Sheets plugins; how a plugin binds them is
 * pinned by the producer tests of T8.2 only as far as the rows go.
 */
public class NodeConversionContractTest {

    static final String DIRECTORY = "node-conversion/";
    static final String NODE_KEY = "node";
    static final String RAW_KEY = "raw";
    static final String VALUE_KEY = "value";
    static final String COLUMN_KEY = "column";
    static final String CONCAT_KEY = "concat";
    static final String QUOTE = "'";
    /** The request parameters every template is rendered with. */
    static final Map<String, Object> PARAMS = params();
    /** The GUI strings every entry point renders, by name. */
    static final Map<String, String> TEMPLATES = templates();
    /**
     * The templates that fail inside a JSON text: a {@code BigDecimal} or {@code BigInteger} parameter, and a literal
     * past {@code Long} (each becomes a number that {@code RjsonMustacheParser} has no node for, O79).
     */
    static final Set<String> FAIL_INSIDE_JSON = Set.of("param:bigDecimal", "param:bigInteger", "longMaxPlusOne");
    /** An object of every template but {@link #FAIL_INSIDE_JSON}, as a GUI "object" change set holds it. */
    static final String OBJECT_TEMPLATE = objectTemplate();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/MustacheHelper.java#MustacheHelper.renderMustacheJson#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/RjsonMustacheParser.java#RjsonMustacheParser.convertToJsonNode#valueToTree#1"})
    @Test
    public void renderMustacheJson() {
        assertReport("renderMustacheJson", perTemplate(template -> nodeReport(MustacheHelper.renderMustacheJson(template, PARAMS))));
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/SqlGuiUtils.java#SqlGuiUtils.renderPsBindValue#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/SqlGuiUtils.java#SqlGuiUtils.renderPsBindValue#jsonNodeToObject#1"})
    @Test
    public void renderPsBindValue() {
        assertReport("SqlGuiUtils.renderPsBindValue", perTemplate(template -> guiSqlValueReport(SqlGuiUtils.renderPsBindValue(template, PARAMS))));
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/changeset/ObjectChangeSet.java#ObjectChangeSet.render#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/changeset/ChangeSetRow.java#ChangeSetRow.parseChangeSetItems#fromJsonNode#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/util/SqlGuiUtils.java#SqlGuiUtils.GuiSqlValue.fromJsonNode#jsonNodeToObject#1"})
    @Test
    public void objectChangeSet() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("object", outcome(() -> rowReport(new ObjectChangeSet(OBJECT_TEMPLATE).render(PARAMS))));
        report.put("array", outcome(() -> rowReport(new ObjectChangeSet("[" + OBJECT_TEMPLATE + "]").render(PARAMS))));
        failingCases(false).forEach((name, template) -> report.put(name, outcome(() -> rowReport(new ObjectChangeSet(template).render(PARAMS)))));
        report.put("invalid", outcome(() -> rowReport(new ObjectChangeSet("{\"a\": ").render(PARAMS))));
        assertReport("ObjectChangeSet.render", report);
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/changeset/BulkObjectChangeSet.java#BulkObjectChangeSet.render#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sqlcommand/changeset/BulkObjectChangeSet.java#BulkObjectChangeSet.render#fromJsonNode#1"})
    @Test
    public void bulkObjectChangeSet() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("array", outcome(() -> rowsReport(new BulkObjectChangeSet("[" + OBJECT_TEMPLATE + ", {\"id\": {{long}}}]").render(PARAMS))));
        report.put("listParameter", outcome(() -> rowsReport(new BulkObjectChangeSet("{{rows}}").render(PARAMS))));
        report.put("object", outcome(() -> rowsReport(new BulkObjectChangeSet(OBJECT_TEMPLATE).render(PARAMS))));
        report.put("arrayOfScalars", outcome(() -> rowsReport(new BulkObjectChangeSet("[1, 2]").render(PARAMS))));
        failingCases(true).forEach((name, template) -> report.put(name, outcome(() -> rowsReport(new BulkObjectChangeSet(template).render(PARAMS)))));
        report.put("invalid", outcome(() -> rowsReport(new BulkObjectChangeSet("[{\"a\": 1},").render(PARAMS))));
        assertReport("BulkObjectChangeSet.render", report);
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetObjectChangeSet.java#SheetObjectChangeSet.render#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetObjectChangeSet.java#SheetObjectChangeSet.render#fromJsonNode#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetChangeSetRow.java#SheetChangeSetRow.fromJsonNode#jsonNodeToObject#1"})
    @Test
    public void sheetObjectChangeSet() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("object", outcome(() -> sheetRowReport(new SheetObjectChangeSet(OBJECT_TEMPLATE).render(PARAMS))));
        report.put("array", outcome(() -> sheetRowReport(new SheetObjectChangeSet("[" + OBJECT_TEMPLATE + "]").render(PARAMS))));
        failingCases(false).forEach((name, template) -> report.put(name, outcome(() -> sheetRowReport(new SheetObjectChangeSet(template).render(PARAMS)))));
        report.put("invalid", outcome(() -> sheetRowReport(new SheetObjectChangeSet("{\"a\": ").render(PARAMS))));
        assertReport("SheetObjectChangeSet.render", report);
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetBulkObjectChangeSet.java#SheetBulkObjectChangeSet.render#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetBulkObjectChangeSet.java#SheetBulkObjectChangeSet.render#fromJsonNode#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetChangeSetRows.java#SheetChangeSetRows.fromJsonNode#::fromJsonNode#1"})
    @Test
    public void sheetBulkObjectChangeSet() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("array", outcome(() -> sheetRowsReport(new SheetBulkObjectChangeSet("[" + OBJECT_TEMPLATE + ", {\"id\": {{long}}}]").render(PARAMS))));
        report.put("listParameter", outcome(() -> sheetRowsReport(new SheetBulkObjectChangeSet("{{rows}}").render(PARAMS))));
        report.put("object", outcome(() -> sheetRowsReport(new SheetBulkObjectChangeSet(OBJECT_TEMPLATE).render(PARAMS))));
        report.put("arrayOfScalars", outcome(() -> sheetRowsReport(new SheetBulkObjectChangeSet("[1, 2]").render(PARAMS))));
        failingCases(true).forEach((name, template) -> report.put(name, outcome(() -> sheetRowsReport(new SheetBulkObjectChangeSet(template).render(PARAMS)))));
        assertReport("SheetBulkObjectChangeSet.render", report);
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetKeyValuePairChangeSet.java#SheetKeyValuePairChangeSet.render#renderMustacheJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/sheet/changeset/SheetKeyValuePairChangeSet.java#SheetKeyValuePairChangeSet.render#jsonNodeToObject#1"})
    @Test
    public void sheetKeyValuePairChangeSet() {
        // one change set per template: one value that cannot be rendered fails the whole change set
        Map<String, Object> report = new LinkedHashMap<>();
        TEMPLATES.forEach((name, template) -> report.put(name, outcome(() -> valueReport(
                new SheetKeyValuePairChangeSet(List.of(Map.of(COLUMN_KEY, name, VALUE_KEY, template))).render(PARAMS).getItem(name).renderedValue()))));
        assertReport("SheetKeyValuePairChangeSet.render", report);
    }

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/restapi/DataUtils.java#DataUtils.convertToMultiformFileValue#renderMustacheJson#1")
    @Test
    public void convertToMultiformFileValue() {
        Map<String, String> files = new LinkedHashMap<>();
        files.put("object", "{\"name\": \"a.txt\", \"type\": \"text/plain\", \"data\": \"{{base64}}\"}");
        files.put("array", "[{\"name\": \"{{str}}\", \"data\": \"aGk=\"}, 1, {\"name\": \"b\", \"data\": \"YQ==\"}]");
        files.put("parameter", "{{file}}");
        files.put("dataNotText", "{\"name\": \"a\", \"data\": {{int}}}");
        files.put("scalar", "{{int}}");
        Map<String, Object> report = new LinkedHashMap<>();
        files.forEach((name, template) -> report.put(name, outcome(() -> FieldTree.of(DataUtils.convertToMultiformFileValue(template, PARAMS)))));
        assertReport("DataUtils.convertToMultiformFileValue", report);
    }

    /** The value a failing call is pinned by. */
    interface Call {
        Object call();
    }

    private static Object outcome(Call call) {
        try {
            return call.call();
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    /** One object per {@link #FAIL_INSIDE_JSON} template, {@code {"value": template}}, in an array when {@code bulk}. */
    private static Map<String, String> failingCases(boolean bulk) {
        Map<String, String> cases = new LinkedHashMap<>();
        TEMPLATES.forEach((name, template) -> {
            if (FAIL_INSIDE_JSON.contains(name)) {
                String object = "{\"" + VALUE_KEY + "\": " + template + "}";
                cases.put("failing:" + name, bulk ? "[" + object + "]" : object);
            }
        });
        return cases;
    }

    private static Map<String, Object> perTemplate(Function<String, Object> entryPoint) {
        Map<String, Object> report = new LinkedHashMap<>();
        TEMPLATES.forEach((name, template) -> report.put(name, outcome(() -> entryPoint.apply(template))));
        return report;
    }

    private static void assertReport(String name, Map<String, Object> report) {
        String actual = ConfigBinding.write(report);
        System.out.println("[NodeConversionContractTest] " + name + "\n" + actual);
        GOLDEN.assertJson(DIRECTORY + name + ".json", actual);
    }

    /** The node's classes by pointer and the text the production mapper writes for it. */
    private static Map<String, Object> nodeReport(JsonNode node) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put(NODE_KEY, JavaValueWalker.shape(node));
        report.put(QueryResults.WRITTEN_KEY, QueryResults.written(node));
        return report;
    }

    /** A Java value's classes by pointer and the text the production mapper writes for it. */
    private static Map<String, Object> valueReport(Object value) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put(JavaValueWalker.CLASSES_KEY, JavaValueWalker.shape(value).get(JavaValueWalker.CLASSES_KEY));
        report.put(QueryResults.WRITTEN_KEY, QueryResults.written(value));
        return report;
    }

    /** The bound value, the bind value a prepared statement gets, and the text concatenated into SQL. */
    private static Map<String, Object> guiSqlValueReport(GuiSqlValue value) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put(RAW_KEY, valueReport(value.getRawValue()));
        report.put(VALUE_KEY, valueReport(value.getValue()));
        report.put(CONCAT_KEY, value.getConcatSqlStr(text -> QUOTE + text + QUOTE));
        return report;
    }

    private static Map<String, Object> rowReport(ChangeSetRow row) {
        Map<String, Object> report = new LinkedHashMap<>();
        for (ChangeSetItem item : row) {
            report.put(item.column(), guiSqlValueReport(item.guiSqlValue()));
        }
        return report;
    }

    private static List<Object> rowsReport(ChangeSetRows rows) {
        return rows.stream().map(row -> (Object) rowReport(row)).toList();
    }

    private static Map<String, Object> sheetRowReport(SheetChangeSetRow row) {
        Map<String, Object> report = new LinkedHashMap<>();
        for (SheetChangeSetItem item : row) {
            report.put(item.column(), valueReport(item.renderedValue()));
        }
        return report;
    }

    private static List<Object> sheetRowsReport(SheetChangeSetRows rows) {
        List<Object> report = new ArrayList<>();
        rows.forEach(row -> report.add(sheetRowReport(row)));
        return report;
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("int", 1);
        params.put("long", 3_000_000_001L);
        params.put("double", 1.5);
        params.put("bigDecimal", new BigDecimal("1.50"));
        params.put("bigInteger", new BigInteger("9223372036854775808"));
        params.put("bool", true);
        params.put("nothing", null);
        params.put("str", "žluť \"quoted\"");
        Map<String, Object> nested = new LinkedHashMap<>();
        nested.put("zeta", 1);
        nested.put("alpha", Arrays.asList(3_000_000_001L, 1.50, null, new BigDecimal("2.50")));
        params.put("map", nested);
        params.put("list", Arrays.asList(1, "two", null, List.of(true)));
        params.put("rows", List.of(Map.of("id", 1), Map.of("id", 2)));
        params.put("base64", "aGVsbG8=");
        params.put("file", Map.of("name", "f.bin", "data", "AAE="));
        return params;
    }

    private static Map<String, String> templates() {
        Map<String, String> templates = new LinkedHashMap<>();
        PARAMS.keySet().stream().filter(name -> !"rows".equals(name) && !"base64".equals(name) && !"file".equals(name))
                .forEach(name -> templates.put("param:" + name, "{{" + name + "}}"));
        templates.put("missingParam", "{{missing}}");
        templates.put("int", "1");
        templates.put("intMaxPlusOne", "2147483648");
        templates.put("longMaxPlusOne", "9223372036854775808");
        templates.put("decimal", "1.50");
        templates.put("decimalPastFloat", "123456.789");
        templates.put("longDecimal", "0.1000000000000000055511151231257827");
        templates.put("exponent", "1e3");
        templates.put("true", "true");
        templates.put("null", "null");
        templates.put("quoted", "\"quoted\"");
        templates.put("text", "plain žluť text");
        templates.put("dateTime", "2022-05-05 11:12:13");
        templates.put("textWithParam", "prefix {{str}} suffix");
        templates.put("array", "[1, {{int}}, \"{{str}}\", 1.50, {{map}}]");
        templates.put("object", "{\"a\": {{map}}, \"b\": 1.50, \"{{str}}\": {{long}}}");
        templates.put("escapedMustache", "\"\\\\{\\\\{int\\\\}\\\\}\"");
        return templates;
    }

    private static String objectTemplate() {
        StringBuilder object = new StringBuilder("{");
        templates().forEach((name, template) -> {
            if (FAIL_INSIDE_JSON.contains(name)) {
                return;
            }
            if (object.length() > 1) {
                object.append(", ");
            }
            boolean jsonValue = !template.contains(" ") || template.startsWith("[") || template.startsWith("{");
            object.append('"').append(name).append("\": ").append(jsonValue ? template : "\"" + template + "\"");
        });
        return object.append('}').toString();
    }
}

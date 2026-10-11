package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

/**
 * The value rendering of the GUI SQL commands. The existing DownstreamRenderContractTest and NodeConversionContractTest
 * pin the golden outputs for JSON-shaped inputs; this class adds the inputs they do not reach: null, blank strings,
 * non-String objects, arrays and the null JSON node.
 */
class SqlGuiUtilsTest {

    private static final EscapeSql QUOTE = s -> "'" + s + "'";

    @Test
    void renderPsBindValueKeepsNullBlankAndNonStringInputsWithoutTemplating() {
        assertThat(SqlGuiUtils.renderPsBindValue(null, Map.of()).getValue()).isNull();
        assertThat(SqlGuiUtils.renderPsBindValue("   ", Map.of("x", 1)).getValue()).as("blank is not a template").isEqualTo("   ");
        assertThat(SqlGuiUtils.renderPsBindValue("", Map.of()).getValue()).isEqualTo("");
        assertThat(SqlGuiUtils.renderPsBindValue(5, Map.of()).getValue()).isEqualTo(5);
        assertThat(SqlGuiUtils.renderPsBindValue("{{x}}", Map.of("x", 7)).getValue()).isEqualTo(7);
        System.out.println("[SqlGuiUtilsTest] renderPsBindValue keeps null / blank / non-String as they are");
    }

    @Test
    void fromJsonNodeOfNullIsASqlNull() {
        GuiSqlValue value = GuiSqlValue.fromJsonNode(null);

        assertThat(value.getValue()).isNull();
        assertThat(value.getRawValue()).isNull();
        assertThat(value.getConcatSqlStr(QUOTE)).isEqualTo("null");
    }

    @Test
    void getValueSerializesCollectionsMapsAndArraysToJsonAndKeepsScalars() {
        assertThat(GuiSqlValue.from(List.of(1, 2)).getValue()).isEqualTo("[1,2]");
        assertThat(GuiSqlValue.from(Map.of("k", "v")).getValue()).isEqualTo("{\"k\":\"v\"}");
        assertThat(GuiSqlValue.from(new int[]{1, 2}).getValue()).isEqualTo("[1,2]");
        assertThat(GuiSqlValue.from("s").getValue()).isEqualTo("s");
        assertThat(GuiSqlValue.from(List.of(1, 2)).getRawValue()).isEqualTo(List.of(1, 2));
    }

    @Test
    void getConcatSqlStrEscapesStringsAndJsonAndWritesScalarsAndOtherObjectsPlain() {
        assertThat(GuiSqlValue.from("a").getConcatSqlStr(QUOTE)).isEqualTo("'a'");
        assertThat(GuiSqlValue.from(Map.of("k", "v")).getConcatSqlStr(QUOTE)).isEqualTo("'{\"k\":\"v\"}'");
        assertThat(GuiSqlValue.from(List.of(1)).getConcatSqlStr(QUOTE)).isEqualTo("'[1]'");
        assertThat(GuiSqlValue.from(12).getConcatSqlStr(QUOTE)).isEqualTo("12");
        assertThat(GuiSqlValue.from(true).getConcatSqlStr(QUOTE)).isEqualTo("true");
        assertThat(GuiSqlValue.from(null).getConcatSqlStr(QUOTE)).isEqualTo("null");
        // any other type is written with String.valueOf and no escaping
        assertThat(GuiSqlValue.from(new StringBuilder("raw")).getConcatSqlStr(QUOTE)).isEqualTo("raw");
    }
}

package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

/**
 * The value rendering of the GUI SQL commands. The existing DownstreamRenderContractTest and NodeConversionContractTest
 * pin the golden outputs for JSON-shaped inputs; this class adds the inputs they do not reach: null, blank strings,
 * non-String objects, arrays and the null JSON node.
 */
class SqlGuiUtilsTest {

    private static final EscapeSql QUOTE = s -> "'" + s + "'";
    private static final String INVALID_TABLE_NAME_KEY = "GUI_INVALID_TABLE_NAME";

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

    @Test
    void quoteIdentifierDoublesTheClosingDelimiterOfEachDialect() {
        assertThat(SqlGuiUtils.quoteIdentifier("name", "`", "`")).isEqualTo("`name`");
        assertThat(SqlGuiUtils.quoteIdentifier("a` = 1 or `b", "`", "`")).isEqualTo("`a`` = 1 or ``b`");
        assertThat(SqlGuiUtils.quoteIdentifier("a\" or \"b", "\"", "\"")).isEqualTo("\"a\"\" or \"\"b\"");
        assertThat(SqlGuiUtils.quoteIdentifier("a]=1 or [b", "[", "]")).isEqualTo("[a]]=1 or [b]");
        System.out.println("[SqlGuiUtilsTest] quoteIdentifier doubles the closing delimiter: " + SqlGuiUtils.quoteIdentifier("a]b", "[", "]"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"users", "dbo.items", "public.users", "[dbo].[My Table]", "[a]]b]", "db.[t]", "#tmp", "Tabulka_č1",
            "  users  "})
    void checkTableNameAcceptsIdentifiersAndBracketQuotedPartsForSqlServer(String table) {
        String checked = SqlGuiUtils.checkTableName(table, "[", "]");

        System.out.println("[SqlGuiUtilsTest] accepted [" + table + "] -> [" + checked + "]");
        assertThat(checked).isEqualTo(table.strip());
    }

    @Test
    void checkTableNameAcceptsTheQuotesOfTheDialect() {
        assertThat(SqlGuiUtils.checkTableName("\"public\".\"My \"\"T\"\"\"", "\"", "\"")).isEqualTo("\"public\".\"My \"\"T\"\"\"");
        assertThat(SqlGuiUtils.checkTableName("`db`.`a``b`", "`", "`")).isEqualTo("`db`.`a``b`");
    }

    @ParameterizedTest
    @ValueSource(strings = {"t]; drop table x; --", "users where 1=1", "users;", "users --", "a.b.", ".a", "", "   ", "[a]b]", "[]",
            "\"users\"", "users/**/", "a-b", "users u"})
    void checkTableNameRejectsAnythingThatIsNotAnIdentifier(String table) {
        assertThatThrownBy(() -> SqlGuiUtils.checkTableName(table, "[", "]"))
                .isInstanceOfSatisfying(PluginException.class, e -> {
                    System.out.println("[SqlGuiUtilsTest] rejected [" + table + "] -> " + e.getMessageKey() + " " + List.of(e.getArgs()));
                    assertThat(e.getError()).isEqualTo(PluginCommonError.INVALID_GUI_SETTINGS);
                    assertThat(e.getMessageKey()).isEqualTo(INVALID_TABLE_NAME_KEY);
                    assertThat(e.getArgs()).containsExactly(table);
                });
    }

    @Test
    void checkTableNameRejectsNullAndBacktickQuotesThatDoNotCloseForMysql() {
        assertThatThrownBy(() -> SqlGuiUtils.checkTableName(null, "`", "`")).isInstanceOf(PluginException.class);
        assertThatThrownBy(() -> SqlGuiUtils.checkTableName("`a` ; drop table x; -- `", "`", "`")).isInstanceOf(PluginException.class);
        assertThatThrownBy(() -> SqlGuiUtils.checkTableName("\"a\\\"\" or 1=1 -- \"", "`", "`"))
                .as("double quotes are not MySQL identifier quotes").isInstanceOf(PluginException.class);
    }

    @Test
    void renderTableNameRendersTheTemplateBeforeTheCheck() {
        assertThat(SqlGuiUtils.renderTableName("{{schema}}.items", Map.of("schema", "dbo"), "[", "]")).isEqualTo("dbo.items");
        assertThatThrownBy(() -> SqlGuiUtils.renderTableName("{{t}}", Map.of("t", "items; drop table x"), "[", "]"))
                .isInstanceOf(PluginException.class);
    }
}

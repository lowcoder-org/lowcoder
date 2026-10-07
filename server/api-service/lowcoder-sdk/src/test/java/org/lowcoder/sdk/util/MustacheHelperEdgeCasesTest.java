package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;

/**
 * Edge cases of {@link MustacheHelper} and the JSON rendering behind it ({@code RjsonMustacheParser}) that
 * MustacheHelperTest does not reach: blank templates, quote handling around placeholders, escaped quotes in prepared
 * statements, the SQL IN rewrite, key extraction and the JSON rendering of parameter values. Inputs already pinned by
 * MustacheHelperTest (tokenizing, quoted strings with braces, the question-mark replacement cases, {@code jsonInMustache},
 * {@code testRenderMustacheJsonString}, {@code typeJudgment}) are not repeated.
 */
class MustacheHelperEdgeCasesTest {

    private static final String SQL_IN_PARSE_ERROR_KEY = "SQL_IN_OPERATOR_PARSE_ERROR";
    private static final String JSON_PARSE_ERROR_KEY = "JSON_PARSE_ERROR";

    private static String prepare(String sql, Map<String, Object> params, List<String> keys) {
        String prepared = MustacheHelper.doPrepareStatement(sql, keys, new HashMap<>(params));
        System.out.println("[MustacheHelperEdgeCasesTest] [" + sql + "] -> [" + prepared + "] keys=" + keys);
        return prepared;
    }

    private static List<String> keys(String... keys) {
        return new ArrayList<>(List.of(keys));
    }

    private static JsonNode renderJson(String template, Map<String, ?> params) {
        JsonNode node = MustacheHelper.renderMustacheJson(template, params);
        System.out.println("[MustacheHelperEdgeCasesTest] json [" + template + "] -> " + node);
        return node;
    }

    // ---- blank templates ----

    @Test
    void blankTemplatesAreReturnedAsIsOrTokenizeToNothing() {
        Map<String, Object> params = Map.of("a", "v");

        assertThat(MustacheHelper.tokenize("")).isEmpty();
        assertThat(MustacheHelper.tokenize("   ")).isEmpty();
        assertThat(MustacheHelper.renderMustacheString(null, params)).isNull();
        assertThat(MustacheHelper.renderMustacheString("", params)).isEmpty();
        assertThat(MustacheHelper.renderMustacheString("  ", params)).isEqualTo("  ");
        assertThat(MustacheHelper.renderMustacheStringWithoutRemoveSurroundedPar(null, params)).isNull();
        assertThat(MustacheHelper.renderMustacheStringWithoutRemoveSurroundedPar("", params)).isEmpty();
        assertThat(MustacheHelper.renderMustacheStringWithoutRemoveSurroundedPar("  ", params)).isEqualTo("  ");
        assertThat(MustacheHelper.extractMustacheKeysWithCurlyBraces("")).isEmpty();
        assertThat(MustacheHelper.extractMustacheKeysInOrder(" ")).isEmpty();
    }

    @Test
    void renderMustacheArrayStringRendersEachElementAndKeepsBlankOnes() {
        String[] rendered = MustacheHelper.renderMustacheArrayString(new String[]{"x {{a}}", "", null, "{{n}}"}, Map.of("a", "v", "n", 5));

        assertThat(rendered).containsExactly("x v", "", null, "5");
    }

    // ---- quotes around a placeholder ----

    @Test
    void theDefaultRenderDropsDoubleQuotesAroundAPlaceholderAndTheOtherRenderKeepsThem() {
        Map<String, Object> params = Map.of("a", "v");

        assertThat(MustacheHelper.renderMustacheString("select \"{{a}}\" x", params)).isEqualTo("select v x");
        assertThat(MustacheHelper.renderMustacheStringWithoutRemoveSurroundedPar("select \"{{a}}\" x", params)).isEqualTo("select \"v\" x");
        assertThat(MustacheHelper.renderMustacheString("\"{{a}}\"", params)).as("a placeholder as the whole text").isEqualTo("v");
        assertThat(MustacheHelper.renderMustacheString("\"{{a}} x", params)).as("a quote on one side only stays").isEqualTo("\"v x");
        assertThat(MustacheHelper.renderMustacheString("{{a}}\"", params)).isEqualTo("v\"");
    }

    // ---- escaped quotes in prepared statements ----

    static Stream<Arguments> escapedQuoteCases() {
        return Stream.of(
                Arguments.of("odd count: the backslash escapes the quote, so the literal goes on",
                        "select * from t where n = '\\'{{a}}'", "select * from t where n = ?"),
                Arguments.of("even count: the quote after two backslashes closes the literal",
                        "select * from t where n = '\\\\' and x = '{{a}}'", "select * from t where n = '\\\\' and x = ?"),
                Arguments.of("no backslash", "select * from t where n = '{{a}}' and m = '%{{a}}%'", "select * from t where n = ? and m = ?"));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("escapedQuoteCases")
    void escapedQuotesDoNotCloseALiteralWhenPreparingStatements(String label, String sql, String expectedPrepared) {
        assertThat(prepare(sql, Map.of("a", "v"), keys("a", "a"))).isEqualTo(expectedPrepared);
    }

    // ---- the SQL IN rewrite ----

    @ParameterizedTest(name = "[{index}] {0}")
    @ValueSource(strings = {"x in ({{l}})", "x IN ({{l}})", "x In ( {{l}} )", "x iN (\n{{l}}\n)"})
    void aCollectionInInParenthesesIsInlinedAndItsKeyIsRemoved(String where) {
        List<String> keys = keys("l");

        String prepared = prepare("select 1 where " + where, Map.of("l", List.of(1, 2)), keys);

        assertThat(prepared).contains("1,2)").doesNotContain("?").doesNotContain("{{");
        assertThat(keys).as("the inlined key is no longer bound").isEmpty();
    }

    @Test
    void inlinedStringElementsKeepTheirJsonDoubleQuotes() {
        List<String> keys = keys("s");

        assertThat(prepare("select 1 where x in ({{s}})", Map.of("s", List.of("a", "b")), keys)).isEqualTo("select 1 where x in (\"a\",\"b\") ");
        assertThat(keys).isEmpty();
    }

    @Test
    void everyInListOfAStatementIsInlinedAndOtherKeysStayBound() {
        List<String> keys = keys("l", "n", "l");

        String prepared = prepare("select 1 where x in ({{l}}) and y = {{n}} and z in ({{l}})", Map.of("l", List.of(1, 2), "n", 5), keys);

        assertThat(prepared).isEqualTo("select 1 where x in (1,2)  and y = ? and z in (1,2) ");
        assertThat(keys).containsExactly("n");
    }

    static Stream<Arguments> notAnInRewriteCases() {
        return Stream.of(
                Arguments.of("an equality with a parenthesis", "select 1 where x = ({{l}})", "select 1 where x = (?)"),
                Arguments.of("no parenthesis at all", "select {{l}}", "select ?"),
                Arguments.of("more after the placeholder", "select 1 where x in ({{l}}, 1)", "select 1 where x in (?, 1)"),
                Arguments.of("no closing parenthesis (text ends)", "select 1 where x in ({{l}}", "select 1 where x in (?"),
                Arguments.of("no closing parenthesis (only blanks follow)", "select 1 where x in ({{l}}   ", "select 1 where x in (?   "));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("notAnInRewriteCases")
    void aCollectionOutsideTheInParenthesesFormStaysABindParameter(String label, String sql, String expectedPrepared) {
        List<String> keys = keys("l");

        assertThat(prepare(sql, Map.of("l", List.of(1, 2)), keys)).isEqualTo(expectedPrepared);
        assertThat(keys).containsExactly("l");
    }

    @Test
    void aNonCollectionValueInInParenthesesStaysABindParameterAndNoKeysChangeNothing() {
        List<String> keys = keys("n");

        assertThat(prepare("select 1 where x in ({{n}})", Map.of("n", 5), keys)).isEqualTo("select 1 where x in (?)");
        assertThat(keys).containsExactly("n");
        assertThat(prepare("select 1", Map.of(), keys())).isEqualTo("select 1");
    }

    @Test
    void aFailureOfTheInRewriteIsWrappedAsSqlInOperatorParseError() {
        assertThatThrownBy(() -> MustacheHelper.doPrepareStatement("select {{a}} , {{a}}", keys("a"), new HashMap<>(Map.of("a", 1))))
                .isInstanceOfSatisfying(PluginException.class, e -> {
                    assertThat(e.getError()).isEqualTo(PluginCommonError.SQL_IN_OPERATOR_PARSE_ERROR);
                    assertThat(e.getMessageKey()).isEqualTo(SQL_IN_PARSE_ERROR_KEY);
                    assertThat(e.getArgs()).hasSize(1);
                    assertThat(String.valueOf(e.getArgs()[0])).contains("out of bounds");
                });
        System.out.println("[MustacheHelperEdgeCasesTest] more placeholders than keys -> SQL_IN_OPERATOR_PARSE_ERROR");
    }

    // ---- key extraction ----

    @Test
    void keyExtractionSkipsPlainTextKeepsEmptyBracesAndTheOrderOfDuplicates() {
        String template = "a {{x}} b {{ y }} {{x}} {{}} plain";

        assertThat(MustacheHelper.extractMustacheKeysWithCurlyBraces(template)).containsExactlyInAnyOrder("{{x}}", "{{ y }}", "{{}}");
        assertThat(MustacheHelper.extractMustacheKeysInOrder(template)).containsExactly("x", "y", "x", "");
    }

    // ---- JSON rendering of parameter values ----

    private static Map<String, Object> jsonParams() {
        Map<String, Object> params = new HashMap<>();
        params.put("x", "X");
        params.put("k", "key");
        params.put("n", 5);
        params.put("l", 5L);
        params.put("f", 1.5f);
        params.put("d", 2.5d);
        params.put("b", true);
        params.put("map", Map.of("q", 1));
        params.put("nul", null);
        params.put("e", "");
        return params;
    }

    @Test
    void jsonRenderingKeepsTheJavaTypeOfEachParameterValue() {
        JsonNode node = renderJson("[{{n}}, {{l}}, {{f}}, {{d}}, {{b}}, {{map}}, {{nul}}, {{missing}}]", jsonParams());

        assertThat(node.toString()).isEqualTo("[5,5,1.5,2.5,true,{\"q\":1},null,null]");
        assertThat(node.get(0).isInt()).isTrue();
        assertThat(node.get(1).isLong()).isTrue();
        assertThat(node.get(2).isFloat()).isTrue();
        assertThat(node.get(3).isDouble()).isTrue();
    }

    @Test
    void jsonRenderingResolvesStringsKeysAndSingleTokens() {
        Map<String, Object> params = jsonParams();

        assertThat(renderJson("{\"a\": \"v {{x}} w\"}", params).toString()).isEqualTo("{\"a\":\"v X w\"}");
        assertThat(renderJson("{\"a\": \"{{x}}\"}", params).toString()).isEqualTo("{\"a\":\"X\"}");
        assertThat(renderJson("{\"{{k}}\": 1}", params).toString()).as("an object key is resolved too").isEqualTo("{\"key\":1}");
        assertThat(renderJson("{\"a\": \"  \"}", params).toString()).as("a blank string value becomes empty").isEqualTo("{\"a\":\"\"}");
        assertThat(renderJson("{\"a\": {{nul}}}", params).toString()).isEqualTo("{\"a\":null}");
        assertThat(renderJson("{{ x }}", params).textValue()).isEqualTo("X");
        assertThat(renderJson("{{e}}", params).textValue()).isEmpty();
        assertThat(renderJson("{{nul}}", params).isNull()).isTrue();
        assertThat(renderJson("{{missing}}", params).isNull()).isTrue();
        assertThat(renderJson("plain text", params).textValue()).isEqualTo("plain text");
    }

    @Test
    void jsonRenderingKeepsNumberLiteralTypes() {
        assertThat(renderJson("{\"a\": 5000000000, \"b\": 1.25e3, \"c\": {{n}}}", jsonParams()).toString())
                .isEqualTo("{\"a\":5000000000,\"b\":1250.0,\"c\":5}");
    }

    @Test
    void invalidJsonAroundATokenIsReportedWithTheEscapedTemplateAndTheParserMessage() {
        for (String template : List.of("{\"a\": {{x}} ", "{\"a\": }{{x}}")) {
            assertThatThrownBy(() -> MustacheHelper.renderMustacheJson(template, jsonParams())).isInstanceOfSatisfying(PluginException.class, e -> {
                assertThat(e.getError()).isEqualTo(PluginCommonError.JSON_PARSE_ERROR);
                assertThat(e.getMessageKey()).isEqualTo(JSON_PARSE_ERROR_KEY);
                assertThat(String.valueOf(e.getArgs()[0])).contains("#replace0");
                assertThat(String.valueOf(e.getArgs()[1])).isNotBlank();
            });
        }
        System.out.println("[MustacheHelperEdgeCasesTest] invalid JSON around a token -> JSON_PARSE_ERROR");
    }

    /**
     * BF-097 (was pinned as the plan section 9 row "RjsonMustacheParser.checkString recognises escaped braces but the
     * rendered JSON drops them", D-6): an escaped mustache {@code \{\{x\}\}} is the literal text {@code {{x}}}, at the top
     * level, inside an object or array, quoted or not, as a key, and next to a mustache of the same parameter that is
     * rendered; it used to be unescaped and rendered against the generated keys, so it became a JSON null or "".
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "\\{\\{x\\}\\}|\"{{x}}\"",
            "\"\\{\\{x\\}\\}\"|\"{{x}}\"",
            "{\"a\": \"\\{\\{x\\}\\}\"}|{\"a\":\"{{x}}\"}",
            "[\"\\{\\{x\\}\\}\"]|[\"{{x}}\"]",
            "{\"a\": \"\\{\\{x\\}\\}\", \"b\": {{n}}}|{\"a\":\"{{x}}\",\"b\":5}",
            "{\"a\": \\{\\{x\\}\\}, \"b\": {{n}}}|{\"a\":\"{{x}}\",\"b\":5}",
            "{\"a\": \"pre \\{\\{x\\}\\} {{x}}\"}|{\"a\":\"pre {{x}} X\"}",
            "{\"\\{\\{x\\}\\}\": {{n}}}|{\"{{x}}\":5}",
            "[\"\\{\\{ x \\}\\}{{x}}\\{\\{n\\}\\}\", {{x}}]|[\"{{ x }}X{{n}}\",\"X\"]"
    })
    void anEscapedMustacheIsItsLiteralTextBF097(String template, String expected) {
        assertThat(renderJson(template, Map.of("x", "X", "n", 5)).toString()).isEqualTo(expected);
    }

    /** BF-097, what does not change: a mustache of a parameter that is missing is still null alone and "" in text. */
    @Test
    void aMustacheOfAMissingParameterIsStillNullAloneAndEmptyInTextBF097() {
        assertThat(renderJson("{\"a\": {{missing}}, \"b\": \"{{missing}}\", \"c\": {{x}}}", Map.of("x", "X")).toString())
                .isEqualTo("{\"a\":null,\"b\":\"\",\"c\":\"X\"}");
    }

    /**
     * BF-096 (was pinned as the plan section 9 row "renderMustacheJson throws JSON_PARSE_ERROR 'unknown number node' for a
     * BigInteger, BigDecimal or Short value", D-6): a Number without a node of its own renders as the number, alone and
     * inside JSON text, and as the same node it gets inside a list parameter (the production mapper's {@code valueToTree},
     * which writes a {@code BigDecimal} without its trailing zeros).
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("numbersWithoutANodeOfTheirOwn")
    void aNumberWithoutANodeOfItsOwnRendersAsTheNumberItGetsInsideAListBF096(Number value, String written) {
        JsonNode alone = renderJson("{{x}}", Map.of("x", value));
        JsonNode insideAList = renderJson("{{list}}", Map.of("list", List.of(value)));

        assertThat(alone.isNumber()).as("a number node, not text").isTrue();
        assertThat(alone.toString()).isEqualTo(written);
        assertThat(alone).isEqualTo(insideAList.get(0));
        assertThat(renderJson("[{{x}}, 1]", Map.of("x", value)).toString()).isEqualTo("[" + written + ",1]");
        System.out.println("[MustacheHelperEdgeCasesTest] " + value.getClass().getSimpleName() + " -> " + alone.getClass().getSimpleName() + " " + alone);
    }

    static Stream<Arguments> numbersWithoutANodeOfTheirOwn() {
        return Stream.of(
                Arguments.of(new BigInteger("12345678901234567890"), "12345678901234567890"),
                Arguments.of(new BigDecimal("1.50"), "1.5"),
                Arguments.of((short) 3, "3"),
                Arguments.of((byte) 7, "7"));
    }

    /**
     * BF-096, reached by a JSON literal beyond the long range: inside a template that also has a mustache it is the
     * number (it used to fail the template), and a template that is only the literal is the number, not its text.
     */
    @Test
    void anIntegerLiteralBeyondTheLongRangeIsTheNumberBF096() {
        assertThat(renderJson("{\"a\": 12345678901234567890, \"b\": {{n}}}", jsonParams()).toString())
                .isEqualTo("{\"a\":12345678901234567890,\"b\":5}");

        JsonNode alone = renderJson("12345678901234567890", Map.of());
        assertThat(alone.isBigInteger()).isTrue();
        assertThat(alone.bigIntegerValue()).isEqualTo(new BigInteger("12345678901234567890"));
    }
}

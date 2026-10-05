package org.lowcoder.sdk.plugin.sqlcommand.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.filter.FilterSet.RawFilterCondition;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

/** Rendering and parsing of the GUI filter conditions of {@link FilterSet} (the where clause of GUI update/delete). */
class FilterSetRenderTest {

    private static final String FRONT = "`";
    private static final String BACK = "`";
    private static final EscapeSql QUOTE = s -> "'" + s + "'";
    private static final Map<String, Object> NO_PARAMS = Map.of();

    private static FilterSet filterSet(Object... columnConditionValue) {
        FilterSet set = new FilterSet();
        for (int i = 0; i < columnConditionValue.length; i += 3) {
            set.addCondition((String) columnConditionValue[i], (String) columnConditionValue[i + 1], columnConditionValue[i + 2]);
        }
        return set;
    }

    private static GuiSqlCommandRenderResult render(FilterSet set, Map<String, Object> params, boolean raw) {
        GuiSqlCommandRenderResult result = set.render(params, FRONT, BACK, raw, QUOTE);
        System.out.println("[FilterSetRenderTest] raw=" + raw + " -> [" + result.sql() + "] " + result.bindParams());
        return result;
    }

    private static void assertPluginError(Runnable action, PluginCommonError error, String messageKey, Object... args) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(PluginException.class, e -> {
            assertThat(e.getError()).isEqualTo(error);
            assertThat(e.getMessageKey()).isEqualTo(messageKey);
            assertThat(e.getArgs()).containsExactly(args);
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"=", "!=", ">", "<", "<=", ">="})
    void comparisonOperatorsRenderAsPlaceholderOrLiteral(String operator) {
        FilterSet set = filterSet("age", operator, 18);

        GuiSqlCommandRenderResult bound = render(set, NO_PARAMS, false);
        assertThat(bound.sql()).isEqualTo(" where `age` " + operator + " ? ");
        assertThat(bound.bindParams()).containsExactly(18);

        GuiSqlCommandRenderResult raw = render(set, NO_PARAMS, true);
        assertThat(raw.sql()).isEqualTo(" where `age` " + operator + " 18");
        assertThat(raw.bindParams()).isEmpty();
    }

    @Test
    void comparisonValueIsRenderedFromTheRequestAndEscapedInRawMode() {
        FilterSet set = filterSet("name", "=", "{{who}}");

        assertThat(render(set, Map.of("who", "jack"), false).bindParams()).containsExactly("jack");
        assertThat(render(set, Map.of("who", "jack"), true).sql()).isEqualTo(" where `name` = 'jack'");
    }

    static Stream<Arguments> isCases() {
        return Stream.of(
                Arguments.of("IS", null, " where `c` IS null "),
                Arguments.of("IS NOT", null, " where `c` IS NOT null "),
                Arguments.of("IS", Boolean.TRUE, " where `c` IS true "),
                Arguments.of("IS NOT", Boolean.FALSE, " where `c` IS NOT false "),
                Arguments.of("IS", "null", " where `c` IS null "),
                Arguments.of("IS", "true", " where `c` IS true "));
    }

    @ParameterizedTest(name = "[{index}] {0} {1}")
    @MethodSource("isCases")
    void isAndIsNotRenderOnlyNullOrBoolean(String operator, Object value, String expectedSql) {
        GuiSqlCommandRenderResult result = render(filterSet("c", operator, value), NO_PARAMS, false);

        assertThat(result.sql()).isEqualTo(expectedSql);
        assertThat(result.bindParams()).isEmpty();
    }

    @Test
    void isRejectsAValueThatIsNeitherNullNorBoolean() {
        assertPluginError(() -> render(filterSet("c", "IS", 5), NO_PARAMS, false),
                PluginCommonError.INVALID_IN_OPERATOR_SETTINGS, "INVALID_IS");
    }

    @ParameterizedTest
    @ValueSource(strings = {"IN", "NOT IN"})
    void inAndNotInBindEveryElementAndSendNestedValuesAsJson(String operator) {
        List<Object> list = List.of(1, "a", true, List.of(2), Map.of("k", "v"));

        GuiSqlCommandRenderResult result = render(filterSet("id", operator, "{{list}}"), Map.of("list", list), false);

        assertThat(result.sql()).isEqualTo(" where `id` " + operator + " (?,?,?,?,?)");
        assertThat(result.bindParams()).containsExactly(1, "a", true, "[2]", "{\"k\":\"v\"}");
    }

    @ParameterizedTest
    @ValueSource(strings = {"IN", "NOT IN"})
    void inAndNotInInRawModeEscapeEveryStringElementWithTheDialectEscaper(String operator) {
        List<Object> list = new ArrayList<>(List.of(1, "a", true, List.of(2)));
        list.add(null);

        GuiSqlCommandRenderResult result = render(filterSet("id", operator, "{{list}}"), Map.of("list", list), true);

        assertThat(result.sql()).isEqualTo(" where `id` " + operator + " (1,'a',true,'[2]',null)");
        assertThat(result.bindParams()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"IN", "NOT IN"})
    void inWithAnEmptyListRendersFalseInsteadOfInvalidSql(String operator) {
        GuiSqlCommandRenderResult result = render(filterSet("id", operator, "{{list}}"), Map.of("list", List.of()), false);

        assertThat(result.sql()).isEqualTo(" where false");
    }

    private static Map<String, Object> deleteDetail(String operator) {
        Map<String, Object> filter = condition("id", operator, "{{value}}");
        Map<String, Object> detail = new HashMap<>();
        detail.put("table", "users");
        detail.put("allowMultiModify", true);
        detail.put("filterBy", List.of(filter));
        return detail;
    }

    /**
     * BF-007 (SQL injection through GUI {@code IN} / {@code NOT IN} filters): an element {@code x' OR '1'='1} is a bind
     * parameter of the MySQL command (prepared statements) and is dollar-quoted by the PostgreSQL command (raw SQL), the
     * same treatment the {@code =} operator gives the value; it is never part of the SQL text as written.
     */
    @Test
    void inListStringElementsAreBoundForMysqlAndDollarQuotedForPostgres() {
        String injection = "x' OR '1'='1";
        Map<String, Object> request = Map.of("value", List.of(injection, "plain"));

        GuiSqlCommandRenderResult mysql = MysqlDeleteCommand.from(deleteDetail("IN")).render(request);
        GuiSqlCommandRenderResult postgres = PostgresDeleteCommand.from(deleteDetail("IN")).render(request);

        System.out.println("[FilterSetRenderTest] mysql IN: " + mysql.sql() + " " + mysql.bindParams());
        System.out.println("[FilterSetRenderTest] postgres IN: " + postgres.sql() + " " + postgres.bindParams());
        assertThat(mysql.sql()).isEqualTo("delete from users where `id` IN (?,?)");
        assertThat(mysql.bindParams()).containsExactly(injection, "plain");
        assertThat(postgres.sql()).matches("delete from users where \"id\" IN \\(\\$([A-Za-z]{7})\\$x' OR '1'='1\\$\\1\\$,"
                + "\\$([A-Za-z]{7})\\$plain\\$\\2\\$\\)");
        assertThat(postgres.bindParams()).isEmpty();
    }

    /** The {@code =} operator with the same value is bound (MySQL) or dollar-quoted (PostgreSQL), as the IN elements above. */
    @Test
    void equalsOperatorWithTheSameValueIsBoundOrEscaped() {
        String injection = "x' OR '1'='1";
        Map<String, Object> request = Map.of("value", injection);

        GuiSqlCommandRenderResult mysql = MysqlDeleteCommand.from(deleteDetail("=")).render(request);
        GuiSqlCommandRenderResult postgres = PostgresDeleteCommand.from(deleteDetail("=")).render(request);

        System.out.println("[FilterSetRenderTest] mysql =: " + mysql.sql() + " " + mysql.bindParams());
        System.out.println("[FilterSetRenderTest] postgres =: " + postgres.sql() + " " + postgres.bindParams());
        assertThat(mysql.sql()).isEqualTo("delete from users where `id` = ? ");
        assertThat(mysql.bindParams()).containsExactly(injection);
        assertThat(postgres.sql()).matches("delete from users where \"id\" = \\$([A-Za-z]{7})\\$x' OR '1'='1\\$\\1\\$");
        assertThat(postgres.bindParams()).isEmpty();
    }

    @Test
    void inRejectsAValueThatIsNotAList() {
        assertPluginError(() -> render(filterSet("id", "IN", 5), NO_PARAMS, false),
                PluginCommonError.INVALID_IN_OPERATOR_SETTINGS, "INVALID_IN");
    }

    @Test
    void unknownOperatorIsRejectedWithItsName() {
        assertPluginError(() -> render(filterSet("c", "LIKE", "x"), NO_PARAMS, false),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_INVALID_FILTER_FIELD", "LIKE");
    }

    @Test
    void conditionsAreJoinedWithAndAndARawConditionIsWrittenVerbatim() {
        FilterSet set = filterSet("a", "=", 1);
        // a RawFilterCondition is column + condition + value concatenated with no binding and no escaping, by design
        set.addCondition(new RawFilterCondition("id", " > ", "5 or 1=1"));

        GuiSqlCommandRenderResult result = render(set, NO_PARAMS, false);

        assertThat(result.sql()).isEqualTo(" where `a` = ?  and id > 5 or 1=1");
        assertThat(result.bindParams()).containsExactly(1);
    }

    /** BF-008: a closing delimiter inside a column name is doubled, so the name cannot end the quoted identifier. */
    @Test
    void aClosingDelimiterInsideAColumnNameIsDoubled() {
        GuiSqlCommandRenderResult backtick = render(filterSet("a` = 1 or `b", "=", 1), NO_PARAMS, false);
        GuiSqlCommandRenderResult bracket = filterSet("a] = 1 or [b", "IN", List.of(1)).render(NO_PARAMS, "[", "]", false, QUOTE);
        System.out.println("[FilterSetRenderTest] bracket -> [" + bracket.sql() + "] " + bracket.bindParams());

        assertThat(backtick.sql()).isEqualTo(" where `a`` = 1 or ``b` = ? ");
        assertThat(bracket.sql()).isEqualTo(" where [a]] = 1 or [b] IN (?)");
        assertThat(bracket.bindParams()).containsExactly(1);
    }

    @Test
    void columnDelimitersAreTheCallersAndAnEmptySetRendersNothing() {
        assertThat(filterSet("a", "=", 1).render(NO_PARAMS, "[", "]", true, QUOTE).sql()).isEqualTo(" where [a] = 1");

        GuiSqlCommandRenderResult empty = render(new FilterSet(), NO_PARAMS, false);
        assertThat(empty.sql()).isEmpty();
        assertThat(empty.bindParams()).isEmpty();
    }

    @Test
    void addConditionOverloadsAppendAndMustacheKeysComeFromStringValuesOnly() {
        FilterSet set = new FilterSet();
        set.addCondition("a", "=", "{{x}}");
        set.addCondition(new FilterSet.FilterCondition("b", "=", 5));
        set.addCondition("c", "=", "plain {{y}} and {{z}}");

        assertThat(set).hasSize(3);
        assertThat(set.extractMustacheKeys()).containsExactlyInAnyOrder("{{x}}", "{{y}}", "{{z}}");
    }

    private static Map<String, Object> condition(String column, String condition, Object value) {
        Map<String, Object> map = new HashMap<>();
        map.put("column", column);
        map.put("condition", condition);
        map.put("value", value);
        return map;
    }

    @Test
    void parseFilterSetBuildsConditionsAndUpperCasesTheOperator() {
        Map<String, Object> detail = Map.of("filterBy", List.of(condition("id", "in", "{{ids}}"), condition("name", "=", "x")));

        FilterSet set = FilterSet.parseFilterSet(detail);

        assertThat(set).hasSize(2);
        assertThat(set.get(0).getCondition()).isEqualTo("IN");
        assertThat(set.get(0).getColumn()).isEqualTo("id");
        assertThat(set.get(1).getValue()).isEqualTo("x");
    }

    static Stream<Arguments> parseErrorCases() {
        List<Object> notMaps = new ArrayList<>();
        notMaps.add("text");
        return Stream.of(
                Arguments.of("filterBy missing", Map.<String, Object>of(), "GUI_FILTER_FIELD_EMPTY", new Object[0]),
                Arguments.of("filterBy not a list", Map.<String, Object>of("filterBy", "x"), "GUI_INVALID_FILTER_FIELD", new Object[]{"String"}),
                Arguments.of("element not a map", Map.<String, Object>of("filterBy", notMaps), "GUI_INVALID_FILTER_FIELD", new Object[]{"String"}),
                Arguments.of("blank column", Map.<String, Object>of("filterBy", List.of(condition(" ", "=", 1))), "GUI_INVALID_FILTER_CONDITION", new Object[0]),
                Arguments.of("blank condition", Map.<String, Object>of("filterBy", List.of(condition("a", "", 1))), "GUI_INVALID_FILTER_CONDITION", new Object[0]),
                Arguments.of("missing condition", Map.<String, Object>of("filterBy", List.of(condition("a", null, 1))), "GUI_INVALID_FILTER_CONDITION", new Object[0]));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("parseErrorCases")
    void parseFilterSetRejectsMalformedFilters(String label, Map<String, Object> detail, String messageKey, Object[] args) {
        assertPluginError(() -> FilterSet.parseFilterSet(detail), PluginCommonError.INVALID_GUI_SETTINGS, messageKey, args);
        System.out.println("[FilterSetRenderTest] parse error: " + label + " -> " + messageKey);
    }
}

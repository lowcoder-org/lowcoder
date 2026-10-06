package org.lowcoder.sdk.plugin.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests of the {@code --} comment handling and the insert detection of {@link SqlQueryUtils}.
 * Block comments ({@code /* ... *}{@code /}) are pinned by L5's SqlBasedQueryExecutorDefectPinTest and not repeated here.
 */
class SqlQueryUtilsTest {

    private static String strip(String query) {
        String result = SqlQueryUtils.removeQueryComments(query);
        System.out.println("[SqlQueryUtilsTest] [" + query.replace("\n", "\\n") + "] -> [" + result.replace("\n", "\\n") + "]");
        return result;
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "trailing comment|select 1 -- why|select 1",
            "comment ends at newline, next line kept|select 1 -- why\\nfrom t|select 1 \\nfrom t",
            "two comment lines|select 1 --a\\n--b\\nfrom t|select 1 \\n\\nfrom t",
            "comment right after code|select 1--why\\nfrom t|select 1\\nfrom t"
    })
    void removeQueryCommentsStripsDashCommentToEndOfLineAndKeepsNextLine(String label, String query, String expected) {
        assertThat(strip(query.replace("\\n", "\n"))).isEqualTo(expected.replace("\\n", "\n"));
    }

    @Test
    void removeQueryCommentsKeepsDashesInsideSingleAndDoubleQuotes() {
        assertThat(strip("select 'a--b' from t")).isEqualTo("select 'a--b' from t");
        assertThat(strip("select \"a--b\" from t")).isEqualTo("select \"a--b\" from t");
        assertThat(strip("select 'a--b' -- why")).as("a comment after the literal is still removed").isEqualTo("select 'a--b'");
    }

    @ParameterizedTest
    @ValueSource(strings = {"a - b", "a-b", "select - 1", "a-b-c", "x = -1"})
    void removeQueryCommentsKeepsSingleDashes(String query) {
        assertThat(strip(query)).isEqualTo(query);
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @CsvSource(delimiter = '|', nullValues = "NULL", value = {
            "''|''", "'   '|''", "-- only a comment|''", "--|''", "---|''", "select 1 --|select 1", "  select 1  |select 1"
    })
    void removeQueryCommentsHandlesEdgeInputsAndTrimsTheResult(String query, String expected) {
        assertThat(strip(query)).isEqualTo(expected.replace("''", ""));
    }

    @ParameterizedTest(name = "[{index}] {0} -> {1}")
    @CsvSource(delimiter = '|', value = {
            "insert into t values (1)|true",
            "INSERT INTO t VALUES (1)|true",
            "   insert into t values (1)|true",
            "insert|true",
            "select 1; insert into t values (1)|true",
            "insert into t values (1); select 1|false",
            "select 1;|false",
            "update t set a = 1|false",
            "select 1|false",
            "''|false"
    })
    void isInsertQueryDecidesByTheLastStatementCaseInsensitive(String query, boolean expected) {
        boolean actual = SqlQueryUtils.isInsertQuery(query.equals("''") ? "" : query);
        System.out.println("[SqlQueryUtilsTest] isInsertQuery [" + query + "] = " + actual);
        assertThat(actual).isEqualTo(expected);
    }

    /**
     * Pins the plan section 9 row "SqlQueryUtils.isInsertQuery(";") throws" (D-6, fix deferred): a query made of
     * semicolons only splits into an empty array and the last-element access fails. A fix changes this test on purpose.
     */
    @ParameterizedTest
    @ValueSource(strings = {";", ";;"})
    void isInsertQueryThrowsArrayIndexOutOfBoundsForSemicolonOnlyQueries(String query) {
        assertThatThrownBy(() -> SqlQueryUtils.isInsertQuery(query)).isInstanceOf(ArrayIndexOutOfBoundsException.class);
        System.out.println("[SqlQueryUtilsTest] isInsertQuery [" + query + "] throws ArrayIndexOutOfBoundsException (plan section 9 row, pinned)");
    }

    /**
     * BF-046 fixed: the hyphen counter was not reset inside a comment, so a second hyphen in the comment deleted the last
     * character already written (the 1, or the space before the comment). The comment alone is removed now.
     */
    @Test
    void removeQueryCommentsHyphensInsideACommentKeepTheQueryBF046() {
        assertThat(strip("select 1--a-b-c\nfrom t")).isEqualTo("select 1\nfrom t");
        assertThat(strip("select 1 -- a-b-c\nfrom t")).isEqualTo("select 1 \nfrom t");
        assertThat(strip("select 1 -- ----\nfrom t")).isEqualTo("select 1 \nfrom t");
    }

    /**
     * BF-046 fixed: a quote inside a {@code --} comment flipped the quote state, so the later literal looked unquoted, its
     * {@code --} started a comment and the rest of the query was cut. Quotes inside a comment are now only comment text,
     * and a quote of the other kind inside a literal does not start anything either.
     */
    @Test
    void removeQueryCommentsQuotesInsideACommentOrTheOtherQuoteKeepTheQueryBF046() {
        assertThat(strip("select 1 -- don't\nfrom t where x='--y'")).isEqualTo("select 1 \nfrom t where x='--y'");
        assertThat(strip("select 1 -- say \"hi\nfrom t where x=\"a--b\"")).isEqualTo("select 1 \nfrom t where x=\"a--b\"");
        assertThat(strip("select 'a\"b' -- c\n, 'd--e'")).isEqualTo("select 'a\"b' \n, 'd--e'");
        assertThat(strip("select 'it''s -- not a comment' -- one")).isEqualTo("select 'it''s -- not a comment'");
    }

    /**
     * The limits stated in the javadoc: block comments are not recognised (BF-092, a later task), so a {@code --} inside
     * one starts a line comment; an unterminated literal keeps the rest of the text.
     */
    @Test
    void removeQueryCommentsKeepsBlockCommentsAndTheRestOfAnUnterminatedLiteral() {
        assertThat(strip("select 1 /* -- */ from t")).isEqualTo("select 1 /*");
        assertThat(strip("select 'open -- text")).isEqualTo("select 'open -- text");
    }
}

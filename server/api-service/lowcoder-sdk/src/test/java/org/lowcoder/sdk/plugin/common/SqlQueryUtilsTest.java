package org.lowcoder.sdk.plugin.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.plugin.common.SqlQueryUtils.QuotingRules;

/**
 * Unit tests of the comment handling ({@code --} and, since BF-092, {@code /* ... *}{@code /}) and the insert detection of
 * {@link SqlQueryUtils}. The executor-level effect of BF-092 (a mustache inside a block comment is no longer bound) is in
 * the sqlBasedPlugin's SqlBasedQueryExecutorDefectPinTest.
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
     * BF-092 fixed (was the limit "block comments are not recognised"): a block comment is removed with its text, a
     * {@code --} inside it included, and leaves one space; an unterminated literal still keeps the rest of the text.
     */
    @Test
    void removeQueryCommentsRemovesBlockCommentsWithADashCommentInsideAndKeepsTheRestOfAnUnterminatedLiteralBF092() {
        assertThat(strip("select 1 /* -- */ from t")).isEqualTo("select 1   from t");
        assertThat(strip("select 'open -- text")).isEqualTo("select 'open -- text");
    }

    /** BF-092: block comments are removed, each leaving one space so the tokens around it stay apart. */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "trailing comment with a mustache|select 1 as one /* {{y}} */|select 1 as one",
            "comment between tokens|select/**/1|select 1",
            "two comments|select /* a */ 1 /* b */|select   1",
            "comment over lines|select 1 /* a\\nb */\\nfrom t|select 1  \\nfrom t",
            "comment start inside a literal|select '/* {{y}} */'|select '/* {{y}} */'",
            "comment start inside a dash comment|select 1 -- /* x\\nfrom t */|select 1 \\nfrom t */",
            "slash and star of one comment are not reused|select 1 /*/ x */ from t|select 1   from t",
            "only a comment|/* nothing */|''"
    })
    void removeQueryCommentsRemovesBlockCommentsBF092(String label, String query, String expected) {
        assertThat(strip(query.replace("\\n", "\n"))).isEqualTo(expected.replace("\\n", "\n").replace("''", ""));
    }

    /** BF-092: quotes inside a block comment are comment text and start no literal; a literal after it is kept whole. */
    @Test
    void removeQueryCommentsIgnoresQuotesInsideABlockCommentBF092() {
        assertThat(strip("select /* it's \"x */ 'a--b'")).isEqualTo("select   'a--b'");
        assertThat(strip("select /* \" */ \"a/*b\" /* ' */")).isEqualTo("select   \"a/*b\"");
    }

    /**
     * BF-092: comment starts inside MySQL/ClickHouse backtick identifiers and terminated dollar-quoted strings are text,
     * kept as written; comments after them are still removed.
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "backtick identifier|select `a/*b*/` /* c */|select `a/*b*/`",
            "dollar quote|select $$ /* {{y}} */ -- $$ /* c */|select $$ /* {{y}} */ -- $$",
            "tagged dollar quote|select $fn$ a $$ /* b */ $fn$ /* c */|select $fn$ a $$ /* b */ $fn$",
            "tag with a digit|select $t1$ /* b */ $t1$|select $t1$ /* b */ $t1$"
    })
    void removeQueryCommentsKeepsCommentStartsInsideBacktickAndDollarQuotesBF092(String label, String query, String expected) {
        assertThat(strip(query)).isEqualTo(expected);
    }

    /**
     * BF-092: under {@link QuotingRules#BRACKET_IDENTIFIERS} (SQL Server) a comment start inside {@code [...]} is text, kept
     * as written, and {@code ]]} is an escaped bracket inside it; under the other rules (and the one-argument method) a
     * bracket is a subscript and the comments inside it are removed like any other.
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "block comment inside|select [a/*b*/] /* c */|select [a/*b*/]|select [a ]",
            "dashes inside|select [a--b] -- c|select [a--b]|select [a",
            "escaped bracket|select [a]]/*b*/] /* c */|select [a]]/*b*/]|select [a]] ]",
            "subscript with a commented mustache|select arr[1 /* {{x}} */]|select arr[1 /* {{x}} */]|select arr[1  ]"
    })
    void removeQueryCommentsReadsBracketsAsIdentifiersOnlyWhenAskedBF092(String label, String query, String withBrackets,
            String withoutBrackets) {
        String bracketResult = SqlQueryUtils.removeQueryComments(query, QuotingRules.BRACKET_IDENTIFIERS);
        System.out.println("[SqlQueryUtilsTest] brackets as identifiers [" + query + "] -> [" + bracketResult + "]");
        assertThat(bracketResult).isEqualTo(withBrackets);
        assertThat(SqlQueryUtils.removeQueryComments(query, QuotingRules.STANDARD)).isEqualTo(withoutBrackets);
        assertThat(strip(query)).as("the one-argument method has no bracket identifiers").isEqualTo(withoutBrackets);
    }

    /** BF-092: a doubled closer is an escaped one inside every quoted span, so a comment start after it is still text. */
    @Test
    void removeQueryCommentsReadsADoubledCloserAsAnEscapeBF092() {
        assertThat(strip("select 'a''/*b*/' /* c */")).isEqualTo("select 'a''/*b*/'");
        assertThat(strip("select \"a\"\"/*b*/\" /* c */")).isEqualTo("select \"a\"\"/*b*/\"");
        assertThat(strip("select `a``/*b*/` /* c */")).isEqualTo("select `a``/*b*/`");
    }

    /**
     * BF-092: a backslash before a closer makes the span ambiguous ({@code 'it\'s'} goes on in MySQL, ClickHouse, Snowflake
     * and Postgres {@code E'...'}; {@code 'C:\'} ends in Postgres, Oracle and SQL Server, and server settings can switch
     * either), so from that span on every block comment is kept, as before BF-092, while {@code --} comments are still
     * removed; block comments before it are removed.
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "escaped-looking quote|select 'it\\'s /* {{x}} */' /* c */|select 'it\\'s /* {{x}} */' /* c */",
            "backslash ending a literal|select /* a */ 'C:\\' /* {{x}} */ from t|select   'C:\\' /* {{x}} */ from t",
            "dash comment after it|select 'C:\\' -- {{x}}\\nfrom t /* c */|select 'C:\\' \\nfrom t /* c */",
            "double-quoted|select \"it\\\"s /* x */\" /* c */|select \"it\\\"s /* x */\" /* c */",
            "backtick|select `a\\` /* c */|select `a\\` /* c */"
    })
    void removeQueryCommentsKeepsBlockCommentsFromABackslashAmbiguousSpanOnBF092(String label, String query, String expected) {
        assertThat(strip(query.replace("\\n", "\n"))).isEqualTo(expected.replace("\\n", "\n"));
    }

    /**
     * BF-092: a backslash that does not stand before the closer, or is itself escaped by one before it, ends the span at
     * the same place either way, so the comments after it are removed.
     */
    @Test
    void removeQueryCommentsRemovesBlockCommentsAfterAnUnambiguousBackslashBF092() {
        assertThat(strip("select 'a\\b' /* c */")).isEqualTo("select 'a\\b'");
        assertThat(strip("select 'a\\\\' /* c */")).isEqualTo("select 'a\\\\'");
    }

    /**
     * BF-092: a {@code $} that opens no terminated dollar quote is plain text, so the comments after it are still removed:
     * inside an identifier (Oracle's {@code V$SESSION}), a positional parameter, a tag starting with a digit, a missing
     * closing tag.
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "identifier with dollars|select * from V$SESSION$X /* c */ -- d|select * from V$SESSION$X",
            "identifier ending in a tag-like part|select a$b$ /* c */ $b$|select a$b$   $b$",
            "positional parameter|select $1 /* c */|select $1",
            "tag starting with a digit|select $1a$ /* c */ $1a$|select $1a$   $1a$",
            "unterminated dollar quote|select $$ /* c */|select $$",
            "dollar at the end|select 1 /* c */ $|select 1   $"
    })
    void removeQueryCommentsTreatsADollarThatOpensNoDollarQuoteAsTextBF092(String label, String query, String expected) {
        assertThat(strip(query)).isEqualTo(expected);
    }

    /**
     * BF-092, what is kept for the database to read: optimizer hints, MySQL executable comments, a comment with another
     * {@code /*} in it (nested in Postgres and SQL Server, not in MySQL, Oracle and ClickHouse; scanning goes on after its
     * first close) and an unterminated comment.
     */
    @ParameterizedTest(name = "[{index}] {0}")
    @CsvSource(delimiter = '|', value = {
            "optimizer hint|select /*+ INDEX(t i) */ * from t|select /*+ INDEX(t i) */ * from t",
            "executable comment|select /*!40101 1, */ 2|select /*!40101 1, */ 2",
            "nested-looking comment|select /* a /* b */ 1 /* c */|select /* a /* b */ 1",
            "unterminated comment|select 1 /* -- {{y}}|select 1 /* -- {{y}}"
    })
    void removeQueryCommentsKeepsHintsExecutableNestedLookingAndUnterminatedBlockCommentsBF092(String label, String query,
            String expected) {
        assertThat(strip(query)).isEqualTo(expected);
    }
}

package org.lowcoder.sdk.plugin.common;

public class SqlQueryUtils {

    /**
     * Whether the last statement of {@code query} that is not blank starts with {@code insert}, in any case (BF-105: a
     * query of semicolons only threw an ArrayIndexOutOfBoundsException, and a blank statement after the last semicolon
     * was read as the last statement). A query without a statement is not an insert. Limits: statements are split at
     * every {@code ;}, also one inside a literal or a comment.
     */
    public static boolean isInsertQuery(String query) {
        String[] queries = query.split(STATEMENT_SEPARATOR);
        for (int i = queries.length - 1; i >= 0; i--) {
            String statement = queries[i].trim();
            if (!statement.isEmpty()) {
                return statement.split(WHITESPACE)[0].equalsIgnoreCase(INSERT_KEYWORD);
            }
        }
        return false;
    }

    /**
     * How a dialect quotes identifiers, as far as finding comments needs it (BF-092). Every rule reads {@code '...'},
     * {@code "..."} and {@code `...`} spans with a doubled closer as an escape, and terminated dollar-quoted strings.
     */
    public enum QuotingRules {
        /** Nothing more: a bracket is a subscript (Postgres, Oracle, MySQL, Snowflake, ClickHouse). */
        STANDARD,
        /** {@code [...]} quotes an identifier, {@code ]]} escapes a bracket (SQL Server). */
        BRACKET_IDENTIFIERS
    }

    private static final String STATEMENT_SEPARATOR = ";";
    private static final String WHITESPACE = "\\s+";
    private static final String INSERT_KEYWORD = "insert";
    private static final char SINGLE_QUOTE = '\'';
    private static final char DOUBLE_QUOTE = '"';
    /** A MySQL and ClickHouse identifier: {@code `...`}. */
    private static final char BACKTICK = '`';
    /** A SQL Server identifier: {@code [...]}; elsewhere an array subscript, scanned like the rest of the query. */
    private static final char OPEN_BRACKET = '[';
    private static final char CLOSE_BRACKET = ']';
    /** Escapes a quote in some dialects or server settings only (MySQL, ClickHouse, Snowflake, Postgres {@code E'...'}). */
    private static final char BACKSLASH = '\\';
    /** Opens and closes a dollar-quoted string ({@code $$...$$} or {@code $tag$...$tag$}: Postgres, Snowflake, ClickHouse). */
    private static final char DOLLAR = '$';
    /** Part of an identifier and of a dollar-quote tag. */
    private static final char UNDERSCORE = '_';
    private static final char NEWLINE = '\n';
    private static final String LINE_COMMENT = "--";
    private static final String BLOCK_COMMENT_START = "/*";
    private static final String BLOCK_COMMENT_END = "*/";
    /** {@code /*+ ... *}{@code /}: an optimizer hint (Oracle, MySQL, pg_hint_plan), read by the database. */
    private static final char OPTIMIZER_HINT_MARK = '+';
    /** {@code /*! ... *}{@code /}: MySQL's executable (versioned) comment, run by the database. */
    private static final char EXECUTABLE_COMMENT_MARK = '!';
    /** A removed block comment leaves a space: like whitespace, it separated the tokens around it. */
    private static final char BLOCK_COMMENT_REPLACEMENT = ' ';

    /** {@link #removeQueryComments(String, QuotingRules)} with {@link QuotingRules#STANDARD}. */
    public static String removeQueryComments(String query) {
        return removeQueryComments(query, QuotingRules.STANDARD);
    }

    /**
     * The query without its {@code --} comments (to the end of the line; the line break is kept) and its block comments
     * ({@code /* ... *}{@code /}, each replaced by one space), trimmed. A comment start is text inside a quoted span, which
     * is kept as written: a {@code '...'} literal, a {@code "..."} or {@code `...`} identifier, a {@code [...]} identifier
     * under {@link QuotingRules#BRACKET_IDENTIFIERS}, each closed by its closer unless the closer is doubled, and a
     * terminated dollar-quoted string ({@code $tag$...$tag$} with an optional tag, whose {@code $} does not follow a letter,
     * digit, {@code _} or {@code $}, so Oracle's {@code V$SESSION} is not one). The text of a comment, quotes and the other
     * comment start included, does not change what follows (BF-046: hyphens inside a comment deleted characters written
     * before it, and a quote inside a comment flipped the quote state, so a later literal was cut). BF-092: block comments
     * used to be kept, so a mustache inside one was bound as a parameter the database does not count.
     * <p>
     * Kept as written, for the database to read: a block comment that is an optimizer hint ({@code /*+}) or a MySQL
     * executable comment ({@code /*!}); one whose text has another {@code /*}, which Postgres and SQL Server read as nested
     * and MySQL, Oracle and ClickHouse do not (scanning goes on after its first {@code *}{@code /}); an unterminated one (to
     * the end of the query); and every block comment after a quoted span that a backslash makes ambiguous: one that ends
     * elsewhere when a backslash escapes the next character (MySQL, ClickHouse, Snowflake, Postgres {@code E'...'}, and
     * depending on server settings such as MySQL's NO_BACKSLASH_ESCAPES or Postgres's standard_conforming_strings) than
     * when it does not ({@code 'it\'s'}, {@code 'C:\'}). From such a span on, the query is read as before BF-092: spans
     * end without backslash escapes, {@code --} comments are removed and block comments are kept. A mustache inside a kept
     * comment is still bound.
     * <p>
     * Limits: an unterminated quoted span keeps the rest of the query, while an unterminated dollar quote is no quote (its
     * {@code $} is plain text); a {@code $tag$} pair or a backtick in a dialect without them is read the same way.
     */
    public static String removeQueryComments(String query, QuotingRules rules) {
        StringBuilder withoutComments = new StringBuilder(query.length());
        boolean removeBlockComments = true;
        int length = query.length();
        int i = 0;
        while (i < length) {
            char c = query.charAt(i);
            int dollarQuoteEnd = c == DOLLAR ? dollarQuoteEnd(query, i) : -1;
            if (c == SINGLE_QUOTE || c == DOUBLE_QUOTE || c == BACKTICK
                    || (rules == QuotingRules.BRACKET_IDENTIFIERS && c == OPEN_BRACKET)) {
                char closer = c == OPEN_BRACKET ? CLOSE_BRACKET : c;
                int end = quotedSpanEnd(query, i, closer, false);
                if (end != quotedSpanEnd(query, i, closer, true)) {
                    removeBlockComments = false;
                }
                withoutComments.append(query, i, end);
                i = end;
            } else if (dollarQuoteEnd > 0) {
                withoutComments.append(query, i, dollarQuoteEnd);
                i = dollarQuoteEnd;
            } else if (query.startsWith(LINE_COMMENT, i)) {
                int lineEnd = query.indexOf(NEWLINE, i);
                i = lineEnd < 0 ? length : lineEnd;
            } else if (removeBlockComments && query.startsWith(BLOCK_COMMENT_START, i)) {
                int close = query.indexOf(BLOCK_COMMENT_END, i + BLOCK_COMMENT_START.length());
                int end = close < 0 ? length : close + BLOCK_COMMENT_END.length();
                if (isRemovableBlockComment(query, i, close)) {
                    withoutComments.append(BLOCK_COMMENT_REPLACEMENT);
                } else {
                    withoutComments.append(query, i, end);
                }
                i = end;
            } else {
                withoutComments.append(c);
                i++;
            }
        }
        return withoutComments.toString().trim();
    }

    /**
     * The end (exclusive) of the quoted span opened at {@code start} and closed by {@code closer}, or the end of the query
     * when it is unterminated: a doubled closer is an escaped one, and with {@code backslashEscapes} a backslash escapes the
     * character after it.
     */
    private static int quotedSpanEnd(String query, int start, char closer, boolean backslashEscapes) {
        int length = query.length();
        int i = start + 1;
        while (i < length) {
            char c = query.charAt(i);
            if (backslashEscapes && c == BACKSLASH) {
                i += 2;
            } else if (c == closer && i + 1 < length && query.charAt(i + 1) == closer) {
                i += 2;
            } else if (c == closer) {
                return i + 1;
            } else {
                i++;
            }
        }
        return length;
    }

    /**
     * Whether the block comment starting at {@code start} and closed at {@code close} (negative when unterminated) reads as
     * a comment, and the same one, in every dialect: terminated, neither a hint nor an executable comment, and without
     * another {@code /*} in its text.
     */
    private static boolean isRemovableBlockComment(String query, int start, int close) {
        if (close < 0) {
            return false;
        }
        int textStart = start + BLOCK_COMMENT_START.length();
        if (textStart < close) {
            char mark = query.charAt(textStart);
            if (mark == OPTIMIZER_HINT_MARK || mark == EXECUTABLE_COMMENT_MARK) {
                return false;
            }
        }
        int nestedStart = query.indexOf(BLOCK_COMMENT_START, textStart);
        return nestedStart < 0 || nestedStart >= close;
    }

    /**
     * The end (exclusive) of the dollar-quoted string opened by the {@code $} at {@code start}, or -1 when it opens none:
     * the {@code $} follows a letter, digit, {@code _} or {@code $} (it is part of an identifier), the opening tag is not
     * {@code $$} or {@code $tag$} (a tag starts with a letter or {@code _} and goes on with letters, digits and {@code _}),
     * or the same tag does not close it.
     */
    private static int dollarQuoteEnd(String query, int start) {
        if (start > 0 && isIdentifierPart(query.charAt(start - 1))) {
            return -1;
        }
        int tagEnd = start + 1;
        while (tagEnd < query.length() && isTagPart(query.charAt(tagEnd), tagEnd == start + 1)) {
            tagEnd++;
        }
        if (tagEnd >= query.length() || query.charAt(tagEnd) != DOLLAR) {
            return -1;
        }
        String tag = query.substring(start, tagEnd + 1);
        int close = query.indexOf(tag, tagEnd + 1);
        return close < 0 ? -1 : close + tag.length();
    }

    private static boolean isIdentifierPart(char c) {
        return Character.isLetterOrDigit(c) || c == UNDERSCORE || c == DOLLAR;
    }

    private static boolean isTagPart(char c, boolean first) {
        return Character.isLetter(c) || c == UNDERSCORE || (!first && Character.isDigit(c));
    }

}

package org.lowcoder.sdk.plugin.common;

public class SqlQueryUtils {

    public static boolean isInsertQuery(String query) {
        String[] queries = query.split(";");
        return queries[queries.length - 1].trim()
                .split("\\s+")[0]
                .equalsIgnoreCase("insert");
    }

    private static final char SINGLE_QUOTE = '\'';
    private static final char DOUBLE_QUOTE = '"';
    private static final char NEWLINE = '\n';
    private static final String LINE_COMMENT = "--";

    /**
     * The query without its {@code --} comments (to the end of the line; the line break is kept), trimmed. A {@code --}
     * inside a {@code '...'} literal or a {@code "..."} identifier is text, and the text of a comment, quotes included,
     * does not change what follows (BF-046: hyphens inside a comment deleted characters written before it, and a quote
     * inside a comment flipped the quote state, so a later literal was cut).
     * <p>
     * Limits: block comments ({@code /* ... *}{@code /}) are not recognised (BF-092): their text is kept, and a {@code --}
     * inside one starts a line comment as anywhere else; a backslash does not escape a
     * quote (MySQL's {@code 'it\'s'} reads as a literal ending at the backslash), and a doubled quote reads as two
     * adjacent literals, which keeps the same text.
     */
    public static String removeQueryComments(String query) {
        StringBuilder withoutComments = new StringBuilder(query.length());
        int length = query.length();
        int i = 0;
        while (i < length) {
            char c = query.charAt(i);
            if (c == SINGLE_QUOTE || c == DOUBLE_QUOTE) {
                int close = query.indexOf(c, i + 1);
                int end = close < 0 ? length : close + 1;
                withoutComments.append(query, i, end);
                i = end;
            } else if (query.startsWith(LINE_COMMENT, i)) {
                int lineEnd = query.indexOf(NEWLINE, i);
                i = lineEnd < 0 ? length : lineEnd;
            } else {
                withoutComments.append(c);
                i++;
            }
        }
        return withoutComments.toString().trim();
    }

}

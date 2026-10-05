package org.lowcoder.sdk.util;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.Nonnull;
import org.apache.commons.lang3.RandomStringUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue.EscapeSql;

import java.util.Collection;
import java.util.Map;
import java.util.regex.Pattern;

import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.jsonNodeToObject;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

public final class SqlGuiUtils {

    public static final EscapeSql POSTGRES_SQL_STR_ESCAPE = s -> {
        String randomTag = RandomStringUtils.randomAlphabetic(7);
        return "$" + randomTag + "$" + s + "$" + randomTag + "$";
    };

    /**
     * One part of an unquoted table name: letters, digits and {@code _ $ # @} (no whitespace, quotes, operators or
     * comment characters).
     */
    private static final String UNQUOTED_TABLE_NAME_PART = "[\\p{L}\\p{N}_$#@]+";
    private static final String TABLE_NAME_PART_SEPARATOR = "\\.";

    private SqlGuiUtils() {
    }

    /**
     * Quotes a column name of a GUI SQL command with the dialect's delimiters. A closing delimiter inside the name is
     * doubled, the SQL escape of a delimited identifier in PostgreSQL, Oracle ({@code "}), MySQL ({@code `}) and
     * SQL Server ({@code ]}), so the name cannot end the identifier and continue as SQL.
     */
    public static String quoteIdentifier(String identifier, String frontDelimiter, String backDelimiter) {
        return frontDelimiter + identifier.replace(backDelimiter, backDelimiter + backDelimiter) + backDelimiter;
    }

    /**
     * Renders the table name template of a GUI SQL command and checks the result with {@link #checkTableName}.
     */
    public static String renderTableName(String tableTemplate, Map<String, ?> paramMap, String frontDelimiter, String backDelimiter) {
        return checkTableName(MustacheHelper.renderMustacheString(tableTemplate, paramMap), frontDelimiter, backDelimiter);
    }

    /**
     * Accepts a table name only when it is one or more parts joined by {@code .}, each part either unquoted (letters,
     * digits, {@code _ $ # @}) or quoted with the dialect's delimiters, a closing delimiter inside doubled
     * ({@code dbo.items}, {@code "public"."My Table"}, {@code [dbo].[a]]b]}). Leading and trailing whitespace is removed.
     * The table name is put into the SQL as written, so this keeps it to an identifier: anything else fails with
     * {@code GUI_INVALID_TABLE_NAME}.
     * <p>
     * Limits: it checks the form only, not that the table exists or that the user may use it; a quoted part may hold
     * any text, which the database reads as one identifier. Quotes of another dialect are refused (for SQL Server only
     * {@code [ ]} is accepted, not {@code " "}).
     */
    public static String checkTableName(String table, String frontDelimiter, String backDelimiter) {
        String stripped = table == null ? "" : table.strip();
        String quotedPart = Pattern.quote(frontDelimiter)
                + "(?:[^" + escapeForCharClass(backDelimiter) + "]|" + Pattern.quote(backDelimiter + backDelimiter) + ")+"
                + Pattern.quote(backDelimiter);
        String part = "(?:" + UNQUOTED_TABLE_NAME_PART + "|" + quotedPart + ")";
        if (!Pattern.matches(part + "(?:" + TABLE_NAME_PART_SEPARATOR + part + ")*", stripped)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_TABLE_NAME", table);
        }
        return stripped;
    }

    private static String escapeForCharClass(String delimiter) {
        StringBuilder sb = new StringBuilder();
        delimiter.chars().forEach(c -> sb.append('\\').append((char) c));
        return sb.toString();
    }

    @Nonnull
    public static GuiSqlValue renderPsBindValue(Object obj, Map<String, ?> paramMap) {
        if (obj == null) {
            return GuiSqlValue.from(null);
        }

        if (obj instanceof String str) {
            if (isBlank(str)) {
                return GuiSqlValue.from(str);
            }

            JsonNode jsonNode = MustacheHelper.renderMustacheJson(str, paramMap);
            return GuiSqlValue.from(jsonNodeToObject(jsonNode));
        }

        return GuiSqlValue.from(obj);

    }


    public static class GuiSqlValue {
        private final Object rawValue;

        public GuiSqlValue(Object rawValue) {
            this.rawValue = rawValue;
        }

        public static GuiSqlValue from(Object o) {
            return new GuiSqlValue(o);
        }

        public static GuiSqlValue fromJsonNode(JsonNode jsonNode) {
            if (jsonNode == null) {
                return from(null);
            }
            return from(jsonNodeToObject(jsonNode));
        }

        public Object getValue() {
            if (rawValue == null) {
                return null;
            }
            if (rawValue instanceof Collection<?> || rawValue instanceof Map<?, ?> || rawValue.getClass().isArray()) {
                return toJson(rawValue);
            }
            return rawValue;
        }

        /**
         * used for in/not in operator
         */
        public Object getRawValue() {
            return rawValue;
        }

        public String getConcatSqlStr(EscapeSql escapeFunc) {

            if (rawValue == null || rawValue instanceof Boolean || rawValue instanceof Number) {
                return String.valueOf(rawValue);
            }

            if (rawValue instanceof String strValue) {
                return escapeFunc.escape(strValue);
            }

            if (rawValue instanceof Map<?, ?> || rawValue instanceof Collection<?>) {
                return escapeFunc.escape(toJson(rawValue));
            }

            return String.valueOf(rawValue);

        }

        public interface EscapeSql {

            String escape(String stringValue);
        }
    }
}

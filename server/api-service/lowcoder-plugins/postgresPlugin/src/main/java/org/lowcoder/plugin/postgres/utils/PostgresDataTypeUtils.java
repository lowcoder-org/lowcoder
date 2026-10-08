/**
 * Copyright 2021 Appsmith Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * <p>
 */
// copied for postgres data types
package org.lowcoder.plugin.postgres.utils;

import static org.lowcoder.plugin.postgres.model.DataType.BIG_DECIMAL;
import static org.lowcoder.plugin.postgres.model.DataType.BOOLEAN;
import static org.lowcoder.plugin.postgres.model.DataType.DOUBLE;
import static org.lowcoder.plugin.postgres.model.DataType.INTEGER;
import static org.lowcoder.plugin.postgres.model.DataType.LONG;
import static org.lowcoder.plugin.postgres.model.DataType.STRING;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.BOOL;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.DATE;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.DECIMAL;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.FLOAT8;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.INT;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.INT4;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.INT8;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.TEXT;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.TIME;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.PostgresDataType.VARCHAR;
import static org.lowcoder.sdk.exception.PluginCommonError.PREPARED_STATEMENT_BIND_PARAMETERS_ERROR;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.lowcoder.plugin.postgres.model.DataType;
import org.lowcoder.sdk.exception.PluginException;

public class PostgresDataTypeUtils {

    private static final char PARAMETER = '?';
    private static final String PREPARED_STATEMENT_BIND_PARAMETERS_ERROR_KEY = "PREPARED_STATEMENT_BIND_PARAMETERS_ERROR";
    /** The argument of the bind error: the value as text, then the type it was cast to. */
    private static final String INVALID_CAST_MESSAGE = "\"%s\" is not a valid %s";
    private static final char SINGLE_QUOTE = '\'';
    private static final char DOUBLE_QUOTE = '"';
    private static final char DOLLAR = '$';
    private static final char BACKSLASH = '\\';
    private static final String CAST = "::";
    private static final String LINE_COMMENT = "--";
    private static final String BLOCK_COMMENT_START = "/*";
    private static final String BLOCK_COMMENT_END = "*/";
    /** The name of a cast type: letters, digits and underscores, so {@code int8} and {@code float8} are read whole. */
    private static final Pattern CAST_TYPE = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*");

    public static PostgresDataType dataType = new PostgresDataType();

    public static class PostgresDataType {
        /**
         * Declare all the explicitly castable postgresql types below. These would be automatically added to the
         * dataTypes set automatically.
         * <p>
         * !!! WARNING !!!
         * When adding a new data type to support for explicit casting, please ensure to add an entry in the Map
         * dataTypeMapper which maps the postgres data types to  data types.
         */
        public static final String INT8 = "int8";
        public static final String INT4 = "int4";
        public static final String DECIMAL = "decimal";
        public static final String VARCHAR = "varchar";
        public static final String BOOL = "bool";
        public static final String DATE = "date";
        public static final String TIME = "time";
        public static final String FLOAT8 = "float8";
        public static final String TEXT = "text";
        public static final String INT = "int";

        public Set dataTypes = null;

        public Set getDataTypes() {
            // if data types hasn't been initialized, read and set all the supported data types for postgres
            if (dataTypes != null && !dataTypes.isEmpty()) {
                return dataTypes;
            }

            dataTypes = new HashSet<>();

            Field[] fields = this.getClass().getDeclaredFields();

            for (Field field : fields) {
                if (field.getType().equals(String.class)) { // if it is a String field
                    try {
                        dataTypes.add(field.get(dataType));
                    } catch (IllegalArgumentException | IllegalAccessException e) {
                        // We weren't able to read the value of the field. Ignore this field and continue
                        // Still print the stack trace for posterity.
                        e.printStackTrace();
                    }
                }
            }
            // We are assured that data types has been set.
            return dataTypes;
        }
    }

    public static Map<String, DataType> dataTypeMapper;

    private static Map<String, DataType> getDataTypeMapper() {
        if (dataTypeMapper == null) {
            dataTypeMapper = new HashMap<>();
            dataTypeMapper.put(INT8, LONG);
            dataTypeMapper.put(INT4, INTEGER);
            dataTypeMapper.put(DECIMAL, BIG_DECIMAL);
            dataTypeMapper.put(VARCHAR, STRING);
            dataTypeMapper.put(BOOL, BOOLEAN);
            dataTypeMapper.put(DATE, DataType.DATE);
            dataTypeMapper.put(TIME, DataType.TIME);
            dataTypeMapper.put(FLOAT8, DOUBLE);
            dataTypeMapper.put(TEXT, STRING);
            dataTypeMapper.put(INT, INTEGER);
        }

        return dataTypeMapper;
    }

    /**
     * The explicit cast of each JDBC parameter of the prepared SQL, in order; an entry is null when the parameter has no
     * cast of a supported type. Only a {@code ?} that the PostgreSQL JDBC driver binds is a parameter (BF-045: every
     * {@code ?} of the text was counted, so a {@code ?::bool} inside a string literal, or the jsonb {@code ??} operator,
     * shifted the casts onto the wrong parameters): a {@code ?} inside a string literal ({@code '...'}, {@code E'...'}
     * with backslash escapes, {@code $tag$...$tag$}), a quoted identifier ({@code "..."}) or a comment ({@code --} to the
     * end of the line, nested {@code /* *}{@code /}) is not one, and {@code ??} is the driver's escape for the {@code ?}
     * operator. A type name may contain digits ({@code ?::int8} is LONG, {@code ?::float8} is DOUBLE; before they were
     * read as {@code int} and {@code float}).
     * <p>
     * Limits: the cast must follow the {@code ?} directly ({@code ? :: int4} is not read), an array cast
     * ({@code ?::int8[]}) is read as its element type, and string literals are read with standard conforming strings
     * (a backslash escapes only in {@code E'...'}), the server's default since PostgreSQL 9.1.
     */
    public static List<DataType> extractExplicitCasting(String query) {
        List<DataType> inputDataTypes = new ArrayList<>();
        int length = query.length();
        int i = 0;
        while (i < length) {
            char c = query.charAt(i);
            if (c == SINGLE_QUOTE) {
                i = endOfQuoted(query, i, SINGLE_QUOTE, isEscapeStringPrefix(query, i));
            } else if (c == DOUBLE_QUOTE) {
                i = endOfQuoted(query, i, DOUBLE_QUOTE, false);
            } else if (c == DOLLAR && dollarQuoteTag(query, i) != null) {
                String tag = dollarQuoteTag(query, i);
                int close = query.indexOf(tag, i + tag.length());
                i = close < 0 ? length : close + tag.length();
            } else if (query.startsWith(LINE_COMMENT, i)) {
                i = endOfLineComment(query, i);
            } else if (query.startsWith(BLOCK_COMMENT_START, i)) {
                i = endOfBlockComment(query, i);
            } else if (c == PARAMETER && i + 1 < length && query.charAt(i + 1) == PARAMETER) {
                i += 2;
            } else if (c == PARAMETER) {
                i = readCast(query, i + 1, inputDataTypes);
            } else {
                i++;
            }
        }
        return inputDataTypes;
    }

    /** Adds the cast that follows a parameter (null for none or an unsupported type) and answers the index after it. */
    private static int readCast(String query, int afterParameter, List<DataType> inputDataTypes) {
        if (query.startsWith(CAST, afterParameter)) {
            Matcher type = CAST_TYPE.matcher(query).region(afterParameter + CAST.length(), query.length());
            if (type.lookingAt()) {
                String dataTypeFromInput = type.group().toLowerCase();
                // Either a supported type, or no explicit casting: implicit type casting (the default) is used for null
                inputDataTypes.add(dataType.getDataTypes().contains(dataTypeFromInput) ? getDataTypeMapper().get(dataTypeFromInput) : null);
                return type.end();
            }
        }
        inputDataTypes.add(null);
        return afterParameter;
    }

    /** {@code E'...'}: an {@code E} that is not the end of a longer word comes right before the quote. */
    private static boolean isEscapeStringPrefix(String query, int quote) {
        return quote > 0 && Character.toUpperCase(query.charAt(quote - 1)) == 'E'
                && (quote < 2 || !isIdentifierPart(query.charAt(quote - 2)));
    }

    /** The index after the closing quote; a doubled quote is part of the text, and so is an escaped one in E strings. */
    private static int endOfQuoted(String query, int open, char quote, boolean backslashEscapes) {
        for (int i = open + 1; i < query.length(); i++) {
            char c = query.charAt(i);
            if (backslashEscapes && c == BACKSLASH) {
                i++;
            } else if (c == quote) {
                if (i + 1 < query.length() && query.charAt(i + 1) == quote) {
                    i++;
                } else {
                    return i + 1;
                }
            }
        }
        return query.length();
    }

    /**
     * The opening tag ({@code $$} or {@code $name$}) of a dollar-quoted string starting at {@code dollar}, or null: not
     * after a word character, and the name does not start with a digit, so a positional {@code $1} is not one.
     */
    private static String dollarQuoteTag(String query, int dollar) {
        if (dollar > 0 && isIdentifierPart(query.charAt(dollar - 1))) {
            return null;
        }
        int i = dollar + 1;
        if (i < query.length() && Character.isDigit(query.charAt(i))) {
            return null;
        }
        while (i < query.length() && query.charAt(i) != DOLLAR) {
            if (!isIdentifierPart(query.charAt(i))) {
                return null;
            }
            i++;
        }
        return i < query.length() ? query.substring(dollar, i + 1) : null;
    }

    private static int endOfLineComment(String query, int start) {
        int i = start + LINE_COMMENT.length();
        while (i < query.length() && query.charAt(i) != '\n' && query.charAt(i) != '\r') {
            i++;
        }
        return i;
    }

    /** The index after the comment's end; block comments nest, as in PostgreSQL. */
    private static int endOfBlockComment(String query, int start) {
        int depth = 0;
        int i = start;
        while (i < query.length()) {
            if (query.startsWith(BLOCK_COMMENT_START, i)) {
                depth++;
                i += BLOCK_COMMENT_START.length();
            } else if (query.startsWith(BLOCK_COMMENT_END, i)) {
                depth--;
                i += BLOCK_COMMENT_END.length();
                if (depth == 0) {
                    return i;
                }
            } else {
                i++;
            }
        }
        return query.length();
    }

    private static boolean isIdentifierPart(char c) {
        return Character.isLetterOrDigit(c) || c == '_' || c == DOLLAR;
    }

    /**
     * {@code value} as the Java type of {@code targetType}, the explicit cast of its placeholder. A text that does not
     * parse as that type is a PREPARED_STATEMENT_BIND_PARAMETERS_ERROR naming the value and the type (BF-106: the JDK's
     * NumberFormatException or IllegalArgumentException escaped, and the server answered it as an unknown
     * QUERY_EXECUTION_ERROR).
     *
     * <p>A null value stays null whatever the cast, and is bound as SQL NULL as it is without a cast (NEW-17, GitHub #2068:
     * {@code {{x}}::varchar} bound the text "null", {@code ::bool} false, and a number, date or time cast failed).
     */
    public static Object castValueWithTargetType(Object value, DataType targetType) {
        if (value == null) {
            return null;
        }
        try {
            return cast(value, targetType);
        } catch (IllegalArgumentException e) {
            throw new PluginException(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, PREPARED_STATEMENT_BIND_PARAMETERS_ERROR_KEY,
                    String.format(INVALID_CAST_MESSAGE, value, targetType));
        }
    }

    private static Object cast(Object value, DataType targetType) {
        switch (targetType) {
            case NULL -> {
                return null;
            }
            case INTEGER -> {
                if (!(value instanceof Integer)) {
                    return Integer.parseInt(String.valueOf(value));
                }
                return value;
            }
            case LONG -> {
                if (!(value instanceof Long)) {
                    return Long.parseLong(String.valueOf(value));
                }
                return value;
            }
            case FLOAT -> {
                if (!(value instanceof Float)) {
                    return Float.parseFloat(String.valueOf(value));
                }
                return value;
            }
            case DOUBLE -> {
                if (!(value instanceof Double)) {
                    return Double.parseDouble(String.valueOf(value));
                }
                return value;
            }
            case BIG_DECIMAL -> {
                // from the text of the value, so that no binary floating-point step drops digits (BF-032)
                if (!(value instanceof BigDecimal)) {
                    return new BigDecimal(String.valueOf(value));
                }
                return value;
            }
            case BOOLEAN -> {
                if (!(value instanceof Boolean)) {
                    return Boolean.parseBoolean(String.valueOf(value));
                }
                return value;
            }
            case DATE -> {
                if (!(value instanceof Date)) {
                    return Date.valueOf(String.valueOf(value));
                }
                return value;
            }
            case TIME -> {
                if (!(value instanceof Time)) {
                    return Time.valueOf(String.valueOf(value));
                }
                return value;
            }
            case TIMESTAMP -> {
                if (!(value instanceof Timestamp)) {
                    return Timestamp.valueOf(String.valueOf(value));
                }
                return value;
            }
            case ARRAY -> {
                if (!(value instanceof Collection<?>)) {
                    return String.valueOf(value);
                }
                return value;
            }
            case JSON_OBJECT -> {
                if (value instanceof Map<?, ?> || value instanceof Collection<?>) {
                    return value;
                }
                return String.valueOf(value);
            }
            default -> {
                return String.valueOf(value);
            }
        }
    }
}

package org.lowcoder.plugin.postgres;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.plugin.postgres.model.DataType;
import org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.castValueWithTargetType;
import static org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils.extractExplicitCasting;

/**
 * Unit PG-1 (task L5-4), no server: the {@code ?::type} cast scanner and the value conversion of
 * {@link PostgresDataTypeUtils}.
 */
public class PostgresDataTypeUtilsTest {

    /** BF-032: a decimal a float cannot hold (as a float it was 1.23456792E7). */
    static final String DECIMAL_TEXT = "12345678.9";
    /** A double whose binary value is not 0.1; read from its text it is exactly 0.1. */
    static final double DOUBLE_WITH_SHORT_TEXT = 0.1d;
    static final String DOUBLE_SHORT_TEXT = "0.1";
    /** A decimal comma: not a number for {@code BigDecimal}. */
    static final String NOT_A_DECIMAL = "12,5";
    static final String BIND_ERROR_KEY = "PREPARED_STATEMENT_BIND_PARAMETERS_ERROR";

    static final Set<String> SUPPORTED = Set.of("int8", "int4", "decimal", "varchar", "bool", "date", "time", "float8", "text", "int");

    @Test
    public void extractExplicitCastingMapsEachSupportedTypeInAnyCase() {
        Map<String, Object> observed = new LinkedHashMap<>();
        for (String type : new String[] {"int8", "int4", "decimal", "varchar", "bool", "date", "time", "float8", "text", "int"}) {
            observed.put(type, extractExplicitCasting("select ?::" + type));
            assertEquals(observed.get(type), extractExplicitCasting("select ?::" + type.toUpperCase()), type + " in upper case");
        }
        // int8, int4 and float8 are asserted in castTypeNamesKeepTheirDigitsBF045
        System.out.println("[PostgresDataTypeUtilsTest] casts as observed: " + observed);
        assertEquals(List.of(DataType.STRING), observed.get("varchar"));
        assertEquals(List.of(DataType.BOOLEAN), observed.get("bool"));
        assertEquals(List.of(DataType.DATE), observed.get("date"));
        assertEquals(List.of(DataType.TIME), observed.get("time"));
        assertEquals(List.of(DataType.STRING), observed.get("text"));
        assertEquals(List.of(DataType.INTEGER), observed.get("int"));
        assertEquals(List.of(DataType.BIG_DECIMAL), observed.get("decimal"));
    }

    /**
     * BF-045 fixed: the cast pattern {@code [a-zA-Z]+} stopped at a digit, so {@code ?::int8} was read as {@code int}
     * (INTEGER, not LONG) and {@code ?::float8} as {@code float} (no cast). Type names now keep their digits.
     */
    @Test
    public void castTypeNamesKeepTheirDigitsBF045() {
        System.out.println("[PostgresDataTypeUtilsTest] int8 -> " + extractExplicitCasting("?::int8") + ", float8 -> " + extractExplicitCasting("?::float8"));
        assertEquals(List.of(DataType.LONG), extractExplicitCasting("select ?::int8"));
        assertEquals(List.of(DataType.INTEGER), extractExplicitCasting("select ?::int4"));
        assertEquals(List.of(DataType.DOUBLE), extractExplicitCasting("select ?::float8"));
        assertEquals(List.of(DataType.LONG, DataType.DOUBLE), extractExplicitCasting("select ?::INT8, ?::Float8"));
    }

    static Stream<Arguments> sqlWithQuestionMarksThatAreNotParameters() {
        List<DataType> intOnly = List.of(DataType.INTEGER);
        return Stream.of(
                Arguments.of("a string literal", "select '?::bool', ?::int4", intOnly),
                Arguments.of("a literal with a doubled quote", "select 'it''s ?::bool', ?::int4", intOnly),
                Arguments.of("an escape string with an escaped quote", "select E'it\\'s ?::bool', ?::int4", intOnly),
                Arguments.of("an escape string in lower case", "select e'\\\\?::bool', ?::int4", intOnly),
                Arguments.of("a backslash in a standard string ends nothing", "select 'a\\', ?::int4", intOnly),
                Arguments.of("a quoted identifier", "select \"col?::bool\", ?::int4", intOnly),
                Arguments.of("a dollar-quoted string", "select $$ ?::bool $$, ?::int4", intOnly),
                Arguments.of("a tagged dollar-quoted string", "select $fn$ ?::bool $x$ ?::bool $fn$, ?::int4", intOnly),
                Arguments.of("the jsonb ?? operator", "select data ?? 'k', ?::int4", intOnly),
                Arguments.of("the jsonb ??| operator", "select data ??| array['k'], ?::int4", intOnly),
                Arguments.of("an escaped operator before a parameter", "select ???::int4", intOnly),
                Arguments.of("a line comment", "select ?::int4 -- ?::bool\n, ?::text", List.of(DataType.INTEGER, DataType.STRING)),
                Arguments.of("a nested block comment", "select /* ?::bool /* ?::bool */ ?::bool */ ?::int4", intOnly),
                Arguments.of("a positional $1 is no dollar quote", "select $1, ?::int4", intOnly),
                Arguments.of("a tag cannot start with a digit", "select $1a$ ?::bool $1a$, ?::int4", List.of(DataType.BOOLEAN, DataType.INTEGER)),
                Arguments.of("a $ inside a word is no dollar quote", "select a$b$c, ?::int4", intOnly),
                Arguments.of("an unterminated literal", "select ?::int4, 'open ?::bool", intOnly));
    }

    /**
     * BF-045 fixed: the scanner counted every {@code ?} of the SQL text, so one inside a literal, a quoted identifier, a
     * dollar quote or a comment, or the driver's {@code ??} escape, shifted the casts onto the wrong parameters. Only the
     * parameters the PostgreSQL JDBC driver binds are read now.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("sqlWithQuestionMarksThatAreNotParameters")
    public void onlyTheParametersTheDriverBindsGetACastBF045(String label, String sql, List<DataType> expected) {
        List<DataType> casts = extractExplicitCasting(sql);
        System.out.println("[PostgresDataTypeUtilsTest] " + label + ": " + sql.replace("\n", "\\n") + " -> " + casts);
        assertEquals(expected, casts);
    }

    /**
     * The scanner at the edges of its input (BF-045 follow-up for the coverage gate): a quote, a {@code $} or a comment at
     * the very start or end of the SQL, unterminated quotes and comments, a {@code $} that cannot open a dollar quote, a
     * carriage return ending a line comment, and a {@code ::} that is followed by no type name.
     */
    static Stream<Arguments> sqlAtTheEdgesOfTheScanner() {
        List<DataType> intOnly = List.of(DataType.INTEGER);
        return Stream.of(
                Arguments.of("a literal at the very start", "'?::bool' || ?::int4", intOnly),
                Arguments.of("an escape string at the very start", "E'\\'?::bool' || ?::int4", intOnly),
                Arguments.of("an E ending a longer word is no escape prefix", "select note'a\\', ?::int4", intOnly),
                Arguments.of("a literal closing at the very end", "select ?::int4 || 'a'", intOnly),
                Arguments.of("a dollar quote at the very start", "$$?::bool$$ || ?::int4", intOnly),
                Arguments.of("an unterminated dollar quote", "select ?::int4, $$ ?::bool", intOnly),
                Arguments.of("a $ at the very end", "select ?::int4, x $", intOnly),
                Arguments.of("an unterminated tag name", "select ?::int4, $abc", intOnly),
                Arguments.of("a tag name with a character no tag may hold", "select $a-b$ ?::int4", intOnly),
                Arguments.of("a $ after an underscore or another $", "select a_$$ ?::int4", intOnly),
                Arguments.of("a line comment that runs to the end", "select ?::int4 -- ?::bool", intOnly),
                Arguments.of("a line comment ended by a carriage return", "select ?::int4 -- ?::bool\r?::text",
                        List.of(DataType.INTEGER, DataType.STRING)),
                Arguments.of("an unterminated block comment", "select ?::int4 /* ?::bool", intOnly),
                Arguments.of("a :: followed by no type name", "select ?::(int4), ?::int4", Arrays.asList(null, DataType.INTEGER)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("sqlAtTheEdgesOfTheScanner")
    public void theScannerHandlesTheEdgesOfItsInput(String label, String sql, List<DataType> expected) {
        List<DataType> casts = extractExplicitCasting(sql);
        System.out.println("[PostgresDataTypeUtilsTest] edge, " + label + ": " + sql.replace("\r", "\\r") + " -> " + casts);
        assertEquals(expected, casts);
    }

    /** The limits stated in the javadoc: a spaced cast is not read, an array cast is read as its element type. */
    @Test
    public void aSpacedCastIsNotReadAndAnArrayCastIsReadAsItsElementType() {
        assertEquals(Arrays.asList((DataType) null), extractExplicitCasting("select ? :: int4"));
        assertEquals(List.of(DataType.LONG), extractExplicitCasting("select ?::int8[]"));
    }

    @Test
    public void unknownTypeAndNoCastGiveNullAtTheRightPosition() {
        List<DataType> casts = extractExplicitCasting("select ?::text, ?, ?::bool, ?::numeric");
        System.out.println("[PostgresDataTypeUtilsTest] positions: " + casts);
        assertEquals(Arrays.asList(DataType.STRING, null, DataType.BOOLEAN, null), casts);
        assertEquals(List.of(), extractExplicitCasting("select 1"));
    }

    /** NEW-17 (GitHub #2068): a null value stays null for every cast. Catches: "null", false or a bind error for a JS null. */
    @Test
    public void aNullValueStaysNullForEveryDataTypeNEW17() {
        for (DataType type : DataType.values()) {
            assertNull(castValueWithTargetType(null, type), type.name());
        }
        System.out.println("[PostgresDataTypeUtilsTest] null stays null for all " + DataType.values().length + " data types");
    }

    @Test
    public void castValueWithTargetTypeForEveryDataType() {
        assertEquals(42, castValueWithTargetType("42", DataType.INTEGER));
        assertEquals(42L, castValueWithTargetType("42", DataType.LONG));
        assertEquals(1.5f, castValueWithTargetType("1.5", DataType.FLOAT));
        assertEquals(1.5d, castValueWithTargetType("1.5", DataType.DOUBLE));
        assertEquals(true, castValueWithTargetType("true", DataType.BOOLEAN));
        assertEquals(Date.valueOf("2024-02-29"), castValueWithTargetType("2024-02-29", DataType.DATE));
        assertEquals(Time.valueOf("13:14:15"), castValueWithTargetType("13:14:15", DataType.TIME));
        assertEquals(Timestamp.valueOf("2024-02-29 13:14:15"), castValueWithTargetType("2024-02-29 13:14:15", DataType.TIMESTAMP));
        assertNull(castValueWithTargetType("x", DataType.NULL));
        for (DataType type : new DataType[] {DataType.STRING, DataType.ASCII, DataType.BINARY, DataType.BYTES, DataType.BSON}) {
            assertEquals("7", castValueWithTargetType(7, type), type.name());
        }
        // a value that already has the target class comes back as the same object
        Integer integer = 1000;
        Long aLong = 1000L;
        Float aFloat = 1.5f;
        Double aDouble = 1.5d;
        Date date = Date.valueOf("2024-02-29");
        Time time = Time.valueOf("13:14:15");
        Timestamp timestamp = Timestamp.valueOf("2024-02-29 13:14:15");
        assertSame(integer, castValueWithTargetType(integer, DataType.INTEGER));
        assertSame(aLong, castValueWithTargetType(aLong, DataType.LONG));
        assertSame(aFloat, castValueWithTargetType(aFloat, DataType.FLOAT));
        assertSame(aDouble, castValueWithTargetType(aDouble, DataType.DOUBLE));
        assertSame(Boolean.TRUE, castValueWithTargetType(Boolean.TRUE, DataType.BOOLEAN));
        assertSame(date, castValueWithTargetType(date, DataType.DATE));
        assertSame(time, castValueWithTargetType(time, DataType.TIME));
        assertSame(timestamp, castValueWithTargetType(timestamp, DataType.TIMESTAMP));
        List<Integer> list = List.of(1, 2);
        Map<String, Integer> map = Map.of("a", 1);
        assertSame(list, castValueWithTargetType(list, DataType.ARRAY));
        assertEquals("[1, 2]", castValueWithTargetType("[1, 2]", DataType.ARRAY));
        assertEquals("7", castValueWithTargetType(7, DataType.ARRAY));
        assertSame(list, castValueWithTargetType(list, DataType.JSON_OBJECT));
        assertSame(map, castValueWithTargetType(map, DataType.JSON_OBJECT));
        assertEquals("7", castValueWithTargetType(7, DataType.JSON_OBJECT));
        System.out.println("[PostgresDataTypeUtilsTest] " + DataType.values().length + " data types converted");
    }

    /**
     * BF-106 (was pinned as the plan section 9 row "PostgresDataTypeUtils casts a bound text value ... raw
     * NumberFormatException / IllegalArgumentException instead of a coded PluginException", D-6): a text that does not
     * parse as the cast type is a PREPARED_STATEMENT_BIND_PARAMETERS_ERROR naming the value and the type, for every type
     * that parses text; the JDK's own exception used to escape.
     */
    @ParameterizedTest(name = "[{index}] {0} as {1}")
    @MethodSource("invalidTexts")
    public void invalidTextIsAPreparedStatementBindErrorBF106(String text, DataType type) {
        PluginException thrown = assertThrows(PluginException.class, () -> castValueWithTargetType(text, type));

        System.out.println("[PostgresDataTypeUtilsTest] " + text + " as " + type + " -> " + thrown.getError() + " " + thrown.getArgs()[0] + " (BF-106)");
        assertEquals(PluginCommonError.PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, thrown.getError());
        assertEquals(BIND_ERROR_KEY, thrown.getMessageKey());
        assertEquals("\"" + text + "\" is not a valid " + type, thrown.getArgs()[0]);
    }

    static Stream<Arguments> invalidTexts() {
        return Stream.of(
                Arguments.of("12.5", DataType.INTEGER),
                Arguments.of("x", DataType.LONG),
                Arguments.of("x", DataType.FLOAT),
                Arguments.of("x", DataType.DOUBLE),
                Arguments.of(NOT_A_DECIMAL, DataType.BIG_DECIMAL),
                Arguments.of("not-a-date", DataType.DATE),
                Arguments.of("noon", DataType.TIME),
                Arguments.of("yesterday", DataType.TIMESTAMP));
    }

    /**
     * BF-032 fixed: an explicit {@code ?::decimal} cast went through a Java float, so {@code 12345678.9} was bound as
     * {@code 1.23456792E7}. It is now a {@code BigDecimal} made from the text of the value, so every digit is kept (through a
     * real server: {@code PostgresDatabaseTest.explicitCastsRoundTripAndADecimalKeepsEveryDigitBF032}).
     */
    @Test
    public void decimalCastKeepsEveryDigitBF032() {
        assertEquals(List.of(DataType.BIG_DECIMAL), extractExplicitCasting("select ?::decimal"));
        Object cast = castValueWithTargetType(DECIMAL_TEXT, extractExplicitCasting("select ?::decimal").get(0));
        System.out.println("[PostgresDataTypeUtilsTest] " + DECIMAL_TEXT + " cast as decimal -> " + cast + " (" + cast.getClass().getSimpleName() + ")");
        assertEquals(new BigDecimal(DECIMAL_TEXT), cast, "every digit is kept");
        assertEquals(new BigDecimal(DOUBLE_SHORT_TEXT), castValueWithTargetType(DOUBLE_WITH_SHORT_TEXT, DataType.BIG_DECIMAL), "a number is read from its text, not its binary value");
        BigDecimal decimal = new BigDecimal("1.50");
        assertSame(decimal, castValueWithTargetType(decimal, DataType.BIG_DECIMAL));
        assertThrows(PluginException.class, () -> castValueWithTargetType(NOT_A_DECIMAL, DataType.BIG_DECIMAL), "not a number: the bind error, as for the other casts (BF-106)");
    }

    @Test
    public void dataTypesAreTheSupportedNamesAndStable() {
        Set<?> first = PostgresDataTypeUtils.dataType.getDataTypes();
        assertEquals(SUPPORTED, first);
        assertSame(first, PostgresDataTypeUtils.dataType.getDataTypes());
    }
}

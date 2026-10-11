package org.lowcoder.plugin.postgres;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.postgres.model.DataType;
import org.lowcoder.plugin.postgres.utils.PostgresDataTypeUtils;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    static final Set<String> SUPPORTED = Set.of("int8", "int4", "decimal", "varchar", "bool", "date", "time", "float8", "text", "int");

    @Test
    public void extractExplicitCastingMapsEachSupportedTypeInAnyCase() {
        Map<String, Object> observed = new LinkedHashMap<>();
        for (String type : new String[] {"int8", "int4", "decimal", "varchar", "bool", "date", "time", "float8", "text", "int"}) {
            observed.put(type, extractExplicitCasting("select ?::" + type));
            assertEquals(observed.get(type), extractExplicitCasting("select ?::" + type.toUpperCase()), type + " in upper case");
        }
        // int8, int4 and float8 are asserted in castPatternReadsLettersOnly (plan section 9 row)
        System.out.println("[PostgresDataTypeUtilsTest] casts as observed: " + observed);
        assertEquals(List.of(DataType.STRING), observed.get("varchar"));
        assertEquals(List.of(DataType.BOOLEAN), observed.get("bool"));
        assertEquals(List.of(DataType.DATE), observed.get("date"));
        assertEquals(List.of(DataType.TIME), observed.get("time"));
        assertEquals(List.of(DataType.STRING), observed.get("text"));
        assertEquals(List.of(DataType.INTEGER), observed.get("int"));
        assertEquals(List.of(DataType.FLOAT), observed.get("decimal"));
    }

    /**
     * Pins the plan section 9 row "PostgresDataTypeUtils' cast pattern ... reads letters only" (D-6: fix deferred): the
     * pattern {@code [a-zA-Z]+} stops at a digit, so {@code ?::int8} is read as {@code int} (INTEGER, not LONG), {@code ?::float8}
     * as {@code float} (not a supported name: no cast) and {@code ?::int4} only works by accident. A fix (digits in the
     * pattern) changes this test on purpose.
     */
    @Test
    public void castPatternReadsLettersOnly_int8IsReadAsInt() {
        assertEquals(List.of(DataType.INTEGER), extractExplicitCasting("select ?::int8"), "int8 is read as int");
        assertEquals(List.of(DataType.INTEGER), extractExplicitCasting("select ?::int4"));
        assertEquals(Arrays.asList((DataType) null), extractExplicitCasting("select ?::float8"), "float8 is read as float: no cast");
        System.out.println("[PostgresDataTypeUtilsTest] int8 -> " + extractExplicitCasting("?::int8") + ", float8 -> " + extractExplicitCasting("?::float8"));
    }

    @Test
    public void unknownTypeAndNoCastGiveNullAtTheRightPosition() {
        List<DataType> casts = extractExplicitCasting("select ?::text, ?, ?::bool, ?::numeric");
        System.out.println("[PostgresDataTypeUtilsTest] positions: " + casts);
        assertEquals(Arrays.asList(DataType.STRING, null, DataType.BOOLEAN, null), casts);
        assertEquals(List.of(), extractExplicitCasting("select 1"));
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
     * Pins the plan section 9 row "PostgresDataTypeUtils casts a bound text value ... raw NumberFormatException /
     * IllegalArgumentException instead of a coded PluginException" (D-6: fix deferred): a text that does not parse as the
     * cast type escapes as the JDK's own exception. A fix (a PluginException) changes this test on purpose.
     */
    @Test
    public void invalidTextEscapesAsRawParseExceptions() {
        assertThrows(NumberFormatException.class, () -> castValueWithTargetType("12.5", DataType.INTEGER));
        assertThrows(NumberFormatException.class, () -> castValueWithTargetType("x", DataType.LONG));
        assertThrows(IllegalArgumentException.class, () -> castValueWithTargetType("not-a-date", DataType.DATE));
        assertThrows(IllegalArgumentException.class, () -> castValueWithTargetType("yesterday", DataType.TIMESTAMP));
        System.out.println("[PostgresDataTypeUtilsTest] raw exceptions for 12.5 -> INTEGER, not-a-date -> DATE");
    }

    /**
     * Pins the plan section 9 row "PostgresDataTypeUtils maps an explicit ?::decimal cast to FLOAT ... precision is lost"
     * (D-6: fix deferred): the bound text becomes a Java float before the database sees it. A fix (BigDecimal) changes this
     * test on purpose; the loss through a real server is shown by {@code PostgresDatabaseTest}.
     */
    @Test
    public void decimalCastGoesThroughAFloatAndLosesPrecision() {
        assertEquals(List.of(DataType.FLOAT), extractExplicitCasting("select ?::decimal"));
        Object cast = castValueWithTargetType("12345678.9", DataType.FLOAT);
        assertEquals(Float.class, cast.getClass());
        assertEquals(1.23456792E7f, cast);
        assertEquals(false, new BigDecimal("12345678.9").compareTo(new BigDecimal(String.valueOf(cast))) == 0, "the digits after the float's precision are gone");
        System.out.println("[PostgresDataTypeUtilsTest] 12345678.9 cast as decimal -> " + cast);
    }

    @Test
    public void dataTypesAreTheSupportedNamesAndStable() {
        Set<?> first = PostgresDataTypeUtils.dataType.getDataTypes();
        assertEquals(SUPPORTED, first);
        assertSame(first, PostgresDataTypeUtils.dataType.getDataTypes());
    }
}

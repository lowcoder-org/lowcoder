package org.lowcoder.plugin.mssql.util;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mssql.MssqlFakeConnections;
import org.lowcoder.sdk.contract.FakeJdbc.Column;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit MS-3 (task L5-5a), the parser half: {@link MssqlResultParser#parseRowValue} on a {@code FakeJdbc} row typed by
 * the SQL Server type names the driver reports. {@code date} and {@code time} become text, the datetime family is
 * formatted with {@code yyyy-MM-dd HH:mm:ss} (no fraction), {@code datetimeoffset} becomes an ISO date-time with its
 * offset, a null cell stays null, every other type reaches the result as {@code getObject} gave it.
 *
 * <p>Limits: the cells are what the MSSQL driver is assumed to return for these types, built by hand (the real driver is
 * the container unit MS-4); {@code FakeJdbc} has no {@code getTimestamp}, so the test-side wrapper
 * {@code MssqlFakeConnections.resultSet} supplies it.
 */
public class MssqlResultParserTest {

    static final Timestamp TIMESTAMP = Timestamp.valueOf("2024-02-29 13:14:15.123");
    static final String TIMESTAMP_TEXT = "2024-02-29 13:14:15";
    static final OffsetDateTime OFFSET = OffsetDateTime.parse("2024-02-29T13:14:15.123+05:30");
    static final String OFFSET_TEXT = "2024-02-29T13:14:15.123+05:30";
    static final UUID GUID = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");

    private static Map<String, Object> parse(Map<String, Object> cells, Map<String, String> typeNames) throws SQLException {
        List<Column> columns = new ArrayList<>();
        cells.keySet().forEach(name -> columns.add(new Column(name, typeNames.get(name))));
        ResultSet resultSet = MssqlFakeConnections.resultSet(columns, List.of(new ArrayList<>(cells.values())));
        resultSet.next();
        ResultSetMetaData metaData = resultSet.getMetaData();
        Map<String, Object> row = MssqlResultParser.parseRowValue(resultSet, metaData, metaData.getColumnCount());
        System.out.println("[MssqlResultParserTest] " + typeNames + " -> " + render(row));
        return row;
    }

    private static String render(Map<String, Object> row) {
        Map<String, String> shown = new LinkedHashMap<>();
        row.forEach((key, value) -> shown.put(key, value == null ? "null" : value.getClass().getSimpleName() + ":" + (value instanceof byte[] bytes ? Arrays.toString(bytes) : value)));
        return shown.toString();
    }

    private static Map<String, Object> row(Object... namesAndCells) {
        Map<String, Object> cells = new LinkedHashMap<>();
        for (int i = 0; i < namesAndCells.length; i += 2) {
            cells.put((String) namesAndCells[i], namesAndCells[i + 1]);
        }
        return cells;
    }

    private static Map<String, String> types(Map<String, Object> cells, String... typeNames) {
        Map<String, String> types = new LinkedHashMap<>();
        int i = 0;
        for (String name : cells.keySet()) {
            types.put(name, typeNames[i++]);
        }
        return types;
    }

    @Test
    public void dateAndTimeBecomeTextInAnyCase() throws SQLException {
        Map<String, Object> cells = row("d", java.sql.Date.valueOf("2024-02-29"), "t", Time.valueOf("13:14:15"), "D", java.sql.Date.valueOf("2024-02-29"), "T", Time.valueOf("13:14:15"));
        Map<String, Object> parsed = parse(cells, types(cells, "date", "time", "DATE", "TIME"));
        assertEquals(Arrays.asList("2024-02-29", "13:14:15", "2024-02-29", "13:14:15"), new ArrayList<>(parsed.values()));
    }

    @Test
    public void datetimeFamilyIsFormattedWithoutFraction() throws SQLException {
        Map<String, Object> cells = row("a", TIMESTAMP, "b", TIMESTAMP, "c", TIMESTAMP, "d", TIMESTAMP);
        Map<String, Object> parsed = parse(cells, types(cells, "datetime", "datetime2", "smalldatetime", "timestamp"));
        assertEquals(Arrays.asList(TIMESTAMP_TEXT, TIMESTAMP_TEXT, TIMESTAMP_TEXT, TIMESTAMP_TEXT), new ArrayList<>(parsed.values()));
    }

    /**
     * Pins defect D16 (analysis-plugins section 0.6; plan section 9 row D1-D20): the datetime family is matched with a
     * case-sensitive {@code Set.contains} while {@code date}, {@code time} and {@code datetimeoffset} use
     * {@code equalsIgnoreCase}, so a type name in upper case skips the formatting and the raw {@link Timestamp} is
     * returned. A fix (a case-insensitive match) changes this test on purpose.
     */
    @Test
    public void upperCaseDatetimeTypeNameSkipsTheFormatting_pinsD16() throws SQLException {
        Map<String, Object> cells = row("a", TIMESTAMP, "b", TIMESTAMP, "c", TIMESTAMP, "d", TIMESTAMP);
        Map<String, Object> parsed = parse(cells, types(cells, "DATETIME", "DATETIME2", "SMALLDATETIME", "TIMESTAMP"));
        parsed.forEach((name, value) -> {
            assertInstanceOf(Timestamp.class, value, name + ": the raw Timestamp object comes back, not " + TIMESTAMP_TEXT);
            assertEquals(TIMESTAMP, value, name);
        });
    }

    @Test
    public void datetimeoffsetIsAnIsoDateTimeWithItsOffsetInAnyCase() throws SQLException {
        Map<String, Object> cells = row("a", OFFSET, "b", OFFSET);
        Map<String, Object> parsed = parse(cells, types(cells, "datetimeoffset", "DATETIMEOFFSET"));
        assertEquals(Arrays.asList(OFFSET_TEXT, OFFSET_TEXT), new ArrayList<>(parsed.values()));
    }

    @Test
    public void nullCellStaysNullForEveryTypeBranch() throws SQLException {
        Map<String, Object> cells = row("a", null, "b", null, "c", null, "d", null, "e", null);
        Map<String, Object> parsed = parse(cells, types(cells, "date", "datetime2", "datetimeoffset", "time", "nvarchar"));
        assertEquals(5, parsed.size());
        parsed.forEach((name, value) -> assertNull(value, name));
    }

    @Test
    public void otherTypesPassThroughAsTheDriverReturnsThemAndColumnsKeepTheirOrder() throws SQLException {
        byte[] bytes = {0, 1, (byte) 0xFF};
        Map<String, Object> cells = row("z_text", "žluťoučký", "a_int", 5, "m_big", Long.MAX_VALUE, "k_money", new BigDecimal("10.5000"),
                "g_guid", GUID.toString(), "f_bit", true, "b_bin", bytes, "d_unknown", "x");
        Map<String, Object> parsed = parse(cells, types(cells, "nvarchar", "int", "bigint", "money", "uniqueidentifier", "bit", "varbinary", "geography"));
        assertEquals(List.of("z_text", "a_int", "m_big", "k_money", "g_guid", "f_bit", "b_bin", "d_unknown"), new ArrayList<>(parsed.keySet()));
        assertEquals("žluťoučký", parsed.get("z_text"));
        assertEquals(5, parsed.get("a_int"));
        assertEquals(Long.MAX_VALUE, parsed.get("m_big"));
        assertEquals(new BigDecimal("10.5000"), parsed.get("k_money"));
        assertEquals(GUID.toString(), parsed.get("g_guid"));
        assertEquals(true, parsed.get("f_bit"));
        assertArrayEquals(bytes, (byte[]) parsed.get("b_bin"));
        assertEquals("x", parsed.get("d_unknown"), "an unknown type name is passed through");
    }

    @Test
    public void aFailingColumnReadIsAnSqlExceptionNotSwallowed() {
        Map<String, Object> cells = row("d", new org.lowcoder.sdk.contract.FakeJdbc.FailingCell("cannot read the value", "text"));
        SQLException thrown = assertThrows(SQLException.class, () -> parse(cells, types(cells, "date")));
        System.out.println("[MssqlResultParserTest] failing cell: " + thrown.getMessage());
        assertEquals("cannot read the value", thrown.getMessage());
    }
}

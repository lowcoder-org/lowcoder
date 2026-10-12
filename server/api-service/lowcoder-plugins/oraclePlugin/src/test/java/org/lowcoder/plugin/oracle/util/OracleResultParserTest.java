package org.lowcoder.plugin.oracle.util;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.FailingCell;
import org.lowcoder.sdk.contract.FakeJdbc.StreamedCell;

/**
 * BF-052: {@link OracleResultParser} reads the Oracle types the driver hands over as its own objects as text, and hands
 * every other column to the shared rules. Cells are built by hand as the driver's typed getters answer them
 * ({@code getString}, {@code getObject(i, OffsetDateTime/Duration/Period)}); a text cell is a {@link FailingCell}, whose
 * {@code getObject} fails, so only a read through {@code getString} gives its text (the driver's {@code getObject} gives
 * an {@code oracle.sql} object instead). The real driver is in {@code OracleDatabaseTest}.
 */
public class OracleResultParserTest {

    static final String TEXT = "long text";
    static final String ROWID = "AAAR6BAAYAAAAALAAA";
    static final OffsetDateTime OFFSET = OffsetDateTime.parse("2024-02-29T13:14:15.123+05:30");
    static final String OFFSET_TEXT = "2024-02-29T13:14:15.123+05:30";
    static final Duration DAY_TO_SECOND = Duration.parse("PT26H3M4.5S");
    static final Period YEAR_TO_MONTH = Period.of(2, 3, 0);
    static final BigDecimal NUMBER = new BigDecimal("12.34");
    static final String DRIVER_OBJECT = "getObject answers a driver object for this type";
    static final String LONG_TEXT = "long text";
    static final String AFTER = "after";
    static final byte[] LONG_RAW_BYTES = {0, 1, (byte) 0xFF};

    private static final List<Column> LONG_COLUMNS = List.of(new Column("C_LONG", "long"), new Column("C_AFTER", "VARCHAR2"));
    private static final List<Column> LONG_RAW_COLUMNS = List.of(new Column("C_NUM", "NUMBER"), new Column("C_LONG_RAW", "long raw"));

    private static final List<Column> COLUMNS = List.of(
            new Column("C_CLOB", OracleResultParser.CLOB),
            new Column("C_NCLOB", "nclob"),
            new Column("C_ROWID", OracleResultParser.ROWID),
            new Column("C_TSTZ", OracleResultParser.TIMESTAMP_WITH_TIME_ZONE),
            new Column("C_TSLTZ", OracleResultParser.TIMESTAMP_WITH_LOCAL_TIME_ZONE),
            new Column("C_IDS", OracleResultParser.INTERVAL_DAY_TO_SECOND),
            new Column("C_IYM", OracleResultParser.INTERVAL_YEAR_TO_MONTH),
            new Column("C_NUM", "NUMBER"));

    private static List<Map<String, Object>> parse(List<List<Object>> rows) throws SQLException {
        return parse(COLUMNS, rows);
    }

    private static List<Map<String, Object>> parse(List<Column> columns, List<List<Object>> rows) throws SQLException {
        List<Map<String, Object>> parsed = OracleResultParser.parseRows(FakeJdbc.resultSet(columns, rows));
        System.out.println("[OracleResultParserTest] " + columns.stream().map(column -> column.label() + " " + column.typeName()).toList()
                + " -> " + parsed.stream().map(row -> row.entrySet().stream()
                        .map(cell -> cell.getKey() + "=" + describe(cell.getValue())).toList()).toList());
        return parsed;
    }

    /** The class and the value of a parsed cell, bytes as a list, so a hex string and bytes read differently. */
    private static String describe(Object value) {
        if (value == null) {
            return "null";
        }
        return value.getClass().getSimpleName() + ":" + (value instanceof byte[] bytes ? Arrays.toString(bytes) : value);
    }

    @Test
    public void oracleDriverTypesAreReadAsTextAndOtherColumnsFollowTheSharedRulesBF052() throws SQLException {
        Map<String, Object> row = parse(List.of(List.of(new FailingCell(DRIVER_OBJECT, TEXT), new FailingCell(DRIVER_OBJECT, TEXT),
                new FailingCell(DRIVER_OBJECT, ROWID), OFFSET, OFFSET, DAY_TO_SECOND, YEAR_TO_MONTH, NUMBER))).get(0);

        assertEquals(List.of("C_CLOB", "C_NCLOB", "C_ROWID", "C_TSTZ", "C_TSLTZ", "C_IDS", "C_IYM", "C_NUM"), new ArrayList<>(row.keySet()));
        assertEquals(TEXT, row.get("C_CLOB"));
        assertEquals(TEXT, row.get("C_NCLOB"), "a type name in lower case is matched too");
        assertEquals(ROWID, row.get("C_ROWID"));
        assertEquals(OFFSET_TEXT, row.get("C_TSTZ"));
        assertEquals(OFFSET_TEXT, row.get("C_TSLTZ"));
        assertEquals("PT26H3M4.5S", row.get("C_IDS"));
        assertEquals("P2Y3M", row.get("C_IYM"));
        assertEquals(NUMBER, row.get("C_NUM"), "a type the shared rules handle is passed through as before");
    }

    @Test
    public void aNullCellStaysNullForEveryType() throws SQLException {
        Map<String, Object> row = parse(List.of(Arrays.asList(new Object[COLUMNS.size()]))).get(0);

        assertEquals(COLUMNS.size(), row.size());
        row.forEach((column, value) -> assertNull(value, column));
    }

    /**
     * NEW-15 fixed: the Oracle driver streams a {@code LONG} column, so its cell can be read once; the shared result parser
     * read every cell twice (once for its null check), and the query failed with ORA-17027 "Stream has already been closed."
     * A {@code LONG} is now read once as text, like a CLOB. The {@link StreamedCell} fails on a second read, as the driver
     * does; the column after it still reads, and a null row stays null.
     */
    @Test
    public void aLongCellIsReadOnceAsTextNEW15() throws SQLException {
        List<Map<String, Object>> rows = parse(LONG_COLUMNS,
                List.of(List.of(new StreamedCell(LONG_TEXT), AFTER), Arrays.asList(new Object[LONG_COLUMNS.size()])));

        assertEquals(LONG_TEXT, rows.get(0).get("C_LONG"));
        assertInstanceOf(String.class, rows.get(0).get("C_LONG"), "a type name in lower case is matched too");
        assertEquals(AFTER, rows.get(0).get("C_AFTER"), "the column after the streamed one still reads");
        rows.get(1).forEach((column, value) -> assertNull(value, column));
    }

    /**
     * NEW-15 fixed for the binary twin: a {@code LONG RAW} column is streamed as well and is now read once with
     * {@code getBytes}, which answers the bytes, the value a {@code RAW} column has had all along. The column is the last
     * one here, so the parser reaches it after another column; a null row stays null.
     */
    @Test
    public void aLongRawCellIsReadOnceAsBytesNEW15() throws SQLException {
        List<Map<String, Object>> rows = parse(LONG_RAW_COLUMNS,
                List.of(List.of(NUMBER, new StreamedCell(LONG_RAW_BYTES)), Arrays.asList(new Object[LONG_RAW_COLUMNS.size()])));

        Object cell = rows.get(0).get("C_LONG_RAW");
        assertInstanceOf(byte[].class, cell, "bytes, not the hex text of getString");
        assertArrayEquals(LONG_RAW_BYTES, (byte[]) cell);
        assertEquals(NUMBER, rows.get(0).get("C_NUM"), "a type the shared rules handle is passed through as before");
        rows.get(1).forEach((column, value) -> assertNull(value, column));
    }
}

package org.lowcoder.plugin.oracle.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        List<Map<String, Object>> parsed = OracleResultParser.parseRows(FakeJdbc.resultSet(COLUMNS, rows));
        System.out.println("[OracleResultParserTest] " + parsed);
        return parsed;
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
}

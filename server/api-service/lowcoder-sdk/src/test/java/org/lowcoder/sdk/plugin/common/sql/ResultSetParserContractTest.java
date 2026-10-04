package org.lowcoder.sdk.plugin.common.sql;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.FailingCell;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.models.QueryExecutionResult;

import javax.sql.rowset.serial.SerialArray;
import javax.sql.rowset.serial.SerialBlob;
import javax.sql.rowset.serial.SerialClob;
import javax.sql.rowset.serial.SerialException;
import javax.sql.rowset.serial.SerialRef;
import javax.sql.rowset.serial.SerialStruct;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.StringReader;
import java.io.Writer;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.NClob;
import java.sql.Ref;
import java.sql.ResultSet;
import java.sql.RowId;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.SQLXML;
import java.sql.Struct;
import java.sql.Time;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;

/**
 * The SQL leaf values of the §4.6 producer table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, task T8.2):
 * {@link ResultSetParser#parseRows} over one row whose columns hold every value class a JDBC driver hands out through
 * {@code getObject} (JDBC 4.2 default mapping, the {@code java.sql} interfaces as JDK {@code Serial*} classes or
 * minimal implementations, and {@link UUID}), plus the columns the parser converts by type name ({@code date},
 * {@code datetime}, {@code timestamp}, {@code year}, {@code blob}, and a MySQL {@code TIME} duration). Each column's
 * report is the Java class of the parsed value and the text the production mapper writes for it alone, so one value
 * that fails to write does not hide the others ({@code Clob}, {@code NClob} and {@code Array} do, O76); the whole row
 * is reported as a query result too, and fails to write with them. Pinned in
 * {@value #REPORT}.
 *
 * <p>Limits: the values are those of {@link FakeJdbc} and the JDK, not of a real driver (a driver's own {@code Array}
 * or {@code Clob} class writes its own getters); the default time zone is UTC while the test runs, since
 * {@code java.sql.Time} and the date conversions use it.
 */
public class ResultSetParserContractTest {

    static final String REPORT = "query-results/ResultSetParser.leaves.json";
    static final String LEAF_TYPE = "OTHER";
    static final String ROW_KEY = "row";
    static final String COLUMNS_KEY = "columns";
    static final String CLASS_KEY = "class";
    static final String TYPE_NAME_KEY = "typeName";
    static final String MYSQL_DURATION_MESSAGE = "The value '30:00:00' is an invalid TIME value. JDBC Time objects represent a wall-clock time";
    static final Instant INSTANT = Instant.parse("2024-02-29T13:14:15.123Z");
    static final byte[] BYTES = {0, 1, (byte) 0xFF, 'a'};
    static final String TEXT = "žluťoučký kůň 🐎";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static TimeZone defaultZone;

    @BeforeClass
    public static void useUtc() {
        defaultZone = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    @AfterClass
    public static void restoreZone() {
        TimeZone.setDefault(defaultZone);
    }

    @Test
    public void leafValuesAsPinned() throws SQLException {
        Map<String, Object> cells = cells();
        List<Column> columns = new ArrayList<>();
        cells.keySet().forEach(label -> columns.add(new Column(label, typeName(label))));
        ResultSet resultSet = FakeJdbc.resultSet(columns, List.of(new ArrayList<>(cells.values())));

        List<Map<String, Object>> rows = ResultSetParser.parseRows(resultSet);
        Map<String, Object> perColumn = new LinkedHashMap<>();
        rows.get(0).forEach((label, value) -> {
            Map<String, Object> column = new LinkedHashMap<>();
            column.put(TYPE_NAME_KEY, typeName(label));
            column.put(CLASS_KEY, value == null ? String.valueOf((Object) null) : value.getClass().getName());
            column.put(QueryResults.WRITTEN_KEY, QueryResults.written(value));
            perColumn.put(label, column);
        });
        Map<String, Object> report = new LinkedHashMap<>();
        report.put(COLUMNS_KEY, perColumn);
        report.put(ROW_KEY, QueryResults.report(QueryExecutionResult.success(rows)));
        String actual = ConfigBinding.write(report);
        System.out.println("[ResultSetParserContractTest] " + rows.size() + " row, " + perColumn.size() + " columns\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The column's type name: the parser's own names for the converted columns, {@value #LEAF_TYPE} for the leaves. */
    private static String typeName(String label) {
        return switch (label) {
            case "date", "datetime", "timestamp", "year", "blob" -> label;
            case "timeDuration", "time" -> "TIME";
            default -> LEAF_TYPE;
        };
    }

    private static Map<String, Object> cells() throws SQLException {
        Map<String, Object> cells = new LinkedHashMap<>();
        cells.put("string", TEXT);
        cells.put("bigDecimal", new BigDecimal("1.50"));
        cells.put("bigDecimalExponent", new BigDecimal("1E+3"));
        cells.put("boolean", Boolean.TRUE);
        cells.put("integer", Integer.MAX_VALUE);
        cells.put("long", Long.MAX_VALUE);
        cells.put("float", 1.1f);
        cells.put("double", 0.1d);
        cells.put("bytes", BYTES);
        cells.put("sqlDate", new java.sql.Date(INSTANT.toEpochMilli()));
        cells.put("time", new Time(INSTANT.toEpochMilli()));
        cells.put("sqlTimestamp", Timestamp.from(INSTANT));
        cells.put("clob", new SerialClob(TEXT.toCharArray()));
        cells.put("nclob", new TestNClob(TEXT));
        cells.put("blobLeaf", new SerialBlob(BYTES));
        cells.put("array", new SerialArray(new FakeJdbc.SqlArray("int4", Types.INTEGER, new Integer[] {1, 2, null})));
        cells.put("struct", new SerialStruct(new TestStruct("point", new Object[] {1, "two"}), Map.of()));
        cells.put("ref", new SerialRef(new TestRef("point", "referenced")));
        cells.put("rowId", new TestRowId(BYTES));
        cells.put("sqlxml", new TestSqlXml("<a>" + TEXT + "</a>"));
        cells.put("uuid", UUID.fromString("123e4567-e89b-12d3-a456-426614174000"));
        cells.put("null", null);
        cells.put("date", new java.sql.Date(INSTANT.toEpochMilli()));
        cells.put("datetime", Timestamp.from(INSTANT));
        cells.put("timestamp", Timestamp.from(INSTANT));
        cells.put("year", new java.sql.Date(INSTANT.toEpochMilli()));
        cells.put("blob", new SerialBlob(BYTES));
        cells.put("timeDuration", new FailingCell(MYSQL_DURATION_MESSAGE, "30:00:00"));
        return cells;
    }

    /** An {@code NClob} as {@link SerialClob} holds one. */
    static final class TestNClob extends SerialClob implements NClob {
        TestNClob(String text) throws SQLException {
            super(text.toCharArray());
        }
    }

    /** The struct a driver hands to {@link SerialStruct}. */
    record TestStruct(String typeName, Object[] attributes) implements Struct {
        @Override
        public String getSQLTypeName() {
            return typeName;
        }

        @Override
        public Object[] getAttributes() {
            return attributes.clone();
        }

        @Override
        public Object[] getAttributes(Map<String, Class<?>> map) {
            return getAttributes();
        }
    }

    /** The reference a driver hands to {@link SerialRef}. */
    record TestRef(String baseTypeName, Object object) implements Ref {
        @Override
        public String getBaseTypeName() {
            return baseTypeName;
        }

        @Override
        public Object getObject(Map<String, Class<?>> map) {
            return object;
        }

        @Override
        public Object getObject() {
            return object;
        }

        @Override
        public void setObject(Object value) throws SQLException {
            throw new SQLFeatureNotSupportedException("TestRef.setObject");
        }
    }

    /** A row id of fixed bytes. */
    record TestRowId(byte[] bytes) implements RowId {
        @Override
        public byte[] getBytes() {
            return bytes.clone();
        }
    }

    /** A readable XML value; writing to it is not supported. */
    record TestSqlXml(String xml) implements SQLXML {
        @Override
        public void free() {
        }

        @Override
        public InputStream getBinaryStream() {
            return new java.io.ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        }

        @Override
        public OutputStream setBinaryStream() throws SQLException {
            throw new SerialException("TestSqlXml is read-only");
        }

        @Override
        public Reader getCharacterStream() {
            return new StringReader(xml);
        }

        @Override
        public Writer setCharacterStream() throws SQLException {
            throw new SerialException("TestSqlXml is read-only");
        }

        @Override
        public String getString() {
            return xml;
        }

        @Override
        public void setString(String value) throws SQLException {
            throw new SerialException("TestSqlXml is read-only");
        }

        @Override
        public <T extends javax.xml.transform.Source> T getSource(Class<T> sourceClass) throws SQLException {
            throw new SQLFeatureNotSupportedException("TestSqlXml.getSource");
        }

        @Override
        public <T extends javax.xml.transform.Result> T setResult(Class<T> resultClass) throws SQLException {
            throw new SQLFeatureNotSupportedException("TestSqlXml.setResult");
        }
    }
}

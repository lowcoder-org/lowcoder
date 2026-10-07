package org.lowcoder.plugin.oracle.util;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.lowcoder.sdk.plugin.common.sql.ResultSetParser;

/**
 * The rows of an Oracle query. The Oracle driver answers {@code getObject} for some types with its own classes
 * ({@code oracle.sql.CLOB}, {@code TIMESTAMPTZ}, {@code INTERVALDS}, ...), which are not readable data and which the JSON
 * writer cannot write: a result holding a {@code CLOB} was written as an empty string, the others as the driver's
 * internal bytes (BF-052). These types are read as text here: a {@code CLOB}, {@code NCLOB} or {@code ROWID} as its text,
 * a {@code TIMESTAMP WITH (LOCAL) TIME ZONE} as an ISO date-time with its offset, an {@code INTERVAL DAY TO SECOND} as an
 * ISO-8601 duration ({@code PT26H3M4.5S}) and an {@code INTERVAL YEAR TO MONTH} as an ISO-8601 period ({@code P2Y3M}).
 * Every other column follows {@link ResultSetParser#getValue}. A null cell stays null.
 * <p>
 * Limits: a time zone given by region ({@code Europe/Prague}) is written as its offset at that instant, without the region
 * name; a {@code TIMESTAMP WITH LOCAL TIME ZONE} is read in the session time zone, which the driver takes from the JVM;
 * the other Oracle types the driver hands over as its own objects ({@code XMLTYPE}, {@code BFILE}, object and collection
 * types) are not handled here.
 */
public final class OracleResultParser {

    static final String CLOB = "CLOB";
    static final String NCLOB = "NCLOB";
    static final String ROWID = "ROWID";
    static final String TIMESTAMP_WITH_TIME_ZONE = "TIMESTAMP WITH TIME ZONE";
    static final String TIMESTAMP_WITH_LOCAL_TIME_ZONE = "TIMESTAMP WITH LOCAL TIME ZONE";
    static final String INTERVAL_DAY_TO_SECOND = "INTERVALDS";
    static final String INTERVAL_YEAR_TO_MONTH = "INTERVALYM";

    private static final Set<String> TEXT_TYPES = Set.of(CLOB, NCLOB, ROWID);
    private static final Set<String> ZONED_TIMESTAMP_TYPES = Set.of(TIMESTAMP_WITH_TIME_ZONE, TIMESTAMP_WITH_LOCAL_TIME_ZONE);

    private OracleResultParser() {
    }

    public static List<Map<String, Object>> parseRows(ResultSet resultSet) throws SQLException {
        ResultSetMetaData metaData = resultSet.getMetaData();
        int columnCount = metaData.getColumnCount();
        List<Map<String, Object>> rows = new ArrayList<>();
        while (resultSet.next()) {
            Map<String, Object> row = new LinkedHashMap<>(columnCount);
            for (int i = 1; i <= columnCount; i++) {
                row.put(metaData.getColumnLabel(i), getValue(resultSet, i, metaData.getColumnTypeName(i)));
            }
            rows.add(row);
        }
        return rows;
    }

    private static Object getValue(ResultSet resultSet, int i, String typeName) throws SQLException {
        String type = typeName.toUpperCase(Locale.ROOT);
        if (TEXT_TYPES.contains(type)) {
            return resultSet.getString(i);
        }
        if (ZONED_TIMESTAMP_TYPES.contains(type)) {
            OffsetDateTime value = resultSet.getObject(i, OffsetDateTime.class);
            return value == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(value);
        }
        if (INTERVAL_DAY_TO_SECOND.equals(type)) {
            Duration value = resultSet.getObject(i, Duration.class);
            return value == null ? null : value.toString();
        }
        if (INTERVAL_YEAR_TO_MONTH.equals(type)) {
            Period value = resultSet.getObject(i, Period.class);
            return value == null ? null : value.toString();
        }
        return ResultSetParser.getValue(resultSet, i, typeName);
    }
}

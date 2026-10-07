package org.lowcoder.plugin.mssql.util;

import static org.lowcoder.sdk.util.DateTimeUtils.DATE_TIME_FORMAT;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import com.google.common.collect.ImmutableSet;

public class MssqlResultParser {

    /**
     * The date-time types read with {@code getTimestamp}. Not {@code timestamp}: on SQL Server that is the synonym of
     * {@code rowversion}, an 8-byte row counter the driver refuses to read as a date (BF-049: a {@code select *} from a
     * table with one failed); {@code getObject} gives its bytes, as for {@code varbinary}.
     */
    private static final Set<String> TIMESTAMP_TYPES = ImmutableSet.of("smalldatetime", "datetime", "datetime2");

    public static Map<String, Object> parseRowValue(ResultSet resultSet, ResultSetMetaData metaData, int colCount) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        for (int i = 1; i <= colCount; i++) {
            String typeName = metaData.getColumnTypeName(i);
            Object value = getValue(resultSet, i, typeName);
            row.put(metaData.getColumnName(i), value);
        }
        return row;
    }

    private static Object getValue(ResultSet resultSet, int i, String typeName) throws SQLException {

        if (resultSet.getObject(i) == null) {
            return null;
        }

        if ("date".equalsIgnoreCase(typeName) || "time".equalsIgnoreCase(typeName)) {
            return resultSet.getString(i);
        }

        if (TIMESTAMP_TYPES.contains(typeName)) {
            return DATE_TIME_FORMAT.format(resultSet.getTimestamp(i).toLocalDateTime());
        }

        if ("datetimeoffset".equalsIgnoreCase(typeName)) {
            return DateTimeFormatter.ISO_DATE_TIME.format(resultSet.getObject(i, OffsetDateTime.class));
        }

        return resultSet.getObject(i);
    }
}

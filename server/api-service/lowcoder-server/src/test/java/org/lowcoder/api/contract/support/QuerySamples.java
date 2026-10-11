package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.api.query.view.LibraryQueryRequestFromJs;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.QueryResultView;
import org.lowcoder.sdk.models.LocaleMessage;
import org.lowcoder.sdk.models.Param;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.ResultSetParser;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import javax.sql.rowset.serial.SerialBlob;

import static org.mockito.ArgumentMatchers.anyInt;

/**
 * Samples of the query execution types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T5.2), with the conventions of
 * {@link PayloadSamples}. {@link Param#getValue()} is declared {@code Object}, and {@link QueryResultView}'s
 * {@code data} and {@code headers} are {@code Object} and {@code JsonNode}: they hold the §4.6 representative input
 * (adequacy check 3). {@link #mixedQueryExecutionResult()} is the server-side mixed sample of §4.6 (task T5.3).
 */
public final class QuerySamples {

    /** The locale a {@link QueryResultView} is built with: the request's ({@code EndpointContract.REQUEST_LOCALE}). */
    public static final Locale RESULT_LOCALE = EndpointContract.REQUEST_LOCALE;
    /** A non-2xx REST answer: {@code queryCode} {@code HTTP<status name>}, {@code success} {@code false}. */
    public static final HttpStatus RESULT_STATUS = HttpStatus.BAD_GATEWAY;
    /** Real message keys of the server's locale bundle, so that the localized texts are written. */
    public static final String MESSAGE_KEY = "QUERY_EXECUTION_ERROR";
    public static final String HINT_KEY = "DUPLICATE_COLUMN";
    /** The private {@code QueryExecutionResult} fields that no factory sets together with headers and data. */
    static final String MESSAGE_KEY_FIELD = "messageKey";
    static final String MESSAGE_ARGS_FIELD = "messageArgs";
    static final String HINTS_FIELD = "hintLocaleMessages";

    /** The keys of {@link #mixedData()}: one per producer of plan §4.6. */
    public static final String JDBC_ROW = "jdbcRow";
    public static final String SQL_STATEMENTS = "sqlStatements";
    public static final String POSTGRES_ROW = "postgresRow";
    public static final String REST_BASE64_BODY = "restBase64Body";
    public static final String REST_RAW_BODY = "restRawBody";
    public static final String NODE_SERVICE_RESULT = "nodeServiceResult";
    public static final String REDIS_VALUES = "redisValues";
    public static final String SMTP_RESULT = "smtpResult";
    /** The keys {@code GeneralSqlExecutor} writes for an update statement ({@code GeneralSqlExecutor.java:100}, {@code :110}). */
    static final String AFFECTED_ROWS = "affectedRows";
    static final String GENERATED_KEYS = "generatedKeys";
    /**
     * Instants as epoch milliseconds: Jackson writes {@link Date} and {@link Timestamp} as their {@code getTime()}, so
     * a value built from milliseconds is the same in every time zone ({@code Date.valueOf} is local midnight, and is
     * not). {@link Time} is written as its {@code toString()}, the local wall-clock time {@code Time.valueOf} reads.
     */
    static final long SQL_DATE_MILLIS = 1_767_225_600_000L;
    static final long SQL_TIMESTAMP_MILLIS = 1_767_225_600_123L;
    static final int SQL_TIMESTAMP_NANOS = 123_456_789;
    static final String SQL_TIME = "13:14:15";
    /** The local date of the date, datetime and year columns, which {@code ResultSetParser} formats by its local fields. */
    static final String SQL_DATE = "2026-01-02";
    static final String UUID_TEXT = "123e4567-e89b-12d3-a456-426614174000";
    /** {@code BigDecimal}s with a trailing zero and with an exponent, whose lexemes Jackson keeps. */
    static final String DECIMAL_TRAILING_ZERO = "12.50";
    static final String DECIMAL_EXPONENT = "1E+3";
    /** A REST image body: base64 text, which Jackson base64-encodes again (O7). */
    static final String BASE64_TEXT = "aW1hZ2U=";
    static final byte[] RAW_BYTES = {0, -1, 127, -128};
    static final int AFFECTED_ROW_COUNT = 2;

    private QuerySamples() {
    }

    /** {@code QueryEndpoints#execute}; {@code path} is an array, {@code viewMode} a primitive set to its non-default. */
    public static QueryExecutionRequest queryExecutionRequest() {
        QueryExecutionRequest request = new QueryExecutionRequest();
        request.setApplicationId("QueryExecutionRequest.applicationId");
        request.setQueryId("QueryExecutionRequest.queryId");
        request.setLibraryQueryId("QueryExecutionRequest.libraryQueryId");
        request.setLibraryQueryRecordId("QueryExecutionRequest.libraryQueryRecordId");
        request.setParams(params("QueryExecutionRequest.params"));
        request.setViewMode(true);
        request.setPath(new String[] {"QueryExecutionRequest.path[0]", "QueryExecutionRequest.path[1]"});
        return request;
    }

    /** {@code QueryEndpoints#executeLibraryQueryFromJs}. */
    public static LibraryQueryRequestFromJs libraryQueryRequestFromJs() {
        LibraryQueryRequestFromJs request = new LibraryQueryRequestFromJs();
        request.setLibraryQueryName("LibraryQueryRequestFromJs.libraryQueryName");
        request.setLibraryQueryRecordId("LibraryQueryRequestFromJs.libraryQueryRecordId");
        request.setParams(params("LibraryQueryRequestFromJs.params"));
        return request;
    }

    public static Param param() {
        return param("Param");
    }

    static Param param(String prefix) {
        return Param.of(prefix + ".key", PayloadSamples.representativeObject());
    }

    static List<Param> params(String prefix) {
        return new ArrayList<>(List.of(param(prefix + "[0]"), param(prefix + "[1]")));
    }

    /** The view of {@link #queryExecutionResult()} in {@link #RESULT_LOCALE}, as {@code QueryController} builds it. */
    public static QueryResultView queryResultView() {
        return new QueryResultView(queryExecutionResult(), RESULT_LOCALE);
    }

    /**
     * A result that sets every property of its view: a REST answer with headers and data
     * ({@code QueryExecutionResult#ofRestApiResult}), plus a localized message and two hints, which production sets on
     * other results; no factory sets them all, so these three private fields are set directly.
     */
    public static QueryExecutionResult queryExecutionResult() {
        QueryExecutionResult result = QueryExecutionResult.ofRestApiResult(RESULT_STATUS,
                (JsonNode) PayloadSamples.representative(JsonUtils.getObjectMapper().constructType(JsonNode.class)),
                PayloadSamples.representativeObject());
        ReflectionTestUtils.setField(result, MESSAGE_KEY_FIELD, MESSAGE_KEY);
        ReflectionTestUtils.setField(result, MESSAGE_ARGS_FIELD, new Object[] {"QueryResultView.message"});
        ReflectionTestUtils.setField(result, HINTS_FIELD, new ArrayList<>(List.of(new LocaleMessage(HINT_KEY, "QueryResultView.hintMessages[0]"),
                new LocaleMessage(HINT_KEY, "QueryResultView.hintMessages[1]"))));
        return result;
    }

    /**
     * The server-side mixed sample of plan §4.6 (task T5.3): a successful result whose {@code data} combines the value
     * kinds of every §4.6 producer, built as the anchored code builds them, plus one hint as ClickHouse adds. No producer
     * puts all of them in one result; the combination lets one codec run cover the server's writing of each kind.
     */
    public static QueryExecutionResult mixedQueryExecutionResult() {
        return QueryExecutionResult.success(mixedData(), new ArrayList<>(List.of(new LocaleMessage(HINT_KEY, "QueryResultView.mixed.hint"))));
    }

    /** The {@code data} of {@link #mixedQueryExecutionResult()}, keyed by producer. */
    static Map<String, Object> mixedData() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put(JDBC_ROW, jdbcRow());
        // several statements stay a list of their results (GeneralSqlExecutor.java:91): rows, then an update count
        Map<String, Object> update = new HashMap<>();
        update.put(AFFECTED_ROWS, AFFECTED_ROW_COUNT);
        update.put(GENERATED_KEYS, new ArrayList<>(List.of(Long.MAX_VALUE, BigInteger.valueOf(Long.MAX_VALUE).add(BigInteger.ONE))));
        data.put(SQL_STATEMENTS, new ArrayList<>(List.of(new ArrayList<>(List.of(jdbcRow())), update)));
        data.put(POSTGRES_ROW, postgresRow());
        data.put(REST_BASE64_BODY, BASE64_TEXT.getBytes(StandardCharsets.UTF_8));
        data.put(REST_RAW_BODY, RAW_BYTES.clone());
        data.put(NODE_SERVICE_RESULT, PayloadSamples.representativeObject());
        data.put(REDIS_VALUES, new ArrayList<>(List.of("RedisPlugin.value", "")));
        data.put(SMTP_RESULT, null);
        return data;
    }

    /**
     * One row as the production {@code ResultSetParser.parseRows} builds it from a mocked one-row {@link ResultSet}:
     * the columns it converts (date, datetime, year, blob; {@code ResultSetParser.java:70-84}) and one column per JDBC
     * 4.2 default class that {@code getObject} answers unchanged ({@code :86}). The JDBC interfaces ({@code Clob},
     * {@code Array}, ...) are WP8's, with the plugins that meet them.
     */
    static Map<String, Object> jdbcRow() {
        Map<String, Object> columns = new LinkedHashMap<>();
        columns.put(ResultSetParser.DATE_COLUMN_TYPE_NAME, Date.valueOf(SQL_DATE));
        columns.put(ResultSetParser.DATETIME_COLUMN_TYPE_NAME, Timestamp.valueOf(SQL_DATE + " " + SQL_TIME));
        columns.put(ResultSetParser.YEAR_COLUMN_TYPE_NAME, Date.valueOf(SQL_DATE));
        columns.put(ResultSetParser.BLOB_COLUMN_TYPE_NAME, RAW_BYTES.clone());
        columns.put("varchar", "ResultSet.string \u00e9\u0000");
        columns.put("decimalTrailingZero", new BigDecimal(DECIMAL_TRAILING_ZERO));
        columns.put("decimalExponent", new BigDecimal(DECIMAL_EXPONENT));
        columns.put("bigintUnsigned", BigInteger.valueOf(Long.MAX_VALUE).add(BigInteger.ONE));
        columns.put("bit", Boolean.TRUE);
        columns.put("int", Integer.MIN_VALUE);
        columns.put("bigint", Long.MAX_VALUE);
        columns.put("real", 0.1f);
        columns.put("double", 0.1d);
        columns.put("doubleWhole", 2.0d);
        columns.put("varbinary", RAW_BYTES.clone());
        columns.put("sqlDate", new Date(SQL_DATE_MILLIS));
        columns.put("sqlTime", Time.valueOf(SQL_TIME));
        Timestamp timestamp = new Timestamp(SQL_TIMESTAMP_MILLIS);
        timestamp.setNanos(SQL_TIMESTAMP_NANOS);
        columns.put("sqlTimestamp", timestamp);
        columns.put("uuid", UUID.fromString(UUID_TEXT));
        columns.put("nullColumn", null);
        try {
            List<Map<String, Object>> rows = ResultSetParser.parseRows(oneRow(new ArrayList<>(columns.entrySet())));
            return rows.get(0);
        } catch (SQLException e) {
            throw new IllegalStateException("the mocked result set failed", e);
        }
    }

    /**
     * A one-row {@link ResultSet} whose column {@code i} has the entry's key as type name and label and answers its
     * value from {@code getObject}; {@code getDate}, {@code getTime} and {@code getBlob} answer what a driver answers
     * for the date, datetime, year and blob columns.
     */
    private static ResultSet oneRow(List<Map.Entry<String, Object>> columns) throws SQLException {
        ResultSet resultSet = Mockito.mock(ResultSet.class);
        ResultSetMetaData metaData = Mockito.mock(ResultSetMetaData.class);
        Mockito.when(resultSet.getMetaData()).thenReturn(metaData);
        Mockito.when(resultSet.next()).thenReturn(true, false);
        Mockito.when(metaData.getColumnCount()).thenReturn(columns.size());
        Mockito.when(metaData.getColumnTypeName(anyInt())).thenAnswer(call -> columns.get(column(call)).getKey());
        Mockito.when(metaData.getColumnLabel(anyInt())).thenAnswer(call -> columns.get(column(call)).getKey());
        Mockito.when(resultSet.getObject(anyInt())).thenAnswer(call -> columns.get(column(call)).getValue());
        Mockito.when(resultSet.getDate(anyInt())).thenAnswer(call -> new Date(((java.util.Date) columns.get(column(call)).getValue()).getTime()));
        Mockito.when(resultSet.getTime(anyInt())).thenAnswer(call -> new Time(((java.util.Date) columns.get(column(call)).getValue()).getTime()));
        Mockito.when(resultSet.getBlob(anyInt())).thenAnswer(call -> new SerialBlob((byte[]) columns.get(column(call)).getValue()));
        return resultSet;
    }

    /** The list index of the JDBC column index (from 1) that {@code call} passes. */
    private static int column(InvocationOnMock call) {
        return call.<Integer>getArgument(0) - 1;
    }

    /** A Postgres row ({@code PostgresResultParser.java:226-246}): arrays from {@code getArray().getArray()}, a JSON column. */
    static Map<String, Object> postgresRow() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("integerArray", new Integer[] {1, null, Integer.MAX_VALUE});
        row.put("textArray", new String[] {"PostgresResultParser.text", null});
        row.put("decimalArray", new BigDecimal[] {new BigDecimal(DECIMAL_TRAILING_ZERO)});
        row.put("json", PayloadSamples.representative(JsonUtils.getObjectMapper().constructType(JsonNode.class)));
        row.put("citext", "PGobject.value");
        return row;
    }
}

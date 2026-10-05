package org.lowcoder.plugin.postgres;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.Rows;
import org.lowcoder.sdk.contract.FakeJdbc.SqlArray;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.postgresql.util.PGInterval;
import org.postgresql.util.PGobject;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Group {@code external-json} of {@code PostgresResultParser} and the Postgres columns of the §4.6 producer table
 * (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.10, task T8.2): {@code PostgresExecutor.executeQuery} on a data source whose
 * connection ({@link FakeJdbc}) answers one row of {@link #cells}, typed by Postgres type name. {@code json} and
 * {@code jsonb} columns are read into a tree by the production mapper ({@code readTree}), arrays become the Java array
 * of {@code getArray().getArray()}, a {@link PGobject} its text, dates and times text, and the rest reaches Jackson as
 * {@code getObject} gives it. A {@code json} column whose text does not parse fails the query
 * ({@link #invalidJsonFailsTheQuery}). Pinned in {@value #REPORT}.
 *
 * <p>Limits: the cells are what the Postgres driver's {@code getObject} returns for these types, built by hand; the
 * {@code timestamp} conversion uses the JVM zone on both sides, so it is zone-independent.
 */
public class PostgresResultContractTest {

    static final String REPORT = "external-json/PostgresResultParser.rows.json";
    static final String QUERY = "select * from items";
    static final String INVALID_JSON = "{\"a\": 1,";
    static final Duration TIMEOUT = Duration.ofSeconds(20);

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final PostgresExecutor executor = new PostgresExecutor();

    @BoundarySites("lowcoder-plugins/postgresPlugin/src/main/java/org/lowcoder/plugin/postgres/utils/PostgresResultParser.java#PostgresResultParser.parseValue#readTree#1")
    @Test
    public void rowsAsPinned() throws SQLException {
        Object report = report(cells());
        String actual = ConfigBinding.write(report);
        System.out.println("[PostgresResultContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** A {@code json} cell whose text does not parse: the parser's {@code JsonProcessingException} fails the query. */
    @Test
    public void invalidJsonFailsTheQuery() throws SQLException {
        Map<String, Object> cells = new LinkedHashMap<>();
        cells.put("json", pg("json", INVALID_JSON));
        Object report = report(cells);
        System.out.println("[PostgresResultContractTest] invalid json: " + report);
        if (!report.equals(Map.of(QueryResults.ERROR_KEY,
                "org.lowcoder.sdk.exception.PluginException: QUERY_EXECUTION_ERROR QUERY_EXECUTION_ERROR"))) {
            throw new AssertionError("an invalid json column must fail the query, got " + report);
        }
    }

    private Object report(Map<String, Object> cells) {
        List<Column> columns = new ArrayList<>();
        cells.keySet().forEach(name -> columns.add(new Column(name, typeName(name))));
        Connection connection = FakeJdbc.connection(List.of(new Rows(FakeJdbc.resultSet(columns, List.of(new ArrayList<>(cells.values()))))));
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query(QUERY).requestParams(Map.of()).build();
        try {
            QueryExecutionResult result = executor.executeQuery(wrap(connection), context).block(TIMEOUT);
            return result == null ? null : QueryResults.report(result);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    /** The Postgres type name of a column: its name up to the first {@code $}. */
    private static String typeName(String column) {
        return column.contains("$") ? column.substring(0, column.indexOf('$')) : column;
    }

    /** One cell per Postgres type the parser switches on, and the leaf types; {@code $} separates variants. */
    static Map<String, Object> cells() throws SQLException {
        Map<String, Object> cells = new LinkedHashMap<>();
        cells.put("json", pg("json", RepresentativeInput.TEXT));
        cells.put("jsonb", pg("jsonb", "{\"zeta\": 1, \"alpha\": [1.50, 3000000001, null]}"));
        cells.put("json$array", pg("json", "[1, \"two\", {\"three\": 3.0}]"));
        cells.put("json$scalar", pg("json", "\"žluť\""));
        cells.put("json$null", null);
        cells.put("_int4", new SqlArray("int4", Types.INTEGER, new Integer[] {1, null, 3}));
        cells.put("_text", new SqlArray("text", Types.VARCHAR, new String[] {"a", "žluť"}));
        cells.put("_numeric", new SqlArray("numeric", Types.NUMERIC, new BigDecimal[] {new BigDecimal("1.50")}));
        cells.put("citext", pg("citext", "Case Insensitive"));
        cells.put("timestamptz", OffsetDateTime.parse("2024-02-29T13:14:15.123+05:30"));
        cells.put("timestamp", Timestamp.valueOf("2024-02-29 13:14:15.123"));
        cells.put("date", java.sql.Date.valueOf("2024-02-29"));
        cells.put("time", "13:14:15");
        cells.put("timetz", "13:14:15+02");
        cells.put("interval", new PGInterval("1 year 2 mons 3 days 04:05:06.5"));
        cells.put("uuid", UUID.fromString("123e4567-e89b-12d3-a456-426614174000"));
        cells.put("numeric", new BigDecimal("10.50"));
        cells.put("int8", Long.MAX_VALUE);
        cells.put("float8", 0.1d);
        cells.put("bool", true);
        cells.put("bytea", new byte[] {0, 1, (byte) 0xFF});
        return cells;
    }

    static PGobject pg(String type, String value) throws SQLException {
        PGobject object = new PGobject();
        object.setType(type);
        object.setValue(value);
        return object;
    }

    /** A data source that is never started: it reports running with an idle pool and hands out {@code connection}. */
    static HikariPerfWrapper wrap(Connection connection) {
        HikariPoolMXBean pool = (HikariPoolMXBean) Proxy.newProxyInstance(HikariPoolMXBean.class.getClassLoader(),
                new Class<?>[] {HikariPoolMXBean.class}, (self, method, args) -> 0);
        HikariDataSource dataSource = new HikariDataSource() {
            @Override
            public Connection getConnection() {
                return connection;
            }

            @Override
            public HikariPoolMXBean getHikariPoolMXBean() {
                return pool;
            }

            @Override
            public boolean isRunning() {
                return true;
            }
        };
        return HikariPerfWrapper.wrap(dataSource, () -> 0, () -> 0, () -> 0, () -> 0, null, null);
    }
}

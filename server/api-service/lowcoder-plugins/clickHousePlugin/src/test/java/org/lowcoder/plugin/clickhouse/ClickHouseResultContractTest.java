package org.lowcoder.plugin.clickhouse;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.Test;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.Rows;
import org.lowcoder.sdk.contract.FakeJdbc.StatementResult;
import org.lowcoder.sdk.contract.FakeJdbc.UpdateCount;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Connection;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * The ClickHouse row of the §4.6 producer table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, task T8.2):
 * {@code ClickHouseQueryExecutor.executeQuery} on a data source whose connection ({@link FakeJdbc}) yields each case of
 * {@link #CASES}, as a prepared statement and as plain SQL. Rows come from {@code ResultSetParser.parseRows} (a repeated
 * column label keeps the last value; the duplicate hint is not written), an update from a {@code LinkedHashMap} of
 * {@code affectedRows}, never below 0. Each case's report ({@link QueryResults#report}) is pinned in {@value #REPORT}.
 *
 * <p>Limits: the values are {@link FakeJdbc}'s, not the ClickHouse driver's (whose {@code UInt64} is a
 * {@link BigInteger}, given here by hand).
 */
public class ClickHouseResultContractTest {

    static final String REPORT = "query-results/ClickHouseQueryExecutor.results.json";
    static final String QUERY = "select * from items";
    static final String PREPARED = "prepared";
    static final String PLAIN = "plain";
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Supplier<List<StatementResult>>> CASES = cases();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final ClickHouseQueryExecutor executor = new ClickHouseQueryExecutor(new ConfigCenterForTest());

    @Test
    public void resultsAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        CASES.forEach((name, results) -> {
            Map<String, Object> modes = new LinkedHashMap<>();
            modes.put(PREPARED, report(results.get(), false));
            modes.put(PLAIN, report(results.get(), true));
            report.put(name, modes);
        });
        String actual = ConfigBinding.write(report);
        System.out.println("[ClickHouseResultContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private Object report(List<StatementResult> results, boolean disablePreparedStatement) {
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder()
                .query(QUERY).requestParams(Map.of()).disablePreparedStatement(disablePreparedStatement).build();
        try {
            QueryExecutionResult result = executor.executeQuery(dataSource(FakeJdbc.connection(results)), context).block(TIMEOUT);
            return result == null ? null : QueryResults.report(result);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    /** A data source that is never started: it reports running and hands out {@code connection}. */
    static HikariDataSource dataSource(Connection connection) {
        return new HikariDataSource() {
            @Override
            public Connection getConnection() {
                return connection;
            }

            @Override
            public boolean isRunning() {
                return true;
            }
        };
    }

    private static Map<String, Supplier<List<StatementResult>>> cases() {
        List<Column> columns = List.of(new Column("id", "UInt64"), new Column("name", "String"), new Column("id", "Int32"),
                new Column("price", "Decimal(10, 2)"), new Column("day", "date"), new Column("tags", "Array(String)"));
        Map<String, Supplier<List<StatementResult>>> cases = new LinkedHashMap<>();
        cases.put("selectWithRepeatedLabel", () -> List.of(new Rows(FakeJdbc.resultSet(columns, List.of(
                Arrays.asList(new BigInteger("18446744073709551615"), "žluť", 7, new BigDecimal("1.50"),
                        java.sql.Date.valueOf("2024-02-29"), List.of("a", "b")))))));
        cases.put("insert", () -> List.of(new UpdateCount(3, null)));
        cases.put("noUpdateCount", () -> List.of(new UpdateCount(FakeJdbc.NO_UPDATE_COUNT, null)));
        return cases;
    }
}

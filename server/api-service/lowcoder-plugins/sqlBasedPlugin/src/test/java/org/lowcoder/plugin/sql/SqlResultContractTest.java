package org.lowcoder.plugin.sql;

import org.junit.Test;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.Column;
import org.lowcoder.sdk.contract.FakeJdbc.Rows;
import org.lowcoder.sdk.contract.FakeJdbc.StatementResult;
import org.lowcoder.sdk.contract.FakeJdbc.UpdateCount;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.ResultSet;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * The SQL plugins' row of the §4.6 producer table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, task T8.2):
 * {@link GeneralSqlExecutor#execute} on a connection ({@link FakeJdbc}) whose statement yields each case of
 * {@link #CASES} (fresh for each run), run once as a prepared statement and once as plain SQL. The value put into
 * {@code QueryExecutionResult.data} is one entry per statement result, unwrapped when there is one: rows parsed by
 * {@code ResultSetParser} as {@code List<Map>}, or a {@code HashMap} of {@code affectedRows} and, when the driver
 * returns any, {@code generatedKeys} as {@code getObject} gives them; a result of one {@code GENERATED_KEYS} row whose
 * value is null is dropped. Each case's report ({@link QueryResults#report}) is pinned in {@value #REPORT}; the leaf
 * classes a driver can return are pinned by {@code ResultSetParserContractTest} in {@code lowcoder-sdk}.
 *
 * <p>Limits: the statement results come from {@link FakeJdbc}, not a driver; GUI commands and the single-row
 * update/delete check are not run.
 */
public class SqlResultContractTest {

    static final String REPORT = "query-results/GeneralSqlExecutor.results.json";
    static final String QUERY = "select * from items";
    static final String PREPARED = "prepared";
    static final String PLAIN = "plain";
    static final String GENERATED_KEYS = "GENERATED_KEYS";
    static final List<Column> ITEM_COLUMNS = List.of(new Column("zeta", "VARCHAR"), new Column("id", "BIGINT"),
            new Column("price", "DECIMAL"), new Column("ratio", "DOUBLE"), new Column("active", "BIT"),
            new Column("created", "datetime"), new Column("note", "VARCHAR"));
    static final Map<String, Supplier<List<StatementResult>>> CASES = cases();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

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
        System.out.println("[SqlResultContractTest] " + CASES.size() + " cases\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private Object report(List<StatementResult> results, boolean disablePreparedStatement) {
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder()
                .query(QUERY).requestParams(Map.of()).disablePreparedStatement(disablePreparedStatement).build();
        try {
            return QueryResults.report(new GeneralSqlExecutor().execute(FakeJdbc.connection(results), context));
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    private static ResultSet items() {
        return FakeJdbc.resultSet(ITEM_COLUMNS, List.of(
                Arrays.asList("first", 3_000_000_001L, new BigDecimal("10.50"), 0.1, true,
                        java.sql.Timestamp.valueOf("2024-02-29 13:14:15"), "žluť"),
                Arrays.asList("second", 2L, new BigDecimal("1E+3"), 1e20, false, null, null)));
    }

    private static ResultSet keys(Object... keys) {
        return FakeJdbc.resultSet(List.of(new Column(GENERATED_KEYS, "BIGINT")), Arrays.stream(keys).map(List::of).toList());
    }

    private static Map<String, Supplier<List<StatementResult>>> cases() {
        Map<String, Supplier<List<StatementResult>>> cases = new LinkedHashMap<>();
        cases.put("select", () -> List.of(new Rows(items())));
        cases.put("selectEmpty", () -> List.of(new Rows(FakeJdbc.resultSet(ITEM_COLUMNS, List.of()))));
        cases.put("insertWithKeys", () -> List.of(new UpdateCount(2, keys(7L, BigInteger.valueOf(Long.MAX_VALUE).add(BigInteger.ONE)))));
        cases.put("updateWithoutKeys", () -> List.of(new UpdateCount(1, keys())));
        cases.put("updateNoKeySet", () -> List.of(new UpdateCount(0, null)));
        cases.put("selectThenUpdate", () -> List.of(new Rows(items()), new UpdateCount(1, null)));
        cases.put("nullGeneratedKeyRowDropped", () -> List.of(
                new Rows(FakeJdbc.resultSet(List.of(new Column(GENERATED_KEYS, "BIGINT")), List.of(Arrays.asList((Object) null)))),
                new UpdateCount(1, null)));
        return cases;
    }
}

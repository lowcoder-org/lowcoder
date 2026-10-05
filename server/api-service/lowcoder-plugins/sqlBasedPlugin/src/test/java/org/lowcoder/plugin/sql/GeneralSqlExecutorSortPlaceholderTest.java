package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.lowcoder.plugin.sql.H2SqlTestSupport.assertPluginError;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit SB-2 (task L5-1): the {@code {{x}}} parameter whose value is a map with a {@code sort} key is rewritten into
 * {@code ASC}/{@code DESC} in the SQL text (a placeholder cannot bind a keyword). Run on H2 through the executor of
 * PostgreSQL ({@link H2SqlTestSupport.MutableParamsGeneralSqlExecutor}); the default executor is pinned to defect D1.
 */
public class GeneralSqlExecutorSortPlaceholderTest {

    static final String TABLE = "sort_items";
    static final String SORT_KEY = "sort";

    private static final String URL = H2SqlTestSupport.newUrl("sort");
    private static Connection connection;
    private final GeneralSqlExecutor postgresStyle = new H2SqlTestSupport.MutableParamsGeneralSqlExecutor();

    @BeforeAll
    static void open() {
        connection = H2SqlTestSupport.open(URL);
    }

    @AfterAll
    static void close() throws Exception {
        connection.close();
    }

    @BeforeEach
    void freshTable() {
        H2SqlTestSupport.run(connection, "drop table if exists " + TABLE,
                "create table " + TABLE + " (id int, grp int)",
                "insert into " + TABLE + " values (1, 1), (2, 1), (3, 2), (4, 2)");
    }

    private QueryExecutionResult run(GeneralSqlExecutor executor, String sql, Map<String, Object> params) {
        return executor.execute(connection, SqlBasedQueryExecutionContext.builder().query(sql).requestParams(params).build());
    }

    private List<Object> ids(QueryExecutionResult result) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) result.getData();
        return rows.stream().map(row -> row.get("id")).toList();
    }

    @Test
    public void sortDescOrdersRowsDescendingAndIsCaseInsensitive() {
        List<Object> ids = ids(run(postgresStyle, "select id from " + TABLE + " order by id {{dir}}", Map.of("dir", Map.of(SORT_KEY, "desc"))));
        assertEquals(List.of(4, 3, 2, 1), ids);
        List<Object> upper = ids(run(postgresStyle, "select id from " + TABLE + " order by id {{dir}}", Map.of("dir", Map.of(SORT_KEY, "DESC"))));
        assertEquals(List.of(4, 3, 2, 1), upper);
        System.out.println("[GeneralSqlExecutorSortPlaceholderTest] desc and DESC -> " + ids);
    }

    @Test
    public void invalidSortValueFallsBackToAscAndTheTableSurvives() {
        List<Object> ids = ids(run(postgresStyle, "select id from " + TABLE + " order by id {{dir}}",
                Map.of("dir", Map.of(SORT_KEY, "x; drop table " + TABLE))));
        assertEquals(List.of(1, 2, 3, 4), ids);
        assertEquals(4L, H2SqlTestSupport.scalar(connection, "select count(*) from " + TABLE), "the table must still hold its rows");
        System.out.println("[GeneralSqlExecutorSortPlaceholderTest] injected sort value ran as ASC: " + ids);
    }

    @Test
    public void sortMapAfterAnotherParameterReplacesTheRightPlaceholder() {
        List<Object> ids = ids(run(postgresStyle, "select id from " + TABLE + " where id > {{min}} order by id {{dir}}",
                Map.of("min", 1, "dir", Map.of(SORT_KEY, "desc"))));
        assertEquals(List.of(4, 3, 2), ids);
        System.out.println("[GeneralSqlExecutorSortPlaceholderTest] bind then sort -> " + ids);
    }

    @Test
    public void sortMapBeforeAnotherParameterKeepsTheOtherBind() {
        List<Object> ids = ids(run(postgresStyle, "select id from " + TABLE + " order by id {{dir}}, grp limit {{n}}",
                Map.of("n", 2, "dir", Map.of(SORT_KEY, "desc"))));
        assertEquals(List.of(4, 3), ids);
        System.out.println("[GeneralSqlExecutorSortPlaceholderTest] sort then bind -> " + ids);
    }

    @Test
    public void twoSortMapsAreBothRewritten() {
        List<Object> ids = ids(run(postgresStyle, "select id from " + TABLE + " order by grp {{d1}}, id {{d2}}",
                Map.of("d1", Map.of(SORT_KEY, "desc"), "d2", Map.of(SORT_KEY, "asc"))));
        assertEquals(List.of(3, 4, 1, 2), ids);
        System.out.println("[GeneralSqlExecutorSortPlaceholderTest] two sort maps -> " + ids);
    }

    /**
     * Pins defect D1: the default {@code getPreparedStatementInput} (MySQL, Oracle, MSSQL) hands {@code Stream.toList()}
     * to the rewrite, which calls {@code remove} on it: {@code UnsupportedOperationException}, wrapped as
     * QUERY_EXECUTION_ERROR with a null message argument. A fix changes this test on purpose. The same executor still runs
     * a query without a sort map.
     */
    @Test
    public void defaultExecutorCannotRewriteTheSortPlaceholder() {
        GeneralSqlExecutor defaultExecutor = new GeneralSqlExecutor();
        Throwable thrown = assertPluginError(QUERY_EXECUTION_ERROR, H2SqlTestSupport.QUERY_ERROR_KEY,
                () -> run(defaultExecutor, "select id from " + TABLE + " order by id {{dir}}", Map.of("dir", Map.of(SORT_KEY, "desc"))));
        assertNull(((org.lowcoder.sdk.exception.PluginException) thrown).getArgs()[0], "D1: UnsupportedOperationException has no message");
        assertEquals(List.of(2, 3, 4), ids(run(defaultExecutor, "select id from " + TABLE + " where id > {{min}} order by id", Map.of("min", 1))));
        System.out.println("[GeneralSqlExecutorSortPlaceholderTest] D1 pinned: default executor fails on a sort map, runs without one");
    }
}

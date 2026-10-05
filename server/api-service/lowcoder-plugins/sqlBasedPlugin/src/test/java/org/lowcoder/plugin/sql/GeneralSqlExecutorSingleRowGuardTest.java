package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.UpdateOrDeleteSingleCommandRenderResult;

import java.sql.Connection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.lowcoder.plugin.sql.H2SqlTestSupport.assertPluginError;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

/**
 * Unit SB-3 (task L5-1): a GUI update or delete with {@code allowMultiModify=false} first runs a {@code count} select
 * with the same filter and refuses to run when more than one row matches. GUI commands are the sdk PostgreSQL ones, built
 * through {@link SqlBasedQueryExecutor#buildQueryExecutionContext}; rows are verified with plain JDBC.
 */
public class GeneralSqlExecutorSingleRowGuardTest {

    static final String TABLE = "people";
    static final String MORE_THAN_ONE_KEY = "AFFECT_MORE_THAN_ONE_ROWS_FOR_SINGLE_COMMAND";
    static final String COUNT_KEY = "FAIL_TO_GET_AFFECTED_ROW_COUNT";
    static final int CHANGED = 9;
    static final int ORIGINAL = 0;

    private static final String URL = H2SqlTestSupport.newUrl("guard");
    private static Connection connection;
    private final GeneralSqlExecutor generalSqlExecutor = new GeneralSqlExecutor();
    private final H2SqlTestSupport.H2Executor executor = new H2SqlTestSupport.H2Executor(generalSqlExecutor);
    private final H2SqlTestSupport.H2Config datasource = new H2SqlTestSupport.H2Config("localhost", "db", false, null);

    @BeforeAll
    static void open() {
        connection = H2SqlTestSupport.open(URL);
    }

    @AfterAll
    static void close() throws Exception {
        connection.close();
    }

    /**
     * The changed column is numeric on purpose: the PostgreSQL command renders a string value in dollar quotes, which H2 does
     * not parse (a string update belongs to the PostgreSQL container tests, PG-6). Rows: id 1 and 2 in group 1, id 3 in group 2. */
    @BeforeEach
    void freshTable() {
        H2SqlTestSupport.run(connection, "drop table if exists " + TABLE,
                "create table " + TABLE + " (id int, grp int, marker int)",
                "insert into " + TABLE + " values (1, 1, " + ORIGINAL + "), (2, 1, " + ORIGINAL + "), (3, 2, " + ORIGINAL + ")");
    }

    private static Map<String, Object> filterOn(String column, boolean allowMultiModify) {
        return Map.of("table", TABLE, "allowMultiModify", allowMultiModify,
                "filterBy", List.of(Map.of("column", column, "condition", "=", "value", "{{key}}")));
    }

    private static Map<String, Object> updateDetail(String column, boolean allowMultiModify) {
        Map<String, Object> detail = new java.util.HashMap<>(filterOn(column, allowMultiModify));
        detail.put("changeSet", Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "marker", "value", CHANGED))));
        return detail;
    }

    private QueryExecutionResult run(String type, Map<String, Object> detail, int key) {
        SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(datasource,
                H2SqlTestSupport.guiConfig(type, detail), Map.of("key", key), null);
        return generalSqlExecutor.execute(connection, context);
    }

    private long count(String where) {
        return (Long) H2SqlTestSupport.scalar(connection, "select count(*) from " + TABLE + " where " + where);
    }

    @Test
    public void updateMatchingTwoRowsIsRefusedAndChangesNothing() {
        assertPluginError(QUERY_EXECUTION_ERROR, MORE_THAN_ONE_KEY, () -> run(H2SqlTestSupport.GUI_UPDATE, updateDetail("grp", false), 1));
        assertEquals(3L, count("marker = " + ORIGINAL), "no row may change when the guard refuses");
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] update of 2 matching rows refused, 3 rows unchanged");
    }

    @Test
    public void updateMatchingOneRowChangesExactlyThatRow() {
        QueryExecutionResult result = run(H2SqlTestSupport.GUI_UPDATE, updateDetail("grp", false), 2);
        assertEquals(Map.of("affectedRows", 1), result.getData());
        assertEquals(1L, count("marker = " + CHANGED + " and id = 3"));
        assertEquals(1L, count("marker = " + CHANGED));
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] update of 1 matching row: " + result.getData());
    }

    @Test
    public void deleteMatchingTwoRowsIsRefusedAndChangesNothing() {
        assertPluginError(QUERY_EXECUTION_ERROR, MORE_THAN_ONE_KEY, () -> run(H2SqlTestSupport.GUI_DELETE, filterOn("grp", false), 1));
        assertEquals(3L, count("1 = 1"), "no row may be deleted when the guard refuses");
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] delete of 2 matching rows refused, 3 rows remain");
    }

    @Test
    public void deleteMatchingOneRowDeletesExactlyThatRow() {
        QueryExecutionResult result = run(H2SqlTestSupport.GUI_DELETE, filterOn("grp", false), 2);
        assertEquals(Map.of("affectedRows", 1), result.getData());
        assertEquals(2L, count("1 = 1"));
        assertEquals(0L, count("id = 3"));
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] delete of 1 matching row: " + result.getData());
    }

    @Test
    public void allowMultiModifyUpdatesEveryMatchingRowWithoutAGuard() {
        QueryExecutionResult result = run(H2SqlTestSupport.GUI_UPDATE, updateDetail("grp", true), 1);
        assertEquals(Map.of("affectedRows", 2), result.getData());
        assertEquals(2L, count("marker = " + CHANGED));
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] allowMultiModify update: " + result.getData());
    }

    @Test
    public void allowMultiModifyDeletesEveryMatchingRowWithoutAGuard() {
        QueryExecutionResult result = run(H2SqlTestSupport.GUI_DELETE, filterOn("grp", true), 1);
        assertEquals(Map.of("affectedRows", 2), result.getData());
        assertEquals(1L, count("1 = 1"));
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] allowMultiModify delete: " + result.getData());
    }

    @Test
    public void nonNumericCountIsFailToGetAffectedRowCountAndTheStatementDoesNotRun() {
        GuiSqlCommand command = new GuiSqlCommand() {
            @Override
            public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {
                return new UpdateOrDeleteSingleCommandRenderResult("select 'x' as count", Collections.emptyList(),
                        "update " + TABLE + " set marker = " + CHANGED, Collections.emptyList());
            }

            @Override
            public boolean isInsertCommand() {
                return false;
            }

            @Override
            public Set<String> extractMustacheKeys() {
                return Set.of();
            }
        };
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().guiSqlCommand(command).requestParams(Map.of()).build();
        assertPluginError(QUERY_EXECUTION_ERROR, COUNT_KEY, () -> generalSqlExecutor.execute(connection, context));
        assertEquals(3L, count("marker = " + ORIGINAL), "the update must not run on an unreadable count");
        System.out.println("[GeneralSqlExecutorSingleRowGuardTest] text count refused, rows unchanged");
    }
}

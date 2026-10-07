package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins a production defect found in L5-1 (plan section 9, row "SqlQueryConfig.getSql() throws a NullPointerException
 * without a sql key"; owner decision D-6: the fix is deferred). A fix changes that test on purpose.
 * <p>
 * Fixed since: the row "removeQueryComments removes -- comments only" (BF-092): a block comment is removed with the
 * mustache in it ({@link #mustacheInsideABlockCommentIsRemovedWithTheCommentAndTheQueryRunsBF092}).
 */
public class SqlBasedQueryExecutorDefectPinTest {

    static final String BLOCK_COMMENT_SQL = "select 1 as one /* {{y}} */";
    static final String WITHOUT_BLOCK_COMMENT_SQL = "select 1 as one";

    private final H2SqlTestSupport.H2Executor executor = new H2SqlTestSupport.H2Executor(new GeneralSqlExecutor());
    private final H2SqlTestSupport.H2Config datasource = new H2SqlTestSupport.H2Config("localhost", "db", false, null);

    /**
     * BF-092 (was pinned): {@code removeQueryComments} removes the block comment with its mustache, so no placeholder is
     * left inside a comment for the bind of {@code y} to fail on (it failed as PREPARED_STATEMENT_BIND_PARAMETERS_ERROR),
     * and the query runs.
     */
    @Test
    public void mustacheInsideABlockCommentIsRemovedWithTheCommentAndTheQueryRunsBF092() throws Exception {
        SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(datasource,
                H2SqlTestSupport.sqlConfig(BLOCK_COMMENT_SQL), Map.of("y", 5), null);
        assertEquals(WITHOUT_BLOCK_COMMENT_SQL, context.getQuery(), "the block comment is removed");
        try (Connection connection = H2SqlTestSupport.open(H2SqlTestSupport.newUrl("blockcomment"))) {
            Object data = new GeneralSqlExecutor().execute(connection, context).getData();
            System.out.println("[SqlBasedQueryExecutorDefectPinTest] block comment removed, H2 answers " + data);
            assertEquals(List.of(Map.of("one", 1)), data);
        }
    }

    /** Pins the missing-sql defect: a SQL-mode config without a {@code sql} key is a NullPointerException, not SQL_EMPTY. */
    @Test
    public void configWithoutSqlKeyIsANullPointerExceptionNotSqlEmpty() {
        Map<String, Object> config = Map.of(H2SqlTestSupport.MODE_KEY, H2SqlTestSupport.SQL_MODE);
        NullPointerException thrown = assertThrows(NullPointerException.class,
                () -> executor.buildQueryExecutionContext(datasource, config, Map.of(), null));
        assertTrue(thrown.getMessage().contains("sql"), thrown.getMessage());
        System.out.println("[SqlBasedQueryExecutorDefectPinTest] no sql key: " + thrown.getMessage());
    }
}

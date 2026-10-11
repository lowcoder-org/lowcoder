package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.sql.Connection;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.PREPARED_STATEMENT_BIND_PARAMETERS_ERROR;

/**
 * Pins two production defects found in L5-1 (plan section 9, rows "removeQueryComments removes -- comments only" and
 * "SqlQueryConfig.getSql() throws a NullPointerException without a sql key"; owner decision D-6: the fixes are deferred).
 * A fix changes these tests on purpose.
 */
public class SqlBasedQueryExecutorDefectPinTest {

    static final String BLOCK_COMMENT_SQL = "select 1 as one /* {{y}} */";

    private final H2SqlTestSupport.H2Executor executor = new H2SqlTestSupport.H2Executor(new GeneralSqlExecutor());
    private final H2SqlTestSupport.H2Config datasource = new H2SqlTestSupport.H2Config("localhost", "db", false, null);

    /**
     * Pins the block-comment defect: {@code removeQueryComments} strips {@code --} comments only, so the query keeps the
     * block comment with its mustache; the prepared statement then turns {@code {{y}}} into a placeholder inside the
     * comment, which the database does not count, and the bind of {@code y} fails as PREPARED_STATEMENT_BIND_PARAMETERS_ERROR.
     */
    @Test
    public void mustacheInsideABlockCommentIsKeptAndTheBindFails() throws Exception {
        SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(datasource,
                H2SqlTestSupport.sqlConfig(BLOCK_COMMENT_SQL), Map.of("y", 5), null);
        assertEquals(BLOCK_COMMENT_SQL, context.getQuery(), "the block comment is not removed");
        try (Connection connection = H2SqlTestSupport.open(H2SqlTestSupport.newUrl("blockcomment"))) {
            PluginException thrown = assertThrows(PluginException.class, () -> new GeneralSqlExecutor().execute(connection, context));
            assertEquals(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, thrown.getError());
            System.out.println("[SqlBasedQueryExecutorDefectPinTest] block comment kept, bind failed: " + thrown.getMessage());
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

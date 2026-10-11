package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FakeJdbc;
import org.lowcoder.sdk.contract.FakeJdbc.UpdateCount;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.RenderValues;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Group {@code downstream-render}, its {@code sqlBasedPlugin} row (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5):
 * {@link GeneralSqlExecutor#execute} runs {@value #QUERY} as a prepared statement with each value of
 * {@link RenderValues} as {@code v}, and {@code bindParam} binds it; a list or a map is bound as the text the production
 * mapper writes for it ({@code toJson}). The connection ({@link FakeJdbc}) records every {@code set...} call, and the
 * <em>exact text</em> of those calls is pinned, one line per value ({@link GoldenJson#assertText}), in {@value #FIXTURE}.
 *
 * <p>Limits: the calls are recorded, not sent to a driver; a null asks the driver for the parameter type first, which
 * {@link FakeJdbc} refuses, so the fallback {@code setNull(i, Types.NULL)} is what is pinned.
 */
public class SqlBindContractTest {

    static final String FIXTURE = "downstream-render/GeneralSqlExecutor.binds.txt";
    static final String QUERY = "update items set v = {{v}} where id = 1";
    static final String VALUE_PARAM = "v";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites("lowcoder-plugins/sqlBasedPlugin/src/main/java/org/lowcoder/plugin/sql/GeneralSqlExecutor.java#GeneralSqlExecutor.bindParam#toJson#1")
    @Test
    public void bindsAsSent() {
        StringBuilder text = new StringBuilder();
        RenderValues.values().forEach((name, value) -> text.append(name).append(SEPARATOR).append(binds(value)).append(NEWLINE));
        System.out.println("[SqlBindContractTest] " + FIXTURE + "\n" + text);
        GOLDEN.assertText(FIXTURE, text.toString());
    }

    /** The {@code set...} calls the statement got for {@code value}, or the error in their place. */
    private static String binds(Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put(VALUE_PARAM, value);
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query(QUERY).requestParams(params).build();
        List<String> binds = new ArrayList<>();
        try {
            new GeneralSqlExecutor().execute(FakeJdbc.connection(List.of(new UpdateCount(1, null)), binds), context);
            return String.join(SEPARATOR, binds);
        } catch (RuntimeException e) {
            return "ERROR " + ConfigBinding.errorText(e);
        }
    }
}

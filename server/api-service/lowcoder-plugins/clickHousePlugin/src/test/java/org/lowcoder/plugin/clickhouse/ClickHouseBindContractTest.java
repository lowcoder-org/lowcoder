package org.lowcoder.plugin.clickhouse;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
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
 * Group {@code downstream-render}, its {@code clickHousePlugin} row (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5):
 * {@code ClickHouseQueryExecutor.executeQuery} runs {@value #QUERY} as a prepared statement with each value of
 * {@link RenderValues} as {@code v}, and {@code bindPreparedStatementParams} binds it; a list or a map is bound as the
 * text the production mapper writes for it ({@code toJson}). The connection ({@link FakeJdbc}) records every
 * {@code set...} call, and the <em>exact text</em> of those calls is pinned, one line per value
 * ({@link GoldenJson#assertText}), in {@value #FIXTURE}.
 *
 * <p>Limits: the calls are recorded, not sent to the ClickHouse driver.
 */
public class ClickHouseBindContractTest {

    static final String FIXTURE = "downstream-render/ClickHouseQueryExecutor.binds.txt";
    static final String QUERY = "alter table items update v = {{v}} where id = 1";
    static final String VALUE_PARAM = "v";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final ClickHouseQueryExecutor executor = new ClickHouseQueryExecutor(new ConfigCenterForTest());

    @BoundarySites("lowcoder-plugins/clickHousePlugin/src/main/java/org/lowcoder/plugin/clickhouse/ClickHouseQueryExecutor.java#ClickHouseQueryExecutor.bindPreparedStatementParams#toJson#1")
    @Test
    public void bindsAsSent() {
        StringBuilder text = new StringBuilder();
        RenderValues.values().forEach((name, value) -> text.append(name).append(SEPARATOR).append(binds(value)).append(NEWLINE));
        System.out.println("[ClickHouseBindContractTest] " + FIXTURE + "\n" + text);
        GOLDEN.assertText(FIXTURE, text.toString());
    }

    /** The {@code set...} calls the statement got for {@code value}, or the error in their place. */
    private String binds(Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put(VALUE_PARAM, value);
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder().query(QUERY).requestParams(params).build();
        List<String> binds = new ArrayList<>();
        try {
            executor.executeQuery(ClickHouseResultContractTest.dataSource(FakeJdbc.connection(List.of(new UpdateCount(1, null)), binds)), context)
                    .block(ClickHouseResultContractTest.TIMEOUT);
            return String.join(SEPARATOR, binds);
        } catch (RuntimeException e) {
            return "ERROR " + ConfigBinding.errorText(e);
        }
    }
}

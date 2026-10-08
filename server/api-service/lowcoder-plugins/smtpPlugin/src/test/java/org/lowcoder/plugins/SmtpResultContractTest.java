package org.lowcoder.plugins;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * The SMTP row of the §4.6 producer table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, task T8.2): a sent mail is
 * {@code QueryExecutionResult.success(null)} ({@code SmtpPlugin.java:227}), so the result has no {@code data}
 * member at all ({@code @JsonInclude(NON_NULL)}). Pinned in {@value #REPORT}.
 *
 * <p>Limits: no mail is sent; the test builds the value the anchored line builds.
 */
public class SmtpResultContractTest {

    static final String REPORT = "query-results/SmtpPlugin.result.json";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    public void sentMailResultAsPinned() {
        String actual = ConfigBinding.write(QueryResults.report(QueryExecutionResult.success(null)));
        System.out.println("[SmtpResultContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }
}

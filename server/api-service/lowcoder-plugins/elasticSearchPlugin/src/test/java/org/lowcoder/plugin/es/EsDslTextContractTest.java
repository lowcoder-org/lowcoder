package org.lowcoder.plugin.es;

import org.junit.Test;
import org.lowcoder.plugin.es.model.EsQueryExecutionContext;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.RepresentativeInput;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Group {@code tree-text}, its {@code elasticSearchPlugin} row (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.4):
 * {@code EsQueryExecutor.buildQueryExecutionContext} renders the query DSL with {@code renderMustacheJsonString},
 * whose text is {@code JsonNode#toString} (E13), and sends that text as the request entity. The DSL of each template
 * of {@link #DSLS} rendered with {@link #PARAMS} is pinned exactly, one line per template, in {@value #REPORT}.
 *
 * <p>Limits: the DSL is read from the built context; sending it is the low-level REST client's.
 */
public class EsDslTextContractTest {

    static final String REPORT = "tree-text/EsQueryExecutor.dsl.txt";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final Map<String, Object> PARAMS = params();
    static final Map<String, String> DSLS = dsls();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final EsQueryExecutor executor = new EsQueryExecutor();

    @BoundarySites("lowcoder-plugins/elasticSearchPlugin/src/main/java/org/lowcoder/plugin/es/EsQueryExecutor.java#EsQueryExecutor.buildQueryExecutionContext#renderMustacheJsonString#1")
    @Test
    public void dslAsRendered() {
        StringBuilder text = new StringBuilder();
        DSLS.forEach((name, dsl) -> {
            String rendered;
            try {
                EsQueryExecutionContext context = executor.buildQueryExecutionContext(null,
                        Map.of("httpMethod", "POST", "path", "logs/_search", "dsl", dsl), PARAMS, null);
                rendered = context.getDsl();
            } catch (RuntimeException e) {
                rendered = "ERROR " + ConfigBinding.errorText(e);
            }
            text.append(name).append(SEPARATOR).append(rendered).append(NEWLINE);
        });
        System.out.println("[EsDslTextContractTest]\n" + text);
        GOLDEN.assertText(REPORT, text.toString());
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("size", 10);
        params.put("from", 3_000_000_001L);
        params.put("q", "kůň \"quoted\" \\");
        Map<String, Object> range = new LinkedHashMap<>();
        range.put("gte", new BigDecimal("1.50"));
        range.put("lt", new BigInteger("9223372036854775808"));
        range.put("boost", 0.1);
        params.put("range", range);
        return params;
    }

    private static Map<String, String> dsls() {
        Map<String, String> dsls = new LinkedHashMap<>();
        dsls.put("representativeInput", RepresentativeInput.TEXT.trim());
        dsls.put("search", "{\"size\": {{size}}, \"from\": {{from}}, \"query\": {\"match\": {\"text\": \"{{q}}\"}}, \"range\": {\"price\": {{range}}}, \"min_score\": 1.50}");
        dsls.put("nonJson", "size={{size}}");
        return dsls;
    }
}

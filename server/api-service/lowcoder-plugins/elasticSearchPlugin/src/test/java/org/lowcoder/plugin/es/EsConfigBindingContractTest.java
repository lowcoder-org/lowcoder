package org.lowcoder.plugin.es;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The {@code elasticSearchPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task
 * T8.1), through the real entry points: {@code EsConnector.resolveConfig} for {@code EsDatasourceConfig}, and
 * {@code EsQueryExecutor.buildQueryExecutionContext} for {@code EsQueryConfig} (§4.7: {@code EsQueryExecutor.java:41}).
 * The query config is not kept, so its report pins the execution context built from it: the HTTP method bound by name,
 * and the path and DSL rendered with {@link #REQUEST_PARAMS}.
 */
public class EsConfigBindingContractTest {

    /** The request parameters the query config is rendered with: a string, and text with a quote and non-ASCII. */
    static final Map<String, Object> REQUEST_PARAMS = requestParams();

    /** {@code resolveConfig} does not read the common config. */
    static final CommonConfig NO_COMMON_CONFIG = null;

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/elasticSearchPlugin/src/main/java/org/lowcoder/plugin/es/EsConnector.java#EsConnector.resolveConfig#toJson#1",
            "lowcoder-plugins/elasticSearchPlugin/src/main/java/org/lowcoder/plugin/es/EsConnector.java#EsConnector.resolveConfig#fromJson#1"})
    @Test
    public void datasourceConfig() {
        EsConnector connector = new EsConnector(new ConfigCenterForTest(), NO_COMMON_CONFIG);
        ConfigBinding.assertBinding(GOLDEN, "config-binding/EsDatasourceConfig.input.json", "config-binding/EsDatasourceConfig.json",
                Map.of("EsConnector.resolveConfig", connector::resolveConfig));
    }

    @BoundarySites({
            "lowcoder-plugins/elasticSearchPlugin/src/main/java/org/lowcoder/plugin/es/EsQueryExecutor.java#EsQueryExecutor.buildQueryExecutionContext#toJson#1",
            "lowcoder-plugins/elasticSearchPlugin/src/main/java/org/lowcoder/plugin/es/EsQueryExecutor.java#EsQueryExecutor.buildQueryExecutionContext#fromJson#1"})
    @Test
    public void queryConfig() {
        EsQueryExecutor executor = new EsQueryExecutor();
        ConfigBinding.assertBinding(GOLDEN, "config-binding/EsQueryConfig.input.json", "config-binding/EsQueryConfig.json",
                Map.of("EsQueryExecutor.buildQueryExecutionContext",
                        queryConfig -> executor.buildQueryExecutionContext(null, queryConfig, REQUEST_PARAMS, null)));
    }

    private static Map<String, Object> requestParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("index", "logs-2026");
        params.put("q", "kůň \"quoted\"");
        return params;
    }
}

package org.lowcoder.plugin.restapi;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.restapi.model.RestApiQueryConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code restApiPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code RestApiQueryConfig.from}, including the HTTP method by name and in lower
 * case. {@code ConfigBinding} applies each entry point to every form of the input fixture (canonical names, alias
 * or getter-derived names, scalars as strings, missing and empty values) and pins the bound state, the written
 * views and the errors in the report fixture.
 */
public class RestApiConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/model/RestApiQueryConfig.java#RestApiQueryConfig.from#toJson#1",
            "lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/model/RestApiQueryConfig.java#RestApiQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/RestApiQueryConfig.input.json", "config-binding/RestApiQueryConfig.json",
                Map.of("from", RestApiQueryConfig::from));
    }
}

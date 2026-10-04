package org.lowcoder.plugin.snowflake;

import org.junit.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code snowflakePlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code SnowflakeConnector.resolveConfig}, the SDK default that binds {@code
 * SnowflakeDatasourceConfig}, which has no creator annotation (C8-A7). {@code ConfigBinding} applies each entry
 * point to every form of the input fixture (canonical names, alias or getter-derived names, scalars as strings,
 * missing and empty values) and pins the bound state, the written views and the errors in the report fixture.
 */
public class SnowflakeConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/SnowflakeDatasourceConfig.input.json", "config-binding/SnowflakeDatasourceConfig.json",
                Map.of("SnowflakeConnector.resolveConfig", new SnowflakeConnector()::resolveConfig));
    }
}

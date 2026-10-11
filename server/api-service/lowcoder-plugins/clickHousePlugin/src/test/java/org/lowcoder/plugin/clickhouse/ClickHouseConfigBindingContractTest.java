package org.lowcoder.plugin.clickhouse;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.clickhouse.model.ClickHouseDatasourceConfig;
import org.lowcoder.plugin.clickhouse.model.ClickHouseQueryConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code clickHousePlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task
 * T8.1), through the real entry points: {@code ClickHouseDatasourceConfig.buildFrom}, which {@code
 * ClickHouseConnector.resolveConfig} delegates to, and {@code ClickHouseQueryConfig.from}. {@code ConfigBinding}
 * applies each entry point to every form of the input fixture (canonical names, alias or getter-derived names,
 * scalars as strings, missing and empty values) and pins the bound state, the written views and the errors in the
 * report fixture.
 */
public class ClickHouseConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/clickHousePlugin/src/main/java/org/lowcoder/plugin/clickhouse/model/ClickHouseDatasourceConfig.java#ClickHouseDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-plugins/clickHousePlugin/src/main/java/org/lowcoder/plugin/clickhouse/model/ClickHouseDatasourceConfig.java#ClickHouseDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/ClickHouseDatasourceConfig.input.json", "config-binding/ClickHouseDatasourceConfig.json",
                Map.of("buildFrom", ClickHouseDatasourceConfig::buildFrom));
    }

    @BoundarySites({
            "lowcoder-plugins/clickHousePlugin/src/main/java/org/lowcoder/plugin/clickhouse/model/ClickHouseQueryConfig.java#ClickHouseQueryConfig.from#toJson#1",
            "lowcoder-plugins/clickHousePlugin/src/main/java/org/lowcoder/plugin/clickhouse/model/ClickHouseQueryConfig.java#ClickHouseQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/ClickHouseQueryConfig.input.json", "config-binding/ClickHouseQueryConfig.json",
                Map.of("from", ClickHouseQueryConfig::from));
    }
}

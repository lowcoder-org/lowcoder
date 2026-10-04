package org.lowcoder.plugin.postgres;

import org.junit.Test;
import org.lowcoder.plugin.postgres.model.PostgresDatasourceConfig;
import org.lowcoder.plugin.postgres.model.PostgresQueryConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code postgresPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code PostgresDatasourceConfig.buildFrom}, {@code
 * PostgresConnector.resolveConfig} (the SDK default) and {@code PostgresQueryConfig.from}. {@code ConfigBinding}
 * applies each entry point to every form of the input fixture (canonical names, alias or getter-derived names,
 * scalars as strings, missing and empty values) and pins the bound state, the written views and the errors in the
 * report fixture.
 */
public class PostgresConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/postgresPlugin/src/main/java/org/lowcoder/plugin/postgres/model/PostgresDatasourceConfig.java#PostgresDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-plugins/postgresPlugin/src/main/java/org/lowcoder/plugin/postgres/model/PostgresDatasourceConfig.java#PostgresDatasourceConfig.buildFrom#fromJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/PostgresDatasourceConfig.input.json", "config-binding/PostgresDatasourceConfig.json",
                ConfigBinding.entryPoints("buildFrom", PostgresDatasourceConfig::buildFrom, "PostgresConnector.resolveConfig", new PostgresConnector()::resolveConfig));
    }

    @BoundarySites({
            "lowcoder-plugins/postgresPlugin/src/main/java/org/lowcoder/plugin/postgres/model/PostgresQueryConfig.java#PostgresQueryConfig.from#toJson#1",
            "lowcoder-plugins/postgresPlugin/src/main/java/org/lowcoder/plugin/postgres/model/PostgresQueryConfig.java#PostgresQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/PostgresQueryConfig.input.json", "config-binding/PostgresQueryConfig.json",
                Map.of("from", PostgresQueryConfig::from));
    }
}

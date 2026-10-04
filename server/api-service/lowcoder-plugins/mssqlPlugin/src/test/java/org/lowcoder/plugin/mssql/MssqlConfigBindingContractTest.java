package org.lowcoder.plugin.mssql;

import org.junit.Test;
import org.lowcoder.plugin.mssql.model.MssqlDatasourceConfig;
import org.lowcoder.plugin.mssql.model.MssqlQueryConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code mssqlPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code MssqlDatasourceConfig.buildFrom}, {@code MssqlConnector.resolveConfig} (the
 * SDK default, {@code DatasourceConnector.resolveConfig}) and {@code MssqlQueryConfig.from}. {@code ConfigBinding}
 * applies each entry point to every form of the input fixture (canonical names, alias or getter-derived names,
 * scalars as strings, missing and empty values) and pins the bound state, the written views and the errors in the
 * report fixture.
 */
public class MssqlConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/mssqlPlugin/src/main/java/org/lowcoder/plugin/mssql/model/MssqlDatasourceConfig.java#MssqlDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-plugins/mssqlPlugin/src/main/java/org/lowcoder/plugin/mssql/model/MssqlDatasourceConfig.java#MssqlDatasourceConfig.buildFrom#fromJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/MssqlDatasourceConfig.input.json", "config-binding/MssqlDatasourceConfig.json",
                ConfigBinding.entryPoints("buildFrom", MssqlDatasourceConfig::buildFrom, "MssqlConnector.resolveConfig", new MssqlConnector()::resolveConfig));
    }

    @BoundarySites({
            "lowcoder-plugins/mssqlPlugin/src/main/java/org/lowcoder/plugin/mssql/model/MssqlQueryConfig.java#MssqlQueryConfig.from#toJson#1",
            "lowcoder-plugins/mssqlPlugin/src/main/java/org/lowcoder/plugin/mssql/model/MssqlQueryConfig.java#MssqlQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/MssqlQueryConfig.input.json", "config-binding/MssqlQueryConfig.json",
                Map.of("from", MssqlQueryConfig::from));
    }
}

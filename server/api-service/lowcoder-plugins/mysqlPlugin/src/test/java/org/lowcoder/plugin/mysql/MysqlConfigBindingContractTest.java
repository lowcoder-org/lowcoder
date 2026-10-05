package org.lowcoder.plugin.mysql;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mysql.model.MysqlQueryConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code mysqlPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code MysqlConnector.resolveConfig} (the SDK default, {@code
 * DatasourceConnector.resolveConfig}, binding the SDK's {@code MysqlDatasourceConfig}) and {@code
 * MysqlQueryConfig.from}. {@code ConfigBinding} applies each entry point to every form of the input fixture
 * (canonical names, alias or getter-derived names, scalars as strings, missing and empty values) and pins the bound
 * state, the written views and the errors in the report fixture.
 */
public class MysqlConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/common/DatasourceConnector.java#DatasourceConnector.resolveConfig#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/MysqlDatasourceConfig.input.json", "config-binding/MysqlDatasourceConfig.json",
                Map.of("MysqlConnector.resolveConfig", new MysqlConnector()::resolveConfig));
    }

    @BoundarySites({
            "lowcoder-plugins/mysqlPlugin/src/main/java/org/lowcoder/plugin/mysql/model/MysqlQueryConfig.java#MysqlQueryConfig.from#toJson#1",
            "lowcoder-plugins/mysqlPlugin/src/main/java/org/lowcoder/plugin/mysql/model/MysqlQueryConfig.java#MysqlQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/MysqlQueryConfig.input.json", "config-binding/MysqlQueryConfig.json",
                Map.of("from", MysqlQueryConfig::from));
    }
}

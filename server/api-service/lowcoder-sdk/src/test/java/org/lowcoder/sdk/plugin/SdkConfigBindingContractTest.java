package org.lowcoder.sdk.plugin;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

import java.util.Map;

/**
 * The {@code lowcoder-sdk} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1): the
 * datasource configs the SDK declares, bound by their own {@code buildFrom} ({@link ConfigBinding}). The forms of
 * each input fixture cover the shapes clients send: canonical names, scalars as strings, getter-derived names
 * ({@code readonly} for the creator's {@code isReadonly}), and for the HTTP configs every {@code AuthConfig} and
 * {@code SslConfig} type id, a missing id ({@code defaultImpl}) and an unknown one.
 *
 * <p>{@code DatasourceConnector.resolveConfig}, the default the SQL connectors use, is claimed by the plugin tests that
 * call it through their real connectors ({@code MysqlConfigBindingContractTest} and the Mssql, Postgres, Oracle and
 * Snowflake ones).
 */
public class SdkConfigBindingContractTest {

    static final String BUILD_FROM = "buildFrom";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/mysql/MysqlDatasourceConfig.java#MysqlDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/mysql/MysqlDatasourceConfig.java#MysqlDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void mysqlDatasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/MysqlDatasourceConfig.input.json", "config-binding/MysqlDatasourceConfig.json",
                Map.of(BUILD_FROM, MysqlDatasourceConfig::buildFrom));
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/restapi/RestApiDatasourceConfig.java#RestApiDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/restapi/RestApiDatasourceConfig.java#RestApiDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void restApiDatasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/RestApiDatasourceConfig.input.json", "config-binding/RestApiDatasourceConfig.json",
                Map.of(BUILD_FROM, RestApiDatasourceConfig::buildFrom));
    }

    @BoundarySites({
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/graphql/GraphQLDatasourceConfig.java#GraphQLDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-sdk/src/main/java/org/lowcoder/sdk/plugin/graphql/GraphQLDatasourceConfig.java#GraphQLDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void graphQLDatasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/GraphQLDatasourceConfig.input.json", "config-binding/GraphQLDatasourceConfig.json",
                Map.of(BUILD_FROM, GraphQLDatasourceConfig::buildFrom));
    }
}

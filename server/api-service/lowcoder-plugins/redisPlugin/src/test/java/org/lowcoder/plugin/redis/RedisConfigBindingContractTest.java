package org.lowcoder.plugin.redis;

import org.junit.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code redisPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code RedisDatasourceConfig.buildFrom}. {@code ConfigBinding} applies each entry
 * point to every form of the input fixture (canonical names, alias or getter-derived names, scalars as strings,
 * missing and empty values) and pins the bound state, the written views and the errors in the report fixture.
 */
public class RedisConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/redisPlugin/src/main/java/org/lowcoder/plugin/redis/model/RedisDatasourceConfig.java#RedisDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-plugins/redisPlugin/src/main/java/org/lowcoder/plugin/redis/model/RedisDatasourceConfig.java#RedisDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/RedisDatasourceConfig.input.json", "config-binding/RedisDatasourceConfig.json",
                Map.of("buildFrom", RedisDatasourceConfig::buildFrom));
    }
}

package org.lowcoder.plugin.mongo;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code mongoPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code MongoDatasourceConfig.buildFrom}; the auth mechanism binds by enum constant
 * name, not by its {@code value}. {@code ConfigBinding} applies each entry point to every form of the input fixture
 * (canonical names, alias or getter-derived names, scalars as strings, missing and empty values) and pins the bound
 * state, the written views and the errors in the report fixture.
 */
public class MongoConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/model/MongoDatasourceConfig.java#MongoDatasourceConfig.buildFrom#toJson#1",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/model/MongoDatasourceConfig.java#MongoDatasourceConfig.buildFrom#fromJson#1"})
    @Test
    public void datasourceConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/MongoDatasourceConfig.input.json", "config-binding/MongoDatasourceConfig.json",
                Map.of("buildFrom", MongoDatasourceConfig::buildFrom));
    }
}

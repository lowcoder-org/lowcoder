package org.lowcoder.plugin.graphql;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.graphql.model.GraphQLQueryConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code graphqlPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code GraphQLQueryConfig.from}, whose creator does not take {@code httpMethod} or
 * {@code disableEncodingParams}. {@code ConfigBinding} applies each entry point to every form of the input fixture
 * (canonical names, alias or getter-derived names, scalars as strings, missing and empty values) and pins the bound
 * state, the written views and the errors in the report fixture.
 */
public class GraphQLConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/model/GraphQLQueryConfig.java#GraphQLQueryConfig.from#toJson#1",
            "lowcoder-plugins/graphqlPlugin/src/main/java/org/lowcoder/plugin/graphql/model/GraphQLQueryConfig.java#GraphQLQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/GraphQLQueryConfig.input.json", "config-binding/GraphQLQueryConfig.json",
                Map.of("from", GraphQLQueryConfig::from));
    }
}

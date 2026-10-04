package org.lowcoder.plugin.sql;

import org.junit.Test;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code sqlBasedPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1),
 * through the real entry points: {@code SqlQueryConfig.from}, whose {@code @JsonAlias} names {@code commandType}
 * and {@code command} are one form and the Java names another. {@code ConfigBinding} applies each entry point to
 * every form of the input fixture (canonical names, alias or getter-derived names, scalars as strings, missing and
 * empty values) and pins the bound state, the written views and the errors in the report fixture.
 */
public class SqlConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/sqlBasedPlugin/src/main/java/org/lowcoder/plugin/sql/SqlQueryConfig.java#SqlQueryConfig.from#toJson#1",
            "lowcoder-plugins/sqlBasedPlugin/src/main/java/org/lowcoder/plugin/sql/SqlQueryConfig.java#SqlQueryConfig.from#fromJson#1"})
    @Test
    public void queryConfig() {
        ConfigBinding.assertBinding(GOLDEN, "config-binding/SqlQueryConfig.input.json", "config-binding/SqlQueryConfig.json",
                Map.of("from", SqlQueryConfig::from));
    }
}

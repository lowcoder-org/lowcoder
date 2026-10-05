package org.lowcoder.plugins;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;

import java.util.Map;

/**
 * The {@code smtpPlugin} rows of group {@code config-binding} (docs/API_PAYLOAD_TEST_PLAN.md §4.7, task T8.1):
 * {@code SmtpEngine.resolveConfig} binds {@code SmtpDatasourceConfig}, which has Lombok's {@code @Builder} and final
 * fields but neither {@code @Jacksonized} nor a creator annotation, so Jackson must find the builder's all-arguments
 * constructor through the parameter names module; the forms pin that, and the {@code int} port's coercions.
 */
public class SmtpConfigBindingContractTest {

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.resolveConfig#toJson#1",
            "lowcoder-plugins/smtpPlugin/src/main/java/org/lowcoder/plugins/SmtpPlugin.java#SmtpPlugin.SmtpEngine.resolveConfig#fromJson#1"})
    @Test
    public void datasourceConfig() {
        SmtpEngine engine = new SmtpEngine();
        ConfigBinding.assertBinding(GOLDEN, "config-binding/SmtpDatasourceConfig.input.json", "config-binding/SmtpDatasourceConfig.json",
                Map.of("SmtpEngine.resolveConfig", engine::resolveConfig));
    }
}

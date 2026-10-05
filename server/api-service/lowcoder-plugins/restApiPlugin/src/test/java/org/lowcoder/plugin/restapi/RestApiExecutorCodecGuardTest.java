package org.lowcoder.plugin.restapi;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ClientCodecs;
import org.springframework.web.reactive.function.client.ExchangeStrategies;

import java.lang.reflect.Field;

/**
 * Guard of the client codecs of {@link RestApiExecutor} (docs/API_PAYLOAD_TEST_PLAN.md §5.4, group
 * {@code client-codec-guard}, site {@code RestApiExecutor.java:103}). It reads the real private instance field of an
 * executor built as {@code RestApiEngineTest} builds it.
 *
 * <p>Requests run with the {@code WebClientBuildHelper} limit, not the one declared at {@code RestApiExecutor.java:101-104}
 * (plan §9, O11; evidence E14), so the guard pins the strategies a request really gets.
 *
 * <p>Limit: it runs on this module's test classpath. The modules Spring adds to the codec mapper depend on the
 * classpath, and in the server the plugin runs on the server's; the server-side guard covers that one.
 */
public class RestApiExecutorCodecGuardTest {

    private static final String STRATEGIES_FIELD = "exchangeStrategies";

    @BoundarySites("lowcoder-plugins/restApiPlugin/src/main/java/org/lowcoder/plugin/restapi/RestApiExecutor.java#RestApiExecutor.exchangeStrategies#codecs#1")
    @Test
    public void requestsUseDefaultClientCodecsWithTheHelperLimit() throws ReflectiveOperationException {
        Field field = RestApiExecutor.class.getDeclaredField(STRATEGIES_FIELD);
        field.setAccessible(true);
        ExchangeStrategies declared = (ExchangeStrategies) field.get(new RestApiExecutor(new CommonConfig()));
        ClientCodecs.assertDefaultClientCodecs("RestApiExecutor",
                ClientCodecs.effectiveThroughWebClientBuildHelper(declared), ClientCodecs.WEB_CLIENT_BUILD_HELPER_DEFAULT_SIZE);
    }
}

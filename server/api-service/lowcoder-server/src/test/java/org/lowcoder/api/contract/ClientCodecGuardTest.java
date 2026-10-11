package org.lowcoder.api.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.misc.JsLibraryController;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ClientCodecs;
import org.lowcoder.sdk.contract.ClientCodecs.MapperProfile;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.web.reactive.function.client.ExchangeStrategies;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guard of the client codecs built in the core modules and of the node-service client's bare mapper
 * (docs/API_PAYLOAD_TEST_PLAN.md §5.4, group {@code client-codec-guard}; evidence E8, E11). Each case reads the
 * real {@code ExchangeStrategies} object the application uses, not a copy.
 *
 * <p>Sites: {@code WebClientBuildHelper.java:132}, {@code DatasourcePluginClient.java:44},
 * {@code JsLibraryController.java:63}. {@code DatasourcePluginClient} builds a plain {@code WebClient} from its
 * strategies, so its declared limit is the effective one; {@code JsLibraryController}'s requests get the
 * {@code WebClientBuildHelper} limit instead of the declared one (plan §9, O11; evidence E14), and that is what is pinned. The executors' sites are guarded in {@code graphqlPlugin} and
 * {@code restApiPlugin}.
 *
 * <p>Limits: effective strategies are read through Spring's non-public
 * {@code DefaultWebClientBuilder#initExchangeStrategies} ({@link ClientCodecs#effective}), so a Spring upgrade may
 * require adjusting the reflection.
 * Loading {@code JsLibraryController} schedules background fetches to the npm registry (plan §4.9); their failures
 * are logged and do not affect these assertions.
 */
class ClientCodecGuardTest {

    private static final String NODE_CLIENT_STRATEGIES_FIELD = "EXCHANGE_STRATEGIES";
    private static final String NODE_CLIENT_MAPPER_FIELD = "OBJECT_MAPPER";
    private static final String JS_LIBRARY_STRATEGIES_FIELD = "EXCHANGE_STRATEGY";
    /** E11: the bare mapper registers nothing and fails on unknown properties. */
    private static final MapperProfile BARE_MAPPER_PROFILE = new MapperProfile(true, true, true, List.of());

    @BoundarySites("lowcoder-sdk/src/main/java/org/lowcoder/sdk/webclient/WebClientBuildHelper.java#WebClientBuildHelper.toWebClientBuilder#codecs#1")
    @Test
    void webClientBuildHelperUsesDefaultClientCodecs() {
        ClientCodecs.assertDefaultClientCodecs("WebClientBuildHelper",
                ClientCodecs.effective(WebClientBuildHelper.builder().systemProxy().toWebClientBuilder()),
                ClientCodecs.WEB_CLIENT_BUILD_HELPER_DEFAULT_SIZE);
    }

    @BoundarySites("lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.EXCHANGE_STRATEGIES#codecs#1")
    @Test
    void datasourcePluginClientUsesDefaultClientCodecs() throws ReflectiveOperationException {
        ClientCodecs.assertDefaultClientCodecs("DatasourcePluginClient",
                (ExchangeStrategies) staticField(DatasourcePluginClient.class, NODE_CLIENT_STRATEGIES_FIELD), ClientCodecs.UNLIMITED);
    }

    /** Declared unlimited at {@code JsLibraryController.java:61-64}; requests get 20 MB (O11, E14). */
    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/misc/JsLibraryController.java#JsLibraryController.EXCHANGE_STRATEGY#codecs#1")
    @Test
    void jsLibraryControllerRequestsUseDefaultClientCodecsWithTheHelperLimit() throws ReflectiveOperationException {
        ExchangeStrategies declared = (ExchangeStrategies) staticField(JsLibraryController.class, JS_LIBRARY_STRATEGIES_FIELD);
        ClientCodecs.assertDefaultClientCodecs("JsLibraryController",
                ClientCodecs.effectiveThroughWebClientBuildHelper(declared), ClientCodecs.WEB_CLIENT_BUILD_HELPER_DEFAULT_SIZE);
    }

    @Test
    void datasourcePluginClientBareMapperIsUnconfigured() throws ReflectiveOperationException {
        ObjectMapper mapper = (ObjectMapper) staticField(DatasourcePluginClient.class, NODE_CLIENT_MAPPER_FIELD);
        MapperProfile profile = ClientCodecs.profile(mapper);
        System.out.println("[ClientCodecGuardTest] DatasourcePluginClient.OBJECT_MAPPER " + profile);
        assertThat(mapper).as("bare mapper").isNotSameAs(JsonUtils.getObjectMapper());
        assertThat(profile).isEqualTo(BARE_MAPPER_PROFILE);
    }

    private static Object staticField(Class<?> owner, String name) throws ReflectiveOperationException {
        Field field = owner.getDeclaredField(name);
        field.setAccessible(true);
        return field.get(null);
    }
}

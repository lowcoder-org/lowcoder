package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.config.ServerSettingController;
import org.lowcoder.api.config.ServerSettingEndpoints;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.domain.serversetting.service.ServerSettingService;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Codec-level test of {@link ServerSettingEndpoints#getServerSettings} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1),
 * through the production {@link ServerSettingController} with its service mocked. The endpoint answers the service's
 * {@code Mono<Map<String, String>>} itself, without an envelope (§5.2), so the body is the map as a JSON object; the
 * expected text is written out here, not produced by a mapper. One value is non-ASCII and one needs escaping, so a
 * change in how strings are written shows.
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}.
 */
class ServerSettingEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(ServerSettingEndpoints.class);
    static final String FIRST_KEY = "ServerSettingEndpointsContractTest.first";
    static final String FIRST_VALUE = "ServerSettingEndpointsContractTest \"quoted\" é";
    static final String SECOND_KEY = "ServerSettingEndpointsContractTest.second";
    static final String SECOND_VALUE = "40100";
    static final String EXPECTED = "{\"ServerSettingEndpointsContractTest.first\":\"ServerSettingEndpointsContractTest \\\"quoted\\\" é\","
            + "\"ServerSettingEndpointsContractTest.second\":\"40100\"}";

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(ServerSettingEndpointsContractTest.class);
    }

    /** The settings map as the service answers it; a number-like value stays a JSON string. */
    @Test
    void getServerSettings() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        Map<String, String> settings = new LinkedHashMap<>();
        settings.put(FIRST_KEY, FIRST_VALUE);
        settings.put(SECOND_KEY, SECOND_VALUE);
        Mockito.when(builder.mock(ServerSettingService.class).getServerSettingsMap()).thenReturn(Mono.just(settings));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(ServerSettingController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getServerSettings", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EXPECTED);
        }
    }
}

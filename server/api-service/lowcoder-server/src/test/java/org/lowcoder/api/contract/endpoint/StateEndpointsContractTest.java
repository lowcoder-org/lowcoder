package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.framework.StateController;
import org.lowcoder.api.framework.StateEndpoints;
import org.lowcoder.api.framework.warmup.WarmupHelper;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Codec-level tests of {@link StateEndpoints#healthCheck} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), a
 * {@code HEAD} endpoint, through the production {@link StateController} with its {@link WarmupHelper} mocked. A
 * {@code HEAD} answer has headers and no body, so the tests pin the status and the {@code Content-Type} the
 * {@code ResponseView} would have been written with.
 *
 * <ul>
 *   <li>{@link #healthCheckBeforeWarmup}: the first request warms up and answers {@code SERVER_NOT_READY} through the
 *       global handler (its HTTP 503).</li>
 *   <li>{@link #healthCheck}: once warmed up, the same controller answers {@code ResponseView.success(true)}: HTTP 200.</li>
 * </ul>
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}.
 */
class StateEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(StateEndpoints.class);

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(StateEndpointsContractTest.class);
    }

    @Test
    void healthCheckBeforeWarmup() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        WarmupHelper warmup = builder.mock(WarmupHelper.class);
        Mockito.when(warmup.warmup()).thenReturn(Mono.empty());
        try (ContractTestClient client = builder.controllerWithMockedDependencies(StateController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "healthCheck", Map.of(), null);
            EndpointContract.assertEmptyResponse(result, HttpStatus.valueOf(BizError.SERVER_NOT_READY.getHttpErrorCode()), MediaType.APPLICATION_JSON);
            Mockito.verify(warmup).warmup();
        }
    }

    @Test
    void healthCheck() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        WarmupHelper warmup = builder.mock(WarmupHelper.class);
        Mockito.when(warmup.warmup()).thenReturn(Mono.empty());
        try (ContractTestClient client = builder.controllerWithMockedDependencies(StateController.class).build()) {
            CONTRACT.exchange(client, "healthCheck", Map.of(), null);
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "healthCheck", Map.of(), null);
            EndpointContract.assertEmptyResponse(result, HttpStatus.OK, MediaType.APPLICATION_JSON);
            Mockito.verify(warmup, Mockito.times(1)).warmup();
        }
    }
}

package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.material.AssetController;
import org.lowcoder.api.material.AssetEndpoints;
import org.lowcoder.domain.asset.service.AssetService;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level test of {@link AssetEndpoints#getById} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), through the
 * production {@link AssetController}. The endpoint answers image bytes, not JSON (§1.4): the mocked
 * {@link AssetService#makeImageResponse} writes a content type and bytes to the exchange, as the real one does, and the
 * test pins that they and the controller's {@code Cache-Control} reach the client unchanged.
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}.
 */
class AssetEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(AssetEndpoints.class);
    static final String ASSET_ID = "AssetEndpointsContractTest.assetId";
    static final byte[] IMAGE = "AssetEndpointsContractTest.image é".getBytes(StandardCharsets.UTF_8);
    /** {@code AssetController#getById}'s cache header. */
    static final String CACHE_CONTROL = "public, max-age=7776000, immutable";

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(AssetEndpointsContractTest.class);
    }

    @Test
    void getById() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        Mockito.when(builder.mock(AssetService.class).makeImageResponse(any(ServerWebExchange.class), eq(ASSET_ID))).thenAnswer(invocation -> {
            ServerHttpResponse response = invocation.<ServerWebExchange> getArgument(0).getResponse();
            response.getHeaders().setContentType(MediaType.IMAGE_PNG);
            return response.writeWith(Mono.just(response.bufferFactory().wrap(IMAGE)));
        });
        try (ContractTestClient client = builder.controllerWithMockedDependencies(AssetController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getById", Map.of(), null, ASSET_ID);
            EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.IMAGE_PNG, IMAGE);
            assertThat(result.getResponseHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo(CACHE_CONTROL);
        }
    }
}

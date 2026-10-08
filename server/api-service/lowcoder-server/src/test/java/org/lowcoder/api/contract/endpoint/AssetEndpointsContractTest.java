package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.material.AssetController;
import org.lowcoder.api.material.AssetEndpoints;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.domain.asset.service.AssetRepository;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.asset.service.AssetServiceImpl;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
 * {@link AssetService#makeImageResponse} delegates to a real {@link AssetServiceImpl} over a mocked
 * {@link AssetRepository}, and the test pins the status, content type, bytes and the controller's {@code Cache-Control}
 * the client receives for a stored asset, an unknown id and a failed read (BF-129: an unknown id was answered 200 with
 * an empty body, and every answer carried the 90-day immutable cache header).
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}.
 */
class AssetEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(AssetEndpoints.class);
    static final String ASSET_ID = "AssetEndpointsContractTest.assetId";
    static final byte[] IMAGE = "AssetEndpointsContractTest.image é".getBytes(StandardCharsets.UTF_8);
    /** {@code AssetController#getById}'s cache header of a served image. */
    static final String CACHE_CONTROL = "public, max-age=7776000, immutable";
    static final String THUMBNAIL_DIMENSION = "thumbNailPhotoDimension";
    static final int DEFAULT_THUMBNAIL_DIMENSION = 128;
    static final String READ_FAILURE = "AssetEndpointsContractTest.readFailure";

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(AssetEndpointsContractTest.class);
    }

    @Test
    void getById() {
        EntityExchangeResult<byte[]> result = getAsset(Mono.just(Asset.from(MediaType.IMAGE_PNG, IMAGE)));

        EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.IMAGE_PNG, IMAGE);
        assertThat(result.getResponseHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo(CACHE_CONTROL);
    }

    /** Catches: the 200 with an empty body for an id no asset has, and a 404 that may be cached for 90 days. */
    @Test
    void getByIdOfAnUnknownAssetIsA404WithoutTheCacheHeaderBF129() {
        EntityExchangeResult<byte[]> result = getAsset(Mono.empty());

        EndpointContract.assertEmptyResponse(result, HttpStatus.NOT_FOUND, null);
        assertThat(result.getResponseHeaders().containsKey(HttpHeaders.CACHE_CONTROL)).isFalse();
    }

    /** Catches: an error answer that carries the 90-day immutable cache header. */
    @Test
    void getByIdWhoseReadFailsIsA500WithoutTheCacheHeaderBF129() {
        EntityExchangeResult<byte[]> result = getAsset(Mono.error(new IllegalStateException(READ_FAILURE)));

        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
        assertThat(result.getResponseHeaders().containsKey(HttpHeaders.CACHE_CONTROL)).isFalse();
    }

    /** GET of {@link #ASSET_ID} with the real service reading {@code stored} from the repository. */
    private static EntityExchangeResult<byte[]> getAsset(Mono<Asset> stored) {
        AssetRepository repository = Mockito.mock(AssetRepository.class);
        Mockito.when(repository.findById(ASSET_ID)).thenReturn(stored);
        AssetServiceImpl realService = new AssetServiceImpl(repository, configCenter());
        ContractTestClient.Builder builder = ContractTestClient.builder();
        Mockito.when(builder.mock(AssetService.class).makeImageResponse(any(ServerWebExchange.class), eq(ASSET_ID)))
                .thenAnswer(invocation -> realService.makeImageResponse(invocation.getArgument(0), ASSET_ID));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(AssetController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getById", Map.of(), null, ASSET_ID);
            System.out.println("[AssetEndpointsContractTest] " + result.getStatus() + " " + result.getResponseHeaders());
            return result;
        }
    }

    private static ConfigCenter configCenter() {
        ConfigCenter center = Mockito.mock(ConfigCenter.class);
        ConfigInstance asset = Mockito.mock(ConfigInstance.class);
        Conf<Integer> dimension = () -> DEFAULT_THUMBNAIL_DIMENSION;
        Mockito.when(center.asset()).thenReturn(asset);
        Mockito.when(asset.ofInteger(THUMBNAIL_DIMENSION, DEFAULT_THUMBNAIL_DIMENSION)).thenReturn(dimension);
        return center;
    }
}

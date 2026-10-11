package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.config.ConfigController;
import org.lowcoder.api.config.ConfigEndpoints;
import org.lowcoder.api.config.ConfigEndpoints.UpdateConfigRequest;
import org.lowcoder.api.config.ConfigView;
import org.lowcoder.api.contract.support.ConfigSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.GoldenJson;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Codec-level tests of the 4 {@link ConfigEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), through the
 * production {@link ConfigController} in the {@link ContractTestClient} harness, with its repository and service mocked
 * and the deployment id read from a {@link ConfigCenterForTest}.
 *
 * <ul>
 *   <li>{@code getDeploymentId} answers a bare {@code Mono<String>}: no envelope, written as text.</li>
 *   <li>{@code getServerConfig} answers the stored {@link ServerConfig} (S1, whose {@code Object} value is the §4.6
 *       representative input), or for a key without one the {@code new ServerConfig(key, null)} of the
 *       {@code defaultIfEmpty} branch, pinned in {@value #NOT_STORED_FIXTURE}.</li>
 *   <li>{@code updateServerConfig}'s D1 body gives the repository its {@code value}.</li>
 *   <li>{@code getConfig} is {@code @JsonView(Public)} (§4.5): the {@link ConfigView} is its {@code S1Public} golden, whose
 *       auth configs have no {@code SECRET-} client secret.</li>
 * </ul>
 *
 * <p>Stubbing groups (registry column {@code group}): {@code pass-through} for all four.
 */
class ConfigEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(ConfigEndpoints.class);
    static final String KEY = "ConfigEndpointsContractTest.key";
    static final String ORG_ID = "ConfigEndpointsContractTest.orgId";
    static final String DEPLOYMENT_ID = "ConfigEndpointsContractTest.deploymentId";
    /** The {@code ConfigCenter#deployment()} key {@code ConfigController#init} reads. */
    static final String DEPLOYMENT_ID_KEY = "id";
    static final String NOT_STORED_FIXTURE = "types/org.lowcoder.infra.config.model.ServerConfig.NotStored.json";
    /** The type of a {@code Mono<String>} answer: Spring's {@code CharSequenceEncoder} writes text. */
    static final MediaType TEXT = new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.UTF_8);

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private ContractTestClient.Builder builder;
    private ServerConfigRepository repository;
    private OrgApiService orgApiService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        builder.singleton("configCenter", new ConfigCenterForTest(Map.of(DEPLOYMENT_ID_KEY, DEPLOYMENT_ID)));
        repository = builder.mock(ServerConfigRepository.class);
        orgApiService = builder.mock(OrgApiService.class);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(ConfigEndpointsContractTest.class);
    }

    @Test
    void getDeploymentId() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getDeploymentId", Map.of(), null);
            EndpointContract.assertBytes(result, HttpStatus.OK, TEXT, DEPLOYMENT_ID.getBytes(StandardCharsets.UTF_8));
        }
    }

    @Test
    void getServerConfig() {
        Mockito.when(repository.findByKey(KEY)).thenReturn(Mono.just(ConfigSamples.serverConfig()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getServerConfig", Map.of(), null, KEY);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ServerConfig.class)));
        }
    }

    /** The {@code defaultIfEmpty} branch: a key without a stored config answers a config of that key with no value. */
    @Test
    void getServerConfigNotStored() {
        Mockito.when(repository.findByKey(KEY)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getServerConfig", Map.of(), null, KEY);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(GOLDEN.read(NOT_STORED_FIXTURE)));
        }
    }

    /** The D1 body's {@code value} is stored under the path's key; the answer is the stored config. */
    @Test
    void updateServerConfig() {
        UpdateConfigRequest sample = (UpdateConfigRequest) PayloadSamples.of(UpdateConfigRequest.class).value();
        Mockito.when(repository.upsert(KEY, sample.value())).thenReturn(Mono.just(ConfigSamples.serverConfig()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updateServerConfig", Map.of(), EndpointContract.d1(UpdateConfigRequest.class), KEY);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ServerConfig.class)));
            Mockito.verify(repository).upsert(KEY, sample.value());
        }
    }

    /** §4.5: the {@code Public} view of the organization's login configuration. */
    @Test
    void getConfig() {
        Mockito.when(orgApiService.getOrganizationConfigs(ORG_ID)).thenReturn(Mono.just(ConfigSamples.configView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getConfig", Map.of("orgId", ORG_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK,
                    EndpointContract.success(EndpointContract.s1(ConfigView.class, JsonViews.Public.class)));
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(ConfigController.class).build();
    }
}

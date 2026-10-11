package org.lowcoder.api.contract.boundary;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.DatasourceSamples;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.datasource.DatasourceController;
import org.lowcoder.api.datasource.DatasourceEndpoints;
import org.lowcoder.api.datasource.UpsertDatasourceRequest;
import org.lowcoder.api.datasource.UpsertDatasourceRequestMapper;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * The {@code upsert-datasource} group (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T5.1): for a JS datasource plugin,
 * {@code UpsertDatasourceRequestMapper#resolve} turns the request's {@code datasourceConfig} map into a
 * {@link JsDatasourceConnectionConfig} with {@code JsonUtils.fromJson(JsonUtils.toJson(...))}
 * ({@code UpsertDatasourceRequestMapper.java:43}).
 *
 * <p>The site is reached through its real entry point: {@code POST /api/datasources} on the production
 * {@link DatasourceController} in the {@link ContractTestClient} harness, with the production mapper (its
 * {@link DatasourceMetaInfoService} mocked to call the type a JS plugin), so the config the conversion meets is the
 * one the server codec bound from the request. The request is the {@code UpsertDatasourceRequest} D1 golden with the
 * §4.6 representative input as its {@code datasourceConfig}, spliced in as text. Pinned:
 *
 * <ul>
 *   <li>the resulting config, entry by entry with its Java classes ({@link CanonicalJson#assertSameJava}), against the
 *       representative input bound to {@code Map<String, Object>} by the production mapper, in a
 *       {@link JsDatasourceConnectionConfig} built without Jackson: the double conversion must neither change a
 *       value's class nor lose one;</li>
 *   <li>what the production mapper writes for the config, against {@code representative.output.json} by the §1.2
 *       contract: it is written as a map.</li>
 * </ul>
 *
 * <p>Limits: the non-JS branch ({@code resolveDetailConfig}) is {@code config-binding}'s (WP8); the config's
 * {@code @Transient} {@code definition} and {@code type} are not set by the mapper and not compared.
 */
class UpsertDatasourceContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(DatasourceEndpoints.class);
    static final String DATASOURCE_CONFIG = "datasourceConfig";
    /** Stands for the representative input while the request is written; replaced, quotes included, by its text. */
    static final String CONFIG_PLACEHOLDER = "@@upsert-datasource-config@@";
    static final String MAPPER_FIELD = "datasourceMetaInfoService";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    @BoundarySites({"lowcoder-server/src/main/java/org/lowcoder/api/datasource/UpsertDatasourceRequestMapper.java#UpsertDatasourceRequestMapper.resolve#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/datasource/UpsertDatasourceRequestMapper.java#UpsertDatasourceRequestMapper.resolve#fromJson#1"})
    void jsPluginConfigKeepsTheRequestValues() throws JsonProcessingException {
        UpsertDatasourceRequest sample = (UpsertDatasourceRequest) PayloadSamples.of(UpsertDatasourceRequest.class).value();
        ContractTestClient.Builder builder = ContractTestClient.builder();
        DatasourceApiService datasourceApiService = builder.mock(DatasourceApiService.class);
        Mockito.when(datasourceApiService.create(any())).thenReturn(Mono.just(DatasourceSamples.datasource()));
        DatasourceService datasourceService = builder.mock(DatasourceService.class);
        Mockito.when(datasourceService.removePasswordTypeKeysFromJsDatasourcePluginConfig(any())).thenReturn(Mono.empty());
        BusinessEventPublisher events = builder.mock(BusinessEventPublisher.class);
        Mockito.when(events.publishDatasourceEvent(any(Datasource.class), any(), any())).thenReturn(Mono.empty());
        DatasourceMetaInfoService metaInfoService = Mockito.mock(DatasourceMetaInfoService.class);
        Mockito.when(metaInfoService.isJsDatasourcePlugin(sample.getType())).thenReturn(true);
        UpsertDatasourceRequestMapper mapper = new UpsertDatasourceRequestMapper();
        ReflectionTestUtils.setField(mapper, MAPPER_FIELD, metaInfoService);
        builder.singleton("upsertDatasourceRequestMapper", mapper);
        try (ContractTestClient client = builder.controllerWithMockedDependencies(DatasourceController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), request());
            assertThat(result.getStatus().value()).as("status of " + result.getUrl()).isEqualTo(HttpStatus.CREATED.value());
        }
        ArgumentCaptor<Datasource> created = ArgumentCaptor.forClass(Datasource.class);
        Mockito.verify(datasourceApiService).create(created.capture());
        Mockito.verify(metaInfoService).isJsDatasourcePlugin(sample.getType());
        Object config = created.getValue().getDetailConfig();
        System.out.println("[UpsertDatasourceContractTest] resolved config " + config.getClass().getName() + ": " + config);
        CanonicalJson.assertSameJava(expectedConfig(), config);
        CanonicalJson.assertEquivalent(GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT), JsonUtils.getObjectMapper().writeValueAsString(config));
    }

    /** The D1 request with the representative input as {@code datasourceConfig}, its text unchanged. */
    private static String request() throws JsonProcessingException {
        ObjectNode request = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.d1(UpsertDatasourceRequest.class));
        request.put(DATASOURCE_CONFIG, CONFIG_PLACEHOLDER);
        return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(request)
                .replace("\"" + CONFIG_PLACEHOLDER + "\"", PayloadSamples.representativeInputText());
    }

    /** The representative input as the server codec binds the request's map, in the config class, built without Jackson. */
    @SuppressWarnings("unchecked")
    private static JsDatasourceConnectionConfig expectedConfig() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.putAll((Map<String, Object>) PayloadSamples.representative(JsonUtils.getObjectMapper().getTypeFactory()
                .constructMapType(Map.class, String.class, Object.class)));
        return config;
    }
}

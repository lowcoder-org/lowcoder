package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationRecordApiService;
import org.lowcoder.api.application.ApplicationRecordController;
import org.lowcoder.api.application.ApplicationRecordEndpoints;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.StoredValues;
import org.lowcoder.domain.application.model.ApplicationCombineId;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Codec-level tests of the 3 {@link ApplicationRecordEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T2.3),
 * through the production {@link ApplicationRecordController} in the {@link ContractTestClient} harness, with its one
 * collaborator, {@link ApplicationRecordApiService}, mocked. All three are {@code pass-through}.
 *
 * <ul>
 *   <li>{@code delete} answers {@code Mono<Void>}: no envelope, no {@code Content-Type}, and the body is empty.</li>
 *   <li>{@code getByApplicationId} wraps a list of {@link ApplicationRecordMetaView}, each its S1 golden.</li>
 *   <li>{@code dslById} wraps an untyped {@code Map<String, Object>}, a record's DSL (Appendix A: DSL map, §4.6;
 *       {@code ContractRegistry.DYNAMIC_ROOTS}). The stub is the §4.6 representative input bound by the production
 *       mapper, so the body must be the envelope around {@code representative.output.json}.</li>
 *   <li>{@link #dslByIdAsStored} sends the same input through the store first ({@link StoredValues#dsl}, whose limit
 *       applies), so the map holds the Java values a record read from the store holds: integers beyond {@code long}
 *       come back as strings (plan §9 O19). That body is pinned in {@value #STORED_OUTPUT}.</li>
 * </ul>
 */
class ApplicationRecordEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(ApplicationRecordEndpoints.class);
    static final String APPLICATION_ID = "ApplicationRecordEndpointsContractTest.applicationId";
    static final String RECORD_ID = "ApplicationRecordEndpointsContractTest.applicationRecordId";
    static final String APPLICATION_ID_PARAMETER = "applicationId";
    static final String RECORD_ID_PARAMETER = "applicationRecordId";
    static final String STORED_OUTPUT = "dynamic/representative.stored.output.json";
    /** {@code delete} answers {@code Mono<Void>}: no {@code Content-Type}. */
    static final MediaType NO_CONTENT_TYPE = null;

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private ContractTestClient.Builder builder;
    private ApplicationRecordApiService recordApiService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        recordApiService = builder.mock(ApplicationRecordApiService.class);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(ApplicationRecordEndpointsContractTest.class);
    }

    @Test
    void delete() {
        Mockito.when(recordApiService.delete(RECORD_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, RECORD_ID);
            EndpointContract.assertEmptyResponse(result, HttpStatus.OK, NO_CONTENT_TYPE);
            Mockito.verify(recordApiService).delete(RECORD_ID);
        }
    }

    @Test
    void getByApplicationId() {
        ApplicationRecordMetaView record = (ApplicationRecordMetaView) PayloadSamples.of(ApplicationRecordMetaView.class).value();
        Mockito.when(recordApiService.getByApplicationId(APPLICATION_ID)).thenReturn(Mono.just(List.of(record, record)));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getByApplicationId", Map.of(APPLICATION_ID_PARAMETER, APPLICATION_ID), null);
            String meta = EndpointContract.s1(ApplicationRecordMetaView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(meta, meta)));
        }
    }

    /** The two query parameters reach the service as one {@link ApplicationCombineId}. */
    @Test
    void dslById() {
        Map<String, Object> dsl = representativeDsl();
        Mockito.when(recordApiService.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APPLICATION_ID, RECORD_ID)))
                .thenReturn(Mono.just(dsl));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "dslById",
                    Map.of(APPLICATION_ID_PARAMETER, APPLICATION_ID, RECORD_ID_PARAMETER, RECORD_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT)));
        }
    }

    @Test
    void dslByIdAsStored() throws JsonProcessingException {
        Map<String, Object> stored = StoredValues.dsl(representativeDsl());
        GOLDEN.assertJson(STORED_OUTPUT, JsonUtils.getObjectMapper().writeValueAsString(stored));
        Mockito.when(recordApiService.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APPLICATION_ID, RECORD_ID)))
                .thenReturn(Mono.just(stored));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "dslById",
                    Map.of(APPLICATION_ID_PARAMETER, APPLICATION_ID, RECORD_ID_PARAMETER, RECORD_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(GOLDEN.read(STORED_OUTPUT)));
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> representativeDsl() {
        return (Map<String, Object>) PayloadSamples.representative(
                JsonUtils.getObjectMapper().getTypeFactory().constructMapType(Map.class, String.class, Object.class));
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(ApplicationRecordController.class).build();
    }
}

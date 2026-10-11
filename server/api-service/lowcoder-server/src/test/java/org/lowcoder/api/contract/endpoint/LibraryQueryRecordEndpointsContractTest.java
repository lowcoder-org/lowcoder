package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.LibraryQuerySamples;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.StoredValues;
import org.lowcoder.api.query.LibraryQueryRecordApiService;
import org.lowcoder.api.query.LibraryQueryRecordController;
import org.lowcoder.api.query.LibraryQueryRecordEndpoints;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.IntStream;

/**
 * Codec-level tests of the 3 {@link LibraryQueryRecordEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T6.2),
 * through the production {@link LibraryQueryRecordController} in the {@link ContractTestClient} harness, with its one
 * collaborator, {@link LibraryQueryRecordApiService}, mocked.
 *
 * <ul>
 *   <li>{@code delete} answers {@code Mono<Void>}: no envelope, no {@code Content-Type}, and the body is empty.</li>
 *   <li>{@code getByLibraryQueryId} ({@code assembling}) pages the service's list of {@link LibraryQueryRecordMetaView}s
 *       ({@code Pagination#fluxToPageResponseView}, Appendix A), each its S1 golden.</li>
 *   <li>{@code dslById} wraps an untyped {@code Map<String, Object>}, a record's DSL (Appendix A: DSL map, §4.6;
 *       {@code ContractRegistry.DYNAMIC_ROOTS}), as {@code ApplicationRecordEndpoints#dslById} does: the §4.6
 *       representative input bound by the production mapper must come back as {@code representative.output.json}, and
 *       sent through the store first ({@link StoredValues#dsl}, whose limit applies) as
 *       {@value ApplicationRecordEndpointsContractTest#STORED_OUTPUT} (plan §9 O19).</li>
 * </ul>
 */
class LibraryQueryRecordEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(LibraryQueryRecordEndpoints.class);
    static final String LIBRARY_QUERY_ID = "LibraryQueryRecordEndpointsContractTest.libraryQueryId";
    static final String RECORD_ID = "LibraryQueryRecordEndpointsContractTest.libraryQueryRecordId";
    static final String LIBRARY_QUERY_ID_PARAMETER = "libraryQueryId";
    static final String RECORD_ID_PARAMETER = "libraryQueryRecordId";
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 2;
    /** {@code getByLibraryQueryId}'s paging defaults ({@code LibraryQueryRecordEndpoints}). */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 100;
    /** {@code delete} answers {@code Mono<Void>}: no {@code Content-Type}. */
    static final MediaType NO_CONTENT_TYPE = null;

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private ContractTestClient.Builder builder;
    private LibraryQueryRecordApiService recordApiService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        recordApiService = builder.mock(LibraryQueryRecordApiService.class);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(LibraryQueryRecordEndpointsContractTest.class);
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

    /** Page 2 of size 2 out of three records: the third, and the total of all three. */
    @Test
    void getByLibraryQueryId() {
        stubRecords(3);
        Map<String, Object> query = new LinkedHashMap<>();
        query.put(LIBRARY_QUERY_ID_PARAMETER, LIBRARY_QUERY_ID);
        query.put("pageNum", PAGE_NUM);
        query.put("pageSize", PAGE_SIZE);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getByLibraryQueryId", query, null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(EndpointContract.s1(LibraryQueryRecordMetaView.class)), PAGE_NUM, PAGE_SIZE, 3));
        }
    }

    /** Without paging parameters: page 1 of size 100, so both records. Same response branch as {@link #getByLibraryQueryId()}. */
    @Test
    void getByLibraryQueryIdWithDefaultPaging() {
        stubRecords(2);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getByLibraryQueryId",
                    Map.of(LIBRARY_QUERY_ID_PARAMETER, LIBRARY_QUERY_ID), null);
            String meta = EndpointContract.s1(LibraryQueryRecordMetaView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(meta, meta), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2));
        }
    }

    /** The two query parameters reach the service as one {@link LibraryQueryCombineId}. */
    @Test
    void dslById() {
        assertDsl(representativeDsl(), GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT));
    }

    /** {@link #dslById()} with the DSL as the store gives it back; the body is pinned in the stored output. */
    @Test
    void dslByIdAsStored() throws JsonProcessingException {
        Map<String, Object> stored = StoredValues.dsl(representativeDsl());
        GOLDEN.assertJson(ApplicationRecordEndpointsContractTest.STORED_OUTPUT, JsonUtils.getObjectMapper().writeValueAsString(stored));
        assertDsl(stored, GOLDEN.read(ApplicationRecordEndpointsContractTest.STORED_OUTPUT));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> representativeDsl() {
        return (Map<String, Object>) PayloadSamples.representative(
                JsonUtils.getObjectMapper().getTypeFactory().constructMapType(Map.class, String.class, Object.class));
    }

    private void assertDsl(Map<String, Object> dsl, String expectedData) {
        Mockito.when(recordApiService.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, RECORD_ID)))
                .thenReturn(Mono.just(dsl));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "dslById",
                    Map.of(LIBRARY_QUERY_ID_PARAMETER, LIBRARY_QUERY_ID, RECORD_ID_PARAMETER, RECORD_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(expectedData));
        }
    }

    private void stubRecords(int count) {
        Mockito.when(recordApiService.getByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(Mono.just(
                IntStream.range(0, count).mapToObj(i -> LibraryQuerySamples.libraryQueryRecordMetaView()).toList()));
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(LibraryQueryRecordController.class).build();
    }
}

package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.LibraryQuerySamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.query.LibraryQueryApiService;
import org.lowcoder.api.query.LibraryQueryController;
import org.lowcoder.api.query.LibraryQueryEndpoints;
import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.LIBRARY_QUERY_CREATE;
import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.LIBRARY_QUERY_DELETE;
import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.LIBRARY_QUERY_PUBLISH;
import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.LIBRARY_QUERY_UPDATE;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 7 {@link LibraryQueryEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T6.2), through
 * the production {@link LibraryQueryController} in the {@link ContractTestClient} harness, with every collaborator
 * mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens; the argument the service receives is captured and compared with D1's
 * rules ({@link PayloadAssertions#assertBindsTo}). Response: the service mocks return the samples, so the body must be
 * the envelope golden around their S1 goldens ({@link EndpointContract}). One test per registry response branch, named
 * as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code list}, whose page the controller
 * cuts from the service's list of {@link LibraryQueryView}s ({@code Pagination#fluxToPageResponseView}, Appendix A);
 * {@code pass-through} for the others, where the payload is one service result in a {@code ResponseView}, even when
 * other calls (id conversion, the library query and latest record reads, event publishing) run beside it. The id
 * conversion is stubbed as the identity. Limits: the business events are mocks that complete empty; what they publish is
 * not part of the JSON contract, except that the events get the names and versions the controller read.
 */
class LibraryQueryEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(LibraryQueryEndpoints.class);
    static final String LIBRARY_QUERY_ID = "LibraryQueryEndpointsContractTest.libraryQueryId";
    static final String NAME = "LibraryQueryEndpointsContractTest.name";
    static final String STORED = "LibraryQueryEndpointsContractTest.stored";
    /** The library query as {@code update} reads it the second time, after the service's update. */
    static final String UPDATED = "LibraryQueryEndpointsContractTest.updated";
    static final String LATEST_RECORD = "LibraryQueryEndpointsContractTest.latestRecord";
    /** The {@code name} filter's default ({@code LibraryQueryEndpoints}): none. */
    static final String DEFAULT_NAME = "";
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 2;
    /** {@code list}'s paging defaults ({@code LibraryQueryEndpoints}). */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 100;
    static final String TRUE = "true";

    private ContractTestClient.Builder builder;
    private LibraryQueryApiService libraryQueryApiService;
    private LibraryQueryService libraryQueryService;
    private LibraryQueryRecordService libraryQueryRecordService;
    private BusinessEventPublisher businessEventPublisher;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        libraryQueryApiService = builder.mock(LibraryQueryApiService.class);
        libraryQueryService = builder.mock(LibraryQueryService.class);
        libraryQueryRecordService = builder.mock(LibraryQueryRecordService.class);
        GidService gidService = builder.mock(GidService.class);
        Mockito.when(gidService.convertLibraryQueryIdToObjectId(anyString())).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        businessEventPublisher = Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO);
        builder.singleton("businessEventPublisher", businessEventPublisher);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(LibraryQueryEndpointsContractTest.class);
    }

    @Test
    void dropDownList() {
        Mockito.when(libraryQueryApiService.dropDownList(NAME)).thenReturn(Mono.just(List.of(
                LibraryQuerySamples.libraryQueryAggregateView(), LibraryQuerySamples.libraryQueryAggregateView())));
        assertDropDownList(Map.of("name", NAME));
    }

    /** Without {@code name}: the service gets the default, the empty string. Same response branch as {@link #dropDownList()}. */
    @Test
    void dropDownListWithoutName() {
        Mockito.when(libraryQueryApiService.dropDownList(DEFAULT_NAME)).thenReturn(Mono.just(List.of(
                LibraryQuerySamples.libraryQueryAggregateView(), LibraryQuerySamples.libraryQueryAggregateView())));
        assertDropDownList(Map.of());
    }

    /** Page 2 of size 2 out of three views: the third, and the total of all three. */
    @Test
    void list() {
        stubViews(NAME, 3);
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("name", NAME);
        query.put("pageNum", PAGE_NUM);
        query.put("pageSize", PAGE_SIZE);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "list", query, null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(EndpointContract.s1(LibraryQueryView.class)), PAGE_NUM, PAGE_SIZE, 3));
        }
    }

    /** Without parameters: no name filter, page 1 of size 100, so both views. Same response branch as {@link #list()}. */
    @Test
    void listWithDefaultPaging() {
        stubViews(DEFAULT_NAME, 2);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "list", Map.of(), null);
            String view = EndpointContract.s1(LibraryQueryView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(view, view), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2));
        }
    }

    @Test
    void get() {
        Mockito.when(libraryQueryApiService.get(LIBRARY_QUERY_ID)).thenReturn(Mono.just(LibraryQuerySamples.libraryQueryView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "get", Map.of(), null, LIBRARY_QUERY_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(LibraryQueryView.class)));
        }
    }

    /** The bound {@link LibraryQuery}, its DSL included, goes to the service; the event gets the created view's id and name. */
    @Test
    void create() {
        LibraryQueryView created = LibraryQuerySamples.libraryQueryView();
        Mockito.when(libraryQueryApiService.create(any())).thenReturn(Mono.just(created));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(LibraryQuery.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(LibraryQueryView.class)));
            ArgumentCaptor<LibraryQuery> libraryQuery = ArgumentCaptor.forClass(LibraryQuery.class);
            Mockito.verify(libraryQueryApiService).create(libraryQuery.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(LibraryQuery.class), libraryQuery.getValue());
            Mockito.verify(businessEventPublisher).publishLibraryQueryEvent(created.id(), created.name(), LIBRARY_QUERY_CREATE, null);
        }
    }

    /**
     * The bound request goes to the service, which answers {@code true}. The controller reads the library query before
     * and after the update; the event gets the id and name of the second read and the name of the first as the old one.
     */
    @Test
    void update() {
        LibraryQuery stored = LibraryQuerySamples.storedLibraryQuery(STORED);
        LibraryQuery updated = LibraryQuerySamples.storedLibraryQuery(UPDATED);
        Mockito.when(libraryQueryService.getById(LIBRARY_QUERY_ID)).thenReturn(Mono.just(stored), Mono.just(updated));
        Mockito.when(libraryQueryApiService.update(eq(LIBRARY_QUERY_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of(),
                    EndpointContract.d1(UpsertLibraryQueryRequest.class), LIBRARY_QUERY_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<UpsertLibraryQueryRequest> request = ArgumentCaptor.forClass(UpsertLibraryQueryRequest.class);
            Mockito.verify(libraryQueryApiService).update(eq(LIBRARY_QUERY_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(UpsertLibraryQueryRequest.class), request.getValue());
            Mockito.verify(libraryQueryService, Mockito.times(2)).getById(LIBRARY_QUERY_ID);
            Mockito.verify(businessEventPublisher).publishLibraryQueryEvent(updated.getId(), updated.getName(), LIBRARY_QUERY_UPDATE, stored.getName());
        }
    }

    /** The controller answers {@code true} itself once the service has deleted the library query. */
    @Test
    void delete() {
        LibraryQuery stored = LibraryQuerySamples.storedLibraryQuery(STORED);
        Mockito.when(libraryQueryService.getById(LIBRARY_QUERY_ID)).thenReturn(Mono.just(stored));
        Mockito.when(libraryQueryApiService.delete(LIBRARY_QUERY_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, LIBRARY_QUERY_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(libraryQueryApiService).delete(LIBRARY_QUERY_ID);
            Mockito.verify(businessEventPublisher).publishLibraryQueryEvent(stored.getId(), stored.getName(), LIBRARY_QUERY_DELETE, stored.getName());
        }
    }

    /** A library query with a published record: the event gets that record's tag as the old version. */
    @Test
    void publish() {
        LibraryQueryRecord latest = LibraryQuerySamples.libraryQueryRecord(LATEST_RECORD);
        Mockito.when(libraryQueryRecordService.getLatestRecordByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(Mono.just(latest));
        assertPublish(latest.getTag());
    }

    /**
     * A library query never published ({@code defaultIfEmpty}): the event gets no old version. Same response shape as
     * {@link #publish()}.
     */
    @Test
    void publishFirstVersion() {
        Mockito.when(libraryQueryRecordService.getLatestRecordByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(Mono.empty());
        assertPublish(null);
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(LibraryQueryController.class).build();
    }

    private void stubViews(String name, int count) {
        Mockito.when(libraryQueryApiService.listLibraryQueries(name)).thenReturn(Mono.just(
                IntStream.range(0, count).mapToObj(i -> LibraryQuerySamples.libraryQueryView()).toList()));
    }

    private void assertDropDownList(Map<String, ?> query) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "dropDownList", query, null);
            String view = EndpointContract.s1(LibraryQueryAggregateView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(view, view)));
        }
    }

    /** {@code publish}: the bound request goes to the service; the event gets the path's id and both versions. */
    private void assertPublish(String oldVersion) {
        Mockito.when(libraryQueryApiService.publish(eq(LIBRARY_QUERY_ID), any())).thenReturn(Mono.just(LibraryQuerySamples.libraryQueryRecordMetaView()));
        Mockito.when(libraryQueryService.getById(LIBRARY_QUERY_ID)).thenReturn(Mono.just(LibraryQuerySamples.storedLibraryQuery(STORED)));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "publish", Map.of(),
                    EndpointContract.d1(LibraryQueryPublishRequest.class), LIBRARY_QUERY_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(LibraryQueryRecordMetaView.class)));
            ArgumentCaptor<LibraryQueryPublishRequest> request = ArgumentCaptor.forClass(LibraryQueryPublishRequest.class);
            Mockito.verify(libraryQueryApiService).publish(eq(LIBRARY_QUERY_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(LibraryQueryPublishRequest.class), request.getValue());
            Mockito.verify(businessEventPublisher).publishLibraryQueryPublishEvent(LIBRARY_QUERY_ID, oldVersion, request.getValue().tag(), LIBRARY_QUERY_PUBLISH);
        }
    }
}

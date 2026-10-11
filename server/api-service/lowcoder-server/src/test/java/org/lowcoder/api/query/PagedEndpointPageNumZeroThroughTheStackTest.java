package org.lowcoder.api.query;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.LibraryQuerySamples;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Task L1-13b (lane L5): a paged endpoint with {@code pageNum} 0 or negative, through the real {@link LibraryQueryController}
 * ({@code GET /library-queries/listByOrg}) over the production codecs and exception handling of {@link ContractTestClient}.
 *
 * <p>Plan section 9 row "pageNum <= 0 gives a raw 500": {@code Pagination.fluxToPageResponseView} computes
 * {@code skip((pageNum - 1) * pageSize)} ({@code Pagination.java:67}); a negative count makes Reactor throw an
 * {@code IllegalArgumentException} while the pipeline is assembled, which {@code GlobalExceptionHandler.catchException} answers as HTTP
 * 500 with code {@code INTERNAL_SERVER_ERROR} (5000). The seven callers listed in log-L5.md (L1-13) share it; this class pins one of
 * them. {@code Pagination.check()} would throw a {@code BizException} with {@code INVALID_PARAMETER} (HTTP 500, code 5002,
 * {@code BizError.java:15}) and the message key ILLEGAL_PAGE_NUMBER ({@code Pagination.java:41-46}); calling it first changes the code and
 * makes this pin fail. A page size of 0 is the documented way to take every item and stays a control.
 *
 * <p>Limits: one endpoint stands for the seven; the service behind it is a mock. A page number whose skip count overflows is not tried.
 */
public class PagedEndpointPageNumZeroThroughTheStackTest {

    static final String TAG = "[PagedEndpointPageNumZeroThroughTheStackTest] ";
    static final String LIST_URL = NewUrl.LIBRARY_QUERY_URL + "/listByOrg";
    static final String PAGE_NUM = "pageNum";
    static final String PAGE_SIZE = "pageSize";
    static final String NAME_FILTER = "name";
    static final String NAME_VALUE = "library-query-name-filter";
    static final int ITEM_COUNT = 3;
    static final int DEFAULT_PAGE_SIZE = 100;
    static final int ZERO_PAGE = 0;
    static final int NEGATIVE_PAGE = -3;
    static final int SUCCESS_CODE = 1;
    static final ObjectMapper JSON = new ObjectMapper();

    private ContractTestClient client;
    private LibraryQueryApiService libraryQueryApiService;

    @BeforeEach
    void wire() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        libraryQueryApiService = builder.mock(LibraryQueryApiService.class);
        List<LibraryQueryView> views = java.util.Collections.nCopies(ITEM_COUNT, LibraryQuerySamples.libraryQueryView());
        Mockito.when(libraryQueryApiService.listLibraryQueries(Mockito.anyString())).thenReturn(Mono.just(views));
        client = builder.controllerWithMockedDependencies(LibraryQueryController.class).build();
        assertSame(libraryQueryApiService, client.bean(LibraryQueryApiService.class));
        System.out.println(TAG + "wired: real LibraryQueryController, mocked LibraryQueryApiService returning " + ITEM_COUNT + " views");
    }

    @AfterEach
    void close() {
        client.close();
    }

    private JsonNode get(Integer pageNum, Integer pageSize, HttpStatus expectedStatus) {
        EntityExchangeResult<byte[]> result = client.web().get()
                .uri(uri -> {
                    uri.path(LIST_URL);
                    if (pageNum != null) {
                        uri.queryParam(PAGE_NUM, pageNum);
                    }
                    if (pageSize != null) {
                        uri.queryParam(PAGE_SIZE, pageSize);
                    }
                    return uri.build();
                })
                .exchange().expectStatus().isEqualTo(expectedStatus)
                .expectBody().returnResult();
        try {
            JsonNode body = JSON.readTree(result.getResponseBody());
            System.out.println(TAG + "GET " + LIST_URL + " " + PAGE_NUM + "=" + pageNum + " " + PAGE_SIZE + "=" + pageSize
                    + " -> " + result.getStatus() + " " + body);
            return body;
        } catch (java.io.IOException e) {
            throw new IllegalStateException("response is not JSON", e);
        }
    }

    /** Pins today's behaviour of the plan section 9 row: page 0 is a raw internal server error, not a parameter error. */
    @Test
    void pageNumZeroGivesAnInternalServerErrorThroughTheStack_pinsTheSection9Row() {
        JsonNode body = get(ZERO_PAGE, DEFAULT_PAGE_SIZE, HttpStatus.INTERNAL_SERVER_ERROR);

        assertEquals(BizError.INTERNAL_SERVER_ERROR.getBizErrorCode(), body.get("code").asInt());
        assertTrue(body.get("data") == null || body.get("data").isNull());
    }

    /** Same pin for a negative page number. */
    @Test
    void aNegativePageNumGivesTheSameInternalServerError_pinsTheSection9Row() {
        JsonNode body = get(NEGATIVE_PAGE, DEFAULT_PAGE_SIZE, HttpStatus.INTERNAL_SERVER_ERROR);

        assertEquals(BizError.INTERNAL_SERVER_ERROR.getBizErrorCode(), body.get("code").asInt());
    }

    /** Control: the name filter is passed on to the service as sent. */
    @Test
    void theNameFilterReachesTheService() {
        client.web().get().uri(uri -> uri.path(LIST_URL).queryParam(NAME_FILTER, NAME_VALUE).build())
                .exchange().expectStatus().isOk();

        Mockito.verify(libraryQueryApiService).listLibraryQueries(NAME_VALUE);
    }

    /** Control: page 1 is the first page. */
    @Test
    void pageNumOneGivesTheFirstPage() {
        JsonNode body = get(1, DEFAULT_PAGE_SIZE, HttpStatus.OK);

        assertEquals(SUCCESS_CODE, body.get("code").asInt());
        assertEquals(ITEM_COUNT, body.get("data").size());
        assertEquals(ITEM_COUNT, body.get("total").asInt());
    }

    /** Control: page size 0 takes every item, and page 0 is the only value that fails. */
    @Test
    void pageSizeZeroTakesEveryItem() {
        JsonNode body = get(1, 0, HttpStatus.OK);

        assertEquals(ITEM_COUNT, body.get("data").size());
    }

    /** Control: no parameter at all uses page 1 of size 100. */
    @Test
    void noParametersUseTheDefaults() {
        JsonNode body = get(null, null, HttpStatus.OK);

        assertEquals(ITEM_COUNT, body.get("data").size());
        assertEquals(DEFAULT_PAGE_SIZE, body.get("pageSize").asInt());
    }
}

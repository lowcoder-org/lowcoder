package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.QuerySamples;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.ApplicationQueryApiService;
import org.lowcoder.api.query.LibraryQueryApiService;
import org.lowcoder.api.query.QueryController;
import org.lowcoder.api.query.QueryEndpoints;
import org.lowcoder.api.query.view.LibraryQueryRequestFromJs;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.QueryResultView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * Codec-level tests of the 2 {@link QueryEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.1, §5.2, task T5.2), through the
 * production {@link QueryController} in the {@link ContractTestClient} harness, behind the production
 * {@code QueryExecuteHttpBodySizeFilter} with the default limits of {@link CommonConfig}, and with the query services
 * mocked.
 *
 * <p>Request: the D1 goldens of {@link QueryExecutionRequest} and {@link LibraryQueryRequestFromJs}, whose parameter
 * values are the §4.6 representative input; the request the service receives is compared by D1's rules
 * ({@link PayloadAssertions#assertBindsTo}). Response: no envelope; the controller writes a {@link QueryResultView} of
 * the service's result in the request's locale, so the body must be the view's S1 golden. One test per registry branch
 * name; both endpoints are {@code pass-through}.
 *
 * <p>Branches: {@code execute} answers the view, or on an error the global handler's answer; a {@code LOGIN_EXPIRED}
 * error also clears the session cookie, removes the session and publishes a logout first ({@code QueryController.java:50-57}).
 * {@code executeLibraryQueryFromJs} serves only a client whose address is {@code 127.0.0.1} or {@code localhost}, here
 * through {@code X-Forwarded-For} ({@code NetworkUtils#getRemoteIp}); any other client gets {@code NOT_AUTHORIZED}.
 */
class QueryEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(QueryEndpoints.class);
    static final String APPLICATION_ID = "applicationId";
    static final String SESSION_TOKEN = "QueryEndpointsContractTest.sessionToken";
    static final String LOCAL_CLIENT = "127.0.0.1";
    static final String FORWARDED_FOR = "X-Forwarded-For";
    static final String LOGIN_EXPIRED_KEY = "LOGIN_EXPIRED";
    static final String QUERY_ERROR_KEY = "QUERY_EXECUTION_ERROR";
    static final String QUERY_ERROR_ARGUMENT = "QueryEndpointsContractTest.queryError";
    /** The query body limits of a default configuration. */
    static final CommonConfig DEFAULTS = new CommonConfig();
    /** The default session cookie name of {@code application.yaml} ({@code common.cookie-name}). */
    static final String COOKIE_NAME = "LOWCODER_CE_SELFHOST_TOKEN";

    private ContractTestClient.Builder builder;
    private ApplicationQueryApiService applicationQueryApiService;
    private LibraryQueryApiService libraryQueryApiService;
    private SessionUserService sessionUserService;
    private BusinessEventPublisher businessEventPublisher;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder().queryBodySizeFilter(DEFAULTS.getMaxQueryRequestSize(), DEFAULTS.getMaxQueryResponseSize());
        applicationQueryApiService = builder.mock(ApplicationQueryApiService.class);
        libraryQueryApiService = builder.mock(LibraryQueryApiService.class);
        sessionUserService = builder.mock(SessionUserService.class);
        businessEventPublisher = Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO);
        builder.singleton("businessEventPublisher", businessEventPublisher);
        builder.singleton("cookieHelper", new CookieHelper(cookieConfig()));
    }

    /** The harness's {@link CookieHelper} has no cookie name; the session paths need production's default. */
    private static CommonConfig cookieConfig() {
        CommonConfig config = new CommonConfig();
        config.setCookieName(COOKIE_NAME);
        return config;
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(QueryEndpointsContractTest.class);
    }

    /** An application query: the request names an application and a query. */
    @Test
    void execute() {
        Mockito.when(applicationQueryApiService.executeApplicationQuery(any(), any())).thenReturn(Mono.just(QuerySamples.queryExecutionResult()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "execute", Map.of(), EndpointContract.d1(QueryExecutionRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.s1(QueryResultView.class));
            ArgumentCaptor<QueryExecutionRequest> request = ArgumentCaptor.forClass(QueryExecutionRequest.class);
            Mockito.verify(applicationQueryApiService).executeApplicationQuery(any(), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(QueryExecutionRequest.class), request.getValue());
            Mockito.verifyNoInteractions(libraryQueryApiService);
        }
    }

    /** Without an application id, the request is a library query's, with the same answer. */
    @Test
    void executeLibraryQuery() throws JsonProcessingException {
        Mockito.when(libraryQueryApiService.executeLibraryQuery(any(), any())).thenReturn(Mono.just(QuerySamples.queryExecutionResult()));
        ObjectNode request = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.d1(QueryExecutionRequest.class));
        request.remove(APPLICATION_ID);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "execute", Map.of(), PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(request));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.s1(QueryResultView.class));
            ArgumentCaptor<QueryExecutionRequest> captured = ArgumentCaptor.forClass(QueryExecutionRequest.class);
            Mockito.verify(libraryQueryApiService).executeLibraryQuery(any(), captured.capture());
            assertThat(captured.getValue().getApplicationId()).isNull();
            assertThat(captured.getValue().getLibraryQueryCombineId()).isEqualTo(((QueryExecutionRequest) PayloadSamples.of(QueryExecutionRequest.class).value())
                    .getLibraryQueryCombineId());
            Mockito.verifyNoInteractions(applicationQueryApiService);
        }
    }

    /**
     * An expired login: the session cookie is cleared, the session removed and a logout published, then the global
     * handler answers the error.
     */
    @Test
    void executeWithExpiredLogin() {
        Mockito.when(applicationQueryApiService.executeApplicationQuery(any(), any()))
                .thenReturn(Mono.error(new BizException(BizError.LOGIN_EXPIRED, LOGIN_EXPIRED_KEY)));
        Mockito.when(sessionUserService.removeUserSession(SESSION_TOKEN)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeWith(client, "execute", request -> request.cookie(COOKIE_NAME, SESSION_TOKEN), Map.of(),
                    EndpointContract.d1(QueryExecutionRequest.class));
            EndpointContract.assertBizError(result, BizError.LOGIN_EXPIRED, LOGIN_EXPIRED_KEY);
            ResponseCookie cleared = result.getResponseCookies().getFirst(COOKIE_NAME);
            System.out.println("[QueryEndpointsContractTest] cleared cookie " + cleared);
            assertThat(cleared).as("the session cookie is cleared").isNotNull();
            assertThat(cleared.getValue()).isEmpty();
            assertThat(cleared.getMaxAge()).isEqualTo(Duration.ZERO);
            Mockito.verify(sessionUserService).removeUserSession(SESSION_TOKEN);
            Mockito.verify(businessEventPublisher).publishUserLogoutEvent();
        }
    }

    /** Any other error is answered by the global handler, and the session is kept. */
    @Test
    void executeFailing() {
        Mockito.when(applicationQueryApiService.executeApplicationQuery(any(), any()))
                .thenReturn(Mono.error(new BizException(BizError.QUERY_EXECUTION_ERROR, QUERY_ERROR_KEY, QUERY_ERROR_ARGUMENT)));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "execute", Map.of(), EndpointContract.d1(QueryExecutionRequest.class));
            EndpointContract.assertBizError(result, BizError.QUERY_EXECUTION_ERROR, QUERY_ERROR_KEY, QUERY_ERROR_ARGUMENT);
            assertThat(result.getResponseCookies()).isEmpty();
            Mockito.verify(sessionUserService, Mockito.never()).removeUserSession(any());
            Mockito.verify(businessEventPublisher, Mockito.never()).publishUserLogoutEvent();
        }
    }

    /** The node service calls from the same host; the request it sends is compared by D1's rules. */
    @Test
    void executeLibraryQueryFromJs() {
        Mockito.when(libraryQueryApiService.executeLibraryQueryFromJs(any(), any())).thenReturn(Mono.just(QuerySamples.queryExecutionResult()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeWith(client, "executeLibraryQueryFromJs", request -> request.header(FORWARDED_FOR, LOCAL_CLIENT),
                    Map.of(), EndpointContract.d1(LibraryQueryRequestFromJs.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.s1(QueryResultView.class));
            ArgumentCaptor<LibraryQueryRequestFromJs> request = ArgumentCaptor.forClass(LibraryQueryRequestFromJs.class);
            Mockito.verify(libraryQueryApiService).executeLibraryQueryFromJs(any(), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(LibraryQueryRequestFromJs.class), request.getValue());
        }
    }

    /** A client without a local address (the harness request has none, and no forwarding header) is refused. */
    @Test
    void executeLibraryQueryFromJsFromAnotherHost() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "executeLibraryQueryFromJs", Map.of(),
                    EndpointContract.d1(LibraryQueryRequestFromJs.class));
            EndpointContract.assertBizError(result, BizError.NOT_AUTHORIZED, BizError.NOT_AUTHORIZED.name());
            Mockito.verifyNoInteractions(libraryQueryApiService);
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(QueryController.class).build();
    }
}

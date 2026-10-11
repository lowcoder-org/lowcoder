package org.lowcoder.api.query;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * QueryController tears the session down when a query reports LOGIN_EXPIRED. That path has the same obligation as an
 * explicit logout: expire the browser cookie too, and do it before the error signal, which skips every downstream
 * then().
 */
@ExtendWith(MockitoExtension.class)
class QueryControllerLogoutCookieTest {

    private static final String APPLICATION_ID = "app01";
    private static final String QUERY_ID = "query01";
    private static final String SESSION_TOKEN = "expired-session-token";
    private static final String COOKIE_NAME = "TEST-TOKEN";

    @Mock
    private ApplicationQueryApiService applicationQueryApiService;

    @Mock
    private LibraryQueryApiService libraryQueryApiService;

    @Mock
    private CookieHelper cookieHelper;

    @Mock
    private SessionUserService sessionUserService;

    @Mock
    private BusinessEventPublisher businessEventPublisher;

    private QueryController queryController;
    private MockServerWebExchange exchange;
    private QueryExecutionRequest request;

    @BeforeEach
    void setUp() {
        // the controller uses field injection, so there is no constructor to call
        queryController = new QueryController();
        ReflectionTestUtils.setField(queryController, "applicationQueryApiService", applicationQueryApiService);
        ReflectionTestUtils.setField(queryController, "libraryQueryApiService", libraryQueryApiService);
        ReflectionTestUtils.setField(queryController, "cookieHelper", cookieHelper);
        ReflectionTestUtils.setField(queryController, "sessionUserService", sessionUserService);
        ReflectionTestUtils.setField(queryController, "businessEventPublisher", businessEventPublisher);

        exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/api/queries/execute").build());

        request = new QueryExecutionRequest();
        request.setApplicationId(APPLICATION_ID);
        request.setQueryId(QUERY_ID);
    }

    private void givenQueryFailsWith(BizError error) {
        when(applicationQueryApiService.executeApplicationQuery(exchange, request))
                .thenReturn(Mono.error(new BizException(error, error.name())));
    }

    @Test
    void loginExpiredClearsCookieAndPropagatesError() {
        // record subscription order; Mockito's InOrder would only see assembly order, and removeUserSession is
        // invoked while the chain is being built
        List<String> effects = new ArrayList<>();
        givenQueryFailsWith(BizError.LOGIN_EXPIRED);
        doAnswer(invocation -> effects.add("clearCookie")).when(cookieHelper).clearCookie(exchange);
        when(cookieHelper.getCookieToken(exchange)).thenReturn(SESSION_TOKEN);
        when(sessionUserService.removeUserSession(SESSION_TOKEN))
                .thenReturn(Mono.fromRunnable(() -> effects.add("removeUserSession")));
        when(businessEventPublisher.publishUserLogoutEvent()).thenReturn(Mono.empty());

        StepVerifier.create(queryController.execute(exchange, request))
                .verifyErrorMatches(throwable -> throwable instanceof BizException bizException
                        && bizException.getError() == BizError.LOGIN_EXPIRED);

        verify(cookieHelper).clearCookie(exchange);
        verify(sessionUserService).removeUserSession(SESSION_TOKEN);
        assertEquals(List.of("clearCookie", "removeUserSession"), effects);
    }

    /**
     * The clearing cookie must survive the error response, so it has to be written while the response is still
     * uncommitted. Uses a real CookieHelper rather than the mock, otherwise nothing reaches the response at all.
     */
    @Test
    void loginExpiredEmitsTheClearingCookieOnTheResponse() {
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.setCookieName(COOKIE_NAME);
        ReflectionTestUtils.setField(queryController, "cookieHelper", new CookieHelper(commonConfig));

        givenQueryFailsWith(BizError.LOGIN_EXPIRED);
        // the request carries no cookie, so the real helper resolves an empty token
        when(sessionUserService.removeUserSession("")).thenReturn(Mono.empty());
        when(businessEventPublisher.publishUserLogoutEvent()).thenReturn(Mono.empty());

        StepVerifier.create(queryController.execute(exchange, request))
                .verifyError(BizException.class);

        ResponseCookie clearedCookie = exchange.getResponse().getCookies().getFirst(COOKIE_NAME);
        assertNotNull(clearedCookie);
        assertEquals("", clearedCookie.getValue());
        assertEquals(Duration.ZERO, clearedCookie.getMaxAge());
    }

    @Test
    void otherErrorsLeaveTheSessionAlone() {
        givenQueryFailsWith(BizError.NOT_AUTHORIZED);

        StepVerifier.create(queryController.execute(exchange, request))
                .verifyErrorMatches(throwable -> throwable instanceof BizException bizException
                        && bizException.getError() == BizError.NOT_AUTHORIZED);

        verify(cookieHelper, never()).clearCookie(any());
        verify(sessionUserService, never()).removeUserSession(any());
    }
}

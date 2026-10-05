package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.framework.exception.CustomErrorWebExceptionHandler;
import org.lowcoder.api.framework.exception.ApiPerfHelper;
import org.lowcoder.api.framework.service.GlobalContextService;
import org.lowcoder.api.framework.service.GlobalContextServiceImpl;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.infra.serverlog.ServerLogService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpResponse;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.result.view.ViewResolver;
import org.springframework.web.server.adapter.WebHttpHandlerBuilder;
import org.springframework.http.server.reactive.HttpHandler;

import reactor.core.publisher.Mono;

/**
 * A client-controlled {@code Referer} that {@link java.net.URI#create} rejects, through the production filter chain.
 *
 * <p>Pinned under D-6, plan §9 row "unparsable Referer breaks every request (UriUtils.getRefererURI)":
 * {@code UriUtils.getRefererURI} (UriUtils:41-47) calls {@code URI.create} on the raw header and lets the
 * IllegalArgumentException escape. Production path: {@code GlobalContextFilter.filter} builds its context map inside
 * {@code contextWrite} for EVERY request (GlobalContextFilter:111, {@code UriUtils.getRefererDomainFromRequest}), so the
 * request fails before the handler runs; the error then reaches {@code CustomErrorWebExceptionHandler}. The same call is
 * made by {@code CookieHelper.newCookieBuilder} (CookieHelper:50) for every cookie written or cleared (login, logout).
 *
 * <p>Not covered: the real {@code SecurityConfig} filters and the Netty server; the chain here is
 * {@link WebHttpHandlerBuilder} with the production {@link GlobalContextFilter} and the production
 * {@link CustomErrorWebExceptionHandler}, mocked services behind them (an anonymous visitor).
 */
class RefererFilterChainTest {

    private static final String TAG = "[RefererFilterChainTest] ";
    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final String PATH = "/api/applications/list";
    private static final String COOKIE_NAME = "LOWCODER_TOKEN_TEST";
    private static final String GOOD_REFERER = "https://app.example.com/apps";

    private final AtomicInteger handled = new AtomicInteger();
    private String lastBody;
    private HttpHandler chain;
    private CookieHelper cookieHelper;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        SessionUserService session = mock(SessionUserService.class);
        when(session.getVisitorId()).thenReturn(Mono.just(Authentication.ANONYMOUS_USER_ID));
        OrgMemberService orgMemberService = mock(OrgMemberService.class);
        when(orgMemberService.getCurrentOrgMember(anyString())).thenReturn(Mono.empty());
        CommonConfig commonConfig = new CommonConfig();
        // without a name Spring rejects the cookie before the Referer matters (IllegalArgumentException for another reason)
        commonConfig.setCookieName(COOKIE_NAME);
        cookieHelper = new CookieHelper(commonConfig);
        GlobalContextFilter filter = new GlobalContextFilter(session, orgMemberService, mock(ServerLogService.class),
                mock(GlobalContextService.class), cookieHelper);

        ObjectProvider<ViewResolver> viewResolvers = mock(ObjectProvider.class);
        when(viewResolvers.orderedStream()).thenAnswer(invocation -> Stream.<ViewResolver>empty());
        CustomErrorWebExceptionHandler errorHandler = new CustomErrorWebExceptionHandler(new DefaultErrorAttributes(),
                new WebProperties.Resources(), new ServerProperties(), new StaticApplicationContext(), viewResolvers,
                ServerCodecConfigurer.create());
        ReflectionTestUtils.setField(errorHandler, "apiPerfHelper", mock(ApiPerfHelper.class));
        ReflectionTestUtils.setField(errorHandler, "globalContextService", new GlobalContextServiceImpl());

        chain = WebHttpHandlerBuilder.webHandler(exchange -> {
            handled.incrementAndGet();
            exchange.getResponse().setStatusCode(HttpStatus.OK);
            return exchange.getResponse().setComplete();
        }).filter(filter).exceptionHandler(errorHandler).build();
    }

    private MockServerHttpResponse send(String referer) {
        MockServerHttpRequest.BaseBuilder<?> request = MockServerHttpRequest.get(PATH)
                .remoteAddress(new InetSocketAddress("127.0.0.1", 40000));
        if (referer != null) {
            request.header(HttpHeaders.REFERER, referer);
        }
        MockServerHttpResponse response = new MockServerHttpResponse(new DefaultDataBufferFactory());
        chain.handle(request.build(), response).block(WAIT);
        String body = response.getBodyAsString().defaultIfEmpty("").block(WAIT);
        lastBody = body;
        System.out.println(TAG + "Referer '" + referer + "' -> " + response.getStatusCode() + " body '" + body + "' handler calls " + handled.get());
        return response;
    }

    static Stream<String> unparsableReferers() {
        return Stream.of("http://bad host/", "<script>alert(1)</script>");
    }

    @Test
    void noReferer_andAParsableReferer_reachTheHandler() {
        assertThat(send(null).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(send(GOOD_REFERER).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(handled.get()).isEqualTo(2);
    }

    /**
     * Pins plan §9 row "unparsable Referer breaks every request": the request never reaches the handler and the client
     * gets an error status instead of the normal answer. The assertions state what the client receives (see the output
     * line of this test for the status and body).
     */
    @ParameterizedTest
    @MethodSource("unparsableReferers")
    void unparsableReferer_failsEveryRequestBeforeTheHandler_pinsTheSection9Row(String referer) {
        MockServerHttpResponse response = send(referer);

        assertThat(handled.get()).as("the handler is never reached").isZero();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(lastBody).as("generic coded error, not the answer to the request").contains("\"code\":" + BizError.INTERNAL_SERVER_ERROR.getBizErrorCode());
    }

    /** The same parse in {@code CookieHelper} (CookieHelper:50): saving or clearing the auth cookie throws. */
    @ParameterizedTest
    @MethodSource("unparsableReferers")
    void unparsableReferer_makesTheCookieHelperThrow_pinsTheSection9Row(String referer) {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(PATH).header(HttpHeaders.REFERER, referer));

        assertThatThrownBy(() -> cookieHelper.saveCookie("token", exchange)).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(referer);
        assertThatThrownBy(() -> cookieHelper.clearCookie(exchange)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining(referer);
    }

    @Test
    void cookieHelper_withAParsableReferer_marksTheCookieSecureForHttps() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(PATH).header(HttpHeaders.REFERER, GOOD_REFERER));

        cookieHelper.saveCookie("token", exchange);

        List<org.springframework.http.ResponseCookie> cookies = exchange.getResponse().getCookies().values().stream().flatMap(List::stream).toList();
        assertThat(cookies).singleElement().satisfies(c -> {
            assertThat(c.isSecure()).isTrue();
            assertThat(c.getSameSite()).isEqualTo("None");
        });
    }
}

package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
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
 * <p>BF-143 (plan §9 row "unparsable Referer breaks every request (UriUtils.getRefererURI)"), fixed: {@code UriUtils.getRefererURI}
 * called {@code URI.create} on the raw header and let the IllegalArgumentException escape, so {@code GlobalContextFilter.filter},
 * which builds its context map for EVERY request ({@code UriUtils.getRefererDomainFromRequest}), failed the request before
 * the handler with a generic 500, and {@code CookieHelper.newCookieBuilder} threw for every cookie written or cleared (login,
 * logout). An unparsable value is now treated as no Referer.
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
    /** Referer values that {@code URI.create} rejects. */
    private static final String SPACE_IN_HOST_REFERER = "http://bad host/";
    private static final String MARKUP_REFERER = "<script>alert(1)</script>";

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
        return Stream.of(SPACE_IN_HOST_REFERER, MARKUP_REFERER);
    }

    @Test
    void noReferer_andAParsableReferer_reachTheHandler() {
        assertThat(send(null).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(send(GOOD_REFERER).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(handled.get()).isEqualTo(2);
    }

    /**
     * BF-143: a request with an unparsable Referer reaches the handler and gets its normal answer, as one without a
     * Referer does (it failed before the handler with a generic 500). Catches: the parse failure escaping the filter.
     */
    @ParameterizedTest
    @MethodSource("unparsableReferers")
    void unparsableReferer_reachesTheHandlerAsWithoutARefererBF143(String referer) {
        MockServerHttpResponse response = send(referer);

        assertThat(handled.get()).as("the handler is reached").isEqualTo(1);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(lastBody).as("no error body").isEmpty();
    }

    /**
     * BF-143: with an unparsable Referer, the auth cookie is saved and cleared as without a Referer (Lax, not Secure), and
     * both carry the same matching attributes, so a logout still removes the cookie (it threw before). Catches: the cookie
     * helper still throwing, or treating the unparsable value as https.
     */
    @ParameterizedTest
    @MethodSource("unparsableReferers")
    void unparsableReferer_cookiesAreWrittenAsWithoutARefererBF143(String referer) {
        MockServerWebExchange saved = MockServerWebExchange.from(MockServerHttpRequest.get(PATH).header(HttpHeaders.REFERER, referer));
        MockServerWebExchange cleared = MockServerWebExchange.from(MockServerHttpRequest.get(PATH).header(HttpHeaders.REFERER, referer));

        cookieHelper.saveCookie("token", saved);
        cookieHelper.clearCookie(cleared);

        ResponseCookie save = onlyCookie(saved);
        ResponseCookie clear = onlyCookie(cleared);
        System.out.println(TAG + "Referer '" + referer + "' -> saved " + save + ", cleared " + clear);
        assertThat(save.isSecure()).isFalse();
        assertThat(save.getSameSite()).isEqualTo("Lax");
        assertThat(clear.getMaxAge()).isEqualTo(Duration.ZERO);
        assertThat(List.of(clear.getName(), clear.getPath(), String.valueOf(clear.getDomain()), clear.isSecure(), clear.getSameSite()))
                .isEqualTo(List.of(save.getName(), save.getPath(), String.valueOf(save.getDomain()), save.isSecure(), save.getSameSite()));
    }

    private static ResponseCookie onlyCookie(MockServerWebExchange exchange) {
        List<ResponseCookie> cookies = exchange.getResponse().getCookies().values().stream().flatMap(List::stream).toList();
        assertThat(cookies).hasSize(1);
        return cookies.get(0);
    }

    @Test
    void cookieHelper_withAParsableReferer_marksTheCookieSecureForHttps() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get(PATH).header(HttpHeaders.REFERER, GOOD_REFERER));

        cookieHelper.saveCookie("token", exchange);

        List<ResponseCookie> cookies = exchange.getResponse().getCookies().values().stream().flatMap(List::stream).toList();
        assertThat(cookies).singleElement().satisfies(c -> {
            assertThat(c.isSecure()).isTrue();
            assertThat(c.getSameSite()).isEqualTo("None");
        });
    }
}

package org.lowcoder.api.framework.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.framework.service.GlobalContextServiceImpl;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpResponse;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.result.view.ViewResolver;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.adapter.HttpWebHandlerAdapter;
import org.springframework.web.server.handler.ExceptionHandlingWebHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.MongoExecutionTimeoutException;
import com.mongodb.MongoSocketReadTimeoutException;
import com.mongodb.MongoTimeoutException;
import com.mongodb.ServerAddress;

import io.lettuce.core.RedisCommandTimeoutException;
import reactor.core.publisher.Mono;

/**
 * Tests of {@link CustomErrorWebExceptionHandler}, the handler of errors that no controller advice handles (for
 * example errors of web filters). It is built with Spring's {@code DefaultErrorAttributes} and the default server
 * codecs; {@code ApiPerfHelper} is a mock and the locale service is the production {@link GlobalContextServiceImpl}.
 *
 * <p>Pinned under D-6, plan §9 row "malformed Accept-Language makes the error handler fail (LanguageRange.parse,
 * GlobalContextServiceImpl)": a filter error (here the rate limiter's REQUEST_THROTTLED, ThrottlingFilter) reaches
 * {@code render}, whose {@code getClientLocale} (CustomErrorWebExceptionHandler:95) throws for a malformed
 * {@code Accept-Language}; the client then gets an empty HTTP 500 instead of the coded JSON error
 * ({@link #malformedAcceptLanguage_makesTheHandlerFail_andTheClientGetsAnEmpty500_pinsTheSection9Row}).
 */
class CustomErrorWebExceptionHandlerTest {

    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final ObjectMapper JSON = new ObjectMapper();

    private ApiPerfHelper apiPerfHelper;
    private CustomErrorWebExceptionHandler handler;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        apiPerfHelper = mock(ApiPerfHelper.class);
        ObjectProvider<ViewResolver> viewResolvers = mock(ObjectProvider.class);
        when(viewResolvers.orderedStream()).thenAnswer(invocation -> Stream.<ViewResolver>empty());
        handler = new CustomErrorWebExceptionHandler(new DefaultErrorAttributes(), new WebProperties.Resources(), new ServerProperties(),
                new StaticApplicationContext(), viewResolvers, ServerCodecConfigurer.create());
        ReflectionTestUtils.setField(handler, "apiPerfHelper", apiPerfHelper);
        ReflectionTestUtils.setField(handler, "globalContextService", new GlobalContextServiceImpl());
    }

    private static MockServerWebExchange exchange(String acceptLanguage) {
        MockServerHttpRequest.BaseBuilder<?> request = MockServerHttpRequest.get("/api/orders");
        if (acceptLanguage != null) {
            request.header("Accept-Language", acceptLanguage);
        }
        return MockServerWebExchange.from(request);
    }

    private JsonNode handle(MockServerWebExchange exchange, Throwable error) throws Exception {
        handler.handle(exchange, error).block(WAIT);
        MockServerHttpResponse response = exchange.getResponse();
        String text = response.getBodyAsString().block(WAIT);
        System.out.println("[CustomErrorWebExceptionHandlerTest] " + error.getClass().getSimpleName() + " -> " + response.getStatusCode() + " " + text);
        return JSON.readTree(text);
    }

    /** Catches a client error being turned into a server error: a 4xx keeps its status and reason phrase. */
    @Test
    void clientError_keepsItsStatus_withTheReasonPhraseAsMessage() throws Exception {
        MockServerWebExchange exchange = exchange(null);

        JsonNode body = handle(exchange, new ResponseStatusException(HttpStatus.NOT_FOUND, "missing"));

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(body.get("code").asInt()).isEqualTo(404);
        assertThat(body.get("message").asText()).isEqualTo("Not Found");
    }

    /** Catches a business error losing its own status, code, localised message or headers. */
    @Test
    void bizException_usesItsStatusCodeLocalisedMessageAndHeaders() throws Exception {
        MockServerWebExchange exchange = exchange("de");
        BizException error = new BizException(BizError.REQUEST_THROTTLED, "REQUEST_THROTTLED");
        error.addHeader("X-ORG-ID", "org-1");

        JsonNode body = handle(exchange, error);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(body.get("code").asInt()).isEqualTo(BizError.REQUEST_THROTTLED.getBizErrorCode());
        assertThat(body.get("message").asText()).isEqualTo(LocaleUtils.getMessage(Locale.GERMAN, "REQUEST_THROTTLED"));
        assertThat(exchange.getResponse().getHeaders().getFirst("X-ORG-ID")).isEqualTo("org-1");
        verify(apiPerfHelper).perf(any(BizError.class), any());
    }

    static Stream<Arguments> infrastructureErrors() {
        return Stream.of(
                Arguments.of(new RedisCommandTimeoutException("redis"), BizError.INFRA_REDIS_TIMEOUT, "INFRA_REDIS_TIMEOUT"),
                Arguments.of(new MongoTimeoutException("mongo"), BizError.INFRA_MONGO_TIMEOUT, "INFRA_MONGODB_TIMEOUT"),
                Arguments.of(new MongoExecutionTimeoutException(50, "mongo execution"), BizError.INFRA_MONGO_TIMEOUT, "INFRA_MONGODB_TIMEOUT"),
                Arguments.of(new MongoSocketReadTimeoutException("mongo read", new ServerAddress(), new RuntimeException("io")), BizError.INFRA_MONGO_TIMEOUT, "INFRA_MONGODB_TIMEOUT"),
                Arguments.of(new IllegalStateException("anything"), BizError.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR"));
    }

    /** Catches infrastructure timeouts being reported as a generic failure, and unknown errors leaking their message. */
    @ParameterizedTest
    @MethodSource("infrastructureErrors")
    void infrastructureErrors_mapToTheirBusinessError(Throwable error, BizError expected, String messageKey) throws Exception {
        MockServerWebExchange exchange = exchange("en");

        JsonNode body = handle(exchange, error);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.valueOf(expected.getHttpErrorCode()));
        assertThat(body.get("code").asInt()).isEqualTo(expected.getBizErrorCode());
        assertThat(body.get("message").asText()).isEqualTo(LocaleUtils.getMessage(Locale.ENGLISH, messageKey));
        verify(apiPerfHelper).perf(expected, exchange.getRequest().getPath());
    }

    /**
     * Pins plan §9 row "malformed Accept-Language makes the error handler fail (LanguageRange.parse,
     * GlobalContextServiceImpl)": the handler's own Mono fails with IllegalArgumentException, and behind Spring's
     * exception handling chain the client receives an HTTP 500 with an empty body, not the coded JSON error. The same
     * filter error with a valid header answers the 429 JSON.
     */
    @Test
    void malformedAcceptLanguage_makesTheHandlerFail_andTheClientGetsAnEmpty500_pinsTheSection9Row() {
        BizException throttled = new BizException(BizError.REQUEST_THROTTLED, "REQUEST_THROTTLED");
        var failing = handler.handle(exchange("not !! a language"), throttled);
        org.reactivestreams.Publisher<Void> publisher = failing;
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> Mono.from(publisher).block(WAIT)).isInstanceOf(IllegalArgumentException.class);

        HttpWebHandlerAdapter chain = new HttpWebHandlerAdapter(new ExceptionHandlingWebHandler(exchange -> Mono.error(throttled), List.of(handler)));

        MockServerHttpResponse malformed = new MockServerHttpResponse(new org.springframework.core.io.buffer.DefaultDataBufferFactory());
        chain.handle(MockServerHttpRequest.get("/api/orders").header("Accept-Language", "not !! a language").build(), malformed).block(WAIT);
        String malformedBody = malformed.getBodyAsString().defaultIfEmpty("").block(WAIT);
        System.out.println("[CustomErrorWebExceptionHandlerTest] malformed Accept-Language -> " + malformed.getStatusCode() + " body '" + malformedBody + "'");
        assertThat(malformed.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(malformedBody).isEmpty();

        MockServerHttpResponse valid = new MockServerHttpResponse(new org.springframework.core.io.buffer.DefaultDataBufferFactory());
        chain.handle(MockServerHttpRequest.get("/api/orders").header("Accept-Language", "en").build(), valid).block(WAIT);
        System.out.println("[CustomErrorWebExceptionHandlerTest] valid Accept-Language -> " + valid.getStatusCode());
        assertThat(valid.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }
}

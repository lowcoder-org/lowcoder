package org.lowcoder.api.framework.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Method;
import java.util.Locale;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.constants.GlobalContext;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.exception.ServerException;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebInputException;

import java.util.concurrent.TimeoutException;

import reactor.core.publisher.Mono;
import reactor.util.context.Context;

/**
 * Tests of {@link GlobalExceptionHandler}: every handler is called directly with a {@code MockServerWebExchange} and
 * a Reactor context carrying the client locale; the {@link ApiPerfHelper} is a mock. Complements
 * {@code ErrorCasesContractTest}, which only reaches the handlers through controllers.
 *
 * <p>Pinned (no §9 row): {@code catchWebExchangeBindException} casts every binding error to {@code FieldError}, so a
 * global (non-field) error throws a ClassCastException; no request DTO of the server can produce one (no class-level
 * constraint, {@code @AssertTrue}, custom validator or {@code reject(...)} exists in the main sources of any module;
 * the {@code @Valid} bodies are {@code CreateGroupRequest}, {@code UpdateGroupRequest}, {@code Organization},
 * {@code UpdateOrgRequest} and {@code UpsertDatasourceRequest}, with field constraints only).
 */
class GlobalExceptionHandlerTest {

    private ApiPerfHelper apiPerfHelper;
    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        apiPerfHelper = mock(ApiPerfHelper.class);
        handler = new GlobalExceptionHandler();
        ReflectionTestUtils.setField(handler, "apiPerfHelper", apiPerfHelper);
    }

    private static MockServerWebExchange exchange(String path) {
        return MockServerWebExchange.from(MockServerHttpRequest.get(path).build());
    }

    private static ResponseView<?> body(Mono<ResponseView<?>> mono, Locale locale) {
        ResponseView<?> view = mono.contextWrite(Context.of(GlobalContext.CLIENT_LOCALE, locale)).block();
        assertThat(view).isNotNull();
        System.out.println("[GlobalExceptionHandlerTest] code " + view.getCode() + " message '" + view.getMessage() + "'");
        return view;
    }

    private static MethodParameter parameter() throws NoSuchMethodException {
        Method method = GlobalExceptionHandlerTest.class.getDeclaredMethod("someEndpoint", String.class);
        return new MethodParameter(method, 0);
    }

    @SuppressWarnings("unused")
    private void someEndpoint(String name) {
    }

    /** Catches the exception's status, code, localised message, headers and the perf count being lost. */
    @Test
    void bizException_usesItsStatusCodeMessageAndHeaders() {
        MockServerWebExchange exchange = exchange("/api/orders");
        BizException error = new BizException(BizError.REQUEST_THROTTLED, "REQUEST_THROTTLED");
        error.addHeader("X-ORG-ID", "org-1");

        ResponseView<?> view = body(handler.catchBizException(error, exchange), Locale.GERMAN);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(view.getCode()).isEqualTo(BizError.REQUEST_THROTTLED.getBizErrorCode());
        assertThat(view.getMessage()).isEqualTo(LocaleUtils.getMessage(Locale.GERMAN, "REQUEST_THROTTLED"));
        assertThat(exchange.getResponse().getHeaders().getFirst("X-ORG-ID")).isEqualTo("org-1");
        verify(apiPerfHelper).perf(BizError.REQUEST_THROTTLED, exchange.getRequest().getPath());
    }

    @Test
    void bizException_withoutHeaders_addsNone() {
        MockServerWebExchange exchange = exchange("/api/orders");

        body(handler.catchBizException(new BizException(BizError.USER_BANNED, "USER_BANNED"), exchange), Locale.ENGLISH);

        assertThat(exchange.getResponse().getHeaders()).doesNotContainKey("X-ORG-ID");
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void timeoutException_answersThePluginTimeout() {
        MockServerWebExchange exchange = exchange("/api/query");

        ResponseView<?> view = body(handler.catchTimeoutException(new TimeoutException("slow"), exchange), Locale.ENGLISH);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.GATEWAY_TIMEOUT);
        assertThat(view.getCode()).isEqualTo(BizError.PLUGIN_EXECUTION_TIMEOUT_WITHOUT_TIME.getBizErrorCode());
        assertThat(view.getMessage()).isEqualTo(LocaleUtils.getMessage(Locale.ENGLISH, "PLUGIN_EXECUTION_TIMEOUT_WITHOUT_TIME"));
        verify(apiPerfHelper).perf(BizError.PLUGIN_EXECUTION_TIMEOUT_WITHOUT_TIME, exchange.getRequest().getPath());
    }

    /** Catches field errors being dropped from the message: every field and its default message is listed. */
    @Test
    void bindException_listsEveryFieldError() throws Exception {
        MockServerWebExchange exchange = exchange("/api/groups");
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "request");
        result.addError(new FieldError("request", "name", "must not be blank"));
        result.addError(new FieldError("request", "size", "must be positive"));

        ResponseView<?> view = body(handler.catchWebExchangeBindException(new WebExchangeBindException(parameter(), result), exchange), Locale.ENGLISH);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(view.getCode()).isEqualTo(BizError.INVALID_PARAMETER.getBizErrorCode());
        assertThat(view.getMessage()).contains("name=must not be blank").contains("size=must be positive");
        verify(apiPerfHelper).perf(BizError.INVALID_PARAMETER, exchange.getRequest().getPath());
    }

    /** Pins today's behaviour (no §9 row, see the class comment): a global binding error is a ClassCastException. */
    @Test
    void bindException_withAGlobalError_throwsClassCast() throws Exception {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "request");
        result.addError(new ObjectError("request", "class level failure"));

        assertThatThrownBy(() -> handler.catchWebExchangeBindException(new WebExchangeBindException(parameter(), result), exchange("/api/x")))
                .isInstanceOf(ClassCastException.class);
        System.out.println("[GlobalExceptionHandlerTest] global binding error -> ClassCastException");
    }

    /** Catches the reason formats: the exception's reason without a parameter, `parameter' : Class.method` with one. */
    @Test
    void serverWebInputException_namesTheParameterOrTheReason() throws Exception {
        MockServerWebExchange plain = exchange("/api/x");
        ResponseView<?> withoutParameter = body(handler.catchServerWebInputException(new ServerWebInputException("bad body"), plain), Locale.ENGLISH);
        assertThat(plain.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(withoutParameter.getCode()).isEqualTo(BizError.INVALID_PARAMETER.getBizErrorCode());
        assertThat(withoutParameter.getMessage()).isEqualTo(LocaleUtils.getMessage(Locale.ENGLISH, "INVALID_PARAMETER_PLZ_CHECK", "bad body"));

        MockServerWebExchange withParameterExchange = exchange("/api/x");
        ResponseView<?> withParameter = body(handler.catchServerWebInputException(new ServerWebInputException("bad", parameter()), withParameterExchange), Locale.ENGLISH);
        assertThat(withParameter.getMessage()).contains("' : GlobalExceptionHandlerTest.someEndpoint").doesNotContain("bad body");
        verify(apiPerfHelper, org.mockito.Mockito.times(2)).perf(eq(BizError.INVALID_PARAMETER), any());
    }

    @Test
    void pluginException_answers500WithTheLocalisedPluginMessage() {
        MockServerWebExchange exchange = exchange("/api/query");
        PluginException error = new PluginException(PluginCommonError.QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", "boom");

        ResponseView<?> view = body(handler.catchPluginException(error, exchange), Locale.ENGLISH);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(view.getCode()).isEqualTo(500);
        assertThat(view.getMessage()).isEqualTo("Query execution error: boom.");
        verify(apiPerfHelper).perf(PluginCommonError.QUERY_EXECUTION_ERROR, exchange.getRequest().getPath());
    }

    /** Catches the server exception message being localised or replaced: it is returned raw. */
    @Test
    void serverException_answers500WithTheRawMessage() {
        MockServerWebExchange exchange = exchange("/api/x");

        ResponseView<?> view = body(handler.catchServerException(new ServerException("raw {0}", "detail"), exchange), Locale.GERMAN);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(view.getCode()).isEqualTo(BizError.INTERNAL_SERVER_ERROR.getBizErrorCode());
        assertThat(view.getMessage()).isEqualTo(new ServerException("raw {0}", "detail").getMessage());
        verify(apiPerfHelper).perf(BizError.INTERNAL_SERVER_ERROR, exchange.getRequest().getPath());
    }

    /** Catches plugin endpoint errors losing their status or path, and other paths keeping the exception's status. */
    @Test
    void responseStatusException_underThePluginsPath_keepsItsStatus_andAppendsThePath() {
        String path = NewUrl.PLUGINS_URL + "/demo/items";
        MockServerWebExchange exchange = exchange(path);
        ResponseStatusException error = new ResponseStatusException(HttpStatus.NOT_FOUND, "no such item");

        ResponseView<?> view = body(handler.catchResponseStatusException(error, exchange), Locale.ENGLISH);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(view.getCode()).isEqualTo(BizError.PLUGIN_ENDPOINT_ERROR.getBizErrorCode());
        assertThat(view.getMessage()).isEqualTo(error.getMessage() + " - path: " + path);
        verify(apiPerfHelper).perf(BizError.PLUGIN_ENDPOINT_ERROR, exchange.getRequest().getPath());
    }

    @Test
    void responseStatusException_elsewhere_fallsToTheGeneric500() {
        MockServerWebExchange exchange = exchange("/api/orders");

        ResponseView<?> view = body(handler.catchResponseStatusException(new ResponseStatusException(HttpStatus.NOT_FOUND, "x"), exchange), Locale.ENGLISH);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(view.getCode()).isEqualTo(BizError.INTERNAL_SERVER_ERROR.getBizErrorCode());
        assertThat(view.getMessage()).isEqualTo(LocaleUtils.getMessage(Locale.ENGLISH, "INTERNAL_SERVER_ERROR"));
    }

    /** Catches an unexpected exception leaking its message: the generic localised text is returned. */
    @Test
    void anyOtherException_answersTheGeneric500() {
        MockServerWebExchange exchange = exchange("/api/x");

        ResponseView<?> view = body(handler.catchException(new IllegalStateException("secret detail"), exchange), Locale.GERMAN);

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(view.getCode()).isEqualTo(BizError.INTERNAL_SERVER_ERROR.getBizErrorCode());
        assertThat(view.getMessage()).isEqualTo(LocaleUtils.getMessage(Locale.GERMAN, "INTERNAL_SERVER_ERROR")).doesNotContain("secret detail");
        verify(apiPerfHelper).perf(BizError.INTERNAL_SERVER_ERROR, exchange.getRequest().getPath());
    }
}

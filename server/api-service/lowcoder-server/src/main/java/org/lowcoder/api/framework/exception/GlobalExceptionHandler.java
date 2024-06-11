package org.lowcoder.api.framework.exception;

import static org.lowcoder.api.framework.view.ResponseView.error;
import static org.lowcoder.sdk.util.LocaleUtils.getLocale;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.util.LogUtils;
import org.lowcoder.sdk.exception.BaseException;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.exception.ServerException;
import org.lowcoder.sdk.util.LocaleUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;

import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final Logger mainLog = LoggerFactory.getLogger(getClass());
    private final Logger queryErrorLog = LoggerFactory.getLogger("queryError");

    @Autowired
    private ApiPerfHelper apiPerfHelper;

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseView<?>> catchBizException(BizException e, ServerWebExchange exchange) {

        exchange.getResponse().setStatusCode(HttpStatus.resolve(e.getHttpStatus()));

        return Mono.deferContextual(ctx -> {
            apiPerfHelper.perf(e.getError(), exchange.getRequest().getPath());
            doLog(e, ctx, e.getError().logVerbose());
            Locale locale = getLocale(ctx);
            if (e.getHeaders() != null && !e.getHeaders().isEmpty()) {
                exchange.getResponse().getHeaders().addAll(e.getHeaders());
            }
            return Mono.just(error(e.getBizErrorCode(), e.getMessage(locale)));
        });
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseView<?>> catchTimeoutException(TimeoutException e, ServerWebExchange exchange) {
        BizError bizError = BizError.PLUGIN_EXECUTION_TIMEOUT_WITHOUT_TIME;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(bizError.getHttpErrorCode()));
        return Mono.deferContextual(ctx -> {
            apiPerfHelper.perf(bizError, exchange.getRequest().getPath());
            doLog(e, ctx, bizError.logVerbose());
            Locale locale = getLocale(ctx);
            return Mono.just(error(bizError.getBizErrorCode(), LocaleUtils.getMessage(locale, "PLUGIN_EXECUTION_TIMEOUT_WITHOUT_TIME")));
        });
    }

    @ExceptionHandler(WebExchangeBindException.class)
    @ResponseBody
    public Mono<ResponseView<?>> catchWebExchangeBindException(WebExchangeBindException exc, ServerWebExchange exchange) {
        BizError bizError = BizError.INVALID_PARAMETER;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(bizError.getHttpErrorCode()));
        apiPerfHelper.perf(bizError, exchange.getRequest().getPath());
        Map<String, String> errors = new HashMap<>();
        exc.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return Mono.deferContextual(ctx -> {
            Locale locale = getLocale(ctx);
            return Mono.just(error(bizError.getBizErrorCode(), LocaleUtils.getMessage(locale, "INVALID_PARAMETER", errors.toString())));
        });
    }


    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseView<?>> catchServerWebInputException(ServerWebInputException e, ServerWebExchange exchange) {
        BizError bizError = BizError.INVALID_PARAMETER;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(bizError.getHttpErrorCode()));
        return Mono.deferContextual(ctx -> {
            apiPerfHelper.perf(bizError, exchange.getRequest().getPath());
            doLog(e, ctx, bizError.logVerbose());
            String reason = e.getReason();
            if (e.getMethodParameter() != null) {
                reason = e.getMethodParameter().getParameterName() + "' : " + e.getMethodParameter().getContainingClass().getSimpleName() + (
                        e.getMethodParameter().getMethod() != null ? "." + e.getMethodParameter().getMethod().getName() : "");
            }
            Locale locale = getLocale(ctx);
            return Mono.just(error(bizError.getBizErrorCode(), LocaleUtils.getMessage(locale, "INVALID_PARAMETER_PLZ_CHECK", reason)));
        });
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseView<?>> catchPluginException(PluginException e, ServerWebExchange exchange) {
        PluginError pluginError = e.getError();
        exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
        return Mono.deferContextual(ctx -> {
            apiPerfHelper.perf(pluginError, exchange.getRequest().getPath());
            doLog(e, ctx, pluginError.logVerbose(), queryErrorLog);
            Locale locale = getLocale(ctx);
            return Mono.just(error(500, e.getLocaleMessage(locale)));
        });
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseView<?>> catchServerException(ServerException e, ServerWebExchange exchange) {
        BizError bizError = BizError.INTERNAL_SERVER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(bizError.getHttpErrorCode()));
        return Mono.deferContextual(ctx -> {
            apiPerfHelper.perf(bizError, exchange.getRequest().getPath());
            doLog(e, ctx, bizError.logVerbose());
            return Mono.just(error(bizError.getBizErrorCode(), e.getMessage()));
        });
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseView<?>> catchException(java.lang.Exception e, ServerWebExchange exchange) {
        BizError bizError = BizError.INTERNAL_SERVER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(bizError.getHttpErrorCode()));
        return Mono.deferContextual(ctx -> {
            apiPerfHelper.perf(bizError, exchange.getRequest().getPath());
            doLog(e, ctx, bizError.logVerbose());
            Locale locale = getLocale(ctx);
            return Mono.just(error(bizError.getBizErrorCode(), LocaleUtils.getMessage(locale, "INTERNAL_SERVER_ERROR")));
        });
    }

    private void doLog(Throwable error, ContextView ctx, boolean logVerbose) {
        doLog(error, ctx, logVerbose, mainLog);
    }

    private void doLog(Throwable error, ContextView ctx, boolean logVerbose, Logger logger) {
        if (!(error instanceof BaseException)) {
            LogUtils.logOnError(error, (ex) -> mainLog.error("", ex), ctx);
            return;
        }

        if (logVerbose) {
            LogUtils.logOnError(error, (ex) -> logger.error("", ex), ctx);
        } else {
            LogUtils.logOnError(error, (ex) -> logger.error("oops, {}", ex.getMessage()), ctx);
        }
    }


}

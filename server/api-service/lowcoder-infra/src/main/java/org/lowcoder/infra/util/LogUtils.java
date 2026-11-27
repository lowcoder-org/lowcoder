package org.lowcoder.infra.util;

import jakarta.annotation.Nullable;
import org.slf4j.MDC;
import reactor.core.publisher.Signal;
import reactor.core.publisher.SignalType;
import reactor.util.context.Context;
import reactor.util.context.ContextView;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;

public class LogUtils {

    public static final String CONTEXT_MAP = "context-map";

    private static final char LINE_BREAK_REPLACEMENT = '_';

    /**
     * Renders a request-derived value for one log line: a carriage return or line feed would start a new,
     * forged-looking line, so each of them is replaced by {@value #LINE_BREAK_REPLACEMENT}.
     * <p>
     * Limits: only CR and LF are replaced (TAB, ESC, U+0085 and U+2028/U+2029 are kept), and the other log calls
     * of the application keep printing their arguments raw. Use it for values inside one line, not for structured output.
     */
    public static String neutralize(@Nullable Object value) {
        return String.valueOf(value).replace('\r', LINE_BREAK_REPLACEMENT).replace('\n', LINE_BREAK_REPLACEMENT);
    }

    public static Function<Context, Context> putLogContext(String key, String value) {
        return ctx -> {
            Optional<Map<String, String>> optionalContextMap = ctx.getOrEmpty(CONTEXT_MAP);

            if (optionalContextMap.isPresent()) {
                optionalContextMap.get().put(key, value);
                return ctx;
            }

            Map<String, String> ctxMap = new HashMap<>();
            ctxMap.put(key, value);

            return ctx.put(CONTEXT_MAP, ctxMap);
        };
    }

    public static <T> Consumer<Signal<T>> logOnNext(Consumer<T> log) {
        return signal -> {
            if (signal.getType() != SignalType.ON_NEXT) {
                return;
            }

            Optional<Map<String, String>> maybeContextMap = signal.getContextView().getOrEmpty(CONTEXT_MAP);

            if (maybeContextMap.isEmpty()) {
                log.accept(signal.get());
                return;
            }

            MDC.setContextMap(maybeContextMap.get());
            try {
                log.accept(signal.get());
            } finally {
                MDC.clear();
            }
        };
    }

    public static <T> Consumer<Signal<T>> logOnError(Consumer<Throwable> log) {
        return signal -> {
            if (!signal.isOnError()) {
                return;
            }

            logOnError(signal.getThrowable(), log, signal.getContextView());
        };
    }

    public static void logOnError(Throwable throwable, Consumer<Throwable> logConsumer, ContextView ctx) {
        Optional<Map<String, String>> maybeContextMap = ctx.getOrEmpty(CONTEXT_MAP);

        if (maybeContextMap.isEmpty()) {
            logConsumer.accept(throwable);
            return;
        }

        MDC.setContextMap(maybeContextMap.get());
        try {
            logConsumer.accept(throwable);
        } finally {
            MDC.clear();
        }
    }

}
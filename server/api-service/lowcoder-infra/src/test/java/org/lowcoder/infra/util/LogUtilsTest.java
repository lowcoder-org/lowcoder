package org.lowcoder.infra.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

/** The Reactor to MDC bridge of {@link LogUtils}: the log context map travels in the Reactor context. */
class LogUtilsTest {

    private static final String KEY = "traceId";
    private static final String CALLER_KEY = "callerEntry";

    @BeforeEach
    @AfterEach
    void cleanMdc() {
        MDC.clear();
    }

    @Test
    void putLogContextCreatesTheContextMapWhenAbsent() {
        Context result = LogUtils.putLogContext(KEY, "t1").apply(Context.empty());

        Map<String, String> map = result.get(LogUtils.CONTEXT_MAP);
        assertThat(map).containsExactly(Map.entry(KEY, "t1"));
    }

    @Test
    void putLogContextMutatesTheExistingMapAndReturnsTheSameContext() {
        Map<String, String> existing = new HashMap<>(Map.of("a", "1"));
        Context context = Context.of(LogUtils.CONTEXT_MAP, existing);

        Context result = LogUtils.putLogContext(KEY, "t1").apply(context);

        assertThat(result).isSameAs(context);
        assertThat(existing).containsEntry("a", "1").containsEntry(KEY, "t1");
    }

    @Test
    void logOnNextRunsTheConsumerWithTheContextMapAsMdcAndClearsItAfterwards() {
        List<String> seen = new ArrayList<>();

        String value = Mono.just("x")
                .doOnEach(LogUtils.logOnNext(v -> seen.add(v + ":" + MDC.get(KEY))))
                .contextWrite(LogUtils.putLogContext(KEY, "t1"))
                .block();

        assertThat(value).isEqualTo("x");
        assertThat(seen).containsExactly("x:t1");
        assertThat(MDC.get(KEY)).as("the MDC is cleared after the consumer").isNull();
        System.out.println("[LogUtilsTest] consumer saw " + seen);
    }

    @Test
    void logOnNextClearsTheMdcAlsoWhenTheConsumerThrows() {
        Mono<String> mono = Mono.just("x")
                .doOnEach(LogUtils.logOnNext(v -> {
                    throw new IllegalStateException("log failed: " + MDC.get(KEY));
                }))
                .contextWrite(LogUtils.putLogContext(KEY, "t1"));

        assertThatThrownBy(mono::block).hasMessageContaining("log failed: t1");
        assertThat(MDC.get(KEY)).isNull();
    }

    @Test
    void logOnNextWithoutAContextMapRunsTheConsumerWithoutTouchingTheMdc() {
        List<String> seen = new ArrayList<>();
        MDC.put(CALLER_KEY, "kept");

        Mono.just("x").doOnEach(LogUtils.logOnNext(v -> seen.add(String.valueOf(MDC.get(KEY))))).block();

        assertThat(seen).containsExactly("null");
        assertThat(MDC.get(CALLER_KEY)).as("without a context map nothing is cleared").isEqualTo("kept");
    }

    @Test
    void logOnNextIgnoresSignalsThatAreNotOnNext() {
        List<String> seen = new ArrayList<>();

        Mono.<String>empty().doOnEach(LogUtils.logOnNext(seen::add)).block();
        Mono.<String>error(new IllegalStateException("boom")).doOnEach(LogUtils.logOnNext(seen::add)).onErrorResume(e -> Mono.empty()).block();

        assertThat(seen).isEmpty();
    }

    /** Documents today's behaviour: the MDC is cleared completely, so entries the caller had set are lost too. */
    @Test
    void clearingTheMdcAfterwardsAlsoWipesTheEntriesTheCallerHadSet() {
        MDC.put(CALLER_KEY, "set before");

        Mono.just("x").doOnEach(LogUtils.logOnNext(v -> { })).contextWrite(LogUtils.putLogContext(KEY, "t1")).block();

        assertThat(MDC.get(CALLER_KEY)).isNull();
    }

    @Test
    void logOnErrorRunsTheConsumerForErrorSignalsWithTheContextMapOnly() {
        List<String> seen = new ArrayList<>();
        IllegalStateException failure = new IllegalStateException("boom");

        Mono.<String>error(failure)
                .doOnEach(LogUtils.logOnError(t -> seen.add(t.getMessage() + ":" + MDC.get(KEY))))
                .contextWrite(LogUtils.putLogContext(KEY, "t1"))
                .onErrorResume(e -> Mono.empty())
                .block();
        Mono.just("fine").doOnEach(LogUtils.logOnError(t -> seen.add("unexpected"))).block();

        assertThat(seen).containsExactly("boom:t1");
        assertThat(MDC.get(KEY)).isNull();
    }

    @Test
    void directLogOnErrorSetsTheMdcOnlyWhenTheContextHasAMapAndClearsItEvenWhenTheConsumerThrows() {
        List<String> seen = new ArrayList<>();
        Throwable failure = new IllegalStateException("boom");

        LogUtils.logOnError(failure, t -> seen.add("with:" + MDC.get(KEY)), Context.of(LogUtils.CONTEXT_MAP, Map.of(KEY, "t2")));
        LogUtils.logOnError(failure, t -> seen.add("without:" + MDC.get(KEY)), Context.empty());

        assertThat(seen).containsExactly("with:t2", "without:null");
        assertThat(MDC.get(KEY)).isNull();

        assertThatThrownBy(() -> LogUtils.logOnError(failure, t -> {
            throw new IllegalArgumentException("consumer failed");
        }, Context.of(LogUtils.CONTEXT_MAP, Map.of(KEY, "t3")))).hasMessage("consumer failed");
        assertThat(MDC.get(KEY)).isNull();
    }
}

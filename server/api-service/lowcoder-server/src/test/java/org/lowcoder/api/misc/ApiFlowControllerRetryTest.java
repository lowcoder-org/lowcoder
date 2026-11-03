package org.lowcoder.api.misc;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import reactor.core.publisher.Mono;
import reactor.util.retry.RetryBackoffSpec;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * NEW-45 (T179): the retry of a relayed flow request, {@link ApiFlowController#retrySpec}. A request without
 * {@code timeout} gets a minimum backoff of {@code HTTP_TIMEOUT} read as milliseconds, 10 s (before, it was read as seconds,
 * about 2.8 h); an explicit {@code timeout} stays seconds.
 *
 * <p>The spec's {@code maxAttempts} and {@code minBackoff} are public final fields of Reactor's {@link RetryBackoffSpec}
 * (reactor-core 3.6.4). Limits: no timed retry is run, so the delays themselves are not tested; the expected default is
 * written here as {@link #EXPECTED_DEFAULT_BACKOFF}, not read from the production constant.
 */
class ApiFlowControllerRetryTest {

    private static final String TAG = "[ApiFlowControllerRetryTest]";
    private static final String PATH = "ApiFlowControllerRetryTest.path";
    private static final String METHOD = "post";
    private static final int RETRIES = 3;
    private static final int NO_RETRIES = 0;
    private static final int ONE_SECOND = 1;
    private static final int THIRTY_SECONDS = 30;
    /** {@code HTTP_TIMEOUT} is 10000 ms; the default backoff is that many milliseconds, 10 s. */
    private static final Duration EXPECTED_DEFAULT_BACKOFF = Duration.ofSeconds(10);
    private static final String UPSTREAM_MESSAGE = "ApiFlowControllerRetryTest.upstream-failure";

    private static FlowRequest request(Integer timeout, Integer retries) {
        return new FlowRequest(PATH, METHOD, Map.of(), Map.of(), timeout, retries);
    }

    private static RetryBackoffSpec specOf(Integer timeout, Integer retries) {
        FlowRequest request = request(timeout, retries);
        RetryBackoffSpec spec = ApiFlowController.retrySpec(request);
        System.out.println(TAG + " " + request + " -> maxAttempts " + spec.maxAttempts + ", minBackoff " + spec.minBackoff);
        return spec;
    }

    @Test
    void retriesWithoutTimeoutBackOffTenSeconds() {
        RetryBackoffSpec spec = specOf(null, RETRIES);
        assertThat(spec.maxAttempts).as("maxAttempts").isEqualTo(RETRIES);
        assertThat(spec.minBackoff).as("minBackoff of a request without timeout").isEqualTo(EXPECTED_DEFAULT_BACKOFF);
    }

    @Test
    void noRetriesAndNoTimeout() {
        RetryBackoffSpec spec = specOf(null, null);
        assertThat(spec.maxAttempts).as("maxAttempts without retries").isEqualTo(NO_RETRIES);
        assertThat(spec.minBackoff).as("minBackoff of a request without timeout").isEqualTo(EXPECTED_DEFAULT_BACKOFF);
    }

    /** 30 is not the default's 10, so a default that replaced the explicit value would show. */
    @ParameterizedTest
    @ValueSource(ints = {ONE_SECOND, THIRTY_SECONDS})
    void anExplicitTimeoutIsReadAsSeconds(int seconds) {
        RetryBackoffSpec spec = specOf(seconds, RETRIES);
        assertThat(spec.maxAttempts).as("maxAttempts").isEqualTo(RETRIES);
        assertThat(spec.minBackoff).as("minBackoff of timeout " + seconds).isEqualTo(Duration.ofSeconds(seconds));
    }

    @Test
    void anExhaustedRetryAnswersFlowError() {
        RetryBackoffSpec spec = specOf(null, NO_RETRIES);
        assertThatThrownBy(() -> Mono.error(new IllegalStateException(UPSTREAM_MESSAGE)).retryWhen(spec).block())
                .as("the answer once the retries are exhausted")
                .isInstanceOfSatisfying(BizException.class, e -> {
                    System.out.println(TAG + " exhausted: " + e.getError() + " / " + e.getMessage());
                    assertThat(e.getError()).as("error").isEqualTo(BizError.FLOW_ERROR);
                    assertThat(e.getMessage()).as("message").contains(UPSTREAM_MESSAGE);
                });
    }

    // ------------------------------------------------------------------ NEW-92 (P6): the bounds and the relay deadline

    private static final int EXPECTED_MAX_RETRIES = 3;
    private static final int EXPECTED_MAX_TIMEOUT = 10;
    private static final Duration EXPECTED_DEADLINE = Duration.ofSeconds(60);
    private static final String EXPECTED_DEADLINE_MESSAGE = "the flow relay did not answer within 60 s";
    private static final String ANSWER = "ApiFlowControllerRetryTest.answer";
    private static final int ZERO_TIMEOUT = 0;
    private static final Duration ZERO_BACKOFF_WAIT = Duration.ofSeconds(10);

    static java.util.stream.Stream<org.junit.jupiter.params.provider.Arguments> boundaryValues() {
        return java.util.stream.Stream.of(
                org.junit.jupiter.params.provider.Arguments.of(0, 0, Duration.ZERO),
                org.junit.jupiter.params.provider.Arguments.of(EXPECTED_MAX_TIMEOUT, EXPECTED_MAX_RETRIES, Duration.ofSeconds(EXPECTED_MAX_TIMEOUT)),
                org.junit.jupiter.params.provider.Arguments.of(null, null, EXPECTED_DEFAULT_BACKOFF));
    }

    /** The edges of the accepted range, and no value at all, are in range and give the spec they gave before. */
    @ParameterizedTest(name = "timeout {0}, retries {1}")
    @org.junit.jupiter.params.provider.MethodSource("boundaryValues")
    void boundaryValuesAreAcceptedNEW92(Integer timeout, Integer retries, Duration expectedBackoff) {
        RetryBackoffSpec spec = specOf(timeout, retries);
        assertThat(ApiFlowController.outOfRangeParameter(request(timeout, retries))).as("the field out of range").isNull();
        assertThat(spec.maxAttempts).as("maxAttempts").isEqualTo(retries == null ? NO_RETRIES : retries);
        assertThat(spec.minBackoff).as("minBackoff").isEqualTo(expectedBackoff);
    }

    /** A zero timeout is a zero minimum backoff: the retries run at once and the run ends in FLOW_ERROR after the last. */
    @Test
    void aZeroTimeoutRetriesWithoutWaitingAndEndsInFlowErrorNEW92() {
        RetryBackoffSpec spec = specOf(ZERO_TIMEOUT, RETRIES);
        assertThat(spec.minBackoff).as("minBackoff").isEqualTo(Duration.ZERO);
        assertThat(spec.maxAttempts).as("maxAttempts").isEqualTo(RETRIES);
        java.util.concurrent.atomic.AtomicInteger subscriptions = new java.util.concurrent.atomic.AtomicInteger();
        Mono<Object> failing = Mono.defer(() -> {
            subscriptions.incrementAndGet();
            return Mono.error(new IllegalStateException(UPSTREAM_MESSAGE));
        });
        assertThatThrownBy(() -> failing.retryWhen(spec).block(ZERO_BACKOFF_WAIT))
                .isInstanceOfSatisfying(BizException.class, e -> {
                    System.out.println(TAG + " zero timeout: " + subscriptions + " subscriptions, " + e.getError() + " / " + e.getMessage());
                    assertThat(e.getError()).as("error").isEqualTo(BizError.FLOW_ERROR);
                });
        assertThat(subscriptions).as("subscriptions: the first attempt and the retries").hasValue(RETRIES + 1);
    }

    @Test
    void theRelayDeadlineAnswersFlowErrorNEW92() {
        reactor.test.StepVerifier.withVirtualTime(() -> ApiFlowController.withinDeadline(Mono.never()))
                .expectSubscription()
                .expectNoEvent(EXPECTED_DEADLINE.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .expectErrorSatisfies(error -> {
                    System.out.println(TAG + " deadline: " + error);
                    assertThat(error).isInstanceOfSatisfying(BizException.class, e -> {
                        assertThat(e.getError()).as("error").isEqualTo(BizError.FLOW_ERROR);
                        assertThat(e.getArgs()).as("arguments").containsExactly(EXPECTED_DEADLINE_MESSAGE);
                    });
                })
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void aRelayFasterThanTheDeadlinePassesThroughNEW92() {
        String answer = ApiFlowController.withinDeadline(Mono.just(ANSWER)).block(Duration.ofSeconds(5));
        System.out.println(TAG + " a relay faster than the deadline answered " + answer);
        assertThat(answer).as("answer").isEqualTo(ANSWER);
    }
}

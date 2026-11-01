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
}

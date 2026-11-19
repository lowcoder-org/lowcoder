package org.lowcoder.api.misc;

import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.ok;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.api.subscription.WorkspaceSeatSyncService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * NEW-92 (P6): {@link ApiFlowController#flow} refuses a {@code retries} outside 0 to 3 or a {@code timeout} outside 0 to 10
 * seconds with INVALID_PARAMETER naming the field, before any client is built, on the relay path and on the seat-sync path,
 * and ends a relay that does not answer after the 60 s deadline with FLOW_ERROR.
 *
 * <p>The accepted bounds and the deadline are written here as {@code EXPECTED_*}, not read from the production constants.
 * Limits: the deadline case runs the operators on virtual time, so what it shows is the operator order and the argument of
 * the error, not the wall-clock length of a real relay. The test connector of {@code WebClientRedirect} replaces the
 * connector that {@code timeoutMs} configures, so the production per-attempt network timeouts (10 s) are not exercised here
 * at all: how they interact with the deadline is not tested.
 */
@WireMockTest
class ApiFlowControllerLimitsTest {

    private static final String TAG = "[ApiFlowControllerLimitsTest]";
    private static final String PATH = "ApiFlowControllerLimitsTest.path";
    private static final String METHOD = "post";
    private static final String OK_BODY = "{}";
    private static final String SEAT_SYNC_ANSWER = "ApiFlowControllerLimitsTest.seat-sync-answer";
    private static final String RETRIES = "retries";
    private static final String TIMEOUT = "timeout";
    private static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration REAL_WAIT = Duration.ofSeconds(5);
    private static final Duration SILENT_UPSTREAM_DELAY = Duration.ofMinutes(10);
    private static final long UPSTREAM_POLL_MILLIS = 50;
    private static final int EXPECTED_MAX_RETRIES = 3;
    private static final int EXPECTED_MAX_TIMEOUT = 10;
    private static final Duration EXPECTED_DEADLINE = Duration.ofSeconds(60);
    private static final String EXPECTED_DEADLINE_MESSAGE = "the flow relay did not answer within 60 s";
    private static final int D1_TIMEOUT = 40091;
    private static final int D1_RETRIES = 40092;

    /** The pair (timeout, retries) and the field the refusal names. */
    static Stream<Arguments> outOfRange() {
        return Stream.of(
                Arguments.of(null, -1, RETRIES),
                Arguments.of(null, EXPECTED_MAX_RETRIES + 1, RETRIES),
                Arguments.of(null, Integer.MIN_VALUE, RETRIES),
                Arguments.of(null, D1_RETRIES, RETRIES),
                Arguments.of(-1, null, TIMEOUT),
                Arguments.of(EXPECTED_MAX_TIMEOUT + 1, null, TIMEOUT),
                Arguments.of(D1_TIMEOUT, null, TIMEOUT),
                Arguments.of(D1_TIMEOUT, D1_RETRIES, RETRIES));
    }

    @ParameterizedTest(name = "timeout {0}, retries {1} -> INVALID_PARAMETER {2}")
    @MethodSource("outOfRange")
    void outOfRangeRetriesOrTimeoutAreRefusedBeforeAnyClientNEW92(Integer timeout, Integer retries, String field, WireMockRuntimeInfo wireMock) {
        wireMock.getWireMock().register(post(urlPathMatching("/.*")).willReturn(ok(OK_BODY)));
        AtomicInteger builderCalls = new AtomicInteger();
        ApiFlowController controller = new ApiFlowController(mock(WorkspaceSeatSyncService.class));
        FlowRequest request = new FlowRequest(PATH, METHOD, Map.of(), Map.of(), timeout, retries);
        Throwable failure = null;
        String answer = null;
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl(), builderCalls::incrementAndGet)) {
            answer = controller.flow(request).block(BLOCK_TIMEOUT);
        } catch (Throwable t) {
            failure = t;
        }
        List<LoggedRequest> received = wireMock.getWireMock().find(anyRequestedFor(anyUrl()));
        System.out.println(TAG + " " + request + " -> failure " + failure + ", answer " + answer + ", builder calls " + builderCalls
                + ", upstream requests " + received.size());
        assertThat(failure).as("failure of " + request).isInstanceOfSatisfying(BizException.class, e -> {
            assertThat(e.getError()).as("error").isEqualTo(BizError.INVALID_PARAMETER);
            assertThat(e.getArgs()).as("arguments: the field named").containsExactly(field);
        });
        assertThat(builderCalls).as("builder calls: the refusal comes before the client is built").hasValue(0);
        assertThat(received).as("upstream requests").isEmpty();
    }

    /** The seat-sync path's refusal, once for each field: (timeout, retries) and the field named. */
    static Stream<Arguments> seatSyncOutOfRange() {
        return Stream.of(
                Arguments.of(null, EXPECTED_MAX_RETRIES + 1, RETRIES),
                Arguments.of(EXPECTED_MAX_TIMEOUT + 1, null, TIMEOUT));
    }

    @ParameterizedTest(name = "timeout {0}, retries {1} -> INVALID_PARAMETER {2}")
    @MethodSource("seatSyncOutOfRange")
    void aSeatSyncRequestWithRetriesOrTimeoutOutOfRangeIsRefusedNEW92(Integer timeout, Integer retries, String field) {
        WorkspaceSeatSyncService seatSync = mock(WorkspaceSeatSyncService.class);
        when(seatSync.synchronize(org.mockito.ArgumentMatchers.anyString())).thenReturn(Mono.just(SEAT_SYNC_ANSWER));
        ApiFlowController controller = new ApiFlowController(seatSync);
        FlowRequest request = new FlowRequest(WorkspaceSeatSyncService.FLOW_PATH, METHOD, Map.of("orgId", "org"), Map.of(), timeout, retries);
        Throwable failure = null;
        String answer = null;
        try {
            answer = controller.flow(request).block(BLOCK_TIMEOUT);
        } catch (Throwable t) {
            failure = t;
        }
        System.out.println(TAG + " seat sync " + request + " -> failure " + failure + ", answer " + answer);
        assertThat(failure).as("failure of the seat-sync request").isInstanceOfSatisfying(BizException.class, e -> {
            assertThat(e.getError()).as("error").isEqualTo(BizError.INVALID_PARAMETER);
            assertThat(e.getArgs()).as("arguments: the field named").containsExactly(field);
        });
        verify(seatSync, never()).synchronize(org.mockito.ArgumentMatchers.anyString());
    }

    /**
     * An upstream that does not answer within the deadline: on virtual time nothing happens until the deadline, then the relay
     * ends with FLOW_ERROR whose argument is the deadline's message, which tells the overall deadline from an exhausted retry
     * (whose argument is the last failure's message).
     */
    @Test
    void aSilentUpstreamEndsAtTheDeadlineNEW92(WireMockRuntimeInfo wireMock) {
        wireMock.getWireMock().register(post(urlPathMatching("/.*")).willReturn(ok(OK_BODY).withFixedDelay((int) SILENT_UPSTREAM_DELAY.toMillis())));
        ApiFlowController controller = new ApiFlowController(mock(WorkspaceSeatSyncService.class));
        FlowRequest request = new FlowRequest(PATH, METHOD, Map.of(), Map.of(), EXPECTED_MAX_TIMEOUT, EXPECTED_MAX_RETRIES);
        System.out.println(TAG + " silent upstream, request " + request);
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            StepVerifier.withVirtualTime(() -> controller.flow(request))
                    .expectSubscription()
                    .then(() -> awaitUpstreamRequest(wireMock))
                    .expectNoEvent(EXPECTED_DEADLINE.minusMillis(1))
                    .thenAwait(Duration.ofMillis(1))
                    .expectErrorSatisfies(error -> {
                        System.out.println(TAG + " silent upstream ended with " + error);
                        assertThat(error).isInstanceOfSatisfying(BizException.class, e -> {
                            assertThat(e.getError()).as("error").isEqualTo(BizError.FLOW_ERROR);
                            assertThat(e.getArgs()).as("arguments: the deadline's message").containsExactly(EXPECTED_DEADLINE_MESSAGE);
                        });
                    })
                    .verify(REAL_WAIT);
        }
    }

    /** Waits, in real time, until the silent upstream has received the relay's request: the deadline then ends an exchange that was started. */
    private static void awaitUpstreamRequest(WireMockRuntimeInfo wireMock) {
        long give_up = System.nanoTime() + REAL_WAIT.toNanos();
        while (wireMock.getWireMock().find(anyRequestedFor(anyUrl())).isEmpty()) {
            if (System.nanoTime() > give_up) {
                throw new AssertionError("the silent upstream received no request within " + REAL_WAIT);
            }
            try {
                Thread.sleep(UPSTREAM_POLL_MILLIS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AssertionError("interrupted while waiting for the upstream request", e);
            }
        }
        System.out.println(TAG + " the silent upstream received " + wireMock.getWireMock().find(anyRequestedFor(anyUrl())).size() + " request(s)");
    }
}

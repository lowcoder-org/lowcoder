package org.lowcoder.api.misc;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.api.subscription.WorkspaceSeatSyncService;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.ok;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * NEW-91 (P4): the path of a relayed flow request is not expanded as a URI template. {@link ApiFlowController#flow} runs
 * inside {@link WebClientRedirect}; WireMock records the raw request target it receives.
 *
 * <p>Controls (what HEAD sent, recorded by P4's step 0): {@link #controls}. Changed by the fix: {@link #changed}. Limits: the
 * test connector re-applies the request's path and query to the local server, so what is pinned is what the client sends to
 * it; a fragment is dropped by the client, a double slash arrives as one and a dot segment is sent as it is (the controls pin
 * these as observed, not as wanted).
 */
@WireMockTest
class ApiFlowControllerUriTest {

    private static final String TAG = "[ApiFlowControllerUriTest]";
    private static final String METHOD = "post";
    private static final String OK_BODY = "{}";
    private static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);

    private static final String WEBHOOK = "webhook/secure/get-product";
    private static final String WITH_QUERY = "a?x=1";
    private static final String WITH_FRAGMENT = "a#f";
    private static final String OPEN_BRACE = "a{b";
    private static final String WITH_SPACE = "a b";
    private static final String PERCENT_ENCODED = "a%20b";
    private static final String DOUBLE_SLASH = "a//b";
    private static final String DOT_SEGMENT = "a/../b";
    private static final String UNEXPANDED = "{unexpanded}";
    private static final String TWO_VARIABLES = "x/{a}/{b}";

    private static final String TARGET_WEBHOOK = "/webhook/secure/get-product";
    private static final String TARGET_WITH_QUERY = "/a?x=1";
    private static final String TARGET_WITH_FRAGMENT = "/a";
    private static final String TARGET_OPEN_BRACE = "/a%7Bb";
    private static final String TARGET_WITH_SPACE = "/a%20b";
    private static final String TARGET_PERCENT_ENCODED = "/a%2520b";
    private static final String TARGET_DOUBLE_SLASH = "/a/b";
    private static final String TARGET_DOT_SEGMENT = "/a/../b";
    private static final String TARGET_UNEXPANDED = "/%7Bunexpanded%7D";
    private static final String TARGET_TWO_VARIABLES = "/x/%7Ba%7D/%7Bb%7D";
    private static final String FRAGMENT_MARK = "#f";

    static Stream<Arguments> controls() {
        return Stream.of(
                Arguments.of(WEBHOOK, TARGET_WEBHOOK),
                Arguments.of(WITH_QUERY, TARGET_WITH_QUERY),
                Arguments.of(WITH_FRAGMENT, TARGET_WITH_FRAGMENT),
                Arguments.of(OPEN_BRACE, TARGET_OPEN_BRACE),
                Arguments.of(WITH_SPACE, TARGET_WITH_SPACE),
                Arguments.of(PERCENT_ENCODED, TARGET_PERCENT_ENCODED),
                Arguments.of(DOUBLE_SLASH, TARGET_DOUBLE_SLASH),
                Arguments.of(DOT_SEGMENT, TARGET_DOT_SEGMENT));
    }

    static Stream<Arguments> changed() {
        return Stream.of(
                Arguments.of(UNEXPANDED, TARGET_UNEXPANDED),
                Arguments.of(TWO_VARIABLES, TARGET_TWO_VARIABLES));
    }

    @ParameterizedTest(name = "control {0} is requested as {1}")
    @MethodSource("controls")
    void aPathThatWorkedBeforeIsRelayedAsBefore(String path, String expectedTarget, WireMockRuntimeInfo wireMock) {
        assertRelayedAs(path, expectedTarget, wireMock);
    }

    @ParameterizedTest(name = "{0} is requested as {1}")
    @MethodSource("changed")
    void aPathWithBracesIsRelayedNotExpandedNEW91(String path, String expectedTarget, WireMockRuntimeInfo wireMock) {
        assertRelayedAs(path, expectedTarget, wireMock);
    }

    private static void assertRelayedAs(String path, String expectedTarget, WireMockRuntimeInfo wireMock) {
        wireMock.getWireMock().register(post(urlPathMatching("/.*")).willReturn(ok(OK_BODY)));
        ApiFlowController controller = new ApiFlowController(mock(WorkspaceSeatSyncService.class));
        Throwable failure = null;
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            controller.flow(new FlowRequest(path, METHOD, Map.of(), Map.of(), null, null)).block(BLOCK_TIMEOUT);
        } catch (Throwable t) {
            failure = t;
        }
        List<LoggedRequest> received = wireMock.getWireMock().find(anyRequestedFor(anyUrl()));
        String target = received.isEmpty() ? null : received.get(received.size() - 1).getUrl();
        System.out.println(TAG + " path '" + path + "' -> request target " + target + ", expected " + expectedTarget + ", failure " + failure);
        assertThat(failure).as("flow of '" + path + "' fails before the request is sent").isNull();
        assertThat(received).as("requests the flow service received for '" + path + "'").hasSize(1);
        assertThat(target).as("raw path and query received for '" + path + "'").isEqualTo(expectedTarget);
        if (WITH_FRAGMENT.equals(path)) {
            assertThat(target).as("the fragment is not part of the request target").doesNotContain(FRAGMENT_MARK);
        }
    }
}

package org.lowcoder.api.misc;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import reactor.core.publisher.Mono;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;

import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * NEW-96 (P4): a library name from {@code GET /api/misc/js-library/metas} is not expanded as a URI template, and its
 * {@code ?} and {@code #} are sent inside the path instead of starting a query or a fragment; its {@code /} still separates
 * path segments (a scoped name is sent as {@code /@scope/pkg}). The private {@code fetch} runs by reflection inside {@link WebClientRedirect}; WireMock
 * records the raw request target it receives.
 *
 * <p>Controls (what HEAD sent, recorded by P4's step 0): {@link #CONTROLS}. Changed by the fix: {@link #CHANGED}. Limits: the
 * test connector re-applies the request's path and query to the local server, so what is pinned is what the client sends to
 * it, not what the real registry does with it; the {@code getMeta} case uses the two names {@link #UNCACHED_PLAIN} and
 * {@link #UNCACHED_BRACES} instead of the plan's {@code lodash} and {@code {x}}, because the controller's name caches are
 * static and another test may have filled them for those names.
 */
@WireMockTest
class JsLibraryControllerRegistryUriTest {

    private static final String TAG = "[JsLibraryControllerRegistryUriTest]";
    private static final String FETCH_METHOD = "fetch";
    private static final String EMPTY_DOCUMENT = "{}";
    private static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    private static final int TWO_METAS = 2;

    private static final String LODASH = "lodash";
    private static final String SCOPED = "@scope/pkg";
    private static final String WITH_SPACE = "a b";
    private static final String NON_ASCII = "ü";
    private static final String PERCENT_ENCODED = "a%20b";
    private static final String BRACES_ONLY = "{x}";
    private static final String BRACES_INSIDE = "a{b}";
    private static final String QUESTION_MARK = "a?b";
    private static final String HASH = "a#b";

    private static final String PATH_LODASH = "/lodash";
    private static final String PATH_SCOPED = "/@scope/pkg";
    private static final String PATH_WITH_SPACE = "/a%20b";
    private static final String PATH_NON_ASCII = "/%C3%BC";
    private static final String PATH_PERCENT_ENCODED = "/a%2520b";
    private static final String PATH_BRACES_ONLY = "/%7Bx%7D";
    private static final String PATH_BRACES_INSIDE = "/a%7Bb%7D";
    private static final String PATH_QUESTION_MARK = "/a%3Fb";
    private static final String PATH_HASH = "/a%23b";

    /** Names of the getMeta case: one that works and one with braces; no other test caches them. */
    private static final String UNCACHED_PLAIN = "jslibraryregistryuritest-plain";
    private static final String UNCACHED_BRACES = "{jslibraryregistryuritest-braces}";

    static Stream<Arguments> controls() {
        return Stream.of(
                Arguments.of(LODASH, PATH_LODASH),
                Arguments.of(SCOPED, PATH_SCOPED),
                Arguments.of(WITH_SPACE, PATH_WITH_SPACE),
                Arguments.of(NON_ASCII, PATH_NON_ASCII),
                Arguments.of(PERCENT_ENCODED, PATH_PERCENT_ENCODED));
    }

    static Stream<Arguments> changed() {
        return Stream.of(
                Arguments.of(BRACES_ONLY, PATH_BRACES_ONLY),
                Arguments.of(BRACES_INSIDE, PATH_BRACES_INSIDE),
                Arguments.of(QUESTION_MARK, PATH_QUESTION_MARK),
                Arguments.of(HASH, PATH_HASH));
    }

    private static final String CONTROLS = "controls";
    private static final String CHANGED = "changed";

    @ParameterizedTest(name = "control {0} is requested as {1}")
    @MethodSource(CONTROLS)
    void aNameThatWorkedBeforeIsRequestedAsBefore(String name, String expectedTarget, WireMockRuntimeInfo wireMock) throws Exception {
        assertRequestedAs(name, expectedTarget, wireMock);
    }

    @ParameterizedTest(name = "{0} is requested as {1}")
    @MethodSource(CHANGED)
    void aNameWithTemplateOrUriCharactersIsRequestedAsOnePathNEW96(String name, String expectedTarget, WireMockRuntimeInfo wireMock) throws Exception {
        assertRequestedAs(name, expectedTarget, wireMock);
    }

    @Test
    void oneNameWithBracesDoesNotFailTheWholeAnswerNEW96(WireMockRuntimeInfo wireMock) {
        wireMock.getWireMock().register(get(urlPathMatching("/.*")).willReturn(okJson(EMPTY_DOCUMENT)));
        Throwable failure = null;
        List<JsLibraryMeta> metas = null;
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            metas = new JsLibraryController().getMeta(List.of(UNCACHED_PLAIN, UNCACHED_BRACES)).block(BLOCK_TIMEOUT).getData();
        } catch (Throwable t) {
            failure = t;
        }
        System.out.println(TAG + " getMeta(" + UNCACHED_PLAIN + ", " + UNCACHED_BRACES + ") -> " + metas + ", failure " + failure);
        assertThat(failure).as("getMeta(" + UNCACHED_PLAIN + ", " + UNCACHED_BRACES + ") fails as a whole because of the name with braces").isNull();
        assertThat(metas).as("one meta per name").hasSize(TWO_METAS);
    }

    private static void assertRequestedAs(String name, String expectedTarget, WireMockRuntimeInfo wireMock) throws Exception {
        wireMock.getWireMock().register(get(urlPathMatching("/.*")).willReturn(okJson(EMPTY_DOCUMENT)));
        Throwable failure = null;
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            Method fetch = JsLibraryController.class.getDeclaredMethod(FETCH_METHOD, String.class);
            fetch.setAccessible(true);
            try {
                ((Mono<?>) fetch.invoke(null, name)).block(BLOCK_TIMEOUT);
            } catch (InvocationTargetException e) {
                failure = e.getCause();
            } catch (RuntimeException e) {
                failure = e;
            }
        }
        List<LoggedRequest> received = wireMock.getWireMock().find(anyRequestedFor(anyUrl()));
        String target = received.isEmpty() ? null : received.get(received.size() - 1).getUrl();
        System.out.println(TAG + " name '" + name + "' -> request target " + target + ", expected " + expectedTarget + ", failure " + failure);
        assertThat(failure).as("fetch of '" + name + "' fails before the request is sent").isNull();
        assertThat(received).as("requests the registry received for '" + name + "'").hasSize(1);
        assertThat(target).as("raw path and query received for '" + name + "'").isEqualTo(expectedTarget);
    }
}

package org.lowcoder.sdk.plugin.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;

/**
 * BF-059 (formerly pinned as the section 9 row "REST url: // inside a query value collapsed to /"):
 * {@code RestApiUriBuilder.buildUri} collapses runs of slashes only in the scheme, host and path of the rendered url
 * ({@code collapseRedundantSlashes}), the clean-up meant for the joins of host and path. A double slash in the query or the
 * fragment, typed into the URL or path field or brought in by a {@code {{ }}} value, reaches the server as entered. The
 * entries of the form's Parameters table are added after the clean-up and are not changed. Callers: RestApiExecutor.java:177
 * and GraphQLExecutor.java:246. Requests go to a local server (port 0, loopback) only.
 */
public class RestApiUriBuilderCollapseTest {

    private static final String PATH = "/p";

    private static URI received(URI uri) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, new Response(200, Map.of(), "ok".getBytes(StandardCharsets.UTF_8))))) {
            URI target = URI.create(server.baseUrl() + uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery()));
            WebClientBuildHelper.builder().build().get().uri(target).retrieve().toBodilessEntity().block();
            return URI.create(server.requests().get(0).pathAndQuery());
        }
    }

    @Test
    public void aDoubleSlashInsideAQueryValueTypedIntoTheUrlReachesTheServerAsEnteredBF059() {
        String entered = "https://h.example/p?u=a//b&v=http://x//y";

        URI built = RestApiUriBuilder.buildUri(entered, Map.of(), Map.of());
        URI arrived = received(built);

        System.out.println("[RestApiUriBuilderCollapseTest] entered query 'u=a//b&v=http://x//y' -> built '" + built.getRawQuery() + "', server received '" + arrived + "'");
        assertEquals("u=a//b&v=http://x//y", built.getRawQuery());
        assertEquals("/p?u=a//b&v=http://x//y", arrived.toString(), "the received value is the entered one");
    }

    @Test
    public void aValueBroughtInByAMustacheExpressionIsKeptBF059() {
        URI built = RestApiUriBuilder.buildUri("https://h.example/p?u={{v}}", Map.of("v", "a//b"), Map.of());

        assertEquals("u=a//b", built.getRawQuery());
    }

    @Test
    public void thePathIsCleanedUpWhileTheQueryAndTheFragmentOfTheSameUrlAreKeptBF059() {
        URI built = RestApiUriBuilder.buildUri("https://h.example//p//q?u=a//b#f//g", Map.of(), Map.of());

        System.out.println("[RestApiUriBuilderCollapseTest] 'https://h.example//p//q?u=a//b#f//g' -> " + built);
        assertEquals("/p/q", built.getRawPath());
        assertEquals("u=a//b", built.getRawQuery());
        assertEquals("f//g", built.getRawFragment());
    }

    @Test
    public void theCleanUpEndsAtTheFirstQuestionMarkOrHashBF059() {
        assertEquals("https://h/p/q", RestApiUriBuilder.collapseRedundantSlashes("https://h//p///q"));
        assertEquals("http://h/p?x=//", RestApiUriBuilder.collapseRedundantSlashes("http://h//p?x=//"));
        assertEquals("https://h/p#a//b?c=//", RestApiUriBuilder.collapseRedundantSlashes("https://h//p#a//b?c=//"));
        assertEquals("?u=a//b", RestApiUriBuilder.collapseRedundantSlashes("?u=a//b"));
        assertEquals("", RestApiUriBuilder.collapseRedundantSlashes(""));
        assertEquals("ftp:/h/p", RestApiUriBuilder.collapseRedundantSlashes("ftp://h//p"), "only http and https keep their //");
    }

    @Test
    public void thePathCleanupAndTheSchemeSeparatorsBehaveAsTheCollapseIsMeantTo() {
        assertEquals("/p/q", RestApiUriBuilder.buildUri("https://h.example/p//q", Map.of(), Map.of()).getRawPath());
        assertEquals("/p/q/r", RestApiUriBuilder.buildUri("https://h.example//p///q//r", Map.of(), Map.of()).getRawPath());
        assertEquals("https://h.example/p", RestApiUriBuilder.buildUri("https://h.example/p", Map.of(), Map.of()).toString());
        assertEquals("http://h.example/p", RestApiUriBuilder.buildUri("http://h.example/p", Map.of(), Map.of()).toString());
    }

    @Test
    public void anEntryOfTheParametersTableIsAddedAfterTheCollapseAndArrivesIntact() {
        Map<String, String> parameters = new LinkedHashMap<>();
        parameters.put("w", "a//b");

        URI built = RestApiUriBuilder.buildUri("https://h.example/p", Map.of(), parameters);
        URI arrived = received(built);

        System.out.println("[RestApiUriBuilderCollapseTest] Parameters-table value 'a//b' -> built '" + built.getRawQuery() + "', server received '" + arrived + "'");
        assertEquals("w=a%2F%2Fb", built.getRawQuery());
        assertEquals("/p?w=a%2F%2Fb", arrived.toString());
    }
}

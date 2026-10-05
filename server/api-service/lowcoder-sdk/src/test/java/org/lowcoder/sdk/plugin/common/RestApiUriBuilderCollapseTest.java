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
 * DEFECT pinned (plan section 9 row "REST url: // inside a query value collapsed to /"; D-6, fix deferred).
 * {@code RestApiUriBuilder.buildUri} runs {@code url.replaceAll("(?<!http:|https:)/{2,}", "/")} on the whole url text
 * (RestApiUriBuilder.java:41), after the mustache rendering of :40. The cleanup is meant for the joins of host and path, but
 * it also rewrites a double slash inside a query string that the user typed into the URL or path field or that a
 * {@code {{ }}} value brought in, so the server receives another value than the one entered. The entries of the form's
 * Parameters table are added after the collapse (RestApiUriBuilder.java:51-56) and are not changed. Callers:
 * RestApiExecutor.java:161 and GraphQLExecutor.java:245. A fix that collapses only the part before the first {@code ?}
 * turns the received-value assertions red. Requests go to a local server (port 0, loopback) only.
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
    public void aDoubleSlashInsideAQueryValueTypedIntoTheUrlIsCollapsedAndTheServerReceivesAnotherValuePinsTheSection9Row() {
        String entered = "https://h.example/p?u=a//b&v=http://x//y";

        URI built = RestApiUriBuilder.buildUri(entered, Map.of(), Map.of());
        URI arrived = received(built);

        System.out.println("[RestApiUriBuilderCollapseTest] entered query 'u=a//b&v=http://x//y' -> built '" + built.getRawQuery() + "', server received '" + arrived + "'");
        assertEquals("u=a/b&v=http://x/y", built.getRawQuery());
        assertEquals("/p?u=a/b&v=http://x/y", arrived.toString(), "the received value is not the entered one");
    }

    @Test
    public void aValueBroughtInByAMustacheExpressionIsCollapsedToo() {
        URI built = RestApiUriBuilder.buildUri("https://h.example/p?u={{v}}", Map.of("v", "a//b"), Map.of());

        assertEquals("u=a/b", built.getRawQuery());
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

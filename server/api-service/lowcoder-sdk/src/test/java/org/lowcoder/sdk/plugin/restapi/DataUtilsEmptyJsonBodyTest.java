package org.lowcoder.sdk.plugin.restapi;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.plugin.http.RawHttpHandlerHelper;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

/**
 * Observation (probe P1, ruled "behaviour" because nothing differs on the wire for a request-derived empty body).
 * {@code DataUtils.parseJsonBody} tests {@code "" == body} (DataUtils.java:95), which is reference equality, and
 * {@code RestApiExecutor} (RestApiExecutor.java:130) passes {@code trimToEmpty(queryConfig.getBody())} to
 * {@code RawHttpHandlerHelper.buildBodyInserter}. An empty body that Jackson read from the saved query is the interned
 * {@code ""} (Jackson returns the literal for an empty string), so it goes out as an empty body exactly like an absent one.
 * Only an empty String that is another object (here {@code new String("")}) is rendered as JSON and goes out as {@code {}}:
 * a latent difference that no request-derived value produces today. The test sends to a local server (port 0, loopback) and
 * reads what arrived.
 */
public class DataUtilsEmptyJsonBodyTest {

    private static final String PATH = "/b";

    private record Saved(String body) {
    }

    private static Request post(String body) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, new Response(200, Map.of(), null)))) {
            WebClientBuildHelper.builder().build().post().uri(server.baseUrl() + PATH).contentType(MediaType.APPLICATION_JSON)
                    .body(RawHttpHandlerHelper.buildBodyInserter(HttpMethod.POST, true, MediaType.APPLICATION_JSON_VALUE, StringUtils.trimToEmpty(body), List.of()))
                    .retrieve().toBodilessEntity().block();
            return server.requests().get(0);
        }
    }

    @Test
    public void anEmptyBodyFromTheSavedQueryGoesOutEmptyLikeAnAbsentOneAndOnlyANonLiteralEmptyStringBecomesBraces() {
        String absent = JsonUtils.fromJson("{}", Saved.class).body();
        String saved = JsonUtils.fromJson("{\"body\":\"\"}", Saved.class).body();
        String nonLiteral = new String("");

        Request fromAbsent = post(absent);
        Request fromSaved = post(saved);
        Request fromNonLiteral = post(nonLiteral);

        System.out.println("[DataUtilsEmptyJsonBodyTest] absent '" + fromAbsent.bodyText() + "' " + fromAbsent.header("Content-Length")
                + "; saved empty string '" + fromSaved.bodyText() + "' " + fromSaved.header("Content-Length")
                + "; new String(\"\") '" + fromNonLiteral.bodyText() + "' " + fromNonLiteral.header("Content-Length"));
        assertEquals("", fromAbsent.bodyText());
        assertEquals(List.of("0"), fromAbsent.header("Content-Length"));
        assertEquals("", fromSaved.bodyText(), "Jackson hands out the interned empty string");
        assertEquals(List.of("0"), fromSaved.header("Content-Length"));
        assertEquals("{}", fromNonLiteral.bodyText(), "latent: reference comparison does not see this empty string");
        assertEquals(List.of("2"), fromNonLiteral.header("Content-Length"));
        assertEquals(List.of(MediaType.APPLICATION_JSON_VALUE), fromSaved.header("Content-Type").stream().map(v -> v.split(";")[0]).toList());
    }
}

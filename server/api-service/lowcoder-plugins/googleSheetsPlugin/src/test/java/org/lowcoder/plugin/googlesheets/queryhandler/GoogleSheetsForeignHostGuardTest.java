package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.ProxySelector;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;

/**
 * Shows the {@link ForeignHostGuard} failing closed: a URL on a host that never resolves ({@code .invalid}, RFC 6761) and
 * Google's token endpoint are refused before any lookup or connection (the selector throws first, and records the URI),
 * while the test's own server is let through. Only the guard's own limits apply (see its doc comment).
 */
public class GoogleSheetsForeignHostGuardTest {

    private ProxySelector previous;

    @BeforeEach
    public void remember() {
        previous = ProxySelector.getDefault();
    }

    @AfterEach
    public void restore() {
        ProxySelector.setDefault(previous);
    }

    @Test
    public void aForeignHostIsRefusedBeforeAnyLookupAndRecorded() {
        ForeignHostGuard guard = new ForeignHostGuard(Set.of(1));
        ProxySelector.setDefault(guard);

        for (String url : List.of("http://guard-probe.invalid:80/x", "https://oauth2.googleapis.com/token", "http://127.0.0.1:2/other-port")) {
            IllegalStateException failure = assertThrows(IllegalStateException.class, () -> new URL(url).openConnection().connect(), url);
            System.out.println("[GoogleSheetsForeignHostGuardTest] " + url + " -> " + failure.getMessage());
            assertTrue(failure.getMessage().startsWith("GUARD: request to a foreign host"), failure.getMessage());
        }

        assertEquals(List.of("http://guard-probe.invalid:80/x", "https://oauth2.googleapis.com/token", "http://127.0.0.1:2/other-port"), guard.foreign());
        assertEquals(List.of(), guard.allowed());
    }

    @Test
    public void theOwnServerIsLetThroughAndRecordedAsAllowed() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/ok", new Response(200, Map.of(), null)))) {
            ForeignHostGuard guard = new ForeignHostGuard(Set.of(server.port()));
            ProxySelector.setDefault(guard);

            int status = ((java.net.HttpURLConnection) new URL(server.baseUrl() + "/ok").openConnection()).getResponseCode();

            assertEquals(200, status);
            assertEquals(List.of(server.baseUrl() + "/ok"), guard.allowed());
            assertEquals(List.of(), guard.foreign());
        }
    }
}

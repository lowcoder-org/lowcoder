package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Duration;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.exception.BizException;

/**
 * BF-022 (fixed; was pinned as probe EP2, plan section 9 row "SSRF guard by string: ES disallowed-hosts compares host text
 * without resolving; localhost and 127.1 reach the server"). {@code EsConnector.buildRestClient} now refuses a host whose
 * text or any resolved address is in {@code disallowedHosts} ({@code HostGuards.isDisallowed}, the rule of the HTTP
 * clients' SafeHostResolverGroup). With {@code disallowedHosts = {127.0.0.1, 0:0:0:0:0:0:0:1}}, {@code 127.0.0.1},
 * {@code localhost} and {@code 127.1} (the same loopback address) are all refused before any request. Only my own loopback server on port 0 is
 * contacted, and only by the unguarded control.
 */
public class EsDisallowedHostsAddressCompareTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String BLOCKED_LITERAL = "127.0.0.1";
    /** Listed too, so {@code localhost} is blocked whichever loopback address the machine resolves it to. */
    private static final String BLOCKED_IPV6_LOOPBACK = "0:0:0:0:0:0:0:1";

    private final EsConnector guarded = guardedConnector();

    private static EsConnector guardedConnector() {
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.setDisallowedHosts(Set.of(BLOCKED_LITERAL, BLOCKED_IPV6_LOOPBACK));
        return new EsConnector(new ConfigCenterForTest(), commonConfig);
    }

    private int requestsReachingTheServerFor(String host) throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(200, Map.of(), null)))) {
            String connectionString = host + ":" + server.port();
            DatasourceTestResult result = guarded.testConnection(guarded.resolveConfig(Map.of("connectionString", connectionString))).block(TIMEOUT);
            System.out.println("[EsDisallowedHostsAddressCompareTest] disallowedHosts={" + BLOCKED_LITERAL + "} connectionString '" + connectionString
                    + "' -> success " + result.isSuccess() + ", requests at my server " + server.requests().size());
            return server.requests().size();
        }
    }

    @Test
    public void theLiteralAddressLocalhostAndShortLoopbackAreAllBlocked() throws Exception {
        // the guard throws inside createConnection, which testConnection reports as a failed result without any request
        assertEquals(0, requestsReachingTheServerFor(BLOCKED_LITERAL));
        assertEquals(0, requestsReachingTheServerFor("localhost"), "localhost resolves to a disallowed address");
        assertEquals(0, requestsReachingTheServerFor("127.1"), "127.1 is the disallowed address");
    }

    @Test
    public void createConnectionRefusesEverySpellingOfTheDisallowedAddress() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(200, Map.of(), null)))) {
            for (String host : new String[] {BLOCKED_LITERAL, "localhost", "127.1"}) {
                BizException refused = org.junit.jupiter.api.Assertions.assertThrows(BizException.class, () -> guarded
                        .createConnection(guarded.resolveConfig(Map.of("connectionString", host + ":" + server.port()))).block(TIMEOUT), host);
                System.out.println("[EsDisallowedHostsAddressCompareTest] createConnection '" + host + "' -> " + refused.getMessageKey());
                assertEquals("INVALID_CONNECTION_STRING", refused.getMessageKey(), host);
            }
            assertEquals(0, server.requests().size());
        }
    }

    /** The control: without a disallowed list the same loopback server is reached, so the zero counts above come from the guard. */
    @Test
    public void withoutADisallowedListTheServerIsReached() throws Exception {
        EsConnector unguarded = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(200, Map.of(), null)))) {
            unguarded.testConnection(unguarded.resolveConfig(Map.of("connectionString", "localhost:" + server.port()))).block(TIMEOUT);
            System.out.println("[EsDisallowedHostsAddressCompareTest] unguarded localhost -> requests " + server.requests().size());
            assertEquals(1, server.requests().size());
        }
    }
}

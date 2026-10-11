package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.Duration;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.exception.BizException;

/**
 * DEFECT pinned (probe EP2; plan section 9 row "SSRF guard by string: ES disallowed-hosts compares host text (:97)
 * without resolving; localhost and 127.1 reach the server"; D-6, fix deferred). {@code EsConnector.buildRestClient}
 * (EsConnector.java:97) tests {@code disallowedHosts.contains(<host text of the connection string>)}: the text is never
 * resolved. With {@code disallowedHosts = {127.0.0.1}}, {@code 127.0.0.1} is rejected but {@code localhost} and
 * {@code 127.1} (both the same loopback address) are connected to. The fix (resolve the host and compare addresses, or
 * reuse the SafeHostResolverGroup check) makes the two bypass assertions red. Only my own loopback server on port 0 is
 * contacted.
 */
public class EsDisallowedHostsTextCompareTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String BLOCKED_LITERAL = "127.0.0.1";

    private final EsConnector guarded = guardedConnector();

    private static EsConnector guardedConnector() {
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.setDisallowedHosts(Set.of(BLOCKED_LITERAL));
        return new EsConnector(new ConfigCenterForTest(), commonConfig);
    }

    private int requestsReachingTheServerFor(String host) throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(200, Map.of(), null)))) {
            String connectionString = host + ":" + server.port();
            DatasourceTestResult result = guarded.testConnection(guarded.resolveConfig(Map.of("connectionString", connectionString))).block(TIMEOUT);
            System.out.println("[EsDisallowedHostsTextCompareTest] disallowedHosts={" + BLOCKED_LITERAL + "} connectionString '" + connectionString
                    + "' -> success " + result.isSuccess() + ", requests at my server " + server.requests().size());
            return server.requests().size();
        }
    }

    @Test
    public void theLiteralAddressIsBlockedButLocalhostAndShortLoopbackReachTheServerEP2() throws Exception {
        // the guard throws inside createConnection, which testConnection reports as a failed result without any request
        assertEquals(0, requestsReachingTheServerFor(BLOCKED_LITERAL));
        // the same machine under another spelling is not blocked: the request arrives
        assertEquals(1, requestsReachingTheServerFor("localhost"), "localhost is not compared by address");
        assertEquals(1, requestsReachingTheServerFor("127.1"), "127.1 is not compared by address");
    }

    @Test
    public void createConnectionAcceptsLocalhostWhileRejectingTheLiteral() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", new Response(200, Map.of(), null)))) {
            org.junit.jupiter.api.Assertions.assertThrows(BizException.class, () -> guarded
                    .createConnection(guarded.resolveConfig(Map.of("connectionString", BLOCKED_LITERAL + ":" + server.port()))).block(TIMEOUT));
            try (EsConnection connection = guarded.createConnection(guarded.resolveConfig(Map.of("connectionString", "localhost:" + server.port()))).block(TIMEOUT)) {
                assertNotNull(connection, "createConnection for 'localhost' succeeds although it is 127.0.0.1");
            }
        }
    }
}

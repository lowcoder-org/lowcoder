package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * DEFECT pinned (probe EP3; plan section 9 row "ES HEAD query answered 200 becomes a failed result (:82, :88-92)";
 * D-6, fix deferred). A HEAD answer has no entity, so {@code EntityUtils.toString(response.getEntity())} in
 * EsQueryExecutor.java:82 throws an IllegalArgumentException (not an IOException, so the catch at :84-85 is skipped) and
 * {@code onErrorResume} (:88-92) turns a 200 into a failed result (query code ES_EXECUTION_ERROR, message key
 * ES_QUERY_ERROR, the exception text as message) with no data, which is what a user sees for an index-exists check. The fix (treat a null entity as an empty success) makes the failure
 * assertions red. Only my own loopback server on port 0 is contacted.
 */
public class EsHeadQueryResultTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    @Test
    public void aHeadQueryAnswered200BecomesAFailedResultEP3() throws Exception {
        EsConnector connector = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
        EsQueryExecutor executor = new EsQueryExecutor();
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/idx", new Response(200, Map.of(), null)));
                EsConnection connection = connector.createConnection(connector.resolveConfig(Map.of("connectionString", server.baseUrl()))).block(TIMEOUT)) {

            QueryExecutionResult result = executor.executeQuery(connection,
                    executor.buildQueryExecutionContext(null, Map.of("httpMethod", "HEAD", "path", "idx"), Map.of(), null)).block(TIMEOUT);

            System.out.println("[EsHeadQueryResultTest] HEAD /idx answered 200 -> success " + result.isSuccess() + ", code " + result.getQueryCode() + ", messageKey " + result.getMessageKey()
                    + ", data " + result.getData() + ", args " + java.util.Arrays.toString(result.getMessageArgs()) + ", message " + result.getMessage());
            assertEquals(1, server.requests().size());
            assertEquals("HEAD", server.requests().get(0).method());
            assertFalse(result.isSuccess(), "a 200 answer is reported as a failure");
            assertEquals("ES_EXECUTION_ERROR", result.getQueryCode());
            assertEquals("ES_QUERY_ERROR", result.getMessageKey());
            assertTrue("Entity may not be null".equals(result.getMessageArgs()[0]), "the exception about the missing entity is the message");
            assertNull(result.getData());
        }
    }
}

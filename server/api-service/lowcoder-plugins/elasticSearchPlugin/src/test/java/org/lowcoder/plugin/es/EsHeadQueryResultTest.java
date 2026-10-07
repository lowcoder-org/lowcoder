package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.QueryExecutionResult;

/**
 * BF-075 (fixed; was pinned as probe EP3, plan section 9 row "ES HEAD query answered 200 becomes a failed result"): a HEAD
 * answer has no body, and reading it failed with "Entity may not be null" whether the index existed (200) or not (404). Now
 * it is a success whose data is the status code, so a HEAD query tells the two apart. The 404 is the answer of a path the
 * local server has no response for (an empty body). Only my own loopback server on port 0 is contacted.
 */
public class EsHeadQueryResultTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String EXISTING_PATH = "/idx";

    @ParameterizedTest(name = "HEAD {0} -> {1}")
    @CsvSource({"idx, 200", "missing, 404"})
    public void aHeadQueryIsASuccessWithTheStatusCodeBF075(String path, int expectedStatus) throws Exception {
        EsConnector connector = new EsConnector(new ConfigCenterForTest(), new CommonConfig());
        EsQueryExecutor executor = new EsQueryExecutor();
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(EXISTING_PATH, new Response(200, Map.of(), null)));
                EsConnection connection = connector.createConnection(connector.resolveConfig(Map.of("connectionString", server.baseUrl()))).block(TIMEOUT)) {

            QueryExecutionResult result = executor.executeQuery(connection,
                    executor.buildQueryExecutionContext(null, Map.of("httpMethod", "HEAD", "path", path), Map.of(), null)).block(TIMEOUT);

            System.out.println("[EsHeadQueryResultTest] HEAD /" + path + " -> success " + result.isSuccess() + ", code " + result.getQueryCode()
                    + ", data " + result.getData());
            assertEquals(1, server.requests().size());
            assertEquals("HEAD", server.requests().get(0).method());
            assertTrue(result.isSuccess());
            assertEquals(Map.of(EsQueryExecutor.STATUS_CODE_KEY, expectedStatus), result.getData());
        }
    }
}

package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.elasticsearch.client.Request;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.plugin.es.model.EsDatasourceConfig;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceTestResult;

/**
 * {@link EsConnector} against a local server ({@link RecordingHttpServer}, port 0, loopback only): authentication, path
 * prefix, {@code testConnection} outcomes, {@code destroyConnection}, the disallowed-hosts guard and connection-string
 * validation. The happy-path {@code executeQuery} responses are pinned by EsResultContractTest.
 */
public class EsConnectorLifecycleTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String DATASOURCE_VALIDATE_TIMEOUT_KEY = "datasourceValidateTimeoutMillis";
    private static final String USER = "elastic";
    private static final String PASSWORD = "s3cret";

    private final EsConnector connector = new EsConnector(new ConfigCenterForTest(), new CommonConfig());

    private EsDatasourceConfig config(Map<String, Object> map) {
        return connector.resolveConfig(map);
    }

    private static Response status(int status) {
        return new Response(status, Map.of(), null);
    }

    private DatasourceTestResult test(RecordingHttpServer server, Map<String, Object> extra) {
        Map<String, Object> map = new java.util.HashMap<>(extra);
        map.putIfAbsent("connectionString", server.baseUrl());
        return connector.testConnection(config(map)).block(TIMEOUT);
    }

    @Test
    public void credentialsAreSentOnlyWhenUsernameAndPasswordAreBothSet() {
        String expected = "Basic " + Base64.getEncoder().encodeToString((USER + ":" + PASSWORD).getBytes(StandardCharsets.UTF_8));
        Map<String, Map<String, Object>> cases = new java.util.LinkedHashMap<>();
        cases.put("both", Map.of("username", USER, "password", PASSWORD));
        cases.put("username only", Map.of("username", USER));
        cases.put("password only", Map.of("password", PASSWORD));
        cases.put("blank password", Map.of("username", USER, "password", " "));
        cases.put("neither", Map.of());
        for (Map.Entry<String, Map<String, Object>> entry : cases.entrySet()) {
            try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", status(200)))) {

                DatasourceTestResult result = test(server, entry.getValue());

                List<String> authorization = server.requests().get(0).header("Authorization");
                System.out.println("[EsConnectorLifecycleTest] " + entry.getKey() + ": Authorization " + authorization + ", success " + result.isSuccess());
                assertTrue(result.isSuccess(), entry.getKey());
                if (entry.getKey().equals("both")) {
                    assertEquals(List.of(expected), authorization);
                } else {
                    assertEquals(List.of(), authorization, entry.getKey());
                }
            }
        }
    }

    @Test
    public void thePathPrefixOfTheConnectionStringIsPrependedToEveryRequest() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(
                "/api/es/idx/_search", new Response(200, Map.of("Content-Type", List.of("application/json")), "{}".getBytes(StandardCharsets.UTF_8)),
                "/idx/_search", new Response(200, Map.of("Content-Type", List.of("application/json")), "{}".getBytes(StandardCharsets.UTF_8))))) {
            EsQueryExecutor executor = new EsQueryExecutor();
            String host = "127.0.0.1:" + server.port();
            // the scheme is optional (http by default); prefix parts are trimmed and joined with one slash
            for (String connectionString : List.of("http://" + host + "/api/es", host + "/ api / es ", host + "/api/es/")) {
                int before = server.requests().size();
                try (EsConnection connection = connector.createConnection(config(Map.of("connectionString", connectionString))).block(TIMEOUT)) {
                    executor.executeQuery(connection, executor.buildQueryExecutionContext(null, Map.of("httpMethod", "GET", "path", "idx/_search"),
                            Map.of(), null)).block(TIMEOUT);
                }
                String path = server.requests().get(before).pathAndQuery();
                System.out.println("[EsConnectorLifecycleTest] '" + connectionString + "' -> " + path);
                assertEquals("/api/es/idx/_search", path, connectionString);
            }
            try (EsConnection noPrefix = connector.createConnection(config(Map.of("connectionString", "http://" + host))).block(TIMEOUT)) {
                int before = server.requests().size();
                executorGet(noPrefix);
                assertEquals("/idx/_search", server.requests().get(before).pathAndQuery());
            }
        }
    }

    private static void executorGet(EsConnection connection) {
        EsQueryExecutor executor = new EsQueryExecutor();
        executor.executeQuery(connection, executor.buildQueryExecutionContext(null, Map.of("httpMethod", "GET", "path", "idx/_search"),
                Map.of(), null)).block(TIMEOUT);
    }

    @Test
    public void testConnectionAnswersSuccessOn200AndFailsWithTheReasonOrErrorForOtherOutcomes() throws Exception {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", status(200)))) {
            DatasourceTestResult ok = test(server, Map.of());
            assertTrue(ok.isSuccess());
            assertEquals("HEAD", server.requests().get(0).method());
            assertEquals("/", server.requests().get(0).pathAndQuery());
        }
        // a 2xx that is not 200 is a failure with the reason phrase; HEAD 404 is not an error to the client either
        for (Map.Entry<Integer, String> expected : Map.of(204, "No Content", 404, "Not Found").entrySet()) {
            try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", status(expected.getKey())))) {
                DatasourceTestResult result = test(server, Map.of());
                String message = result.getInvalidMessage(Locale.ENGLISH);
                System.out.println("[EsConnectorLifecycleTest] HEAD " + expected.getKey() + " -> " + message);
                assertFalse(result.isSuccess());
                assertTrue(message.contains(expected.getValue()), message);
            }
        }
        // an error status reaches the failure handler as an exception that names the status line
        for (Map.Entry<Integer, String> expected : Map.of(401, "401 Unauthorized", 500, "500 Internal Server Error").entrySet()) {
            try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", status(expected.getKey())))) {
                DatasourceTestResult result = test(server, Map.of());
                String message = result.getInvalidMessage(Locale.ENGLISH);
                System.out.println("[EsConnectorLifecycleTest] HEAD " + expected.getKey() + " -> " + message);
                assertFalse(result.isSuccess());
                assertTrue(message.contains(expected.getValue()), message);
            }
        }
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        DatasourceTestResult refused = connector.testConnection(config(Map.of("connectionString", "127.0.0.1:" + closedPort))).block(TIMEOUT);
        System.out.println("[EsConnectorLifecycleTest] closed port -> " + refused.getInvalidMessage(Locale.ENGLISH));
        assertFalse(refused.isSuccess());
        assertTrue(refused.getInvalidMessage(Locale.ENGLISH).contains("Connection refused"));
    }

    @Test
    public void testConnectionFailsWithTheTimeoutMessageWhenTheServerAnswersAfterTheConfiguredTimeout() {
        EsConnector shortTimeout = new EsConnector(new ConfigCenterForTest(Map.of(DATASOURCE_VALIDATE_TIMEOUT_KEY, 300)), new CommonConfig());
        try (RecordingHttpServer server = RecordingHttpServer.serve(Map.of("/", request -> {
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return status(200);
        }))) {

            DatasourceTestResult result = shortTimeout.testConnection(config(Map.of("connectionString", server.baseUrl()))).block(TIMEOUT);

            System.out.println("[EsConnectorLifecycleTest] slow server -> " + result.getInvalidMessage(Locale.ENGLISH));
            assertFalse(result.isSuccess());
            assertTrue(result.getInvalidMessage(Locale.ENGLISH).contains("timed out"));
        }
    }

    @Test
    public void destroyConnectionClosesTheClientAndAcceptsNull() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", status(200)))) {
            EsConnection connection = connector.createConnection(config(Map.of("connectionString", server.baseUrl()))).block(TIMEOUT);
            connection.reactorRestClientAdaptor().request(new Request("HEAD", "/")).block(TIMEOUT);

            connector.destroyConnection(connection).block(TIMEOUT);

            Throwable failure = assertThrows(RuntimeException.class,
                    () -> connection.reactorRestClientAdaptor().request(new Request("HEAD", "/")).block(TIMEOUT));
            System.out.println("[EsConnectorLifecycleTest] request after destroy -> " + failure);
            assertEquals(1, server.requests().size());
        }
        assertNull(connector.destroyConnection(null).block(TIMEOUT));
    }

    @Test
    public void aHostListedInDisallowedHostsIsRejectedBeforeAnyRequest() {
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.setDisallowedHosts(Set.of("127.0.0.1"));
        EsConnector guarded = new EsConnector(new ConfigCenterForTest(), commonConfig);
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/", status(200)))) {

            Throwable failure = assertThrows(BizException.class,
                    () -> guarded.createConnection(guarded.resolveConfig(Map.of("connectionString", "127.0.0.1:" + server.port()))).block(TIMEOUT));

            System.out.println("[EsConnectorLifecycleTest] disallowed host -> " + failure.getMessage());
            assertTrue(failure.getMessage().contains("connectionString"), failure.getMessage());
            assertEquals(0, server.requests().size());
        }
    }

    @Test
    public void invalidConnectionStringsAreRejectedAndAnEmptyOneIsReportedByValidateConfig() {
        for (String invalid : List.of("a://b://c", "host:abc", "host:1:2")) {
            Throwable failure = assertThrows(BizException.class,
                    () -> connector.createConnection(config(Map.of("connectionString", invalid))).block(TIMEOUT), invalid);
            System.out.println("[EsConnectorLifecycleTest] '" + invalid + "' -> " + failure.getMessage());
            assertTrue(failure.getMessage().contains("connectionString"), failure.getMessage());
        }
        assertEquals(Set.of("CONNECTION_STRING_EMPTY"), connector.validateConfig(config(Map.of("connectionString", " "))));
        assertEquals(Set.of(), connector.validateConfig(config(Map.of("connectionString", "host:9200"))));
        assertInstanceOf(EsDatasourceConfig.class, config(Map.of("connectionString", "host", "username", USER, "usingSsl", true)));
    }
}

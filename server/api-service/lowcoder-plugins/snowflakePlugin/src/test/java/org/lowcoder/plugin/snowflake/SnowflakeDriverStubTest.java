package org.lowcoder.plugin.snowflake;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Handler;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import tools.jackson.core.JacksonException;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit SN-3: the real Snowflake JDBC driver (snowflake-jdbc 3.22.0), loaded by {@link SnowflakeConnector} and talking to a local
 * stand-in of the Snowflake REST API ({@link RecordingHttpServer} answering the login, query, heartbeat and logout requests in
 * the shape of the service's JSON answers), so the driver loads, the Hikari pool initialises, a test connection succeeds and a
 * SELECT returns rows through {@link SnowflakeQueryExecutor}. Nothing of the driver is mocked, and nothing is set JVM-wide.
 *
 * <p>How the driver is pointed at the stand-in: {@code SnowflakeConnector} fixes the host ({@code <host>.snowflakecomputing.com})
 * and passes the datasource's {@code extParams} to the driver as connection properties ({@code SqlBasedConnector}). Those
 * properties are the driver's own ({@code SFSessionProperty}, read from the 3.22.0 jar): {@code useProxy}, {@code proxyHost},
 * {@code proxyPort} and {@code proxyProtocol=http} send every request, as a plain HTTP request with the full URL, to the stand-in
 * as if it were a proxy, and {@code ssl=off} makes the driver use {@code http} for the account host (no TLS, no OCSP).
 * {@code gzipDisabled=true} sends the query body as plain JSON, which the test reads. {@code JDBC_QUERY_RESULT_FORMAT=JSON} asks for the JSON result format, which the stand-in answers ({@code rowset}); Arrow, the
 * service's default, is not served.
 *
 * <p>Limits: the answers are made to resemble the service's, not recorded from an account (there is none in the tests), so they
 * show that the driver and the plugin work against that protocol shape, not that Snowflake answers so; only the JSON result
 * format, one chunk, no bind parameters, no MFA, key-pair or OAuth login; the structure query is not served.
 */
public class SnowflakeDriverStubTest {

    static final String TAG = "[SnowflakeDriverStubTest] ";
    static final Duration TIMEOUT = Duration.ofSeconds(60);
    static final ObjectMapper JSON = JsonMapper.builderWithJackson2Defaults().build();
    static final String LOGIN_PATH = "/session/v1/login-request";
    static final String QUERY_PATH = "/queries/v1/query-request";
    static final String HEARTBEAT_PATH = "/session/heartbeat";
    static final String SESSION_PATH = "/session";
    static final String HOST = "stub";
    static final String ACCOUNT_SUFFIX = ".snowflakecomputing.com";
    static final String DATABASE = "ANALYTICS";
    static final String USER = "LOADER";
    static final String PASSWORD = "stub-secret-pw";
    static final String SELECT_SQL = "SELECT 1 AS ID, 'x' AS NAME";
    static final String BAD_SQL = "SELECT * FROM MISSING_TABLE";
    static final String WRONG_LOGIN_CODE = "390100";
    static final String WRONG_LOGIN_MESSAGE = "Incorrect username or password was specified.";
    static final String COMPILATION_ERROR_CODE = "002003";
    static final String COMPILATION_ERROR_MESSAGE = "SQL compilation error:\nObject 'MISSING_TABLE' does not exist or not authorized.";
    static final String LOGOUT_QUERY = "delete=true";
    static final int OK = 200;

    /** The session parameters of a login answer, as the service sends them (a subset); the driver reads AUTOCOMMIT from them. */
    static final String LOGIN_PARAMETERS = "["
            + "{\"name\":\"AUTOCOMMIT\",\"value\":true},"
            + "{\"name\":\"CLIENT_SESSION_KEEP_ALIVE\",\"value\":false},"
            + "{\"name\":\"CLIENT_PREFETCH_THREADS\",\"value\":4},"
            + "{\"name\":\"CLIENT_RESULT_CHUNK_SIZE\",\"value\":160},"
            + "{\"name\":\"CLIENT_MEMORY_LIMIT\",\"value\":1536},"
            + "{\"name\":\"CLIENT_STAGE_ARRAY_BINDING_THRESHOLD\",\"value\":65280},"
            + "{\"name\":\"JDBC_QUERY_RESULT_FORMAT\",\"value\":\"JSON\"},"
            + "{\"name\":\"TIMEZONE\",\"value\":\"America/Los_Angeles\"},"
            + "{\"name\":\"DATE_OUTPUT_FORMAT\",\"value\":\"YYYY-MM-DD\"},"
            + "{\"name\":\"TIME_OUTPUT_FORMAT\",\"value\":\"HH24:MI:SS\"},"
            + "{\"name\":\"TIMESTAMP_OUTPUT_FORMAT\",\"value\":\"YYYY-MM-DD HH24:MI:SS.FF3 TZHTZM\"},"
            + "{\"name\":\"BINARY_OUTPUT_FORMAT\",\"value\":\"HEX\"}]";

    private static Response json(String body) {
        return new Response(OK, Map.of("Content-Type", List.of("application/json")), body.getBytes(StandardCharsets.UTF_8));
    }

    private static Response loginAccepted() {
        return json("{\"data\":{\"masterToken\":\"master-token\",\"token\":\"session-token\",\"validityInSeconds\":3600,"
                + "\"masterValidityInSeconds\":14400,\"displayUserName\":\"" + USER + "\",\"serverVersion\":\"8.40.0\",\"firstLogin\":false,"
                + "\"remMeToken\":null,\"remMeValidityInSeconds\":0,\"healthCheckInterval\":45,\"newClientForUpgrade\":null,"
                + "\"sessionId\":1001,\"parameters\":" + LOGIN_PARAMETERS + ",\"sessionInfo\":{\"databaseName\":\"" + DATABASE
                + "\",\"schemaName\":\"PUBLIC\",\"warehouseName\":\"WH\",\"roleName\":\"ANALYST\"},\"idToken\":null,"
                + "\"idTokenValidityInSeconds\":0,\"responseData\":null,\"mfaToken\":null,\"mfaTokenValidityInSeconds\":0},"
                + "\"code\":null,\"message\":null,\"success\":true}");
    }

    private static Response loginRefused() {
        return json("{\"data\":{\"nextAction\":\"RETRY_LOGIN\",\"authnMethod\":\"USERNAME_PASSWORD\",\"signInOptions\":{}},"
                + "\"code\":\"" + WRONG_LOGIN_CODE + "\",\"message\":\"" + WRONG_LOGIN_MESSAGE + "\",\"success\":false,\"headers\":null}");
    }

    private static Response selectAnswered() {
        return json("{\"data\":{\"parameters\":" + LOGIN_PARAMETERS + ",\"rowtype\":["
                + "{\"name\":\"ID\",\"database\":\"\",\"schema\":\"\",\"table\":\"\",\"nullable\":false,\"length\":null,\"type\":\"fixed\","
                + "\"scale\":0,\"precision\":1,\"byteLength\":null,\"collation\":null},"
                + "{\"name\":\"NAME\",\"database\":\"\",\"schema\":\"\",\"table\":\"\",\"nullable\":false,\"length\":1,\"type\":\"text\","
                + "\"scale\":null,\"precision\":null,\"byteLength\":4,\"collation\":null}],"
                + "\"rowset\":[[\"1\",\"x\"]],\"total\":1,\"returned\":1,\"queryId\":\"01b0a8c1-0000-0000-0000-000000000001\","
                + "\"databaseProvider\":null,\"finalDatabaseName\":\"" + DATABASE + "\",\"finalSchemaName\":\"PUBLIC\","
                + "\"finalWarehouseName\":\"WH\",\"finalRoleName\":\"ANALYST\",\"numberOfBinds\":0,\"arrayBindSupported\":false,"
                + "\"statementTypeId\":4096,\"version\":1,\"sendResultTime\":1700000000000,\"queryResultFormat\":\"json\"},"
                + "\"code\":null,\"message\":null,\"success\":true}");
    }

    private static Response compilationError() {
        return json("{\"data\":{\"internalError\":false,\"errorCode\":\"" + COMPILATION_ERROR_CODE + "\",\"age\":0,\"sqlState\":\"42S02\","
                + "\"queryId\":\"01b0a8c1-0000-0000-0000-000000000002\",\"line\":1,\"pos\":14,\"type\":\"COMPILATION\"},"
                + "\"code\":\"" + COMPILATION_ERROR_CODE + "\",\"message\":\"SQL compilation error:\\nObject 'MISSING_TABLE' does not exist or not authorized.\","
                + "\"success\":false,\"headers\":null}");
    }

    private static Response acknowledged() {
        return json("{\"data\":null,\"code\":null,\"message\":null,\"success\":true}");
    }

    /** The stand-in: login, query, heartbeat and logout, each answered by the given response of its path. */
    private static RecordingHttpServer standIn(Response login, Response query) {
        Map<String, Handler> handlers = new LinkedHashMap<>();
        handlers.put(LOGIN_PATH, request -> login);
        handlers.put(QUERY_PATH, request -> query);
        handlers.put(HEARTBEAT_PATH, request -> acknowledged());
        handlers.put(SESSION_PATH, request -> acknowledged());
        return RecordingHttpServer.serve(handlers);
    }

    /** The datasource of the stand-in: the driver's proxy properties name the stand-in's port. */
    private static SnowflakeDatasourceConfig datasource(RecordingHttpServer server, String password) {
        Map<String, Object> extParams = new LinkedHashMap<>();
        extParams.put("useProxy", "true");
        extParams.put("proxyHost", RecordingHttpServer.LOOPBACK);
        extParams.put("proxyPort", String.valueOf(server.port()));
        extParams.put("proxyProtocol", "http");
        extParams.put("ssl", "off");
        extParams.put("JDBC_QUERY_RESULT_FORMAT", "JSON");
        extParams.put("gzipDisabled", "true");
        extParams.put("loginTimeout", "20");
        return SnowflakeDatasourceConfig.builder().host(HOST).database(DATABASE).username(USER).password(password).extParams(extParams).build();
    }

    private static String pathOf(Request request) {
        return request.pathAndQuery().split("\\?")[0];
    }

    private static List<Request> requestsTo(RecordingHttpServer server, String path) {
        return server.requests().stream().filter(request -> pathOf(request).equals(path)).toList();
    }

    private static JsonNode bodyOf(Request request) {
        try {
            return JSON.readTree(request.bodyText());
        } catch (JacksonException e) {
            throw new IllegalStateException("not JSON: " + request.pathAndQuery(), e);
        }
    }

    private static void printRequests(RecordingHttpServer server) {
        server.requests().forEach(request -> System.out.println(TAG + "recorded " + request.method() + " " + request.pathAndQuery()
                + " (" + request.body().length + " bytes)"));
    }

    /** Waits for a logout the driver sends when its pool closes; it is sent from the closing thread, so it is there on return, with a short grace for the stand-in's own bookkeeping. */
    private static List<Request> logoutsOf(RecordingHttpServer server) {
        long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
        List<Request> logouts = requestsTo(server, SESSION_PATH).stream().filter(request -> request.pathAndQuery().contains(LOGOUT_QUERY)).toList();
        while (logouts.isEmpty() && System.nanoTime() < deadline) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
            logouts = requestsTo(server, SESSION_PATH).stream().filter(request -> request.pathAndQuery().contains(LOGOUT_QUERY)).toList();
        }
        return logouts;
    }

    @Test
    public void testConnectionLoadsTheDriverLogsInThroughTheProxyPropertiesAndLogsOut() {
        try (RecordingHttpServer server = standIn(loginAccepted(), selectAnswered())) {
            DatasourceTestResult result = new SnowflakeConnector().testConnection(datasource(server, PASSWORD)).block(TIMEOUT);
            printRequests(server);
            assertNotNull(result, "testConnection emits a result");
            assertTrue(result.isSuccess(), "the stand-in accepted the login, so the test passes");

            List<Request> logins = requestsTo(server, LOGIN_PATH);
            assertFalse(logins.isEmpty(), "the driver sent a login request to the stand-in: " + server.requests().stream().map(Request::pathAndQuery).toList());
            Request login = logins.get(0);
            assertEquals("POST", login.method());
            assertTrue(login.pathAndQuery().contains("databaseName=" + DATABASE), "the db property is the login's database: " + login.pathAndQuery());
            JsonNode data = bodyOf(login).path("data");
            assertEquals(HOST, data.path("ACCOUNT_NAME").asString(), "the account is the datasource's host");
            assertEquals(USER, data.path("LOGIN_NAME").asString(), "the user property is the login name");
            assertEquals(PASSWORD, data.path("PASSWORD").asString(), "the password property is the login password");
            assertEquals("JSON", data.path("SESSION_PARAMETERS").path("JDBC_QUERY_RESULT_FORMAT").asString(), "the extParams reach the driver as session parameters");
            assertEquals("JDBC", data.path("CLIENT_APP_ID").asString(), "the request is the JDBC driver's");

            List<Request> logouts = logoutsOf(server);
            assertFalse(logouts.isEmpty(), "closing the tested pool logged the session out: " + server.requests().stream().map(Request::pathAndQuery).toList());
            assertEquals("POST", logouts.get(0).method());
        }
    }

    @Test
    public void aSelectRunsThroughTheExecutorAndItsRowsComeFromTheJsonRowset() throws SQLException {
        try (RecordingHttpServer server = standIn(loginAccepted(), selectAnswered())) {
            SnowflakeConnector connector = new SnowflakeConnector();
            SnowflakeDatasourceConfig config = datasource(server, PASSWORD);
            HikariPerfWrapper pool = connector.createConnection(config).block(TIMEOUT);
            try {
                assertNotNull(pool, "createConnection emits the pool");
                HikariDataSource dataSource = (HikariDataSource) pool.getHikariDataSource();
                assertTrue(dataSource.isRunning(), "the pool is running");
                assertEquals("net.snowflake.client.jdbc.SnowflakeDriver", dataSource.getDriverClassName());
                assertEquals("jdbc:snowflake://" + HOST + ACCOUNT_SUFFIX + "/", dataSource.getJdbcUrl());
                try (Connection connection = dataSource.getConnection()) {
                    DatabaseMetaData metaData = connection.getMetaData();
                    System.out.println(TAG + "driver " + metaData.getDriverName() + " " + metaData.getDriverVersion());
                    assertTrue(metaData.getDriverVersion().startsWith("3.22"), "the driver is snowflake-jdbc 3.22.x: " + metaData.getDriverVersion());
                }

                SnowflakeQueryExecutor executor = new SnowflakeQueryExecutor();
                Map<String, Object> queryConfig = new LinkedHashMap<>();
                queryConfig.put("mode", "SQL");
                queryConfig.put("sql", SELECT_SQL);
                SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(config, queryConfig, Map.of(), null);
                QueryExecutionResult result = executor.executeQuery(pool, context).block(TIMEOUT);
                printRequests(server);
                assertNotNull(result);
                System.out.println(TAG + "select -> " + result.getQueryCode() + " " + result.getData());
                assertEquals("OK", result.getQueryCode());
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> rows = (List<Map<String, Object>>) result.getData();
                assertEquals(1, rows.size(), "one row from the rowset");
                assertEquals(1L, ((Number) rows.get(0).get("ID")).longValue(), "the fixed(1,0) column is read as a number: " + rows.get(0));
                assertEquals("x", rows.get(0).get("NAME"), "the text column is read as text: " + rows.get(0));

                List<Request> queries = requestsTo(server, QUERY_PATH);
                assertEquals(1, queries.size(), "one query request reached the stand-in");
                JsonNode sent = bodyOf(queries.get(0));
                assertEquals(SELECT_SQL, sent.path("sqlText").asString(), "the statement is sent as written (no bind parameters: the executor forces a plain statement)");
                assertTrue(queries.get(0).header("Authorization").stream().anyMatch(value -> value.contains("session-token")),
                        "the query carries the session token of the login answer: " + queries.get(0).header("Authorization"));
            } finally {
                connector.destroyConnection(pool).block(TIMEOUT);
            }
            assertFalse(logoutsOf(server).isEmpty(), "destroying the pool logged the session out");
        }
    }

    @Test
    public void aRefusedLoginIsAFailedTestConnectionWithTheServicesMessage() {
        try (RecordingHttpServer server = standIn(loginRefused(), selectAnswered())) {
            SnowflakeConnector connector = new SnowflakeConnector();
            RuntimeException thrown = assertThrows(RuntimeException.class,
                    () -> connector.testConnection(datasource(server, "wrong-password")).block(TIMEOUT), "a refused login must not give a result");
            System.out.println(TAG + "refused login: " + thrown.getClass().getSimpleName() + ": " + thrown.getMessage());
            assertTrue(String.valueOf(thrown.getMessage()).contains(WRONG_LOGIN_MESSAGE), "the error carries the service's text: " + thrown.getMessage());
            assertFalse(requestsTo(server, LOGIN_PATH).isEmpty(), "the login request reached the stand-in");
            // what DatasourceServiceImpl.testDatasourceLocally does with the error
            DatasourceTestResult mapped = connector.testConnection(datasource(server, "wrong-password"))
                    .onErrorResume(error -> reactor.core.publisher.Mono.just(DatasourceTestResult.testFail(error))).block(TIMEOUT);
            assertNotNull(mapped);
            assertFalse(mapped.isSuccess(), "the mapped result is a failure");
            String message = mapped.getInvalidMessage(Locale.ENGLISH);
            System.out.println(TAG + "mapped failed result: " + message);
            assertTrue(message.contains(WRONG_LOGIN_MESSAGE), message);
            assertTrue(requestsTo(server, QUERY_PATH).isEmpty(), "no query was sent after a refused login");
        }
    }

    @Test
    public void aStatementTheServiceRefusesIsAPluginExceptionWithItsMessage() {
        try (RecordingHttpServer server = standIn(loginAccepted(), compilationError())) {
            SnowflakeConnector connector = new SnowflakeConnector();
            SnowflakeDatasourceConfig config = datasource(server, PASSWORD);
            HikariPerfWrapper pool = connector.createConnection(config).block(TIMEOUT);
            try {
                SnowflakeQueryExecutor executor = new SnowflakeQueryExecutor();
                Map<String, Object> queryConfig = new LinkedHashMap<>();
                queryConfig.put("mode", "SQL");
                queryConfig.put("sql", BAD_SQL);
                SqlBasedQueryExecutionContext context = executor.buildQueryExecutionContext(config, queryConfig, Map.of(), null);
                Throwable failure = assertThrows(Throwable.class, () -> executor.executeQuery(pool, context).block(TIMEOUT));
                System.out.println(TAG + "refused statement: " + failure.getClass().getSimpleName() + ": " + failure.getMessage());
                assertInstanceOf(PluginException.class, failure, "the executor maps the driver's SQLException: " + failure);
                assertTrue(String.valueOf(failure.getMessage()).contains("MISSING_TABLE"), "the service's message is kept: " + failure.getMessage());
                assertEquals(1, requestsTo(server, QUERY_PATH).size(), "the statement reached the stand-in");
            } finally {
                connector.destroyConnection(pool).block(TIMEOUT);
            }
        }
    }
}

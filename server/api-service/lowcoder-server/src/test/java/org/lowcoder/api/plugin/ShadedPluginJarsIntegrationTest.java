package org.lowcoder.api.plugin;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import jakarta.mail.Multipart;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.plugin.service.impl.DatasourceMetaInfoServiceImpl;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Handler;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.pf4j.PluginClassLoader;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.api.plugin.PluginServers.DATABASE;
import static org.lowcoder.api.plugin.PluginServers.PASSWORD;
import static org.lowcoder.api.plugin.PluginServers.USER;
import static org.lowcoder.api.plugin.PluginServers.WRONG_PASSWORD;

/**
 * The datasource plugins as production loads them: the shaded plugin jars that lowcoder-server's build copies into the plugins
 * directory ({@code pf4j.pluginsDir}), loaded by a pf4j plugin manager set up the way the server sets it up
 * ({@link ShadedPluginHarness}), then driven through the {@code do*} wrappers of {@link DatasourceConnector} and
 * {@link QueryExecutor} that the server calls, in the server's order: resolve the config from its JSON map, validate it, test the
 * connection, create the connection, build the query context ({@code buildQueryExecutionContextMono}), execute, destroy.
 * No plugin module is on this module's test class path, so everything that runs here is a class of a shaded jar, loaded by the plugin's
 * own class loader.
 *
 * <p>Covered: the 13 shipped jars load and start; for postgres, mysql, clickhouse, mongo, redis (pinned containers, {@link PluginServers}),
 * smtp (GreenMail) and restapi, graphql ({@link RecordingHttpServer}) the plugin class, its extensions and its shaded libraries come from
 * the plugin's class loader while the {@code provided} classes (SDK, reactor, the Mongo driver, jakarta.mail, Spring WebClient) resolve
 * through the parent; {@code DatasourceMetaInfoServiceImpl} finds the same extensions by datasource type; and each of those eight
 * datasources passes test-connection (and, where the plugin has credentials, fails it with a wrong one), creates a connection, runs one
 * write and one read (REST and GraphQL: a mutating and a reading request; SMTP: a mail sent and read back from the server; Redis: SET and
 * GET; Mongo: insert and find).
 *
 * <p>Limits: mssql, oracle, elasticsearch (heavy containers), googleSheets (needs a Google account) and snowflake (its stand-in test is in
 * the plugin) only load here; the validation step is run for every datasource and pinned for the two plugins that refuse a loopback host
 * (Mongo and Redis: the containers are on loopback, so their execution steps skip the validation the server would apply first); the
 * negative cases (a jar without its extension index) are in {@link ShadedPluginJarsNegativeIntegrationTest}.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
public class ShadedPluginJarsIntegrationTest {

    static final String TAG = "[ShadedPluginJarsIntegrationTest] ";
    static final Duration TIMEOUT = Duration.ofSeconds(60);
    static final String QUERY_CODE_OK = "OK";
    static final ObjectMapper JSON = JsonMapper.builderWithJackson2Defaults().build();

    static final String POSTGRES = "postgres-plugin";
    static final String MYSQL = "mysql-plugin";
    static final String CLICKHOUSE = "clickHouse-plugin";
    static final String MONGO = "mongo-plugin";
    static final String REDIS = "redis-plugin";
    static final String SMTP = "smtp-plugin";
    static final String RESTAPI = "restapi-plugin";
    static final String GRAPHQL = "graphql-plugin";
    static final Set<String> SHIPPED_PLUGIN_IDS = Set.of(POSTGRES, MYSQL, CLICKHOUSE, MONGO, REDIS, SMTP, RESTAPI, GRAPHQL,
            "mssql-plugin", "oracle-plugin", "es-plugin", "googleSheets-plugin", "snowflake-plugin");

    static final String SDK_CONNECTOR_CLASS = "org.lowcoder.sdk.plugin.common.DatasourceConnector";
    static final String REACTOR_CLASS = "reactor.core.publisher.Mono";
    static final String MONGO_DRIVER_CLASS = "com.mongodb.reactivestreams.client.MongoClients";
    static final String JAKARTA_MAIL_CLASS = "jakarta.mail.Session";
    static final String WEB_CLIENT_CLASS = "org.springframework.web.reactive.function.client.WebClient";
    static final String COMMONS_COLLECTIONS_CLASS = "org.apache.commons.collections4.ListUtils";

    static final String SMTP_LOGIN = "mailer";
    static final String SMTP_PASSWORD = "mailer-pw";
    static final String SMTP_LOGIN_EMAIL = "mailer@example.com";
    static final String LOOPBACK = "127.0.0.1";
    static final String INVALID_HOST = "INVALID_HOST";
    static final String REST_ITEMS_PATH = "/items";
    static final String GRAPHQL_PATH = "/graphql";
    static final long MAIL_WAIT_MILLIS = 10_000;

    private static ShadedPluginHarness harness;
    private static DatasourceMetaInfoServiceImpl metaInfo;
    private static GreenMail mailServer;
    private static RecordingHttpServer restServer;
    private static RecordingHttpServer graphqlServer;

    @BeforeAll
    static void start() {
        long start = System.nanoTime();
        harness = ShadedPluginHarness.production();
        metaInfo = harness.metaInfoService();
        System.out.println(TAG + "plugin manager loaded " + harness.manager().getPlugins().size() + " plugins from " + System.getProperty(ShadedPluginHarness.PLUGINS_DIR_PROPERTY)
                + " in " + (System.nanoTime() - start) / 1_000_000 + " ms");

        mailServer = new GreenMail(new ServerSetup(0, LOOPBACK, ServerSetup.PROTOCOL_SMTP));
        mailServer.withConfiguration(GreenMailConfiguration.aConfig().withUser(SMTP_LOGIN_EMAIL, SMTP_LOGIN, SMTP_PASSWORD));
        mailServer.start();

        restServer = RecordingHttpServer.serve(restHandlers());
        graphqlServer = RecordingHttpServer.serve(graphqlHandlers());
        PluginServers.host();
        System.out.println(TAG + "all servers up after " + (System.nanoTime() - start) / 1_000_000 + " ms: smtp " + mailServer.getSmtp().getPort()
                + ", rest " + restServer.baseUrl() + ", graphql " + graphqlServer.baseUrl());
    }

    @AfterAll
    static void stop() {
        if (harness != null) {
            harness.close();
        }
        if (mailServer != null) {
            mailServer.stop();
        }
        if (restServer != null) {
            restServer.close();
        }
        if (graphqlServer != null) {
            graphqlServer.close();
        }
    }

    // ---- the stand-in HTTP servers

    private static Response jsonResponse(int status, String body) {
        return new Response(status, Map.of("Content-Type", List.of("application/json")), body.getBytes(StandardCharsets.UTF_8));
    }

    private static Map<String, Handler> restHandlers() {
        Map<String, Handler> handlers = new LinkedHashMap<>();
        handlers.put(REST_ITEMS_PATH, request -> "POST".equals(request.method())
                ? jsonResponse(201, "{\"id\":7,\"created\":" + request.bodyText() + "}")
                : jsonResponse(200, "{\"items\":[{\"id\":7,\"name\":\"widget\"}]}"));
        return handlers;
    }

    private static Map<String, Handler> graphqlHandlers() {
        Map<String, Handler> handlers = new LinkedHashMap<>();
        handlers.put(GRAPHQL_PATH, request -> request.bodyText().contains("mutation")
                ? jsonResponse(200, "{\"data\":{\"addHero\":{\"id\":\"42\"}}}")
                : jsonResponse(200, "{\"data\":{\"hero\":{\"name\":\"R2-D2\"}}}"));
        return handlers;
    }

    // ---- one datasource driven through the server's wrappers

    /** A datasource of a plugin: its connector and executor extensions (by plugin id) and the config the connector resolves from the JSON map. */
    private static final class Datasource {
        final String pluginId;
        final DatasourceConnector connector;
        final QueryExecutor executor;
        final DatasourceConnectionConfig config;

        Datasource(String pluginId, Map<String, Object> configMap) {
            this.pluginId = pluginId;
            List<DatasourceConnector> connectors = harness.extensions(DatasourceConnector.class, pluginId);
            List<QueryExecutor> executors = harness.extensions(QueryExecutor.class, pluginId);
            assertEquals(1, connectors.size(), pluginId + ": exactly one DatasourceConnector extension, found " + connectors);
            assertEquals(1, executors.size(), pluginId + ": exactly one QueryExecutor extension, found " + executors);
            this.connector = connectors.get(0);
            this.executor = executors.get(0);
            this.config = connector.resolveConfig(configMap);
            assertNotNull(config, pluginId + ": resolveConfig answered a config");
        }

        Set<String> validate() {
            return connector.doValidateConfig(config);
        }

        /** As {@code DatasourceServiceImpl.testDatasourceLocally}: an error of the test is a failed result. */
        DatasourceTestResult test() {
            DatasourceTestResult result = (DatasourceTestResult) connector.doTestConnection(config)
                    .timeout(TIMEOUT)
                    .onErrorResume(error -> Mono.just(DatasourceTestResult.testFail((Throwable) error)))
                    .block(TIMEOUT);
            assertNotNull(result, pluginId + ": test connection emitted a result");
            System.out.println(TAG + pluginId + " test connection: success=" + result.isSuccess()
                    + (result.isSuccess() ? "" : " message=" + result.getInvalidMessage(Locale.ENGLISH)));
            return result;
        }

        Object connect() {
            Object connection = connector.doCreateConnection(config).block(TIMEOUT);
            assertNotNull(connection, pluginId + ": doCreateConnection emitted a connection");
            return connection;
        }

        /** As {@code QueryExecutionServiceImpl.executeLocally}: build the context, then execute it on the connection. */
        QueryExecutionResult run(Object connection, Map<String, Object> queryConfig) {
            QueryVisitorContext visitor = new QueryVisitorContext("userId1", "workspace1", 8080, null, null, null);
            Object context = executor.buildQueryExecutionContextMono(config, queryConfig, Map.of(), visitor).block(TIMEOUT);
            assertNotNull(context, pluginId + ": the query context was built");
            QueryExecutionResult result = (QueryExecutionResult) executor.doExecuteQuery(connection, (QueryExecutionContext) context).block(TIMEOUT);
            assertNotNull(result, pluginId + ": the query emitted a result");
            System.out.println(TAG + pluginId + " query " + queryConfig + " -> " + result.getQueryCode() + " " + result.getData());
            return result;
        }

        void destroy(Object connection) {
            connector.destroyConnection(connection).block(TIMEOUT);
        }
    }

    private static String unique(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    // ---- the jars load, and from the plugin's class loader

    @Test
    public void everyShippedPluginJarLoadsAndStarts() {
        Set<String> loaded = new java.util.TreeSet<>();
        harness.manager().getPlugins().forEach(plugin -> loaded.add(plugin.getPluginId()));
        System.out.println(TAG + "loaded plugins: " + loaded);
        assertEquals(new java.util.TreeSet<>(SHIPPED_PLUGIN_IDS), loaded, "the plugins directory holds exactly the 13 shaded plugin jars");
        for (String pluginId : SHIPPED_PLUGIN_IDS) {
            assertTrue(harness.isStarted(pluginId), pluginId + " is STARTED, it is " + harness.plugin(pluginId).getPluginState());
        }
    }

    static Stream<Arguments> loaders() {
        return Stream.of(
                Arguments.of(POSTGRES, "org.lowcoder.plugin.postgres.PostgresPlugin", "org.postgresql.Driver", List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS)),
                Arguments.of(MYSQL, "org.lowcoder.plugin.mysql.MysqlPlugin", "com.mysql.cj.jdbc.Driver", List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS)),
                Arguments.of(CLICKHOUSE, "org.lowcoder.plugin.clickhouse.ClickHousePlugin", "com.clickhouse.jdbc.ClickHouseDriver", List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS)),
                Arguments.of(MONGO, "org.lowcoder.plugin.mongo.MongoPlugin", COMMONS_COLLECTIONS_CLASS, List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS, MONGO_DRIVER_CLASS)),
                Arguments.of(REDIS, "org.lowcoder.plugin.redis.RedisPlugin", "redis.clients.jedis.Jedis", List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS)),
                Arguments.of(SMTP, "org.lowcoder.plugins.SmtpPlugin", COMMONS_COLLECTIONS_CLASS, List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS, JAKARTA_MAIL_CLASS)),
                Arguments.of(RESTAPI, "org.lowcoder.plugin.restapi.RestApiPlugin", COMMONS_COLLECTIONS_CLASS, List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS, WEB_CLIENT_CLASS)),
                Arguments.of(GRAPHQL, "org.lowcoder.plugin.graphql.GraphQLPlugin", COMMONS_COLLECTIONS_CLASS, List.of(SDK_CONNECTOR_CLASS, REACTOR_CLASS, WEB_CLIENT_CLASS)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("loaders")
    public void pluginExtensionsAndShadedLibrariesComeFromThePluginClassLoaderAndProvidedClassesFromTheParent(String pluginId,
            String pluginClass, String shadedClass, List<String> providedClasses) throws Exception {
        ClassLoader appLoader = ShadedPluginJarsIntegrationTest.class.getClassLoader();
        PluginWrapper wrapper = harness.plugin(pluginId);
        assertNotNull(wrapper, pluginId + " is loaded");
        ClassLoader pluginLoader = harness.manager().getPluginClassLoader(pluginId);
        System.out.println(TAG + pluginId + ": plugin loader " + pluginLoader.getClass().getName() + ", parent " + pluginLoader.getParent()
                + ", test loader " + appLoader);
        assertInstanceOf(PluginClassLoader.class, pluginLoader, "the plugin has a pf4j PluginClassLoader");
        assertNotSame(appLoader, pluginLoader, "the plugin's loader is not the application's");

        Object plugin = wrapper.getPlugin();
        assertEquals(pluginClass, plugin.getClass().getName());
        assertSame(pluginLoader, plugin.getClass().getClassLoader(), "the Plugin class is loaded by the plugin's loader");

        for (Class<?> type : List.of(DatasourceConnector.class, QueryExecutor.class)) {
            List<?> extensions = harness.extensions(type, pluginId);
            assertEquals(1, extensions.size(), pluginId + ": one " + type.getSimpleName() + " extension");
            Class<?> extensionClass = extensions.get(0).getClass();
            System.out.println(TAG + pluginId + ": " + type.getSimpleName() + " extension " + extensionClass.getName() + " loaded by " + extensionClass.getClassLoader());
            assertSame(pluginLoader, extensionClass.getClassLoader(), type.getSimpleName() + " extension class comes from the plugin's loader");
            assertTrue(type.isAssignableFrom(extensionClass), "the extension implements the application's " + type.getName());
        }

        Class<?> shaded = Class.forName(shadedClass, false, pluginLoader);
        System.out.println(TAG + pluginId + ": shaded " + shadedClass + " loaded by " + shaded.getClassLoader());
        assertSame(pluginLoader, shaded.getClassLoader(), shadedClass + " is a library shaded into the jar, loaded by the plugin's loader");

        for (String provided : providedClasses) {
            Class<?> viaPlugin = Class.forName(provided, false, pluginLoader);
            Class<?> viaApplication = Class.forName(provided, false, appLoader);
            System.out.println(TAG + pluginId + ": provided " + provided + " loaded by " + viaPlugin.getClassLoader());
            assertSame(viaApplication, viaPlugin, provided + " is the application's class, resolved through the plugin's parent");
            assertNotSame(pluginLoader, viaPlugin.getClassLoader(), provided + " is not loaded by the plugin's loader");
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("typesAndPlugins")
    public void metaInfoServiceFindsTheSameExtensionsByDatasourceType(String datasourceType, String pluginId) {
        DatasourceConnector connector = metaInfo.getDatasourceConnector(datasourceType);
        QueryExecutor executor = metaInfo.getQueryExecutor(datasourceType);
        ClassLoader pluginLoader = harness.manager().getPluginClassLoader(pluginId);
        System.out.println(TAG + datasourceType + " -> " + connector.getClass().getName() + " / " + executor.getClass().getName());
        assertSame(pluginLoader, connector.getClass().getClassLoader(), datasourceType + ": the connector is the " + pluginId + " extension");
        assertSame(pluginLoader, executor.getClass().getClassLoader(), datasourceType + ": the executor is the " + pluginId + " extension");
        assertEquals(harness.extensions(DatasourceConnector.class, pluginId).get(0).getClass(), connector.getClass());
        assertEquals(harness.extensions(QueryExecutor.class, pluginId).get(0).getClass(), executor.getClass());
    }

    static Stream<Arguments> typesAndPlugins() {
        return Stream.of(Arguments.of("postgres", POSTGRES), Arguments.of("mysql", MYSQL), Arguments.of("mariadb", MYSQL),
                Arguments.of("clickHouse", CLICKHOUSE), Arguments.of("mongodb", MONGO), Arguments.of("redis", REDIS),
                Arguments.of("smtp", SMTP), Arguments.of("restApi", RESTAPI), Arguments.of("graphql", GRAPHQL));
    }

    // ---- SQL plugins

    private static Map<String, Object> sqlConfig(String sql) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("mode", "SQL");
        config.put("sql", sql);
        config.put("disablePreparedStatement", false);
        return config;
    }

    private static Map<String, Object> sqlDatasource(int port, String password) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("database", DATABASE);
        config.put("username", USER);
        config.put("password", password);
        config.put("host", PluginServers.host());
        config.put("port", port);
        config.put("usingSsl", false);
        return config;
    }

    /** Test connection (right and wrong password), create connection, a CREATE and an INSERT, and a SELECT that reads the row back. */
    private void sqlLifecycle(String pluginId, int port, String createSql, String insertSql, String selectSql, String wrongPasswordText,
            Set<String> expectedValidation) {
        Datasource wrong = new Datasource(pluginId, sqlDatasource(port, WRONG_PASSWORD));
        DatasourceTestResult refused = wrong.test();
        assertFalse(refused.isSuccess(), pluginId + ": a wrong password fails test-connection");
        assertTrue(refused.getInvalidMessage(Locale.ENGLISH).contains(wrongPasswordText),
                pluginId + ": the failed result names the refusal (" + wrongPasswordText + "): " + refused.getInvalidMessage(Locale.ENGLISH));

        Datasource datasource = new Datasource(pluginId, sqlDatasource(port, PASSWORD));
        Set<String> invalid = datasource.validate();
        System.out.println(TAG + pluginId + " validation of " + datasource.config.getClass().getSimpleName() + ": " + invalid);
        assertEquals(expectedValidation, invalid, pluginId + ": the validation of a config whose host is " + PluginServers.host());
        assertTrue(datasource.test().isSuccess(), pluginId + ": the right credentials pass test-connection");

        Object connection = datasource.connect();
        try {
            assertEquals(QUERY_CODE_OK, datasource.run(connection, sqlConfig(createSql)).getQueryCode(), pluginId + ": the CREATE succeeds");
            assertEquals(QUERY_CODE_OK, datasource.run(connection, sqlConfig(insertSql)).getQueryCode(), pluginId + ": the INSERT succeeds");
            QueryExecutionResult read = datasource.run(connection, sqlConfig(selectSql));
            assertEquals(QUERY_CODE_OK, read.getQueryCode());
            List<Map<String, Object>> rows = (List<Map<String, Object>>) read.getData();
            assertEquals(1, rows.size(), pluginId + ": the SELECT reads the inserted row back: " + rows);
            assertEquals(1, ((Number) rows.get(0).get("id")).intValue(), pluginId + ": id of " + rows);
            assertEquals("shaded", rows.get(0).get("name"), pluginId + ": name of " + rows);
        } finally {
            datasource.destroy(connection);
        }
    }

    @Test
    public void postgresPluginRunsFromItsShadedJar() {
        String table = unique("e2e_pg");
        sqlLifecycle(POSTGRES, PluginServers.postgresPort(), "create table " + table + " (id int primary key, name text)",
                "insert into " + table + " values (1, 'shaded')", "select id, name from " + table, "password authentication failed", Set.of());
    }

    @Test
    public void mysqlPluginRunsFromItsShadedJar() {
        String table = unique("e2e_my");
        sqlLifecycle(MYSQL, PluginServers.mysqlPort(), "create table " + table + " (id int primary key, name varchar(20))",
                "insert into " + table + " values (1, 'shaded')", "select id, name from " + table, "Access denied", Set.of());
    }

    /** The ClickHouse validation refuses a loopback host like Mongo's and Redis's (postgres and mysql accept it), and the container is on loopback, so it is pinned here and the execution steps go on without applying it. */
    @Test
    public void clickhousePluginRunsFromItsShadedJar() {
        String table = unique("e2e_ch");
        sqlLifecycle(CLICKHOUSE, PluginServers.clickhousePort(), "create table " + table + " (id Int32, name String) engine = Memory",
                "insert into " + table + " values (1, 'shaded')", "select id, name from " + table, "Authentication failed", Set.of(INVALID_HOST));
    }

    // ---- Mongo

    private static Map<String, Object> mongoDatasource(String password) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("host", PluginServers.host());
        config.put("port", PluginServers.mongoPort());
        config.put("database", DATABASE);
        config.put("username", USER);
        config.put("password", password);
        return config;
    }

    private static Map<String, Object> mongoForm(String type, String collection, String... compKeysAndValues) {
        Map<String, Object> comp = new HashMap<>();
        for (int i = 0; i < compKeysAndValues.length; i += 2) {
            comp.put(compKeysAndValues[i], compKeysAndValues[i + 1]);
        }
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        form.put("collection", collection);
        form.put("comp", comp);
        return form;
    }

    @Test
    public void mongoPluginRunsFromItsShadedJar() throws Exception {
        DatasourceTestResult refused = new Datasource(MONGO, mongoDatasource(WRONG_PASSWORD)).test();
        assertFalse(refused.isSuccess(), "a wrong password fails the Mongo test-connection");
        assertTrue(refused.getInvalidMessage(Locale.ENGLISH).contains("Exception authenticating"), refused.getInvalidMessage(Locale.ENGLISH));

        Datasource datasource = new Datasource(MONGO, mongoDatasource(PASSWORD));
        Set<String> invalid = datasource.validate();
        System.out.println(TAG + MONGO + " validation of a loopback host: " + invalid);
        assertFalse(invalid.isEmpty(), "the Mongo validation refuses a loopback host (the container is on loopback, so the server's validation step is not applied below)");
        assertTrue(datasource.test().isSuccess(), "the app user passes the Mongo test-connection");

        Object connection = datasource.connect();
        try {
            String collection = unique("e2e_mongo");
            QueryExecutionResult inserted = datasource.run(connection, mongoForm("INSERT", collection, "documents", "{\"n\": 1, \"name\": \"shaded\"}"));
            assertEquals(QUERY_CODE_OK, inserted.getQueryCode());
            assertEquals("{\"n\":1}", String.valueOf(inserted.getData()), "one document inserted");
            QueryExecutionResult found = datasource.run(connection, mongoForm("FIND", collection, "projection", "{\"_id\": 0}"));
            assertEquals(QUERY_CODE_OK, found.getQueryCode());
            assertEquals(JSON.readTree("[{\"n\":1,\"name\":\"shaded\"}]"), JSON.readTree(String.valueOf(found.getData())), "the inserted document is read back");
        } finally {
            datasource.destroy(connection);
        }
    }

    // ---- Redis

    private static Map<String, Object> redisDatasource(String password) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("host", PluginServers.host());
        config.put("port", PluginServers.redisPort());
        config.put("password", password);
        return config;
    }

    private static Map<String, Object> redisForm(String command, String... compKeysAndValues) {
        Map<String, Object> comp = new HashMap<>();
        for (int i = 0; i < compKeysAndValues.length; i += 2) {
            comp.put(compKeysAndValues[i], compKeysAndValues[i + 1]);
        }
        Map<String, Object> form = new HashMap<>();
        form.put("compType", command);
        form.put("comp", comp);
        return form;
    }

    @Test
    public void redisPluginRunsFromItsShadedJar() {
        DatasourceTestResult refused = new Datasource(REDIS, redisDatasource(WRONG_PASSWORD)).test();
        assertFalse(refused.isSuccess(), "a wrong password fails the Redis test-connection");

        Datasource datasource = new Datasource(REDIS, redisDatasource(PluginServers.REDIS_PASSWORD));
        Set<String> invalid = datasource.validate();
        System.out.println(TAG + REDIS + " validation of a loopback host: " + invalid);
        assertEquals(Set.of(INVALID_HOST), invalid, "the Redis validation refuses a loopback host (the container is on loopback, so the server's validation step is not applied below)");
        assertTrue(datasource.test().isSuccess(), "the right password passes the Redis test-connection");

        Object connection = datasource.connect();
        try {
            String key = unique("e2e:redis");
            QueryExecutionResult set = datasource.run(connection, redisForm("SET", "key", key, "value", "shaded"));
            assertEquals(QUERY_CODE_OK, set.getQueryCode());
            assertEquals("OK", String.valueOf(set.getData()), "SET answers OK");
            QueryExecutionResult get = datasource.run(connection, redisForm("GET", "key", key));
            assertEquals(QUERY_CODE_OK, get.getQueryCode());
            assertEquals("shaded", String.valueOf(get.getData()), "GET reads the value back");
        } finally {
            datasource.destroy(connection);
        }
    }

    // ---- SMTP

    private static Map<String, Object> smtpDatasource(String password) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("host", LOOPBACK);
        config.put("port", mailServer.getSmtp().getPort());
        config.put("username", SMTP_LOGIN);
        config.put("password", password);
        return config;
    }

    @Test
    public void smtpPluginRunsFromItsShadedJarAndTheMailIsReadBackFromTheServer() throws Exception {
        DatasourceTestResult refused = new Datasource(SMTP, smtpDatasource("wrong-" + SMTP_PASSWORD)).test();
        assertFalse(refused.isSuccess(), "a wrong password fails the SMTP test-connection");

        Datasource datasource = new Datasource(SMTP, smtpDatasource(SMTP_PASSWORD));
        Set<String> invalid = datasource.validate();
        System.out.println(TAG + SMTP + " validation: " + invalid);
        assertTrue(invalid.isEmpty(), "the SMTP config is valid: " + invalid);
        assertTrue(datasource.test().isSuccess(), "the right login passes the SMTP test-connection");

        String subject = unique("e2e-subject");
        Object session = datasource.connect();
        try {
            Map<String, Object> mail = new HashMap<>();
            mail.put("from", "sender@example.com");
            mail.put("to", "[\"recipient@example.com\"]");
            mail.put("subject", subject);
            mail.put("content", "<p>Hello <b>plugin</b></p>");
            QueryExecutionResult sent = datasource.run(session, mail);
            assertEquals(QUERY_CODE_OK, sent.getQueryCode(), "the send succeeds");
        } finally {
            datasource.destroy(session);
        }
        assertTrue(mailServer.waitForIncomingEmail(MAIL_WAIT_MILLIS, 1), "the server received the mail");
        MimeMessage[] received = mailServer.getReceivedMessages();
        MimeMessage message = received[received.length - 1];
        System.out.println(TAG + "mail read back: subject=" + message.getSubject() + " from=" + message.getFrom()[0] + " to=" + message.getAllRecipients()[0]);
        assertEquals(subject, message.getSubject());
        assertEquals("sender@example.com", ((InternetAddress) message.getFrom()[0]).getAddress());
        assertEquals("recipient@example.com", ((InternetAddress) message.getAllRecipients()[0]).getAddress());
        Multipart body = (Multipart) message.getContent();
        assertEquals("<p>Hello <b>plugin</b></p>", body.getBodyPart(0).getContent(), "the HTML body is read back");
    }

    // ---- REST API and GraphQL

    @Test
    public void restApiPluginRunsFromItsShadedJar() throws Exception {
        Datasource datasource = new Datasource(RESTAPI, Map.of("url", restServer.baseUrl()));
        assertTrue(datasource.validate().isEmpty(), "the REST API config is valid");
        assertTrue(datasource.test().isSuccess(), "the REST API test-connection passes (it makes no request)");
        int before = restServer.requests().size();

        Object connection = datasource.connect();
        try {
            Map<String, Object> write = new HashMap<>();
            write.put("httpMethod", "POST");
            write.put("path", REST_ITEMS_PATH);
            write.put("body", "{\"name\":\"widget\"}");
            write.put("headers", List.of(Map.of("key", "Content-Type", "value", "application/json")));
            QueryExecutionResult created = datasource.run(connection, write);
            assertEquals(QUERY_CODE_OK, created.getQueryCode());
            assertEquals(7, ((JsonNode) created.getData()).path("id").asInt(), "the POST answer is returned as JSON");
            assertEquals("widget", ((JsonNode) created.getData()).path("created").path("name").asString(), "the server received the body that was written");

            QueryExecutionResult read = datasource.run(connection, Map.of("httpMethod", "GET", "path", REST_ITEMS_PATH));
            assertEquals(QUERY_CODE_OK, read.getQueryCode());
            assertEquals("widget", ((JsonNode) read.getData()).path("items").path(0).path("name").asString(), "the GET answer is returned as JSON");
        } finally {
            datasource.destroy(connection);
        }
        List<RecordingHttpServer.Request> requests = restServer.requests().subList(before, restServer.requests().size());
        assertEquals(List.of("POST", "GET"), requests.stream().map(RecordingHttpServer.Request::method).toList(), "the server saw the write, then the read");
        assertEquals("{\"name\":\"widget\"}", requests.get(0).bodyText(), "the POST body on the wire");
    }

    @Test
    public void graphqlPluginRunsFromItsShadedJar() throws Exception {
        Datasource datasource = new Datasource(GRAPHQL, Map.of("url", graphqlServer.baseUrl()));
        assertTrue(datasource.validate().isEmpty(), "the GraphQL config is valid");
        assertTrue(datasource.test().isSuccess(), "the GraphQL test-connection passes (it makes no request)");
        int before = graphqlServer.requests().size();

        Object connection = datasource.connect();
        try {
            QueryExecutionResult mutation = datasource.run(connection, Map.of("path", GRAPHQL_PATH, "body", "mutation { addHero(name: \"x\") { id } }", "variables", List.of()));
            assertEquals(QUERY_CODE_OK, mutation.getQueryCode());
            assertEquals("42", ((JsonNode) mutation.getData()).path("data").path("addHero").path("id").asString(), "the mutation answer is returned");

            QueryExecutionResult query = datasource.run(connection, Map.of("path", GRAPHQL_PATH, "body", "query { hero { name } }", "variables", List.of()));
            assertEquals(QUERY_CODE_OK, query.getQueryCode());
            assertEquals("R2-D2", ((JsonNode) query.getData()).path("data").path("hero").path("name").asString(), "the query answer is returned");
        } finally {
            datasource.destroy(connection);
        }
        List<RecordingHttpServer.Request> requests = graphqlServer.requests().subList(before, graphqlServer.requests().size());
        assertEquals(2, requests.size());
        assertTrue(JSON.readTree(requests.get(0).bodyText()).path("query").asString().startsWith("mutation"), "the first request carried the mutation: " + requests.get(0).bodyText());
        assertTrue(JSON.readTree(requests.get(1).bodyText()).path("query").asString().startsWith("query"), "the second request carried the query: " + requests.get(1).bodyText());
    }
}

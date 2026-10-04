package org.lowcoder.domain.plugin.client;

import org.apache.commons.codec.binary.Hex;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.encryption.EncryptionServiceImpl;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfigHelper;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.FieldTree;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Group {@code node-service} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T9.2) and the node-service row of the §4.6
 * producer table: a real {@link DatasourcePluginClient} talks to a local server ({@link RecordingHttpServer}) standing
 * in for the node service, once per answer variant of {@link #VARIANTS}:
 * <ul>
 *   <li>encode: what the server received, per call (content type, encryption header, body as sent; for an encrypted
 *       {@code runPluginQuery} body, the text decrypted with the node-service key), compared by the §1.2 contract;</li>
 *   <li>decode: what each call returns, with the Java class of every value ({@link JavaValueWalker}): the
 *       dynamic-config {@code List<Object>}, the plugin definitions, the {@code QueryExecutionResult} as a §4.6 producer
 *       report ({@link QueryResults#report}), and the {@code DatasourceTestResult} ({@link FieldTree}).</li>
 * </ul>
 * {@code runPluginQuery} is sent plain and encrypted; its encrypted body is written by the client's bare
 * {@code new ObjectMapper()} (E11, O10), the plain one by the client codecs, and a {@code queryDsl} holding an
 * {@link Instant} pins how each treats a {@code java.time} value. Pinned in {@value #REPORT}.
 *
 * <p>Limits: the node service is a recording stand-in answering fixed bodies; the {@code Accept-Language} header is
 * empty, as no request is in the reactor context; the body of {@code runPluginQuery} is a {@code Map.of}, whose member
 * order varies between runs and which the §1.2 contract ignores.
 */
class DatasourcePluginClientContractTest {

    static final String REPORT = "node-service/DatasourcePluginClient.calls.json";
    static final String API = "/node-service/api/";
    static final String DYNAMIC_CONFIG = API + "getPluginDynamicConfig";
    static final String PLUGINS = API + "plugins";
    static final String RUN = API + "runPluginQuery";
    static final String VALIDATE = API + "validatePluginDataSourceConfig";
    static final String JSON = "application/json";
    static final String ENCRYPTED_HEADER = "X-Encrypted";
    static final String NODE_PASSWORD = "nodePassword";
    static final String NODE_SALT = "nodeSalt";
    static final String PLUGIN = "contractPlugin";
    static final String REQUEST_KEY = "request";
    static final String DECRYPTED_KEY = "decrypted";
    static final String RESULT_KEY = "result";
    static final String SHAPE_KEY = "shape";
    static final int OK = 200;
    static final int BAD_REQUEST = 400;
    static final int SERVER_ERROR = 500;
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Map<String, Response>> VARIANTS = variants();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static final Map<String, RecordingHttpServer> SERVERS = new LinkedHashMap<>();

    @BeforeAll
    static void startServers() {
        VARIANTS.forEach((name, responses) -> SERVERS.put(name, RecordingHttpServer.start(responses)));
    }

    @AfterAll
    static void stopServers() {
        SERVERS.values().forEach(RecordingHttpServer::close);
    }

    @BoundarySites({
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#<file>#import#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.OBJECT_MAPPER#new ObjectMapper#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.getPluginDynamicConfig#bodyValue#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.getPluginDynamicConfig#bodyToMono#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.getDatasourcePluginDefinitions#bodyToMono#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.executeQuery#writeValueAsString#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.executeQuery#bodyValue#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.executeQuery#bodyToMono#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.executeQuery#bodyToMono#2",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.test#bodyValue#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.test#bodyToMono#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/plugin/client/DatasourcePluginClient.java#DatasourcePluginClient.test#bodyToMono#2"})
    @Test
    void callsAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        SERVERS.forEach((name, server) -> {
            Map<String, Object> calls = new LinkedHashMap<>();
            DatasourcePluginClient plain = client(server, false);
            DatasourcePluginClient encrypted = client(server, true);
            calls.put("getPluginDynamicConfig", call(server, () -> plain.getPluginDynamicConfig(dynamicConfigRequests()).block(TIMEOUT),
                    JavaValueWalker::shape));
            calls.put("getDatasourcePluginDefinitions", call(server, () -> plain.getDatasourcePluginDefinitions().collectList().block(TIMEOUT),
                    JavaValueWalker::shape));
            calls.put("executeQuery", call(server, () -> plain.executeQuery(PLUGIN, queryDsl(), context(), datasourceConfig()).block(TIMEOUT),
                    QueryResults::report));
            calls.put("executeQueryEncrypted", call(server,
                    () -> encrypted.executeQuery(PLUGIN, queryDsl(), context(), datasourceConfig()).block(TIMEOUT), QueryResults::report));
            calls.put("executeQueryWithInstant", call(server,
                    () -> plain.executeQuery(PLUGIN, Map.of("at", Instant.EPOCH), List.of(), Map.of()).block(TIMEOUT), QueryResults::report));
            calls.put("executeQueryEncryptedWithInstant", call(server,
                    () -> encrypted.executeQuery(PLUGIN, Map.of("at", Instant.EPOCH), List.of(), Map.of()).block(TIMEOUT), QueryResults::report));
            calls.put("test", call(server, () -> plain.test(PLUGIN, datasourceConfig()).block(TIMEOUT), FieldTree::of));
            report.put(name, calls);
        });
        String actual = ConfigBinding.write(report);
        System.out.println("[DatasourcePluginClientContractTest] " + SERVERS.size() + " node-service variants\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The request the server received for one call (none for a call that sent nothing) and what the call returned. */
    private static <T> Map<String, Object> call(RecordingHttpServer server, java.util.function.Supplier<T> call, Function<T, Object> report) {
        int before = server.requests().size();
        Map<String, Object> outcome = new LinkedHashMap<>();
        Object result;
        try {
            T value = call.get();
            result = value == null ? null : report.apply(value);
        } catch (RuntimeException e) {
            result = Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        List<Request> requests = server.requests();
        outcome.put(REQUEST_KEY, requests.size() == before ? null : request(requests.get(before)));
        outcome.put(RESULT_KEY, result);
        return outcome;
    }

    /** Method, path, encryption header and body of a request; an encrypted body also decrypted. */
    private static Map<String, Object> request(Request request) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("method", request.method());
        report.put("path", request.pathAndQuery());
        report.put(ENCRYPTED_HEADER, request.header(ENCRYPTED_HEADER));
        if (request.body().length > 0) {
            boolean encrypted = !request.header(ENCRYPTED_HEADER).isEmpty();
            report.putAll(encrypted ? Map.of(RecordingHttpServer.CONTENT_TYPE_KEY, request.header(RecordingHttpServer.CONTENT_TYPE))
                    : request.jsonBodyReport());
            if (encrypted) {
                report.put(DECRYPTED_KEY, new com.fasterxml.jackson.databind.util.RawValue(
                        Encryptors.text(NODE_PASSWORD, Hex.encodeHexString(NODE_SALT.getBytes(StandardCharsets.UTF_8))).decrypt(request.bodyText())));
            }
        }
        return report;
    }

    /** A client of {@code server}; {@code encrypted}: with the node-service key, so query bodies are encrypted. */
    private static DatasourcePluginClient client(RecordingHttpServer server, boolean encrypted) {
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.getJsExecutor().setHost(server.baseUrl());
        commonConfig.getJsExecutor().setPassword(encrypted ? NODE_PASSWORD : "");
        commonConfig.getJsExecutor().setSalt(encrypted ? NODE_SALT : "");
        CommonConfigHelper commonConfigHelper = new CommonConfigHelper(commonConfig, new ConfigCenterForTest());
        NodeServerHelper nodeServerHelper = new NodeServerHelper();
        ReflectionTestUtils.setField(nodeServerHelper, "commonConfigHelper", commonConfigHelper);
        return new DatasourcePluginClient(commonConfigHelper, commonConfig, nodeServerHelper, new EncryptionServiceImpl(commonConfig));
    }

    private static List<GetPluginDynamicConfigRequestDTO> dynamicConfigRequests() {
        return List.of(GetPluginDynamicConfigRequestDTO.builder().dataSourceId("ds1").pluginName(PLUGIN).path("tables")
                .dataSourceConfig(datasourceConfig()).build());
    }

    /** The query DSL: the §4.6 representative input. */
    private static Object queryDsl() {
        return RepresentativeInput.map();
    }

    private static List<Map<String, Object>> context() {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("key", "limit");
        entry.put("value", 3_000_000_001L);
        return List.of(entry);
    }

    private static Map<String, Object> datasourceConfig() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("host", "žluť \"db\"");
        config.put("port", 5432);
        config.put("ratio", new BigDecimal("1.50"));
        config.put("tags", Arrays.asList("a", null));
        return config;
    }

    /** The answers of the stand-in, by variant: a working service, one that fails, and one answering text values. */
    private static Map<String, Map<String, Response>> variants() {
        Map<String, Map<String, Response>> variants = new LinkedHashMap<>();
        Map<String, Response> ok = new LinkedHashMap<>();
        ok.put(DYNAMIC_CONFIG, json(OK, "[" + RepresentativeInput.TEXT + ", {\"n\": 1.50, \"big\": 9223372036854775808}]"));
        ok.put(PLUGINS, json(OK, "[{\"id\": \"p1\", \"name\": \"žluť\", \"dataSourceConfig\": {\"extra\": {\"type\": \"dynamic\"}}, "
                + "\"limit\": 3000000001, \"ratio\": 1.50}]"));
        ok.put(RUN, json(OK, "{\"result\": " + RepresentativeInput.TEXT + ", \"ignored\": 1}"));
        ok.put(VALIDATE, json(OK, "{\"success\": true}"));
        variants.put("ok", ok);
        Map<String, Response> failing = new LinkedHashMap<>();
        failing.put(DYNAMIC_CONFIG, json(SERVER_ERROR, "{\"message\": \"down\"}"));
        failing.put(PLUGINS, json(SERVER_ERROR, "{\"message\": \"down\"}"));
        failing.put(RUN, json(SERVER_ERROR, "{\"message\": \"bad \\\"q\\\" žluť\", \"code\": 1.50}"));
        failing.put(VALIDATE, json(BAD_REQUEST, "{\"message\": 1.50}"));
        variants.put("failing", failing);
        Map<String, Response> texts = new LinkedHashMap<>();
        texts.put(DYNAMIC_CONFIG, json(OK, "{\"not\": \"a list\"}"));
        texts.put(PLUGINS, json(OK, "[]"));
        texts.put(RUN, json(OK, "{\"result\": \"text\"}"));
        texts.put(VALIDATE, json(OK, "{\"success\": \"true\", \"message\": 2.50}"));
        variants.put("textValues", texts);
        return variants;
    }

    private static Response json(int status, String body) {
        return new Response(status, Map.of(RecordingHttpServer.CONTENT_TYPE, List.of(JSON)), body.getBytes(StandardCharsets.UTF_8));
    }
}

package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.annotation.JsonView;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.framework.exception.ApiPerfHelper;
import org.lowcoder.api.framework.exception.GlobalExceptionHandler;
import org.lowcoder.api.framework.filter.GlobalContextFilter;
import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.FolderController;
import org.lowcoder.api.query.ApplicationQueryApiService;
import org.lowcoder.api.query.LibraryQueryApiService;
import org.lowcoder.api.query.QueryController;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.serverlog.ServerLog;
import org.lowcoder.infra.serverlog.ServerLogService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.UnsatisfiedDependencyException;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

import java.lang.reflect.Constructor;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.sdk.constants.GlobalContext.CLIENT_IP;
import static org.lowcoder.sdk.constants.GlobalContext.CLIENT_LOCALE;
import static org.lowcoder.sdk.constants.GlobalContext.DOMAIN;
import static org.lowcoder.sdk.constants.GlobalContext.REQUEST_ID_LOG;
import static org.lowcoder.sdk.constants.GlobalContext.REQUEST_METHOD;
import static org.lowcoder.sdk.constants.GlobalContext.REQUEST_PATH;
import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_ID;
import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_TOKEN;

/**
 * Self-test of {@link ContractTestClient}, the §5.1 harness (docs/API_PAYLOAD_TEST_PLAN.md): it reproduces E6, E7,
 * E9 and E10 as tests, and shows each harness part working through a request.
 */
class ContractTestClientTest {

    private static final String HARNESS_URL = "/api/contract-harness";
    private static final String PAYLOAD_PATH = HARNESS_URL + "/payload";
    private static final String ECHO_PATH = HARNESS_URL + "/echo";
    private static final String CONTEXT_PATH = HARNESS_URL + "/context";
    private static final String BIZ_ERROR_PATH = HARNESS_URL + "/biz-error";
    private static final String UNKNOWN_PATH = "/api/no-such-endpoint";
    private static final String FAILING_FILTER_PATH = "/api/failing-filter";
    private static final String REJECTING_FILTER_PATH = "/api/rejecting-filter";
    private static final String PLUGINS_PATH = "/api/plugins/";
    private static final String FOLDER_PATH = "/api/folders/";
    private static final String QUERY_EXECUTE_PATH = "/api/query/execute";
    private static final String COOKIE_HELPER_BEAN_NAME = "cookieHelper";

    private static final long TIMESTAMP_SECONDS = 1_767_225_600L;
    private static final String VISITOR = "user01";
    private static final String ORG = "org01";
    private static final String MDC_HEADER = "X-MDC-trace";
    private static final String MDC_KEY = "trace";
    private static final String REQUEST_ID_HEADER = "X-REQUEST-ID";
    private static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";
    private static final String PLUGIN_INFO_CLASS = "org.lowcoder.api.framework.plugin.LowcoderPluginManager$PluginInfo";
    /** E9: what the production error handler writes for an unexpected exception. */
    private static final String SERVICE_BUSY_BODY = "{\"code\":5000,\"message\":\"Oops! Service is busy, please try again later.\",\"success\":false}";

    // ---- a test controller whose payloads show which mapper and which view the harness applies ----

    public static class Payload {
        @JsonView(JsonViews.Public.class)
        public Instant at;
        @JsonView(JsonViews.Public.class)
        public BigDecimal amount;
        @JsonView(JsonViews.Internal.class)
        public String internal;
    }

    @RestController
    @RequestMapping(HARNESS_URL)
    public static class HarnessController {

        @JsonView(JsonViews.Public.class)
        @GetMapping("/payload")
        public Mono<ResponseView<Payload>> payload() {
            Payload payload = new Payload();
            payload.at = Instant.ofEpochSecond(TIMESTAMP_SECONDS);
            payload.amount = new BigDecimal("1.10");
            payload.internal = "not in the public view";
            return Mono.just(ResponseView.success(payload));
        }

        @PostMapping("/echo")
        public Mono<ResponseView<Payload>> echo(@RequestBody Payload payload) {
            return Mono.just(ResponseView.success(payload));
        }

        @GetMapping("/context")
        public Mono<Map<String, Object>> context() {
            return Mono.deferContextual(ctx -> {
                Map<String, Object> values = new TreeMap<>();
                for (String key : List.of(VISITOR_ID, REQUEST_PATH, REQUEST_METHOD, CLIENT_IP, REQUEST_ID_LOG, DOMAIN, VISITOR_TOKEN, MDC_KEY)) {
                    values.put(key, ctx.<Object>getOrEmpty(key).map(String::valueOf).orElse("<absent>"));
                }
                values.put(CLIENT_LOCALE, String.valueOf(ctx.<Object>get(CLIENT_LOCALE)));
                Map<String, Object> contextMap = ctx.get(GlobalContextFilter.CONTEXT_MAP);
                values.put(GlobalContextFilter.CONTEXT_MAP, new TreeSet<>(contextMap.keySet()));
                return Mono.just(values);
            });
        }

        @GetMapping("/biz-error")
        public Mono<ResponseView<Payload>> bizError() {
            return Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"));
        }
    }

    private static String body(EntityExchangeResult<byte[]> result) {
        byte[] body = result.getResponseBody();
        String text = body == null ? "<no body>" : new String(body, StandardCharsets.UTF_8);
        System.out.println("[ContractTestClientTest] " + result.getMethod() + " " + result.getUrl() + " -> "
                + result.getStatus().value() + " " + result.getResponseHeaders().getContentType() + " " + text);
        return text;
    }

    private static String get(WebTestClient web, String path, HttpStatus status) {
        return body(web.get().uri(path).exchange().expectStatus().isEqualTo(status)
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)
                .expectBody().returnResult());
    }

    @Test
    void e6MockRegisteredAsBeanDefinitionFails() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(ApiPerfHelper.class, () -> Mockito.mock(ApiPerfHelper.class));
            context.register(GlobalExceptionHandler.class);
            assertThatThrownBy(context::refresh)
                    .isInstanceOf(UnsatisfiedDependencyException.class)
                    .hasMessageContaining("No qualifying bean of type 'org.lowcoder.infra.perf.PerfHelper'");
        }
        try (ContractTestClient client = ContractTestClient.builder().build()) {
            assertThat(client.bean(ApiPerfHelper.class)).as("registered as a ready singleton instead")
                    .matches(helper -> Mockito.mockingDetails(helper).isMock());
        }
    }

    @Test
    void e7ResponsesAreWrittenByTheProductionMapperWithTheJsonView() {
        try (ContractTestClient client = ContractTestClient.builder().controller(HarnessController.class).build()) {
            CanonicalJson.assertEquivalent(
                    "{\"code\":1,\"message\":\"\",\"data\":{\"at\":1767225600.000000000,\"amount\":1.10},\"success\":true}",
                    get(client.web(), PAYLOAD_PATH, HttpStatus.OK));
        }
    }

    @Test
    void e7RequestsAreReadByTheProductionMapper() {
        try (ContractTestClient client = ContractTestClient.builder().controller(HarnessController.class).build()) {
            String response = body(client.web().post().uri(ECHO_PATH).contentType(MediaType.APPLICATION_JSON)
                    .bodyValue("{\"at\":1767225600.5,\"amount\":2.50,\"internal\":\"x\",\"unknownProperty\":true}")
                    .exchange().expectStatus().isOk().expectBody().returnResult());
            CanonicalJson.assertEquivalent(
                    "{\"code\":1,\"message\":\"\",\"data\":{\"at\":1767225600.500000000,\"amount\":2.50,\"internal\":\"x\"},\"success\":true}",
                    response);
        }
    }

    @Test
    void bizExceptionIsWrittenByGlobalExceptionHandler() {
        try (ContractTestClient client = ContractTestClient.builder().controller(HarnessController.class).build()) {
            CanonicalJson.assertEquivalent(
                    "{\"code\":5001,\"message\":\"Sorry, it appears you don't have the permission.\",\"success\":false}",
                    get(client.web(), BIZ_ERROR_PATH, HttpStatus.UNAUTHORIZED));
        }
    }

    @Test
    void productionGlobalContextFilterWritesTheContextKeys() {
        OrgMember member = OrgMember.builder().orgId(ORG).userId(VISITOR).role(MemberRole.ADMIN).build();
        try (ContractTestClient client = ContractTestClient.builder().visitor(VISITOR, member)
                .controller(HarnessController.class).build()) {
            String response = body(client.web().get().uri(CONTEXT_PATH + "?lang=de_DE")
                    .header(MDC_HEADER, "t1").header(REQUEST_ID_HEADER, "r1").header(FORWARDED_FOR_HEADER, "10.0.0.1")
                    .header("Referer", "https://Apps.Example.com/editor")
                    .exchange().expectStatus().isOk().expectBody().returnResult());
            CanonicalJson.assertEquivalent("{\"context-map\":[\"currentOrgMember\",\"domain\",\"headers\",\"httpMethod\","
                    + "\"ip\",\"locale\",\"path\",\"request\",\"requestId\",\"trace\",\"visitorId\",\"visitorToken\"],"
                    + "\"domain\":\"apps.example.com\",\"httpMethod\":\"GET\",\"ip\":\"10.0.0.1\",\"locale\":\"de_DE\","
                    + "\"path\":\"/api/contract-harness/context\",\"requestId\":\"r1\",\"trace\":\"t1\",\"visitorId\":\"user01\","
                    + "\"visitorToken\":\"\"}", response);
            ArgumentCaptor<ServerLog> serverLog = ArgumentCaptor.forClass(ServerLog.class);
            Mockito.verify(client.bean(ServerLogService.class)).record(serverLog.capture());
            assertThat(serverLog.getValue().getOrgId()).isEqualTo(ORG);
            assertThat(serverLog.getValue().getUserId()).isEqualTo(VISITOR);
        }
    }

    @Test
    void anonymousVisitorIsTheDefaultAndGetsARequestId() {
        try (ContractTestClient client = ContractTestClient.builder().controller(HarnessController.class).build()) {
            String response = get(client.web(), CONTEXT_PATH, HttpStatus.OK);
            assertThat(response).contains("\"visitorId\":\"" + Authentication.ANONYMOUS_USER_ID + "\"")
                    .as("CustomWebFluxConfiguration#localeContextResolver default").contains("\"locale\":\"en_US\"")
                    .doesNotContain("\"requestId\":\"<absent>\"").doesNotContain("\"requestId\":\"\"");
            Mockito.verifyNoInteractions(client.bean(ServerLogService.class));
        }
    }

    @Test
    void e9ErrorHandlerWritesJsonForUnknownPathsAndFilterFailures() {
        WebFilter failing = (exchange, chain) -> switch (exchange.getRequest().getPath().value()) {
            case FAILING_FILTER_PATH -> Mono.error(new IllegalStateException("filter failure"));
            case REJECTING_FILTER_PATH -> Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
            default -> chain.filter(exchange);
        };
        try (ContractTestClient client = ContractTestClient.builder().webFilter(failing).build()) {
            CanonicalJson.assertEquivalent(SERVICE_BUSY_BODY, get(client.web(), UNKNOWN_PATH, HttpStatus.INTERNAL_SERVER_ERROR));
            CanonicalJson.assertEquivalent(SERVICE_BUSY_BODY, get(client.web(), FAILING_FILTER_PATH, HttpStatus.INTERNAL_SERVER_ERROR));
            CanonicalJson.assertEquivalent("{\"code\":403,\"message\":\"Forbidden\",\"success\":false}",
                    get(client.web(), REJECTING_FILTER_PATH, HttpStatus.FORBIDDEN));
        }
    }

    @Test
    void e10PluginRouteListsLoadedPlugins() throws ReflectiveOperationException {
        Constructor<?> pluginInfo = Class.forName(PLUGIN_INFO_CLASS).getDeclaredConstructors()[0];
        pluginInfo.setAccessible(true);
        Object info = pluginInfo.newInstance("p1", "plugin one", Map.of("version", 1));
        try (ContractTestClient client = ContractTestClient.builder().build()) {
            CanonicalJson.assertEquivalent("[]", get(client.web(), PLUGINS_PATH, HttpStatus.OK));
            Mockito.doReturn(new ArrayList<>(List.of(info))).when(client.bean(LowcoderPluginManager.class)).getLoadedPluginsInfo();
            CanonicalJson.assertEquivalent("[{\"id\":\"p1\",\"description\":\"plugin one\",\"info\":{\"version\":1}}]",
                    get(client.web(), PLUGINS_PATH, HttpStatus.OK));
        }
    }

    @Test
    void constructorInjectedControllerGetsTheMocks() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        GidService gidService = builder.mock(GidService.class);
        FolderApiService folderApiService = builder.mock(FolderApiService.class);
        BusinessEventPublisher events = builder.mock(BusinessEventPublisher.class);
        builder.mock(FolderService.class);
        builder.mock(FolderElementRelationService.class);
        builder.mock(ApplicationApiService.class);
        Folder folder = new Folder();
        folder.setName("f");
        folder.setId("f1");
        Mockito.when(gidService.convertFolderIdToObjectId("f1")).thenReturn(Mono.just(Optional.of("f1")));
        Mockito.when(folderApiService.delete("f1")).thenReturn(Mono.just(folder));
        Mockito.when(events.publishFolderCommonEvent(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.empty());
        try (ContractTestClient client = builder.controller(FolderController.class).build()) {
            CanonicalJson.assertEquivalent("{\"code\":1,\"message\":\"\",\"success\":true}",
                    body(client.web().delete().uri(FOLDER_PATH + "f1").exchange().expectStatus().isOk().expectBody().returnResult()));
            Mockito.verify(folderApiService).delete("f1");
        }
    }

    @Test
    void fieldInjectedControllerGetsTheMocks() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        ApplicationQueryApiService queries = builder.mock(ApplicationQueryApiService.class);
        builder.mock(LibraryQueryApiService.class);
        builder.mock(BusinessEventPublisher.class);
        Mockito.when(queries.executeApplicationQuery(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(QueryExecutionResult.success(Map.of("rows", 2))));
        try (ContractTestClient client = builder.controller(QueryController.class).build()) {
            String response = body(client.web().post().uri(QUERY_EXECUTE_PATH).contentType(MediaType.APPLICATION_JSON)
                    .bodyValue("{\"applicationId\":\"app1\",\"queryId\":\"q1\"}")
                    .exchange().expectStatus().isOk().expectBody().returnResult());
            assertThat(response).contains("\"data\":{\"rows\":2}");
            ArgumentCaptor<QueryExecutionRequest> request = ArgumentCaptor.forClass(QueryExecutionRequest.class);
            Mockito.verify(queries).executeApplicationQuery(Mockito.any(), request.capture());
            assertThat(request.getValue().getApplicationId()).isEqualTo("app1");
            assertThat(request.getValue().getQueryId()).isEqualTo("q1");
        }
    }

    @Test
    void controllerWithMockedDependenciesMocksTheConstructorParametersAndKeepsStubbedMocks() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        GidService gidService = builder.mock(GidService.class);
        FolderApiService folderApiService = builder.mock(FolderApiService.class);
        BusinessEventPublisher events = builder.mock(BusinessEventPublisher.class);
        Folder folder = new Folder();
        folder.setName("f");
        folder.setId("f1");
        Mockito.when(gidService.convertFolderIdToObjectId("f1")).thenReturn(Mono.just(Optional.of("f1")));
        Mockito.when(folderApiService.delete("f1")).thenReturn(Mono.just(folder));
        Mockito.when(events.publishFolderCommonEvent(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any())).thenReturn(Mono.empty());
        try (ContractTestClient client = builder.controllerWithMockedDependencies(FolderController.class).build()) {
            CanonicalJson.assertEquivalent("{\"code\":1,\"message\":\"\",\"success\":true}",
                    body(client.web().delete().uri(FOLDER_PATH + "f1").exchange().expectStatus().isOk().expectBody().returnResult()));
            assertThat(client.bean(FolderApiService.class)).as("the mock the test stubbed first is kept").isSameAs(folderApiService);
            for (Class<?> unstubbed : List.of(FolderService.class, FolderElementRelationService.class, ApplicationApiService.class)) {
                assertThat(Mockito.mockingDetails(client.bean(unstubbed)).isMock()).as(unstubbed.getSimpleName() + " mocked").isTrue();
            }
            Mockito.verify(folderApiService).delete("f1");
        }
    }

    @Test
    void controllerWithMockedDependenciesMocksTheAutowiredFieldsAndKeepsTheRealCookieHelper() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        ApplicationQueryApiService queries = builder.mock(ApplicationQueryApiService.class);
        Mockito.when(queries.executeApplicationQuery(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(QueryExecutionResult.success(Map.of("rows", 2))));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(QueryController.class).build()) {
            String response = body(client.web().post().uri(QUERY_EXECUTE_PATH).contentType(MediaType.APPLICATION_JSON)
                    .bodyValue("{\"applicationId\":\"app1\",\"queryId\":\"q1\"}")
                    .exchange().expectStatus().isOk().expectBody().returnResult());
            assertThat(response).contains("\"data\":{\"rows\":2}");
            for (Class<?> field : List.of(LibraryQueryApiService.class, BusinessEventPublisher.class)) {
                assertThat(Mockito.mockingDetails(client.bean(field)).isMock()).as(field.getSimpleName() + " mocked").isTrue();
            }
            assertThat(Mockito.mockingDetails(client.bean(CookieHelper.class)).isMock()).as("the harness's real CookieHelper is kept").isFalse();
        }
    }

    @Test
    void theHarnessCookieHelperIsReplaceable() {
        CookieHelper own = new CookieHelper(new CommonConfig());
        try (ContractTestClient client = ContractTestClient.builder().singleton(COOKIE_HELPER_BEAN_NAME, own).build()) {
            assertThat(client.bean(CookieHelper.class)).as("replaced through singleton").isSameAs(own);
        }
        ContractTestClient.Builder builder = ContractTestClient.builder();
        CookieHelper mock = builder.mock(CookieHelper.class);
        assertThat(Mockito.mockingDetails(mock).isMock()).as("replaced through mock").isTrue();
        assertThatThrownBy(() -> builder.singleton(COOKIE_HELPER_BEAN_NAME, own)).as("only the harness default is replaceable")
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining(COOKIE_HELPER_BEAN_NAME);
        try (ContractTestClient client = builder.build()) {
            assertThat(client.bean(CookieHelper.class)).isSameAs(mock);
        }
    }

    @Test
    void queryBodySizeFilterRejectsOversizedQueryRequests() {
        ContractTestClient.Builder builder = ContractTestClient.builder().queryBodySizeFilter("64B", "20MB");
        builder.mock(ApplicationQueryApiService.class);
        builder.mock(LibraryQueryApiService.class);
        builder.mock(BusinessEventPublisher.class);
        try (ContractTestClient client = builder.controller(QueryController.class).build()) {
            String oversized = "{\"applicationId\":\"app1\",\"queryId\":\"" + "q".repeat(100) + "\"}";
            String response = body(client.web().post().uri(QUERY_EXECUTE_PATH).contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(oversized).exchange().expectStatus().isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
                    .expectBody().returnResult());
            assertThat(response).contains("\"code\":" + BizError.EXCEED_QUERY_REQUEST_SIZE.getBizErrorCode()).contains("\"success\":false");
            Mockito.verifyNoInteractions(client.bean(ApplicationQueryApiService.class));
        }
    }
}

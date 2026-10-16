package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.LibraryQueryApiServiceImpl;
import org.lowcoder.api.query.QueryController;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.domain.query.service.QueryExecutionServiceImpl;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * NEW-29 at the HTTP layer: {@code POST /api/query/execute-from-node} and {@code /api/v1/query/execute-from-node} answer a
 * library query whose stored timeout is invalid or above the maximum with HTTP 200 and an error {@code QueryResultView}
 * (they answered HTTP 500 before), through the production {@link QueryController}, {@code GlobalContextFilter} and
 * exception handling of the {@link ContractTestClient} harness, over a real {@link LibraryQueryApiServiceImpl} and a real
 * {@link QueryExecutionServiceImpl} (real for its timeout parsing and its chain) with mocked services and execution
 * internals. The local client is given by {@code X-Forwarded-For}, as in {@link QueryEndpointsContractTest}.
 *
 * <p>Limits: the harness has no production security chain (the route needs an authenticated request in production)
 * and no query-body-size filter (production registers it only in cloud mode); the valid-timeout control runs over a
 * mocked executor and an unstubbed connection, so it shows the controller and result plumbing, not a real query.
 */
class QueryFromNodeTimeoutAnswersTest {

    private static final String FROM_NODE = "/execute-from-node";
    private static final String ORG = "QueryFromNodeTimeoutAnswersTest.org";
    private static final String USER_ID = "QueryFromNodeTimeoutAnswersTest.user";
    private static final String MEMBER_STATE = "normal";
    private static final long JOINED_AT = 0L;
    private static final String DATASOURCE_ID = "QueryFromNodeTimeoutAnswersTest.datasource";
    private static final String DATASOURCE_TYPE = "mysql";
    private static final String LIBRARY_QUERY_ID = "QueryFromNodeTimeoutAnswersTest.libraryQuery";
    private static final String LIBRARY_QUERY_NAME = "QueryFromNodeTimeoutAnswersTest.libraryQueryName";
    private static final Map<String, Object> QUERY_COMP = Map.of("sql", "x");
    private static final int PORT = 18081;
    /** The shipped maximum query timeout ({@code application.yaml} {@code common.max-query-timeout}), in seconds. */
    private static final int MAX_QUERY_TIMEOUT_SECONDS = 120;
    private static final String INVALID_TIMEOUT = "abc";
    private static final String ABOVE_THE_MAXIMUM = (MAX_QUERY_TIMEOUT_SECONDS + 1) + "s";
    private static final String VALID_TIMEOUT = "9s";
    /** {@code locale_en.properties} {@code INVALID_TIMEOUT_SETTING} and {@code EXCEED_MAX_QUERY_TIMEOUT}, filled in. */
    private static final String INVALID_TIMEOUT_MESSAGE = "Invalid timeout setting: abc.";
    private static final String ABOVE_THE_MAXIMUM_MESSAGE = "Sorry, query's maximum timeout cannot exceed 120s.";
    /** {@code QueryResultView#getCode}: the server handled the request. */
    private static final int VIEW_CODE = 1;
    private static final String OK_QUERY_CODE = "OK";
    private static final String DATA = "QueryFromNodeTimeoutAnswersTest.rows";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ContractTestClient.Builder builder;
    private final DatasourceConnectionPool pool = Mockito.mock(DatasourceConnectionPool.class);
    private final DatasourceMetaInfoService metaInfo = Mockito.mock(DatasourceMetaInfoService.class);
    private final DatasourcePluginClient pluginClient = Mockito.mock(DatasourcePluginClient.class);
    @SuppressWarnings("rawtypes")
    private final QueryExecutor executor = Mockito.mock(QueryExecutor.class);
    private final LibraryQueryService libraryQueryService = Mockito.mock(LibraryQueryService.class);

    @BeforeEach
    void realService() {
        builder = ContractTestClient.builder();
        OrgMember member = new OrgMember(ORG, USER_ID, MemberRole.MEMBER, MEMBER_STATE, JOINED_AT);
        builder.visitor(USER_ID, member);
        SessionUserService sessions = builder.mock(SessionUserService.class);
        User user = new User();
        user.setId(USER_ID);
        when(sessions.getVisitorOrgMemberCache()).thenReturn(Mono.just(member));
        when(sessions.getVisitor()).thenReturn(Mono.just(user));

        Datasource datasource = new Datasource();
        datasource.setId(DATASOURCE_ID);
        datasource.setOrganizationId(ORG);
        datasource.setType(DATASOURCE_TYPE);
        DatasourceService datasourceService = Mockito.mock(DatasourceService.class);
        when(datasourceService.getById(DATASOURCE_ID)).thenReturn(Mono.just(datasource));
        CommonConfig serviceConfig = Mockito.mock(CommonConfig.class);
        when(serviceConfig.getDisallowedHosts()).thenReturn(Set.of());

        CommonConfig limits = new CommonConfig();
        limits.setMaxQueryTimeout(MAX_QUERY_TIMEOUT_SECONDS);
        QueryExecutionServiceImpl execution = new QueryExecutionServiceImpl(pool, metaInfo, pluginClient, limits);
        LibraryQueryApiServiceImpl service = new LibraryQueryApiServiceImpl(libraryQueryService, Mockito.mock(LibraryQueryRecordService.class),
                Mockito.mock(UserService.class), Mockito.mock(OrgDevChecker.class), sessions, execution, datasourceService,
                Mockito.mock(BusinessEventPublisher.class), Mockito.mock(ResourcePermissionService.class), serviceConfig,
                Mockito.mock(AuthenticationService.class));
        ReflectionTestUtils.setField(service, "port", PORT);
        builder.singleton("libraryQueryApiService", service);
    }

    /** The library query of {@link #LIBRARY_QUERY_NAME} in the org, its editing version storing {@code timeout}. */
    private void storedQuery(String timeout) {
        Map<String, Object> query = new HashMap<>(Map.of("datasourceId", DATASOURCE_ID, "comp", QUERY_COMP, "compType", DATASOURCE_TYPE,
                "timeout", timeout));
        LibraryQuery stored = LibraryQuery.builder().organizationId(ORG).name(LIBRARY_QUERY_NAME).libraryQueryDSL(Map.of("query", query)).build();
        stored.setId(LIBRARY_QUERY_ID);
        when(libraryQueryService.getByOrganizationIdAndName(ORG, LIBRARY_QUERY_NAME)).thenReturn(Mono.just(stored));
        when(libraryQueryService.getById(LIBRARY_QUERY_ID)).thenReturn(Mono.just(stored));
    }

    /** node-service's body: the name only, no record id ({@code runJavascript.ts}). */
    private static String nodeBody() {
        return MAPPER.createObjectNode().put("libraryQueryName", LIBRARY_QUERY_NAME).toString();
    }

    private static EntityExchangeResult<byte[]> post(ContractTestClient client, String mount) {
        EntityExchangeResult<byte[]> result = client.web().post().uri(mount + FROM_NODE)
                .header(QueryEndpointsContractTest.FORWARDED_FOR, QueryEndpointsContractTest.LOCAL_CLIENT)
                .contentType(MediaType.APPLICATION_JSON).bodyValue(nodeBody())
                .exchange().expectBody().returnResult();
        byte[] body = result.getResponseBodyContent();
        System.out.println("[QueryFromNodeTimeoutAnswersTest] POST " + mount + FROM_NODE + " -> " + result.getStatus().value() + " "
                + (body == null ? "" : new String(body, StandardCharsets.UTF_8)));
        return result;
    }

    private static JsonNode body(EntityExchangeResult<byte[]> result) throws Exception {
        return MAPPER.readTree(result.getResponseBodyContent());
    }

    /** The whole {@code QueryResultView} of an answer: its seven properties, nulls as written. */
    private static ObjectNode view(String queryCode, boolean success, String message, String data) {
        ObjectNode view = MAPPER.createObjectNode();
        view.put("code", VIEW_CODE);
        view.put("queryCode", queryCode);
        view.put("success", success);
        view.put("message", message);
        view.put("data", data);
        view.putNull("headers");
        view.putArray("hintMessages");
        return view;
    }

    static Stream<Arguments> refusedTimeouts() {
        return Stream.of(NewUrl.QUERY_URL, Url.QUERY_URL).flatMap(mount -> Stream.of(
                Arguments.of(mount, INVALID_TIMEOUT, PluginCommonError.QUERY_ARGUMENT_ERROR, INVALID_TIMEOUT_MESSAGE),
                Arguments.of(mount, ABOVE_THE_MAXIMUM, PluginCommonError.EXCEED_MAX_QUERY_TIMEOUT, ABOVE_THE_MAXIMUM_MESSAGE)));
    }

    /**
     * NEW-29: a stored timeout the execution service refuses when called is answered with HTTP 200 and the error view of
     * its own code, on both mounts, and nothing is executed.
     */
    @ParameterizedTest(name = "{0}, stored timeout [{1}]")
    @MethodSource("refusedTimeouts")
    void aRefusedStoredTimeout_isAnErrorViewWithStatus200NEW29(String mount, String timeout, PluginCommonError code, String message)
            throws Exception {
        storedQuery(timeout);
        try (ContractTestClient client = builder.controllerWithMockedDependencies(QueryController.class).build()) {
            EntityExchangeResult<byte[]> result = post(client, mount);

            assertThat(result.getStatus()).isEqualTo(HttpStatus.OK);
            assertThat(body(result)).isEqualTo(view(code.name(), false, message, null));
        }
        verifyNoInteractions(pool, metaInfo, pluginClient, executor);
    }

    /** Control: a valid stored timeout runs to the executor's data, on both mounts. */
    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {NewUrl.QUERY_URL, Url.QUERY_URL})
    @SuppressWarnings({"rawtypes", "unchecked"})
    void aValidStoredTimeout_isTheExecutorsDataWithStatus200(String mount) throws Exception {
        storedQuery(VALID_TIMEOUT);
        when(metaInfo.getQueryExecutor(DATASOURCE_TYPE)).thenReturn(executor);
        when(executor.buildQueryExecutionContextMono(any(), any(), any(), any())).thenReturn(Mono.just(Mockito.mock(QueryExecutionContext.class)));
        when(pool.getOrCreateConnection(any())).thenReturn((Mono) Mono.just(Mockito.mock(DatasourceConnectionHolder.class)));
        when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.just(QueryExecutionResult.success(DATA)));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(QueryController.class).build()) {
            EntityExchangeResult<byte[]> result = post(client, mount);

            assertThat(result.getStatus()).isEqualTo(HttpStatus.OK);
            assertThat(body(result)).isEqualTo(view(OK_QUERY_CODE, true, null, DATA));
        }
    }
}

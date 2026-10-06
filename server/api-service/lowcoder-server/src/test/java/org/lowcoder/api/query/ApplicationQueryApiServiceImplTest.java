package org.lowcoder.api.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.lowcoder.domain.permission.model.ResourceAction.READ_APPLICATIONS;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceCreationSource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.domain.query.service.QueryExecutionService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.ConnectionAuthToken;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.query.service.QueryExecutionServiceImpl;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.models.Param;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link ApplicationQueryApiServiceImpl} with every collaborator mocked: argument validation, the read-permission gate
 * (edit mode, view mode, forged module path), the tenant check between datasource and app, the base query source
 * (own, live library record, recorded library record), what reaches {@code QueryExecutionService.executeQuery}, and
 * the "OAuth inherited from login" headers.
 *
 * <p>Fixed since: the NullPointerException for a connection with a null authId (BF-040), now asserted by
 * {@link #oauthInherit_connectionWithNullAuthId_isSkippedInEitherOrderBF040} and
 * {@link #oauthInherit_noActiveAuthId_doesNotMatchAConnectionWithoutAuthIdBF040}.
 */
@ExtendWith(MockitoExtension.class)
class ApplicationQueryApiServiceImplTest {

    private static final String LOG_PREFIX = "[ApplicationQueryApiServiceImplTest] ";
    /** The shipped maximum query timeout ({@code application.yaml} {@code common.max-query-timeout}), in seconds. */
    private static final int MAX_QUERY_TIMEOUT_SECONDS = 120;
    private static final String ABOVE_THE_MAXIMUM = (MAX_QUERY_TIMEOUT_SECONDS + 1) + "s";
    /** The shipped maximum written in minutes, and one minute above it. */
    private static final String MINUTES_AT_THE_MAXIMUM = (MAX_QUERY_TIMEOUT_SECONDS / 60) + "m";
    private static final String MINUTES_ABOVE_THE_MAXIMUM = (MAX_QUERY_TIMEOUT_SECONDS / 60 + 1) + "m";

    private static final String APP_ID = "app-1";
    private static final String ROOT_APP_ID = "root-app";
    private static final String QUERY_ID = "query-1";
    private static final String DATASOURCE_ID = "ds-1";
    private static final String APP_ORG = "org-app";
    private static final String OTHER_ORG = "org-other";
    private static final String VISITOR_ID = "visitor-1";
    private static final String TIMEOUT = "5000";
    private static final int PORT = 18080;
    private static final String PLAIN_TYPE = "mysql";
    private static final String OAUTH_TYPE_NAME = RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN.name();

    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private LibraryQueryService libraryQueryService;
    @Mock
    private LibraryQueryRecordService libraryQueryRecordService;
    @Mock
    private ApplicationService applicationService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private DatasourceService datasourceService;
    @Mock
    private QueryExecutionService queryExecutionService;
    @Mock
    private CommonConfig commonConfig;
    @Mock
    private ApplicationRecordService applicationRecordService;
    @Mock
    private ServerWebExchange exchange;
    @Mock
    private ServerHttpRequest httpRequest;
    @Mock
    private Application app;

    private ApplicationQueryApiServiceImpl service;

    private final List<String> events = new ArrayList<>();
    private final MultiValueMap<String, HttpCookie> cookies = new LinkedMultiValueMap<>();
    private final Set<String> disallowedHosts = Set.of("169.254.169.254");
    private final QueryExecutionResult result = QueryExecutionResult.success("rows");
    private final User visitor = new User();
    private Datasource datasource;
    private ApplicationQuery appQuery;

    @BeforeEach
    void setUp() {
        service = new ApplicationQueryApiServiceImpl(sessionUserService, libraryQueryService, libraryQueryRecordService,
                applicationService, resourcePermissionService, datasourceService, queryExecutionService, commonConfig,
                applicationRecordService);
        ReflectionTestUtils.setField(service, "port", PORT);

        visitor.setId(VISITOR_ID);
        datasource = new Datasource();
        datasource.setId(DATASOURCE_ID);
        datasource.setOrganizationId(APP_ORG);
        datasource.setType(PLAIN_TYPE);
        datasource.setCreationSource(DatasourceCreationSource.USER_CREATED.getValue());
        appQuery = new ApplicationQuery("q-id", "q-gid", "q-name", DATASOURCE_ID, Map.of("sql", "select 1"), "manual", TIMEOUT, "mysql");

        lenient().when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        lenient().when(applicationService.findById(APP_ID)).thenReturn(Mono.just(app));
        lenient().when(app.getOrganizationId()).thenReturn(APP_ORG);
        lenient().when(app.getQueryByViewModeAndQueryId(anyBoolean(), eq(QUERY_ID), eq(applicationRecordService)))
                .thenAnswer(invocation -> Mono.just(appQuery));
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(anyString(), anyString(), eq(READ_APPLICATIONS)))
                .thenAnswer(invocation -> loggedPermission(invocation.getArgument(1)));
        lenient().when(datasourceService.getById(DATASOURCE_ID)).thenAnswer(invocation -> Mono.defer(() -> {
            events.add("datasource");
            return Mono.just(datasource);
        }));
        lenient().when(queryExecutionService.executeQuery(any(), any(), any(), any(), any())).thenAnswer(invocation -> Mono.defer(() -> {
            events.add("execute");
            return Mono.just(result);
        }));
        lenient().when(commonConfig.getDisallowedHosts()).thenReturn(disallowedHosts);
        lenient().when(exchange.getRequest()).thenReturn(httpRequest);
        lenient().when(httpRequest.getCookies()).thenReturn(cookies);
    }

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private Mono<Void> loggedPermission(String resourceId) {
        return Mono.defer(() -> {
            events.add("permission:" + resourceId);
            return Mono.empty();
        });
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    private static QueryExecutionRequest request(String appId, String queryId, boolean viewMode, String[] path) {
        QueryExecutionRequest request = new QueryExecutionRequest();
        request.setApplicationId(appId);
        request.setQueryId(queryId);
        request.setViewMode(viewMode);
        request.setPath(path);
        return request;
    }

    private static QueryExecutionRequest validRequest() {
        return request(APP_ID, QUERY_ID, false, null);
    }

    private static Application moduleWithId(String id) {
        Application module = org.mockito.Mockito.mock(Application.class);
        lenient().when(module.getId()).thenReturn(id);
        return module;
    }

    private QueryVisitorContext capturedContext() {
        ArgumentCaptor<QueryVisitorContext> captor = ArgumentCaptor.forClass(QueryVisitorContext.class);
        verify(queryExecutionService).executeQuery(any(), any(), any(), any(), captor.capture());
        return captor.getValue();
    }

    // ------------------------------------------------------------------ argument validation

    /**
     * Catches executing a query without a query id: INVALID_PARAMETER with key INVALID_QUERY_ID, and the id is checked
     * before the app id (both blank gives INVALID_QUERY_ID), with no lookup and no session read.
     */
    @ParameterizedTest(name = "query id [{0}] and app id [{1}]")
    @MethodSource("blankQueryIdRows")
    void execute_blankQueryId_isInvalidQueryId(String queryId, String appId) {
        StepVerifier.create(service.executeApplicationQuery(exchange, request(appId, queryId, false, null)))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "INVALID_QUERY_ID"))
                .verify();
        verifyNoInteractions(applicationService, sessionUserService, resourcePermissionService, queryExecutionService);
        say("blank query id [%s] / app id [%s] -> INVALID_QUERY_ID", queryId, appId);
    }

    static Stream<Arguments> blankQueryIdRows() {
        return Stream.of(Arguments.of(null, APP_ID), Arguments.of("", APP_ID), Arguments.of("  ", APP_ID),
                Arguments.of("", ""), Arguments.of(null, null));
    }

    /** Catches executing a query without an app id: INVALID_PARAMETER with key INVALID_APP_ID and nothing looked up. */
    @ParameterizedTest(name = "app id [{0}]")
    @NullAndEmptySource
    @ValueSource(strings = {"  "})
    void execute_blankAppId_isInvalidAppId(String appId) {
        StepVerifier.create(service.executeApplicationQuery(exchange, request(appId, QUERY_ID, false, null)))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "INVALID_APP_ID"))
                .verify();
        verifyNoInteractions(applicationService, sessionUserService, resourcePermissionService, queryExecutionService);
        say("blank app id [%s] -> INVALID_APP_ID", appId);
    }

    // ------------------------------------------------------------------ the read-permission gate

    static Stream<Arguments> permissionRows() {
        return Stream.of(
                Arguments.of("edit mode, no path", false, null, APP_ID),
                Arguments.of("edit mode ignores the path", false, new String[] {ROOT_APP_ID}, APP_ID),
                Arguments.of("view mode, null path", true, null, APP_ID),
                Arguments.of("view mode, empty path", true, new String[0], APP_ID),
                Arguments.of("view mode, blank root", true, new String[] {" "}, APP_ID),
                Arguments.of("view mode, root app in the path", true, new String[] {ROOT_APP_ID}, ROOT_APP_ID),
                Arguments.of("view mode, only the first path entry is the root", true, new String[] {ROOT_APP_ID, "nested-module"}, ROOT_APP_ID));
    }

    /**
     * Catches reading the wrong app's permission: edit mode checks READ_APPLICATIONS on the app id and ignores the path;
     * view mode checks it on the root app of the path (when it is not blank and the app is one of its dependent
     * modules) and on the app id otherwise. The permission check runs before the datasource is fetched or executed.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("permissionRows")
    void execute_checksReadPermissionOnTheRightApp_beforeAnythingElse(String label, boolean viewMode, String[] path, String checkedId) {
        List<Application> modules = List.of(moduleWithId(ROOT_APP_ID), moduleWithId(APP_ID));
        lenient().when(applicationService.getAllDependentModulesFromApplicationId(ROOT_APP_ID, true)).thenReturn(Mono.just(modules));

        StepVerifier.create(service.executeApplicationQuery(exchange, request(APP_ID, QUERY_ID, viewMode, path)))
                .expectNext(result)
                .verifyComplete();

        assertThat(events).containsExactly("permission:" + checkedId, "datasource", "execute");
        if (!viewMode) {
            verify(applicationService, never()).getAllDependentModulesFromApplicationId(anyString(), anyBoolean());
        }
        say("%s -> permission checked on %s, events %s", label, checkedId, events);
    }

    /**
     * Catches a query executed after a failed permission check: the error of the check is the result, and neither the
     * datasource is fetched nor the query executed.
     */
    @ParameterizedTest(name = "view mode {0}")
    @ValueSource(booleans = {false, true})
    void execute_deniedReadPermission_stopsBeforeTheDatasourceAndTheExecution(boolean viewMode) {
        BizException denied = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        when(resourcePermissionService.checkResourcePermissionWithError(VISITOR_ID, APP_ID, READ_APPLICATIONS))
                .thenReturn(Mono.defer(() -> {
                    events.add("permission:" + APP_ID);
                    return Mono.error(denied);
                }));

        StepVerifier.create(service.executeApplicationQuery(exchange, request(APP_ID, QUERY_ID, viewMode, null)))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(denied))
                .verify();

        assertThat(events).containsExactly("permission:" + APP_ID);
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("denied read permission (view mode %s) -> %s", viewMode, events);
    }

    /**
     * Regression test of correct behaviour (not a defect pin): a view-mode request whose path names a root app of which
     * the requested app is not a dependent module (a forged path) gives INVALID_PARAMETER; the permission is not
     * checked on the forged root and nothing is executed. When the app is among the modules, the permission is checked
     * on the root.
     */
    @Test
    void execute_forgedPath_appNotAmongTheRootsModules_isRejected() {
        List<Application> modules = List.of(moduleWithId(ROOT_APP_ID), moduleWithId("some-other-module"));
        when(applicationService.getAllDependentModulesFromApplicationId(ROOT_APP_ID, true)).thenReturn(Mono.just(modules));

        StepVerifier.create(service.executeApplicationQuery(exchange, request(APP_ID, QUERY_ID, true, new String[] {ROOT_APP_ID})))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "INVALID_PARAMETER"))
                .verify();

        assertThat(events).isEmpty();
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), anyString(), any());
        say("forged path -> INVALID_PARAMETER, no permission check, no execution");
    }

    // ------------------------------------------------------------------ the datasource / app tenant check

    private static final int USER_CREATED = DatasourceCreationSource.USER_CREATED.getValue();
    private static final int CLONED = DatasourceCreationSource.CLONE_FROM_TEMPLATE.getValue();
    @SuppressWarnings("deprecation")
    private static final int LEGACY = DatasourceCreationSource.LEGACY_WORKSPACE_PREDEFINED.getValue();
    private static final int STATIC = DatasourceCreationSource.SYSTEM_STATIC.getValue();
    private static final String REST_TYPE = org.lowcoder.domain.plugin.DatasourceMetaInfoConstants.REST_API;

    static Stream<Arguments> orgMatchRows() {
        return Stream.of(
                Arguments.of("user-created REST, other org", USER_CREATED, REST_TYPE, OTHER_ORG, false),
                Arguments.of("user-created plugin, other org", USER_CREATED, PLAIN_TYPE, OTHER_ORG, false),
                Arguments.of("cloned plugin, other org", CLONED, PLAIN_TYPE, OTHER_ORG, false),
                Arguments.of("user-created plugin, no org", USER_CREATED, PLAIN_TYPE, null, false),
                Arguments.of("user-created plugin, same org", USER_CREATED, PLAIN_TYPE, APP_ORG, true),
                Arguments.of("system static, other org (check skipped)", STATIC, PLAIN_TYPE, OTHER_ORG, true),
                Arguments.of("legacy quick REST, other org (check skipped)", LEGACY, REST_TYPE, OTHER_ORG, true),
                Arguments.of("legacy lowcoder api, other org (check skipped)", LEGACY, PLAIN_TYPE, OTHER_ORG, true));
    }

    /**
     * Catches running a query against another tenant's datasource: a datasource of another organization than the app
     * gives DATASOURCE_AND_APP_ORG_NOT_MATCH and the query is not executed; the check is skipped only for system-static,
     * legacy quick REST and legacy lowcoder API datasources, and passes for the same organization.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("orgMatchRows")
    void execute_datasourceOrganizationMustMatchTheApp_exceptForTheSystemAndLegacyDatasources(String label, int creationSource,
            String type, String datasourceOrg, boolean runs) {
        datasource.setCreationSource(creationSource);
        datasource.setType(type);
        datasource.setOrganizationId(datasourceOrg);

        Mono<QueryExecutionResult> execution = service.executeApplicationQuery(exchange, validRequest());

        if (runs) {
            StepVerifier.create(execution).expectNext(result).verifyComplete();
            assertThat(events).contains("execute");
        } else {
            StepVerifier.create(execution)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.DATASOURCE_AND_APP_ORG_NOT_MATCH,
                            "DATASOURCE_AND_APP_ORG_NOT_MATCH"))
                    .verify();
            assertThat(events).doesNotContain("execute");
        }
        say("%s -> runs=%s, events %s", label, runs, events);
    }

    // ------------------------------------------------------------------ the base query source

    private static ApplicationQuery libraryQuery(String libraryQueryId, String recordId) {
        Map<String, Object> comp = new HashMap<>();
        comp.put("libraryQueryId", libraryQueryId);
        comp.put("libraryQueryRecordId", recordId);
        return new ApplicationQuery("q-id", "q-gid", "q-name", null, comp, "manual", TIMEOUT, "libraryQuery");
    }

    private static BaseQuery baseQuery(Map<String, Object> config) {
        return BaseQuery.builder().datasourceId(DATASOURCE_ID).queryConfig(config).compType("mysql").build();
    }

    private Map<String, Object> executedQueryConfig() {
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(queryExecutionService).executeQuery(any(), captor.capture(), any(), any(), any());
        return captor.getValue();
    }

    /** Catches executing a library query's reference instead of its configuration: the app query's own base query is used. */
    @Test
    void execute_ownQuery_usesItsOwnBaseQuery() {
        StepVerifier.create(service.executeApplicationQuery(exchange, validRequest())).expectNext(result).verifyComplete();

        assertThat(executedQueryConfig()).isEqualTo(Map.of("sql", "select 1"));
        verifyNoInteractions(libraryQueryService, libraryQueryRecordService);
        say("own query: its own config executed, no library lookup");
    }

    /**
     * Catches the wrong library version: record id "latest" runs the live base query of the library query and never reads
     * a record; any other record id runs the recorded query of that record and never reads the live one. The datasource
     * is the library base query's, not the (empty) one of the app query.
     */
    @ParameterizedTest(name = "record id {0}")
    @ValueSource(strings = {"latest", "record-7"})
    void execute_libraryQuery_usesTheLiveOrTheRecordedVersion(String recordId) {
        boolean live = "latest".equals(recordId);
        appQuery = libraryQuery("lib-1", recordId);
        Map<String, Object> liveConfig = Map.of("sql", "live");
        Map<String, Object> recordedConfig = Map.of("sql", "recorded");
        LibraryQueryRecord record = org.mockito.Mockito.mock(LibraryQueryRecord.class);
        lenient().when(record.getQuery()).thenReturn(baseQuery(recordedConfig));
        lenient().when(libraryQueryService.getLiveBaseQueryByLibraryQueryId("lib-1")).thenReturn(Mono.just(baseQuery(liveConfig)));
        lenient().when(libraryQueryRecordService.getById("record-7")).thenReturn(Mono.just(record));

        StepVerifier.create(service.executeApplicationQuery(exchange, validRequest())).expectNext(result).verifyComplete();

        assertThat(executedQueryConfig()).isSameAs(live ? liveConfig : recordedConfig);
        if (live) {
            verify(libraryQueryRecordService, never()).getById(anyString());
        } else {
            verify(libraryQueryService, never()).getLiveBaseQueryByLibraryQueryId(anyString());
        }
        verify(datasourceService).getById(DATASOURCE_ID);
        say("library query, record id %s -> %s version executed", recordId, live ? "live" : "recorded");
    }

    /**
     * The real {@link QueryExecutionServiceImpl} with the shipped maximum of {@value #MAX_QUERY_TIMEOUT_SECONDS} s over
     * mocked execution collaborators; {@link #runs} lets a query of a type reach the executor and answer {@code result}.
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private final class RealExecution {
        final DatasourceConnectionPool pool = org.mockito.Mockito.mock(DatasourceConnectionPool.class);
        final DatasourceMetaInfoService metaInfo = org.mockito.Mockito.mock(DatasourceMetaInfoService.class);
        final DatasourcePluginClient pluginClient = org.mockito.Mockito.mock(DatasourcePluginClient.class);
        final QueryExecutor executor = org.mockito.Mockito.mock(QueryExecutor.class);
        final QueryExecutionServiceImpl service;

        RealExecution() {
            CommonConfig limits = new CommonConfig();
            limits.setMaxQueryTimeout(MAX_QUERY_TIMEOUT_SECONDS);
            service = new QueryExecutionServiceImpl(pool, metaInfo, pluginClient, limits);
        }

        void runs(String datasourceType) {
            when(metaInfo.getQueryExecutor(datasourceType)).thenReturn(executor);
            when(executor.buildQueryExecutionContextMono(any(), any(), any(), any())).thenReturn(Mono.just(org.mockito.Mockito.mock(QueryExecutionContext.class)));
            when(pool.getOrCreateConnection(any())).thenReturn((Mono) Mono.just(org.mockito.Mockito.mock(DatasourceConnectionHolder.class)));
            when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.just(result));
        }

        void assertNothingRan() {
            verifyNoInteractions(pool, metaInfo, pluginClient, executor);
        }
    }

    private ApplicationQueryApiServiceImpl serviceOver(RealExecution execution) {
        ApplicationQueryApiServiceImpl withRealExecution = new ApplicationQueryApiServiceImpl(sessionUserService, libraryQueryService,
                libraryQueryRecordService, applicationService, resourcePermissionService, datasourceService, execution.service,
                commonConfig, applicationRecordService);
        ReflectionTestUtils.setField(withRealExecution, "port", PORT);
        return withRealExecution;
    }

    private void storedTimeout(String timeout, Map<String, Object> queryConfig) {
        appQuery = new ApplicationQuery("q-id", "q-gid", "q-name", DATASOURCE_ID, queryConfig, "manual", timeout, PLAIN_TYPE);
    }

    private static void assertRefusedOverTheMaximum(Throwable error) {
        assertThat(error).isInstanceOfSatisfying(PluginException.class, plugin -> {
            assertThat(plugin.getError()).isEqualTo(PluginCommonError.EXCEED_MAX_QUERY_TIMEOUT);
            assertThat(plugin.getArgs()).containsExactly(MAX_QUERY_TIMEOUT_SECONDS);
        });
    }

    /**
     * BF-043 through the application branch of {@code POST /api/query/execute}: with the real execution service and the
     * shipped maximum, a query whose timeout is above it is answered with EXCEED_MAX_QUERY_TIMEOUT naming the maximum in
     * seconds, and nothing runs. Before the fix the maximum was multiplied by 1000 and the query ran.
     */
    @Test
    void execute_timeoutAboveTheMaximum_isRefusedThroughTheRealExecutionServiceBF043() {
        RealExecution execution = new RealExecution();
        storedTimeout(ABOVE_THE_MAXIMUM, Map.of("sql", "select 1"));

        StepVerifier.create(serviceOver(execution).executeApplicationQuery(exchange, validRequest()))
                .expectErrorSatisfies(error -> {
                    say("timeout %s with a %d s maximum -> %s", ABOVE_THE_MAXIMUM, MAX_QUERY_TIMEOUT_SECONDS, error);
                    assertRefusedOverTheMaximum(error);
                })
                .verify();
        execution.assertNothingRan();
    }

    /**
     * BF-044 through the application branch: a stored timeout in minutes is read in minutes. With the shipped maximum
     * of {@value #MAX_QUERY_TIMEOUT_SECONDS} s, {@value #MINUTES_ABOVE_THE_MAXIMUM} is refused and nothing runs, while
     * {@value #MINUTES_AT_THE_MAXIMUM} runs with its timeout in milliseconds handed to the executor. Before the fix both
     * were read as milliseconds and ran.
     */
    @Test
    void execute_timeoutInMinutes_isReadInMinutesThroughTheRealExecutionServiceBF044() {
        RealExecution refusing = new RealExecution();
        storedTimeout(MINUTES_ABOVE_THE_MAXIMUM, new HashMap<>(Map.of("sql", "select 1")));
        StepVerifier.create(serviceOver(refusing).executeApplicationQuery(exchange, validRequest()))
                .expectErrorSatisfies(error -> {
                    say("timeout %s with a %d s maximum -> %s", MINUTES_ABOVE_THE_MAXIMUM, MAX_QUERY_TIMEOUT_SECONDS, error);
                    assertRefusedOverTheMaximum(error);
                })
                .verify();
        refusing.assertNothingRan();

        RealExecution running = new RealExecution();
        running.runs(PLAIN_TYPE);
        Map<String, Object> queryConfig = new HashMap<>(Map.of("sql", "select 1"));
        storedTimeout(MINUTES_AT_THE_MAXIMUM, queryConfig);
        StepVerifier.create(serviceOver(running).executeApplicationQuery(exchange, validRequest())).expectNext(result).verifyComplete();
        say("timeout %s -> ran with timeoutMs %s", MINUTES_AT_THE_MAXIMUM, queryConfig.get("timeoutMs"));
        assertThat(queryConfig).containsEntry("timeoutMs", String.valueOf(MAX_QUERY_TIMEOUT_SECONDS * 1000));
    }

    /** Catches a query run without its datasource: DATASOURCE_NOT_FOUND carrying the datasource id, nothing executed. */
    @Test
    void execute_missingDatasource_isDatasourceNotFound() {
        when(datasourceService.getById(DATASOURCE_ID)).thenReturn(Mono.empty());

        StepVerifier.create(service.executeApplicationQuery(exchange, validRequest()))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND");
                    assertThat(((BizException) error).getArgs()).containsExactly(DATASOURCE_ID);
                })
                .verify();
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("missing datasource -> DATASOURCE_NOT_FOUND");
    }

    // ------------------------------------------------------------------ what reaches executeQuery

    /**
     * Catches a wrong hand-over to the execution: the datasource, the query config, the cleaned request parameters (blank
     * keys dropped, keys trimmed, a later duplicate wins, a null value kept), the app query's timeout and a visitor
     * context with the visitor id, the app's organization, the injected port, the request cookies and the disallowed
     * hosts, and no inherited auth headers for a plain datasource. The view mode reaches the app's query lookup.
     */
    @ParameterizedTest(name = "view mode {0}")
    @ValueSource(booleans = {false, true})
    void execute_handsTheRightArgumentsToTheExecution(boolean viewMode) {
        cookies.add("SESSION", new HttpCookie("SESSION", "abc"));
        // a system datasource of another org passes the tenant check, so the context's org id must come from the app
        datasource.setCreationSource(STATIC);
        datasource.setOrganizationId(OTHER_ORG);
        QueryExecutionRequest request = request(APP_ID, QUERY_ID, viewMode, null);
        request.setParams(List.of(Param.of(" a ", 1), Param.of("", 2), Param.of("  ", 3), Param.of("b", null), Param.of("a", 4)));

        StepVerifier.create(service.executeApplicationQuery(exchange, request)).expectNext(result).verifyComplete();

        ArgumentCaptor<Datasource> executedDatasource = ArgumentCaptor.forClass(Datasource.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> params = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<String> timeout = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<QueryVisitorContext> context = ArgumentCaptor.forClass(QueryVisitorContext.class);
        verify(queryExecutionService).executeQuery(executedDatasource.capture(), eq(appQuery.getBaseQuery().getQueryConfig()),
                params.capture(), timeout.capture(), context.capture());
        verify(app).getQueryByViewModeAndQueryId(viewMode, QUERY_ID, applicationRecordService);

        assertThat(executedDatasource.getValue()).isSameAs(datasource);
        assertThat(params.getValue()).containsOnlyKeys("a", "b").containsEntry("a", 4).containsEntry("b", null);
        assertThat(timeout.getValue()).isEqualTo(TIMEOUT);
        QueryVisitorContext visitorContext = context.getValue();
        assertThat(visitorContext.getVisitorId()).isEqualTo(VISITOR_ID);
        assertThat(visitorContext.getApplicationOrgId()).isEqualTo(APP_ORG);
        assertThat(visitorContext.getSystemPort()).isEqualTo(PORT);
        assertThat(visitorContext.getCookies()).isSameAs(cookies);
        assertThat(visitorContext.getDisallowedHosts()).isSameAs(disallowedHosts);
        assertThat(visitorContext.getAuthTokenMono().block()).isNull();
        say("hand-over verified for view mode %s: params %s", viewMode, params.getValue());
    }

    /** Catches a swallowed execution failure: the error of {@code executeQuery} is the result. */
    @Test
    void execute_failingExecution_propagatesTheError() {
        IllegalStateException failure = new IllegalStateException("plugin failed");
        when(queryExecutionService.executeQuery(any(), anyMap(), anyMap(), any(), any())).thenReturn(Mono.error(failure));

        StepVerifier.create(service.executeApplicationQuery(exchange, validRequest()))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();
        say("failing execution -> the plugin error is the result");
    }

    // ------------------------------------------------------------------ OAuth inherited from login

    private enum Kind {
        REST, GRAPHQL, JS
    }

    private static DatasourceConnectionConfig oauthConfig(Kind kind, String authId) {
        return switch (kind) {
            case REST -> RestApiDatasourceConfig.builder().authConfig(oauthAuth(authId)).build();
            case GRAPHQL -> GraphQLDatasourceConfig.builder().authConfig(oauthAuth(authId)).build();
            case JS -> {
                JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
                HashMap<String, String> authConfig = new HashMap<>();
                authConfig.put("type", OAUTH_TYPE_NAME);
                if (authId != null) {
                    authConfig.put("authId", authId);
                }
                config.put("authConfig", authConfig);
                yield config;
            }
        };
    }

    private static OAuthInheritAuthConfig oauthAuth(String authId) {
        return OAuthInheritAuthConfig.builder().authId(authId).type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build();
    }

    private static Connection connection(String authId, String accessToken) {
        return Connection.builder().authId(authId).source("src-" + authId).rawId("raw-" + authId)
                .authConnectionAuthToken(accessToken == null ? null : ConnectionAuthToken.builder().accessToken(accessToken).build())
                .build();
    }

    private void visitorWithConnections(String activeAuthId, Connection... connections) {
        visitor.setActiveAuthId(activeAuthId);
        visitor.setConnections(new LinkedHashSet<>(List.of(connections)));
    }

    private static Property expectedHeader(Kind kind, String token) {
        return kind == Kind.JS ? new Property("OAUTH_ACCESS_TOKEN", token, "header")
                : new Property("Authorization", "Bearer " + token, "header");
    }

    /** Runs the query and returns the auth properties handed to the executor (null when none). */
    private List<Property> inheritedProperties() {
        StepVerifier.create(service.executeApplicationQuery(exchange, validRequest())).expectNext(result).verifyComplete();
        return capturedContext().getAuthTokenMono().block();
    }

    static Stream<Arguments> oauthRows() {
        List<Arguments> rows = new ArrayList<>();
        for (Kind kind : Kind.values()) {
            rows.add(Arguments.of(kind, "configured authId picks that connection's token, not the other's", "auth-A", "auth-B", "tA"));
            rows.add(Arguments.of(kind, "empty authId falls back to the active auth id", "", "auth-B", "tB"));
            rows.add(Arguments.of(kind, "null authId gives no headers even if a connection is active", null, "auth-A", null));
            rows.add(Arguments.of(kind, "unknown authId gives no headers", "auth-X", "auth-A", null));
            rows.add(Arguments.of(kind, "empty authId and no active auth id gives no headers", "", null, null));
        }
        return rows.stream();
    }

    /**
     * Catches the token of the wrong connection, or a leaked/absent token: for a datasource that inherits OAuth from
     * login (REST, GraphQL, JS), the connection whose auth id matches the configured one (the active auth id when it is
     * empty, nothing when it is null) supplies the header: {@code Authorization: Bearer <token>} for REST and GraphQL,
     * {@code OAUTH_ACCESS_TOKEN} for JS; no match gives no properties.
     */
    @ParameterizedTest(name = "{0}: {1}")
    @MethodSource("oauthRows")
    void oauthInherit_picksTheRightConnectionsToken(Kind kind, String label, String configuredAuthId, String activeAuthId, String expectedToken) {
        datasource.setDetailConfig(oauthConfig(kind, configuredAuthId));
        visitorWithConnections(activeAuthId, connection("auth-A", "tA"), connection("auth-B", "tB"));

        List<Property> properties = inheritedProperties();

        if (expectedToken == null) {
            assertThat(properties).isNull();
        } else {
            assertThat(properties).containsExactly(expectedHeader(kind, expectedToken));
        }
        say("%s %s -> %s", kind, label, properties);
    }

    /** Catches a header built from a connection that holds no token: the matching connection without a token gives no properties. */
    @ParameterizedTest
    @EnumSource(Kind.class)
    void oauthInherit_matchingConnectionWithoutToken_givesNoHeaders(Kind kind) {
        datasource.setDetailConfig(oauthConfig(kind, "auth-A"));
        visitorWithConnections("auth-A", connection("auth-A", null), connection("auth-B", "tB"));

        assertThat(inheritedProperties()).isNull();
        say("%s matching connection without token -> no headers", kind);
    }

    static Stream<Arguments> notInheritingRows() {
        List<Arguments> rows = new ArrayList<>();
        rows.add(Arguments.of("REST without auth config", RestApiDatasourceConfig.builder().build()));
        rows.add(Arguments.of("GraphQL without auth config", GraphQLDatasourceConfig.builder().build()));
        rows.add(Arguments.of("JS without auth config", new JsDatasourceConnectionConfig()));
        rows.add(Arguments.of("no detail config", null));
        return rows.stream();
    }

    /** Catches headers attached to a datasource that does not inherit OAuth from login: none are handed to the executor. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("notInheritingRows")
    void oauthInherit_datasourceNotInheritingFromLogin_getsNoHeaders(String label, DatasourceConnectionConfig config) {
        datasource.setDetailConfig(config);
        visitorWithConnections("auth-A", connection("auth-A", "tA"));

        assertThat(inheritedProperties()).isNull();
        say("%s -> no headers", label);
    }

    static Stream<Arguments> nullAuthIdOrderRows() {
        List<Arguments> rows = new ArrayList<>();
        for (Kind kind : Kind.values()) {
            rows.add(Arguments.of(kind, true));
            rows.add(Arguments.of(kind, false));
        }
        return rows.stream();
    }

    /**
     * BF-040 fixed: a connection with a null auth id (legacy data) placed before the matching one made every
     * inherit-from-login query of that user fail with a NullPointerException, while with the matching one first the
     * stream short-circuited. It now matches no auth id, so the matching connection supplies the header in either order.
     */
    @ParameterizedTest(name = "{0}: null-authId connection first={1}")
    @MethodSource("nullAuthIdOrderRows")
    void oauthInherit_connectionWithNullAuthId_isSkippedInEitherOrderBF040(Kind kind, boolean nullAuthIdFirst) {
        datasource.setDetailConfig(oauthConfig(kind, "auth-A"));
        Connection withoutAuthId = connection(null, "t0");
        Connection matching = connection("auth-A", "tA");
        visitorWithConnections("auth-A", nullAuthIdFirst ? new Connection[] {withoutAuthId, matching} : new Connection[] {matching, withoutAuthId});

        List<Property> properties = inheritedProperties();

        say("%s: null-authId connection first=%s -> %s", kind, nullAuthIdFirst, properties);
        assertThat(properties).containsExactly(expectedHeader(kind, "tA"));
    }

    /**
     * BF-040: with an empty configured auth id and no active auth id the lookup id is null; a connection without an auth
     * id is not taken as its match (nor does it throw), so no header is sent.
     */
    @ParameterizedTest
    @EnumSource(Kind.class)
    void oauthInherit_noActiveAuthId_doesNotMatchAConnectionWithoutAuthIdBF040(Kind kind) {
        datasource.setDetailConfig(oauthConfig(kind, ""));
        visitorWithConnections(null, connection(null, "t0"));

        List<Property> properties = inheritedProperties();

        say("%s: no active auth id, only a null-authId connection -> %s", kind, properties);
        assertThat(properties).isNull();
    }
}

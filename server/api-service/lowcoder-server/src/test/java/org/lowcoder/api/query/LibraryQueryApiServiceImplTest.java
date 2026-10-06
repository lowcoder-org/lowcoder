package org.lowcoder.api.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.permission.model.ResourceAction.USE_DATASOURCES;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;
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
import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRequestFromJs;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.domain.query.service.QueryExecutionService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.ConnectionAuthToken;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.models.Param;
import org.lowcoder.sdk.models.Property;
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

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link LibraryQueryApiServiceImpl} with every collaborator mocked: the datasource-based visibility of library
 * queries, the management and view permission checks, the mutations, and the two execution flows (editing version by
 * id, and from JS by name), plus {@link LibraryQueryRequestFromJs#paramMap()}.
 *
 * <p>Tenant isolation (BF-003, fixed): read and run compare the library query's organization with the visitor's, at
 * three sites:
 * <ul>
 * <li>{@link #get_libraryQueryOfAnotherOrganization_isRefused}</li>
 * <li>{@link #executeLibraryQuery_libraryQueryOfAnotherOrganization_isRefused_andNothingRuns}</li>
 * <li>{@link #executeFromJs_nameOnlyAnotherOrganizationUses_isNotFound_andNothingRuns}</li>
 * </ul>
 * Fixed since: the NullPointerException for a connection with a null authId (BF-040), now asserted by
 * {@link #oauthInherit_connectionWithNullAuthId_isSkippedInEitherOrderBF040} and
 * {@link #oauthInherit_editingFlow_emptyAuthId_doesNotMatchAConnectionWithoutAuthIdBF040}.
 */
@ExtendWith(MockitoExtension.class)
class LibraryQueryApiServiceImplTest {

    private static final String LOG_PREFIX = "[LibraryQueryApiServiceImplTest] ";

    private static final String ORG = "org-1";
    private static final String OTHER_ORG = "org-other";
    private static final String VISITOR_ID = "visitor-1";
    private static final String MEMBER_USER_ID = "member-user";
    private static final String CREATOR_ID = "creator-1";
    private static final String CREATOR_NAME = "Creator";
    private static final String LQ_ID = "lq-1";
    private static final String DS_ID = "ds-1";
    private static final String DS_PERMITTED = "ds-permitted";
    private static final String DS_DENIED = "ds-denied";
    private static final String DS_FOREIGN = "ds-foreign";
    private static final String DS_PERMITTED_OBJECT_ID = "dspermittedobjectid";
    private static final String DS_DENIED_OBJECT_ID = "dsdeniedobjectid";
    private static final int PORT = 18081;
    private static final Instant CREATED_AT = Instant.ofEpochMilli(1_700_000_000_000L);
    private static final String OAUTH_TYPE_NAME = RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN.name();

    @Mock
    private LibraryQueryService libraryQueryService;
    @Mock
    private LibraryQueryRecordService libraryQueryRecordService;
    @Mock
    private UserService userService;
    @Mock
    private OrgDevChecker orgDevChecker;
    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private QueryExecutionService queryExecutionService;
    @Mock
    private DatasourceService datasourceService;
    @Mock
    private BusinessEventPublisher businessEventPublisher;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private CommonConfig commonConfig;
    @Mock
    private AuthenticationService authenticationService;
    @Mock
    private ServerWebExchange exchange;
    @Mock
    private ServerHttpRequest httpRequest;

    private LibraryQueryApiServiceImpl service;

    private final List<String> events = new ArrayList<>();
    private final MultiValueMap<String, HttpCookie> cookies = new LinkedMultiValueMap<>();
    private final java.util.Set<String> disallowedHosts = java.util.Set.of("169.254.169.254");
    private final QueryExecutionResult result = QueryExecutionResult.success("rows");
    private final User visitor = new User();
    private final User creator = new User();
    private Datasource datasource;

    @BeforeEach
    void setUp() {
        service = new LibraryQueryApiServiceImpl(libraryQueryService, libraryQueryRecordService, userService, orgDevChecker,
                sessionUserService, queryExecutionService, datasourceService, businessEventPublisher, resourcePermissionService,
                commonConfig, authenticationService);
        ReflectionTestUtils.setField(service, "port", PORT);

        visitor.setId(VISITOR_ID);
        creator.setId(CREATOR_ID);
        creator.setName(CREATOR_NAME);
        datasource = new Datasource();
        datasource.setId(DS_ID);
        datasource.setOrganizationId(ORG);

        lenient().when(orgDevChecker.checkCurrentOrgDev()).thenAnswer(invocation -> loggedVoid("dev"));
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member(ORG)));
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        lenient().when(commonConfig.getDisallowedHosts()).thenReturn(disallowedHosts);
        lenient().when(exchange.getRequest()).thenReturn(httpRequest);
        lenient().when(httpRequest.getCookies()).thenReturn(cookies);
        lenient().when(datasourceService.getById(DS_ID)).thenAnswer(invocation -> logged("datasource", datasource));
        lenient().when(queryExecutionService.executeQuery(any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> logged("execute", result));
        lenient().when(userService.findById(CREATOR_ID)).thenReturn(Mono.just(creator));
        lenient().when(libraryQueryService.getById(LQ_ID)).thenReturn(Mono.just(libraryQuery(LQ_ID, ORG, "stored", DS_ID, CREATOR_ID)));
    }

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static OrgMember member(String orgId) {
        return new OrgMember(orgId, MEMBER_USER_ID, MemberRole.MEMBER, "normal", 0L);
    }

    private Mono<Void> loggedVoid(String event) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.empty();
        });
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.justOrEmpty(value);
        });
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    private static Map<String, Object> dsl(String datasourceId, Map<String, Object> comp, String timeout) {
        Map<String, Object> query = new HashMap<>();
        if (datasourceId != null) {
            query.put("datasourceId", datasourceId);
        }
        query.put("comp", comp);
        query.put("compType", "mysql");
        if (timeout != null) {
            query.put("timeout", timeout);
        }
        return Map.of("query", query);
    }

    private static LibraryQuery libraryQuery(String id, String orgId, String name, String datasourceId, String createdBy) {
        LibraryQuery query = LibraryQuery.builder().organizationId(orgId).name(name)
                .libraryQueryDSL(dsl(datasourceId, Map.of("sql", name), null)).build();
        query.setId(id);
        query.setGid("gid-" + id);
        query.setCreatedBy(createdBy);
        query.setCreatedAt(CREATED_AT);
        return query;
    }

    private static BaseQuery baseQuery(Map<String, Object> config, String timeout) {
        return BaseQuery.builder().datasourceId(DS_ID).queryConfig(config).compType("mysql").timeoutStr(timeout).build();
    }

    private static LibraryQueryRecord record(String id, String libraryQueryId, String tag) {
        LibraryQueryRecord record = LibraryQueryRecord.builder().libraryQueryId(libraryQueryId).tag(tag).commitMessage("msg-" + tag)
                .libraryQueryDSL(dsl(DS_ID, Map.of("sql", "recorded"), null)).build();
        record.setId(id);
        record.setCreatedAt(CREATED_AT);
        record.setCreatedBy(CREATOR_ID);
        return record;
    }

    private QueryVisitorContext capturedContext() {
        ArgumentCaptor<QueryVisitorContext> captor = ArgumentCaptor.forClass(QueryVisitorContext.class);
        verify(queryExecutionService).executeQuery(any(), any(), any(), any(), captor.capture());
        return captor.getValue();
    }

    // ------------------------------------------------------------------ catalogue visibility (list and drop-down)

    private final LibraryQuery alpha = libraryQuery("lq-alpha", ORG, "alpha-perm", DS_PERMITTED, CREATOR_ID);
    private final LibraryQuery beta = libraryQuery("lq-beta", ORG, "beta-denied", DS_DENIED, CREATOR_ID);
    private final LibraryQuery gamma = libraryQuery("lq-gamma", ORG, "gamma-foreign", DS_FOREIGN, CREATOR_ID);
    private final LibraryQuery delta = libraryQuery("lq-delta", ORG, "delta-nods", null, CREATOR_ID);
    private final LibraryQuery epsilon = libraryQuery("lq-epsilon", ORG, "epsilon-blank", "", CREATOR_ID);
    private final LibraryQuery zeta = libraryQuery("lq-zeta", ORG, "zeta-ghost", DS_PERMITTED, "ghost");

    /** Datasource ids of the catalogue in order, without the blank ones: what the permission filters are asked about. */
    private final List<String> catalogueDatasourceIds = List.of(DS_PERMITTED, DS_DENIED, DS_FOREIGN, DS_PERMITTED);

    private void stubCatalogue() {
        when(libraryQueryService.getByOrganizationId(ORG)).thenReturn(Flux.just(alpha, beta, gamma, delta, epsilon, zeta));
        when(resourcePermissionService.filterResourceWithPermission(VISITOR_ID, catalogueDatasourceIds, USE_DATASOURCES))
                .thenReturn(Flux.just(DS_PERMITTED));
        when(datasourceService.getObjectIdsByIdOrGid(catalogueDatasourceIds)).thenReturn(Mono.just(Map.of()));
        when(datasourceService.retainNoneExistAndNonCurrentOrgDatasourceIds(catalogueDatasourceIds, ORG))
                .thenReturn(Flux.just(DS_FOREIGN));
        lenient().when(userService.getByIds(any())).thenReturn(Mono.just(Map.of(CREATOR_ID, creator)));
    }

    static Stream<Arguments> nameFilterRows() {
        return Stream.of(
                Arguments.of("", List.of("alpha-perm", "gamma-foreign")),
                Arguments.of("PERM", List.of("alpha-perm")),
                Arguments.of("FOREIGN", List.of("gamma-foreign")),
                Arguments.of("denied", List.of()),
                Arguments.of("nods", List.of()),
                Arguments.of("zzz", List.of()));
    }

    /**
     * Catches showing a library query whose datasource the visitor may not use: the visitor's own organization is
     * listed; a query is kept when its datasource is USE_DATASOURCES-permitted or does not exist / is not of the
     * current organization, hidden when not permitted or without a datasource id; the name filter ignores case; the
     * views carry the creator's name, and a query whose creator no longer resolves is dropped from this list.
     */
    @ParameterizedTest(name = "name filter [{0}]")
    @MethodSource("nameFilterRows")
    void listLibraryQueries_showsOnlyQueriesWithAUsableDatasource_matchingTheName(String name, List<String> expectedNames) {
        stubCatalogue();

        StepVerifier.create(service.listLibraryQueries(name))
                .assertNext(views -> {
                    assertThat(views).extracting(LibraryQueryView::name).containsExactlyElementsOf(expectedNames);
                    assertThat(views).allSatisfy(view -> assertThat(view.creatorName()).isEqualTo(CREATOR_NAME));
                    assertThat(views).allSatisfy(view -> assertThat(view.organizationId()).isEqualTo(ORG));
                })
                .verifyComplete();
        say("list [%s] -> %s", name, expectedNames);
    }

    /**
     * BF-002: a library query may name its datasource by gid, while the use permissions are stored under object ids. The gids
     * are converted first, so the permission filter and the other-org check are asked about the object ids: a gid of a
     * datasource the visitor may use is listed, a gid of one the visitor may not use is hidden (it used to be listed, as the
     * gid was reported as missing).
     */
    @Test
    void listLibraryQueries_gidReferences_areCheckedUnderTheObjectIds() {
        String permittedGid = "gid-of-" + DS_PERMITTED_OBJECT_ID;
        String deniedGid = "gid-of-" + DS_DENIED_OBJECT_ID;
        List<String> objectIds = List.of(DS_PERMITTED_OBJECT_ID, DS_DENIED_OBJECT_ID);
        when(libraryQueryService.getByOrganizationId(ORG)).thenReturn(Flux.just(
                libraryQuery("lq-gid-permitted", ORG, "gid-permitted", permittedGid, CREATOR_ID),
                libraryQuery("lq-gid-denied", ORG, "gid-denied", deniedGid, CREATOR_ID)));
        when(datasourceService.getObjectIdsByIdOrGid(List.of(permittedGid, deniedGid)))
                .thenReturn(Mono.just(Map.of(permittedGid, DS_PERMITTED_OBJECT_ID, deniedGid, DS_DENIED_OBJECT_ID)));
        when(resourcePermissionService.filterResourceWithPermission(VISITOR_ID, objectIds, USE_DATASOURCES))
                .thenReturn(Flux.just(DS_PERMITTED_OBJECT_ID));
        when(datasourceService.retainNoneExistAndNonCurrentOrgDatasourceIds(objectIds, ORG)).thenReturn(Flux.empty());
        lenient().when(userService.getByIds(any())).thenReturn(Mono.just(Map.of(CREATOR_ID, creator)));

        StepVerifier.create(service.listLibraryQueries(""))
                .assertNext(views -> assertThat(views).extracting(LibraryQueryView::name).containsExactly("gid-permitted"))
                .verifyComplete();
        say("list by gid: %s permitted, %s denied -> only gid-permitted", permittedGid, deniedGid);
    }

    /** Catches listing without the developer check: a failing check is the result and no library query is read. */
    @Test
    void listLibraryQueries_deniedDevCheck_readsNothing() {
        BizException denied = new BizException(BizError.NEED_DEV_TO_CREATE_RESOURCE, "NEED_DEV_TO_CREATE_RESOURCE");
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(denied));

        StepVerifier.create(service.listLibraryQueries("")).expectErrorSatisfies(error -> assertThat(error).isSameAs(denied)).verify();

        verifyNoInteractions(libraryQueryService, resourcePermissionService);
        say("list: dev check denied -> nothing read");
    }

    /**
     * Catches the drop-down mixing records between queries or leaking hidden ones: the same visibility and name filter
     * as the list, no developer check, a query without records gives a view with a null record list, a query with
     * records the record meta views, and a query whose creator does not resolve stays (creator name null).
     */
    @ParameterizedTest(name = "name filter [{0}]")
    @ValueSource(strings = {"", "FOREIGN", "ghost"})
    void dropDownList_sameVisibility_attachesRecordsPerQuery_andKeepsQueriesWithoutCreator(String name) {
        stubCatalogue();
        List<LibraryQuery> visible = Stream.of(alpha, gamma, zeta)
                .filter(query -> query.getName().toLowerCase().contains(name.toLowerCase())).toList();
        when(libraryQueryRecordService.getByLibraryQueryIdIn(visible.stream().map(LibraryQuery::getId).toList()))
                .thenReturn(Mono.just(Map.of("lq-alpha", List.of(record("rec-1", "lq-alpha", "v1")))));

        StepVerifier.create(service.dropDownList(name))
                .assertNext(views -> {
                    assertThat(views).extracting(view -> view.libraryQueryMetaView().name())
                            .containsExactlyElementsOf(visible.stream().map(LibraryQuery::getName).toList());
                    for (LibraryQueryAggregateView view : views) {
                        String viewName = view.libraryQueryMetaView().name();
                        assertThat(view.libraryQueryMetaView().creatorName()).isEqualTo(viewName.contains("ghost") ? null : CREATOR_NAME);
                        if (viewName.equals("alpha-perm")) {
                            assertThat(view.recordMetaViewList()).hasSize(1);
                            assertThat(view.recordMetaViewList().get(0).tag()).isEqualTo("v1");
                            assertThat(view.recordMetaViewList().get(0).libraryQueryId()).isEqualTo("lq-alpha");
                        } else {
                            assertThat(view.recordMetaViewList()).isNull();
                        }
                    }
                })
                .verifyComplete();
        verify(orgDevChecker, never()).checkCurrentOrgDev();
        say("dropDown [%s] -> %s", name, visible.stream().map(LibraryQuery::getName).toList());
    }

    // ------------------------------------------------------------------ get

    /** Catches a wrong view of a library query: it carries the stored fields and the creator's name. */
    @Test
    void get_returnsTheViewWithTheCreatorsName() {
        LibraryQuery stored = libraryQuery(LQ_ID, ORG, "stored", DS_ID, CREATOR_ID);
        when(libraryQueryService.getById(LQ_ID)).thenReturn(Mono.just(stored));

        StepVerifier.create(service.get(LQ_ID))
                .assertNext(view -> {
                    assertThat(view.id()).isEqualTo(LQ_ID);
                    assertThat(view.gid()).isEqualTo("gid-" + LQ_ID);
                    assertThat(view.name()).isEqualTo("stored");
                    assertThat(view.organizationId()).isEqualTo(ORG);
                    assertThat(view.creatorName()).isEqualTo(CREATOR_NAME);
                    assertThat(view.createTime()).isEqualTo(CREATED_AT.toEpochMilli());
                })
                .verifyComplete();
        say("get: view built");
    }

    /** Pins today's behaviour: an unknown query propagates the service error, a creator that does not resolve gives an empty result. */
    @Test
    void get_unknownQueryIsAnError_unresolvedCreatorGivesEmpty() {
        BizException notFound = new BizException(BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND");
        when(libraryQueryService.getById("missing")).thenReturn(Mono.error(notFound));
        StepVerifier.create(service.get("missing")).expectErrorSatisfies(error -> assertThat(error).isSameAs(notFound)).verify();

        when(libraryQueryService.getById("orphan")).thenReturn(Mono.just(libraryQuery("orphan", ORG, "orphan", DS_ID, "ghost")));
        when(userService.findById("ghost")).thenReturn(Mono.empty());
        StepVerifier.create(service.get("orphan")).verifyComplete();
        say("get: unknown query -> error, unresolved creator -> empty");
    }

    /**
     * BF-003 (was pinned as the plan section 9 tenant-isolation row): a library query of another organization is refused
     * with LIBRARY_QUERY_AND_ORG_NOT_MATCH, so neither its DSL nor its creator is returned. It is a view check: the visitor's
     * organization is compared, no developer check.
     */
    @Test
    void get_libraryQueryOfAnotherOrganization_isRefused() {
        LibraryQuery foreign = libraryQuery("lq-foreign", OTHER_ORG, "secret-query", DS_FOREIGN, CREATOR_ID);
        when(libraryQueryService.getById("lq-foreign")).thenReturn(Mono.just(foreign));

        StepVerifier.create(service.get("lq-foreign"))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH"))
                .verify();

        verify(sessionUserService).getVisitorOrgMemberCache();
        verify(userService, never()).findById(anyString());
        verifyNoInteractions(orgDevChecker);
        say("get: another org's library query refused (BF-003)");
    }

    // ------------------------------------------------------------------ management permission and mutations

    private enum Operation {
        CREATE, UPDATE, DELETE, PUBLISH
    }

    private enum Gate {
        DEV_DENIED, ORG_MISMATCH, ALLOWED
    }

    private LibraryQuery stored;
    private BizException devDenied;

    private void stubMutations(String storedOrg) {
        stored = libraryQuery(LQ_ID, storedOrg, "stored", DS_ID, CREATOR_ID);
        lenient().when(libraryQueryService.getById(LQ_ID)).thenReturn(Mono.just(stored));
        lenient().when(libraryQueryService.insert(any(LibraryQuery.class))).thenAnswer(invocation -> logged("insert", stored));
        lenient().when(libraryQueryService.update(eq(LQ_ID), any(LibraryQuery.class))).thenAnswer(invocation -> logged("update", true));
        lenient().when(libraryQueryService.delete(LQ_ID)).thenAnswer(invocation -> Mono.defer(() -> {
            events.add("delete");
            return Mono.empty();
        }));
        lenient().when(libraryQueryRecordService.deleteAllLibraryQueryTagByLibraryQueryId(LQ_ID))
                .thenAnswer(invocation -> logged("deleteRecords", 1L));
        lenient().when(libraryQueryRecordService.insert(any(LibraryQueryRecord.class)))
                .thenAnswer(invocation -> logged("insertRecord", record("rec-new", LQ_ID, "tag")));
    }

    private Mono<?> invoke(Operation operation) {
        UpsertLibraryQueryRequest update = new UpsertLibraryQueryRequest();
        update.setName("renamed");
        update.setLibraryQueryDSL(dsl(DS_ID, Map.of("sql", "new"), null));
        return switch (operation) {
            case CREATE -> service.create(stored);
            case UPDATE -> service.update(LQ_ID, update);
            case DELETE -> service.delete(LQ_ID);
            case PUBLISH -> service.publish(LQ_ID, new LibraryQueryPublishRequest("first release", "v1"));
        };
    }

    private static List<String> expectedMutationEvents(Operation operation) {
        return switch (operation) {
            case CREATE -> List.of("dev", "insert");
            case UPDATE -> List.of("dev", "update");
            case DELETE -> List.of("dev", "delete", "deleteRecords");
            case PUBLISH -> List.of("dev", "insertRecord");
        };
    }

    static Stream<Arguments> gateRows() {
        List<Arguments> rows = new ArrayList<>();
        for (Operation operation : Operation.values()) {
            for (Gate gate : Gate.values()) {
                rows.add(Arguments.of(operation, gate));
            }
        }
        return rows.stream();
    }

    /**
     * Catches editing another organization's library query: create, update, delete and publish run the developer check
     * first, then compare the visitor's organization with the one of the entity (the new entity for create, the stored
     * query for the others); a failing check or a mismatch (LIBRARY_QUERY_AND_ORG_NOT_MATCH) stops everything and
     * nothing is inserted, updated or deleted (counted subscriptions); a match performs exactly the mutation.
     */
    @ParameterizedTest(name = "{0}, {1}")
    @MethodSource("gateRows")
    void mutation_requiresADeveloperOfTheQuerysOrganization_beforeAnyChange(Operation operation, Gate gate) {
        stubMutations(gate == Gate.ORG_MISMATCH ? OTHER_ORG : ORG);
        if (gate == Gate.DEV_DENIED) {
            devDenied = new BizException(BizError.NEED_DEV_TO_CREATE_RESOURCE, "NEED_DEV_TO_CREATE_RESOURCE");
            when(orgDevChecker.checkCurrentOrgDev()).thenAnswer(invocation -> Mono.defer(() -> {
                events.add("dev");
                return Mono.error(devDenied);
            }));
        }

        switch (gate) {
            case DEV_DENIED -> {
                StepVerifier.create(invoke(operation)).expectErrorSatisfies(error -> assertThat(error).isSameAs(devDenied)).verify();
                assertThat(events).containsExactly("dev");
            }
            case ORG_MISMATCH -> {
                StepVerifier.create(invoke(operation))
                        .expectErrorSatisfies(error -> assertBizError(error, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH"))
                        .verify();
                assertThat(events).containsExactly("dev");
            }
            default -> {
                StepVerifier.create(invoke(operation)).expectNextCount(operation == Operation.DELETE ? 0 : 1).verifyComplete();
                assertThat(events).isEqualTo(expectedMutationEvents(operation));
            }
        }
        say("%s, %s -> events %s", operation, gate, events);
    }

    /**
     * Catches wrong mutation payloads: create returns the view with the creator's name; update hands only the new name
     * and DSL (no organization id) to the service and returns its result; delete removes the query and then its records,
     * both by id, and ends empty; publish builds the record from tag, commit message, the library query's id and its
     * stored DSL and returns the record meta view with the creator's name.
     */
    @Test
    void mutations_handTheRightPayloads() {
        stubMutations(ORG);

        StepVerifier.create(service.create(stored)).assertNext(view -> {
            assertThat(view.id()).isEqualTo(LQ_ID);
            assertThat(view.creatorName()).isEqualTo(CREATOR_NAME);
        }).verifyComplete();

        UpsertLibraryQueryRequest request = new UpsertLibraryQueryRequest();
        request.setName("renamed");
        request.setLibraryQueryDSL(dsl(DS_ID, Map.of("sql", "new"), null));
        StepVerifier.create(service.update(LQ_ID, request)).expectNext(true).verifyComplete();
        ArgumentCaptor<LibraryQuery> updated = ArgumentCaptor.forClass(LibraryQuery.class);
        verify(libraryQueryService).update(eq(LQ_ID), updated.capture());
        assertThat(updated.getValue().getName()).isEqualTo("renamed");
        assertThat(updated.getValue().getLibraryQueryDSL()).isSameAs(request.getLibraryQueryDSL());
        assertThat(updated.getValue().getOrganizationId()).isNull();

        events.clear();
        StepVerifier.create(service.delete(LQ_ID)).verifyComplete();
        assertThat(events).containsExactly("dev", "delete", "deleteRecords");

        StepVerifier.create(service.publish(LQ_ID, new LibraryQueryPublishRequest("first release", "v1")))
                .assertNext(view -> {
                    assertThat(view.id()).isEqualTo("rec-new");
                    assertThat(view.creatorName()).isEqualTo(CREATOR_NAME);
                })
                .verifyComplete();
        ArgumentCaptor<LibraryQueryRecord> inserted = ArgumentCaptor.forClass(LibraryQueryRecord.class);
        verify(libraryQueryRecordService).insert(inserted.capture());
        assertThat(inserted.getValue().getTag()).isEqualTo("v1");
        assertThat(inserted.getValue().getCommitMessage()).isEqualTo("first release");
        assertThat(inserted.getValue().getLibraryQueryId()).isEqualTo(LQ_ID);
        assertThat(inserted.getValue().getLibraryQueryDSL()).isSameAs(stored.getLibraryQueryDSL());
        say("mutation payloads verified");
    }

    // ------------------------------------------------------------------ view permission

    /**
     * Catches reading another organization's library query through the record flow: the view check compares the
     * visitor's organization with the stored query's (no developer check), a mismatch is
     * LIBRARY_QUERY_AND_ORG_NOT_MATCH and an unknown query propagates the service error.
     */
    @Test
    void checkLibraryQueryViewPermission_sameOrgPasses_otherOrgIsRefused_unknownQueryPropagates() {
        when(libraryQueryService.getById(LQ_ID)).thenReturn(Mono.just(libraryQuery(LQ_ID, ORG, "mine", DS_ID, CREATOR_ID)));
        StepVerifier.create(service.checkLibraryQueryViewPermission(LQ_ID)).verifyComplete();

        when(libraryQueryService.getById("lq-foreign")).thenReturn(Mono.just(libraryQuery("lq-foreign", OTHER_ORG, "theirs", DS_ID, CREATOR_ID)));
        StepVerifier.create(service.checkLibraryQueryViewPermission("lq-foreign"))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH"))
                .verify();

        BizException notFound = new BizException(BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND");
        when(libraryQueryService.getById("missing")).thenReturn(Mono.error(notFound));
        StepVerifier.create(service.checkLibraryQueryViewPermission("missing")).expectErrorSatisfies(error -> assertThat(error).isSameAs(notFound)).verify();

        verify(orgDevChecker, never()).checkCurrentOrgDev();
        say("view permission: same org ok, other org refused, unknown propagates");
    }

    // ------------------------------------------------------------------ executeLibraryQuery (editing version, by id)

    private QueryExecutionRequest editingRequest(String libraryQueryId) {
        QueryExecutionRequest request = new QueryExecutionRequest();
        request.setLibraryQueryId(libraryQueryId);
        return request;
    }

    /**
     * Catches executing without the developer check or against the wrong query: the check runs first (denied: nothing is
     * fetched or executed), the editing base query of the request's library query id is run on the datasource named by
     * that base query, and a missing datasource is DATASOURCE_NOT_FOUND with the datasource id.
     */
    @Test
    void executeLibraryQuery_checksDevFirst_runsTheEditingQuery_missingDatasourceIsNotFound() {
        Map<String, Object> config = Map.of("sql", "editing");
        when(libraryQueryService.getEditingBaseQueryByLibraryQueryId(LQ_ID)).thenReturn(Mono.just(baseQuery(config, "7s")));

        StepVerifier.create(service.executeLibraryQuery(exchange, editingRequest(LQ_ID))).expectNext(result).verifyComplete();
        assertThat(events).containsExactly("dev", "datasource", "execute");

        events.clear();
        BizException denied = new BizException(BizError.NEED_DEV_TO_CREATE_RESOURCE, "NEED_DEV_TO_CREATE_RESOURCE");
        when(orgDevChecker.checkCurrentOrgDev()).thenAnswer(invocation -> Mono.defer(() -> {
            events.add("dev");
            return Mono.error(denied);
        }));
        StepVerifier.create(service.executeLibraryQuery(exchange, editingRequest(LQ_ID)))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(denied)).verify();
        assertThat(events).containsExactly("dev");

        events.clear();
        when(orgDevChecker.checkCurrentOrgDev()).thenAnswer(invocation -> loggedVoid("dev"));
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.empty());
        StepVerifier.create(service.executeLibraryQuery(exchange, editingRequest(LQ_ID)))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND");
                    assertThat(((BizException) error).getArgs()).containsExactly(DS_ID);
                })
                .verify();
        assertThat(events).containsExactly("dev");
        say("executeLibraryQuery: dev first, editing query run, missing datasource");
    }

    /**
     * Catches a wrong hand-over to the execution: datasource, query config, the cleaned request parameters, the base
     * query's timeout and a context with the organization member's user and org id (not the visitor's), the injected
     * port, the cookies and the disallowed hosts; a plain datasource gets no inherited headers. A failing executor
     * propagates its error here (unlike the from-JS flow).
     */
    @Test
    void executeLibraryQuery_handsTheRightArgumentsToTheExecution_andPropagatesFailures() {
        cookies.add("SESSION", new HttpCookie("SESSION", "abc"));
        Map<String, Object> config = Map.of("sql", "editing");
        when(libraryQueryService.getEditingBaseQueryByLibraryQueryId(LQ_ID)).thenReturn(Mono.just(baseQuery(config, "7s")));
        QueryExecutionRequest request = editingRequest(LQ_ID);
        request.setParams(List.of(Param.of(" a ", 1), Param.of("", 2), Param.of("b", null), Param.of("a", 4)));

        StepVerifier.create(service.executeLibraryQuery(exchange, request)).expectNext(result).verifyComplete();

        ArgumentCaptor<Datasource> executed = ArgumentCaptor.forClass(Datasource.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> params = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<QueryVisitorContext> context = ArgumentCaptor.forClass(QueryVisitorContext.class);
        verify(queryExecutionService).executeQuery(executed.capture(), eq(config), params.capture(), eq("7s"), context.capture());
        assertThat(executed.getValue()).isSameAs(datasource);
        assertThat(params.getValue()).containsOnlyKeys("a", "b").containsEntry("a", 4).containsEntry("b", null);
        assertThat(context.getValue().getVisitorId()).isEqualTo(MEMBER_USER_ID);
        assertThat(context.getValue().getApplicationOrgId()).isEqualTo(ORG);
        assertThat(context.getValue().getSystemPort()).isEqualTo(PORT);
        assertThat(context.getValue().getCookies()).isSameAs(cookies);
        assertThat(context.getValue().getDisallowedHosts()).isSameAs(disallowedHosts);
        assertThat(context.getValue().getAuthTokenMono().block()).isNull();

        IllegalStateException failure = new IllegalStateException("plugin failed");
        when(queryExecutionService.executeQuery(any(), anyMap(), anyMap(), any(), any())).thenReturn(Mono.error(failure));
        StepVerifier.create(service.executeLibraryQuery(exchange, editingRequest(LQ_ID)))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure)).verify();
        say("executeLibraryQuery: hand-over verified, failure propagates");
    }

    /**
     * BF-003 (was pinned as the plan section 9 tenant-isolation row): a developer of one organization asks to run, by id,
     * the library query of another organization. The stored query's organization is compared with the visitor's after
     * the developer check, the mismatch is LIBRARY_QUERY_AND_ORG_NOT_MATCH, and neither the other organization's datasource
     * is loaded nor the query executed.
     */
    @Test
    void executeLibraryQuery_libraryQueryOfAnotherOrganization_isRefused_andNothingRuns() {
        datasource.setOrganizationId(OTHER_ORG);
        when(libraryQueryService.getById("lq-foreign")).thenReturn(Mono.just(libraryQuery("lq-foreign", OTHER_ORG, "theirs", DS_ID, CREATOR_ID)));
        when(libraryQueryService.getEditingBaseQueryByLibraryQueryId("lq-foreign"))
                .thenReturn(Mono.just(baseQuery(Map.of("sql", "select * from their_secrets"), null)));

        StepVerifier.create(service.executeLibraryQuery(exchange, editingRequest("lq-foreign")))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH"))
                .verify();

        assertThat(events).containsExactly("dev");
        verify(datasourceService, never()).getById(anyString());
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("executeLibraryQuery: another org's query refused, nothing ran (BF-003)");
    }

    // ------------------------------------------------------------------ OAuth inherited from login (editing flow)

    private enum Kind {
        REST, GRAPHQL, JS
    }

    private static OAuthInheritAuthConfig oauthAuth(String authId) {
        return OAuthInheritAuthConfig.builder().authId(authId).type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build();
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

    private static Connection connection(String authId, String accessToken) {
        return Connection.builder().authId(authId).source("src-" + authId).rawId("raw-" + authId)
                .authConnectionAuthToken(accessToken == null ? null : ConnectionAuthToken.builder().accessToken(accessToken).build())
                .build();
    }

    private void visitorWithConnections(Connection... connections) {
        visitor.setConnections(new LinkedHashSet<>(List.of(connections)));
    }

    private static Property expectedHeader(Kind kind, String token) {
        return kind == Kind.JS ? new Property("OAUTH_ACCESS_TOKEN", token, "header")
                : new Property("Authorization", "Bearer " + token, "header");
    }

    private List<Property> inheritedPropertiesOfTheEditingFlow() {
        when(libraryQueryService.getEditingBaseQueryByLibraryQueryId(LQ_ID)).thenReturn(Mono.just(baseQuery(Map.of("sql", "x"), null)));
        StepVerifier.create(service.executeLibraryQuery(exchange, editingRequest(LQ_ID))).expectNext(result).verifyComplete();
        return capturedContext().getAuthTokenMono().block();
    }

    static Stream<Arguments> oauthRows() {
        List<Arguments> rows = new ArrayList<>();
        for (Kind kind : Kind.values()) {
            rows.add(Arguments.of(kind, "configured authId picks that connection's token, not the other's", "auth-A", "tA"));
            rows.add(Arguments.of(kind, "null authId gives no headers", null, null));
            rows.add(Arguments.of(kind, "empty authId matches no connection (no fallback in this flow)", "", null));
            rows.add(Arguments.of(kind, "unknown authId gives no headers", "auth-X", null));
        }
        return rows.stream();
    }

    /**
     * Catches the token of the wrong connection or a leaked one: for a datasource inheriting OAuth from login (REST,
     * GraphQL, JS) the connection whose auth id equals the configured one supplies {@code Authorization: Bearer <token>}
     * (REST, GraphQL) or {@code OAUTH_ACCESS_TOKEN} (JS); a null, empty or unknown auth id gives no properties.
     */
    @ParameterizedTest(name = "{0}: {1}")
    @MethodSource("oauthRows")
    void oauthInherit_editingFlow_picksTheRightConnectionsToken(Kind kind, String label, String configuredAuthId, String expectedToken) {
        datasource.setDetailConfig(oauthConfig(kind, configuredAuthId));
        visitorWithConnections(connection("auth-A", "tA"), connection("auth-B", "tB"));

        List<Property> properties = inheritedPropertiesOfTheEditingFlow();

        if (expectedToken == null) {
            assertThat(properties).isNull();
        } else {
            assertThat(properties).containsExactly(expectedHeader(kind, expectedToken));
        }
        say("%s %s -> %s", kind, label, properties);
    }

    /**
     * Catches the null auth id reaching the connection list: a datasource configured with a null auth id gives no
     * properties even when the visitor has a connection whose own auth id is null (the null guard comes first, so the
     * {@code getAuthId().equals(...)} of that connection is never evaluated).
     */
    @ParameterizedTest
    @EnumSource(Kind.class)
    void oauthInherit_editingFlow_nullConfiguredAuthId_doesNotTouchTheConnections(Kind kind) {
        datasource.setDetailConfig(oauthConfig(kind, null));
        visitorWithConnections(connection(null, "t0"));

        assertThat(inheritedPropertiesOfTheEditingFlow()).isNull();
        say("%s null configured authId with a null-authId connection -> no headers, no NPE", kind);
    }

    /** Catches a header from a connection without token: the matching connection holding no token gives no properties. */
    @ParameterizedTest
    @EnumSource(Kind.class)
    void oauthInherit_editingFlow_matchingConnectionWithoutToken_givesNoHeaders(Kind kind) {
        datasource.setDetailConfig(oauthConfig(kind, "auth-A"));
        visitorWithConnections(connection("auth-A", null), connection("auth-B", "tB"));

        assertThat(inheritedPropertiesOfTheEditingFlow()).isNull();
        say("%s matching connection without token -> no headers", kind);
    }

    static Stream<Arguments> notInheritingRows() {
        return Stream.of(
                Arguments.of("REST without auth config", RestApiDatasourceConfig.builder().build()),
                Arguments.of("GraphQL without auth config", GraphQLDatasourceConfig.builder().build()),
                Arguments.of("JS without auth config", new JsDatasourceConnectionConfig()),
                Arguments.of("no detail config", null));
    }

    /** Catches headers attached to a datasource that does not inherit OAuth from login. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("notInheritingRows")
    void oauthInherit_editingFlow_datasourceNotInheriting_getsNoHeaders(String label, DatasourceConnectionConfig config) {
        datasource.setDetailConfig(config);
        visitorWithConnections(connection("auth-A", "tA"));

        assertThat(inheritedPropertiesOfTheEditingFlow()).isNull();
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
     * BF-040 fixed: {@code getParamsAndHeadersInheritFromLogin} used the same {@code connection.getAuthId().equals(...)}
     * as the application flow, so a connection with a null auth id placed before the matching one gave a
     * NullPointerException. It now matches no auth id, so the matching connection supplies the header in either order.
     */
    @ParameterizedTest(name = "{0}: null-authId connection first={1}")
    @MethodSource("nullAuthIdOrderRows")
    void oauthInherit_connectionWithNullAuthId_isSkippedInEitherOrderBF040(Kind kind, boolean nullAuthIdFirst) {
        datasource.setDetailConfig(oauthConfig(kind, "auth-A"));
        Connection withoutAuthId = connection(null, "t0");
        Connection matching = connection("auth-A", "tA");
        visitorWithConnections(nullAuthIdFirst ? new Connection[] {withoutAuthId, matching} : new Connection[] {matching, withoutAuthId});

        List<Property> properties = inheritedPropertiesOfTheEditingFlow();

        say("%s: null-authId connection first=%s -> %s", kind, nullAuthIdFirst, properties);
        assertThat(properties).containsExactly(expectedHeader(kind, "tA"));
    }

    /** BF-040: an empty configured auth id is not the null auth id of a stored connection; no header, no exception. */
    @ParameterizedTest
    @EnumSource(Kind.class)
    void oauthInherit_editingFlow_emptyAuthId_doesNotMatchAConnectionWithoutAuthIdBF040(Kind kind) {
        datasource.setDetailConfig(oauthConfig(kind, ""));
        visitorWithConnections(connection(null, "t0"));

        List<Property> properties = inheritedPropertiesOfTheEditingFlow();

        say("%s: empty configured authId, only a null-authId connection -> %s", kind, properties);
        assertThat(properties).isNull();
    }

    // ------------------------------------------------------------------ executeLibraryQueryFromJs (by name)

    private LibraryQueryRequestFromJs jsRequest(String recordId) {
        LibraryQueryRequestFromJs request = new LibraryQueryRequestFromJs();
        request.setLibraryQueryName("name-1");
        request.setLibraryQueryRecordId(recordId);
        return request;
    }

    static Stream<Arguments> recordIdRows() {
        return Stream.of(
                Arguments.of(null, "editing"),
                Arguments.of("", "editing"),
                Arguments.of(" ", "editing"),
                Arguments.of("editing", "editing"),
                Arguments.of("latest", "live"),
                Arguments.of("rec-9", "recorded"));
    }

    /**
     * Catches running the wrong version of a library query from JS: the query is found by name; a blank or "editing"
     * record id runs the stored query's own base query, "latest" the live one and any other id the recorded one, and
     * the other sources are not asked.
     */
    @ParameterizedTest(name = "record id [{0}] -> {1}")
    @MethodSource("recordIdRows")
    void executeFromJs_picksTheVersionByRecordId(String recordId, String version) {
        LibraryQuery named = libraryQuery(LQ_ID, ORG, "editing", DS_ID, CREATOR_ID);
        when(libraryQueryService.getByOrganizationIdAndName(ORG, "name-1")).thenReturn(Mono.just(named));
        Map<String, Object> liveConfig = Map.of("sql", "live");
        Map<String, Object> recordedConfig = Map.of("sql", "recorded");
        LibraryQueryRecord recorded = mock(LibraryQueryRecord.class);
        lenient().when(recorded.getLibraryQueryId()).thenReturn(LQ_ID);
        lenient().when(recorded.getQuery()).thenReturn(baseQuery(recordedConfig, null));
        lenient().when(libraryQueryService.getById(LQ_ID)).thenReturn(Mono.just(named));
        lenient().when(libraryQueryService.getLiveBaseQueryByLibraryQueryId(LQ_ID)).thenReturn(Mono.just(baseQuery(liveConfig, null)));
        lenient().when(libraryQueryRecordService.getById("rec-9")).thenReturn(Mono.just(recorded));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest(recordId))).expectNext(result).verifyComplete();

        ArgumentCaptor<Map<String, Object>> config = mapCaptor();
        verify(queryExecutionService).executeQuery(any(), config.capture(), any(), any(), any());
        assertThat(config.getValue()).isEqualTo(switch (version) {
            case "live" -> liveConfig;
            case "recorded" -> recordedConfig;
            default -> Map.of("sql", "editing");
        });
        if (!version.equals("editing")) {
            verify(libraryQueryService, never()).getById(anyString());
        }
        if (!version.equals("live")) {
            verify(libraryQueryService, never()).getLiveBaseQueryByLibraryQueryId(anyString());
        }
        if (!version.equals("recorded")) {
            verify(libraryQueryRecordService, never()).getById(anyString());
        }
        say("fromJs record id [%s] -> %s version", recordId, version);
    }

    @SuppressWarnings("unchecked")
    private static ArgumentCaptor<Map<String, Object>> mapCaptor() {
        return ArgumentCaptor.forClass(Map.class);
    }

    private void stubJsQuery(String timeout) {
        LibraryQuery named = libraryQuery(LQ_ID, ORG, "editing", DS_ID, CREATOR_ID);
        lenient().when(libraryQueryService.getByOrganizationIdAndName(ORG, "name-1")).thenReturn(Mono.just(named));
        lenient().when(libraryQueryService.getLiveBaseQueryByLibraryQueryId(LQ_ID))
                .thenReturn(Mono.just(baseQuery(Map.of("sql", "live"), timeout)));
    }

    /** Catches a wrong timeout: the base query's timeout is used, "5s" only when it is null, empty or blank. */
    @ParameterizedTest(name = "base query timeout [{0}]")
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "9s"})
    void executeFromJs_usesTheQuerysTimeout_orFiveSeconds(String timeout) {
        stubJsQuery(timeout);

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest"))).expectNext(result).verifyComplete();

        verify(queryExecutionService).executeQuery(any(), any(), any(), eq("9s".equals(timeout) ? "9s" : "5s"), any());
        say("fromJs timeout [%s]", timeout);
    }

    /** Catches an unknown library query name or datasource swallowed: the service error / DATASOURCE_NOT_FOUND is the result. */
    @Test
    void executeFromJs_unknownNameAndMissingDatasource_areErrors() {
        BizException notFound = new BizException(BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND");
        when(libraryQueryService.getByOrganizationIdAndName(ORG, "name-1")).thenReturn(Mono.error(notFound));
        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest")))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(notFound)).verify();

        stubJsQuery(null);
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.empty());
        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest")))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND");
                    assertThat(((BizException) error).getArgs()).containsExactly(DS_ID);
                })
                .verify();
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("fromJs: unknown name -> service error, missing datasource -> DATASOURCE_NOT_FOUND");
    }

    /**
     * Catches an executor failure escaping to the caller: unlike the editing flow, the from-JS flow turns it into a
     * {@code QueryExecutionResult} with code QUERY_EXECUTION_ERROR, that message key and the failure's message as argument.
     */
    @Test
    void executeFromJs_executorFailure_isReturnedAsAnErrorResult() {
        stubJsQuery(null);
        when(queryExecutionService.executeQuery(any(), anyMap(), anyMap(), any(), any()))
                .thenReturn(Mono.error(new IllegalStateException("boom")));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest")))
                .assertNext(error -> {
                    assertThat(error.getQueryCode()).isEqualTo("QUERY_EXECUTION_ERROR");
                    assertThat(error.getMessageKey()).isEqualTo("QUERY_EXECUTION_ERROR");
                    assertThat(error.getMessageArgs()).containsExactly("boom");
                })
                .verifyComplete();
        say("fromJs: executor failure -> error result");
    }

    /**
     * Catches the wrong identity in the context: a visitor with an organization member gets that member's user id and org
     * id, port, cookies and disallowed hosts, with no inherited headers.
     */
    @Test
    void executeFromJs_contextCarriesTheMembersIds() {
        stubJsQuery(null);
        cookies.add("SESSION", new HttpCookie("SESSION", "abc"));
        LibraryQueryRequestFromJs request = jsRequest("latest");
        request.setParams(List.of(Param.of(" a ", 1), Param.of("", 2), Param.of("a", 4)));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, request)).expectNext(result).verifyComplete();

        ArgumentCaptor<Map<String, Object>> params = mapCaptor();
        ArgumentCaptor<QueryVisitorContext> contextCaptor = ArgumentCaptor.forClass(QueryVisitorContext.class);
        verify(queryExecutionService).executeQuery(any(), any(), params.capture(), any(), contextCaptor.capture());
        assertThat(params.getValue()).isEqualTo(Map.of("a", 4));
        QueryVisitorContext context = contextCaptor.getValue();
        assertThat(context.getVisitorId()).isEqualTo(MEMBER_USER_ID);
        assertThat(context.getApplicationOrgId()).isEqualTo(ORG);
        assertThat(context.getSystemPort()).isEqualTo(PORT);
        assertThat(context.getCookies()).isSameAs(cookies);
        assertThat(context.getDisallowedHosts()).isSameAs(disallowedHosts);
        assertThat(context.getAuthTokenMono().block()).isNull();
        say("fromJs context: user [%s] org [%s]", context.getVisitorId(), context.getApplicationOrgId());
    }

    /**
     * BF-003: a visitor without an organization (the member lookup fails and is mapped to {@code OrgMember.NOT_EXIST}, or
     * the member has no org id) has no organization to look the name up in, so the result is LIBRARY_QUERY_NOT_FOUND, no
     * lookup by name is made and nothing runs. Before the fix such a visitor ran the query of that name of any organization.
     */
    @ParameterizedTest(name = "member lookup fails: {0}")
    @ValueSource(booleans = {true, false})
    void executeFromJs_visitorWithoutAnOrganization_isNotFound_andNothingRuns(boolean lookupFails) {
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(lookupFails
                ? Mono.error(new IllegalStateException("no member"))
                : Mono.just(member("")));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest")))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"))
                .verify();

        verify(libraryQueryService, never()).getByOrganizationIdAndName(any(), any());
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("fromJs: visitor without an organization (lookup fails: %s) -> LIBRARY_QUERY_NOT_FOUND", lookupFails);
    }

    /**
     * BF-003: a record id names the version to run, and it must be a record of the library query found by name; a record
     * of another library query (any organization's) is LIBRARY_QUERY_NOT_FOUND and nothing runs.
     */
    @Test
    void executeFromJs_recordOfAnotherLibraryQuery_isNotFound_andNothingRuns() {
        when(libraryQueryService.getByOrganizationIdAndName(ORG, "name-1"))
                .thenReturn(Mono.just(libraryQuery(LQ_ID, ORG, "name-1", DS_ID, CREATOR_ID)));
        LibraryQueryRecord foreignRecord = mock(LibraryQueryRecord.class);
        when(foreignRecord.getLibraryQueryId()).thenReturn("lq-foreign");
        when(libraryQueryRecordService.getById("rec-foreign")).thenReturn(Mono.just(foreignRecord));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("rec-foreign")))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"))
                .verify();

        verify(foreignRecord, never()).getQuery();
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("fromJs: record of another library query -> LIBRARY_QUERY_NOT_FOUND");
    }

    /**
     * Pins today's behaviour (a dead branch of the feature, not ruled a defect): the from-JS flow asks for inherited
     * headers with a null auth id, so a datasource that inherits OAuth from login never gets its headers here, even
     * for a visitor with a matching connection and token.
     */
    @ParameterizedTest
    @EnumSource(Kind.class)
    void executeFromJs_neverAddsInheritedOAuthHeaders_evenForAnInheritingDatasource(Kind kind) {
        stubJsQuery(null);
        datasource.setDetailConfig(oauthConfig(kind, "auth-A"));
        visitorWithConnections(connection("auth-A", "tA"));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest"))).expectNext(result).verifyComplete();

        assertThat(capturedContext().getAuthTokenMono().block()).isNull();
        say("%s: from-JS flow adds no inherited headers", kind);
    }

    /**
     * BF-003 (was pinned as the plan section 9 tenant-isolation row): a visitor of one organization asks, by name, for a
     * library query only another organization has. The name is looked up in the visitor's organization only (the service
     * here answers like the repository: the query for its own organization, not found for any other), so the result is
     * LIBRARY_QUERY_NOT_FOUND and the other organization's datasource is neither loaded nor run.
     * Reachability: {@code POST /api/query/execute-from-node} (also under {@code /api/v1}) requires a signed-in user and a
     * loopback client IP ({@code QueryController#checkIp}).
     */
    @Test
    void executeFromJs_nameOnlyAnotherOrganizationUses_isNotFound_andNothingRuns() {
        datasource.setOrganizationId(OTHER_ORG);
        LibraryQuery foreign = libraryQuery(LQ_ID, OTHER_ORG, "name-1", DS_ID, CREATOR_ID);
        BizException notFound = new BizException(BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND");
        when(libraryQueryService.getByOrganizationIdAndName(anyString(), eq("name-1")))
                .thenAnswer(invocation -> OTHER_ORG.equals(invocation.getArgument(0)) ? Mono.just(foreign) : Mono.error(notFound));

        StepVerifier.create(service.executeLibraryQueryFromJs(exchange, jsRequest("latest")))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(notFound))
                .verify();

        verify(libraryQueryService).getByOrganizationIdAndName(ORG, "name-1");
        verify(libraryQueryService, never()).getByOrganizationIdAndName(eq(OTHER_ORG), anyString());
        verify(datasourceService, never()).getById(anyString());
        verify(queryExecutionService, never()).executeQuery(any(), any(), any(), any(), any());
        say("fromJs: name only org %s uses -> LIBRARY_QUERY_NOT_FOUND for a visitor of %s (BF-003, BF-068)", OTHER_ORG, ORG);
    }

    // ------------------------------------------------------------------ LibraryQueryRequestFromJs.paramMap

    /**
     * Catches wrong parameters from JS: blank keys are dropped, keys are trimmed, the last duplicate wins, a null value
     * is kept, and no parameters give an empty map.
     */
    @Test
    void requestFromJs_paramMap_cleansTheParameters() {
        LibraryQueryRequestFromJs request = new LibraryQueryRequestFromJs();
        assertThat(request.paramMap()).isEmpty();

        request.setParams(List.of(Param.of(" a ", 1), Param.of("", 2), Param.of("  ", 3), Param.of("b", null), Param.of("a", 4)));

        assertThat(request.paramMap()).containsOnlyKeys("a", "b").containsEntry("a", 4).containsEntry("b", null);
        say("paramMap: %s", request.paramMap());
    }
}

package org.lowcoder.api.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.lowcoder.domain.permission.model.ResourceAction.MANAGE_DATASOURCES;
import static org.lowcoder.domain.permission.model.ResourceAction.READ_APPLICATIONS;
import static org.lowcoder.domain.permission.model.ResourceAction.USE_DATASOURCES;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.datasource.service.JsDatasourceHelper;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.ServerException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link DatasourceApiServiceImpl} with every collaborator mocked: creation, the three listings, the MANAGE_DATASOURCES
 * gate of every datasource operation, the permission grants and edits, and {@code getPluginDynamicConfig}. "Nothing
 * mutated" is asserted by subscription counters on the mocked service Monos (a Mono that is built but never subscribed
 * does nothing). {@code DatasourceApiServiceIntegrationTest} (Spring, failsafe) does not count toward the gate; the
 * overlap in subject with it (listing, permission denial) is intended: these tests assert at the mocked layer what the
 * Spring test cannot (never subscribed, exact filters).
 *
 * <p>Pinned production defects (owner decision D-6: fixes are deferred, a fix changes these tests on purpose):
 * <ul>
 * <li>plan section 9 row "DatasourceApiServiceImpl.getPluginDynamicConfig loads the requested datasource ids ... with no
 * permission or organization check ... a null dataSourceConfig throws a NullPointerException": the missing permission
 * check is fixed (BF-019, see
 * {@link #getPluginDynamicConfig_datasourceTheVisitorMayNotManage_givesNoExtraAndIsNotLoaded}); the
 * NullPointerException is still pinned, see
 * {@link #getPluginDynamicConfig_nullDataSourceConfig_throwsNullPointerException_pinsDefect}.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DatasourceApiServiceImplTest {

    private static final String LOG_PREFIX = "[DatasourceApiServiceImplTest] ";

    private static final String DS_ID = "ds-1";
    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String APP_ID = "app-1";
    private static final String VISITOR_ID = "visitor-1";
    private static final String PERMISSION_ID = "perm-1";
    private static final String JS_TYPE = "js-plugin";
    private static final String OTHER_JS_TYPE = "js-plugin-2";
    private static final String SQL_TYPE = "mysql";
    private static final String EXTRA_KEY = "extra";

    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private OrgMemberService orgMemberService;
    @Mock
    private DatasourceService datasourceService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private PermissionHelper permissionHelper;
    @Mock
    private OrgDevChecker orgDevChecker;
    @Mock
    private UserService userService;
    @Mock
    private DatasourceConnectionPool datasourceConnectionPool;
    @Mock
    private OrganizationService organizationService;
    @Mock
    private org.lowcoder.domain.application.service.ApplicationService applicationService;
    @Mock
    private JsDatasourceHelper jsDatasourceHelper;
    @Mock
    private DatasourceMetaInfoService datasourceMetaInfoService;
    @Mock
    private DatasourcePluginClient datasourcePluginClient;
    @Mock
    private DatasourceRepository datasourceRepository;
    @Mock
    private ApplicationApiService applicationApiService;

    @InjectMocks
    private DatasourceApiServiceImpl service;

    private final List<String> events = new ArrayList<>();

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static Datasource datasource(String id, String name, String type, DatasourceStatus status) {
        Datasource datasource = new Datasource();
        datasource.setId(id);
        datasource.setName(name);
        datasource.setType(type);
        datasource.setOrganizationId(ORG_ID);
        datasource.setDatasourceStatus(status);
        return datasource;
    }

    private static JsDatasourceConnectionConfig jsConfig(Object extra) {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        if (extra != null) {
            config.put(EXTRA_KEY, extra);
        }
        return config;
    }

    private static BizException denied() {
        return new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    private void stubVisitor() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
    }

    private void stubManagePermission(String datasourceId, boolean granted) {
        stubVisitor();
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(VISITOR_ID, datasourceId, MANAGE_DATASOURCES))
                .thenReturn(granted ? Mono.empty() : Mono.error(denied()));
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.justOrEmpty(value);
        });
    }

    private Mono<Void> loggedVoid(String event) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.empty();
        });
    }

    // ------------------------------------------------------------------ create

    static Stream<Arguments> gids() {
        return Stream.of(Arguments.of((String) null, true), Arguments.of("", true), Arguments.of("given-gid", false));
    }

    /**
     * Catches a datasource created without a gid (a time-ordered UUID is generated for a null or empty gid and a given
     * one is kept) and the order of the steps: the membership check, then the developer check, then the creation with
     * the creator's user id, then the dynamic query config of the created datasource.
     */
    @ParameterizedTest(name = "gid [{0}] generated={1}")
    @MethodSource("gids")
    void create_generatesGidOnlyWhenMissing_andRunsTheStepsInOrder(String gid, boolean generated) {
        Datasource datasource = datasource(null, "ds", SQL_TYPE, DatasourceStatus.NORMAL);
        datasource.setGid(gid);
        stubVisitor();
        when(orgMemberService.getOrgMember(ORG_ID, VISITOR_ID))
                .thenReturn(Mono.just(new OrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, "CURRENT", 0L)));
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(loggedVoid("dev"));
        when(datasourceService.create(datasource, VISITOR_ID)).thenReturn(logged("create", datasource));
        when(jsDatasourceHelper.processDynamicQueryConfig(datasource)).thenReturn(loggedVoid("process"));

        StepVerifier.create(service.create(datasource)).expectNext(datasource).verifyComplete();

        assertThat(events).containsExactly("dev", "create", "process");
        if (generated) {
            assertThat(UUID.fromString(datasource.getGid())).isNotNull();
        } else {
            assertThat(datasource.getGid()).isEqualTo(gid);
        }
        say("create: gid [%s] -> [%s], steps %s", gid, datasource.getGid(), events);
    }

    /**
     * Catches a datasource created in an organization the visitor does not belong to: NOT_AUTHORIZED and neither the
     * developer check nor the creation is subscribed.
     */
    @Test
    void create_visitorNotInTheOrganization_isNotAuthorizedAndCreatesNothing() {
        Datasource datasource = datasource(null, "ds", SQL_TYPE, DatasourceStatus.NORMAL);
        stubVisitor();
        when(orgMemberService.getOrgMember(ORG_ID, VISITOR_ID)).thenReturn(Mono.empty());
        lenient().when(orgDevChecker.checkCurrentOrgDev()).thenReturn(loggedVoid("dev"));
        lenient().when(datasourceService.create(any(), any())).thenReturn(logged("create", datasource));

        StepVerifier.create(service.create(datasource))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();
        assertThat(events).isEmpty();
        say("create: visitor not in org -> NOT_AUTHORIZED, nothing subscribed");
    }

    /**
     * Catches a datasource created by a non-developer: a failing {@code checkCurrentOrgDev} stops the creation.
     */
    @Test
    void create_developerCheckFails_createsNothing() {
        Datasource datasource = datasource(null, "ds", SQL_TYPE, DatasourceStatus.NORMAL);
        stubVisitor();
        when(orgMemberService.getOrgMember(ORG_ID, VISITOR_ID))
                .thenReturn(Mono.just(new OrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, "CURRENT", 0L)));
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(denied()));
        lenient().when(datasourceService.create(any(), any())).thenReturn(logged("create", datasource));

        StepVerifier.create(service.create(datasource))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();
        assertThat(events).isEmpty();
        say("create: developer check failed -> nothing created");
    }

    // ------------------------------------------------------------------ listJsDatasourcePlugins

    private List<Datasource> pluginCandidates() {
        Datasource alpha = datasource("js-a", "Alpha", JS_TYPE, DatasourceStatus.NORMAL);
        alpha.setDetailConfig(jsConfig("secret-a"));
        Datasource beta = datasource("js-b", "beta", OTHER_JS_TYPE, DatasourceStatus.NORMAL);
        beta.setDetailConfig(jsConfig("secret-b"));
        Datasource deleted = datasource("js-deleted", "Alpha deleted", JS_TYPE, DatasourceStatus.DELETED);
        Datasource sql = datasource("sql-1", "Alpha sql", SQL_TYPE, DatasourceStatus.NORMAL);
        return List.of(alpha, beta, deleted, sql);
    }

    private void stubPluginListing() {
        lenient().when(applicationService.findById(APP_ID))
                .thenReturn(Mono.just(Application.builder().id(APP_ID).organizationId(ORG_ID).build()));
        lenient().when(applicationApiService.checkPermissionWithReadableErrorMsg(APP_ID, READ_APPLICATIONS))
                .thenReturn(Mono.just(ResourcePermission.builder().resourceRole(ResourceRole.VIEWER).build()));
        lenient().when(datasourceService.getByOrgId(ORG_ID)).thenAnswer(invocation -> Flux.fromIterable(pluginCandidates()));
        lenient().when(datasourceMetaInfoService.isJsDatasourcePlugin(any())).thenAnswer(invocation ->
                JS_TYPE.equals(invocation.getArgument(0)) || OTHER_JS_TYPE.equals(invocation.getArgument(0)));
        lenient().when(jsDatasourceHelper.processDynamicQueryConfig(any())).thenReturn(Mono.empty());
    }

    static Stream<Arguments> pluginFilters() {
        return Stream.of(
                Arguments.of(null, null, List.of("js-a", "js-b")),
                Arguments.of("ALP", null, List.of("js-a")),
                Arguments.of(null, OTHER_JS_TYPE, List.of("js-b")),
                Arguments.of("alpha", OTHER_JS_TYPE, List.<String>of()),
                Arguments.of("nothing", null, List.<String>of()));
    }

    /**
     * Catches non-JS or deleted datasources in the plugin list, a name filter that is case-sensitive or ignored, a type
     * filter that is ignored, and connection secrets in the response: every listed datasource has its detail config
     * nulled after the dynamic query config was processed.
     */
    @ParameterizedTest(name = "name [{0}] type [{1}] -> {2}")
    @MethodSource("pluginFilters")
    void listJsDatasourcePlugins_listsNormalJsPluginsMatchingTheFilters_withoutTheirConfig(String name, String type,
            List<String> expectedIds) {
        stubPluginListing();

        StepVerifier.create(service.listJsDatasourcePlugins(APP_ID, name, type).collectList())
                .assertNext(list -> {
                    assertThat(list).extracting(Datasource::getId).containsExactlyInAnyOrderElementsOf(expectedIds);
                    assertThat(list).allSatisfy(datasource -> assertThat(datasource.getDetailConfig()).isNull());
                })
                .verifyComplete();
        verify(jsDatasourceHelper, times(expectedIds.size())).processDynamicQueryConfig(any());
        say("listJsDatasourcePlugins name=%s type=%s -> %s", name, type, expectedIds);
    }

    /**
     * Catches the list served to a caller without READ_APPLICATIONS on the application: the permission error propagates
     * and the organization's datasources are never read; an unknown application lists nothing and checks nothing.
     */
    @Test
    void listJsDatasourcePlugins_requiresReadPermissionOnTheApplication() {
        stubPluginListing();
        when(applicationApiService.checkPermissionWithReadableErrorMsg(APP_ID, READ_APPLICATIONS)).thenReturn(Mono.error(denied()));

        StepVerifier.create(service.listJsDatasourcePlugins(APP_ID, null, null))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();
        verify(datasourceService, never()).getByOrgId(any());

        when(applicationService.findById(APP_ID)).thenReturn(Mono.empty());
        StepVerifier.create(service.listJsDatasourcePlugins(APP_ID, null, null)).verifyComplete();
        say("listJsDatasourcePlugins: denied -> error without reading datasources; unknown app -> empty");
    }

    // ------------------------------------------------------------------ listOrgDataSources / listAppDataSources

    private Datasource listed(String id, String name, String type, DatasourceStatus status, String createdBy) {
        Datasource datasource = datasource(id, name, type, status);
        datasource.setCreatedBy(createdBy);
        return datasource;
    }

    private ArgumentCaptor<Collection<String>> stubOrgListing(Map<String, ResourceRole> usable) {
        stubVisitor();
        when(datasourceService.getByOrgId(ORG_ID)).thenAnswer(invocation -> Flux.just(
                listed("d1", "Alpha", SQL_TYPE, DatasourceStatus.NORMAL, "u1"),
                listed("d2", "Beta", SQL_TYPE, DatasourceStatus.NORMAL, "u-unknown"),
                listed("d3", "Gamma", SQL_TYPE, DatasourceStatus.NORMAL, "u1"),
                listed("d4", "Delta", SQL_TYPE, DatasourceStatus.DELETED, "u1"),
                listed("d5", "Epsilon", "pg", DatasourceStatus.NORMAL, "u1")));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> lookedUp = ArgumentCaptor.forClass(Collection.class);
        Map<String, ResourcePermission> permissions = new HashMap<>();
        usable.forEach((id, role) -> permissions.put(id, ResourcePermission.builder().resourceRole(role).build()));
        when(resourcePermissionService.getMaxMatchingPermission(eq(VISITOR_ID), lookedUp.capture(), eq(USE_DATASOURCES)))
                .thenReturn(Mono.just(permissions));
        User creator = new User();
        creator.setId("u1");
        creator.setName("Una");
        lenient().when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u1", creator)));
        lenient().when(datasourceService.removePasswordTypeKeysFromJsDatasourcePluginConfig(any())).thenReturn(Mono.empty());
        lenient().when(jsDatasourceHelper.processDynamicQueryConfig(any())).thenReturn(Mono.empty());
        return lookedUp;
    }

    static Stream<Arguments> orgListingFilters() {
        return Stream.of(
                // name, type, datasource ids looked up for permissions, ids listed
                Arguments.of(null, null, List.of("d1", "d2", "d3", "d5"), List.of("d1", "d2", "d5")),
                Arguments.of("a", null, List.of("d1", "d2", "d3"), List.of("d1", "d2")),
                Arguments.of(null, "pg", List.of("d5"), List.of("d5")),
                Arguments.of("ALPHA", SQL_TYPE, List.of("d1"), List.of("d1")));
    }

    /**
     * Catches a datasource listed to a visitor who may not use it (d3 has no permission), deleted datasources, filters
     * that are wrong (name is case-insensitive "contains", type is equal), a wrong edit flag (only a role that can
     * MANAGE edits), a wrong creator name (null for an unknown creator), and password keys or dynamic config left
     * unprocessed.
     */
    @ParameterizedTest(name = "name [{0}] type [{1}] -> {3}")
    @MethodSource("orgListingFilters")
    void listOrgDataSources_listsOnlyUsableMatchingDatasources_withEditFlagAndCreatorName(String name, String type,
            List<String> lookedUpIds, List<String> listedIds) {
        ArgumentCaptor<Collection<String>> lookedUp = stubOrgListing(Map.of(
                "d1", ResourceRole.OWNER, "d2", ResourceRole.VIEWER, "d5", ResourceRole.VIEWER));

        StepVerifier.create(service.listOrgDataSources(ORG_ID, name, type).collectList())
                .assertNext(views -> {
                    assertThat(views).extracting(view -> view.datasource().getId())
                            .containsExactlyInAnyOrderElementsOf(listedIds);
                    for (DatasourceView view : views) {
                        assertThat(view.edit()).as("edit flag of " + view.datasource().getId())
                                .isEqualTo("d1".equals(view.datasource().getId()));
                        assertThat(view.creatorName()).as("creator of " + view.datasource().getId())
                                .isEqualTo("d2".equals(view.datasource().getId()) ? null : "Una");
                    }
                })
                .verifyComplete();
        assertThat(lookedUp.getValue()).containsExactlyInAnyOrderElementsOf(lookedUpIds);
        verify(datasourceService, times(listedIds.size())).removePasswordTypeKeysFromJsDatasourcePluginConfig(any());
        verify(jsDatasourceHelper, times(listedIds.size())).processDynamicQueryConfig(any());
        say("listOrgDataSources name=%s type=%s: permission lookup %s, listed %s", name, type, lookedUp.getValue(), listedIds);
    }

    /**
     * Catches the application listing using the wrong organization or failing for an unknown application: the
     * datasources of the application's organization are listed (with the same permission filter), an unknown
     * application lists nothing and reads no datasource.
     */
    @Test
    void listAppDataSources_listsTheApplicationsOrganization_andNothingForAnUnknownApplication() {
        stubOrgListing(Map.of("d1", ResourceRole.OWNER, "d2", ResourceRole.VIEWER));
        when(applicationService.findById(APP_ID))
                .thenReturn(Mono.just(Application.builder().id(APP_ID).organizationId(ORG_ID).build()));

        StepVerifier.create(service.listAppDataSources(APP_ID, "alpha", null).collectList())
                .assertNext(views -> assertThat(views).extracting(view -> view.datasource().getId()).containsExactly("d1"))
                .verifyComplete();

        when(applicationService.findById("unknown")).thenReturn(Mono.empty());
        StepVerifier.create(service.listAppDataSources("unknown", null, null)).verifyComplete();
        verify(datasourceService, times(1)).getByOrgId(any());
        say("listAppDataSources: application org listed, unknown application -> empty");
    }

    // ------------------------------------------------------------------ update

    /**
     * Catches an update without an id passing on to the service: INVALID_PARAMETER with {@code FieldName.ID} as the
     * argument, and neither the session nor the datasource service is touched.
     */
    @Test
    void update_nullId_isInvalidParameter() {
        StepVerifier.create(service.update(null, new Datasource()))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.INVALID_PARAMETER, "INVALID_PARAMETER");
                    assertThat(((BizException) error).getArgs()).containsExactly(FieldName.ID);
                })
                .verify();
        verifyNoInteractions(sessionUserService, datasourceService, resourcePermissionService);
        say("update: null id -> INVALID_PARAMETER [%s]", FieldName.ID);
    }

    // ------------------------------------------------------------------ MANAGE_DATASOURCES gate

    enum ManageOperation {
        UPDATE("update"), FIND("getById"), DELETE("delete"), TEST("test"), GRANT("getById");

        final String firstEvent;

        ManageOperation(String firstEvent) {
            this.firstEvent = firstEvent;
        }
    }

    private Datasource payload() {
        return datasource(DS_ID, "payload", SQL_TYPE, DatasourceStatus.NORMAL);
    }

    private Mono<?> invoke(ManageOperation operation, Datasource stored, DatasourceTestResult testResult) {
        return switch (operation) {
            case UPDATE -> service.update(DS_ID, stored);
            case FIND -> service.findByIdWithPermission(DS_ID);
            case DELETE -> service.delete(DS_ID);
            case TEST -> service.testDatasource(stored);
            case GRANT -> service.grantPermission(DS_ID, Set.of("user-1"), null, ResourceRole.VIEWER);
        };
    }

    /**
     * Catches mutate-before-authorise on datasources: a visitor without MANAGE_DATASOURCES gets the permission error for
     * update, findByIdWithPermission, delete, testDatasource (of a stored datasource) and grantPermission, and no
     * datasource service Mono is subscribed; a visitor with it gets the service's result.
     */
    @ParameterizedTest(name = "{0} granted={1}")
    @MethodSource("manageOperations")
    void manageOperation_requiresManageDatasourcesPermission(ManageOperation operation, boolean granted) {
        Datasource stored = payload();
        DatasourceTestResult testResult = DatasourceTestResult.testSuccess();
        stubManagePermission(DS_ID, granted);
        lenient().when(datasourceService.update(DS_ID, stored)).thenReturn(logged("update", stored));
        lenient().when(datasourceService.getById(DS_ID)).thenReturn(logged("getById", stored));
        lenient().when(datasourceService.delete(DS_ID)).thenReturn(logged("delete", true));
        lenient().when(datasourceService.testDatasource(stored)).thenReturn(logged("test", testResult));
        lenient().when(resourcePermissionService.insertBatchPermission(ResourceType.DATASOURCE, DS_ID, Set.of("user-1"), null,
                ResourceRole.VIEWER)).thenReturn(loggedVoid("insert"));

        @SuppressWarnings("unchecked")
        Mono<Object> result = (Mono<Object>) invoke(operation, stored, testResult);

        if (granted) {
            Object expected = switch (operation) {
                case UPDATE, FIND -> stored;
                case DELETE, GRANT -> true;
                case TEST -> testResult;
            };
            StepVerifier.create(result).expectNext(expected).verifyComplete();
            assertThat(events).first().isEqualTo(operation.firstEvent);
        } else {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                    .verify();
            assertThat(events).isEmpty();
        }
        say("%s, MANAGE_DATASOURCES granted=%s -> events %s", operation, granted, events);
    }

    static Stream<Arguments> manageOperations() {
        List<Arguments> args = new ArrayList<>();
        for (ManageOperation operation : ManageOperation.values()) {
            args.add(Arguments.of(operation, false));
            args.add(Arguments.of(operation, true));
        }
        return args.stream();
    }

    /**
     * Pins today's behaviour: a datasource without an id (a config the caller supplies and has not saved yet) is tested
     * with no permission check at all; the MANAGE_DATASOURCES check applies only to a stored datasource (see
     * {@link #manageOperation_requiresManageDatasourcesPermission}).
     */
    @Test
    void testDatasource_withoutId_isTestedWithoutAPermissionCheck() {
        Datasource unsaved = datasource(null, "unsaved", SQL_TYPE, DatasourceStatus.NORMAL);
        DatasourceTestResult result = DatasourceTestResult.testSuccess();
        when(datasourceService.testDatasource(unsaved)).thenReturn(Mono.just(result));

        StepVerifier.create(service.testDatasource(unsaved)).expectNext(result).verifyComplete();

        verifyNoInteractions(resourcePermissionService, sessionUserService);
        say("testDatasource: unsaved datasource tested without a permission check");
    }

    // ------------------------------------------------------------------ getPermissions

    /**
     * Catches the permission dialog leaking to a visitor without MANAGE_DATASOURCES (no organization, group or user
     * permission data is read after the refusal) and an unknown datasource being reported as anything but a
     * ServerException (and checked for permission at all).
     */
    @Test
    void getPermissions_unknownDatasourceAndDeniedVisitor_failWithoutReadingPermissionData() {
        lenient().when(resourcePermissionService.getByDataSourceId(DS_ID)).thenReturn(Mono.just(List.of()));
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.empty());

        StepVerifier.create(service.getPermissions(DS_ID))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(ServerException.class);
                    assertThat(error.getMessage()).isEqualTo("data source not exist. " + DS_ID);
                })
                .verify();
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(any(), any(), any());

        stubManagePermission(DS_ID, false);
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.just(payload()));
        StepVerifier.create(service.getPermissions(DS_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();
        verify(organizationService, never()).getById(any());
        verifyNoInteractions(permissionHelper);
        say("getPermissions: unknown datasource -> ServerException, denied visitor -> NOT_AUTHORIZED, nothing read");
    }

    /**
     * Catches a wrong permission dialog: the group and user permissions come from the helper for the datasource's
     * permission rows, the creator is the datasource's creator and the organization name is the datasource
     * organization's.
     */
    @Test
    void getPermissions_permittedVisitor_getsGroupsUsersCreatorAndOrganizationName() {
        stubManagePermission(DS_ID, true);
        Datasource stored = payload();
        stored.setCreatedBy("creator-1");
        List<ResourcePermission> rows = List.of(ResourcePermission.builder().resourceType(ResourceType.DATASOURCE).resourceId(DS_ID).build());
        PermissionItemView group = PermissionItemView.builder().id("group-1").role("viewer").build();
        PermissionItemView user = PermissionItemView.builder().id("user-1").role("owner").build();
        when(resourcePermissionService.getByDataSourceId(DS_ID)).thenReturn(Mono.just(rows));
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.just(stored));
        when(permissionHelper.getGroupPermissions(rows)).thenReturn(Mono.just(List.of(group)));
        when(permissionHelper.getUserPermissions(rows)).thenReturn(Mono.just(List.of(user)));
        Organization organization = new Organization();
        organization.setName("Org One");
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(organization));

        StepVerifier.create(service.getPermissions(DS_ID))
                .assertNext(view -> {
                    assertThat(view.getGroupPermissions()).containsExactly(group);
                    assertThat(view.getUserPermissions()).containsExactly(user);
                    assertThat(view.getCreatorId()).isEqualTo("creator-1");
                    assertThat(view.getOrgName()).isEqualTo("Org One");
                })
                .verifyComplete();
        say("getPermissions: view with 1 group, 1 user, creator creator-1, org Org One");
    }

    // ------------------------------------------------------------------ grantPermission

    static Stream<Arguments> emptyTargets() {
        return Stream.of(
                Arguments.of((Set<String>) null, (Set<String>) null),
                Arguments.of(Set.<String>of(), (Set<String>) null),
                Arguments.of((Set<String>) null, Set.<String>of()),
                Arguments.of(Set.<String>of(), Set.<String>of()));
    }

    /**
     * Catches grants demanding MANAGE_DATASOURCES for a request with no target: with null or empty users and groups the
     * call is a no-op returning true, with no session, permission, datasource or insert call.
     */
    @ParameterizedTest(name = "users {0} groups {1}")
    @MethodSource("emptyTargets")
    void grantPermission_withoutTargets_isANoOpReturningTrue(Set<String> userIds, Set<String> groupIds) {
        StepVerifier.create(service.grantPermission(DS_ID, userIds, groupIds, ResourceRole.OWNER)).expectNext(true).verifyComplete();

        verifyNoInteractions(sessionUserService, resourcePermissionService, datasourceService);
        say("grantPermission: users=%s groups=%s -> true, nothing called", userIds, groupIds);
    }

    static Stream<Arguments> grantTargets() {
        return Stream.of(
                Arguments.of(Set.of("user-1"), (Set<String>) null),
                Arguments.of((Set<String>) null, Set.of("group-1")),
                Arguments.of(Set.of("user-1"), Set.of("group-1")));
    }

    /**
     * Catches grants silently dropped for a request with only users or only groups, and a wrong batch: the permissions
     * are inserted for {@code (DATASOURCE, datasourceId, users, groups, role)} and the result is true.
     */
    @ParameterizedTest(name = "users {0} groups {1}")
    @MethodSource("grantTargets")
    void grantPermission_insertsTheBatchForTheDatasource(Set<String> userIds, Set<String> groupIds) {
        stubManagePermission(DS_ID, true);
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.just(payload()));
        when(resourcePermissionService.insertBatchPermission(ResourceType.DATASOURCE, DS_ID, userIds, groupIds, ResourceRole.OWNER))
                .thenReturn(loggedVoid("insert"));

        StepVerifier.create(service.grantPermission(DS_ID, userIds, groupIds, ResourceRole.OWNER)).expectNext(true).verifyComplete();

        assertThat(events).containsExactly("insert");
        say("grantPermission: users=%s groups=%s inserted as OWNER", userIds, groupIds);
    }

    /**
     * Catches a grant on a datasource that does not exist: DATASOURCE_NOT_FOUND with the id as argument and nothing
     * inserted.
     */
    @Test
    void grantPermission_unknownDatasource_isDatasourceNotFound() {
        stubManagePermission(DS_ID, true);
        when(datasourceService.getById(DS_ID)).thenReturn(Mono.empty());
        lenient().when(resourcePermissionService.insertBatchPermission(any(), any(), any(), any(), any())).thenReturn(loggedVoid("insert"));

        StepVerifier.create(service.grantPermission(DS_ID, Set.of("user-1"), null, ResourceRole.OWNER))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND");
                    assertThat(((BizException) error).getArgs()).containsExactly(DS_ID);
                })
                .verify();
        assertThat(events).isEmpty();
        say("grantPermission: unknown datasource -> DATASOURCE_NOT_FOUND [%s], nothing inserted", DS_ID);
    }

    /**
     * Catches a role that does not exist for datasources written to the permission table: only the roles of
     * MANAGE_DATASOURCES (owner) and USE_DATASOURCES (viewer) are grantable; any other role is a ServerException and
     * nothing is inserted. The same rule guards {@code updatePermission}.
     */
    @ParameterizedTest(name = "role {0}")
    @EnumSource(ResourceRole.class)
    void grantPermission_onlyTheManageAndUseRolesAreGrantable(ResourceRole role) {
        boolean allowed = role == ResourceRole.OWNER || role == ResourceRole.VIEWER;
        stubManagePermission(DS_ID, true);
        lenient().when(datasourceService.getById(DS_ID)).thenReturn(Mono.just(payload()));
        lenient().when(resourcePermissionService.insertBatchPermission(ResourceType.DATASOURCE, DS_ID, Set.of("user-1"), null, role))
                .thenReturn(loggedVoid("insert"));

        Mono<Boolean> result = service.grantPermission(DS_ID, Set.of("user-1"), null, role);

        if (allowed) {
            StepVerifier.create(result).expectNext(true).verifyComplete();
            assertThat(events).containsExactly("insert");
        } else {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> {
                        assertThat(error).isInstanceOf(ServerException.class);
                        assertThat(error.getMessage()).isEqualTo("error role for datasource. " + role);
                    })
                    .verify();
            assertThat(events).isEmpty();
        }
        say("grantPermission: role %s -> allowed=%s", role, allowed);
    }

    // ------------------------------------------------------------------ updatePermission / deletePermission

    enum PermissionChange {
        UPDATE, DELETE
    }

    private ResourcePermission permissionRow(ResourceType type) {
        return ResourcePermission.builder().id(PERMISSION_ID).resourceType(type).resourceId(DS_ID).build();
    }

    private Mono<Boolean> change(PermissionChange change, ResourceRole role) {
        return change == PermissionChange.UPDATE ? service.updatePermission(PERMISSION_ID, role) : service.deletePermission(PERMISSION_ID);
    }

    private void stubPermissionMutations() {
        lenient().when(resourcePermissionService.updateRoleById(eq(PERMISSION_ID), any())).thenReturn(logged("updateRole", true));
        lenient().when(resourcePermissionService.removeById(PERMISSION_ID)).thenReturn(logged("remove", true));
    }

    static Stream<Arguments> permissionChangesByType() {
        List<Arguments> args = new ArrayList<>();
        for (PermissionChange change : PermissionChange.values()) {
            for (ResourceType type : ResourceType.values()) {
                args.add(Arguments.of(change, type));
            }
        }
        return args.stream();
    }

    /**
     * Regression test of correct behaviour (not a defect pin): a permission row of another resource type (application,
     * folder, bundle) cannot be updated or removed through the datasource endpoints; the ServerException "resource type
     * should be datasource" is raised before any permission check and the update/remove is never subscribed. A datasource
     * permission is changed or removed once.
     */
    @ParameterizedTest(name = "{0} of a {1} permission")
    @MethodSource("permissionChangesByType")
    void permissionChange_refusesPermissionsOfOtherResourceTypes(PermissionChange change, ResourceType type) {
        stubManagePermission(DS_ID, true);
        stubPermissionMutations();
        when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(Mono.just(permissionRow(type)));

        Mono<Boolean> result = change(change, ResourceRole.OWNER);

        if (type == ResourceType.DATASOURCE) {
            StepVerifier.create(result).expectNext(true).verifyComplete();
            assertThat(events).containsExactly(change == PermissionChange.UPDATE ? "updateRole" : "remove");
        } else {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> {
                        assertThat(error).isInstanceOf(ServerException.class);
                        assertThat(error.getMessage()).isEqualTo("resource type should be datasource. " + PERMISSION_ID);
                    })
                    .verify();
            assertThat(events).isEmpty();
            verify(resourcePermissionService, never()).checkResourcePermissionWithError(any(), any(), any());
        }
        say("%s of a %s permission -> events %s", change, type, events);
    }

    /**
     * Catches a change of a permission that does not exist reaching the mutation (ServerException "permission not
     * exist") and a MANAGE check made against the wrong id: the check is made on the permission row's datasource, and a
     * visitor without it changes nothing.
     */
    @ParameterizedTest
    @EnumSource(PermissionChange.class)
    void permissionChange_unknownPermissionOrDeniedVisitor_changesNothing(PermissionChange change) {
        stubPermissionMutations();
        when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(Mono.empty());
        StepVerifier.create(change(change, ResourceRole.OWNER))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(ServerException.class);
                    assertThat(error.getMessage()).isEqualTo("permission not exist. " + PERMISSION_ID);
                })
                .verify();
        verifyNoInteractions(sessionUserService);

        stubManagePermission(DS_ID, false);
        when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(Mono.just(permissionRow(ResourceType.DATASOURCE)));
        StepVerifier.create(change(change, ResourceRole.OWNER))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();
        assertThat(events).isEmpty();
        say("%s: unknown permission -> ServerException, denied visitor -> NOT_AUTHORIZED, nothing changed", change);
    }

    /**
     * Catches an update to a role that does not exist for datasources: for a permitted visitor and a datasource
     * permission, a role other than owner or viewer is a ServerException and the role is not updated.
     */
    @Test
    void updatePermission_invalidRole_isRejectedAndChangesNothing() {
        stubManagePermission(DS_ID, true);
        stubPermissionMutations();
        when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(Mono.just(permissionRow(ResourceType.DATASOURCE)));

        StepVerifier.create(service.updatePermission(PERMISSION_ID, ResourceRole.EDITOR))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(ServerException.class);
                    assertThat(error.getMessage()).isEqualTo("error role for datasource. " + ResourceRole.EDITOR);
                })
                .verify();
        assertThat(events).isEmpty();
        say("updatePermission: role EDITOR rejected, nothing updated");
    }

    // ------------------------------------------------------------------ getPluginDynamicConfig

    private static GetPluginDynamicConfigRequestDTO dto(String datasourceId, Map<String, Object> config) {
        return GetPluginDynamicConfigRequestDTO.builder().dataSourceId(datasourceId).dataSourceConfig(config).build();
    }

    /**
     * Catches an empty request reaching the repository or the plugin client: null or an empty list answers an empty
     * list.
     */
    @ParameterizedTest
    @NullSource
    @ValueSource(strings = "empty")
    void getPluginDynamicConfig_emptyRequest_returnsAnEmptyList(String marker) {
        List<GetPluginDynamicConfigRequestDTO> request = marker == null ? null : List.of();

        StepVerifier.create(service.getPluginDynamicConfig(request)).expectNext(List.of()).verifyComplete();

        verifyNoInteractions(datasourceRepository, datasourcePluginClient);
        say("getPluginDynamicConfig: %s request -> empty list", marker == null ? "null" : "empty");
    }

    /**
     * Catches a lookup of datasources for requests that name none: when every datasource id is null, empty or blank the
     * requests go straight to the plugin client unchanged and the repository is not asked.
     */
    @Test
    void getPluginDynamicConfig_noDatasourceIds_goesStraightToThePluginClient() {
        List<GetPluginDynamicConfigRequestDTO> request = List.of(dto(null, new HashMap<>()), dto("", new HashMap<>()), dto("  ", new HashMap<>()));
        when(datasourcePluginClient.getPluginDynamicConfig(request)).thenReturn(Mono.just(List.of("result")));

        StepVerifier.create(service.getPluginDynamicConfig(request)).expectNext(List.of("result")).verifyComplete();

        verifyNoInteractions(datasourceRepository, sessionUserService, resourcePermissionService);
        request.forEach(item -> assertThat(item.getDataSourceConfig()).doesNotContainKey(EXTRA_KEY));
        say("getPluginDynamicConfig: only blank datasource ids -> forwarded unchanged");
    }

    private Datasource stored(String id, String type, DatasourceConnectionConfig config) {
        Datasource datasource = datasource(id, id, type, DatasourceStatus.NORMAL);
        datasource.setDetailConfig(config);
        return datasource;
    }

    /**
     * The visitor may manage exactly {@code manageable}, and the single-id permission lookup answers that, as the real
     * handler does for one id (it resolves the organization of that id). The batched lookups answer every asked id as
     * granted, as the real handler does for an admin of the organization of the first id: a batched check would let
     * every other id through. Returns the ids the single-id lookup was asked for, in order.
     */
    private List<String> stubManageableDatasources(String... manageable) {
        stubVisitor();
        Set<String> granted = Set.of(manageable);
        List<String> askedIds = new ArrayList<>();
        lenient().when(resourcePermissionService.getMaxMatchingPermission(eq(VISITOR_ID), any(String.class), eq(MANAGE_DATASOURCES)))
                .thenAnswer(invocation -> {
                    String datasourceId = invocation.getArgument(1);
                    askedIds.add(datasourceId);
                    return granted.contains(datasourceId)
                           ? Mono.just(ResourcePermission.builder().resourceId(datasourceId).resourceRole(ResourceRole.OWNER).build())
                           : Mono.empty();
                });
        lenient().when(resourcePermissionService.filterResourceWithPermission(eq(VISITOR_ID), anyCollection(), eq(MANAGE_DATASOURCES)))
                .thenAnswer(invocation -> Flux.fromIterable(invocation.<Collection<String>>getArgument(1)));
        lenient().when(resourcePermissionService.getMaxMatchingPermission(eq(VISITOR_ID), anyCollection(), eq(MANAGE_DATASOURCES)))
                .thenAnswer(invocation -> Flux.fromIterable(invocation.<Collection<String>>getArgument(1))
                        .collectMap(id -> id, id -> ResourcePermission.builder().resourceId(id).resourceRole(ResourceRole.OWNER).build()));
        return askedIds;
    }

    /** The repository answers, from {@code stored}, the datasources whose id it is asked for, as {@code findAllById} does. */
    private ArgumentCaptor<Iterable<String>> stubRepository(Datasource... stored) {
        Map<String, Datasource> byId = new HashMap<>();
        for (Datasource datasource : stored) {
            byId.put(datasource.getId(), datasource);
        }
        ArgumentCaptor<Iterable<String>> askedIds = ArgumentCaptor.forClass(Iterable.class);
        when(datasourceRepository.findAllById(askedIds.capture())).thenAnswer(invocation ->
                Flux.fromIterable(invocation.<Iterable<String>>getArgument(0)).mapNotNull(byId::get));
        return askedIds;
    }

    /**
     * Catches the wrong plugin config being forwarded: {@code extra} is taken only from JS-plugin datasources whose
     * config is a JS connection config with a non-null extra; each request with a non-blank datasource id gets the
     * {@code extra} key (null when its datasource supplied none), a request with a blank id is untouched, and the plugin
     * client is called after the injection with the same requests and its result is returned. The visitor may manage
     * every stored datasource here; the permission is asked once for every non-blank id and the repository only for the
     * ids it let through.
     */
    @Test
    void getPluginDynamicConfig_injectsExtraOfJsDatasourcesOnly_beforeCallingThePluginClient() {
        GetPluginDynamicConfigRequestDTO withExtra = dto("js-with-extra", new HashMap<>(Map.of("k", "v")));
        GetPluginDynamicConfigRequestDTO withoutExtra = dto("js-without-extra", new HashMap<>());
        GetPluginDynamicConfigRequestDTO nonJs = dto("sql-with-extra", new HashMap<>());
        GetPluginDynamicConfigRequestDTO notJsConfig = dto("js-with-other-config", new HashMap<>());
        GetPluginDynamicConfigRequestDTO unknown = dto("unknown-id", new HashMap<>());
        GetPluginDynamicConfigRequestDTO blank = dto(" ", new HashMap<>());
        List<GetPluginDynamicConfigRequestDTO> request = List.of(withExtra, withoutExtra, nonJs, notJsConfig, unknown, blank);
        when(datasourceMetaInfoService.isJsDatasourcePlugin(any())).thenAnswer(invocation ->
                JS_TYPE.equals(invocation.getArgument(0)));
        List<String> permissionAskedIds = stubManageableDatasources("js-with-extra", "js-without-extra", "sql-with-extra",
                "js-with-other-config");
        ArgumentCaptor<Iterable<String>> askedIds = stubRepository(
                stored("js-with-extra", JS_TYPE, jsConfig("EXTRA")),
                stored("js-without-extra", JS_TYPE, jsConfig(null)),
                stored("sql-with-extra", SQL_TYPE, jsConfig("NOT-FOR-SQL")),
                stored("js-with-other-config", JS_TYPE, org.mockito.Mockito.mock(DatasourceConnectionConfig.class)));
        AtomicReference<Map<String, Object>> configAtClientCall = new AtomicReference<>();
        when(datasourcePluginClient.getPluginDynamicConfig(request)).thenReturn(Mono.defer(() -> {
            configAtClientCall.set(new HashMap<>(withExtra.getDataSourceConfig()));
            return Mono.just(List.<Object>of("client-result"));
        }));

        StepVerifier.create(service.getPluginDynamicConfig(request)).expectNext(List.of("client-result")).verifyComplete();

        assertThat(permissionAskedIds).containsExactlyInAnyOrder("js-with-extra", "js-without-extra", "sql-with-extra",
                "js-with-other-config", "unknown-id");
        assertThat(askedIds.getValue()).containsExactlyInAnyOrder("js-with-extra", "js-without-extra", "sql-with-extra",
                "js-with-other-config");
        assertThat(configAtClientCall.get()).containsEntry("k", "v").containsEntry(EXTRA_KEY, "EXTRA");
        assertThat(withoutExtra.getDataSourceConfig()).containsKey(EXTRA_KEY).containsEntry(EXTRA_KEY, null);
        assertThat(nonJs.getDataSourceConfig()).containsKey(EXTRA_KEY).containsEntry(EXTRA_KEY, null);
        assertThat(notJsConfig.getDataSourceConfig()).containsKey(EXTRA_KEY).containsEntry(EXTRA_KEY, null);
        assertThat(unknown.getDataSourceConfig()).containsKey(EXTRA_KEY).containsEntry(EXTRA_KEY, null);
        assertThat(blank.getDataSourceConfig()).doesNotContainKey(EXTRA_KEY);
        say("getPluginDynamicConfig: extra injected for the JS datasource only, client called after the injection");
    }

    /**
     * Catches another datasource's {@code extra} reaching the plugin service (BF-019, formerly pinned as "loads the
     * requested datasource ids ... with no permission or organization check"): the visitor may not manage the requested
     * JS datasource, so the repository is not asked at all, the request is forwarded with a null {@code extra}, and no
     * error is raised (it is treated like an unknown id). Which organization the datasource is in is decided by the
     * permission lookup of that id (the real handler resolves it from the datasource), so it is not modelled here.
     */
    @Test
    void getPluginDynamicConfig_datasourceTheVisitorMayNotManage_givesNoExtraAndIsNotLoaded() {
        Datasource notManageable = stored("not-manageable-js", JS_TYPE, jsConfig("FOREIGN-EXTRA"));
        notManageable.setOrganizationId(OTHER_ORG_ID);
        GetPluginDynamicConfigRequestDTO request = dto("not-manageable-js", new HashMap<>());
        lenient().when(datasourceMetaInfoService.isJsDatasourcePlugin(JS_TYPE)).thenReturn(true);
        List<String> permissionAskedIds = stubManageableDatasources();
        lenient().when(datasourceRepository.findAllById(any())).thenReturn(Flux.just(notManageable));
        when(datasourcePluginClient.getPluginDynamicConfig(List.of(request))).thenReturn(Mono.just(List.of()));

        StepVerifier.create(service.getPluginDynamicConfig(List.of(request))).expectNext(List.of()).verifyComplete();

        assertThat(request.getDataSourceConfig()).containsKey(EXTRA_KEY).containsEntry(EXTRA_KEY, null);
        verify(datasourceRepository, never()).findAllById(any());
        assertThat(permissionAskedIds).containsExactly("not-manageable-js");
        say("getPluginDynamicConfig: datasource the visitor may not manage -> not loaded, extra null");
    }

    /**
     * Catches the permission being checked for the whole request instead of for each datasource (a batched lookup grants
     * an admin of the first id's organization every id): of two JS datasources only the one the visitor may manage gives
     * its {@code extra}; the other request gets a null one. Both orders are run, so neither id is always the first.
     */
    @ParameterizedTest(name = "[{index}] manageable first: {0}")
    @ValueSource(booleans = {true, false})
    void getPluginDynamicConfig_mixedRequest_onlyTheManageableDatasourceGivesItsExtra(boolean manageableFirst) {
        Datasource manageable = stored("manageable-js", JS_TYPE, jsConfig("OWN-EXTRA"));
        Datasource foreign = stored("foreign-js", JS_TYPE, jsConfig("FOREIGN-EXTRA"));
        foreign.setOrganizationId(OTHER_ORG_ID);
        GetPluginDynamicConfigRequestDTO own = dto("manageable-js", new HashMap<>());
        GetPluginDynamicConfigRequestDTO other = dto("foreign-js", new HashMap<>());
        when(datasourceMetaInfoService.isJsDatasourcePlugin(JS_TYPE)).thenReturn(true);
        List<String> permissionAskedIds = stubManageableDatasources("manageable-js");
        ArgumentCaptor<Iterable<String>> repositoryAskedIds = stubRepository(manageable, foreign);
        List<GetPluginDynamicConfigRequestDTO> request = manageableFirst ? List.of(own, other) : List.of(other, own);
        when(datasourcePluginClient.getPluginDynamicConfig(request)).thenReturn(Mono.just(List.of("result")));

        StepVerifier.create(service.getPluginDynamicConfig(request)).expectNext(List.of("result")).verifyComplete();

        assertThat(other.getDataSourceConfig()).containsKey(EXTRA_KEY).containsEntry(EXTRA_KEY, null);
        assertThat(own.getDataSourceConfig()).containsEntry(EXTRA_KEY, "OWN-EXTRA");
        assertThat(repositoryAskedIds.getValue()).containsExactly("manageable-js");
        assertThat(permissionAskedIds).containsExactlyInAnyOrder("manageable-js", "foreign-js");
        say("getPluginDynamicConfig: mixed request (manageable first: %s) -> extra of the manageable datasource only",
                manageableFirst);
    }

    /**
     * Catches a failed visitor or permission lookup being forwarded anyway: the error is returned, and neither the
     * repository nor the plugin client is subscribed.
     */
    @ParameterizedTest(name = "[{index}] {0} fails")
    @ValueSource(strings = {"visitor", "permission"})
    void getPluginDynamicConfig_lookupFails_errorIsReturnedAndNothingIsForwarded(String failing) {
        GetPluginDynamicConfigRequestDTO request = dto("js-1", new HashMap<>());
        BizException failure = denied();
        if ("visitor".equals(failing)) {
            when(sessionUserService.getVisitorId()).thenReturn(Mono.error(failure));
        } else {
            stubVisitor();
            when(resourcePermissionService.getMaxMatchingPermission(eq(VISITOR_ID), any(String.class), eq(MANAGE_DATASOURCES)))
                    .thenReturn(Mono.error(failure));
        }
        lenient().when(datasourceRepository.findAllById(any())).thenReturn(Flux.defer(() -> {
            events.add("repository");
            return Flux.empty();
        }));
        lenient().when(datasourcePluginClient.getPluginDynamicConfig(any())).thenReturn(logged("plugin client", List.of()));

        StepVerifier.create(service.getPluginDynamicConfig(List.of(request))).expectErrorMatches(failure::equals).verify();

        assertThat(events).isEmpty();
        assertThat(request.getDataSourceConfig()).doesNotContainKey(EXTRA_KEY);
        say("getPluginDynamicConfig: %s lookup fails -> error returned, nothing loaded or forwarded", failing);
    }

    /**
     * Pins the second symptom of the same plan section 9 row: a request with a datasource id and a null
     * {@code dataSourceConfig} makes the injection throw a NullPointerException, and the plugin client is never called.
     * A fix changes this test on purpose.
     */
    @Test
    void getPluginDynamicConfig_nullDataSourceConfig_throwsNullPointerException_pinsDefect() {
        GetPluginDynamicConfigRequestDTO request = dto("js-1", null);
        when(datasourceMetaInfoService.isJsDatasourcePlugin(JS_TYPE)).thenReturn(true);
        stubManageableDatasources("js-1");
        stubRepository(stored("js-1", JS_TYPE, jsConfig("E")));
        lenient().when(datasourcePluginClient.getPluginDynamicConfig(any())).thenReturn(Mono.just(List.of()));

        StepVerifier.create(service.getPluginDynamicConfig(List.of(request)))
                .expectError(NullPointerException.class)
                .verify();
        say("getPluginDynamicConfig: null dataSourceConfig with an id -> NullPointerException (section 9 defect pinned)");
    }
}

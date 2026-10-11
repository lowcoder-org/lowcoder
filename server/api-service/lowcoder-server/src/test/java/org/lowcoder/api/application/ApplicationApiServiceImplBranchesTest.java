package org.lowcoder.api.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.usermanagement.GroupApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.service.ApplicationHistorySnapshotService;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.folder.model.FolderElement;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.interaction.UserApplicationInteractionService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.permission.solution.SuggestAppAdminSolutionService;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.lowcoder.domain.template.model.Template;
import org.lowcoder.domain.template.service.TemplateService;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Branch tests of {@link ApplicationApiServiceImpl} with every collaborator mocked: the request-type gate of the
 * published view, the DSL sanitising of published and module DSL, the readable permission errors, the update and
 * datasource-permission checks and the small guards around them. The Spring tests of this class
 * ({@code ApplicationApiServiceTest}, {@code ApplicationApiServiceIntegrationTest}) run the happy paths with the real
 * services.
 *
 * <p>Split with L3-12 (plan section 6.5): {@code ApplicationService}, {@code ApplicationRecordService} and the other
 * domain services are mocked here, so no {@code ApplicationServiceImpl} or {@code BundleServiceImpl} code runs; the
 * dependent-module expansion is only stubbed. Lines {@code :539-541} (the catch of the 5 second {@code block}) stay
 * uncovered on purpose: they need a timeout, and a 5 second test is not worth it.
 *
 * <p>Pinned production defects (owner decision D-6: fixes are deferred, a fix changes these tests on purpose):
 * <ul>
 * <li>plan section 9 row "ApplicationApiServiceImpl.getEditingApplication skips the edit-permission check for an app
 * that is public to all and to the marketplace, and that read also writes the application", see
 * {@link #getEditingApplication_publicMarketplaceApp_skipsTheEditPermissionCheckAndWritesTheApplication}.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class ApplicationApiServiceImplBranchesTest {

    private static final String LOG_PREFIX = "[ApplicationApiServiceImplBranchesTest] ";

    private static final String APP_ID = "app-1";
    private static final String MODULE_ID = "module-1";
    private static final String ORG_ID = "org-1";
    private static final String REQUEST_ORG_ID = "request-org";
    private static final String VISITOR_ID = "visitor-1";
    private static final String FOLDER_ID = "folder-1";
    private static final String TEMPLATE_ID = "template-1";
    private static final String ADMIN_NAMES = "alice, bob";
    private static final String ORG_ID_HEADER = "X-ORG-ID";
    private static final Instant CREATED_AT = Instant.ofEpochMilli(1_000L);
    private static final long PUBLISHED_AT_MILLIS = 1_700_000_000_000L;

    private static final String MSG_BAD_REQUEST = "BAD_REQUEST";
    private static final String MSG_ORG_ID_EMPTY = "ORG_ID_EMPTY";
    private static final String MSG_APP_NAME_EMPTY = "APP_NAME_EMPTY";
    private static final String MSG_NOT_SIGNED_IN = "USER_NOT_SIGNED_IN";
    private static final String MSG_INSUFFICIENT = "INSUFFICIENT_PERMISSION";
    private static final String MSG_NO_EDIT = "NO_PERMISSION_TO_EDIT";
    private static final String MSG_NO_VIEW = "NO_PERMISSION_TO_VIEW";
    private static final String MSG_LACK_OF_DATASOURCE = "APPLICATION_EDIT_ERROR_LACK_OF_DATASOURCE_PERMISSIONS";

    @Mock
    private ApplicationService applicationService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private OrgMemberService orgMemberService;
    @Mock
    private OrganizationService organizationService;
    @Mock
    private AbstractBizThresholdChecker bizThresholdChecker;
    @Mock
    private OrgDevChecker orgDevChecker;
    @Mock
    private TemplateSolutionService templateSolutionService;
    @Mock
    private SuggestAppAdminSolutionService suggestAppAdminSolutionService;
    @Mock
    private FolderApiService folderApiService;
    @Mock
    private UserHomeApiService userHomeApiService;
    @Mock
    private UserApplicationInteractionService userApplicationInteractionService;
    @Mock
    private DatasourceMetaInfoService datasourceMetaInfoService;
    @Mock
    private CompoundApplicationDslFilter compoundApplicationDslFilter;
    @Mock
    private TemplateService templateService;
    @Mock
    private PermissionHelper permissionHelper;
    @Mock
    private DatasourceService datasourceService;
    @Mock
    private ApplicationHistorySnapshotService applicationHistorySnapshotService;
    @Mock
    private ApplicationRecordService applicationRecordService;
    @Mock
    private FolderElementRelationService folderElementRelationService;
    @Mock
    private GroupApiService groupApiService;
    @Mock
    private OrgApiService orgApiService;

    @InjectMocks
    private ApplicationApiServiceImpl service;

    private final List<String> events = new ArrayList<>();

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).isEqualTo(expected);
        assertThat(biz.getMessageKey()).isEqualTo(messageKey);
    }

    private static Map<String, Object> dsl(Object... keysAndValues) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keysAndValues.length; i += 2) {
            map.put((String) keysAndValues[i], keysAndValues[i + 1]);
        }
        return map;
    }

    private static List<Object> list(Object... items) {
        return new ArrayList<>(List.of(items));
    }

    private static Application.ApplicationBuilder<?, ?> appBuilder(String id, Map<String, Object> dsl) {
        return Application.builder()
                .id(id)
                .gid("gid-" + id)
                .organizationId(ORG_ID)
                .name("App " + id)
                .applicationType(ApplicationType.APPLICATION.getValue())
                .applicationStatus(ApplicationStatus.NORMAL)
                .editingApplicationDSL(dsl)
                .createdAt(CREATED_AT);
    }

    private static Application app(Map<String, Object> dsl) {
        return appBuilder(APP_ID, dsl).build();
    }

    private static ResourcePermission permission(ResourceRole role) {
        return ResourcePermission.builder().resourceRole(role).build();
    }

    private void stubVisitor() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
    }

    /** What {@code buildView} reads: no published record, no template, no folder, until a test says otherwise. */
    private void stubViewDependencies() {
        lenient().when(applicationRecordService.getLatestRecordByApplicationId(any())).thenReturn(Mono.empty());
        lenient().when(folderElementRelationService.getByElementIds(any())).thenReturn(Flux.empty());
        lenient().when(templateService.getByApplicationId(any())).thenReturn(Mono.empty());
        lenient().when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(new OrganizationCommonSettings()));
    }

    private void stubPublished(Application application, ApplicationRequestType requestType, List<Application> modules) {
        stubVisitor();
        stubViewDependencies();
        lenient().when(resourcePermissionService.checkUserPermissionStatusOnApplication(VISITOR_ID, APP_ID,
                ResourceAction.READ_APPLICATIONS, requestType))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(permission(ResourceRole.VIEWER))));
        lenient().when(applicationService.findById(APP_ID)).thenReturn(Mono.just(application));
        lenient().when(applicationService.getAllDependentModulesFromApplication(application, true))
                .thenReturn(Mono.just(modules));
    }

    private void stubEditing(Application application, List<Application> modules) {
        stubVisitor();
        stubViewDependencies();
        lenient().when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR_ID, APP_ID,
                ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(permission(ResourceRole.EDITOR))));
        lenient().when(applicationService.findById(APP_ID)).thenReturn(Mono.just(application));
        lenient().when(applicationService.getAllDependentModulesFromApplication(application, false))
                .thenReturn(Mono.just(modules));
        lenient().when(applicationService.updateById(eq(APP_ID), any(Application.class))).thenReturn(Mono.just(true));
    }

    private ApplicationView published(Application application) {
        stubPublished(application, ApplicationRequestType.PUBLIC_TO_ALL, List.of());
        return service.getPublishedApplication(APP_ID, ApplicationRequestType.PUBLIC_TO_ALL, false).block();
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private QueryExecutor stubExecutor(String datasourceType) {
        QueryExecutor executor = mock(QueryExecutor.class);
        doReturn(executor).when(datasourceMetaInfoService).getQueryExecutor(datasourceType);
        return executor;
    }

    // ------------------------------------------------------------------ create

    static Stream<Arguments> invalidCreateRequests() {
        return Stream.of(
                Arguments.of("org id null", null, "name", MSG_ORG_ID_EMPTY),
                Arguments.of("org id blank", "   ", "name", MSG_ORG_ID_EMPTY),
                Arguments.of("name null", ORG_ID, null, MSG_APP_NAME_EMPTY),
                Arguments.of("name blank", ORG_ID, "  ", MSG_APP_NAME_EMPTY),
                Arguments.of("both missing: the org id is reported first", null, null, MSG_ORG_ID_EMPTY));
    }

    /**
     * Catches an application stored without an organization or without a name: INVALID_PARAMETER with the matching
     * message key, and neither the session nor the application service is touched.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidCreateRequests")
    void create_blankOrganizationIdOrName_isRejectedBeforeAnyLookup(String label, String orgId, String name,
            String expectedKey) {
        CreateApplicationRequest request = new CreateApplicationRequest(orgId, null, name,
                ApplicationType.APPLICATION.getValue(), dsl(), null, null, null);

        StepVerifier.create(service.create(request))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, expectedKey))
                .verify();
        verifyNoInteractions(sessionUserService, applicationService);
        say("create: %s -> INVALID_PARAMETER %s, no lookup", label, expectedKey);
    }

    // ------------------------------------------------------------------ getPublishedApplication: request type gate

    static Stream<Arguments> requestTypeMatrix() {
        ApplicationRequestType all = ApplicationRequestType.PUBLIC_TO_ALL;
        ApplicationRequestType market = ApplicationRequestType.PUBLIC_TO_MARKETPLACE;
        ApplicationRequestType agency = ApplicationRequestType.AGENCY_PROFILE;
        return Stream.of(
                // type, publicToAll, publicToMarketplace, agencyProfile, served
                Arguments.of(all, false, false, false, true),
                Arguments.of(market, true, true, false, true),
                Arguments.of(market, false, true, false, false),
                Arguments.of(market, true, false, false, false),
                Arguments.of(market, false, false, false, false),
                Arguments.of(market, true, false, true, false),
                Arguments.of(agency, true, false, true, true),
                Arguments.of(agency, false, false, true, false),
                Arguments.of(agency, true, false, false, false),
                Arguments.of(agency, true, true, false, false));
    }

    /**
     * Catches a private application served through a public route: PUBLIC_TO_ALL always passes, PUBLIC_TO_MARKETPLACE
     * needs publicToMarketplace AND publicToAll, AGENCY_PROFILE needs agencyProfile AND publicToAll, and every other
     * combination (including a marketplace flag on an agency request) is UNSUPPORTED_OPERATION BAD_REQUEST.
     */
    @ParameterizedTest(name = "{0}: publicToAll={1} marketplace={2} agency={3} -> served={4}")
    @MethodSource("requestTypeMatrix")
    void getPublishedApplication_requestTypeMatrix(ApplicationRequestType requestType, boolean publicToAll,
            boolean marketplace, boolean agency, boolean served) {
        Application application = appBuilder(APP_ID, dsl()).publicToAll(publicToAll).publicToMarketplace(marketplace)
                .agencyProfile(agency).build();
        stubPublished(application, requestType, List.of());

        Mono<ApplicationView> view = service.getPublishedApplication(APP_ID, requestType, false);

        if (served) {
            StepVerifier.create(view)
                    .assertNext(v -> assertThat(v.getApplicationInfoView().getApplicationId()).isEqualTo(APP_ID))
                    .verifyComplete();
        } else {
            StepVerifier.create(view)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, MSG_BAD_REQUEST))
                    .verify();
        }
        say("getPublishedApplication %s all=%s market=%s agency=%s -> served=%s", requestType, publicToAll, marketplace,
                agency, served);
    }

    // ------------------------------------------------------------------ withDeleted

    static Stream<Arguments> withDeletedCases() {
        List<Arguments> args = new ArrayList<>();
        for (boolean editing : new boolean[] {false, true}) {
            args.add(Arguments.of(editing, ApplicationStatus.RECYCLED, null, false));
            args.add(Arguments.of(editing, ApplicationStatus.RECYCLED, false, false));
            args.add(Arguments.of(editing, ApplicationStatus.RECYCLED, true, true));
            args.add(Arguments.of(editing, ApplicationStatus.NORMAL, false, true));
        }
        return args.stream();
    }

    /**
     * Catches a recycled application opened normally (UNSUPPORTED_OPERATION BAD_REQUEST) and the opposite, a
     * recycled application that cannot be opened with {@code withDeleted = true}.
     */
    @ParameterizedTest(name = "editing={0} status={1} withDeleted={2} -> served={3}")
    @MethodSource("withDeletedCases")
    void getApplication_recycledApplicationNeedsWithDeleted(boolean editing, ApplicationStatus status,
            Boolean withDeleted, boolean served) {
        Application application = appBuilder(APP_ID, dsl()).applicationStatus(status).build();
        Mono<ApplicationView> view;
        if (editing) {
            stubEditing(application, List.of());
            view = service.getEditingApplication(APP_ID, withDeleted);
        } else {
            stubPublished(application, ApplicationRequestType.PUBLIC_TO_ALL, List.of());
            view = service.getPublishedApplication(APP_ID, ApplicationRequestType.PUBLIC_TO_ALL, withDeleted);
        }

        if (served) {
            StepVerifier.create(view).expectNextCount(1).verifyComplete();
        } else {
            StepVerifier.create(view)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, MSG_BAD_REQUEST))
                    .verify();
        }
        say("%s view of a %s application, withDeleted=%s -> served=%s", editing ? "editing" : "published", status,
                withDeleted, served);
    }

    // ------------------------------------------------------------------ getPublishedApplication: nav layout, template id, flags

    /**
     * Catches the sub-app removal missing for a navigation layout (sub-app DSL leaking) and applied to ordinary
     * applications: the compound filter gets the view's DSL for NAV_LAYOUT only.
     */
    @ParameterizedTest
    @ValueSource(ints = {3, 1, 2})
    void getPublishedApplication_removesSubAppsOnlyForNavLayouts(int applicationType) {
        Application application = appBuilder(APP_ID, dsl("ui", dsl())).applicationType(applicationType).build();
        stubPublished(application, ApplicationRequestType.PUBLIC_TO_ALL, List.of());
        lenient().when(compoundApplicationDslFilter.removeSubAppsFromCompoundDsl(any())).thenReturn(Mono.empty());

        ApplicationView view = service.getPublishedApplication(APP_ID, ApplicationRequestType.PUBLIC_TO_ALL, false).block();

        if (applicationType == ApplicationType.NAV_LAYOUT.getValue()) {
            verify(compoundApplicationDslFilter).removeSubAppsFromCompoundDsl(view.getApplicationDSL());
        } else {
            verifyNoInteractions(compoundApplicationDslFilter);
        }
        say("published view of application type %d: compound filter applied=%s", applicationType,
                applicationType == ApplicationType.NAV_LAYOUT.getValue());
    }

    static Stream<Arguments> templateLookups() {
        return Stream.of(
                Arguments.of("template found", "found", TEMPLATE_ID),
                Arguments.of("no template", "empty", ""),
                Arguments.of("lookup fails", "error", ""));
    }

    /**
     * Catches a published view lost because the template lookup failed (the view must still be returned with an empty
     * template id) and a template id that is not passed on.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("templateLookups")
    void getPublishedApplication_templateIdLookup(String label, String outcome, String expectedTemplateId) {
        Application application = app(dsl());
        stubPublished(application, ApplicationRequestType.PUBLIC_TO_ALL, List.of());
        switch (outcome) {
            case "found" -> {
                Template template = mock(Template.class);
                when(template.getId()).thenReturn(TEMPLATE_ID);
                when(templateService.getByApplicationId(APP_ID)).thenReturn(Mono.just(template));
            }
            case "error" -> when(templateService.getByApplicationId(APP_ID)).thenReturn(Mono.error(new IllegalStateException("boom")));
            default -> when(templateService.getByApplicationId(APP_ID)).thenReturn(Mono.empty());
        }

        ApplicationView view = service.getPublishedApplication(APP_ID, ApplicationRequestType.PUBLIC_TO_ALL, false).block();

        assertThat(view.getTemplateId()).isEqualTo(expectedTemplateId);
        say("published view, %s -> templateId [%s]", label, expectedTemplateId);
    }

    static Stream<Arguments> publishedRecords() {
        return Stream.of(
                Arguments.of(null, 5_000L, false, null, null),
                Arguments.of("", 5_000L, false, null, null),
                Arguments.of("v1", 0L, true, "v1", null),
                Arguments.of("v1", PUBLISHED_AT_MILLIS, true, "v1", Instant.ofEpochMilli(PUBLISHED_AT_MILLIS)));
    }

    /**
     * Catches a wrong published state in the application info: published, publishedVersion and lastPublishedTime come
     * from the latest record only when it has a tag, and the time only when the record has a creation time.
     */
    @ParameterizedTest(name = "tag [{0}] created {1} -> published {2}, version {3}, time {4}")
    @MethodSource("publishedRecords")
    void buildView_publishedFlagsComeFromTheLatestRecord(String tag, long createdMillis, boolean published,
            String publishedVersion, Instant lastPublishedTime) {
        Application application = app(dsl());
        stubPublished(application, ApplicationRequestType.PUBLIC_TO_ALL, List.of());
        ApplicationVersion record = ApplicationVersion.builder().tag(tag).applicationDSL(dsl())
                .createdAt(Instant.ofEpochMilli(createdMillis)).build();
        when(applicationRecordService.getLatestRecordByApplicationId(APP_ID)).thenReturn(Mono.just(record));

        ApplicationView view = service.getPublishedApplication(APP_ID, ApplicationRequestType.PUBLIC_TO_ALL, false).block();

        assertThat(view.getApplicationInfoView().isPublished()).isEqualTo(published);
        assertThat(view.getApplicationInfoView().getPublishedVersion()).isEqualTo(publishedVersion);
        assertThat(view.getApplicationInfoView().getLastPublishedTime()).isEqualTo(lastPublishedTime);
        say("record tag [%s] created %d -> published=%s version=%s time=%s", tag, createdMillis, published,
                publishedVersion, lastPublishedTime);
    }

    // ------------------------------------------------------------------ DSL sanitising

    enum Executor {
        NOT_ASKED, LOOKUP_THROWS, ASKED_NEVER_SANITIZES, SANITIZER_THROWS, SANITIZER_RETURNS
    }

    private static Arguments queryRow(String label, Supplier<Object> query, Executor executor, Supplier<Map<String, Object>> sanitized,
            Supplier<Object> expected) {
        return Arguments.of(label, query, executor, sanitized, expected);
    }

    private static Supplier<Object> same(Supplier<Object> query) {
        return query;
    }

    static Stream<Arguments> queryRows() {
        Supplier<Object> noCompType = () -> dsl("id", "q1", "comp", dsl("sql", "select 1"));
        Supplier<Object> numericCompType = () -> dsl("id", "q1", "compType", 5, "comp", dsl("sql", "select 1"));
        Supplier<Object> libraryQuery = () -> dsl("id", "q1", "compType", "libraryQuery", "comp", dsl("sql", "select 1"));
        Supplier<Object> libraryQueryUpper = () -> dsl("id", "q1", "compType", "LibraryQuery", "comp", dsl("sql", "select 1"));
        Supplier<Object> jsUpper = () -> dsl("id", "q1", "compType", "JS", "comp", dsl("sql", "select 1"));
        Supplier<Object> viewMixed = () -> dsl("id", "q1", "compType", "View", "comp", dsl("sql", "select 1"));
        Supplier<Object> mysql = () -> dsl("id", "q1", "compType", "mysql", "comp", dsl("sql", "select secret"));
        Supplier<Object> mysqlCompNotMap = () -> dsl("id", "q1", "compType", "mysql", "comp", "oops");
        return Stream.of(
                queryRow("non-Map entry is replaced by an empty map", () -> "just-a-string", Executor.NOT_ASKED, null,
                        () -> new HashMap<String, Object>()),
                queryRow("no compType: untouched", noCompType, Executor.NOT_ASKED, null, same(noCompType)),
                queryRow("compType not a String: untouched", numericCompType, Executor.NOT_ASKED, null, same(numericCompType)),
                queryRow("libraryQuery: untouched, executor not asked", libraryQuery, Executor.NOT_ASKED, null, same(libraryQuery)),
                queryRow("libraryQuery (mixed case): untouched, executor not asked", libraryQueryUpper, Executor.NOT_ASKED, null,
                        same(libraryQueryUpper)),
                queryRow("js (upper case): untouched, executor not asked", jsUpper, Executor.NOT_ASKED, null, same(jsUpper)),
                queryRow("view (mixed case): untouched, executor not asked", viewMixed, Executor.NOT_ASKED, null, same(viewMixed)),
                queryRow("executor lookup fails: query returned as is", mysql, Executor.LOOKUP_THROWS, null, same(mysql)),
                queryRow("comp is not a Map: returned as is, nothing sanitised", mysqlCompNotMap, Executor.ASKED_NEVER_SANITIZES, null,
                        same(mysqlCompNotMap)),
                queryRow("sanitizer fails: query returned as is", mysql, Executor.SANITIZER_THROWS, null, same(mysql)),
                queryRow("sanitised config replaces comp, compType stays", mysql, Executor.SANITIZER_RETURNS,
                        () -> dsl("sql", "redacted"),
                        () -> dsl("id", "q1", "compType", "mysql", "comp", dsl("sql", "redacted"))),
                queryRow("config reduced to exactly {fields} turns the query into a view", mysql, Executor.SANITIZER_RETURNS,
                        () -> dsl("fields", list("a")),
                        () -> dsl("id", "q1", "compType", "view", "comp", dsl("fields", list("a")))),
                queryRow("{fields, other} stays the datasource type", mysql, Executor.SANITIZER_RETURNS,
                        () -> dsl("fields", list("a"), "x", 1),
                        () -> dsl("id", "q1", "compType", "mysql", "comp", dsl("fields", list("a"), "x", 1))),
                queryRow("a single key other than fields stays the datasource type", mysql, Executor.SANITIZER_RETURNS,
                        () -> dsl("x", 1),
                        () -> dsl("id", "q1", "compType", "mysql", "comp", dsl("x", 1))));
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void prepareExecutor(Executor mode, Supplier<Map<String, Object>> sanitized) {
        switch (mode) {
            case NOT_ASKED -> { }
            case LOOKUP_THROWS -> doThrow(new IllegalStateException("no executor")).when(datasourceMetaInfoService)
                    .getQueryExecutor("mysql");
            case ASKED_NEVER_SANITIZES -> stubExecutor("mysql");
            case SANITIZER_THROWS -> when(stubExecutor("mysql").sanitizeQueryConfig(anyMap()))
                    .thenThrow(new IllegalStateException("cannot sanitise"));
            case SANITIZER_RETURNS -> when(stubExecutor("mysql").sanitizeQueryConfig(anyMap())).thenReturn(sanitized.get());
        }
    }

    /**
     * Catches datasource secrets and query details visible in the published DSL of a shared application: every query
     * of the published DSL is sanitised by its datasource plugin, and the documented fallbacks (non-Map entry, no or
     * non-String compType, library/js/view queries, failing lookup or sanitiser, comp not a Map) leave the query as
     * they must; a config reduced to exactly {@code {fields}} turns the query into a view.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("queryRows")
    void getPublishedApplication_sanitisesEachQueryOfThePublishedDsl(String label, Supplier<Object> query, Executor mode,
            Supplier<Map<String, Object>> sanitized, Supplier<Object> expected) {
        prepareExecutor(mode, sanitized);
        Map<String, Object> publishedDsl = dsl("queries", list(query.get()));

        ApplicationView view = published(app(publishedDsl));

        assertThat(view.getApplicationDSL().get("queries")).isEqualTo(List.of(expected.get()));
        if (mode == Executor.NOT_ASKED) {
            verifyNoInteractions(datasourceMetaInfoService);
        }
        say("published DSL query: %s -> %s", label, view.getApplicationDSL().get("queries"));
    }

    /**
     * Catches module DSL leaking secrets or test data into the published view: the DSL of every dependent module is
     * sanitised and cleaned of {@code test} values too, keyed by the module id.
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    @Test
    void getPublishedApplication_sanitisesTheDslOfDependentModulesToo() {
        QueryExecutor executor = stubExecutor("mysql");
        when(executor.sanitizeQueryConfig(anyMap())).thenReturn(dsl("fields", list("a")));
        Application application = app(dsl());
        Application module = appBuilder(MODULE_ID, dsl(
                "queries", list(dsl("id", "q1", "compType", "mysql", "comp", dsl("sql", "select secret"))),
                "ui", dsl("comp", dsl("io", dsl("inputs", list(dsl("name", "in", "test", "secret"))))))).build();
        stubPublished(application, ApplicationRequestType.PUBLIC_TO_ALL, List.of(module));

        ApplicationView view = service.getPublishedApplication(APP_ID, ApplicationRequestType.PUBLIC_TO_ALL, false).block();

        Map<String, Object> moduleDsl = view.getModuleDSL().get(MODULE_ID);
        assertThat(moduleDsl.get("queries")).isEqualTo(List.of(dsl("id", "q1", "compType", "view", "comp", dsl("fields", list("a")))));
        assertThat(moduleDsl.get("ui")).isEqualTo(dsl("comp", dsl("io", dsl("inputs", list(dsl("name", "in"))))));
        say("published view: module %s DSL sanitised: %s", MODULE_ID, moduleDsl);
    }

    static Stream<Arguments> testValueRows() {
        Supplier<Map<String, Object>> noUi = () -> dsl("x", 1);
        Supplier<Map<String, Object>> uiWithoutComp = () -> dsl("ui", dsl());
        Supplier<Map<String, Object>> compWithoutIo = () -> dsl("ui", dsl("comp", dsl("a", 1)));
        Supplier<Map<String, Object>> ioWithoutLists = () -> dsl("ui", dsl("comp", dsl("io", dsl())));
        return Stream.of(
                Arguments.of("no ui: untouched", noUi, noUi),
                Arguments.of("ui without comp: untouched", uiWithoutComp, uiWithoutComp),
                Arguments.of("comp without io: untouched", compWithoutIo, compWithoutIo),
                Arguments.of("io without inputs and outputs: untouched", ioWithoutLists, ioWithoutLists),
                Arguments.of("test values removed from inputs and outputs, other keys kept",
                        (Supplier<Map<String, Object>>) () -> dsl("ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a", "test", "secret"), dsl("name", "b")),
                                "outputs", list(dsl("name", "o", "test", "x", "other", 1)))))),
                        (Supplier<Map<String, Object>>) () -> dsl("ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a"), dsl("name", "b")),
                                "outputs", list(dsl("name", "o", "other", 1))))))),
                Arguments.of("inputs only",
                        (Supplier<Map<String, Object>>) () -> dsl("ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a", "test", "secret")))))),
                        (Supplier<Map<String, Object>>) () -> dsl("ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a"))))))),
                Arguments.of("outputs only",
                        (Supplier<Map<String, Object>>) () -> dsl("ui", dsl("comp", dsl("io", dsl(
                                "outputs", list(dsl("name", "o", "test", "x")))))),
                        (Supplier<Map<String, Object>>) () -> dsl("ui", dsl("comp", dsl("io", dsl(
                                "outputs", list(dsl("name", "o"))))))),
                Arguments.of("queries is not a List: the DSL is still cleaned",
                        (Supplier<Map<String, Object>>) () -> dsl("queries", "not-a-list", "ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a", "test", "secret")))))),
                        (Supplier<Map<String, Object>>) () -> dsl("queries", "not-a-list", "ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a"))))))),
                Arguments.of("queries is a List: the DSL is cleaned as well",
                        (Supplier<Map<String, Object>>) () -> dsl("queries", list(), "ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a", "test", "secret")))))),
                        (Supplier<Map<String, Object>>) () -> dsl("queries", list(), "ui", dsl("comp", dsl("io", dsl(
                                "inputs", list(dsl("name", "a"))))))));
    }

    /**
     * Catches test data visible in the published view of a shared application: {@code test} keys are removed from
     * {@code ui.comp.io.inputs} and {@code outputs} (other keys kept), and DSLs without those parts pass through.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("testValueRows")
    void getPublishedApplication_removesTestValuesFromIoInputsAndOutputs(String label, Supplier<Map<String, Object>> input,
            Supplier<Map<String, Object>> expected) {
        ApplicationView view = published(app(input.get()));

        assertThat(view.getApplicationDSL()).isEqualTo(expected.get());
        say("published DSL io cleanup: %s", label);
    }

    // ------------------------------------------------------------------ getEditingApplication

    /**
     * Catches the editor losing its own test data (the edited application's DSL is returned unsanitised) and a module
     * leaking its secrets (dependent module DSL is sanitised); the application is written back, and the view carries
     * the org common settings and the folder id of the folder relation.
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    @Test
    void getEditingApplication_sanitisesModuleDslButNotTheEditedApplicationsOwn() {
        QueryExecutor executor = stubExecutor("mysql");
        when(executor.sanitizeQueryConfig(anyMap())).thenReturn(dsl("fields", list("a")));
        Map<String, Object> ownDsl = dsl("ui", dsl("comp", dsl("io", dsl("inputs", list(dsl("name", "in", "test", "keep"))))));
        Application application = app(ownDsl);
        Application module = appBuilder(MODULE_ID, dsl(
                "queries", list(dsl("id", "q1", "compType", "mysql", "comp", dsl("sql", "select secret"))))).build();
        stubEditing(application, List.of(module));
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put("k", "v");
        when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(settings));
        when(folderElementRelationService.getByElementIds(List.of(APP_ID))).thenReturn(Flux.just(new FolderElement(FOLDER_ID, APP_ID)));

        ApplicationView view = service.getEditingApplication(APP_ID, false).block();

        assertThat(view.getApplicationDSL()).isEqualTo(dsl("ui", dsl("comp", dsl("io", dsl("inputs", list(dsl("name", "in", "test", "keep")))))));
        assertThat(view.getModuleDSL().get(MODULE_ID).get("queries"))
                .isEqualTo(List.of(dsl("id", "q1", "compType", "view", "comp", dsl("fields", list("a")))));
        assertThat(view.getOrgCommonSettings()).containsEntry("k", "v");
        assertThat(view.getApplicationInfoView().getFolderId()).isEqualTo(FOLDER_ID);
        assertThat(view.getApplicationInfoView().getRole()).isEqualTo(ResourceRole.EDITOR.getValue());
        verify(applicationService).updateById(APP_ID, application);
        say("getEditingApplication: own DSL kept, module DSL sanitised, folder %s, role %s", FOLDER_ID,
                view.getApplicationInfoView().getRole());
    }

    /**
     * Pins the plan section 9 row "ApplicationApiServiceImpl.getEditingApplication skips the edit-permission check for
     * an app that is public to all and to the marketplace, and that read also writes the application": a visitor with
     * no permission at all gets the editing DSL with role "viewer", the edit-permission check is never run, and
     * {@code updateById} is called. A fix changes this test on purpose. The private-app contrast is
     * {@link #getEditingApplication_appNotPublicToBoth_needsTheEditPermission}.
     */
    @Test
    void getEditingApplication_publicMarketplaceApp_skipsTheEditPermissionCheckAndWritesTheApplication() {
        Map<String, Object> draftDsl = dsl("draft", "unpublished");
        Application application = appBuilder(APP_ID, draftDsl).publicToAll(true).publicToMarketplace(true).build();
        stubEditing(application, List.of());

        ApplicationView view = service.getEditingApplication(APP_ID, false).block();

        assertThat(view.getApplicationInfoView().getRole()).isEqualTo(ResourceRole.VIEWER.getValue());
        assertThat(view.getApplicationDSL()).isEqualTo(draftDsl);
        verify(resourcePermissionService, never()).checkUserPermissionStatusOnResource(any(), any(), any());
        verify(applicationService).updateById(APP_ID, application);
        say("getEditingApplication of a public+marketplace app: role viewer, edit check skipped, updateById called (section 9 defect pinned)");
    }

    static Stream<Arguments> notPublicToBoth() {
        return Stream.of(Arguments.of(true, false), Arguments.of(false, true), Arguments.of(false, false));
    }

    /**
     * Contrast to the pinned defect: an application that is not public to both (all, marketplace) needs the
     * EDIT_APPLICATIONS permission check, and a visitor without it is refused.
     */
    @ParameterizedTest(name = "publicToAll={0} marketplace={1}")
    @MethodSource("notPublicToBoth")
    void getEditingApplication_appNotPublicToBoth_needsTheEditPermission(boolean publicToAll, boolean marketplace) {
        Application application = appBuilder(APP_ID, dsl()).publicToAll(publicToAll).publicToMarketplace(marketplace).build();
        stubEditing(application, List.of());
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR_ID, APP_ID, ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.anonymousUser()));

        StepVerifier.create(service.getEditingApplication(APP_ID, false))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.USER_NOT_SIGNED_IN, MSG_NOT_SIGNED_IN))
                .verify();
        verify(applicationService, never()).updateById(any(), any());
        say("getEditingApplication publicToAll=%s marketplace=%s: edit check ran, anonymous refused, nothing written",
                publicToAll, marketplace);
    }

    // ------------------------------------------------------------------ readable permission errors

    private void stubSuggestedAdmins() {
        when(suggestAppAdminSolutionService.getSuggestAppAdminNames(APP_ID)).thenReturn(Mono.just(ADMIN_NAMES));
    }

    static Stream<Arguments> deniedStatuses() {
        return Stream.of(
                Arguments.of("anonymous", UserPermissionOnResourceStatus.anonymousUser(), ResourceAction.READ_APPLICATIONS,
                        BizError.USER_NOT_SIGNED_IN, MSG_NOT_SIGNED_IN, false),
                Arguments.of("not in the org", UserPermissionOnResourceStatus.notInOrg(), ResourceAction.READ_APPLICATIONS,
                        BizError.NO_PERMISSION_TO_REQUEST_APP, MSG_INSUFFICIENT, false),
                Arguments.of("not enough permission, edit", UserPermissionOnResourceStatus.notEnoughPermission(),
                        ResourceAction.EDIT_APPLICATIONS, BizError.NO_PERMISSION_TO_REQUEST_APP, MSG_NO_EDIT, true),
                Arguments.of("not enough permission, view", UserPermissionOnResourceStatus.notEnoughPermission(),
                        ResourceAction.READ_APPLICATIONS, BizError.NO_PERMISSION_TO_REQUEST_APP, MSG_NO_VIEW, true));
    }

    /**
     * Catches a wrong reason shown to the user and an admin lookup for every denial: success returns the permission;
     * anonymous gives USER_NOT_SIGNED_IN, not in the org INSUFFICIENT_PERMISSION, and only a plain lack of permission
     * fetches the suggested admins and answers NO_PERMISSION_TO_EDIT (edit) or NO_PERMISSION_TO_VIEW (anything else)
     * with the admin names as argument.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("deniedStatuses")
    void checkPermissionWithReadableErrorMsg_mapsEveryDeniedStatus(String label, UserPermissionOnResourceStatus status,
            ResourceAction action, BizError expectedError, String expectedKey, boolean asksSuggestedAdmins) {
        stubVisitor();
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR_ID, APP_ID, action))
                .thenReturn(Mono.just(status));
        if (asksSuggestedAdmins) {
            stubSuggestedAdmins();
        }

        StepVerifier.create(service.checkPermissionWithReadableErrorMsg(APP_ID, action))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, expectedError, expectedKey);
                    if (asksSuggestedAdmins) {
                        assertThat(((BizException) error).getArgs()).containsExactly(ADMIN_NAMES);
                    }
                })
                .verify();
        if (!asksSuggestedAdmins) {
            verifyNoInteractions(suggestAppAdminSolutionService);
        }
        say("checkPermissionWithReadableErrorMsg: %s -> %s %s", label, expectedError, expectedKey);
    }

    @Test
    void checkPermissionWithReadableErrorMsg_permitted_returnsThePermission() {
        stubVisitor();
        ResourcePermission granted = permission(ResourceRole.EDITOR);
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR_ID, APP_ID, ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(granted)));

        StepVerifier.create(service.checkPermissionWithReadableErrorMsg(APP_ID, ResourceAction.EDIT_APPLICATIONS))
                .expectNext(granted).verifyComplete();
        say("checkPermissionWithReadableErrorMsg: permitted -> the permission");
    }

    private void stubApplicationStatus(UserPermissionOnResourceStatus status, ResourceAction action) {
        stubVisitor();
        when(resourcePermissionService.checkUserPermissionStatusOnApplication(VISITOR_ID, APP_ID, action,
                ApplicationRequestType.PUBLIC_TO_ALL)).thenReturn(Mono.just(status));
    }

    /**
     * Same status-to-error mapping as {@code checkPermissionWithReadableErrorMsg_mapsEveryDeniedStatus} for the
     * request-type variant used by the published view, with the organization id header present (the application
     * resolves). Catches a wrong reason or a missing admin lookup in this copy of the mapping.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("deniedStatuses")
    void checkApplicationPermissionWithReadableErrorMsg_mapsEveryDeniedStatus(String label,
            UserPermissionOnResourceStatus status, ResourceAction action, BizError expectedError, String expectedKey,
            boolean asksSuggestedAdmins) {
        stubApplicationStatus(status, action);
        when(applicationService.findById(APP_ID)).thenReturn(Mono.just(app(dsl())));
        if (asksSuggestedAdmins) {
            stubSuggestedAdmins();
        }

        StepVerifier.create(service.checkApplicationPermissionWithReadableErrorMsg(APP_ID, action, ApplicationRequestType.PUBLIC_TO_ALL))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, expectedError, expectedKey);
                    BizException biz = (BizException) error;
                    assertThat(biz.getHeaders().getFirst(ORG_ID_HEADER)).isEqualTo(ORG_ID);
                    if (asksSuggestedAdmins) {
                        assertThat(biz.getArgs()).containsExactly(ADMIN_NAMES);
                    }
                })
                .verify();
        if (!asksSuggestedAdmins) {
            verifyNoInteractions(suggestAppAdminSolutionService);
        }
        say("checkApplicationPermissionWithReadableErrorMsg: %s -> %s %s with %s header", label, expectedError,
                expectedKey, ORG_ID_HEADER);
    }

    static Stream<Arguments> orgLookups() {
        return Stream.of(
                Arguments.of("org id resolves", "found", ORG_ID),
                Arguments.of("org id blank", "blank", null),
                Arguments.of("lookup fails", "error", null),
                Arguments.of("application not found", "empty", null));
    }

    /**
     * Catches the {@code X-ORG-ID} header (the client's redirect to the right workspace) set for an organization that
     * did not resolve, or lost when it did: the header is added only for a non-blank org id, and an unresolved org
     * (blank, lookup error, no application) still yields the same BizException without the header.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("orgLookups")
    void checkApplicationPermissionWithReadableErrorMsg_setsTheOrgHeaderOnlyWhenTheOrgResolves(String label, String outcome,
            String expectedHeader) {
        stubApplicationStatus(UserPermissionOnResourceStatus.anonymousUser(), ResourceAction.READ_APPLICATIONS);
        switch (outcome) {
            case "found" -> when(applicationService.findById(APP_ID)).thenReturn(Mono.just(app(dsl())));
            case "blank" -> when(applicationService.findById(APP_ID))
                    .thenReturn(Mono.just(appBuilder(APP_ID, dsl()).organizationId("").build()));
            case "error" -> when(applicationService.findById(APP_ID)).thenReturn(Mono.error(new IllegalStateException("db down")));
            default -> when(applicationService.findById(APP_ID)).thenReturn(Mono.empty());
        }

        StepVerifier.create(service.checkApplicationPermissionWithReadableErrorMsg(APP_ID, ResourceAction.READ_APPLICATIONS,
                        ApplicationRequestType.PUBLIC_TO_ALL))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.USER_NOT_SIGNED_IN, MSG_NOT_SIGNED_IN);
                    assertThat(((BizException) error).getHeaders().getFirst(ORG_ID_HEADER)).isEqualTo(expectedHeader);
                })
                .verify();
        say("anonymous refusal, %s -> %s header [%s]", label, ORG_ID_HEADER, expectedHeader);
    }

    @Test
    void checkApplicationPermissionWithReadableErrorMsg_permitted_returnsThePermission() {
        ResourcePermission granted = permission(ResourceRole.VIEWER);
        stubApplicationStatus(UserPermissionOnResourceStatus.success(granted), ResourceAction.READ_APPLICATIONS);

        StepVerifier.create(service.checkApplicationPermissionWithReadableErrorMsg(APP_ID, ResourceAction.READ_APPLICATIONS,
                        ApplicationRequestType.PUBLIC_TO_ALL))
                .expectNext(granted).verifyComplete();
        verifyNoInteractions(applicationService);
        say("checkApplicationPermissionWithReadableErrorMsg: permitted -> the permission, no org lookup");
    }

    // ------------------------------------------------------------------ update

    private Application updateRequest(Map<String, Object> dsl, ApplicationStatus status) {
        return Application.builder().name("renamed").editingApplicationDSL(dsl).applicationStatus(status)
                .organizationId(REQUEST_ORG_ID).build();
    }

    private void stubUpdate(Application stored) {
        stubVisitor();
        stubViewDependencies();
        lenient().when(applicationService.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(stored));
        lenient().when(resourcePermissionService.checkAndReturnMaxPermission(VISITOR_ID, APP_ID, ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.just(permission(ResourceRole.EDITOR)));
        lenient().when(applicationService.findById(APP_ID)).thenReturn(Mono.just(stored));
        lenient().when(applicationService.updateById(eq(APP_ID), any(Application.class))).thenReturn(Mono.just(true));
    }

    static Stream<Arguments> updateStatusCases() {
        return Stream.of(
                // updateStatus, stored status, refused, status written
                Arguments.of(null, ApplicationStatus.NORMAL, false, null),
                Arguments.of(false, ApplicationStatus.NORMAL, false, null),
                Arguments.of(null, ApplicationStatus.RECYCLED, true, null),
                Arguments.of(false, ApplicationStatus.RECYCLED, true, null),
                Arguments.of(true, ApplicationStatus.RECYCLED, false, ApplicationStatus.NORMAL));
    }

    /**
     * Catches a recycled application edited by a plain update (UNSUPPORTED_OPERATION, nothing written) and a status
     * written by accident: without {@code updateStatus} the stored status is checked to be NORMAL and the update
     * carries no status; with {@code updateStatus = true} the check is skipped and the request's status is written.
     */
    @ParameterizedTest(name = "updateStatus={0} stored={1} refused={2} written status={3}")
    @MethodSource("updateStatusCases")
    void update_statusHandling(Boolean updateStatus, ApplicationStatus storedStatus, boolean refused,
            ApplicationStatus writtenStatus) {
        Application stored = appBuilder(APP_ID, dsl()).applicationStatus(storedStatus).build();
        stubUpdate(stored);
        ArgumentCaptor<Application> written = ArgumentCaptor.forClass(Application.class);
        lenient().when(applicationService.updateById(eq(APP_ID), written.capture())).thenReturn(Mono.just(true));
        Map<String, Object> newDsl = dsl("ui", dsl());

        Mono<ApplicationView> result = service.update(APP_ID, updateRequest(newDsl, ApplicationStatus.NORMAL), updateStatus);

        if (refused) {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, MSG_BAD_REQUEST))
                    .verify();
            verify(applicationService, never()).updateById(any(), any());
        } else {
            StepVerifier.create(result).expectNextCount(1).verifyComplete();
            Application update = written.getValue();
            assertThat(update.getApplicationStatus()).isEqualTo(writtenStatus);
            assertThat(update.getName()).isEqualTo("renamed");
            assertThat(update.getEditingApplicationDSLOrNull()).isEqualTo(newDsl);
        }
        if (Boolean.TRUE.equals(updateStatus)) {
            verify(applicationService, never()).findByIdWithoutDsl(APP_ID);
        }
        say("update updateStatus=%s stored=%s -> refused=%s written status=%s", updateStatus, storedStatus, refused, writtenStatus);
    }

    private Application requestWithDatasources(String... datasourceIds) {
        List<Object> queries = new ArrayList<>();
        int i = 0;
        for (String datasourceId : datasourceIds) {
            queries.add(dsl("id", "q" + i++, "datasourceId", datasourceId));
        }
        return updateRequest(dsl("queries", queries), ApplicationStatus.NORMAL);
    }

    static Stream<Arguments> datasourceCases() {
        String quickRest = Datasource.QUICK_REST_API_ID;
        return Stream.of(
                // used ids, ids the user may use, ids that do not exist or belong to another org, lookup expected, allowed
                Arguments.of("no queries at all", new String[] {}, Set.of(), List.of(), false, true),
                Arguments.of("only blank and system static ids", new String[] {"", quickRest}, Set.of(), List.of(), false, true),
                Arguments.of("a datasource the user may use", new String[] {"ds-1"}, Set.of("ds-1"), List.of(), true, true),
                Arguments.of("a datasource that does not exist or is not in the org (intended exemption)",
                        new String[] {"ds-1"}, Set.of(), List.of("ds-1"), true, true),
                Arguments.of("one permitted and one non-existent: the union covers both", new String[] {"ds-1", "ds-2"},
                        Set.of("ds-1"), List.of("ds-2"), true, true),
                Arguments.of("a datasource in the org that the user may not use", new String[] {"ds-1", "ds-2"},
                        Set.of("ds-1"), List.of(), true, false),
                Arguments.of("static and blank ids do not hide an unusable datasource", new String[] {quickRest, "", "ds-2"},
                        Set.of(), List.of(), true, false));
    }

    /**
     * Regression of the plan section 9 "Fixed" row (datasource-permission check bypass in {@code update}) and the
     * check's matrix. The organization used to find foreign datasources is the STORED application's, not the request
     * body's (the stub only matches the stored org id, the request carries another). Blank and system static ids are
     * ignored, no used datasource means no lookup at all, a used datasource must be usable by the visitor or be one
     * that {@code retainNoneExistAndNonCurrentOrgDatasourceIds} returns (the method name states the exemption of
     * non-existent and other-org datasources: pinned as the intended behaviour, nothing is claimed about the check at
     * execution time), otherwise NOT_AUTHORIZED with APPLICATION_EDIT_ERROR_LACK_OF_DATASOURCE_PERMISSIONS and nothing
     * is written.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("datasourceCases")
    void update_datasourcePermissionMatrix(String label, String[] usedIds, Set<String> usableIds, List<String> noneExistIds,
            boolean lookupExpected, boolean allowed) {
        stubUpdate(app(dsl()));
        Set<String> checkedIds = new HashSet<>();
        for (String id : usedIds) {
            if (!id.isBlank() && !Datasource.QUICK_REST_API_ID.equals(id)) {
                checkedIds.add(id);
            }
        }
        if (lookupExpected) {
            Map<String, ResourcePermission> permitted = new HashMap<>();
            usableIds.forEach(id -> permitted.put(id, permission(ResourceRole.VIEWER)));
            when(resourcePermissionService.getMaxMatchingPermission(VISITOR_ID, checkedIds, ResourceAction.USE_DATASOURCES))
                    .thenReturn(Mono.just(permitted));
            when(datasourceService.retainNoneExistAndNonCurrentOrgDatasourceIds(checkedIds, ORG_ID))
                    .thenReturn(Flux.fromIterable(noneExistIds));
        }

        Mono<ApplicationView> result = service.update(APP_ID, requestWithDatasources(usedIds), false);

        if (allowed) {
            StepVerifier.create(result).expectNextCount(1).verifyComplete();
            verify(applicationService).updateById(eq(APP_ID), any(Application.class));
        } else {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, MSG_LACK_OF_DATASOURCE))
                    .verify();
            verify(applicationService, never()).updateById(any(), any());
        }
        if (!lookupExpected) {
            verify(resourcePermissionService, never()).getMaxMatchingPermission(any(), anyCollection(), any());
            verifyNoInteractions(datasourceService);
        }
        say("update datasource check: %s -> allowed=%s", label, allowed);
    }

    // ------------------------------------------------------------------ grantPermission

    static Stream<Arguments> grantTargets() {
        return Stream.of(
                Arguments.of(Set.<String>of(), Set.<String>of(), false),
                Arguments.of(Set.of("user-1"), Set.<String>of(), true),
                Arguments.of(Set.<String>of(), Set.of("group-1"), true));
    }

    /**
     * Catches grants silently dropped (a request with only groups, or only users, must reach the permission service)
     * and an empty request that still demands MANAGE_APPLICATIONS: with both sets empty the call is a no-op returning
     * true without any permission check or insert.
     */
    @ParameterizedTest(name = "users {0} groups {1} -> grants {2}")
    @MethodSource("grantTargets")
    void grantPermission_emptyTargetsAreANoOp_anyTargetGrants(Set<String> userIds, Set<String> groupIds, boolean grants) {
        if (grants) {
            stubVisitor();
            when(resourcePermissionService.checkResourcePermissionWithError(VISITOR_ID, APP_ID, ResourceAction.MANAGE_APPLICATIONS))
                    .thenReturn(Mono.empty());
            when(applicationService.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app(dsl())));
            when(resourcePermissionService.insertBatchPermission(ResourceType.APPLICATION, APP_ID, userIds, groupIds, ResourceRole.EDITOR))
                    .thenReturn(Mono.empty());
        }

        StepVerifier.create(service.grantPermission(APP_ID, userIds, groupIds, ResourceRole.EDITOR))
                .expectNext(true).verifyComplete();

        if (grants) {
            verify(resourcePermissionService).insertBatchPermission(ResourceType.APPLICATION, APP_ID, userIds, groupIds, ResourceRole.EDITOR);
        } else {
            verifyNoInteractions(resourcePermissionService, sessionUserService, applicationService);
        }
        say("grantPermission users=%s groups=%s -> grants=%s", userIds, groupIds, grants);
    }

    // ------------------------------------------------------------------ updateUserApplicationLastViewTime

    /**
     * Catches anonymous visits recorded as interactions and a failing upsert breaking the page load: an anonymous
     * visitor gets no upsert, a normal visitor gets {@code upsert(visitor, app, now)}, and an upsert error completes
     * empty instead of failing the caller.
     */
    @Test
    void updateUserApplicationLastViewTime_ignoresAnonymousVisitors() {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(Authentication.ANONYMOUS_USER_ID));

        StepVerifier.create(service.updateUserApplicationLastViewTime(APP_ID)).verifyComplete();

        verifyNoInteractions(userApplicationInteractionService);
        say("updateUserApplicationLastViewTime: anonymous visitor -> no upsert");
    }

    @Test
    void updateUserApplicationLastViewTime_recordsTheVisit_andSwallowsAnUpsertFailure() {
        stubVisitor();
        when(userApplicationInteractionService.upsert(eq(VISITOR_ID), eq(APP_ID), any(Instant.class))).thenReturn(Mono.empty());
        StepVerifier.create(service.updateUserApplicationLastViewTime(APP_ID)).verifyComplete();
        verify(userApplicationInteractionService).upsert(eq(VISITOR_ID), eq(APP_ID), any(Instant.class));

        when(userApplicationInteractionService.upsert(eq(VISITOR_ID), eq(APP_ID), any(Instant.class)))
                .thenReturn(Mono.error(new IllegalStateException("db down")));
        StepVerifier.create(service.updateUserApplicationLastViewTime(APP_ID)).verifyComplete();
        say("updateUserApplicationLastViewTime: visit recorded; a failing upsert completes empty");
    }

    // ------------------------------------------------------------------ createFromTemplate

    private Mono<Void> logged(String event, RuntimeException failure) {
        return Mono.defer(() -> {
            events.add(event);
            return failure == null ? Mono.empty() : Mono.error(failure);
        });
    }

    static Stream<Arguments> templateChecks() {
        return Stream.of(
                Arguments.of("all checks pass", null, null, List.of("dev", "quota", "create")),
                Arguments.of("developer check fails", new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"), null, List.of("dev")),
                Arguments.of("quota check fails", null,
                        new BizException(BizError.EXCEED_MAX_APP_COUNT, "EXCEED_MAX_APP_COUNT"), List.of("dev", "quota")));
    }

    /**
     * Catches a quota or developer-rights bypass through templates: {@code checkCurrentOrgDev} and
     * {@code checkMaxOrgApplicationCount} run, in that order, before the template is instantiated, and a failing check
     * stops it ({@code createFromTemplate} is never subscribed). Nothing else exercises these two decisions.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("templateChecks")
    void createFromTemplate_runsTheChecksBeforeInstantiatingTheTemplate(String label, RuntimeException devFailure,
            RuntimeException quotaFailure, List<String> expectedEvents) {
        OrgMember orgMember = new OrgMember(ORG_ID, VISITOR_ID, MemberRole.ADMIN, "CURRENT", 0L);
        stubViewDependencies();
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember));
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(logged("dev", devFailure));
        lenient().when(bizThresholdChecker.checkMaxOrgApplicationCount(orgMember)).thenReturn(logged("quota", quotaFailure));
        Application created = app(dsl("created", true));
        lenient().when(templateSolutionService.createFromTemplate(TEMPLATE_ID, ORG_ID, VISITOR_ID)).thenReturn(Mono.defer(() -> {
            events.add("create");
            return Mono.just(created);
        }));

        Mono<ApplicationView> result = service.createFromTemplate(TEMPLATE_ID);

        if (devFailure == null && quotaFailure == null) {
            StepVerifier.create(result)
                    .assertNext(view -> {
                        assertThat(view.getApplicationInfoView().getApplicationId()).isEqualTo(APP_ID);
                        assertThat(view.getApplicationDSL()).isEqualTo(dsl("created", true));
                    })
                    .verifyComplete();
        } else {
            RuntimeException failure = devFailure != null ? devFailure : quotaFailure;
            StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(failure)).verify();
        }
        assertThat(events).isEqualTo(expectedEvents);
        say("createFromTemplate: %s -> %s", label, events);
    }
}

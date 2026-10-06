package org.lowcoder.api.home;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleElement;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.service.BundleElementRelationServiceImpl;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.folder.model.FolderElement;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.interaction.UserApplicationInteraction;
import org.lowcoder.domain.interaction.UserApplicationInteractionService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.domain.user.service.UserStatusService;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Mockito unit tests of {@link UserHomeApiServiceImpl}: profile, home page, the authorised application and bundle
 * listings and the four marketplace / agency listings. Every collaborator is a mock; applications and bundles are real
 * model objects whose live DSL comes from a mocked {@link ApplicationRecordService}.
 *
 * <p>Pinned under D-6, plan §9 row "buildUserProfileView never sets hasShownNewUserGuidance or isEnabled" (test named
 * {@code *_pinsTheSection9Row}). The row "marketplace and agency listings fail" is fixed (BF-034): a DSL setting that is
 * not text and a missing organization fall back instead of failing the listing (tests named {@code *BF034}).
 */
class UserHomeApiServiceImplTest {

    private static final String ORG = "org-1";
    private static final String VISITOR = "visitor-1";
    private static final Instant CREATED = Instant.parse("2024-02-03T04:05:06Z");
    private static final Duration WAIT = Duration.ofSeconds(10);
    /** An organization id with no organization row (a deleted organization). */
    private static final String DELETED_ORG = "org-gone";

    private SessionUserService sessionUserService;
    private OrganizationService organizationService;
    private OrgMemberService orgMemberService;
    private ApplicationService applicationService;
    private ResourcePermissionService permissionService;
    private UserService userService;
    private UserStatusService userStatusService;
    private OrgDevChecker orgDevChecker;
    private FolderApiService folderApiService;
    private UserApplicationInteractionService interactionService;
    private CommonConfig config;
    private BundleElementRelationServiceImpl bundleElementRelationService;
    private BundleService bundleService;
    private ApplicationRecordService recordService;
    private FolderElementRelationService folderElementRelationService;
    private UserHomeApiServiceImpl service;

    @BeforeEach
    void setUp() {
        sessionUserService = mock(SessionUserService.class);
        organizationService = mock(OrganizationService.class);
        orgMemberService = mock(OrgMemberService.class);
        applicationService = mock(ApplicationService.class);
        permissionService = mock(ResourcePermissionService.class);
        userService = mock(UserService.class);
        userStatusService = mock(UserStatusService.class);
        orgDevChecker = mock(OrgDevChecker.class);
        folderApiService = mock(FolderApiService.class);
        interactionService = mock(UserApplicationInteractionService.class);
        config = new CommonConfig();
        bundleElementRelationService = mock(BundleElementRelationServiceImpl.class);
        bundleService = mock(BundleService.class);
        recordService = mock(ApplicationRecordService.class);
        folderElementRelationService = mock(FolderElementRelationService.class);
        service = new UserHomeApiServiceImpl(sessionUserService, organizationService, orgMemberService, applicationService,
                permissionService, userService, userStatusService, orgDevChecker, folderApiService, interactionService, config,
                bundleElementRelationService, bundleService, recordService, folderElementRelationService);

        OrgMember member = OrgMember.builder().orgId(ORG).userId(VISITOR).role(MemberRole.MEMBER).build();
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member));
        when(recordService.getLatestRecordByApplicationId(anyString())).thenReturn(Mono.empty());
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of()));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.empty());
        when(bundleElementRelationService.getByElementIds(anyList())).thenReturn(Flux.empty());
        when(folderElementRelationService.getByElementIds(anyList())).thenReturn(Flux.empty());
        when(interactionService.findByUserId(anyString())).thenReturn(Flux.empty());
        when(orgDevChecker.isCurrentOrgDev()).thenReturn(Mono.just(false));
    }

    // ----------------------------------------------------------------- fixtures

    private static ServerWebExchange exchange() {
        return MockServerWebExchange.from(MockServerHttpRequest.get("/").header("X-Forwarded-For", "203.0.113.7").build());
    }

    private static User user(String id, String name, String password) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setPassword(password);
        user.setCreatedAt(CREATED);
        return user;
    }

    private static Organization org(String id, String name, Map<String, Object> settings) {
        Organization organization = new Organization();
        organization.setId(id);
        organization.setName(name);
        if (settings != null) {
            Organization.OrganizationCommonSettings commonSettings = new Organization.OrganizationCommonSettings();
            commonSettings.putAll(settings);
            organization.setCommonSettings(commonSettings);
        }
        return organization;
    }

    private static Application app(String id, String name, ApplicationType type, ApplicationStatus status, String category, String creator, String orgId) {
        Map<String, Object> dsl = new HashMap<>();
        if (category != null) {
            dsl.put("settings", new HashMap<>(Map.of("category", category)));
        }
        return Application.builder().id(id).name(name).applicationType(type.getValue()).applicationStatus(status)
                .organizationId(orgId).createdBy(creator).createdAt(CREATED).editingApplicationDSL(dsl).build();
    }

    private static Bundle bundle(String id, String name, BundleStatus status, String creator, String orgId) {
        return Bundle.builder().id(id).gid("gid-" + id).name(name).bundleStatus(status).organizationId(orgId)
                .createdBy(creator).createdAt(CREATED).build();
    }

    private static ResourcePermission permission(ResourceRole role) {
        return ResourcePermission.builder().resourceRole(role).build();
    }

    private static <T> List<T> collect(Flux<T> flux) {
        List<T> list = flux.collectList().block(WAIT);
        assertThat(list).isNotNull();
        return list;
    }

    // ------------------------------------------------------------- user profile

    /** Catches the anonymous visitor path reaching into user status or organization data. */
    @Test
    void buildUserProfileView_anonymous_returnsOnlyNameAndIp() {
        User anonymous = new User();
        anonymous.setName("Anonymous");
        anonymous.setIsAnonymous(true);

        StepVerifier.create(service.buildUserProfileView(anonymous, exchange())).assertNext(view -> {
            assertThat(view.isAnonymous()).isTrue();
            assertThat(view.getUsername()).isEqualTo("Anonymous");
            assertThat(view.getIp()).isEqualTo("203.0.113.7");
            assertThat(view.getOrgAndRoles()).isNull();
            assertThat(view.getId()).isNull();
            System.out.println("[UserHomeApiServiceImplTest] anonymous profile ip " + view.getIp());
        }).verifyComplete();

        verifyNoInteractions(userStatusService, orgMemberService, organizationService);
    }

    private void stubProfile(User user, List<OrgMember> members, OrgMember current, List<Organization> orgs, boolean dev) {
        when(userStatusService.findByUserId(user.getId())).thenReturn(Mono.just(UserStatus.builder().statusMap(Map.of("flag", true)).build()));
        when(orgMemberService.getUserOrgMemberInfo(user.getId())).thenReturn(Mono.just(new OrgMemberService.UserOrgMemberInfo(current, members)));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.fromIterable(orgs));
        when(orgDevChecker.isCurrentOrgDev()).thenReturn(Mono.just(dev));
    }

    /** Catches profile fields being dropped or mixed up; hasPassword depends on a non-blank password. */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "secret"})
    void buildUserProfileView_mapsTheUserAndTheOrganizations(String password) {
        User user = user("u1", "Ada", password);
        user.setUiLanguage("de");
        user.setAvatar("avatar-file");
        user.setHasSetNickname(true);
        OrgMember current = OrgMember.builder().orgId("o1").userId("u1").role(MemberRole.ADMIN).build();
        OrgMember other = OrgMember.builder().orgId("o2").userId("u1").role(MemberRole.MEMBER).build();
        stubProfile(user, List.of(current, other), current, List.of(org("o1", "One", null), org("o2", "Two", null)), true);

        StepVerifier.create(service.buildUserProfileView(user, exchange())).assertNext(view -> {
            assertThat(view.getId()).isEqualTo("u1");
            assertThat(view.getUsername()).isEqualTo("Ada");
            assertThat(view.isAnonymous()).isFalse();
            assertThat(view.getUiLanguage()).isEqualTo("de");
            assertThat(view.getAvatar()).isEqualTo("avatar-file");
            assertThat(view.isHasSetNickname()).isTrue();
            assertThat(view.getCurrentOrgId()).isEqualTo("o1");
            assertThat(view.isOrgDev()).isTrue();
            assertThat(view.getCreatedTimeMs()).isEqualTo(CREATED.toEpochMilli());
            assertThat(view.getIp()).isEqualTo("203.0.113.7");
            assertThat(view.getUserStatus()).containsEntry("flag", true);
            assertThat(view.isHasPassword()).isEqualTo("secret".equals(password));
            assertThat(view.getOrgAndRoles()).extracting(r -> r.getOrg().getId(), r -> r.getRole())
                    .containsExactly(org.assertj.core.groups.Tuple.tuple("o1", "admin"), org.assertj.core.groups.Tuple.tuple("o2", "member"));
            System.out.println("[UserHomeApiServiceImplTest] profile of " + view.getUsername() + " hasPassword " + view.isHasPassword());
        }).verifyComplete();
    }

    /**
     * Pins plan §9 row "buildUserProfileView never sets hasShownNewUserGuidance or isEnabled": both profile fields are
     * never set by the builder call, so they are always false, whatever the user status says.
     */
    @Test
    void buildUserProfileView_neverFillsHasShownNewUserGuidanceOrIsEnabled_pinsTheSection9Row() {
        User user = user("u1", "Ada", "x");
        OrgMember current = OrgMember.builder().orgId("o1").userId("u1").role(MemberRole.MEMBER).build();
        stubProfile(user, List.of(current), current, List.of(org("o1", "One", null)), false);
        when(userStatusService.findByUserId("u1")).thenReturn(Mono.just(UserStatus.builder().hasShowNewUserGuidance(true).build()));

        UserProfileView view = service.buildUserProfileView(user, exchange()).block(WAIT);

        assertThat(view.getUserStatus()).containsValue(true);
        assertThat(view.isHasShownNewUserGuidance()).isFalse();
        assertThat(view.isEnabled()).isFalse();
    }

    /**
     * Catches an organization secret leaving in the profile: the password-reset e-mail template is removed from the
     * common settings of every organization, other keys stay. Also catches an organization row that no longer exists
     * being listed. Observation: the sanitised settings are set on the instance the organization service returned.
     */
    @Test
    void buildUserProfileView_sanitisesOrgSettings_andSkipsOrgsWhoseRowIsMissing() {
        User user = user("u1", "Ada", "x");
        OrgMember current = OrgMember.builder().orgId("o1").userId("u1").role(MemberRole.MEMBER).build();
        OrgMember gone = OrgMember.builder().orgId("o-gone").userId("u1").role(MemberRole.MEMBER).build();
        Organization withSecret = org("o1", "One", Map.of(Organization.OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE, "secret template", "theme", "dark"));
        stubProfile(user, List.of(current, gone), current, List.of(withSecret), false);

        UserProfileView view = service.buildUserProfileView(user, exchange()).block(WAIT);

        assertThat(view.getOrgAndRoles()).hasSize(1);
        Organization shown = view.getOrgAndRoles().get(0).getOrg();
        assertThat(shown.getCommonSettings()).containsEntry("theme", "dark")
                .doesNotContainKey(Organization.OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE);
        assertThat(shown).as("the instance from the service is changed in place").isSameAs(withSecret);
        System.out.println("[UserHomeApiServiceImplTest] shown org settings " + shown.getCommonSettings());
    }

    @Test
    void markNewUserGuidanceShown_delegatesAndReturnsTheResult() {
        when(userStatusService.markNewUserGuidanceShown("u1")).thenReturn(Mono.just(true));
        when(userStatusService.markNewUserGuidanceShown("u2")).thenReturn(Mono.just(false));

        StepVerifier.create(service.markNewUserGuidanceShown("u1")).expectNext(true).verifyComplete();
        StepVerifier.create(service.markNewUserGuidanceShown("u2")).expectNext(false).verifyComplete();
    }

    // ------------------------------------------------------------ home page

    @Test
    void getUserHomePageView_withoutACurrentOrg_returnsOnlyTheUser() {
        User visitor = user(VISITOR, "Ada", null);
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(OrgMember.builder().orgId("").userId(VISITOR).role(MemberRole.MEMBER).build()));

        UserHomepageView view = service.getUserHomePageView(ApplicationType.APPLICATION).block(WAIT);

        assertThat(view.getUser()).isSameAs(visitor);
        assertThat(view.getOrganization()).isNull();
        verifyNoInteractions(organizationService, folderApiService);
    }

    @Test
    void getUserHomePageView_withAnOrg_addsTheOrganization_andListsTheRootElements() {
        User visitor = user(VISITOR, "Ada", null);
        Organization organization = org(ORG, "Acme", null);
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        when(organizationService.getById(ORG)).thenReturn(Mono.just(organization));
        when(folderApiService.getElements(null, ApplicationType.MODULE, null, null)).thenReturn(Flux.empty());

        UserHomepageView view = service.getUserHomePageView(ApplicationType.MODULE).block(WAIT);

        assertThat(view.getUser()).isSameAs(visitor);
        assertThat(view.getOrganization()).isSameAs(organization);
        verify(folderApiService).getElements(null, ApplicationType.MODULE, null, null);
    }

    /** Observed, pinned (no §9 row): a current org whose row is gone leaves the whole home page Mono empty. */
    @Test
    void getUserHomePageView_whenTheOrganizationRowIsMissing_completesEmpty() {
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(user(VISITOR, "Ada", null)));
        when(organizationService.getById(ORG)).thenReturn(Mono.empty());
        when(folderApiService.getElements(null, null, null, null)).thenReturn(Flux.empty());

        StepVerifier.create(service.getUserHomePageView(null)).verifyComplete();
        System.out.println("[UserHomeApiServiceImplTest] home page with a missing organization completes empty");
    }

    // ------------------------------------------- authorised applications listing

    private static final Application SALES = app("a-sales", "Sales Dashboard", ApplicationType.APPLICATION, ApplicationStatus.NORMAL, "sales", "u-creator", ORG);
    private static final Application HR = app("a-hr", "HR Portal", ApplicationType.APPLICATION, ApplicationStatus.NORMAL, "hr", "u-creator", ORG);
    private static final Application MODULE_APP = app("a-module", "Sales Module", ApplicationType.MODULE, ApplicationStatus.NORMAL, "sales", "u-creator", ORG);
    private static final Application OLD = app("a-old", "Old sales", ApplicationType.APPLICATION, ApplicationStatus.RECYCLED, "sales", "u-creator", ORG);
    private static final Application HIDDEN = app("a-hidden", "Hidden sales", ApplicationType.APPLICATION, ApplicationStatus.NORMAL, "sales", "u-creator", ORG);

    private void stubApplications(Application... apps) {
        when(applicationService.findByOrganizationIdWithoutDsl(ORG)).thenReturn(Flux.just(apps));
        when(applicationService.findByOrganizationIdWithDsl(ORG)).thenReturn(Flux.just(apps));
        Map<String, ResourcePermission> permitted = new HashMap<>();
        for (Application application : apps) {
            if (!application.getId().equals("a-hidden")) {
                permitted.put(application.getId(), permission(ResourceRole.EDITOR));
            }
        }
        when(permissionService.getMaxMatchingPermission(eq(VISITOR), anyCollection(), eq(ResourceAction.READ_APPLICATIONS))).thenReturn(Mono.just(permitted));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u-creator", user("u-creator", "Creator Name", null))));
    }

    static Stream<Arguments> applicationFilters() {
        return Stream.of(
                Arguments.of(null, null, null, null, List.of("a-sales", "a-hr", "a-module", "a-old")),
                Arguments.of(ApplicationType.ALL, null, null, null, List.of("a-sales", "a-hr", "a-module", "a-old")),
                Arguments.of(ApplicationType.APPLICATION, null, null, null, List.of("a-sales", "a-hr", "a-old")),
                Arguments.of(ApplicationType.MODULE, null, null, null, List.of("a-module")),
                Arguments.of(null, ApplicationStatus.NORMAL, null, null, List.of("a-sales", "a-hr", "a-module")),
                Arguments.of(null, ApplicationStatus.RECYCLED, null, null, List.of("a-old")),
                Arguments.of(null, null, "SALES", null, List.of("a-sales", "a-module", "a-old")),
                Arguments.of(null, null, null, "Hr", List.of("a-hr")),
                Arguments.of(ApplicationType.APPLICATION, ApplicationStatus.NORMAL, "sales", "sales", List.of("a-sales")));
    }

    /**
     * Catches a filter being ignored or inverted (type incl. ALL, status, name and category, case-insensitive) and an
     * application without READ permission appearing (the hidden one is never listed).
     */
    @ParameterizedTest
    @MethodSource("applicationFilters")
    void getAllAuthorisedApplications_appliesTheFilters_andHidesApplicationsWithoutPermission(ApplicationType type, ApplicationStatus status,
                                                                                              String name, String category, List<String> expected) {
        stubApplications(SALES, HR, MODULE_APP, OLD, HIDDEN);

        List<ApplicationInfoView> views = collect(service.getAllAuthorisedApplications4CurrentOrgMember(type, status, false, name, category));

        System.out.println("[UserHomeApiServiceImplTest] filters " + type + "/" + status + "/" + name + "/" + category + " -> "
                + views.stream().map(ApplicationInfoView::getApplicationId).toList());
        assertThat(views).extracting(ApplicationInfoView::getApplicationId).containsExactlyInAnyOrderElementsOf(expected);
    }

    /** Catches the view fields: role, creator name (blank for an unknown creator), last view time, folder, DSL settings. */
    @Test
    void getAllAuthorisedApplications_buildsTheViewFields() {
        Application known = Application.builder().id("a1").name("n1").applicationType(ApplicationType.APPLICATION.getValue())
                .applicationStatus(ApplicationStatus.NORMAL).organizationId(ORG).createdBy("u-creator").createdAt(CREATED)
                .editingApplicationDSL(new HashMap<>(Map.of("settings", new HashMap<>(Map.of("title", "T", "description", "D", "icon", "I", "category", "C")))))
                .publicToAll(true).build();
        Application unknownCreator = app("a2", "n2", ApplicationType.APPLICATION, ApplicationStatus.NORMAL, null, "u-stranger", ORG);
        stubApplications(known, unknownCreator);
        when(permissionService.getMaxMatchingPermission(eq(VISITOR), anyCollection(), eq(ResourceAction.READ_APPLICATIONS)))
                .thenReturn(Mono.just(Map.of("a1", permission(ResourceRole.OWNER), "a2", permission(ResourceRole.VIEWER))));
        when(interactionService.findByUserId(VISITOR)).thenReturn(Flux.just(new UserApplicationInteraction(VISITOR, "a1", Instant.ofEpochMilli(5000))));
        when(folderElementRelationService.getByElementIds(List.of("a1"))).thenReturn(Flux.just(new FolderElement("f-1", "a1")));
        when(bundleElementRelationService.getByElementIds(List.of("a1"))).thenReturn(Flux.just(new BundleElement("b1", "a1", 7L)));
        when(recordService.getLatestRecordByApplicationId("a1")).thenReturn(Mono.just(ApplicationVersion.builder().tag("1.0.0").createdAt(CREATED)
                .applicationDSL(Map.of("settings", Map.of("title", "T", "description", "D", "icon", "I", "category", "C"))).build()));

        List<ApplicationInfoView> views = collect(service.getAllAuthorisedApplications4CurrentOrgMember(null, null, false, null, null));

        ApplicationInfoView first = views.stream().filter(v -> v.getApplicationId().equals("a1")).findFirst().orElseThrow();
        ApplicationInfoView second = views.stream().filter(v -> v.getApplicationId().equals("a2")).findFirst().orElseThrow();
        assertThat(first.getRole()).isEqualTo(ResourceRole.OWNER.getValue());
        assertThat(first.getCreateBy()).isEqualTo("Creator Name");
        assertThat(first.getLastViewTime()).isEqualTo(5000L);
        assertThat(first.getFolderId()).isEqualTo("f-1");
        assertThat(first.getTitle()).isEqualTo("T");
        assertThat(first.getDescription()).isEqualTo("D");
        assertThat(first.getIcon()).isEqualTo("I");
        assertThat(first.getCategory()).isEqualTo("C");
        assertThat(first.isPublished()).isTrue();
        assertThat(first.isPublicToAll()).isTrue();
        assertThat(first.getCreateAt()).isEqualTo(CREATED.toEpochMilli());
        assertThat(second.getRole()).isEqualTo(ResourceRole.VIEWER.getValue());
        assertThat(second.getCreateBy()).as("unknown creator").isEmpty();
        assertThat(second.getLastViewTime()).isZero();
        assertThat(second.getFolderId()).isNull();
        assertThat(second.isPublished()).isFalse();
    }

    /** Catches the DSL-less query being used when the container size is requested, and the reverse. */
    @Test
    void getAllAuthorisedApplications_withContainerSize_readsTheApplicationsWithTheirDsl() {
        stubApplications(MODULE_APP);

        collect(service.getAllAuthorisedApplications4CurrentOrgMember(null, null, true, null, null));
        verify(applicationService).findByOrganizationIdWithDsl(ORG);
        verify(applicationService, never()).findByOrganizationIdWithoutDsl(ORG);
    }

    // ---------------------------------------------------- authorised bundles

    private static Object field(Object target, String name) {
        return ReflectionTestUtils.getField(target, name);
    }

    @Test
    void getAllAuthorisedBundles_filtersByStatus_andByPermission() {
        Bundle normal = bundle("b-normal", "Normal", BundleStatus.NORMAL, "u-creator", ORG);
        Bundle recycled = bundle("b-recycled", "Recycled", BundleStatus.RECYCLED, "u-creator", ORG);
        Bundle hidden = bundle("b-hidden", "Hidden", BundleStatus.NORMAL, "u-creator", ORG);
        when(bundleService.findByUserId(VISITOR)).thenReturn(Flux.just(normal, recycled, hidden));
        when(permissionService.getMaxMatchingPermission(eq(VISITOR), anyCollection(), eq(ResourceAction.READ_BUNDLES)))
                .thenReturn(Mono.just(Map.of("b-normal", permission(ResourceRole.VIEWER), "b-recycled", permission(ResourceRole.VIEWER))));

        List<BundleInfoView> all = collect(service.getAllAuthorisedBundles4CurrentOrgMember(null));
        List<BundleInfoView> onlyRecycled = collect(service.getAllAuthorisedBundles4CurrentOrgMember(BundleStatus.RECYCLED));

        assertThat(all).extracting(v -> field(v, "bundleId")).containsExactlyInAnyOrder("b-normal", "b-recycled");
        assertThat(onlyRecycled).extracting(v -> field(v, "bundleId")).containsExactly("b-recycled");
        assertThat(field(all.get(0), "bundleGid")).isEqualTo("gid-" + field(all.get(0), "bundleId"));
        assertThat(field(all.get(0), "createBy")).isEqualTo("u-creator");
        assertThat(all.get(0).getCreateTime()).isEqualTo(CREATED.toEpochMilli());
    }

    // ---------------------------------------------------- marketplace listings

    private void signedIn(boolean anonymous, boolean privateMode) {
        when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(anonymous));
        config.getMarketplace().setPrivateMode(privateMode);
    }

    private Application marketplaceApp(String id, String name, ApplicationType type, String creator, String orgId, Instant createdAt) {
        return Application.builder().id(id).name(name).applicationType(type.getValue()).applicationStatus(ApplicationStatus.NORMAL)
                .organizationId(orgId).createdBy(creator).createdAt(createdAt).build();
    }

    private void stubDsl(String appId, Map<String, Object> dsl) {
        when(recordService.getLatestRecordByApplicationId(appId)).thenReturn(Mono.just(ApplicationVersion.builder().applicationDSL(dsl).build()));
    }

    /** Catches the private-mode rule: anonymous visitors see nothing, and the marketplace is not even queried. */
    @Test
    void getAllMarketplaceApplications_privateModeHidesTheListingFromAnonymousVisitors() {
        when(applicationService.findAllMarketplaceApps()).thenReturn(Flux.just(marketplaceApp("m1", "n", ApplicationType.APPLICATION, "u1", ORG, CREATED)));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));

        signedIn(true, true);
        assertThat(collect(service.getAllMarketplaceApplications(null))).isEmpty();
        verify(applicationService, never()).findAllMarketplaceApps();

        signedIn(false, true);
        assertThat(collect(service.getAllMarketplaceApplications(null))).hasSize(1);

        signedIn(true, false);
        assertThat(collect(service.getAllMarketplaceApplications(null))).hasSize(1);
    }

    /** Catches the type filter, the org and creator fallbacks (blank), and createAt falling back to 0. */
    @Test
    void getAllMarketplaceApplications_filtersByType_andFallsBackForMissingOrgCreatorAndDate() {
        signedIn(false, true);
        Application full = marketplaceApp("m-full", "Full", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        Application bare = marketplaceApp("m-bare", "Bare", ApplicationType.APPLICATION, "u-gone", "org-gone", null);
        Application module = marketplaceApp("m-module", "Module", ApplicationType.MODULE, "u1", ORG, CREATED);
        when(applicationService.findAllMarketplaceApps()).thenReturn(Flux.just(full, bare, module));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u1", user("u1", "creator@example.com", null))));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));

        List<MarketplaceApplicationInfoView> all = collect(service.getAllMarketplaceApplications(null));
        List<MarketplaceApplicationInfoView> modules = collect(service.getAllMarketplaceApplications(ApplicationType.MODULE));

        MarketplaceApplicationInfoView fullView = all.stream().filter(v -> v.getApplicationId().equals("m-full")).findFirst().orElseThrow();
        MarketplaceApplicationInfoView bareView = all.stream().filter(v -> v.getApplicationId().equals("m-bare")).findFirst().orElseThrow();
        assertThat(all).hasSize(3);
        assertThat(modules).extracting(MarketplaceApplicationInfoView::getApplicationId).containsExactly("m-module");
        assertThat(fullView.getOrgName()).isEqualTo("Acme");
        assertThat(fullView.getCreatorEmail()).isEqualTo("creator@example.com");
        assertThat(fullView.getCreateAt()).isEqualTo(CREATED.toEpochMilli());
        assertThat(bareView.getOrgName()).as("missing organization falls back").isEmpty();
        assertThat(bareView.getCreatorEmail()).as("missing creator falls back").isEmpty();
        assertThat(bareView.getCreateAt()).isZero();
        System.out.println("[UserHomeApiServiceImplTest] marketplace fallbacks: org '" + bareView.getOrgName() + "', creator '" + bareView.getCreatorEmail() + "'");
    }

    /** Catches the marketplace fields: they come from the published DSL settings, with defaults when it has none. */
    @Test
    void getAllMarketplaceApplications_readsTitleCategoryDescriptionAndIconFromThePublishedSettings() {
        signedIn(false, true);
        Application withSettings = marketplaceApp("m-set", "App name", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        Application noDsl = marketplaceApp("m-nodsl", "No dsl", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        Application noSettingsKey = marketplaceApp("m-nokey", "No key", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        Application settingsNotAMap = marketplaceApp("m-notmap", "Not a map", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        Application noTitle = marketplaceApp("m-notitle", "No title", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        when(applicationService.findAllMarketplaceApps()).thenReturn(Flux.just(withSettings, noDsl, noSettingsKey, settingsNotAMap, noTitle));
        stubDsl("m-set", Map.of("settings", Map.of("title", "Shown title", "category", "cat", "description", "desc", "icon", "icon.png")));
        stubDsl("m-nokey", Map.of("other", 1));
        stubDsl("m-notmap", Map.of("settings", "just text"));
        stubDsl("m-notitle", Map.of("settings", Map.of("category", "cat")));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));

        Map<String, MarketplaceApplicationInfoView> byId = new HashMap<>();
        collect(service.getAllMarketplaceApplications(null)).forEach(v -> byId.put(v.getApplicationId(), v));

        MarketplaceApplicationInfoView set = byId.get("m-set");
        assertThat(set.getTitle()).isEqualTo("Shown title");
        assertThat(set.getCategory()).isEqualTo("cat");
        assertThat(set.getDescription()).isEqualTo("desc");
        assertThat(set.getImage()).isEqualTo("icon.png");
        for (String id : List.of("m-nodsl", "m-nokey", "m-notmap")) {
            assertThat(byId.get(id).getTitle()).as(id + " title defaults to the name").isEqualTo(byId.get(id).getName());
            assertThat(byId.get(id).getCategory()).as(id).isNull();
            assertThat(byId.get(id).getImage()).as(id).isNull();
        }
        assertThat(byId.get("m-notitle").getTitle()).isEqualTo("No title");
        assertThat(byId.get("m-notitle").getCategory()).isEqualTo("cat");
    }

    /**
     * BF-034 fixed (part 1): a published DSL whose settings are not text (a number title, a number category, a map
     * description, a list icon) failed the whole listing with a ClassCastException. Now the title falls back to the
     * application name, the other fields are null, and the other applications are still listed.
     */
    @Test
    void getAllMarketplaceApplications_settingsThatAreNotText_fallBackAndTheListingContinuesBF034() {
        signedIn(false, true);
        when(applicationService.findAllMarketplaceApps()).thenReturn(Flux.just(
                marketplaceApp("m-bad", "Bad", ApplicationType.APPLICATION, "u1", ORG, CREATED),
                marketplaceApp("m-good", "Good", ApplicationType.APPLICATION, "u1", ORG, CREATED)));
        stubDsl("m-bad", Map.of("settings", Map.of("title", 42, "category", 7, "description", Map.of("text", "x"), "icon", List.of("a.png"))));
        stubDsl("m-good", Map.of("settings", Map.of("title", "Shown title")));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));

        Map<String, MarketplaceApplicationInfoView> byId = new HashMap<>();
        collect(service.getAllMarketplaceApplications(null)).forEach(v -> byId.put(v.getApplicationId(), v));

        MarketplaceApplicationInfoView bad = byId.get("m-bad");
        System.out.println("[UserHomeApiServiceImplTest] settings that are not text -> title '" + bad.getTitle() + "', category "
                + bad.getCategory() + ", description " + bad.getDescription() + ", image " + bad.getImage());
        assertThat(byId).containsOnlyKeys("m-bad", "m-good");
        assertThat(bad.getTitle()).as("a title that is not text falls back to the name").isEqualTo("Bad");
        assertThat(bad.getCategory()).isNull();
        assertThat(bad.getDescription()).isNull();
        assertThat(bad.getImage()).isNull();
        assertThat(byId.get("m-good").getTitle()).isEqualTo("Shown title");
    }

    // ------------------------------------------------------- agency / bundles

    @Test
    void getAllAgencyProfileApplications_filtersByType_andBuildsTheView() {
        Application first = marketplaceApp("g1", "One", ApplicationType.APPLICATION, "u1", ORG, CREATED);
        Application module = marketplaceApp("g2", "Two", ApplicationType.MODULE, "u-gone", ORG, CREATED);
        when(applicationService.findAllAgencyProfileApps()).thenReturn(Flux.just(first, module));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u1", user("u1", "creator@example.com", null))));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));

        List<MarketplaceApplicationInfoView> all = collect(service.getAllAgencyProfileApplications(null));
        List<MarketplaceApplicationInfoView> modules = collect(service.getAllAgencyProfileApplications(ApplicationType.MODULE));

        assertThat(all).hasSize(2);
        assertThat(modules).extracting(MarketplaceApplicationInfoView::getApplicationId).containsExactly("g2");
        MarketplaceApplicationInfoView view = all.stream().filter(v -> v.getApplicationId().equals("g1")).findFirst().orElseThrow();
        assertThat(view.getOrgName()).isEqualTo("Acme");
        assertThat(view.getOrgId()).isEqualTo(ORG);
        assertThat(view.getCreatorEmail()).isEqualTo("creator@example.com");
        assertThat(view.getCreateAt()).isEqualTo(CREATED.toEpochMilli());
        assertThat(modules.get(0).getCreatorEmail()).as("unknown creator").isEmpty();
    }

    /**
     * BF-034 fixed (part 2): an agency application whose organization row is missing failed the whole listing with a
     * NullPointerException. Now its organization name is blank, as getAllMarketplaceApplications does, and the application
     * of an existing organization is listed too.
     */
    @Test
    void getAllAgencyProfileApplications_missingOrganization_hasABlankOrgNameAndTheListingContinuesBF034() {
        when(applicationService.findAllAgencyProfileApps()).thenReturn(Flux.just(
                marketplaceApp("g1", "One", ApplicationType.APPLICATION, "u1", DELETED_ORG, CREATED),
                marketplaceApp("g2", "Two", ApplicationType.APPLICATION, "u1", ORG, CREATED)));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));

        Map<String, MarketplaceApplicationInfoView> byId = new HashMap<>();
        collect(service.getAllAgencyProfileApplications(null)).forEach(v -> byId.put(v.getApplicationId(), v));

        System.out.println("[UserHomeApiServiceImplTest] agency application, missing org -> org name '" + byId.get("g1").getOrgName() + "'");
        assertThat(byId).containsOnlyKeys("g1", "g2");
        assertThat(byId.get("g1").getOrgName()).isEmpty();
        assertThat(byId.get("g1").getOrgId()).isEqualTo(DELETED_ORG);
        assertThat(byId.get("g2").getOrgName()).isEqualTo("Acme");
    }

    private void stubBundleCollaborators(Bundle... bundles) {
        when(bundleService.findAllMarketplaceBundles()).thenReturn(Flux.just(bundles));
        when(bundleService.findAllAgencyProfileBundles()).thenReturn(Flux.just(bundles));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u1", user("u1", "creator@example.com", null))));
        when(organizationService.getByIds(anyCollection())).thenReturn(Flux.just(org(ORG, "Acme", null)));
    }

    /** Catches the bundle view fields in both bundle listings, and the creator fallback (blank). */
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void bundleListings_buildTheView(boolean agency) {
        signedIn(false, true);
        stubBundleCollaborators(bundle("b1", "Bundle", BundleStatus.NORMAL, "u1", ORG), bundle("b2", "Other", BundleStatus.RECYCLED, "u-gone", ORG));

        List<MarketplaceBundleInfoView> views = collect(agency ? service.getAllAgencyProfileBundles() : service.getAllMarketplaceBundles());

        assertThat(views).hasSize(2);
        MarketplaceBundleInfoView first = views.stream().filter(v -> v.getBundleId().equals("b1")).findFirst().orElseThrow();
        MarketplaceBundleInfoView second = views.stream().filter(v -> v.getBundleId().equals("b2")).findFirst().orElseThrow();
        assertThat(first.getBundleGid()).isEqualTo("gid-b1");
        assertThat(first.getName()).isEqualTo("Bundle");
        assertThat(first.getBundleStatus()).isEqualTo(BundleStatus.NORMAL);
        assertThat(first.getOrgId()).isEqualTo(ORG);
        assertThat(first.getOrgName()).isEqualTo("Acme");
        assertThat(first.getCreatorEmail()).isEqualTo("creator@example.com");
        assertThat(first.getCreateAt()).isEqualTo(CREATED.toEpochMilli());
        assertThat(first.getCreateBy()).isEqualTo("u1");
        assertThat(second.getBundleStatus()).isEqualTo(BundleStatus.RECYCLED);
        assertThat(second.getCreatorEmail()).isEmpty();
        System.out.println("[UserHomeApiServiceImplTest] " + (agency ? "agency" : "marketplace") + " bundles " + views.size());
    }

    /** Catches the private-mode rule for bundles (the agency listing has none: it only needs a session org member). */
    @Test
    void getAllMarketplaceBundles_privateModeHidesTheListingFromAnonymousVisitors() {
        stubBundleCollaborators(bundle("b1", "Bundle", BundleStatus.NORMAL, "u1", ORG));

        signedIn(true, true);
        assertThat(collect(service.getAllMarketplaceBundles())).isEmpty();
        verify(bundleService, never()).findAllMarketplaceBundles();

        signedIn(false, true);
        assertThat(collect(service.getAllMarketplaceBundles())).hasSize(1);
        signedIn(true, false);
        assertThat(collect(service.getAllMarketplaceBundles())).hasSize(1);
    }

    /**
     * BF-034 fixed (part 2) for both bundle listings: a bundle whose organization row is missing failed the whole listing
     * with a NullPointerException. Now its organization name is blank and the bundle of an existing organization is listed too.
     */
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void bundleListings_missingOrganization_haveABlankOrgNameAndTheListingContinuesBF034(boolean agency) {
        signedIn(false, true);
        stubBundleCollaborators(bundle("b1", "Bundle", BundleStatus.NORMAL, "u1", DELETED_ORG), bundle("b2", "Other", BundleStatus.NORMAL, "u1", ORG));

        Map<String, MarketplaceBundleInfoView> byId = new HashMap<>();
        collect(agency ? service.getAllAgencyProfileBundles() : service.getAllMarketplaceBundles()).forEach(v -> byId.put(v.getBundleId(), v));

        System.out.println("[UserHomeApiServiceImplTest] " + (agency ? "agency" : "marketplace") + " bundle, missing org -> org name '"
                + byId.get("b1").getOrgName() + "'");
        assertThat(byId).containsOnlyKeys("b1", "b2");
        assertThat(byId.get("b1").getOrgName()).isEmpty();
        assertThat(byId.get("b2").getOrgName()).isEqualTo("Acme");
    }
}

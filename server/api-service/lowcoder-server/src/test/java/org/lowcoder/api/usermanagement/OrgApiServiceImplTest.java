package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.event.OrgMemberLeftEvent;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.OrgMemberState;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.serverlog.ServerLogService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfig.Workspace;
import org.lowcoder.sdk.constants.GlobalContext;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.http.codec.multipart.Part;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link OrgApiServiceImpl} with every collaborator mocked: the roster, the admin gate of every organization
 * mutation, role changes, switching the current organization, leaving and removing members, removing and creating
 * organizations, and the domain check. "Not mutated" is asserted by subscription counters on the mocked service Monos:
 * {@code updateRoleForMember} and {@code removeUserFromOrg} assemble {@code .then(orgMemberService...)} eagerly, so
 * {@code verify(never())} on the call itself would not show a mutation.
 *
 * <p>The plan section 9 subList row, second site {@code OrgApiServiceImpl.getOrgMemberListView}, is fixed (BF-086): a
 * page past the end and page 0 are an empty page with the total (see
 * {@link #getOrganizationMembers_pageOutsideTheMembers_isAnEmptyPageWithTheTotalBF086}).
 * The plan section 9 row "removeUserFromOrg has no last-admin or super-admin guard" is fixed (BF-072): see
 * {@link #removeUserFromOrg_refusesASuperAdminAndTheLastAdmin}.
 * The plan section 9 row "updateRoleForMember ... an org ADMIN can make any member, themselves included, super_admin ...
 * skips the quota", including the demotion of a SUPER_ADMIN by an ADMIN, is fixed (BF-005): see
 * {@link #updateRoleForMember_superAdminRole_isRefusedForEveryVisitorAndTarget} and
 * {@link #updateRoleForMember_targetIsSuperAdmin_isRefusedForEveryVisitor}.
 */
@ExtendWith(MockitoExtension.class)
class OrgApiServiceImplTest {

    private static final String LOG_PREFIX = "[OrgApiServiceImplTest] ";

    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String VISITOR_ID = "visitor-1";
    private static final String TARGET_ID = "target-1";
    private static final String SUPER_ADMIN_ID = "super-1";
    private static final String DEV_GROUP_ID = "dev-group";
    private static final String DEFAULT_DOMAIN = "default.example";
    private static final String ORG_DOMAIN = "org.example";
    private static final String COOKIE_NAME = "LOWCODER_CE_SELFHOST_TOKEN";
    private static final String GITHUB = "GITHUB";
    private static final String GOOGLE = "GOOGLE";

    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private OrgMemberService orgMemberService;
    @Mock
    private UserService userService;
    @Mock
    private OrganizationService organizationService;
    @Mock
    private AbstractBizThresholdChecker bizThresholdChecker;
    @Mock
    private ApplicationContext applicationContext;
    @Mock
    private CommonConfig commonConfig;
    @Mock
    private GroupService groupService;
    @Mock
    private AuthenticationService authenticationService;
    @Mock
    private ServerLogService serverLogService;
    @Mock
    private GroupMemberService groupMemberService;

    @InjectMocks
    private OrgApiServiceImpl service;

    private final AtomicInteger mutations = new AtomicInteger();
    private final List<String> events = new ArrayList<>();

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    private static OrgMember orgMember(String orgId, String userId, MemberRole role, OrgMemberState state) {
        return new OrgMember(orgId, userId, role, state.getValue(), 100L);
    }

    private static User user(String id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    private <T> Mono<T> counting(T value) {
        return Mono.defer(() -> {
            mutations.incrementAndGet();
            return Mono.just(value);
        });
    }

    private Mono<Void> countingVoid() {
        return Mono.defer(() -> {
            mutations.incrementAndGet();
            return Mono.empty();
        });
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.just(value);
        });
    }

    private Mono<Void> loggedVoid(String event, RuntimeException failure) {
        return Mono.defer(() -> {
            events.add(event);
            return failure == null ? Mono.empty() : Mono.error(failure);
        });
    }

    private void stubVisitor() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
    }

    /** The visitor's role in the org; null means the visitor is not a member. */
    private void stubVisitorRole(String orgId, MemberRole role) {
        stubVisitor();
        lenient().when(orgMemberService.getOrgMember(orgId, VISITOR_ID))
                .thenReturn(role == null ? Mono.empty() : Mono.just(orgMember(orgId, VISITOR_ID, role, OrgMemberState.NORMAL)));
    }

    /** The target's membership, as the super admin check and the removal check read it (logged as "target read"); null: not a member. */
    private void stubTargetRole(String userId, MemberRole role) {
        lenient().when(orgMemberService.getOrgMember(ORG_ID, userId)).thenReturn(Mono.defer(() -> {
            events.add("target read");
            return role == null ? Mono.empty() : Mono.just(orgMember(ORG_ID, userId, role, OrgMemberState.NORMAL));
        }));
    }

    private Workspace stubWorkspace(WorkspaceMode mode, String enterpriseOrgId) {
        Workspace workspace = new Workspace();
        workspace.setMode(mode);
        workspace.setEnterpriseOrgId(enterpriseOrgId);
        lenient().when(commonConfig.getWorkspace()).thenReturn(workspace);
        return workspace;
    }

    // ------------------------------------------------------------------ getOrganizationMembers

    private static Connection connection(String source, Set<String> orgIds, Map<String, Object> rawUserInfo) {
        return Connection.builder().source(source).rawId("raw-" + source).orgIds(new HashSet<>(orgIds)).rawUserInfo(rawUserInfo).build();
    }

    private void stubRoster() {
        stubVisitorRole(ORG_ID, MemberRole.MEMBER);
        lenient().when(sessionUserService.getVisitorOrgMemberCache())
                .thenReturn(Mono.just(orgMember(ORG_ID, VISITOR_ID, MemberRole.ADMIN, OrgMemberState.CURRENT)));
        lenient().when(orgMemberService.getOrganizationMembers(ORG_ID)).thenReturn(Flux.just(
                orgMember(ORG_ID, "u1", MemberRole.ADMIN, OrgMemberState.NORMAL),
                orgMember(ORG_ID, "u2", MemberRole.MEMBER, OrgMemberState.NORMAL),
                orgMember(ORG_ID, "u3", MemberRole.MEMBER, OrgMemberState.NORMAL),
                orgMember(ORG_ID, "u4", MemberRole.MEMBER, OrgMemberState.NORMAL)));
        User one = user("u1", "One");
        one.getConnections().add(connection(GITHUB, Set.of(ORG_ID), Map.of("login", "one")));
        one.getConnections().add(connection(GITHUB, Set.of(ORG_ID), Map.of("login", "one")));
        User two = user("u2", "Two");
        two.getConnections().add(connection(GITHUB, Set.of(ORG_ID), null));
        two.getConnections().add(connection(GOOGLE, Set.of(OTHER_ORG_ID), Map.of("g", 1)));
        // u3 has no user record
        lenient().when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u1", one, "u2", two, "u4", user("u4", "Four"))));
    }

    static Stream<Arguments> rawUserInfoRows() {
        return Stream.of(
                Arguments.of(true, Map.of(GITHUB, Map.<String, Object>of())),
                Arguments.of(false, Map.of(GITHUB, Map.<String, Object>of(), GOOGLE, Map.<String, Object>of("g", 1))));
    }

    /**
     * Catches an organization roster served to a non-member (NOT_AUTHORIZED, and the member list is never subscribed),
     * and the wrong view: members without a user record are dropped and not counted, the visitor role is the cached
     * org member's, raw user infos are keyed by connection source with the first duplicate kept, and a connection
     * whose {@code rawUserInfo} is null yields an empty map ({@code Connection.getRawUserInfo()} never returns null, so
     * the listing does not fail). In cloud mode only connections that contain the org are shown, otherwise all.
     */
    @ParameterizedTest(name = "cloud={0}")
    @MethodSource("rawUserInfoRows")
    void getOrganizationMembers_buildsTheViewForAMember(boolean cloud, Map<String, Map<String, Object>> expectedTwoInfos) {
        stubRoster();
        when(commonConfig.isCloud()).thenReturn(cloud);

        StepVerifier.create(service.getOrganizationMembers(ORG_ID, 1, 10))
                .assertNext(view -> {
                    assertThat(view.getMembers()).extracting(OrgMemberView::getUserId).containsExactly("u1", "u2", "u4");
                    assertThat(view.getTotal()).isEqualTo(3);
                    assertThat(view.getVisitorRole()).isEqualTo(MemberRole.ADMIN.getValue());
                    assertThat(view.getMembers()).extracting(OrgMemberView::getRole)
                            .containsExactly(MemberRole.ADMIN.getValue(), MemberRole.MEMBER.getValue(), MemberRole.MEMBER.getValue());
                    assertThat(view.getMembers().get(0).getName()).isEqualTo("One");
                    assertThat(view.getMembers().get(0).getJoinTime()).isEqualTo(100L);
                    assertThat(view.getMembers().get(0).getRawUserInfos()).isEqualTo(Map.of(GITHUB, Map.of("login", "one")));
                    assertThat(view.getMembers().get(1).getRawUserInfos()).isEqualTo(expectedTwoInfos);
                    assertThat(view.getMembers().get(2).getRawUserInfos()).isEmpty();
                })
                .verifyComplete();
        say("getOrganizationMembers cloud=%s: u3 dropped, total 3, raw infos of u2 %s", cloud, expectedTwoInfos);
    }

    /**
     * Catches the roster read before the membership check: a visitor who is not in the org gets NOT_AUTHORIZED and the
     * org member list is not subscribed.
     */
    @Test
    void getOrganizationMembers_visitorNotInTheOrganization_isNotAuthorizedAndReadsNoRoster() {
        stubVisitorRole(ORG_ID, null);
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.empty());
        when(orgMemberService.getOrganizationMembers(ORG_ID)).thenReturn(Flux.defer(() -> {
            mutations.incrementAndGet();
            return Flux.empty();
        }));

        StepVerifier.create(service.getOrganizationMembers(ORG_ID, 1, 10))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();
        assertThat(mutations).hasValue(0);
        say("getOrganizationMembers: non-member -> NOT_AUTHORIZED, roster not read");
    }

    static Stream<Arguments> pages() {
        return Stream.of(
                Arguments.of(1, 2, List.of("u1", "u2")),
                Arguments.of(2, 2, List.of("u4")),
                Arguments.of(1, 0, List.of("u1", "u2", "u4")),
                Arguments.of(1, 10, List.of("u1", "u2", "u4")),
                // the page right after an exactly full last page: from == to, empty and no error
                Arguments.of(2, 3, List.<String>of()));
    }

    /**
     * Catches an off-by-one in the page slice, a total that is the page size, and {@code count == 0} not meaning all.
     */
    @ParameterizedTest(name = "page {0} count {1} -> {2}")
    @MethodSource("pages")
    void getOrganizationMembers_pagination(int page, int count, List<String> expectedIds) {
        stubRoster();
        lenient().when(commonConfig.isCloud()).thenReturn(false);

        StepVerifier.create(service.getOrganizationMembers(ORG_ID, page, count))
                .assertNext(view -> {
                    assertThat(view.getMembers()).extracting(OrgMemberView::getUserId).isEqualTo(expectedIds);
                    assertThat(view.getTotal()).isEqualTo(3);
                    assertThat(view.getPageNum()).isEqualTo(page);
                    assertThat(view.getPageSize()).isEqualTo(count);
                })
                .verifyComplete();
        say("getOrganizationMembers page %d count %d -> %s", page, count, expectedIds);
    }

    /**
     * BF-086 (fixed; was pinned as the plan section 9 subList row at its second site, {@code getOrgMemberListView}: the
     * unchecked {@code subList} failed with an IllegalArgumentException for a page after the last and an
     * IndexOutOfBoundsException for page 0): three resolvable members, a page after the last (3 or 4 of size 2) or before
     * the first (0) is an empty page with the full total and the requested paging.
     */
    @ParameterizedTest
    @ValueSource(ints = {0, 3, 4})
    void getOrganizationMembers_pageOutsideTheMembers_isAnEmptyPageWithTheTotalBF086(int page) {
        stubRoster();
        lenient().when(commonConfig.isCloud()).thenReturn(false);

        StepVerifier.create(service.getOrganizationMembers(ORG_ID, page, 2))
                .assertNext(view -> {
                    say("getOrganizationMembers: page %d size 2 over 3 members -> members %s, total %d", page, view.getMembers(), view.getTotal());
                    assertThat(view.getMembers()).isEmpty();
                    assertThat(view.getTotal()).isEqualTo(3);
                    assertThat(view.getPageNum()).isEqualTo(page);
                    assertThat(view.getPageSize()).isEqualTo(2);
                })
                .verifyComplete();
    }

    // ------------------------------------------------------------------ the admin gate

    static Stream<Arguments> adminRoles() {
        return Stream.of(
                Arguments.of((MemberRole) null, false),
                Arguments.of(MemberRole.MEMBER, false),
                Arguments.of(MemberRole.ADMIN, true),
                Arguments.of(MemberRole.SUPER_ADMIN, true));
    }

    /**
     * Catches a MEMBER or an outsider passing {@code checkVisitorAdminRole}: only ADMIN and SUPER_ADMIN pass (and get
     * their org member back), everything else is NOT_AUTHORIZED.
     */
    @ParameterizedTest(name = "role {0} -> admitted {1}")
    @MethodSource("adminRoles")
    void checkVisitorAdminRole_onlyAdminsPass(MemberRole role, boolean admitted) {
        stubVisitorRole(ORG_ID, role);

        if (admitted) {
            StepVerifier.create(service.checkVisitorAdminRole(ORG_ID))
                    .assertNext(member -> assertThat(member.getRole()).isEqualTo(role)).verifyComplete();
        } else {
            StepVerifier.create(service.checkVisitorAdminRole(ORG_ID))
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")).verify();
        }
        say("checkVisitorAdminRole: role %s -> admitted=%s", role, admitted);
    }

    enum AdminOperation {
        UPDATE_ROLE(1), DELETE_LOGO(1), UPLOAD_LOGO(2), REMOVE_USER(2), REMOVE_ORG(1), UPDATE(1), UPDATE_SETTINGS(1), API_USAGE(1);

        final int subscriptionsWhenAllowed;

        AdminOperation(int subscriptionsWhenAllowed) {
            this.subscriptionsWhenAllowed = subscriptionsWhenAllowed;
        }
    }

    private Mono<?> invoke(AdminOperation operation, Part part) {
        UpdateRoleRequest roleRequest = new UpdateRoleRequest();
        roleRequest.setUserId(TARGET_ID);
        roleRequest.setRole(MemberRole.MEMBER.getValue());
        UpdateOrgRequest updateRequest = new UpdateOrgRequest();
        updateRequest.setOrgName("renamed");
        return switch (operation) {
            case UPDATE_ROLE -> service.updateRoleForMember(ORG_ID, roleRequest);
            case DELETE_LOGO -> service.deleteLogo(ORG_ID);
            case UPLOAD_LOGO -> service.uploadLogo(ORG_ID, counting(part));
            case REMOVE_USER -> service.removeUserFromOrg(ORG_ID, TARGET_ID);
            case REMOVE_ORG -> service.removeOrg(ORG_ID);
            case UPDATE -> service.update(ORG_ID, updateRequest);
            case UPDATE_SETTINGS -> service.updateOrgCommonSettings(ORG_ID, "k", "v");
            case API_USAGE -> service.getApiUsageCount(ORG_ID, true);
        };
    }

    private Object resultOf(AdminOperation operation) {
        return operation == AdminOperation.API_USAGE ? (Object) 5L : (Object) Boolean.TRUE;
    }

    static Stream<Arguments> adminOperations() {
        List<Arguments> args = new ArrayList<>();
        for (AdminOperation operation : AdminOperation.values()) {
            args.add(Arguments.of(operation, (MemberRole) null, false));
            args.add(Arguments.of(operation, MemberRole.MEMBER, false));
            args.add(Arguments.of(operation, MemberRole.ADMIN, true));
        }
        return args.stream();
    }

    /**
     * Catches mutate-before-authorise on the organization: a visitor who is not an admin of the org gets NOT_AUTHORIZED
     * and none of the mocked service Monos (updateMemberRole, deleteLogo, uploadLogo and its file, removeMember and
     * the user marking, delete, update, updateCommonSettings, getApiUsageCount) is subscribed; an admin reaches them
     * with the right arguments.
     */
    @ParameterizedTest(name = "{0} as {1}")
    @MethodSource("adminOperations")
    void adminOperation_requiresAnAdminOfTheOrganization(AdminOperation operation, MemberRole role, boolean allowed) {
        stubVisitorRole(ORG_ID, role);
        stubTargetRole(TARGET_ID, MemberRole.MEMBER);
        stubWorkspace(WorkspaceMode.SAAS, null);
        Part part = mock(Part.class);
        lenient().when(orgMemberService.updateMemberRole(ORG_ID, TARGET_ID, MemberRole.MEMBER)).thenReturn(counting(true));
        lenient().when(organizationService.deleteLogo(ORG_ID)).thenReturn(counting(true));
        lenient().when(organizationService.uploadLogo(ORG_ID, part)).thenReturn(counting(true));
        lenient().when(orgMemberService.removeMember(ORG_ID, TARGET_ID)).thenReturn(counting(true));
        lenient().when(userService.markUserDeletedAndInvalidConnectionsAtEnterpriseMode(TARGET_ID)).thenReturn(counting(true));
        lenient().when(organizationService.delete(ORG_ID)).thenReturn(counting(true));
        lenient().when(organizationService.update(eq(ORG_ID), any(Organization.class))).thenReturn(counting(true));
        lenient().when(organizationService.updateCommonSettings(ORG_ID, "k", "v")).thenReturn(counting(true));
        lenient().when(serverLogService.getApiUsageCount(ORG_ID, true)).thenReturn(counting(5L));

        @SuppressWarnings("unchecked")
        Mono<Object> result = (Mono<Object>) invoke(operation, part);

        if (allowed) {
            StepVerifier.create(result).expectNext(resultOf(operation)).verifyComplete();
            assertThat(mutations).hasValue(operation.subscriptionsWhenAllowed);
        } else {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")).verify();
            assertThat(mutations).hasValue(0);
        }
        say("%s as %s -> allowed=%s, service subscriptions %d", operation, role, allowed, mutations.get());
    }

    // ------------------------------------------------------------------ updateRoleForMember

    private UpdateRoleRequest roleRequest(String userId, String role) {
        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setUserId(userId);
        request.setRole(role);
        return request;
    }

    /**
     * Catches the developer quota bypass: for the role "admin" the target's role is read, then the dev group is looked
     * up and {@code checkMaxDeveloperCount(orgId, devGroupId, userId)} completes before {@code updateMemberRole}; a quota
     * error stops the update; an org without a dev group goes straight to the update.
     */
    @Test
    void updateRoleForMember_roleAdmin_checksTheDeveloperQuotaBeforeUpdating() {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        stubTargetRole(TARGET_ID, MemberRole.MEMBER);
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.just(Group.builder().id(DEV_GROUP_ID).build()));
        when(bizThresholdChecker.checkMaxDeveloperCount(ORG_ID, DEV_GROUP_ID, TARGET_ID)).thenReturn(loggedVoid("quota", null));
        when(orgMemberService.updateMemberRole(ORG_ID, TARGET_ID, MemberRole.ADMIN)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(TARGET_ID, "admin"))).expectNext(true).verifyComplete();

        assertThat(events).containsExactly("target read", "quota", "update");
        say("updateRoleForMember role admin: %s", events);
    }

    @Test
    void updateRoleForMember_roleAdmin_quotaExceeded_updatesNothing() {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        stubTargetRole(TARGET_ID, MemberRole.MEMBER);
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.just(Group.builder().id(DEV_GROUP_ID).build()));
        when(bizThresholdChecker.checkMaxDeveloperCount(ORG_ID, DEV_GROUP_ID, TARGET_ID))
                .thenReturn(loggedVoid("quota", new BizException(BizError.EXCEED_MAX_DEVELOPER_COUNT, "EXCEED_MAX_DEVELOPER_COUNT")));
        lenient().when(orgMemberService.updateMemberRole(ORG_ID, TARGET_ID, MemberRole.ADMIN)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(TARGET_ID, "admin")))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.EXCEED_MAX_DEVELOPER_COUNT, "EXCEED_MAX_DEVELOPER_COUNT"))
                .verify();
        assertThat(events).containsExactly("target read", "quota");
        say("updateRoleForMember role admin over quota -> EXCEED_MAX_DEVELOPER_COUNT, role not updated");
    }

    @Test
    void updateRoleForMember_roleAdmin_orgWithoutDevGroup_updatesWithoutQuotaCall() {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        stubTargetRole(TARGET_ID, MemberRole.MEMBER);
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.empty());
        when(orgMemberService.updateMemberRole(ORG_ID, TARGET_ID, MemberRole.ADMIN)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(TARGET_ID, "admin"))).expectNext(true).verifyComplete();

        assertThat(events).containsExactly("target read", "update");
        verifyNoInteractions(bizThresholdChecker);
        say("updateRoleForMember role admin, no dev group: %s", events);
    }

    /**
     * Catches a quota check for roles that are not "admin" and a wrong role mapping: "member" and an unknown role name
     * (mapped to MEMBER by {@code MemberRole.fromValue}) never look up the dev group.
     */
    @ParameterizedTest
    @ValueSource(strings = {"member", "no-such-role"})
    void updateRoleForMember_otherRoleNames_updateAsMemberWithoutAQuotaCheck(String roleName) {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        stubTargetRole(TARGET_ID, MemberRole.MEMBER);
        when(orgMemberService.updateMemberRole(ORG_ID, TARGET_ID, MemberRole.MEMBER)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(TARGET_ID, roleName))).expectNext(true).verifyComplete();

        assertThat(events).containsExactly("target read", "update");
        verifyNoInteractions(groupService, bizThresholdChecker);
        say("updateRoleForMember role [%s] -> MEMBER, no quota check", roleName);
    }

    static Stream<Arguments> superAdminRoleRequests() {
        List<Arguments> args = new ArrayList<>();
        for (MemberRole visitorRole : List.of(MemberRole.ADMIN, MemberRole.SUPER_ADMIN)) {
            for (String targetId : List.of(TARGET_ID, VISITOR_ID)) {
                args.add(Arguments.of(visitorRole, targetId));
            }
        }
        return args.stream();
    }

    /**
     * Catches a privilege escalation (BF-005, formerly pinned as "updateRoleForMember ... an org ADMIN can make any
     * member, themselves included, super_admin ... skips the quota"): the role "super_admin" is refused with
     * UNSUPPORTED_OPERATION for an ADMIN and for a SUPER_ADMIN visitor, for another member and for themselves, before
     * the target is read, the quota is looked at or the role is written.
     */
    @ParameterizedTest(name = "visitor {0}, target {1}")
    @MethodSource("superAdminRoleRequests")
    void updateRoleForMember_superAdminRole_isRefusedForEveryVisitorAndTarget(MemberRole visitorRole, String targetId) {
        stubVisitorRole(ORG_ID, visitorRole);
        lenient().when(orgMemberService.updateMemberRole(ORG_ID, targetId, MemberRole.SUPER_ADMIN)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(targetId, MemberRole.SUPER_ADMIN.getValue())))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"))
                .verify();

        assertThat(events).isEmpty();
        verifyNoInteractions(groupService, bizThresholdChecker);
        say("updateRoleForMember: %s asked super_admin for %s -> UNSUPPORTED_OPERATION, nothing written", visitorRole, targetId);
    }

    static Stream<Arguments> superAdminTargetRequests() {
        List<Arguments> args = new ArrayList<>();
        for (MemberRole visitorRole : List.of(MemberRole.ADMIN, MemberRole.SUPER_ADMIN)) {
            for (MemberRole requested : List.of(MemberRole.MEMBER, MemberRole.ADMIN)) {
                args.add(Arguments.of(visitorRole, requested));
            }
        }
        return args.stream();
    }

    /**
     * Catches the demotion of a super admin (BF-005, formerly pinned as the gate looking at the visitor's role only):
     * changing the role of a SUPER_ADMIN member is refused with UNSUPPORTED_OPERATION for an ADMIN and for a
     * SUPER_ADMIN visitor, whichever role is asked; the target is read, the dev group and the quota are not subscribed
     * (the quota check is assembled eagerly for the role "admin"), nothing is written.
     */
    @ParameterizedTest(name = "visitor {0}, requested {1}")
    @MethodSource("superAdminTargetRequests")
    void updateRoleForMember_targetIsSuperAdmin_isRefusedForEveryVisitor(MemberRole visitorRole, MemberRole requested) {
        stubVisitorRole(ORG_ID, visitorRole);
        stubTargetRole(SUPER_ADMIN_ID, MemberRole.SUPER_ADMIN);
        lenient().when(groupService.getDevGroup(ORG_ID)).thenReturn(logged("dev group", Group.builder().id(DEV_GROUP_ID).build()));
        lenient().when(bizThresholdChecker.checkMaxDeveloperCount(ORG_ID, DEV_GROUP_ID, SUPER_ADMIN_ID))
                .thenReturn(loggedVoid("quota", null));
        lenient().when(orgMemberService.updateMemberRole(ORG_ID, SUPER_ADMIN_ID, requested)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(SUPER_ADMIN_ID, requested.getValue())))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"))
                .verify();

        assertThat(events).containsExactly("target read");
        say("updateRoleForMember: %s asked %s for the super admin -> UNSUPPORTED_OPERATION, nothing written", visitorRole,
                requested);
    }

    /**
     * Catches the target being read for a visitor who may not change roles: a visitor who is a MEMBER or not in the
     * organization gets NOT_AUTHORIZED, even for the role "super_admin", and the target is never read.
     */
    @ParameterizedTest(name = "visitor {0}")
    @NullSource
    @EnumSource(value = MemberRole.class, names = "MEMBER")
    void updateRoleForMember_visitorNotAnAdmin_isRefusedBeforeTheTargetIsRead(MemberRole visitorRole) {
        stubVisitorRole(ORG_ID, visitorRole);
        stubTargetRole(SUPER_ADMIN_ID, MemberRole.SUPER_ADMIN);
        lenient().when(orgMemberService.updateMemberRole(ORG_ID, SUPER_ADMIN_ID, MemberRole.SUPER_ADMIN))
                .thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(SUPER_ADMIN_ID, MemberRole.SUPER_ADMIN.getValue())))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();

        assertThat(events).isEmpty();
        say("updateRoleForMember: visitor %s -> NOT_AUTHORIZED, target not read", visitorRole);
    }

    /**
     * Catches a refusal for a target who is not a member (the documented limit): the check finds no membership, so the
     * update runs and its answer is returned. The real update answers true here although it changes nothing (pinned in
     * OrgMemberServiceImplMongoTest), so the stub answers true.
     */
    @Test
    void updateRoleForMember_targetNotAMember_updateRunsAndItsAnswerIsReturned() {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        stubTargetRole(TARGET_ID, null);
        when(orgMemberService.updateMemberRole(ORG_ID, TARGET_ID, MemberRole.MEMBER)).thenReturn(logged("update", true));

        StepVerifier.create(service.updateRoleForMember(ORG_ID, roleRequest(TARGET_ID, MemberRole.MEMBER.getValue())))
                .expectNext(true).verifyComplete();

        assertThat(events).containsExactly("target read", "update");
        say("updateRoleForMember: target not a member -> %s", events);
    }

    // ------------------------------------------------------------------ switchCurrentOrganizationTo

    private enum Switch {
        UNKNOWN_ORG, NO_ACTIVE_ORGS, ALREADY_CURRENT, SWITCH, REMOVAL_FAILS, NO_PREVIOUS_CURRENT
    }

    /**
     * Catches a user switched into an org they are not an active member of (INVALID_ORG_ID, nothing marked; also when
     * the user has no active orgs at all), a needless write for the already current org, a switch that skips the
     * removal of the old mark or ignores its failure (SWITCH_CURRENT_ORG_ERROR and no new mark), and a switch without
     * previous current org that removes a mark.
     */
    @ParameterizedTest
    @EnumSource(Switch.class)
    void switchCurrentOrganizationTo_followsTheCurrentOrgMarks(Switch scenario) {
        OrgMember current = orgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, OrgMemberState.CURRENT);
        OrgMember other = orgMember(OTHER_ORG_ID, VISITOR_ID, MemberRole.MEMBER, OrgMemberState.NORMAL);
        List<OrgMember> active = switch (scenario) {
            case NO_ACTIVE_ORGS -> List.of();
            case NO_PREVIOUS_CURRENT -> List.of(orgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, OrgMemberState.NORMAL), other);
            default -> List.of(current, other);
        };
        String next = switch (scenario) {
            case UNKNOWN_ORG, NO_ACTIVE_ORGS -> "not-mine";
            case ALREADY_CURRENT -> ORG_ID;
            default -> OTHER_ORG_ID;
        };
        lenient().when(orgMemberService.getAllActiveOrgs(VISITOR_ID)).thenReturn(Flux.fromIterable(active));
        lenient().when(orgMemberService.removeCurrentOrgMark(ORG_ID, VISITOR_ID))
                .thenReturn(logged("remove", scenario != Switch.REMOVAL_FAILS));
        lenient().when(orgMemberService.markAsUserCurrentOrgId(next, VISITOR_ID)).thenReturn(logged("mark", true));

        Mono<Boolean> result = service.switchCurrentOrganizationTo(VISITOR_ID, next);

        switch (scenario) {
            case UNKNOWN_ORG, NO_ACTIVE_ORGS -> {
                StepVerifier.create(result)
                        .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_ORG_ID, "INVALID_ORG_ID")).verify();
                assertThat(events).isEmpty();
            }
            case ALREADY_CURRENT -> {
                StepVerifier.create(result).expectNext(true).verifyComplete();
                assertThat(events).isEmpty();
            }
            case SWITCH -> {
                StepVerifier.create(result).expectNext(true).verifyComplete();
                assertThat(events).containsExactly("remove", "mark");
            }
            case REMOVAL_FAILS -> {
                StepVerifier.create(result)
                        .expectErrorSatisfies(error -> assertBizError(error, BizError.SWITCH_CURRENT_ORG_ERROR, "SWITCH_CURRENT_ORG_ERROR"))
                        .verify();
                assertThat(events).containsExactly("remove");
            }
            case NO_PREVIOUS_CURRENT -> {
                StepVerifier.create(result).expectNext(true).verifyComplete();
                assertThat(events).containsExactly("mark");
            }
        }
        say("switchCurrentOrganizationTo %s -> %s", scenario, events);
    }

    /** Catches the one-argument overload using the wrong user: it switches the visitor's current org. */
    @Test
    void switchCurrentOrganizationTo_oneArgument_switchesTheVisitor() {
        stubVisitor();
        when(orgMemberService.getAllActiveOrgs(VISITOR_ID))
                .thenReturn(Flux.just(orgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, OrgMemberState.NORMAL)));
        when(orgMemberService.markAsUserCurrentOrgId(ORG_ID, VISITOR_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.switchCurrentOrganizationTo(ORG_ID)).expectNext(true).verifyComplete();
        say("switchCurrentOrganizationTo(org): the visitor's current org marked");
    }

    // ------------------------------------------------------------------ leaveOrganization, removeUserFromOrg

    private static OrgMember admin(String userId) {
        return orgMember(ORG_ID, userId, MemberRole.ADMIN, OrgMemberState.NORMAL);
    }

    static Stream<Arguments> leaveCases() {
        return Stream.of(
                Arguments.of("visitor is the only admin", List.of(VISITOR_ID), false),
                Arguments.of("the only admin is someone else", List.of("other-admin"), true),
                Arguments.of("visitor and another admin", List.of(VISITOR_ID, "other-admin"), true));
    }

    /**
     * Catches an organization left without any admin (the last admin may not leave) and a leave blocked for a visitor
     * who is not the sole admin.
     */
    @ParameterizedTest(name = "{0}: leaves {2}")
    @MethodSource("leaveCases")
    void leaveOrganization_theOnlyAdminCannotLeave(String label, List<String> adminIds, boolean leaves) {
        stubVisitor();
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(adminIds.stream().map(OrgApiServiceImplTest::admin).toList()));
        lenient().when(orgMemberService.removeMember(ORG_ID, VISITOR_ID)).thenReturn(counting(true));

        if (leaves) {
            StepVerifier.create(service.leaveOrganization(ORG_ID)).expectNext(true).verifyComplete();
            assertThat(mutations).hasValue(1);
        } else {
            StepVerifier.create(service.leaveOrganization(ORG_ID))
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.LAST_ADMIN_CANNOT_LEAVE_ORG, "LAST_ADMIN_CANNOT_LEAVE_ORG"))
                    .verify();
            assertThat(mutations).hasValue(0);
        }
        say("leaveOrganization: %s -> leaves=%s", label, leaves);
    }

    /**
     * Catches a spurious leave event: {@code OrgMemberLeftEvent(orgId, visitorId)} is published only when the removal
     * returned true, and the result mirrors the removal.
     */
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void leaveOrganization_publishesTheLeaveEventOnlyWhenTheMemberWasRemoved(boolean removed) {
        stubVisitor();
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(List.of(admin("other-admin"))));
        when(orgMemberService.removeMember(ORG_ID, VISITOR_ID)).thenReturn(Mono.just(removed));

        StepVerifier.create(service.leaveOrganization(ORG_ID)).expectNext(removed).verifyComplete();

        assertEventPublished(removed, ORG_ID, VISITOR_ID);
        say("leaveOrganization: removal=%s -> event published=%s", removed, removed);
    }

    private void assertEventPublished(boolean published, String orgId, String userId) {
        if (published) {
            ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
            verify(applicationContext).publishEvent(event.capture());
            assertThat(event.getValue()).isInstanceOfSatisfying(OrgMemberLeftEvent.class, left -> {
                assertThat(left.getOrgId()).isEqualTo(orgId);
                assertThat(left.getUserId()).isEqualTo(userId);
            });
        } else {
            verifyNoInteractions(applicationContext);
        }
    }

    /**
     * Catches a leave event for a removal that did not happen, and the enterprise-mode user marking being skipped:
     * the event is published only when the removal returned true; {@code markUserDeletedAndInvalidConnectionsAtEnterpriseMode}
     * runs afterwards in both cases (today's behaviour; whether it acts is decided inside that service).
     */
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void removeUserFromOrg_publishesTheLeaveEventOnlyWhenRemoved_andAlwaysMarksTheUser(boolean removed) {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        stubTargetRole(TARGET_ID, MemberRole.MEMBER);
        when(orgMemberService.removeMember(ORG_ID, TARGET_ID)).thenReturn(Mono.just(removed));
        when(userService.markUserDeletedAndInvalidConnectionsAtEnterpriseMode(TARGET_ID)).thenReturn(logged("mark", true));

        StepVerifier.create(service.removeUserFromOrg(ORG_ID, TARGET_ID)).expectNext(removed).verifyComplete();

        assertEventPublished(removed, ORG_ID, TARGET_ID);
        assertThat(events).containsExactly("target read", "mark");
        say("removeUserFromOrg: removal=%s -> event %s, user marked", removed, removed);
    }

    static Stream<Arguments> removalCases() {
        return Stream.of(
                Arguments.of("a SUPER_ADMIN", MemberRole.ADMIN, SUPER_ADMIN_ID, MemberRole.SUPER_ADMIN, List.of(VISITOR_ID), BizError.UNSUPPORTED_OPERATION),
                Arguments.of("the visitor, the only ADMIN", MemberRole.ADMIN, VISITOR_ID, MemberRole.ADMIN, List.of(VISITOR_ID), BizError.LAST_ADMIN_CANNOT_LEAVE_ORG),
                Arguments.of("the only ADMIN, by a SUPER_ADMIN", MemberRole.SUPER_ADMIN, TARGET_ID, MemberRole.ADMIN, List.of(TARGET_ID), BizError.LAST_ADMIN_CANNOT_LEAVE_ORG),
                Arguments.of("an ADMIN with another ADMIN left", MemberRole.ADMIN, TARGET_ID, MemberRole.ADMIN, List.of(VISITOR_ID, TARGET_ID), null),
                Arguments.of("the visitor, with another ADMIN left", MemberRole.ADMIN, VISITOR_ID, MemberRole.ADMIN, List.of(VISITOR_ID, TARGET_ID), null),
                Arguments.of("a MEMBER", MemberRole.ADMIN, TARGET_ID, MemberRole.MEMBER, List.of(VISITOR_ID), null),
                Arguments.of("a user who is not a member", MemberRole.ADMIN, TARGET_ID, null, List.of(VISITOR_ID), null));
    }

    /**
     * BF-072 (fixed; was pinned as the plan section 9 row "removeUserFromOrg has no last-admin or super-admin guard"):
     * a SUPER_ADMIN is not removed (UNSUPPORTED_OPERATION, as for a change of that role), and neither is the last ADMIN
     * (LAST_ADMIN_CANNOT_LEAVE_ORG, the rule of leaveOrganization), whether the visitor removes themselves or a SUPER_ADMIN
     * removes them; a refused removal subscribes neither the removal nor the user marking. The admins are read only for an
     * ADMIN target.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("removalCases")
    void removeUserFromOrg_refusesASuperAdminAndTheLastAdmin(String label, MemberRole visitorRole, String targetId, MemberRole targetRole,
            List<String> adminIds, BizError refusal) {
        stubVisitorRole(ORG_ID, visitorRole);
        stubTargetRole(targetId, targetRole);
        lenient().when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(adminIds.stream().map(OrgApiServiceImplTest::admin).toList()));
        lenient().when(orgMemberService.removeMember(ORG_ID, targetId)).thenReturn(counting(true));
        lenient().when(userService.markUserDeletedAndInvalidConnectionsAtEnterpriseMode(targetId)).thenReturn(counting(true));

        if (refusal == null) {
            StepVerifier.create(service.removeUserFromOrg(ORG_ID, targetId)).expectNext(true).verifyComplete();
            assertThat(mutations).hasValue(2);
        } else {
            String messageKey = refusal == BizError.UNSUPPORTED_OPERATION ? "BAD_REQUEST" : refusal.name();
            StepVerifier.create(service.removeUserFromOrg(ORG_ID, targetId))
                    .expectErrorSatisfies(error -> assertBizError(error, refusal, messageKey)).verify();
            assertThat(mutations).hasValue(0);
        }
        verify(orgMemberService, targetRole == MemberRole.ADMIN ? times(1) : never()).getAllOrgAdmins(ORG_ID);
        // the visitor's own membership is the same stub when the visitor is the target, read once by the admin check too
        assertThat(events).containsOnly("target read").hasSize(targetId.equals(VISITOR_ID) ? 2 : 1);
        say("removeUserFromOrg: %s as %s -> %s, service subscriptions %d", label, visitorRole, refusal == null ? "removed" : refusal, mutations.get());
    }

    // ------------------------------------------------------------------ removeOrg, create, update

    static Stream<Arguments> removeOrgRows() {
        return Stream.of(
                Arguments.of(WorkspaceMode.ENTERPRISE, "enterprise-org", "enterprise-org", false),
                Arguments.of(WorkspaceMode.ENTERPRISE, "enterprise-org", "other-org", true),
                Arguments.of(WorkspaceMode.ENTERPRISE, null, "other-org", true),
                Arguments.of(WorkspaceMode.SAAS, "enterprise-org", "enterprise-org", true),
                Arguments.of(WorkspaceMode.SAAS, null, "other-org", true));
    }

    /**
     * Catches the enterprise workspace being deletable (the only workspace of an enterprise install): in ENTERPRISE mode
     * the enterprise org is UNSUPPORTED_OPERATION BAD_REQUEST and {@code organizationService.delete} is never
     * subscribed; any other org, and any org in SAAS mode, is deleted and the result returned. The plan section 9
     * row "deleting an org leaves its apps and datasources" is not reachable here: {@code organizationService.delete}
     * is mocked, and its pin belongs to {@code OrganizationServiceImpl.delete} (domain code, lane L3).
     */
    @ParameterizedTest(name = "{0} enterpriseOrg={1} removing {2} -> allowed {3}")
    @MethodSource("removeOrgRows")
    void removeOrg_theEnterpriseOrganizationCannotBeRemoved(WorkspaceMode mode, String enterpriseOrgId, String orgId, boolean allowed) {
        stubVisitorRole(orgId, MemberRole.ADMIN);
        stubWorkspace(mode, enterpriseOrgId);
        lenient().when(organizationService.delete(orgId)).thenReturn(counting(true));

        if (allowed) {
            StepVerifier.create(service.removeOrg(orgId)).expectNext(true).verifyComplete();
            assertThat(mutations).hasValue(1);
        } else {
            StepVerifier.create(service.removeOrg(orgId))
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
            assertThat(mutations).hasValue(0);
        }
        say("removeOrg %s enterpriseOrg=%s removing %s -> allowed=%s", mode, enterpriseOrgId, orgId, allowed);
    }

    private Organization created() {
        Organization organization = new Organization();
        organization.setId(ORG_ID);
        organization.setName("Created");
        return organization;
    }

    /**
     * Catches an org created past the quota or in enterprise mode: {@code checkMaxOrgCount(visitor)} runs first, then the
     * SaaS-mode check (ENTERPRISE gives UNSUPPORTED_OPERATION BAD_REQUEST), then
     * {@code organizationService.create(org, visitor, false)}; a failure stops the creation. The result is wrapped as
     * an {@code OrgView}.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("createRows")
    void create_checksTheQuotaThenTheWorkspaceModeBeforeCreating(String label, WorkspaceMode mode, boolean quotaFails,
            List<String> expectedEvents) {
        stubVisitor();
        stubWorkspace(mode, null);
        Organization requested = new Organization();
        when(bizThresholdChecker.checkMaxOrgCount(VISITOR_ID)).thenReturn(loggedVoid("quota",
                quotaFails ? new BizException(BizError.EXCEED_MAX_USER_ORG_COUNT, "EXCEED_MAX_USER_ORG_COUNT") : null));
        lenient().when(organizationService.create(requested, VISITOR_ID, false)).thenReturn(logged("create", created()));

        Mono<?> result = service.create(requested);

        if (expectedEvents.contains("create")) {
            StepVerifier.create(result).assertNext(view -> {
                assertThat(((org.lowcoder.api.usermanagement.view.OrgView) view).getOrgId()).isEqualTo(ORG_ID);
                assertThat(((org.lowcoder.api.usermanagement.view.OrgView) view).getOrgName()).isEqualTo("Created");
            }).verifyComplete();
        } else if (quotaFails) {
            StepVerifier.create(result).expectErrorSatisfies(error ->
                    assertBizError(error, BizError.EXCEED_MAX_USER_ORG_COUNT, "EXCEED_MAX_USER_ORG_COUNT")).verify();
        } else {
            StepVerifier.create(result).expectErrorSatisfies(error ->
                    assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
        }
        assertThat(events).isEqualTo(expectedEvents);
        say("create: %s -> %s", label, events);
    }

    static Stream<Arguments> createRows() {
        return Stream.of(
                Arguments.of("SaaS, quota ok", WorkspaceMode.SAAS, false, List.of("quota", "create")),
                Arguments.of("enterprise mode", WorkspaceMode.ENTERPRISE, false, List.of("quota")),
                Arguments.of("quota exceeded", WorkspaceMode.SAAS, true, List.of("quota")));
    }

    /**
     * Catches a wrong field mapping of the organization update: the Organization handed to
     * {@code organizationService.update(orgId, ..)} carries the request's name, contact name, email, phone and state.
     */
    @Test
    void update_buildsTheUpdatedOrganizationFromTheRequest() {
        stubVisitorRole(ORG_ID, MemberRole.ADMIN);
        ArgumentCaptor<Organization> updated = ArgumentCaptor.forClass(Organization.class);
        when(organizationService.update(eq(ORG_ID), updated.capture())).thenReturn(Mono.just(true));
        UpdateOrgRequest request = new UpdateOrgRequest();
        request.setOrgName("New Name");
        request.setContactName("Ann");
        request.setContactEmail("ann@example.com");
        request.setContactPhoneNumber("+421 900");
        request.setState(OrganizationState.ACTIVE);

        StepVerifier.create(service.update(ORG_ID, request)).expectNext(true).verifyComplete();

        Organization organization = updated.getValue();
        assertThat(organization.getName()).isEqualTo("New Name");
        assertThat(organization.getContactName()).isEqualTo("Ann");
        assertThat(organization.getContactEmail()).isEqualTo("ann@example.com");
        assertThat(organization.getContactPhoneNumber()).isEqualTo("+421 900");
        assertThat(organization.getState()).isEqualTo(OrganizationState.ACTIVE);
        say("update: organization fields mapped from the request");
    }

    // ------------------------------------------------------------------ domain check

    private enum Domain {
        NOT_CLOUD, ANONYMOUS, NO_REFERER, SKIP_CHECK, SAME_IGNORING_CASE, ORG_WITHOUT_DOMAIN_USES_DEFAULT, ORG_WITHOUT_DOMAIN_DIFFERENT_REFERER,
        MISMATCH_NO_ORG_FOR_DOMAIN, MISMATCH_MEMBER_OF_DOMAIN_ORG, MISMATCH_NOT_MEMBER_OF_DOMAIN_ORG
    }

    /**
     * Catches a wrong redirect or bind for a visitor on another workspace's domain: success when not cloud, for an
     * anonymous visitor, without a referer domain, for "skipCheck", for an equal domain (ignoring case) and for an org
     * without domain on the default domain (an org without domain on another domain is redirected to the default domain); on a mismatch: redirect to the org's domain when no org owns the request
     * domain or the user is a member of it, bind when the user is not a member of the org that owns the domain.
     */
    @ParameterizedTest
    @EnumSource(Domain.class)
    void checkOrganizationDomain_decidesBetweenSuccessRedirectAndBind(Domain scenario) {
        lenient().when(commonConfig.isCloud()).thenReturn(scenario != Domain.NOT_CLOUD);
        User visitor = user(VISITOR_ID, "Vi");
        if (scenario == Domain.ANONYMOUS) {
            visitor.setIsAnonymous(true);
        }
        lenient().when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        lenient().when(sessionUserService.getVisitorOrgMemberCache())
                .thenReturn(Mono.just(orgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, OrgMemberState.CURRENT)));
        Organization org = new Organization();
        org.setId(ORG_ID);
        if (scenario != Domain.ORG_WITHOUT_DOMAIN_USES_DEFAULT && scenario != Domain.ORG_WITHOUT_DOMAIN_DIFFERENT_REFERER) {
            OrganizationDomain domain = new OrganizationDomain();
            domain.setDomain(scenario == Domain.SKIP_CHECK ? "skipCheck" : ORG_DOMAIN);
            org.setOrganizationDomain(domain);
        }
        lenient().when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(org));
        CommonConfig.Domain defaultDomain = new CommonConfig.Domain();
        defaultDomain.setDefaultValue(DEFAULT_DOMAIN);
        lenient().when(commonConfig.getDomain()).thenReturn(defaultDomain);
        Organization domainOrg = new Organization();
        domainOrg.setId("domain-org");
        lenient().when(organizationService.getByDomain())
                .thenReturn(scenario == Domain.MISMATCH_NO_ORG_FOR_DOMAIN || scenario == Domain.ORG_WITHOUT_DOMAIN_DIFFERENT_REFERER ? Mono.empty() : Mono.just(domainOrg));
        lenient().when(orgMemberService.getOrgMember("domain-org", VISITOR_ID)).thenReturn(
                scenario == Domain.MISMATCH_MEMBER_OF_DOMAIN_ORG
                        ? Mono.just(orgMember("domain-org", VISITOR_ID, MemberRole.MEMBER, OrgMemberState.NORMAL)) : Mono.empty());
        String referer = switch (scenario) {
            case SAME_IGNORING_CASE -> ORG_DOMAIN.toUpperCase();
            case ORG_WITHOUT_DOMAIN_USES_DEFAULT -> DEFAULT_DOMAIN;
            default -> "other.example";
        };

        Mono<OrganizationDomainCheckResult> result = service.checkOrganizationDomain();
        if (scenario != Domain.NO_REFERER) {
            result = result.contextWrite(context -> context.put(GlobalContext.DOMAIN, referer));
        }

        switch (scenario) {
            case ORG_WITHOUT_DOMAIN_DIFFERENT_REFERER -> StepVerifier.create(result)
                    .assertNext(check -> {
                        assertThat(check.needRedirect()).isTrue();
                        assertThat(check.redirectDomain()).isEqualTo(DEFAULT_DOMAIN);
                    }).verifyComplete();
            case MISMATCH_NO_ORG_FOR_DOMAIN, MISMATCH_MEMBER_OF_DOMAIN_ORG -> StepVerifier.create(result)
                    .assertNext(check -> {
                        assertThat(check.needRedirect()).isTrue();
                        assertThat(check.redirectDomain()).isEqualTo(ORG_DOMAIN);
                        assertThat(check.needBind()).isFalse();
                    }).verifyComplete();
            case MISMATCH_NOT_MEMBER_OF_DOMAIN_ORG -> StepVerifier.create(result)
                    .assertNext(check -> {
                        assertThat(check.needBind()).isTrue();
                        assertThat(check.needRedirect()).isFalse();
                    }).verifyComplete();
            default -> StepVerifier.create(result)
                    .assertNext(check -> {
                        assertThat(check.needBind()).isFalse();
                        assertThat(check.needRedirect()).isFalse();
                    }).verifyComplete();
        }
        if (scenario == Domain.NOT_CLOUD) {
            verifyNoInteractions(sessionUserService);
        }
        say("checkOrganizationDomain %s referer [%s]", scenario, referer);
    }

    // ------------------------------------------------------------------ settings, add and switch, configs

    /**
     * Catches the org's common settings readable by a non-member (NOT_AUTHORIZED, the organization not even loaded)
     * and the wrong source: a member gets the organization's own common settings.
     */
    @Test
    void getOrgCommonSettings_membersGetTheOrgsSettings_outsidersAreRefused() {
        stubVisitorRole(ORG_ID, null);
        StepVerifier.create(service.getOrgCommonSettings(ORG_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")).verify();
        verify(organizationService, never()).getById(any());

        stubVisitorRole(ORG_ID, MemberRole.MEMBER);
        Organization org = new Organization();
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put("k", "v");
        org.setCommonSettings(settings);
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(org));
        StepVerifier.create(service.getOrgCommonSettings(ORG_ID)).assertNext(found -> assertThat(found).containsEntry("k", "v")).verifyComplete();
        say("getOrgCommonSettings: outsider refused, member gets the org's settings");
    }

    /**
     * Catches the switch running before the member was added, or after a failed add: {@code tryAddOrgMember(orgId,
     * userId, MEMBER)} first, then the visitor's current org is switched to that org.
     */
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void tryAddUserToOrgAndSwitchOrg_addsTheMemberThenSwitches(boolean addFails) {
        stubVisitor();
        BizException failure = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        when(orgMemberService.tryAddOrgMember(ORG_ID, TARGET_ID, MemberRole.MEMBER))
                .thenReturn(Mono.defer(() -> {
                    events.add("add");
                    return addFails ? Mono.error(failure) : Mono.just(true);
                }));
        lenient().when(orgMemberService.getAllActiveOrgs(VISITOR_ID))
                .thenReturn(Flux.just(orgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, OrgMemberState.NORMAL)));
        lenient().when(orgMemberService.markAsUserCurrentOrgId(ORG_ID, VISITOR_ID)).thenReturn(logged("mark", true));

        if (addFails) {
            StepVerifier.create(service.tryAddUserToOrgAndSwitchOrg(ORG_ID, TARGET_ID)).expectErrorSatisfies(error -> assertThat(error).isSameAs(failure)).verify();
            assertThat(events).containsExactly("add");
        } else {
            StepVerifier.create(service.tryAddUserToOrgAndSwitchOrg(ORG_ID, TARGET_ID)).expectNext(true).verifyComplete();
            assertThat(events).containsExactly("add", "mark");
        }
        say("tryAddUserToOrgAndSwitchOrg addFails=%s -> %s", addFails, events);
    }

    /**
     * Catches a wrong config view: the enabled auth configs of the organization, the cloud flag, the workspace mode,
     * the cookie name, and {@code selfDomain} true only when an organization owns the request's domain.
     */
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void getOrganizationConfigs_buildsTheConfigView(boolean hasSelfDomain) {
        AbstractAuthConfig authConfig = mock(AbstractAuthConfig.class);
        when(authenticationService.findAllAuthConfigs(ORG_ID, true)).thenReturn(Flux.just(new FindAuthConfig(authConfig, null)));
        when(organizationService.getByDomain()).thenReturn(hasSelfDomain ? Mono.just(new Organization()) : Mono.empty());
        when(commonConfig.isCloud()).thenReturn(true);
        stubWorkspace(WorkspaceMode.ENTERPRISE, null);
        when(commonConfig.getCookieName()).thenReturn(COOKIE_NAME);

        StepVerifier.create(service.getOrganizationConfigs(ORG_ID))
                .assertNext(view -> {
                    assertThat(view.getAuthConfigs()).containsExactly(authConfig);
                    assertThat(view.isCloudHosting()).isTrue();
                    assertThat(view.getWorkspaceMode()).isEqualTo(WorkspaceMode.ENTERPRISE);
                    assertThat(view.isSelfDomain()).isEqualTo(hasSelfDomain);
                    assertThat(view.getCookieName()).isEqualTo(COOKIE_NAME);
                })
                .verifyComplete();
        say("getOrganizationConfigs selfDomain=%s", hasSelfDomain);
    }
}

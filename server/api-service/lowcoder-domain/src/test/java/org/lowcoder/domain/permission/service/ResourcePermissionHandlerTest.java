package org.lowcoder.domain.permission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.GROUP_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.ORG_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.OTHER_GROUP_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.OTHER_USER_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.RESOURCE_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.USER_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.orgMember;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.permission;
import static org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.lowcoder.sdk.config.CommonConfig;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Decision logic of the abstract {@code ResourcePermissionHandler}, exercised through the concrete
 * {@code ApplicationPermissionHandler} with Mockito collaborators (unit U3, task L3-1). No defect of the plan is
 * reached; every assertion states today's behaviour.
 */
class ResourcePermissionHandlerTest {

    /** The two copy-pasted check methods of the handler that take the same decisions. */
    enum Variant { RESOURCE, APPLICATION }

    private static final ApplicationRequestType REQUEST_TYPE = ApplicationRequestType.PUBLIC_TO_ALL;

    private ApplicationService applicationService;
    private TemplateSolutionService templateSolutionService;
    private OrgMemberService orgMemberService;
    private GroupMemberService groupMemberService;
    private ResourcePermissionService resourcePermissionService;
    private CommonConfig config;
    private ApplicationPermissionHandler handler;

    @BeforeEach
    void setUp() {
        applicationService = mock(ApplicationService.class);
        templateSolutionService = mock(TemplateSolutionService.class);
        orgMemberService = mock(OrgMemberService.class);
        groupMemberService = mock(GroupMemberService.class);
        resourcePermissionService = mock(ResourcePermissionService.class);
        config = new CommonConfig();
        handler = new ApplicationPermissionHandler(applicationService, templateSolutionService);
        PermissionTestFixtures.inject(handler, orgMemberService, groupMemberService, resourcePermissionService, config);

        // defaults: nothing is public, no templates, the app lives in ORG_ID, the user is no org member and has no groups
        stubPublicIds(Set.of(), Set.of());
        when(templateSolutionService.getTemplateApplicationIds(any())).thenReturn(Mono.just(Set.of()));
        when(applicationService.findByIdWithoutDsl(any()))
                .thenReturn(Mono.just(Application.builder().organizationId(ORG_ID).build()));
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.empty());
        when(groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of()));
        when(resourcePermissionService.getByResourceTypeAndResourceIds(any(), any())).thenReturn(Mono.just(Map.of()));
    }

    // ---------------------------------------------------------------- getAllMatchingPermissions

    /** Catches an NPE or service lookups for an empty or null id collection (guard at ResourcePermissionHandler:47). */
    @Test
    void getAll_emptyOrNullResourceIds_returnEmptyMapWithoutTouchingServices() {
        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of(), ResourceAction.READ_APPLICATIONS))
                .assertNext(map -> assertThat(map).isEmpty())
                .verifyComplete();
        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, null, ResourceAction.READ_APPLICATIONS))
                .assertNext(map -> assertThat(map).isEmpty())
                .verifyComplete();
        verifyNoInteractions(orgMemberService, applicationService, templateSolutionService, resourcePermissionService);
        System.out.println("[ResourcePermissionHandlerTest] empty and null id collections -> empty map, no collaborator touched");
    }

    /** Catches an anonymous user treated as an org member: it gets VIEWER rows for public and template apps only. */
    @Test
    void getAll_anonymousUser_getsViewerRowsForPublicAndTemplateAppsOnly() {
        when(applicationService.getPublicApplicationIds(any())).thenReturn(Mono.just(Set.of("a1")));
        when(templateSolutionService.getTemplateApplicationIds(any())).thenReturn(Mono.just(Set.of("a2")));

        StepVerifier.create(handler.getAllMatchingPermissions(ANONYMOUS_USER_ID, List.of("a1", "a2", "a3"),
                        ResourceAction.READ_APPLICATIONS))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys("a1", "a2");
                    map.forEach((id, rows) -> {
                        assertThat(rows).hasSize(1);
                        assertAnonymousViewerRow(rows.get(0), id);
                    });
                })
                .verifyComplete();
        verifyNoInteractions(orgMemberService, resourcePermissionService);
        System.out.println("[ResourcePermissionHandlerTest] anonymous: public + template ids get VIEWER rows, org lookup skipped");
    }

    /** Catches anonymous users gaining edit rights: VIEWER cannot do EDIT, so no public lookup happens at all. */
    @Test
    void getAll_anonymousUser_actionAboveViewer_returnsEmptyWithoutLookup() {
        when(applicationService.getPublicApplicationIds(any())).thenReturn(Mono.just(Set.of("a1")));

        StepVerifier.create(handler.getAllMatchingPermissions(ANONYMOUS_USER_ID, List.of("a1"),
                        ResourceAction.EDIT_APPLICATIONS))
                .assertNext(map -> assertThat(map).isEmpty())
                .verifyComplete();
        verifyNoInteractions(templateSolutionService);
        System.out.println("[ResourcePermissionHandlerTest] anonymous + EDIT action -> empty map");
    }

    /** Catches admin lock-out: ADMIN and SUPER_ADMIN get one OWNER row per distinct id without any permission rows. */
    @ParameterizedTest
    @EnumSource(value = MemberRole.class, names = {"ADMIN", "SUPER_ADMIN"})
    void getAll_orgAdminAndSuperAdmin_getOwnerForEveryDistinctIdWithoutPermissionRows(MemberRole role) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(role)));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of("a1", "a1", "a2"),
                        ResourceAction.MANAGE_APPLICATIONS))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys("a1", "a2");
                    map.forEach((id, rows) -> {
                        assertThat(rows).hasSize(1);
                        ResourcePermission row = rows.get(0);
                        assertThat(row.getResourceRole()).isEqualTo(ResourceRole.OWNER);
                        assertThat(row.getResourceHolder()).isEqualTo(ResourceHolder.USER);
                        assertThat(row.getResourceHolderId()).isEqualTo(USER_ID);
                        assertThat(row.getResourceType()).isEqualTo(ResourceType.APPLICATION);
                        assertThat(row.getResourceId()).isEqualTo(id);
                    });
                })
                .verifyComplete();
        verifyNoInteractions(resourcePermissionService);
        System.out.println("[ResourcePermissionHandlerTest] " + role + " -> OWNER rows for distinct ids, no permission rows read");
    }

    /**
     * Catches privilege escalation through wrong holder, group or role matching: only the own USER row and the row of
     * a group the user belongs to count, and only when the role can do the action.
     */
    @Test
    void getAll_member_getsOwnAndGroupRowsFilteredByHolderAndRole() {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID))
                .thenReturn(Mono.just(List.of(GROUP_ID, "group-viewer")));
        ResourcePermission own = row("a1", ResourceHolder.USER, USER_ID, ResourceRole.EDITOR);
        ResourcePermission group = row("a1", ResourceHolder.GROUP, GROUP_ID, ResourceRole.EDITOR);
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.APPLICATION), any()))
                .thenReturn(Mono.just(Map.of(
                        "a1", List.of(own, group,
                                row("a1", ResourceHolder.GROUP, OTHER_GROUP_ID, ResourceRole.OWNER),
                                row("a1", ResourceHolder.USER, OTHER_USER_ID, ResourceRole.OWNER),
                                row("a1", ResourceHolder.GROUP, "group-viewer", ResourceRole.VIEWER)),
                        "a2", List.of(row("a2", ResourceHolder.USER, USER_ID, ResourceRole.VIEWER)))));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of("a1", "a2", "a3"),
                        ResourceAction.EDIT_APPLICATIONS))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys("a1", "a2", "a3");
                    assertThat(map.get("a1")).containsExactly(own, group);
                    assertThat(map.get("a2")).as("VIEWER cannot EDIT").isEmpty();
                    assertThat(map.get("a3")).as("no rows at all").isEmpty();
                })
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] member: own + member-group rows kept, foreign/low-role rows dropped");
    }

    /** Catches lock-out of public apps for a user outside the org: the empty org lookup must yield the public map. */
    @Test
    void getAll_userNotInOrg_returnsOnlyPublicPermissions() {
        when(applicationService.getPublicApplicationIds(any())).thenReturn(Mono.just(Set.of("a1")));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of("a1", "a2"),
                        ResourceAction.READ_APPLICATIONS))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys("a1");
                    assertAnonymousViewerRow(map.get("a1").get(0), "a1");
                })
                .verifyComplete();
        verifyNoInteractions(resourcePermissionService);
        System.out.println("[ResourcePermissionHandlerTest] non-member -> public rows only, no permission rows read");
    }

    /** Catches a dropped public/template permission: both lists are kept (union), they are not overwritten. */
    @Test
    void getAll_publicRowsAreMergedWithMemberRowsByUnion() {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        ResourcePermission own = row("a1", ResourceHolder.USER, USER_ID, ResourceRole.EDITOR);
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.APPLICATION), any()))
                .thenReturn(Mono.just(Map.of("a1", List.of(own))));
        when(applicationService.getPublicApplicationIds(any())).thenReturn(Mono.just(Set.of("a1", "a2")));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of("a1", "a2"),
                        ResourceAction.READ_APPLICATIONS))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys("a1", "a2");
                    assertThat(map.get("a1")).hasSize(2);
                    assertThat(map.get("a1").get(0)).isSameAs(own);
                    assertAnonymousViewerRow(map.get("a1").get(1), "a1");
                    assertThat(map.get("a2")).hasSize(1);
                    assertAnonymousViewerRow(map.get("a2").get(0), "a2");
                })
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] member row and public row of the same id are both kept, in that order");
    }

    // ---------------------------------------------------------------- check*: anonymous

    /** Catches a wrong status for anonymous users: public -> VIEWER success, otherwise the anonymous-user failure. */
    @ParameterizedTest
    @MethodSource("variantsWithBoolean")
    void check_anonymousUser_publicApp_success_privateApp_anonymousUserStatus(Variant variant, boolean isPublic) {
        stubPublicIds(isPublic ? Set.of(RESOURCE_ID) : Set.of(), Set.of());

        StepVerifier.create(check(variant, ANONYMOUS_USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> {
                    if (isPublic) {
                        assertThat(status.hasPermission()).isTrue();
                        assertAnonymousViewerRow(status.getPermission(), RESOURCE_ID);
                    } else {
                        assertThat(status.hasPermission()).isFalse();
                        assertThat(status.failByAnonymousUser()).isTrue();
                        assertThat(status.failByNotInOrg()).isFalse();
                    }
                })
                .verifyComplete();
        verifyNoInteractions(orgMemberService);
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " anonymous, public=" + isPublic + " checked");
    }

    /** Catches an anonymous user passed on as a real user id to the application filter (guard at :235). */
    @Test
    void checkOnApplication_anonymousUser_filtersWithNullUserAndNeverAsksPrivateIds() {
        StepVerifier.create(check(Variant.APPLICATION, ANONYMOUS_USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> assertThat(status.failByAnonymousUser()).isTrue())
                .verifyComplete();

        verify(applicationService).getFilteredPublicApplicationIds(eq(REQUEST_TYPE), eq(Set.of(RESOURCE_ID)),
                isNull(), eq(true));
        verify(applicationService, never()).getFilteredPublicApplicationIds(any(), any(), eq(ANONYMOUS_USER_ID), any());
        System.out.println("[ResourcePermissionHandlerTest] anonymous application check filters with userId=null only");
    }

    /** Catches an anonymous user reaching an edit action on a public app: the VIEWER role guard must hold. */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_anonymousUser_actionAboveViewer_isRejectedEvenForPublicApp(Variant variant) {
        stubPublicIds(Set.of(RESOURCE_ID), Set.of());

        StepVerifier.create(check(variant, ANONYMOUS_USER_ID, ResourceAction.EDIT_APPLICATIONS))
                .assertNext(status -> {
                    assertThat(status.hasPermission()).isFalse();
                    assertThat(status.failByAnonymousUser()).isTrue();
                })
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " anonymous + EDIT on public app -> anonymous-user failure");
    }

    // ---------------------------------------------------------------- check*: priority

    static Stream<Arguments> priorityMatrix() {
        Stream.Builder<Arguments> builder = Stream.builder();
        for (Variant variant : Variant.values()) {
            for (boolean orgRow : new boolean[] {false, true}) {
                for (boolean nonAnonymousPublic : new boolean[] {false, true}) {
                    for (boolean anonymousPublic : new boolean[] {false, true}) {
                        builder.add(Arguments.of(variant, orgRow, nonAnonymousPublic, anonymousPublic));
                    }
                }
            }
        }
        return builder.build();
    }

    /**
     * Catches a wrong priority, i.e. privilege escalation or downgrade: the org permission (EDITOR here) wins over
     * the public VIEWER row; with no org row any public source grants the public row; with none a member is
     * "not enough permission". The non-anonymous and anonymous public rows are built identically, so their mutual order
     * is not observable and not asserted.
     */
    @ParameterizedTest(name = "{0}: orgRow={1} nonAnonymousPublic={2} anonymousPublic={3}")
    @MethodSource("priorityMatrix")
    void check_priority_orgPermissionBeatsPublicPermissions(Variant variant, boolean orgRow,
            boolean nonAnonymousPublic, boolean anonymousPublic) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.APPLICATION), any()))
                .thenReturn(Mono.just(orgRow
                        ? Map.of(RESOURCE_ID, List.of(row(RESOURCE_ID, ResourceHolder.USER, USER_ID, ResourceRole.EDITOR)))
                        : Map.of()));
        stubPublicIds(anonymousPublic ? Set.of(RESOURCE_ID) : Set.of(), nonAnonymousPublic ? Set.of(RESOURCE_ID) : Set.of());

        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> {
                    if (orgRow) {
                        assertThat(status.hasPermission()).isTrue();
                        assertThat(status.getPermission().getResourceRole()).isEqualTo(ResourceRole.EDITOR);
                        assertThat(status.getPermission().getResourceHolderId()).isEqualTo(USER_ID);
                    } else if (nonAnonymousPublic || anonymousPublic) {
                        assertThat(status.hasPermission()).isTrue();
                        assertAnonymousViewerRow(status.getPermission(), RESOURCE_ID);
                    } else {
                        assertThat(status.hasPermission()).isFalse();
                        assertThat(status.failByNotEnoughPermission()).isTrue();
                    }
                })
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] priority " + variant + " org=" + orgRow
                + " nonAnonPublic=" + nonAnonymousPublic + " anonPublic=" + anonymousPublic + " checked");
    }

    // ---------------------------------------------------------------- check*: org outcomes

    /** Catches a wrong deny reason: no org membership and nothing public is "not in org", not "not enough permission". */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_userNotInOrg_noPublicRows_failsWithNotInOrg(Variant variant) {
        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> {
                    assertThat(status.hasPermission()).isFalse();
                    assertThat(status.failByNotInOrg()).isTrue();
                    assertThat(status.failByNotEnoughPermission()).isFalse();
                })
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " non-member, nothing public -> notInOrg");
    }

    /** Catches a crash or empty result when the resource itself cannot be resolved: it must read as "not in org". */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_unknownResource_failsWithNotInOrg(Variant variant) {
        when(applicationService.findByIdWithoutDsl(any())).thenReturn(Mono.empty());

        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> assertThat(status.failByNotInOrg()).isTrue())
                .verifyComplete();
        verifyNoInteractions(orgMemberService);
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " unknown resource -> notInOrg, no member lookup");
    }

    /**
     * Catches admin lock-out: an org admin / super admin is OWNER without any permission rows. BF-090 (plan §9, was
     * pinned): the single-resource checks built that row with the resource and user ids swapped; the granted row now has
     * resourceId == the resource id and resourceHolderId == the user id, as getAllMatchingPermissions builds it.
     */
    @ParameterizedTest
    @MethodSource("variantsWithAdminRole")
    void check_orgAdminAndSuperAdmin_getOwnerWithoutPermissionRows_withTheResourceAndUserIdsBF090(Variant variant, MemberRole role) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(role)));

        StepVerifier.create(check(variant, USER_ID, ResourceAction.MANAGE_APPLICATIONS))
                .assertNext(status -> {
                    assertThat(status.hasPermission()).isTrue();
                    ResourcePermission granted = status.getPermission();
                    assertThat(granted.getResourceRole()).isEqualTo(ResourceRole.OWNER);
                    assertThat(granted.getResourceHolder()).isEqualTo(ResourceHolder.USER);
                    assertThat(granted.getResourceType()).isEqualTo(ResourceType.APPLICATION);
                    assertThat(granted.getResourceId()).isEqualTo(RESOURCE_ID);
                    assertThat(granted.getResourceHolderId()).isEqualTo(USER_ID);
                })
                .verifyComplete();
        verifyNoInteractions(resourcePermissionService);
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " " + role
                + " -> OWNER without permission rows, resourceId " + RESOURCE_ID + ", holder " + USER_ID);
    }

    /** Catches getMaxPermission picking the lowest role: VIEWER, OWNER, EDITOR rows resolve to OWNER. */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_member_multipleRows_returnsHighestRole(Variant variant) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of(GROUP_ID)));
        ResourcePermission owner = row(RESOURCE_ID, ResourceHolder.GROUP, GROUP_ID, ResourceRole.OWNER);
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.APPLICATION), any()))
                .thenReturn(Mono.just(Map.of(RESOURCE_ID, List.of(
                        row(RESOURCE_ID, ResourceHolder.USER, USER_ID, ResourceRole.VIEWER),
                        owner,
                        row(RESOURCE_ID, ResourceHolder.USER, USER_ID, ResourceRole.EDITOR)))));

        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> assertThat(status.getPermission()).isSameAs(owner))
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " VIEWER+OWNER+EDITOR rows -> OWNER");
    }

    // ---------------------------------------------------------------- application request type

    /** Catches the request type or private-marketplace flag not reaching the application filter, for both user kinds. */
    @ParameterizedTest
    @MethodSource("requestTypesWithPrivateMode")
    void checkOnApplication_forwardsRequestTypeAndMarketplaceMode(ApplicationRequestType requestType, boolean privateMode) {
        config.getMarketplace().setPrivateMode(privateMode);
        when(applicationService.getFilteredPublicApplicationIds(any(), any(), any(), any())).thenReturn(Mono.just(Set.of()));

        StepVerifier.create(handler.checkUserPermissionStatusOnApplication(USER_ID, RESOURCE_ID,
                        ResourceAction.READ_APPLICATIONS, requestType))
                .assertNext(status -> assertThat(status.failByNotInOrg()).isTrue())
                .verifyComplete();

        verify(applicationService).getFilteredPublicApplicationIds(eq(requestType), eq(Set.of(RESOURCE_ID)), isNull(), eq(privateMode));
        verify(applicationService).getFilteredPublicApplicationIds(eq(requestType), eq(Set.of(RESOURCE_ID)), eq(USER_ID), eq(privateMode));
        System.out.println("[ResourcePermissionHandlerTest] requestType=" + requestType + " privateMode=" + privateMode + " forwarded");
    }

    /** Catches the template application ids being ignored: a template app is readable by an anonymous user. */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_anonymousUser_templateAppCountsAsPublic(Variant variant) {
        when(templateSolutionService.getTemplateApplicationIds(any())).thenReturn(Mono.just(Set.of(RESOURCE_ID)));

        StepVerifier.create(check(variant, ANONYMOUS_USER_ID, ResourceAction.READ_APPLICATIONS))
                .assertNext(status -> assertAnonymousViewerRow(status.getPermission(), RESOURCE_ID))
                .verifyComplete();
        System.out.println("[ResourcePermissionHandlerTest] " + variant + " template app is public for anonymous");
    }

    // ---------------------------------------------------------------- helpers

    static Stream<Arguments> variantsWithBoolean() {
        return Stream.of(Variant.values()).flatMap(v -> Stream.of(Arguments.of(v, true), Arguments.of(v, false)));
    }

    static Stream<Arguments> variantsWithAdminRole() {
        return Stream.of(Variant.values()).flatMap(v ->
                Stream.of(Arguments.of(v, MemberRole.ADMIN), Arguments.of(v, MemberRole.SUPER_ADMIN)));
    }

    static Stream<Arguments> requestTypesWithPrivateMode() {
        return Stream.of(ApplicationRequestType.values()).flatMap(t ->
                Stream.of(Arguments.of(t, true), Arguments.of(t, false)));
    }

    private Mono<UserPermissionOnResourceStatus> check(Variant variant, String userId, ResourceAction action) {
        return switch (variant) {
            case RESOURCE -> handler.checkUserPermissionStatusOnResource(userId, RESOURCE_ID, action);
            case APPLICATION -> handler.checkUserPermissionStatusOnApplication(userId, RESOURCE_ID, action, REQUEST_TYPE);
        };
    }

    /** Stubs the public ids of both variants: anonymous (userId null) and non-anonymous (userId USER_ID). */
    private void stubPublicIds(Set<String> anonymousIds, Set<String> nonAnonymousIds) {
        when(applicationService.getPublicApplicationIds(any())).thenReturn(Mono.just(anonymousIds));
        when(applicationService.getPrivateApplicationIds(any(), eq(USER_ID))).thenReturn(Mono.just(nonAnonymousIds));
        when(applicationService.getFilteredPublicApplicationIds(eq(REQUEST_TYPE), any(), isNull(), any()))
                .thenReturn(Mono.just(anonymousIds));
        when(applicationService.getFilteredPublicApplicationIds(eq(REQUEST_TYPE), any(), eq(USER_ID), any()))
                .thenReturn(Mono.just(nonAnonymousIds));
    }

    private static ResourcePermission row(String resourceId, ResourceHolder holder, String holderId, ResourceRole role) {
        return permission(ResourceType.APPLICATION, resourceId, holder, holderId, role);
    }

    private static void assertAnonymousViewerRow(ResourcePermission row, String resourceId) {
        assertThat(row.getResourceId()).isEqualTo(resourceId);
        assertThat(row.getResourceType()).isEqualTo(ResourceType.APPLICATION);
        assertThat(row.getResourceHolder()).isEqualTo(ResourceHolder.USER);
        assertThat(row.getResourceHolderId()).isEqualTo(ANONYMOUS_USER_ID);
        assertThat(row.getResourceRole()).isEqualTo(ResourceRole.VIEWER);
    }
}

package org.lowcoder.domain.permission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.GROUP_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.ORG_ID;
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
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.service.BundleService;
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
 * The bundle clone of the permission decisions (unit U3, task L3-1): {@code BundlePermissionHandler} with its own
 * public-id sources and the {@code checkUserPermissionStatusOnBundle} copy of the check method. Catches the bundle
 * clone diverging from the resource/application one. Every assertion states today's behaviour.
 */
class BundlePermissionHandlerTest {

    enum Variant { RESOURCE, BUNDLE }

    private static final BundleRequestType REQUEST_TYPE = BundleRequestType.PUBLIC_TO_ALL;

    private BundleService bundleService;
    private OrgMemberService orgMemberService;
    private GroupMemberService groupMemberService;
    private ResourcePermissionService resourcePermissionService;
    private CommonConfig config;
    private BundlePermissionHandler handler;

    @BeforeEach
    void setUp() {
        bundleService = mock(BundleService.class);
        orgMemberService = mock(OrgMemberService.class);
        groupMemberService = mock(GroupMemberService.class);
        resourcePermissionService = mock(ResourcePermissionService.class);
        config = new CommonConfig();
        handler = new BundlePermissionHandler(bundleService, mock(TemplateSolutionService.class));
        PermissionTestFixtures.inject(handler, orgMemberService, groupMemberService, resourcePermissionService, config);

        stubPublicIds(Set.of(), Set.of());
        when(bundleService.findById(any())).thenReturn(Mono.just(Bundle.builder().organizationId(ORG_ID).build()));
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.empty());
        when(groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of()));
        when(resourcePermissionService.getByResourceTypeAndResourceIds(any(), any())).thenReturn(Mono.just(Map.of()));
    }

    /** Catches wrong type, holder or role on public bundle rows, and a public id missing from the anonymous map. */
    @Test
    void getAll_anonymousUser_publicBundlesGetViewerRowsOfTypeBundle() {
        when(bundleService.getPublicBundleIds(any())).thenReturn(Mono.just(Set.of("b1")));

        StepVerifier.create(handler.getAllMatchingPermissions(ANONYMOUS_USER_ID, List.of("b1", "b2"),
                        ResourceAction.READ_BUNDLES))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys("b1");
                    assertAnonymousViewerRow(map.get("b1").get(0), "b1");
                })
                .verifyComplete();
        verifyNoInteractions(orgMemberService);
        System.out.println("[BundlePermissionHandlerTest] anonymous: public bundle gets a VIEWER/BUNDLE row");
    }

    /** Catches anonymous users gaining edit rights on bundles: the VIEWER guard returns before any lookup. */
    @Test
    void getAll_anonymousUser_actionAboveViewer_returnsEmptyWithoutLookup() {
        when(bundleService.getPublicBundleIds(any())).thenReturn(Mono.just(Set.of("b1")));

        StepVerifier.create(handler.getAllMatchingPermissions(ANONYMOUS_USER_ID, List.of("b1"), ResourceAction.EDIT_BUNDLES))
                .assertNext(map -> assertThat(map).isEmpty())
                .verifyComplete();
        verify(bundleService, never()).getPublicBundleIds(any());
        System.out.println("[BundlePermissionHandlerTest] anonymous + EDIT_BUNDLES -> empty map");
    }

    /** Catches a member's own and group rows being dropped or merged wrongly with the public row on bundles. */
    @Test
    void getAll_member_getsOwnRowMergedWithPublicRow() {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of(GROUP_ID)));
        ResourcePermission group = row("b1", ResourceHolder.GROUP, GROUP_ID, ResourceRole.EDITOR);
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.BUNDLE), any()))
                .thenReturn(Mono.just(Map.of("b1", List.of(group))));
        when(bundleService.getPublicBundleIds(any())).thenReturn(Mono.just(Set.of("b1")));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of("b1"), ResourceAction.READ_BUNDLES))
                .assertNext(map -> {
                    assertThat(map.get("b1")).hasSize(2);
                    assertThat(map.get("b1").get(0)).isSameAs(group);
                    assertAnonymousViewerRow(map.get("b1").get(1), "b1");
                })
                .verifyComplete();
        System.out.println("[BundlePermissionHandlerTest] member group row + public row both kept");
    }

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
     * Catches a wrong priority in the bundle clone (:326-334): the org permission (EDITOR) wins over the public VIEWER
     * row, any public source beats failure, and a member with nothing gets "not enough permission". The order of the
     * two public sources is not observable (identical rows) and not asserted.
     */
    @ParameterizedTest(name = "{0}: orgRow={1} nonAnonymousPublic={2} anonymousPublic={3}")
    @MethodSource("priorityMatrix")
    void check_priority_orgPermissionBeatsPublicPermissions(Variant variant, boolean orgRow,
            boolean nonAnonymousPublic, boolean anonymousPublic) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.BUNDLE), any()))
                .thenReturn(Mono.just(orgRow
                        ? Map.of(RESOURCE_ID, List.of(row(RESOURCE_ID, ResourceHolder.USER, USER_ID, ResourceRole.EDITOR)))
                        : Map.of()));
        stubPublicIds(anonymousPublic ? Set.of(RESOURCE_ID) : Set.of(), nonAnonymousPublic ? Set.of(RESOURCE_ID) : Set.of());

        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_BUNDLES))
                .assertNext(status -> {
                    if (orgRow) {
                        assertThat(status.getPermission().getResourceRole()).isEqualTo(ResourceRole.EDITOR);
                        assertThat(status.getPermission().getResourceHolderId()).isEqualTo(USER_ID);
                    } else if (nonAnonymousPublic || anonymousPublic) {
                        assertAnonymousViewerRow(status.getPermission(), RESOURCE_ID);
                    } else {
                        assertThat(status.hasPermission()).isFalse();
                        assertThat(status.failByNotEnoughPermission()).isTrue();
                    }
                })
                .verifyComplete();
        System.out.println("[BundlePermissionHandlerTest] priority " + variant + " org=" + orgRow
                + " nonAnonPublic=" + nonAnonymousPublic + " anonPublic=" + anonymousPublic + " checked");
    }

    /** Catches a wrong status for anonymous users: public bundle -> success, otherwise the anonymous-user failure. */
    @ParameterizedTest
    @MethodSource("variantsWithBoolean")
    void check_anonymousUser_publicBundle_success_privateBundle_anonymousUserStatus(Variant variant, boolean isPublic) {
        stubPublicIds(isPublic ? Set.of(RESOURCE_ID) : Set.of(), Set.of());

        StepVerifier.create(check(variant, ANONYMOUS_USER_ID, ResourceAction.READ_BUNDLES))
                .assertNext(status -> {
                    if (isPublic) {
                        assertAnonymousViewerRow(status.getPermission(), RESOURCE_ID);
                    } else {
                        assertThat(status.hasPermission()).isFalse();
                        assertThat(status.failByAnonymousUser()).isTrue();
                    }
                })
                .verifyComplete();
        verifyNoInteractions(orgMemberService);
        System.out.println("[BundlePermissionHandlerTest] " + variant + " anonymous, public=" + isPublic + " checked");
    }

    /** Catches an anonymous user reaching an edit action on a public bundle. */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_anonymousUser_actionAboveViewer_isRejectedEvenForPublicBundle(Variant variant) {
        stubPublicIds(Set.of(RESOURCE_ID), Set.of());

        StepVerifier.create(check(variant, ANONYMOUS_USER_ID, ResourceAction.EDIT_BUNDLES))
                .assertNext(status -> assertThat(status.failByAnonymousUser()).isTrue())
                .verifyComplete();
        System.out.println("[BundlePermissionHandlerTest] " + variant + " anonymous + EDIT on public bundle rejected");
    }

    /** Catches a wrong deny reason: non-member with nothing public is "not in org"; unknown bundle too. */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void check_userNotInOrg_andUnknownBundle_failWithNotInOrg(Variant variant) {
        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_BUNDLES))
                .assertNext(status -> {
                    assertThat(status.failByNotInOrg()).isTrue();
                    assertThat(status.failByNotEnoughPermission()).isFalse();
                })
                .verifyComplete();

        when(bundleService.findById(any())).thenReturn(Mono.empty());
        StepVerifier.create(check(variant, USER_ID, ResourceAction.READ_BUNDLES))
                .assertNext(status -> assertThat(status.failByNotInOrg()).isTrue())
                .verifyComplete();
        System.out.println("[BundlePermissionHandlerTest] " + variant + " non-member and unknown bundle -> notInOrg");
    }

    static Stream<Arguments> variantsWithAdminRole() {
        return Stream.of(Variant.values()).flatMap(v ->
                Stream.of(Arguments.of(v, MemberRole.ADMIN), Arguments.of(v, MemberRole.SUPER_ADMIN)));
    }

    static Stream<Arguments> variantsWithBoolean() {
        return Stream.of(Variant.values()).flatMap(v -> Stream.of(Arguments.of(v, true), Arguments.of(v, false)));
    }

    /**
     * Catches admin lock-out on bundles (OWNER without permission rows). Pins the plan §9 defect: buildAdminPermission
     * called with resource and user id swapped in the single-resource checks (:106, :312); a fix changes this test on
     * purpose.
     */
    @ParameterizedTest
    @MethodSource("variantsWithAdminRole")
    void check_orgAdminAndSuperAdmin_getOwner_pinsSwappedIds(Variant variant, MemberRole role) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(role)));

        StepVerifier.create(check(variant, USER_ID, ResourceAction.MANAGE_BUNDLES))
                .assertNext(status -> {
                    ResourcePermission granted = status.getPermission();
                    assertThat(granted.getResourceRole()).isEqualTo(ResourceRole.OWNER);
                    assertThat(granted.getResourceHolder()).isEqualTo(ResourceHolder.USER);
                    assertThat(granted.getResourceType()).isEqualTo(ResourceType.BUNDLE);
                    assertThat(granted.getResourceId()).isEqualTo(USER_ID);
                    assertThat(granted.getResourceHolderId()).isEqualTo(RESOURCE_ID);
                })
                .verifyComplete();
        verifyNoInteractions(resourcePermissionService);
        System.out.println("[BundlePermissionHandlerTest] " + variant + " " + role + " -> OWNER, ids swapped (plan §9 defect pinned)");
    }

    /** Contrast to the pin above: getAllMatchingPermissions builds the admin row with the correct ids. */
    @Test
    void getAll_orgAdmin_getsOwnerRowWithCorrectIds() {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.ADMIN)));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of("b1"), ResourceAction.MANAGE_BUNDLES))
                .assertNext(map -> {
                    ResourcePermission granted = map.get("b1").get(0);
                    assertThat(granted.getResourceRole()).isEqualTo(ResourceRole.OWNER);
                    assertThat(granted.getResourceId()).isEqualTo("b1");
                    assertThat(granted.getResourceHolderId()).isEqualTo(USER_ID);
                    assertThat(granted.getResourceType()).isEqualTo(ResourceType.BUNDLE);
                })
                .verifyComplete();
        System.out.println("[BundlePermissionHandlerTest] getAll admin row has the correct ids");
    }

    /** Catches the request type or marketplace flag not reaching the bundle filter for both user kinds. */
    @ParameterizedTest
    @MethodSource("requestTypesWithPrivateMode")
    void checkOnBundle_forwardsRequestTypeAndMarketplaceMode(BundleRequestType requestType, boolean privateMode) {
        config.getMarketplace().setPrivateMode(privateMode);
        when(bundleService.getFilteredPublicBundleIds(any(), any(), any(), any())).thenReturn(Mono.just(Set.of()));

        StepVerifier.create(handler.checkUserPermissionStatusOnBundle(USER_ID, RESOURCE_ID, ResourceAction.READ_BUNDLES, requestType))
                .assertNext(status -> assertThat(status.failByNotInOrg()).isTrue())
                .verifyComplete();

        verify(bundleService).getFilteredPublicBundleIds(eq(requestType), eq(Set.of(RESOURCE_ID)), isNull(), eq(privateMode));
        verify(bundleService).getFilteredPublicBundleIds(eq(requestType), eq(Set.of(RESOURCE_ID)), eq(USER_ID), eq(privateMode));
        System.out.println("[BundlePermissionHandlerTest] requestType=" + requestType + " privateMode=" + privateMode + " forwarded");
    }

    static Stream<Arguments> requestTypesWithPrivateMode() {
        return Stream.of(BundleRequestType.values()).flatMap(t -> Stream.of(Arguments.of(t, true), Arguments.of(t, false)));
    }

    private Mono<UserPermissionOnResourceStatus> check(Variant variant, String userId, ResourceAction action) {
        return switch (variant) {
            case RESOURCE -> handler.checkUserPermissionStatusOnResource(userId, RESOURCE_ID, action);
            case BUNDLE -> handler.checkUserPermissionStatusOnBundle(userId, RESOURCE_ID, action, REQUEST_TYPE);
        };
    }

    private void stubPublicIds(Set<String> anonymousIds, Set<String> nonAnonymousIds) {
        when(bundleService.getPublicBundleIds(any())).thenReturn(Mono.just(anonymousIds));
        when(bundleService.getPrivateBundleIds(any(), eq(USER_ID))).thenReturn(Mono.just(nonAnonymousIds));
        when(bundleService.getFilteredPublicBundleIds(eq(REQUEST_TYPE), any(), isNull(), any())).thenReturn(Mono.just(anonymousIds));
        when(bundleService.getFilteredPublicBundleIds(eq(REQUEST_TYPE), any(), eq(USER_ID), any())).thenReturn(Mono.just(nonAnonymousIds));
    }

    private static ResourcePermission row(String resourceId, ResourceHolder holder, String holderId, ResourceRole role) {
        return permission(ResourceType.BUNDLE, resourceId, holder, holderId, role);
    }

    private static void assertAnonymousViewerRow(ResourcePermission row, String resourceId) {
        assertThat(row.getResourceId()).isEqualTo(resourceId);
        assertThat(row.getResourceType()).isEqualTo(ResourceType.BUNDLE);
        assertThat(row.getResourceHolder()).isEqualTo(ResourceHolder.USER);
        assertThat(row.getResourceHolderId()).isEqualTo(ANONYMOUS_USER_ID);
        assertThat(row.getResourceRole()).isEqualTo(ResourceRole.VIEWER);
    }
}

package org.lowcoder.domain.permission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.ORG_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.RESOURCE_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.USER_ID;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.orgMember;
import static org.lowcoder.domain.permission.service.PermissionTestFixtures.permission;
import static org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.sdk.config.CommonConfig;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code DatasourcePermissionHandler} (unit U3, task L3-1): the system-static datasource rows layered over the base
 * decision logic, and the base checks with empty public sources. Every assertion states today's behaviour.
 */
class DatasourcePermissionHandlerTest {

    private static final String DATASOURCE_ID = "ds-1";
    private static final String OTHER_DATASOURCE_ID = "ds-2";

    private DatasourceService datasourceService;
    private OrgMemberService orgMemberService;
    private GroupMemberService groupMemberService;
    private ResourcePermissionService resourcePermissionService;
    private DatasourcePermissionHandler handler;

    @BeforeEach
    void setUp() {
        datasourceService = mock(DatasourceService.class);
        orgMemberService = mock(OrgMemberService.class);
        groupMemberService = mock(GroupMemberService.class);
        resourcePermissionService = mock(ResourcePermissionService.class);
        handler = new DatasourcePermissionHandler(datasourceService);
        PermissionTestFixtures.inject(handler, orgMemberService, groupMemberService, resourcePermissionService, new CommonConfig());

        when(datasourceService.getById(any())).thenReturn(Mono.just(Datasource.builder().organizationId(ORG_ID).build()));
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of()));
        when(resourcePermissionService.getByResourceTypeAndResourceIds(any(), any())).thenReturn(Mono.just(Map.of()));
    }

    /** Catches static datasource lock-out: static ids get an OWNER row, the others follow the member rows. */
    @Test
    void getAll_staticAndNormalIds_staticGetOwnerRowsNormalFollowPermissionRows() {
        ResourcePermission own = row(DATASOURCE_ID, USER_ID, ResourceRole.OWNER);
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.DATASOURCE), any()))
                .thenReturn(Mono.just(Map.of(DATASOURCE_ID, List.of(own))));

        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID,
                        List.of(Datasource.QUICK_REST_API_ID, DATASOURCE_ID, Datasource.JS_CODE_ID, OTHER_DATASOURCE_ID),
                        ResourceAction.USE_DATASOURCES))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys(Datasource.QUICK_REST_API_ID, Datasource.JS_CODE_ID,
                            DATASOURCE_ID, OTHER_DATASOURCE_ID);
                    assertStaticOwnerRow(map.get(Datasource.QUICK_REST_API_ID), Datasource.QUICK_REST_API_ID, USER_ID);
                    assertStaticOwnerRow(map.get(Datasource.JS_CODE_ID), Datasource.JS_CODE_ID, USER_ID);
                    assertThat(map.get(DATASOURCE_ID)).containsExactly(own);
                    assertThat(map.get(OTHER_DATASOURCE_ID)).isEmpty();
                })
                .verifyComplete();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<java.util.Collection<String>> ids = ArgumentCaptor.forClass(java.util.Collection.class);
        verify(resourcePermissionService).getByResourceTypeAndResourceIds(eq(ResourceType.DATASOURCE), ids.capture());
        assertThat(ids.getValue()).containsExactly(DATASOURCE_ID, OTHER_DATASOURCE_ID);
        System.out.println("[DatasourcePermissionHandlerTest] static ids -> OWNER rows; only normal ids read from the permission store");
    }

    /** Catches static ids leaking into the base lookup, or normal ids getting static rows. */
    @Test
    void getAll_onlyNormalIds_noStaticRows() {
        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID, List.of(DATASOURCE_ID), ResourceAction.USE_DATASOURCES))
                .assertNext(map -> assertThat(map).containsOnlyKeys(DATASOURCE_ID))
                .verifyComplete();
        System.out.println("[DatasourcePermissionHandlerTest] only normal ids -> only their keys");
    }

    /** Catches duplicate static ids breaking the result (toMap would throw) and an org lookup for static-only input. */
    @Test
    void getAll_onlyStaticIds_duplicatesCollapse_andNoOrgLookup() {
        StepVerifier.create(handler.getAllMatchingPermissions(USER_ID,
                        List.of(Datasource.JS_CODE_ID, Datasource.JS_CODE_ID, Datasource.QUICK_GRAPHQL_ID),
                        ResourceAction.USE_DATASOURCES))
                .assertNext(map -> {
                    assertThat(map).containsOnlyKeys(Datasource.JS_CODE_ID, Datasource.QUICK_GRAPHQL_ID);
                    assertThat(map.get(Datasource.JS_CODE_ID)).hasSize(1);
                })
                .verifyComplete();
        verifyNoInteractions(orgMemberService, datasourceService);
        System.out.println("[DatasourcePermissionHandlerTest] static-only ids -> one OWNER row per distinct id, no org lookup");
    }

    /**
     * Pins today's behaviour: a system static datasource id grants OWNER to any caller, the anonymous id included
     * (static datasources are the built-in ones every viewer of a public app must be able to run).
     */
    @Test
    void getAll_staticDatasource_grantsOwnerToAnonymousAndNonMemberCallers() {
        when(orgMemberService.getOrgMember(ORG_ID, "stranger")).thenReturn(Mono.empty());

        for (String caller : List.of(ANONYMOUS_USER_ID, "stranger")) {
            StepVerifier.create(handler.getAllMatchingPermissions(caller,
                            List.of(Datasource.QUICK_REST_API_ID, DATASOURCE_ID), ResourceAction.MANAGE_DATASOURCES))
                    .assertNext(map -> {
                        assertThat(map).containsOnlyKeys(Datasource.QUICK_REST_API_ID);
                        assertStaticOwnerRow(map.get(Datasource.QUICK_REST_API_ID), Datasource.QUICK_REST_API_ID, caller);
                    })
                    .verifyComplete();
        }
        System.out.println("[DatasourcePermissionHandlerTest] static datasource -> OWNER for anonymous and non-member callers");
    }

    /** The operations of the handler that decide a status: the generic check and the application/bundle clones. */
    enum Operation { RESOURCE, APPLICATION, BUNDLE }

    private Mono<UserPermissionOnResourceStatus> check(Operation op, String userId) {
        ResourceAction action = ResourceAction.USE_DATASOURCES;
        return switch (op) {
            case RESOURCE -> handler.checkUserPermissionStatusOnResource(userId, DATASOURCE_ID, action);
            case APPLICATION -> handler.checkUserPermissionStatusOnApplication(userId, DATASOURCE_ID, action,
                    ApplicationRequestType.PUBLIC_TO_ALL);
            case BUNDLE -> handler.checkUserPermissionStatusOnBundle(userId, DATASOURCE_ID, action, BundleRequestType.PUBLIC_TO_ALL);
        };
    }

    /** Catches datasources being public: the anonymous user never has a permission, only the anonymous failure. */
    @ParameterizedTest
    @EnumSource(Operation.class)
    void check_anonymousUser_failsWithAnonymousUser(Operation op) {
        StepVerifier.create(check(op, ANONYMOUS_USER_ID))
                .assertNext(status -> {
                    assertThat(status.hasPermission()).isFalse();
                    assertThat(status.failByAnonymousUser()).isTrue();
                })
                .verifyComplete();
        verifyNoInteractions(orgMemberService);
        System.out.println("[DatasourcePermissionHandlerTest] " + op + " anonymous -> anonymous-user failure");
    }

    /** Catches a wrong organisation resolution (getOrgId) or a broken member/no-row/unknown mapping on datasources. */
    @ParameterizedTest
    @EnumSource(Operation.class)
    void check_member_withRow_success_withoutRow_notEnough_unknownDatasource_notInOrg(Operation op) {
        // no row
        StepVerifier.create(check(op, USER_ID))
                .assertNext(status -> assertThat(status.failByNotEnoughPermission()).isTrue())
                .verifyComplete();
        verify(datasourceService).getById(DATASOURCE_ID);

        // with row
        ResourcePermission own = row(DATASOURCE_ID, USER_ID, ResourceRole.OWNER);
        when(resourcePermissionService.getByResourceTypeAndResourceIds(eq(ResourceType.DATASOURCE), any()))
                .thenReturn(Mono.just(Map.of(DATASOURCE_ID, List.of(own))));
        StepVerifier.create(check(op, USER_ID))
                .assertNext(status -> assertThat(status.getPermission()).isSameAs(own))
                .verifyComplete();

        // unknown datasource
        when(datasourceService.getById(any())).thenReturn(Mono.empty());
        StepVerifier.create(check(op, USER_ID))
                .assertNext(status -> assertThat(status.failByNotInOrg()).isTrue())
                .verifyComplete();
        System.out.println("[DatasourcePermissionHandlerTest] " + op + " member no row / row / unknown datasource checked");
    }

    /**
     * Catches admin lock-out on datasources. BF-090 (plan §9, was pinned as in the other handlers): the granted row has the
     * datasource as its resource and the user as its holder.
     */
    @ParameterizedTest
    @EnumSource(Operation.class)
    void check_orgAdmin_getsOwner_withTheResourceAndUserIdsBF090(Operation op) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(orgMember(MemberRole.ADMIN)));

        StepVerifier.create(check(op, USER_ID))
                .assertNext(status -> {
                    ResourcePermission granted = status.getPermission();
                    assertThat(granted.getResourceRole()).isEqualTo(ResourceRole.OWNER);
                    assertThat(granted.getResourceType()).isEqualTo(ResourceType.DATASOURCE);
                    assertThat(granted.getResourceId()).isEqualTo(DATASOURCE_ID);
                    assertThat(granted.getResourceHolderId()).isEqualTo(USER_ID);
                })
                .verifyComplete();
        verifyNoInteractions(resourcePermissionService);
        System.out.println("[DatasourcePermissionHandlerTest] " + op + " admin -> OWNER, resourceId " + DATASOURCE_ID + ", holder " + USER_ID);
    }

    private static ResourcePermission row(String resourceId, String userId, ResourceRole role) {
        return permission(ResourceType.DATASOURCE, resourceId, ResourceHolder.USER, userId, role);
    }

    private static void assertStaticOwnerRow(List<ResourcePermission> rows, String id, String callerId) {
        assertThat(rows).hasSize(1);
        ResourcePermission row = rows.get(0);
        assertThat(row.getResourceId()).isEqualTo(id);
        assertThat(row.getResourceType()).isEqualTo(ResourceType.DATASOURCE);
        assertThat(row.getResourceHolder()).isEqualTo(ResourceHolder.USER);
        assertThat(row.getResourceHolderId()).isEqualTo(callerId);
        assertThat(row.getResourceRole()).isEqualTo(ResourceRole.OWNER);
    }
}

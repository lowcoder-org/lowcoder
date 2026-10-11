package org.lowcoder.domain.permission.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * {@code ResourcePermission.matchUser/matchGroup} and the status factories of {@code UserPermissionOnResourceStatus}
 * (unit U3, task L3-1): the predicates that decide who may do what. A null group set is not tested: the only caller
 * passes a non-null set.
 */
class ResourcePermissionMatchTest {

    private static final String USER = "u1";
    private static final String GROUP = "g1";

    private static ResourcePermission perm(ResourceHolder holder, String holderId, ResourceRole role) {
        return ResourcePermission.builder().resourceType(ResourceType.APPLICATION).resourceId("r1")
                .resourceHolder(holder).resourceHolderId(holderId).resourceRole(role).build();
    }

    /** Catches matchUser granting on a group holder, another user, or an insufficient role. */
    @Test
    void matchUser_requiresUserHolder_sameId_andSufficientRole() {
        assertThat(perm(ResourceHolder.USER, USER, ResourceRole.EDITOR).matchUser(USER, ResourceAction.EDIT_APPLICATIONS)).isTrue();
        assertThat(perm(ResourceHolder.GROUP, USER, ResourceRole.OWNER).matchUser(USER, ResourceAction.READ_APPLICATIONS))
                .as("group holder with the same id").isFalse();
        assertThat(perm(ResourceHolder.USER, "other", ResourceRole.OWNER).matchUser(USER, ResourceAction.READ_APPLICATIONS))
                .as("other user").isFalse();
        assertThat(perm(ResourceHolder.USER, USER, ResourceRole.VIEWER).matchUser(USER, ResourceAction.MANAGE_APPLICATIONS))
                .as("VIEWER cannot MANAGE").isFalse();
        System.out.println("[ResourcePermissionMatchTest] matchUser holder/id/role conditions checked");
    }

    /** Catches matchGroup granting on a user holder, a foreign group, an empty set, or an insufficient role. */
    @Test
    void matchGroup_requiresGroupHolder_memberGroup_andSufficientRole() {
        assertThat(perm(ResourceHolder.GROUP, GROUP, ResourceRole.EDITOR).matchGroup(Set.of(GROUP), ResourceAction.EDIT_APPLICATIONS)).isTrue();
        assertThat(perm(ResourceHolder.USER, GROUP, ResourceRole.OWNER).matchGroup(Set.of(GROUP), ResourceAction.READ_APPLICATIONS))
                .as("user holder whose id is in the set").isFalse();
        assertThat(perm(ResourceHolder.GROUP, "g-other", ResourceRole.OWNER).matchGroup(Set.of(GROUP), ResourceAction.READ_APPLICATIONS))
                .as("foreign group").isFalse();
        assertThat(perm(ResourceHolder.GROUP, GROUP, ResourceRole.OWNER).matchGroup(Set.of(), ResourceAction.READ_APPLICATIONS))
                .as("empty group set").isFalse();
        assertThat(perm(ResourceHolder.GROUP, GROUP, ResourceRole.VIEWER).matchGroup(Set.of(GROUP), ResourceAction.EDIT_APPLICATIONS))
                .as("VIEWER cannot EDIT").isFalse();
        System.out.println("[ResourcePermissionMatchTest] matchGroup holder/set/role conditions checked");
    }

    static Stream<Arguments> statuses() {
        ResourcePermission granted = perm(ResourceHolder.USER, USER, ResourceRole.VIEWER);
        return Stream.of(
                Arguments.of("success", UserPermissionOnResourceStatus.success(granted), true, false, false, false),
                Arguments.of("notInOrg", UserPermissionOnResourceStatus.notInOrg(), false, true, false, false),
                Arguments.of("notEnoughPermission", UserPermissionOnResourceStatus.notEnoughPermission(), false, false, true, false),
                Arguments.of("anonymousUser", UserPermissionOnResourceStatus.anonymousUser(), false, false, false, true),
                Arguments.of("fail(NOT_IN_ORG)", UserPermissionOnResourceStatus.fail(UserPermissionOnResourceStatus.FailReason.NOT_IN_ORG),
                        false, true, false, false));
    }

    /** Catches a factory mapped to the wrong fail reason, or a status that is both granted and failed. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("statuses")
    void status_exactlyOneOutcomeFlagIsSet(String name, UserPermissionOnResourceStatus status, boolean hasPermission,
            boolean notInOrg, boolean notEnough, boolean anonymous) {
        assertThat(status.hasPermission()).isEqualTo(hasPermission);
        assertThat(status.failByNotInOrg()).isEqualTo(notInOrg);
        assertThat(status.failByNotEnoughPermission()).isEqualTo(notEnough);
        assertThat(status.failByAnonymousUser()).isEqualTo(anonymous);
        assertThat(status.getPermission() != null).isEqualTo(hasPermission);
        System.out.println("[ResourcePermissionMatchTest] status " + name + " flags checked");
    }
}

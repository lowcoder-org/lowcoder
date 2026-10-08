package org.lowcoder.domain.permission.solution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * SuggestAppAdminSolutionServiceImpl (unit U8, task L3-9): who is suggested as application admin, in which order and
 * under which limit. All collaborators are mocks; user names are resolved from the ids the service asks for.
 */
class SuggestAppAdminSolutionServiceImplTest {

    private static final String APP_ID = "app-1";
    private static final int LIMIT = 3;
    private static final int NAMES_LIMIT = 7;
    /** Room for two suggestions: a member of both owner groups and one more member. */
    private static final int TWO = 2;

    private final GroupMemberService groupMemberService = mock(GroupMemberService.class);
    private final UserService userService = mock(UserService.class);
    private final ResourcePermissionService permissionService = mock(ResourcePermissionService.class);
    private final SuggestAppAdminSolutionServiceImpl service =
            new SuggestAppAdminSolutionServiceImpl(groupMemberService, userService, permissionService);

    /** The ids the service asked the user service for, in order, and the ids the "database" does not know. */
    private final ArgumentCaptor<Collection<String>> askedIds = ArgumentCaptor.captor();
    private final Set<String> unknownUsers = new java.util.HashSet<>();

    @BeforeEach
    void stubUserServiceByIds() {
        when(userService.getByIds(any())).thenAnswer(invocation -> {
            Map<String, User> users = new HashMap<>();
            for (String id : (Collection<String>) invocation.getArgument(0)) {
                if (!unknownUsers.contains(id)) {
                    users.put(id, User.builder().id(id).name("name-" + id).build());
                }
            }
            return Mono.just(users);
        });
    }

    private static ResourcePermission permission(ResourceHolder holder, String holderId, ResourceRole role) {
        return ResourcePermission.builder().resourceType(ResourceType.APPLICATION).resourceId(APP_ID)
                .resourceHolder(holder).resourceHolderId(holderId).resourceRole(role).build();
    }

    private static ResourcePermission ownerUser(String id) {
        return permission(ResourceHolder.USER, id, ResourceRole.OWNER);
    }

    private static ResourcePermission ownerGroup(String id) {
        return permission(ResourceHolder.GROUP, id, ResourceRole.OWNER);
    }

    private void givenPermissions(ResourcePermission... permissions) {
        when(permissionService.getByApplicationId(APP_ID)).thenReturn(Mono.just(List.of(permissions)));
    }

    private void givenGroupMembers(String groupId, String... userIds) {
        List<GroupMember> members = new ArrayList<>();
        for (String userId : userIds) {
            members.add(GroupMember.builder().groupId(groupId).userId(userId).build());
        }
        when(groupMemberService.getGroupMembers(groupId)).thenReturn(Mono.just(members));
    }

    private static List<String> ids(List<User> users) {
        return users.stream().map(User::getId).toList();
    }

    /** Catches: non-owners (viewer, editor) or group holders being suggested as application admins. */
    @Test
    void onlyOwnerUsersAreSuggestedWhenThereIsRoomLeft() {
        givenPermissions(permission(ResourceHolder.USER, "viewer", ResourceRole.VIEWER), ownerUser("u1"),
                permission(ResourceHolder.USER, "editor", ResourceRole.EDITOR), ownerUser("u2"),
                permission(ResourceHolder.GROUP, "viewer-group", ResourceRole.VIEWER));

        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, LIMIT))
                .assertNext(users -> {
                    System.out.println("[SuggestAppAdminSolutionServiceImplTest] suggested " + ids(users));
                    assertThat(ids(users)).containsExactly("u1", "u2");
                })
                .verifyComplete();
        verify(groupMemberService, never()).getGroupMembers("viewer-group");
    }

    /** Catches: the limit being exceeded, and group members being looked up although the owner users already fill it. */
    @Test
    void ownerUsersAtOrAboveTheLimitAreTruncatedAndGroupsAreNotConsulted() {
        givenPermissions(ownerUser("u1"), ownerUser("u2"), ownerUser("u3"), ownerUser("u4"), ownerGroup("g1"));

        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, LIMIT))
                .assertNext(users -> assertThat(ids(users)).containsExactly("u1", "u2", "u3"))
                .verifyComplete();
        verifyNoInteractions(groupMemberService);

        // exactly at the limit counts as full too
        givenPermissions(ownerUser("u1"), ownerUser("u2"), ownerUser("u3"), ownerGroup("g1"));
        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, LIMIT))
                .assertNext(users -> assertThat(ids(users)).containsExactly("u1", "u2", "u3"))
                .verifyComplete();
        verifyNoInteractions(groupMemberService);
        System.out.println("[SuggestAppAdminSolutionServiceImplTest] limit reached by owner users: no group lookup");
    }

    /** Catches: duplicates against the owner users, the limit exceeded by group members, other groups' holders used. */
    @Test
    void ownerGroupMembersFillTheRemainderWithoutDuplicatingOwnerUsers() {
        givenPermissions(ownerUser("u1"), ownerGroup("g1"));
        givenGroupMembers("g1", "u1", "u2", "u3", "u4");

        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, LIMIT))
                .assertNext(users -> {
                    System.out.println("[SuggestAppAdminSolutionServiceImplTest] with group members " + ids(users));
                    assertThat(ids(users)).containsExactly("u1", "u2", "u3");
                })
                .verifyComplete();
    }

    /**
     * BF-138 (was pinned as plan section 9 row "SuggestAppAdminSolutionServiceImpl: a member of two OWNER groups is
     * suggested twice (dedupe only against owner users, :64-69)"): the filter knew only the owner USERS, so the same
     * person in two owner groups ended up twice in the id list and twice in the result. Group members are now distinct.
     */
    @Test
    void aMemberOfTwoOwnerGroupsIsSuggestedOnceBF138() {
        givenPermissions(ownerGroup("g1"), ownerGroup("g2"));
        givenGroupMembers("g1", "u2");
        givenGroupMembers("g2", "u2", "u3");

        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, NAMES_LIMIT))
                .assertNext(users -> {
                    System.out.println("[SuggestAppAdminSolutionServiceImplTest] member of two owner groups " + ids(users));
                    assertThat(ids(users)).containsExactly("u2", "u3");
                })
                .verifyComplete();
        verify(userService).getByIds(askedIds.capture());
        assertThat(askedIds.getValue()).containsExactly("u2", "u3");
    }

    /**
     * BF-138: the limit counts distinct people: with room for two group members, a member of both owner groups and one
     * more member are suggested. Catches: the dedupe placed after the limit, where the duplicate used up a place.
     */
    @Test
    void aMemberOfTwoOwnerGroupsCountsOnceAgainstTheLimitBF138() {
        givenPermissions(ownerGroup("g1"), ownerGroup("g2"));
        givenGroupMembers("g1", "u2");
        givenGroupMembers("g2", "u2", "u3");

        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, TWO))
                .assertNext(users -> {
                    System.out.println("[SuggestAppAdminSolutionServiceImplTest] limit " + TWO + " " + ids(users));
                    assertThat(ids(users)).containsExactly("u2", "u3");
                })
                .verifyComplete();
    }

    /** Catches: results in map order instead of suggestion order, and unknown (deleted) users coming back as null. */
    @Test
    void usersComeBackInSuggestionOrderAndUnknownIdsAreDropped() {
        givenPermissions(ownerUser("u3"), ownerUser("gone"), ownerUser("u1"));
        unknownUsers.add("gone");

        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, NAMES_LIMIT))
                .assertNext(users -> assertThat(ids(users)).containsExactly("u3", "u1").doesNotContainNull())
                .verifyComplete();
    }

    /** Catches: a wrong display limit (7) or separator (a single space) for the names shown next to an application. */
    @Test
    void suggestedNamesAreTheFirstSevenOwnersJoinedBySpaces() {
        givenPermissions(ownerUser("u1"), ownerUser("u2"), ownerUser("u3"), ownerUser("u4"), ownerUser("u5"),
                ownerUser("u6"), ownerUser("u7"), ownerUser("u8"));

        StepVerifier.create(service.getSuggestAppAdminNames(APP_ID))
                .assertNext(names -> {
                    System.out.println("[SuggestAppAdminSolutionServiceImplTest] names: " + names);
                    assertThat(names).isEqualTo("name-u1 name-u2 name-u3 name-u4 name-u5 name-u6 name-u7");
                })
                .verifyComplete();
        verify(userService).getByIds(askedIds.capture());
        assertThat(askedIds.getValue()).hasSize(NAMES_LIMIT);
    }

    /** Catches: a failure on an application without owners; limit 0 consulting groups. */
    @Test
    void noOwnersGiveAnEmptyListAndLimitZeroAsksForNothing() {
        givenPermissions();
        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, LIMIT))
                .assertNext(users -> assertThat(users).isEmpty())
                .verifyComplete();
        StepVerifier.create(service.getSuggestAppAdminNames(APP_ID))
                .assertNext(names -> assertThat(names).isEmpty())
                .verifyComplete();

        givenPermissions(ownerUser("u1"), ownerGroup("g1"));
        StepVerifier.create(service.getApplicationAdminUsers(APP_ID, 0))
                .assertNext(users -> assertThat(users).isEmpty())
                .verifyComplete();
        verify(groupMemberService, never()).getGroupMembers(anyString());
        System.out.println("[SuggestAppAdminSolutionServiceImplTest] empty permissions and limit 0 give empty results");
    }
}

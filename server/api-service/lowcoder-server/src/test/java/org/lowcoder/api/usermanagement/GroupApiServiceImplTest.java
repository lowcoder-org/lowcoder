package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.CreateGroupRequest;
import org.lowcoder.api.usermanagement.view.GroupMemberAggregateView;
import org.lowcoder.api.usermanagement.view.GroupMemberView;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.UpdateGroupRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.group.util.SystemGroups;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Unit test of {@link GroupApiServiceImpl} with every collaborator mocked: the visitor/role resolution and read
 * permission of the roster, the manage-permission gate of every mutation, the member updates and the group listing.
 *
 * <p>"No mutation" is asserted by subscription counters on the mocked service Monos (a Mono that is built but never
 * subscribed does not mutate), not by {@code verify(never())} on the call: {@code updateRoleForMember} and
 * {@code deleteGroup} build the service Mono eagerly, then chain it with {@code then(..)}.
 *
 * <p>Pinned production defects (owner decision D-6: fixes are deferred, a fix changes these tests on purpose):
 * <ul>
 * <li>A1 {@code subList}: {@code getGroupMembers} slices with an unguarded {@code subList}
 * (see {@link #getGroupMembers_pageBeyondLastPage_failsWithIllegalArgumentException} and
 * {@link #getGroupMembers_pageZero_failsWithIndexOutOfBounds}); the search variant guards it.</li>
 * <li>A1 {@code getPotentialGroupMembers} has no role or same-org check
 * (see {@link #getPotentialGroupMembers_hasNoPermissionOrSameOrgCheck_pinsDefect}).</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class GroupApiServiceImplTest {

    private static final String LOG_PREFIX = "[GroupApiServiceImplTest] ";

    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String GROUP_ID = "group-1";
    private static final String VISITOR_ID = "visitor-1";
    private static final String TARGET_USER_ID = "target-user";
    private static final String GROUP_NAME = "Group One";
    private static final String DYNAMIC_RULE = "{\"rule\":true}";
    private static final String ORG_MEMBER_STATE = "CURRENT";
    private static final long CREATED_AT_MILLIS = 5_000L;

    private static final String ROLE_MEMBER = MemberRole.MEMBER.getValue();
    private static final String ROLE_ADMIN = MemberRole.ADMIN.getValue();
    private static final String ROLE_SUPER_ADMIN = MemberRole.SUPER_ADMIN.getValue();

    private static final String STATS_ADMIN_COUNT = "adminUserCount";
    private static final String STATS_USER_COUNT = "userCount";
    private static final String STATS_USERS = "users";

    private static final String ALL_USERS_SEARCH_REGEX = ".*";

    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private GroupMemberService groupMemberService;
    @Mock
    private UserService userService;
    @Mock
    private GroupService groupService;
    @Mock
    private AbstractBizThresholdChecker bizThresholdChecker;
    @Mock
    private OrgMemberService orgMemberService;

    private GroupApiServiceImpl service;

    /** Subscriptions of the mocked mutating Monos; a rejected mutation must leave it at 0. */
    private final AtomicInteger mutations = new AtomicInteger();
    /** Subscription order of the mocked quota check and mutation, for the developer-quota ordering test. */
    private final List<String> events = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new GroupApiServiceImpl(sessionUserService, groupMemberService, userService, groupService,
                bizThresholdChecker, orgMemberService);
    }

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static OrgMember orgMember(MemberRole role) {
        return new OrgMember(ORG_ID, VISITOR_ID, role, ORG_MEMBER_STATE, 0L);
    }

    private static GroupMember groupMember(String userId, MemberRole role, long joinTime) {
        return new GroupMember(GROUP_ID, userId, role, ORG_ID, joinTime);
    }

    private static User user(String id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    private static Group group(String id, String orgId, String type, Boolean allUsersGroup) {
        return Group.builder()
                .id(id)
                .gid("gid-" + id)
                .name(GROUP_NAME)
                .organizationId(orgId)
                .type(type)
                .allUsersGroup(allUsersGroup)
                .createdAt(Instant.ofEpochMilli(CREATED_AT_MILLIS))
                .build();
    }

    private static Group normalGroup() {
        return group(GROUP_ID, ORG_ID, null, null);
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

    /**
     * Stubs what {@code getGroupAndOrgMemberInfo} reads. A null {@code groupMember} is "visitor not in the group",
     * a null {@code orgMember} is "no visitor org member", a null {@code group} is "unknown group". Lenient: which of
     * the lookups run depends on the branch under test.
     */
    private void stubVisitor(OrgMember orgMember, GroupMember groupMember, Group group) {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(groupMemberService.getGroupMember(GROUP_ID, VISITOR_ID))
                .thenReturn(groupMember == null ? Mono.empty() : Mono.just(groupMember));
        lenient().when(sessionUserService.getVisitorOrgMemberCache())
                .thenReturn(orgMember == null ? Mono.empty() : Mono.just(orgMember));
        lenient().when(groupService.getById(GROUP_ID)).thenReturn(group == null ? Mono.empty() : Mono.just(group));
    }

    private static GroupMember visitorGroupMember(MemberRole role) {
        return role == null ? null : groupMember(VISITOR_ID, role, 1L);
    }

    private static void assertBizError(Throwable error, BizError expected) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
    }

    private static List<String> userIds(GroupMemberAggregateView view) {
        return view.getMembers().stream().map(GroupMemberView::getUserId).toList();
    }

    /** Roster of {@code size} members u1..uN, joined at i*100, with users named user1..userN. */
    private static List<GroupMember> roster(int size) {
        return IntStream.rangeClosed(1, size)
                .mapToObj(i -> groupMember("u" + i, MemberRole.MEMBER, i * 100L))
                .toList();
    }

    private static Map<String, User> usersOf(int size) {
        return IntStream.rangeClosed(1, size).boxed()
                .collect(java.util.stream.Collectors.toMap(i -> "u" + i, i -> user("u" + i, "user" + i)));
    }

    /** The two roster readers share the permission and paging code; each test that can runs against both. */
    enum Variant {
        PLAIN {
            @Override
            Mono<GroupMemberAggregateView> call(GroupApiServiceImpl service, int page, int count) {
                return service.getGroupMembers(GROUP_ID, page, count);
            }
        },
        SEARCH {
            @Override
            Mono<GroupMemberAggregateView> call(GroupApiServiceImpl service, int page, int count) {
                return service.getGroupMembersForSearch(GROUP_ID, null, null, null, null, page, count);
            }
        };

        abstract Mono<GroupMemberAggregateView> call(GroupApiServiceImpl service, int page, int count);
    }

    private void stubRoster(Variant variant, List<GroupMember> members) {
        if (variant == Variant.PLAIN) {
            when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(members));
        } else {
            when(groupMemberService.getGroupMembersByIdAndRole(GROUP_ID, null)).thenReturn(Mono.just(members));
        }
    }

    private void verifyRosterNotRead(Variant variant) {
        if (variant == Variant.PLAIN) {
            verify(groupMemberService, never()).getGroupMembers(GROUP_ID);
        } else {
            verify(groupMemberService, never()).getGroupMembersByIdAndRole(any(), any());
        }
    }

    // ------------------------------------------------------------------ roster: visitor role and read permission

    static Stream<Arguments> visitorRoles() {
        List<Arguments> args = new ArrayList<>();
        for (Variant variant : Variant.values()) {
            args.add(Arguments.of(variant, MemberRole.SUPER_ADMIN, null, ROLE_SUPER_ADMIN));
            args.add(Arguments.of(variant, MemberRole.MEMBER, MemberRole.SUPER_ADMIN, ROLE_SUPER_ADMIN));
            args.add(Arguments.of(variant, MemberRole.ADMIN, MemberRole.SUPER_ADMIN, ROLE_SUPER_ADMIN));
            args.add(Arguments.of(variant, MemberRole.ADMIN, null, ROLE_ADMIN));
            args.add(Arguments.of(variant, MemberRole.ADMIN, MemberRole.MEMBER, ROLE_ADMIN));
            args.add(Arguments.of(variant, MemberRole.MEMBER, MemberRole.ADMIN, ROLE_ADMIN));
            args.add(Arguments.of(variant, MemberRole.MEMBER, MemberRole.MEMBER, ROLE_MEMBER));
        }
        return args.stream();
    }

    /**
     * Catches a wrong visitor role in the roster response (SUPER_ADMIN above ADMIN above MEMBER, taken from either the
     * org membership or the group membership) and a read permission that excludes org admins or group members.
     */
    @ParameterizedTest(name = "{0}: org {1}, group {2} -> {3}")
    @MethodSource("visitorRoles")
    void roster_resolvesVisitorRole(Variant variant, MemberRole orgRole, MemberRole groupRole, String expectedRole) {
        stubVisitor(orgMember(orgRole), visitorGroupMember(groupRole), normalGroup());
        stubRoster(variant, roster(1));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(usersOf(1)));

        StepVerifier.create(variant.call(service, 1, 10))
                .assertNext(view -> assertThat(view.getVisitorRole()).isEqualTo(expectedRole))
                .verifyComplete();
        say("%s: org=%s group=%s -> visitorRole=%s", variant, orgRole, groupRole, expectedRole);
    }

    /**
     * Catches a roster read open to a user who is neither a member of the group nor an admin: NOT_AUTHORIZED and the
     * roster is never read.
     */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void roster_outsiderWithoutGroupMembership_isNotAuthorized(Variant variant) {
        stubVisitor(orgMember(MemberRole.MEMBER), null, normalGroup());

        StepVerifier.create(variant.call(service, 1, 10))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED))
                .verify();
        verifyRosterNotRead(variant);
        say("%s: org member without group membership -> NOT_AUTHORIZED, roster not read", variant);
    }

    static Stream<Arguments> invalidGroupScenarios() {
        List<Arguments> args = new ArrayList<>();
        for (Variant variant : Variant.values()) {
            args.add(Arguments.of(variant, "group of another organization", MemberRole.SUPER_ADMIN,
                    group(GROUP_ID, OTHER_ORG_ID, null, null)));
            args.add(Arguments.of(variant, "unknown group", MemberRole.ADMIN, null));
            args.add(Arguments.of(variant, "no visitor org member", null, normalGroup()));
        }
        return args.stream();
    }

    /**
     * Catches the cross-tenant read: a group whose organization differs from the visitor's org member must be
     * INVALID_GROUP_ID even for a super admin, as must an unknown group and a missing visitor org member.
     */
    @ParameterizedTest(name = "{0}: {1}")
    @MethodSource("invalidGroupScenarios")
    void roster_groupNotInVisitorOrganization_isInvalidGroupId(Variant variant, String label, MemberRole orgRole,
            Group group) {
        stubVisitor(orgRole == null ? null : orgMember(orgRole), visitorGroupMember(MemberRole.ADMIN), group);

        StepVerifier.create(variant.call(service, 1, 10))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_GROUP_ID))
                .verify();
        verifyRosterNotRead(variant);
        say("%s: %s -> INVALID_GROUP_ID, roster not read", variant, label);
    }

    @ParameterizedTest
    @EnumSource(Variant.class)
    void roster_emptyRoster_returnsEmptyListWithTotalZeroAndNoUserLookup(Variant variant) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        stubRoster(variant, List.of());

        StepVerifier.create(variant.call(service, 1, 10))
                .assertNext(view -> {
                    assertThat(view.getMembers()).isEmpty();
                    assertThat(view.getTotal()).isZero();
                    assertThat(view.getVisitorRole()).isEqualTo(ROLE_ADMIN);
                })
                .verifyComplete();
        verifyNoInteractions(userService);
        say("%s: empty roster -> no members, total 0, users not looked up", variant);
    }

    /**
     * Catches members whose user record is gone leaking into the page as null views, and a total that still counts them.
     */
    @ParameterizedTest
    @EnumSource(Variant.class)
    void roster_membersWithoutUserRecord_areDroppedFromListAndTotal(Variant variant) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        stubRoster(variant, roster(3));
        Map<String, User> twoOfThree = Map.of("u1", user("u1", "user1"), "u3", user("u3", "user3"));
        ArgumentCaptor<Collection<String>> requestedIds = ArgumentCaptor.forClass(Collection.class);
        when(userService.getByIds(requestedIds.capture())).thenReturn(Mono.just(twoOfThree));

        StepVerifier.create(variant.call(service, 1, 10))
                .assertNext(view -> {
                    assertThat(userIds(view)).containsExactly("u1", "u3");
                    assertThat(view.getTotal()).isEqualTo(2);
                })
                .verifyComplete();
        assertThat(requestedIds.getValue()).containsExactlyInAnyOrder("u1", "u2", "u3");
        say("%s: u2 has no user record -> dropped, total 2; user lookup asked for %s", variant, requestedIds.getValue());
    }

    static Stream<Arguments> pages() {
        List<Arguments> args = new ArrayList<>();
        for (Variant variant : Variant.values()) {
            args.add(Arguments.of(variant, 5, 1, 2, List.of("u1", "u2")));
            args.add(Arguments.of(variant, 5, 2, 2, List.of("u3", "u4")));
            args.add(Arguments.of(variant, 5, 3, 2, List.of("u5")));
            args.add(Arguments.of(variant, 5, 1, 10, List.of("u1", "u2", "u3", "u4", "u5")));
            args.add(Arguments.of(variant, 5, 1, 0, List.of("u1", "u2", "u3", "u4", "u5")));
            // the page right after an exactly full last page: from == to, an empty page and no error
            args.add(Arguments.of(variant, 4, 3, 2, List.of()));
        }
        return args.stream();
    }

    /**
     * Catches an off-by-one in the page slice, a total that is the page size instead of the roster size, and the
     * {@code count == 0 means all} rule; pageNum and pageSize are echoed.
     */
    @ParameterizedTest(name = "{0}: {1} members, page {2}, count {3} -> {4}")
    @MethodSource("pages")
    void roster_pagination_returnsRequestedSliceAndFullTotal(Variant variant, int size, int page, int count,
            List<String> expectedIds) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        stubRoster(variant, roster(size));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(usersOf(size)));

        StepVerifier.create(variant.call(service, page, count))
                .assertNext(view -> {
                    assertThat(userIds(view)).isEqualTo(expectedIds);
                    assertThat(view.getTotal()).isEqualTo(size);
                    assertThat(view.getPageNum()).isEqualTo(page);
                    assertThat(view.getPageSize()).isEqualTo(count);
                })
                .verifyComplete();
        say("%s: %d members, page %d count %d -> %s, total %d", variant, size, page, count, expectedIds, size);
    }

    /**
     * Pins defect A1 (plan section 9): {@code getGroupMembers} slices with {@code list.subList((page - 1) * count,
     * min(page * count, total))} unguarded. Three members, page 3 of size 2 gives subList(4, 3) and the call fails
     * with an IllegalArgumentException instead of returning an empty page (the search variant guards it, see
     * {@link #roster_pagination_returnsRequestedSliceAndFullTotal}). A fix changes this test on purpose.
     */
    @ParameterizedTest
    @ValueSource(ints = {3, 4})
    void getGroupMembers_pageBeyondLastPage_failsWithIllegalArgumentException(int page) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        stubRoster(Variant.PLAIN, roster(3));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(usersOf(3)));

        StepVerifier.create(service.getGroupMembers(GROUP_ID, page, 2))
                .expectErrorSatisfies(error -> assertThat(error).isExactlyInstanceOf(IllegalArgumentException.class))
                .verify();
        say("getGroupMembers: 3 members, page %d size 2 -> IllegalArgumentException (defect A1 pinned)", page);
    }

    /**
     * Pins defect A1 (plan section 9), same unguarded {@code subList}: page 0 gives a negative fromIndex and the call
     * fails with an IndexOutOfBoundsException. A fix changes this test on purpose.
     */
    @Test
    void getGroupMembers_pageZero_failsWithIndexOutOfBounds() {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        stubRoster(Variant.PLAIN, roster(3));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(usersOf(3)));

        StepVerifier.create(service.getGroupMembers(GROUP_ID, 0, 2))
                .expectErrorSatisfies(error -> assertThat(error).isInstanceOf(IndexOutOfBoundsException.class))
                .verify();
        say("getGroupMembers: page 0 size 2 -> IndexOutOfBoundsException (defect A1 pinned)");
    }

    // ------------------------------------------------------------------ roster: search, role filter, sort

    private List<GroupMember> sortRoster() {
        return List.of(
                groupMember("u1", MemberRole.MEMBER, 300),
                groupMember("u2", MemberRole.ADMIN, 100),
                groupMember("u3", MemberRole.SUPER_ADMIN, 200),
                groupMember("u4", MemberRole.MEMBER, 400));
    }

    private Map<String, User> sortUsers() {
        return Map.of("u1", user("u1", "bravo"), "u2", user("u2", "Alpha"),
                "u3", user("u3", "Delta"), "u4", user("u4", "charlie"));
    }

    private GroupMemberAggregateView search(String search, String sort, String order, int page, int size,
            List<GroupMember> roster, Map<String, User> users) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        when(groupMemberService.getGroupMembersByIdAndRole(GROUP_ID, null)).thenReturn(Mono.just(roster));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(users));
        return service.getGroupMembersForSearch(GROUP_ID, search, null, sort, order, page, size).block();
    }

    static Stream<Arguments> sorts() {
        return Stream.of(
                Arguments.of("userName", "asc", List.of("u2", "u1", "u4", "u3"), null),
                Arguments.of("userName", "desc", List.of("u3", "u4", "u1", "u2"), null),
                Arguments.of("USERNAME", "DESC", List.of("u3", "u4", "u1", "u2"), null),
                Arguments.of("userName", null, List.of("u2", "u1", "u4", "u3"), null),
                Arguments.of("userName", "sideways", List.of("u2", "u1", "u4", "u3"), null),
                Arguments.of("role", "asc", List.of("u2", "u1", "u4", "u3"), null),
                Arguments.of("role", "desc", List.of("u3", "u1", "u4", "u2"), null),
                Arguments.of("joinTime", "asc", List.of("u2", "u3", "u1", "u4"), null),
                Arguments.of("joinTime", "desc", List.of("u4", "u1", "u3", "u2"), null),
                Arguments.of("unknownKey", "desc", List.of("u1", "u2", "u3", "u4"), null),
                Arguments.of("", "desc", List.of("u1", "u2", "u3", "u4"), null),
                Arguments.of(null, "desc", List.of("u1", "u2", "u3", "u4"), null),
                // desc is reversed() over nullsLast: the member without a user name (u4) comes FIRST (pinned
                // behaviour, the usual database convention), then Delta, bravo, Alpha
                Arguments.of("userName", "desc", List.of("u4", "u3", "u1", "u2"), "u4"));
    }

    /**
     * Catches a wrong comparator per sort key, a case-sensitive userName compare (names bravo/Alpha/Delta/charlie sort
     * differently case-sensitively), a descending flag that is ignored or applied to the wrong key, and an unknown or
     * blank sort key that reorders the roster instead of leaving it as stored. The last case pins that a descending userName
     * sort puts a member without a name first ({@code reversed()} over {@code nullsLast}).
     */
    @ParameterizedTest(name = "sort {0} {1} -> {2} (nameless: {3})")
    @MethodSource("sorts")
    void search_sortsByKeyAndOrder(String sort, String order, List<String> expectedIds, String nameLessUserId) {
        Map<String, User> users = new java.util.HashMap<>(sortUsers());
        if (nameLessUserId != null) {
            users.put(nameLessUserId, user(nameLessUserId, null));
        }
        GroupMemberAggregateView view = search(null, sort, order, 1, 10, sortRoster(), users);

        assertThat(userIds(view)).isEqualTo(expectedIds);
        assertThat(view.getTotal()).isEqualTo(4);
        say("search: sort=%s order=%s nameless=%s -> %s", sort, order, nameLessUserId, expectedIds);
    }

    /**
     * Catches nulls not sorted last on an ascending userName sort (a member whose user has no name).
     */
    @Test
    void search_sortByUserNameAscending_putsMembersWithoutNameLast() {
        Map<String, User> users = Map.of("u1", user("u1", null), "u2", user("u2", "Alpha"),
                "u3", user("u3", "bravo"), "u4", user("u4", "charlie"));

        GroupMemberAggregateView view = search(null, "userName", "asc", 1, 10, sortRoster(), users);

        assertThat(userIds(view)).containsExactly("u2", "u3", "u4", "u1");
        say("search: ascending userName sort puts the nameless member last: %s", userIds(view));
    }

    static Stream<Arguments> searchTerms() {
        return Stream.of(
                Arguments.of("ali", List.of("u1", "u3")),
                Arguments.of("ALI", List.of("u1", "u3")),
                Arguments.of("bob", List.of("u2")),
                Arguments.of("nobody", List.of()),
                Arguments.of(null, List.of("u1", "u2", "u3", "u4")),
                Arguments.of("", List.of("u1", "u2", "u3", "u4")),
                Arguments.of("   ", List.of("u1", "u2", "u3", "u4")));
    }

    /**
     * Catches a case-sensitive match, a search that ignores the user name, a blank term that filters everything, a
     * member without a name matching a real term, and a total that is not the filtered size.
     */
    @ParameterizedTest(name = "search [{0}] -> {1}")
    @MethodSource("searchTerms")
    void search_filtersByUserNameIgnoringCase(String term, List<String> expectedIds) {
        Map<String, User> users = Map.of("u1", user("u1", "Alice"), "u2", user("u2", "bob"),
                "u3", user("u3", "ALIcia"), "u4", user("u4", null));

        GroupMemberAggregateView view = search(term, null, null, 1, 10, roster(4), users);

        assertThat(userIds(view)).isEqualTo(expectedIds);
        assertThat(view.getTotal()).isEqualTo(expectedIds.size());
        say("search: term [%s] -> %s, total %d", term, expectedIds, expectedIds.size());
    }

    /**
     * Catches paging applied before the filter: page 2 of size 1 over the two matches is the second match, and a
     * page beyond the end of the filtered list is empty (the guard the plain variant lacks) with the total kept.
     */
    @Test
    void search_pagesTheFilteredList_andPageBeyondEndIsEmpty() {
        Map<String, User> users = Map.of("u1", user("u1", "Alice"), "u2", user("u2", "bob"),
                "u3", user("u3", "ALIcia"), "u4", user("u4", "dora"));

        GroupMemberAggregateView second = search("ali", null, null, 2, 1, roster(4), users);
        assertThat(userIds(second)).containsExactly("u3");
        assertThat(second.getTotal()).isEqualTo(2);

        GroupMemberAggregateView beyond = search("ali", null, null, 5, 1, roster(4), users);
        assertThat(beyond.getMembers()).isEmpty();
        assertThat(beyond.getTotal()).isEqualTo(2);
        say("search: filtered page 2 -> %s; page 5 -> empty, total %d", userIds(second), beyond.getTotal());
    }

    /**
     * Catches the role filter not reaching the service: the role string is forwarded to
     * {@code getGroupMembersByIdAndRole} unchanged (the stub only matches "admin").
     */
    @Test
    void search_forwardsRoleFilterToTheMemberService() {
        stubVisitor(orgMember(MemberRole.MEMBER), visitorGroupMember(MemberRole.MEMBER), normalGroup());
        when(groupMemberService.getGroupMembersByIdAndRole(GROUP_ID, ROLE_ADMIN))
                .thenReturn(Mono.just(List.of(groupMember("u1", MemberRole.ADMIN, 1L))));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(usersOf(1)));

        StepVerifier.create(service.getGroupMembersForSearch(GROUP_ID, null, ROLE_ADMIN, null, null, 1, 10))
                .assertNext(view -> {
                    assertThat(userIds(view)).containsExactly("u1");
                    assertThat(view.getVisitorRole()).isEqualTo(ROLE_MEMBER);
                })
                .verifyComplete();
        say("search: role filter %s forwarded to getGroupMembersByIdAndRole", ROLE_ADMIN);
    }

    // ------------------------------------------------------------------ mutations: manage permission

    enum Mutation {
        ADD_MEMBER, UPDATE_ROLE, DELETE_GROUP, UPDATE_GROUP, REMOVE_USER
    }

    private void stubMutation(Mutation mutation) {
        switch (mutation) {
            case ADD_MEMBER -> lenient().when(groupMemberService.addMember(ORG_ID, GROUP_ID, TARGET_USER_ID, MemberRole.MEMBER))
                    .thenReturn(counting(true));
            case UPDATE_ROLE -> lenient().when(groupMemberService.updateMemberRole(GROUP_ID, TARGET_USER_ID, MemberRole.ADMIN))
                    .thenReturn(counting(true));
            case DELETE_GROUP -> lenient().when(groupService.delete(GROUP_ID)).thenReturn(countingVoid());
            case UPDATE_GROUP -> lenient().when(groupService.updateGroup(any(Group.class))).thenReturn(counting(true));
            case REMOVE_USER -> lenient().when(groupMemberService.removeMember(GROUP_ID, TARGET_USER_ID))
                    .thenReturn(counting(true));
        }
    }

    private Mono<Boolean> invoke(Mutation mutation) {
        UpdateRoleRequest roleRequest = new UpdateRoleRequest();
        roleRequest.setUserId(TARGET_USER_ID);
        roleRequest.setRole(ROLE_ADMIN);
        UpdateGroupRequest updateRequest = new UpdateGroupRequest();
        updateRequest.setGroupName("renamed");
        return switch (mutation) {
            case ADD_MEMBER -> service.addGroupMember(GROUP_ID, TARGET_USER_ID, ROLE_MEMBER);
            case UPDATE_ROLE -> service.updateRoleForMember(GROUP_ID, roleRequest);
            case DELETE_GROUP -> service.deleteGroup(GROUP_ID);
            case UPDATE_GROUP -> service.update(GROUP_ID, updateRequest);
            case REMOVE_USER -> service.removeUser(GROUP_ID, TARGET_USER_ID);
        };
    }

    static Stream<Arguments> mutationsWithoutManagePermission() {
        List<Arguments> args = new ArrayList<>();
        for (Mutation mutation : Mutation.values()) {
            args.add(Arguments.of(mutation, "org member outside the group", null));
            args.add(Arguments.of(mutation, "plain group member", MemberRole.MEMBER));
        }
        return args.stream();
    }

    /**
     * Catches mutate-before-authorise: a visitor who is neither a group admin nor an org admin gets NOT_AUTHORIZED and
     * the mocked mutation Mono is never subscribed, for every mutating call of the service.
     */
    @ParameterizedTest(name = "{0} as {1}")
    @MethodSource("mutationsWithoutManagePermission")
    void mutation_withoutManagePermission_isNotAuthorizedAndMutatesNothing(Mutation mutation, String label,
            MemberRole groupRole) {
        stubVisitor(orgMember(MemberRole.MEMBER), visitorGroupMember(groupRole), normalGroup());
        stubMutation(mutation);

        StepVerifier.create(invoke(mutation))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED))
                .verify();
        assertThat(mutations).hasValue(0);
        say("%s as %s -> NOT_AUTHORIZED, mutation subscriptions: %d", mutation, label, mutations.get());
    }

    static Stream<Arguments> mutationsWithManagePermission() {
        List<Arguments> args = new ArrayList<>();
        for (Mutation mutation : Mutation.values()) {
            args.add(Arguments.of(mutation, MemberRole.ADMIN, null));
            args.add(Arguments.of(mutation, MemberRole.SUPER_ADMIN, null));
            args.add(Arguments.of(mutation, MemberRole.MEMBER, MemberRole.ADMIN));
            args.add(Arguments.of(mutation, MemberRole.MEMBER, MemberRole.SUPER_ADMIN));
        }
        return args.stream();
    }

    /**
     * Catches a manage permission that drops one of its four sources (org admin, org super admin, group admin, group
     * super admin): the mutation runs exactly once and returns true.
     */
    @ParameterizedTest(name = "{0}: org {1}, group {2}")
    @MethodSource("mutationsWithManagePermission")
    void mutation_withManagePermission_runsOnceAndReturnsTrue(Mutation mutation, MemberRole orgRole,
            MemberRole groupRole) {
        stubVisitor(orgMember(orgRole), visitorGroupMember(groupRole), normalGroup());
        stubMutation(mutation);

        StepVerifier.create(invoke(mutation)).expectNext(true).verifyComplete();
        assertThat(mutations).hasValue(1);
        say("%s: org %s, group %s -> true after one mutation", mutation, orgRole, groupRole);
    }

    // ------------------------------------------------------------------ addGroupMember: developer quota

    /**
     * Catches the developer quota bypass: for a dev group {@code checkMaxDeveloperCount(orgId, groupId, newUserId)}
     * runs and completes before {@code addMember} is subscribed.
     */
    @Test
    void addGroupMember_devGroup_checksDeveloperQuotaBeforeAddingTheMember() {
        stubVisitor(orgMember(MemberRole.ADMIN), null, group(GROUP_ID, ORG_ID, SystemGroups.DEV, null));
        when(bizThresholdChecker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, TARGET_USER_ID))
                .thenReturn(Mono.defer(() -> {
                    events.add("quota");
                    return Mono.empty();
                }));
        when(groupMemberService.addMember(ORG_ID, GROUP_ID, TARGET_USER_ID, MemberRole.ADMIN))
                .thenReturn(Mono.defer(() -> {
                    events.add("addMember");
                    return Mono.just(true);
                }));

        StepVerifier.create(service.addGroupMember(GROUP_ID, TARGET_USER_ID, ROLE_ADMIN)).expectNext(true).verifyComplete();

        assertThat(events).containsExactly("quota", "addMember");
        say("addGroupMember dev group: subscription order %s", events);
    }

    /**
     * Catches a quota error that does not stop the add: EXCEED_MAX_DEVELOPER_COUNT propagates and {@code addMember}
     * is never subscribed.
     */
    @Test
    void addGroupMember_devGroupOverQuota_failsAndAddsNobody() {
        stubVisitor(orgMember(MemberRole.ADMIN), null, group(GROUP_ID, ORG_ID, SystemGroups.DEV, null));
        when(bizThresholdChecker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, TARGET_USER_ID))
                .thenReturn(Mono.error(new BizException(BizError.EXCEED_MAX_DEVELOPER_COUNT, "EXCEED_MAX_DEVELOPER_COUNT")));
        when(groupMemberService.addMember(ORG_ID, GROUP_ID, TARGET_USER_ID, MemberRole.MEMBER)).thenReturn(counting(true));

        StepVerifier.create(service.addGroupMember(GROUP_ID, TARGET_USER_ID, ROLE_MEMBER))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.EXCEED_MAX_DEVELOPER_COUNT))
                .verify();
        assertThat(mutations).hasValue(0);
        say("addGroupMember dev group over quota -> EXCEED_MAX_DEVELOPER_COUNT, member not added");
    }

    /**
     * Catches the quota check running for a normal group (it would reject adds to ordinary groups) and the role name
     * mapping: a known name maps to its role, an unknown name to MEMBER.
     */
    @ParameterizedTest
    @MethodSource("roleNames")
    void addGroupMember_normalGroup_skipsDeveloperQuotaAndMapsRoleName(String roleName, MemberRole expectedRole) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        when(groupMemberService.addMember(ORG_ID, GROUP_ID, TARGET_USER_ID, expectedRole)).thenReturn(Mono.just(true));

        StepVerifier.create(service.addGroupMember(GROUP_ID, TARGET_USER_ID, roleName)).expectNext(true).verifyComplete();

        verifyNoInteractions(bizThresholdChecker);
        say("addGroupMember normal group: role name [%s] -> %s, quota check not run", roleName, expectedRole);
    }

    static Stream<Arguments> roleNames() {
        return Stream.of(
                Arguments.of(ROLE_ADMIN, MemberRole.ADMIN),
                Arguments.of(ROLE_MEMBER, MemberRole.MEMBER),
                Arguments.of("no-such-role", MemberRole.MEMBER));
    }

    // ------------------------------------------------------------------ leaveGroup, deleteGroup, create, update, removeUser

    static Stream<Arguments> leaveCases() {
        return Stream.of(
                Arguments.of("visitor is the only admin", List.of(VISITOR_ID), false),
                Arguments.of("the only admin is someone else", List.of("other-admin"), true),
                Arguments.of("visitor and another admin", List.of(VISITOR_ID, "other-admin"), true),
                Arguments.of("group without admins", List.<String>of(), true));
    }

    /**
     * Catches a group left without any admin (the last admin may not leave) and the opposite, a leave blocked when
     * the visitor is not the sole admin.
     */
    @ParameterizedTest(name = "{0}: leaves = {2}")
    @MethodSource("leaveCases")
    void leaveGroup_onlyTheLastAdminIsBlocked(String label, List<String> adminIds, boolean leaves) {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        when(groupMemberService.getAllGroupAdmin(GROUP_ID)).thenReturn(Mono.just(
                adminIds.stream().map(id -> groupMember(id, MemberRole.ADMIN, 1L)).toList()));
        lenient().when(groupMemberService.removeMember(GROUP_ID, VISITOR_ID)).thenReturn(counting(true));

        if (leaves) {
            StepVerifier.create(service.leaveGroup(GROUP_ID)).expectNext(true).verifyComplete();
            assertThat(mutations).hasValue(1);
        } else {
            StepVerifier.create(service.leaveGroup(GROUP_ID))
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.CANNOT_LEAVE_GROUP))
                    .verify();
            assertThat(mutations).hasValue(0);
        }
        say("leaveGroup: %s -> leaves=%s", label, leaves);
    }

    static Stream<Arguments> systemGroups() {
        return Stream.of(
                Arguments.of(SystemGroups.DEV, null),
                Arguments.of(SystemGroups.ALL_USER, null),
                Arguments.of(null, Boolean.TRUE));
    }

    /**
     * Catches a system group (dev group, all-users group by type or by flag) being deletable: CANNOT_DELETE_SYSTEM_GROUP
     * and the delete Mono is never subscribed.
     */
    @ParameterizedTest(name = "type {0}, allUsersGroup {1}")
    @MethodSource("systemGroups")
    void deleteGroup_systemGroup_cannotBeDeleted(String type, Boolean allUsersGroup) {
        stubVisitor(orgMember(MemberRole.ADMIN), null, group(GROUP_ID, ORG_ID, type, allUsersGroup));
        when(groupService.delete(GROUP_ID)).thenReturn(countingVoid());

        StepVerifier.create(service.deleteGroup(GROUP_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.CANNOT_DELETE_SYSTEM_GROUP))
                .verify();
        assertThat(mutations).hasValue(0);
        say("deleteGroup: system group (type=%s, allUsersGroup=%s) -> CANNOT_DELETE_SYSTEM_GROUP", type, allUsersGroup);
    }

    @ParameterizedTest
    @EnumSource(value = MemberRole.class, names = {"ADMIN", "SUPER_ADMIN"})
    void create_admin_checksGroupQuotaThenCreatesTheGroupInTheVisitorsOrganization(MemberRole role) {
        OrgMember admin = orgMember(role);
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(admin));
        when(bizThresholdChecker.checkMaxGroupCount(admin)).thenReturn(Mono.defer(() -> {
            events.add("quota");
            return Mono.empty();
        }));
        ArgumentCaptor<Group> created = ArgumentCaptor.forClass(Group.class);
        Group stored = normalGroup();
        when(groupService.create(created.capture(), eq(VISITOR_ID), eq(ORG_ID))).thenReturn(Mono.defer(() -> {
            events.add("create");
            return Mono.just(stored);
        }));
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName(GROUP_NAME);
        request.setDynamicRule(DYNAMIC_RULE);

        StepVerifier.create(service.create(request)).expectNext(stored).verifyComplete();

        Group group = created.getValue();
        assertThat(events).containsExactly("quota", "create");
        assertThat(group.getOrganizationId()).isEqualTo(ORG_ID);
        assertThat(group.getName(java.util.Locale.ENGLISH)).isEqualTo(GROUP_NAME);
        assertThat(group.getDynamicRule()).isEqualTo(DYNAMIC_RULE);
        assertThat(UUID.fromString(group.getGid())).isNotNull();
        say("create as %s: %s, group org=%s name=%s gid=%s", role, events, group.getOrganizationId(),
                group.getName(java.util.Locale.ENGLISH), group.getGid());
    }

    /**
     * Catches a group created by a plain member: NOT_AUTHORIZED, the quota is not even consulted and nothing is
     * created.
     */
    @Test
    void create_plainMember_isNotAuthorizedAndCreatesNothing() {
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName(GROUP_NAME);

        StepVerifier.create(service.create(request))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED))
                .verify();
        verifyNoInteractions(bizThresholdChecker, groupService);
        say("create as plain member -> NOT_AUTHORIZED, quota and group service untouched");
    }

    /**
     * Catches a group created although the quota check failed (the check must gate the create): EXCEED_MAX_GROUP_COUNT
     * propagates and the create Mono is never subscribed.
     */
    @Test
    void create_overGroupQuota_failsBeforeCreating() {
        OrgMember admin = orgMember(MemberRole.ADMIN);
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(admin));
        when(bizThresholdChecker.checkMaxGroupCount(admin))
                .thenReturn(Mono.error(new BizException(BizError.EXCEED_MAX_GROUP_COUNT, "EXCEED_MAX_GROUP_COUNT")));
        lenient().when(groupService.create(any(Group.class), eq(VISITOR_ID), eq(ORG_ID))).thenReturn(counting(normalGroup()));
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName(GROUP_NAME);

        StepVerifier.create(service.create(request))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.EXCEED_MAX_GROUP_COUNT))
                .verify();
        assertThat(mutations).hasValue(0);
        say("create over quota -> EXCEED_MAX_GROUP_COUNT, group not created");
    }

    /**
     * Catches the update writing the wrong group or fields: the Group handed to {@code updateGroup} carries the path
     * group id, the new name and the new dynamic rule.
     */
    @Test
    void update_handsTheGroupIdNameAndRuleToTheGroupService() {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        ArgumentCaptor<Group> updated = ArgumentCaptor.forClass(Group.class);
        when(groupService.updateGroup(updated.capture())).thenReturn(Mono.just(true));
        UpdateGroupRequest request = new UpdateGroupRequest();
        request.setGroupName("renamed");
        request.setDynamicRule(DYNAMIC_RULE);

        StepVerifier.create(service.update(GROUP_ID, request)).expectNext(true).verifyComplete();

        Group group = updated.getValue();
        assertThat(group.getId()).isEqualTo(GROUP_ID);
        assertThat(group.getName(java.util.Locale.ENGLISH)).isEqualTo("renamed");
        assertThat(group.getDynamicRule()).isEqualTo(DYNAMIC_RULE);
        say("update: group %s renamed to %s with rule %s", group.getId(), group.getName(java.util.Locale.ENGLISH),
                group.getDynamicRule());
    }

    /**
     * Catches an admin removing their own membership through {@code removeUser}: CANNOT_REMOVE_MYSELF and nothing
     * is removed.
     */
    @Test
    void removeUser_removingYourself_isRejected() {
        stubVisitor(orgMember(MemberRole.ADMIN), null, normalGroup());
        lenient().when(groupMemberService.removeMember(GROUP_ID, VISITOR_ID)).thenReturn(counting(true));

        StepVerifier.create(service.removeUser(GROUP_ID, VISITOR_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.CANNOT_REMOVE_MYSELF))
                .verify();
        assertThat(mutations).hasValue(0);
        say("removeUser: visitor removing themselves -> CANNOT_REMOVE_MYSELF");
    }

    // ------------------------------------------------------------------ getGroups

    @Test
    void getGroups_anonymousVisitor_getsAnEmptyListWithoutOrgLookup() {
        when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(true));

        StepVerifier.create(service.getGroups()).expectNext(List.of()).verifyComplete();

        verify(sessionUserService, never()).getVisitorOrgMemberCache();
        verifyNoInteractions(groupService);
        say("getGroups: anonymous -> empty list, no org member or group lookup");
    }

    private static OrgMember orgAdmin(String userId) {
        return new OrgMember(ORG_ID, userId, MemberRole.ADMIN, ORG_MEMBER_STATE, 0L);
    }

    /**
     * Catches a wrong listing for an org admin or super admin: every group of the org, system groups first
     * (sorted), visitor role of the org membership, SUPER_ADMIN group members excluded from the counts, the admin count
     * of an ordinary group being the org admins inside it, and the all-users group counting all org admins instead.
     */
    @ParameterizedTest
    @EnumSource(value = MemberRole.class, names = {"ADMIN", "SUPER_ADMIN"})
    void getGroups_orgAdmin_seesAllGroupsWithCounts(MemberRole visitorRole) {
        when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(false));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(visitorRole)));
        Group all = group("g-all", ORG_ID, SystemGroups.ALL_USER, null);
        Group ordinary = group("g-ordinary", ORG_ID, null, null);
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.just(ordinary, all));
        when(orgMemberService.getAllOrgAdmins(ORG_ID))
                .thenReturn(Mono.just(List.of(orgAdmin("admin-in-group"), orgAdmin("admin-elsewhere"))));
        when(groupMemberService.getGroupMembers("g-ordinary")).thenReturn(Mono.just(List.of(
                new GroupMember("g-ordinary", "admin-in-group", MemberRole.MEMBER, ORG_ID, 1L),
                new GroupMember("g-ordinary", "plain", MemberRole.MEMBER, ORG_ID, 2L),
                new GroupMember("g-ordinary", "super", MemberRole.SUPER_ADMIN, ORG_ID, 3L))));
        when(groupMemberService.getGroupMembers("g-all")).thenReturn(Mono.just(List.of(
                new GroupMember("g-all", "admin-in-group", MemberRole.MEMBER, ORG_ID, 1L),
                new GroupMember("g-all", "plain", MemberRole.MEMBER, ORG_ID, 2L),
                new GroupMember("g-all", "super", MemberRole.SUPER_ADMIN, ORG_ID, 3L))));

        StepVerifier.create(service.getGroups())
                .assertNext(views -> {
                    assertThat(views).extracting(GroupView::getGroupId).containsExactly("g-all", "g-ordinary");
                    assertThat(views).extracting(GroupView::getVisitorRole)
                            .containsOnly(visitorRole.getValue());
                    GroupView allView = views.get(0);
                    assertThat(allView.isAllUsersGroup()).isTrue();
                    assertThat(allView.getStats()).containsEntry(STATS_ADMIN_COUNT, 2).containsEntry(STATS_USER_COUNT, 2)
                            .containsEntry(STATS_USERS, List.of("admin-in-group", "plain"));
                    GroupView ordinaryView = views.get(1);
                    assertThat(ordinaryView.isAllUsersGroup()).isFalse();
                    assertThat(ordinaryView.getStats()).containsEntry(STATS_ADMIN_COUNT, 1)
                            .containsEntry(STATS_USER_COUNT, 2)
                            .containsEntry(STATS_USERS, List.of("admin-in-group", "plain"));
                })
                .verifyComplete();
        say("getGroups as org %s: all-users group admin count 2 (all org admins), ordinary group 1, both user count 2",
                visitorRole);
    }

    /**
     * Catches a plain member seeing groups they do not belong to: only the groups of their own memberships are loaded
     * (never the whole org), each carries the visitor's role in that group, and the all-users group counts all org
     * admins while an ordinary group counts the org admins among the listed members.
     */
    @Test
    void getGroups_plainMember_seesOnlyOwnGroupsWithOwnRole() {
        when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(false));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(orgMemberService.getAllOrgAdmins(ORG_ID))
                .thenReturn(Mono.just(List.of(orgAdmin("admin-1"), orgAdmin("admin-2"))));
        when(groupMemberService.getUserGroupMembersInOrg(ORG_ID, VISITOR_ID)).thenReturn(Mono.just(List.of(
                new GroupMember("g-ordinary", VISITOR_ID, MemberRole.ADMIN, ORG_ID, 1L),
                new GroupMember("g-all", VISITOR_ID, MemberRole.MEMBER, ORG_ID, 2L))));
        ArgumentCaptor<Collection<String>> requestedGroups = ArgumentCaptor.forClass(Collection.class);
        when(groupService.getByIds(requestedGroups.capture())).thenReturn(Flux.just(
                group("g-ordinary", ORG_ID, null, null), group("g-all", ORG_ID, SystemGroups.ALL_USER, null)));

        StepVerifier.create(service.getGroups())
                .assertNext(views -> {
                    assertThat(views).extracting(GroupView::getGroupId).containsExactly("g-all", "g-ordinary");
                    assertThat(views).extracting(GroupView::getVisitorRole).containsExactly(ROLE_MEMBER, ROLE_ADMIN);
                    assertThat(views.get(0).getStats()).containsEntry(STATS_ADMIN_COUNT, 2);
                    assertThat(views.get(1).getStats()).containsEntry(STATS_ADMIN_COUNT, 0);
                })
                .verifyComplete();
        assertThat(requestedGroups.getValue()).containsExactlyInAnyOrder("g-ordinary", "g-all");
        verify(groupService, never()).getByOrgId(any());
        say("getGroups as plain member: groups loaded by id %s only, roles member/admin", requestedGroups.getValue());
    }

    /**
     * Catches a super admin membership of the visitor leaking into the member listing of a plain org member: the
     * group is listed with the visitor's role, but the visitor's SUPER_ADMIN row is not among the listed users.
     */
    @Test
    void getGroups_plainMemberWhoIsSuperAdminOfAGroup_isNotListedAmongItsUsers() {
        when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(false));
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(List.of()));
        when(groupMemberService.getUserGroupMembersInOrg(ORG_ID, VISITOR_ID)).thenReturn(Mono.just(List.of(
                new GroupMember("g-ordinary", VISITOR_ID, MemberRole.SUPER_ADMIN, ORG_ID, 1L))));
        when(groupService.getByIds(anyCollection())).thenReturn(Flux.just(group("g-ordinary", ORG_ID, null, null)));

        StepVerifier.create(service.getGroups())
                .assertNext(views -> {
                    assertThat(views).extracting(GroupView::getVisitorRole).containsExactly(ROLE_SUPER_ADMIN);
                    assertThat(views.get(0).getStats()).containsEntry(STATS_USERS, List.of());
                })
                .verifyComplete();
        say("getGroups as plain member with a SUPER_ADMIN group role: role listed, user list excludes the super admin row");
    }

    /**
     * Pins the plan section 9 defect row "GroupApiServiceImpl.getGroups for a plain member counts and lists only the
     * visitor's own membership rows": for the same group of three members an org admin gets userCount 3 and all three
     * users, while a plain member gets userCount 1 and users = [visitor] (the member path filters the visitor's own
     * rows from {@code getUserGroupMembersInOrg}, which returns only that user's rows). A fix changes this test on
     * purpose.
     */
    @Test
    void getGroups_plainMemberSeesOnlyOwnRowsWhereAdminSeesAllMembers_pinsSection9Defect() {
        when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(false));
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(List.of()));
        Group ordinary = group("g-ordinary", ORG_ID, null, null);
        GroupMember visitorRow = new GroupMember("g-ordinary", VISITOR_ID, MemberRole.MEMBER, ORG_ID, 1L);
        when(groupMemberService.getGroupMembers("g-ordinary")).thenReturn(Mono.just(List.of(visitorRow,
                new GroupMember("g-ordinary", "other-1", MemberRole.MEMBER, ORG_ID, 2L),
                new GroupMember("g-ordinary", "other-2", MemberRole.MEMBER, ORG_ID, 3L))));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.just(ordinary));
        when(groupMemberService.getUserGroupMembersInOrg(ORG_ID, VISITOR_ID)).thenReturn(Mono.just(List.of(visitorRow)));
        when(groupService.getByIds(anyCollection())).thenReturn(Flux.just(ordinary));

        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(MemberRole.ADMIN)));
        StepVerifier.create(service.getGroups())
                .assertNext(views -> assertThat(views.get(0).getStats())
                        .containsEntry(STATS_USER_COUNT, 3)
                        .containsEntry(STATS_USERS, List.of(VISITOR_ID, "other-1", "other-2")))
                .verifyComplete();

        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(MemberRole.MEMBER)));
        StepVerifier.create(service.getGroups())
                .assertNext(views -> assertThat(views.get(0).getStats())
                        .containsEntry(STATS_USER_COUNT, 1)
                        .containsEntry(STATS_USERS, List.of(VISITOR_ID)))
                .verifyComplete();
        say("getGroups: same 3-member group, org admin sees 3 users, plain member sees only itself (section 9 defect pinned)");
    }

    // ------------------------------------------------------------------ getPotentialGroupMembers

    private void stubPotentialMembers(String orgId, List<String> orgUserIds, List<String> groupUserIds) {
        when(groupService.getById(GROUP_ID)).thenReturn(Mono.just(group(GROUP_ID, orgId, null, null)));
        when(orgMemberService.getOrganizationMembers(orgId)).thenReturn(Flux.fromIterable(orgUserIds.stream()
                .map(id -> new OrgMember(orgId, id, MemberRole.MEMBER, ORG_MEMBER_STATE, 0L)).toList()));
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(
                groupUserIds.stream().map(id -> groupMember(id, MemberRole.MEMBER, 1L)).toList()));
    }

    static Stream<Arguments> potentialSearchTerms() {
        return Stream.of(
                Arguments.of("al.ex", ".*\\Qal.ex\\E.*"),
                Arguments.of(null, ALL_USERS_SEARCH_REGEX),
                Arguments.of("", ALL_USERS_SEARCH_REGEX),
                Arguments.of("  ", ALL_USERS_SEARCH_REGEX));
    }

    /**
     * Catches existing group members offered as candidates, an unquoted search term (regex injection: the dot of
     * "al.ex" must not be a wildcard), a wrong state or enabled flag, a wrong page offset, and a total that is the
     * page size instead of the count query.
     */
    @ParameterizedTest(name = "search [{0}] -> regex {1}")
    @MethodSource("potentialSearchTerms")
    void getPotentialGroupMembers_excludesGroupMembersAndQuotesTheSearchTerm(String searchName, String expectedRegex) {
        stubPotentialMembers(ORG_ID, List.of("m1", "m2", "m3"), List.of("m2"));
        ArgumentCaptor<Collection<String>> candidateIds = ArgumentCaptor.forClass(Collection.class);
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        ArgumentCaptor<String> regex = ArgumentCaptor.forClass(String.class);
        String activated = String.valueOf(UserState.ACTIVATED);
        when(userService.findUsersByIdsAndSearchNameForPagination(candidateIds.capture(), eq(activated), eq(true),
                regex.capture(), pageable.capture())).thenReturn(Flux.just(user("m1", "Alex"), user("m3", "Alexa")));
        when(userService.countUsersByIdsAndSearchName(anyCollection(), eq(activated), eq(true), any()))
                .thenReturn(Mono.just(7L));

        StepVerifier.create(service.getPotentialGroupMembers(GROUP_ID, searchName, 3, 2))
                .assertNext(view -> {
                    assertThat(view.getMembers()).extracting(OrgMemberListView.OrgMemberView::getUserId)
                            .containsExactly("m1", "m3");
                    assertThat(view.getMembers()).extracting(OrgMemberListView.OrgMemberView::getName)
                            .containsExactly("Alex", "Alexa");
                    assertThat(view.getTotal()).isEqualTo(7);
                    assertThat(view.getPageNum()).isEqualTo(3);
                    assertThat(view.getPageSize()).isEqualTo(2);
                })
                .verifyComplete();
        assertThat(candidateIds.getValue()).containsExactlyInAnyOrder("m1", "m3");
        assertThat(regex.getValue()).isEqualTo(expectedRegex);
        assertThat(pageable.getValue()).isEqualTo(PageRequest.of(2, 2));
        say("getPotentialGroupMembers: candidates %s, regex %s, page %s, total 7", candidateIds.getValue(), regex.getValue(),
                pageable.getValue());
    }

    /**
     * Catches a user query for an org whose members are all in the group already: total 0, no members, and the user
     * service is not consulted.
     */
    @Test
    void getPotentialGroupMembers_everyOrgMemberAlreadyInGroup_returnsEmptyWithoutUserQuery() {
        stubPotentialMembers(ORG_ID, List.of("m1", "m2"), List.of("m1", "m2", "outsider"));

        StepVerifier.create(service.getPotentialGroupMembers(GROUP_ID, "x", 1, 10))
                .assertNext(view -> {
                    assertThat(view.getMembers()).isEmpty();
                    assertThat(view.getTotal()).isZero();
                    assertThat(view.getPageNum()).isEqualTo(1);
                    assertThat(view.getPageSize()).isEqualTo(10);
                })
                .verifyComplete();
        verifyNoInteractions(userService);
        say("getPotentialGroupMembers: no candidates -> total 0, user service untouched");
    }

    /**
     * Pins today's behaviour for an unknown group: an empty Mono (no item, no error), not INVALID_GROUP_ID as the
     * roster readers answer.
     */
    @Test
    void getPotentialGroupMembers_unknownGroup_completesEmpty() {
        when(groupService.getById(GROUP_ID)).thenReturn(Mono.empty());

        StepVerifier.create(service.getPotentialGroupMembers(GROUP_ID, null, 1, 10)).verifyComplete();
        verifyNoInteractions(orgMemberService, userService);
        say("getPotentialGroupMembers: unknown group -> empty Mono, no error");
    }

    /**
     * Pins defect A1 (plan section 9): {@code getPotentialGroupMembers} has no permission and no same-org check. The
     * group belongs to another organization, no visitor is resolved at all (the session service is never touched),
     * and the org's users are listed anyway. A fix (authorisation, INVALID_GROUP_ID for a foreign group) changes this
     * test on purpose.
     */
    @Test
    void getPotentialGroupMembers_hasNoPermissionOrSameOrgCheck_pinsDefect() {
        stubPotentialMembers(OTHER_ORG_ID, List.of("foreign-1"), List.of());
        String activated = String.valueOf(UserState.ACTIVATED);
        when(userService.findUsersByIdsAndSearchNameForPagination(anyCollection(), eq(activated), eq(true),
                eq(ALL_USERS_SEARCH_REGEX), any(Pageable.class))).thenReturn(Flux.just(user("foreign-1", "Foreign")));
        when(userService.countUsersByIdsAndSearchName(anyCollection(), eq(activated), eq(true), any()))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(service.getPotentialGroupMembers(GROUP_ID, null, 1, 10))
                .assertNext(view -> assertThat(view.getMembers())
                        .extracting(OrgMemberListView.OrgMemberView::getUserId).containsExactly("foreign-1"))
                .verifyComplete();
        verifyNoInteractions(sessionUserService);
        say("getPotentialGroupMembers: group of org %s listed with no visitor or org check (defect A1 pinned)",
                OTHER_ORG_ID);
    }
}

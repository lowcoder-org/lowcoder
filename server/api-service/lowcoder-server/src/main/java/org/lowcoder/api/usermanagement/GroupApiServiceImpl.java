package org.lowcoder.api.usermanagement;

import static java.util.Collections.emptyList;
import static org.lowcoder.sdk.exception.BizError.CANNOT_LEAVE_GROUP;
import static org.lowcoder.sdk.exception.BizError.CANNOT_REMOVE_MYSELF;
import static org.lowcoder.sdk.exception.BizError.INVALID_GROUP_ID;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.StreamUtils.collectList;
import static org.lowcoder.sdk.util.StreamUtils.collectMap;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.github.f4b6a3.uuid.UuidCreator;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.*;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.util.Pagination;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.util.TupleUtils;
import org.lowcoder.sdk.exception.BizError;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

@Service
@RequiredArgsConstructor
public class GroupApiServiceImpl implements GroupApiService {

    private static final String NOT_AUTHORIZED = "NOT_AUTHORIZED";
    private final SessionUserService sessionUserService;
    private final GroupMemberService groupMemberService;
    private final UserService userService;
    private final GroupService groupService;
    private final AbstractBizThresholdChecker bizThresholdChecker;
    private final OrgMemberService orgMemberService;

    @Override
    public Mono<GroupMemberAggregateView> getGroupMembers(String groupId, int page, int count) {
        Mono<Tuple2<GroupMember, OrgMember>> groupAndOrgMemberInfo = getGroupAndOrgMemberInfo(groupId).cache();

        Mono<MemberRole> visitorRoleMono = groupAndOrgMemberInfo.flatMap(tuple -> {
            GroupMember groupMember = tuple.getT1();
            OrgMember orgMember = tuple.getT2();
            if (groupMember.isSuperAdmin() || orgMember.isSuperAdmin()) {
                return Mono.just(MemberRole.SUPER_ADMIN);
            }
            if (groupMember.isAdmin() || orgMember.isAdmin()) {
                return Mono.just(MemberRole.ADMIN);
            }
            if (groupMember.isValid()) {
                return Mono.just(MemberRole.MEMBER);
            }
            return ofError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED);
        });

        return groupAndOrgMemberInfo
                .filter(this::hasReadPermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .flatMap(groupMember -> groupMemberService.getGroupMembers(groupId))
                .<Pair<List<GroupMemberView>, Integer>> flatMap(members -> {
                    if (members.isEmpty()) {
                        return Mono.just(Pair.of(emptyList(), 0));
                    }

                    List<String> userIds = collectList(members, GroupMember::getUserId);
                    Mono<Map<String, User>> userMapMono = userService.getByIds(userIds);
                    return userMapMono.map(map -> {
                            var list = members.stream()
                                    .map(orgMember -> {
                                        User user = map.get(orgMember.getUserId());
                                        if (user == null) {
                                            return null;
                                        }
                                        return new GroupMemberView(orgMember, user);
                                    })
                                    .filter(Objects::nonNull)
                                    .toList();
                            var pageTotal = list.size();
                            list = Pagination.pageOf(list, page, count);
                            return Pair.of(list, pageTotal);
                    });
                })
                .zipWith(visitorRoleMono)
                .map(tuple -> {
                    Pair<List<GroupMemberView>, Integer> t1 = tuple.getT1();
                    return GroupMemberAggregateView.builder()
                            .members(t1.getLeft())
                            .total(t1.getRight())
                            .pageNum(page)
                            .pageSize(count)
                            .visitorRole(tuple.getT2().getValue())
                            .build();
                });
    }

    @Override
    public Mono<GroupMemberAggregateView> getGroupMembersForSearch(String groupId, String search, String role, String sort, String order, Integer pageNum, Integer pageSize) {
        Mono<Tuple2<GroupMember, OrgMember>> groupAndOrgMemberInfo = getGroupAndOrgMemberInfo(groupId).cache();

        Mono<MemberRole> visitorRoleMono = groupAndOrgMemberInfo.flatMap(tuple -> {
            GroupMember groupMember = tuple.getT1();
            OrgMember orgMember = tuple.getT2();
            if (groupMember.isSuperAdmin() || orgMember.isSuperAdmin()) {
                return Mono.just(MemberRole.SUPER_ADMIN);
            }
            if (groupMember.isAdmin() || orgMember.isAdmin()) {
                return Mono.just(MemberRole.ADMIN);
            }
            if (groupMember.isValid()) {
                return Mono.just(MemberRole.MEMBER);
            }
            return ofError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED);
        });

        return groupAndOrgMemberInfo
                .filter(this::hasReadPermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .flatMap(groupMember -> groupMemberService.getGroupMembersByIdAndRole(groupId, role))
                .<Pair<List<GroupMemberView>, Integer>> flatMap(members -> {
                    if (members.isEmpty()) {
                        return Mono.just(Pair.of(emptyList(), 0));
                    }

                    List<String> userIds = collectList(members, GroupMember::getUserId);
                    Mono<Map<String, User>> userMapMono = userService.getByIds(userIds);
                    return userMapMono.map(map -> {
                        var list = members.stream()
                                .map(orgMember -> {
                                    User user = map.get(orgMember.getUserId());
                                    if (user == null) {
                                        return null;
                                    }
                                    return new GroupMemberView(orgMember, user);
                                })
                                .filter(Objects::nonNull)
                                .filter(view -> {
                                    if (search == null || search.isBlank()) return true;
                                    return view.getUserName() != null &&
                                            view.getUserName().toLowerCase().contains(search.toLowerCase());
                                })
                                .toList();
                        List<GroupMemberView> mutableList = new ArrayList<>(list);
                        if (sort != null && !sort.isBlank()) {
                            Comparator<GroupMemberView> comparator = null;
                            if ("userName".equalsIgnoreCase(sort)) {
                                comparator = Comparator.comparing(GroupMemberView::getUserName, Comparator.nullsLast(String::compareToIgnoreCase));
                            } else if ("role".equalsIgnoreCase(sort)) {
                                comparator = Comparator.comparing(GroupMemberView::getRole, Comparator.nullsLast(String::compareToIgnoreCase));
                            } else if ("joinTime".equalsIgnoreCase(sort)) {
                                comparator = Comparator.comparing(GroupMemberView::getJoinTime, Comparator.nullsLast(Long::compareTo));
                            }
                            if (comparator != null && "desc".equalsIgnoreCase(order)) {
                                comparator = comparator.reversed();
                            }
                            if (comparator != null) {
                                mutableList.sort(comparator);
                            }
                        }

                        int pageTotal = mutableList.size();
                        List<GroupMemberView> pagedList = Pagination.pageOf(mutableList, pageNum, pageSize);

                        return Pair.of(pagedList, pageTotal);
                    });
                })
                .zipWith(visitorRoleMono)
                .map(tuple -> {
                    Pair<List<GroupMemberView>, Integer> t1 = tuple.getT1();
                    return GroupMemberAggregateView.builder()
                            .members(t1.getLeft())
                            .total(t1.getRight())
                            .pageNum(pageNum)
                            .pageSize(pageSize)
                            .visitorRole(tuple.getT2().getValue())
                            .build();
                });
    }

    private boolean hasReadPermission(Tuple2<GroupMember, OrgMember> tuple) {
        GroupMember groupMember = tuple.getT1();
        OrgMember orgMember = tuple.getT2();
        return orgMember.isSuperAdmin() || groupMember.isValid() || orgMember.isAdmin();
    }

    private boolean hasManagePermission(Tuple2<GroupMember, OrgMember> tuple) {
        GroupMember groupMember = tuple.getT1();
        OrgMember orgMember = tuple.getT2();
        return groupMember.isAdmin() || orgMember.isAdmin() || groupMember.isSuperAdmin() || orgMember.isSuperAdmin();
    }

    private Mono<Tuple2<GroupMember, OrgMember>> getGroupAndOrgMemberInfo(String groupId) {
        Mono<GroupMember> groupMemberMono = sessionUserService.getVisitorId()
                .flatMap(visitorId -> groupMemberService.getGroupMember(groupId, visitorId))
                .defaultIfEmpty(GroupMember.NOT_EXIST);

        Mono<OrgMember> orgMemberMono = sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> groupService.getById(groupId)
                        .filter(group -> group.getOrganizationId().equals(orgMember.getOrgId()))
                        .switchIfEmpty(deferredError(INVALID_GROUP_ID, "INVALID_GROUP_ID"))
                        .thenReturn(orgMember)
                )
                .switchIfEmpty(deferredError(INVALID_GROUP_ID, "INVALID_GROUP_ID"));

        return Mono.zip(groupMemberMono, orgMemberMono);
    }

    @Override
    public Mono<Boolean> addGroupMember(String groupId, String newUserId, String roleName) {
        return getGroupAndOrgMemberInfo(groupId)
                .filter(this::hasManagePermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .zipWith(groupService.getById(groupId), TupleUtils::merge)
                .flatMap(tuple -> {
                    String orgId = tuple.getT2().getOrgId();
                    if (tuple.getT3().isDevGroup()) {
                        return bizThresholdChecker.checkMaxDeveloperCount(orgId, groupId, newUserId)
                                .then(groupMemberService.addMember(orgId, groupId, newUserId, MemberRole.fromValue(roleName)));
                    }
                    return groupMemberService.addMember(orgId, groupId, newUserId, MemberRole.fromValue(roleName));
                });
    }

    @Override
    public Mono<Boolean> updateRoleForMember(String groupId, UpdateRoleRequest updateRoleRequest) {
        return getGroupAndOrgMemberInfo(groupId)
                .filter(this::hasManagePermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .then(groupMemberService.updateMemberRole(groupId,
                        updateRoleRequest.getUserId(),
                        MemberRole.fromValue(updateRoleRequest.getRole())));
    }

    @Override
    public Mono<Boolean> leaveGroup(String groupId) {
        return Mono.zip(sessionUserService.getVisitorId(), groupMemberService.getAllGroupAdmin(groupId))
                .flatMap(tuple -> {
                    String visitorId = tuple.getT1();
                    List<GroupMember> groupAdmins = tuple.getT2();
                    if (groupAdmins.size() == 1 && groupAdmins.get(0).getUserId().equals(visitorId)) {
                        return ofError(CANNOT_LEAVE_GROUP, "CANNOT_LEAVE_GROUP");
                    }
                    return groupMemberService.removeMember(groupId, visitorId);
                });
    }

    @Override
    public Mono<List<GroupView>> getGroups() {

        return sessionUserService.isAnonymousUser()
                .flatMap(isAnonymousUser -> {
                    if (isAnonymousUser) {
                        return Mono.just(emptyList());
                    }

                    return sessionUserService.getVisitorOrgMemberCache()
                            .flatMap(orgMember -> {
                                String orgId = orgMember.getOrgId();
                                Mono<List<OrgMember>> orgAdminsMono = orgMemberService.getAllOrgAdmins(orgId);
                                if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                                    MemberRole memberRole;
                                    if(orgMember.isAdmin()) {
                                        memberRole = MemberRole.ADMIN;
                                    } else {
                                        memberRole = MemberRole.SUPER_ADMIN;
                                    }
                                    return orgAdminsMono.flatMap(orgAdmins -> groupService.getByOrgId(orgId)
                                            .sort()
                                            .flatMapSequential(group -> groupView(group, memberRole.getValue(), orgAdmins))
                                            .collectList());
                                }
                                return groupMemberService.getUserGroupMembersInOrg(orgId, orgMember.getUserId())
                                        .zipWith(orgAdminsMono)
                                        .flatMap(tuple -> {
                                            List<GroupMember> groupMembers = tuple.getT1();
                                            List<OrgMember> orgAdmins = tuple.getT2();
                                            List<String> groupIds = collectList(groupMembers, GroupMember::getGroupId);
                                            Map<String, GroupMember> groupMemberMap = collectMap(groupMembers, GroupMember::getGroupId, it -> it);
                                            return groupService.getByIds(groupIds)
                                                    .sort()
                                                    .flatMapSequential(group -> groupView(group,
                                                            groupMemberMap.get(group.getId()).getRole().getValue(), orgAdmins))
                                                    .collectList();
                                        });
                            });

                });
    }

    /**
     * The listing view of one group with the visitor's role in it: the users are all members of the group except
     * SUPER_ADMIN rows; the admin count is every org admin for the all-users group, otherwise the org admins among the
     * users. Plain members and org admins get the same counts (BF-042: a plain member's view was built from the visitor's
     * own membership rows only, so every group showed one user, the visitor). A plain member is shown only the groups they
     * belong to, whose members they can already list ({@link #getGroupMembers}).
     */
    private Mono<GroupView> groupView(Group group, String visitorRole, List<OrgMember> orgAdmins) {
        return groupMemberService.getGroupMembers(group.getId())
                .flatMap(members -> {
                    List<GroupMember> users = members.stream().filter(member -> member.getRole() != MemberRole.SUPER_ADMIN).toList();
                    int adminCount = group.isAllUsersGroup()
                            ? orgAdmins.size()
                            : (int) orgAdmins.stream().filter(orgAdmin -> users.stream().anyMatch(member -> member.getUserId().equals(orgAdmin.getUserId()))).count();
                    return GroupView.from(group, visitorRole, adminCount, users.size(), collectList(users, GroupMember::getUserId));
                });
    }

    @Override
    public Mono<Boolean> deleteGroup(String groupId) {
        return getGroupAndOrgMemberInfo(groupId)
                .filter(this::hasManagePermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .filterWhen(ignored -> groupService.getById(groupId)
                        .map(Group::isNotSystemGroup))
                .switchIfEmpty(deferredError(BizError.CANNOT_DELETE_SYSTEM_GROUP, "CANNOT_DELETE_SYSTEM_GROUP"))
                .then(groupService.delete(groupId)
                        .thenReturn(true)
                );

    }

    @Override
    public Mono<Group> create(CreateGroupRequest createGroupRequest) {
        return sessionUserService.getVisitorOrgMemberCache()
                .filter(orgMember -> orgMember.isAdmin() || orgMember.isSuperAdmin())
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .delayUntil(orgMember -> bizThresholdChecker.checkMaxGroupCount(orgMember))
                .flatMap(orgMember -> {
                    String orgId = orgMember.getOrgId();
                    Group group = new Group();
                    group.setGid(UuidCreator.getTimeOrderedEpoch().toString());
                    group.setOrganizationId(orgId);
                    group.setName(createGroupRequest.getName());
                    group.setDynamicRule(createGroupRequest.getDynamicRule());
                    return groupService.create(group, orgMember.getUserId(), orgMember.getOrgId());
                });
    }


    @Override
    public Mono<Boolean> update(String groupId, UpdateGroupRequest updateGroupRequest) {
        return getGroupAndOrgMemberInfo(groupId)
                .filter(this::hasManagePermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .flatMap(it -> {
                    Group updateGroup = new Group();
                    updateGroup.setId(groupId);
                    updateGroup.setName(updateGroupRequest.getGroupName());
                    updateGroup.setDynamicRule(updateGroupRequest.getDynamicRule());
                    return groupService.updateGroup(updateGroup);
                });
    }

    @Override
    public Mono<Boolean> removeUser(String groupId, String userId) {
        return getGroupAndOrgMemberInfo(groupId)
                .filter(this::hasManagePermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .flatMap(tuple -> {
                    String currentUserId = tuple.getT2().getUserId();
                    if (currentUserId.equals(userId)) {
                        return ofError(CANNOT_REMOVE_MYSELF, "CANNOT_REMOVE_MYSELF");
                    }
                    return groupMemberService.removeMember(groupId, userId);
                });
    }

    /**
     * The users of the group's organization who are not in the group yet, for a visitor who may add members: the gate of
     * {@link #addGroupMember} (BF-021). A group of another organization, or one that does not exist, is INVALID_GROUP_ID; a
     * visitor who is neither a group admin nor an org admin is NOT_AUTHORIZED.
     */
    @Override
    public Mono<OrgMemberListView> getPotentialGroupMembers(String groupId, String searchName, Integer pageNum, Integer pageSize) {
        return getGroupAndOrgMemberInfo(groupId)
                .filter(this::hasManagePermission)
                .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED))
                .then(groupService.getById(groupId))
                .flatMap(group -> {
                    String orgId = group.getOrganizationId();
                    Mono<List<OrgMember>> orgMemberUserIdsMono = orgMemberService.getOrganizationMembers(orgId).collectList();
                    Mono<List<GroupMember>> groupMemberUserIdsMono = groupMemberService.getGroupMembers(groupId);

                    return Mono.zip(orgMemberUserIdsMono, groupMemberUserIdsMono)
                            .flatMap(tuple -> {
                                List<OrgMember> orgMembers = tuple.getT1();
                                List<GroupMember> groupMembers = tuple.getT2();

                                Set<String> groupMemberUserIds = groupMembers.stream()
                                        .map(GroupMember::getUserId)
                                        .collect(Collectors.toSet());

                                Collection<String> potentialUserIds = orgMembers.stream()
                                        .map(OrgMember::getUserId)
                                        .filter(uid -> !groupMemberUserIds.contains(uid))
                                        .collect(Collectors.toList());

                                if (potentialUserIds.isEmpty()) {
                                    return Mono.just(OrgMemberListView.builder()
                                            .members(List.of())
                                            .total(0)
                                            .pageNum(pageNum)
                                            .pageSize(pageSize)
                                            .build());
                                }

                                Pageable pageable = PageRequest.of(pageNum - 1, pageSize);
                                String searchRegex = searchName != null && !searchName.isBlank() ? ".*" + Pattern.quote(searchName) + ".*" : ".*";

                                return userService.findUsersByIdsAndSearchNameForPagination(
                                                potentialUserIds, String.valueOf(UserState.ACTIVATED), true, searchRegex, pageable)
                                        .collectList()
                                        .zipWith(userService.countUsersByIdsAndSearchName(
                                                potentialUserIds, String.valueOf(UserState.ACTIVATED), true, searchRegex))
                                        .map(tupleUser -> {
                                            List<User> users = tupleUser.getT1();
                                            long total = tupleUser.getT2();
                                            List<OrgMemberListView.OrgMemberView> memberViews = users.stream()
                                                    .map(u -> OrgMemberListView.OrgMemberView.builder()
                                                            .userId(u.getId())
                                                            .name(u.getName())
                                                            .build())
                                                    .collect(Collectors.toList());
                                            return OrgMemberListView.builder()
                                                    .members(memberViews)
                                                    .total((int) total)
                                                    .pageNum(pageNum)
                                                    .pageSize(pageSize)
                                                    .build();
                                        });
                            });
                });
    }

}

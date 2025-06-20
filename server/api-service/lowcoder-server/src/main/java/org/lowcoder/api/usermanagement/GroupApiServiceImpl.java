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
                            list = list.subList((page - 1) * count, count == 0 ? pageTotal : Math.min(page * count, pageTotal));
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
                                    return groupService.getByOrgId(orgId)
                                            .sort()
                                            .flatMapSequential(group -> groupMemberService.getGroupMembers(group.getId())
                                                .zipWith(orgAdminsMono)
                                                .flatMap(tuple -> {
                                                    var users = tuple.getT1().stream().filter(user ->  user.getRole() != MemberRole.SUPER_ADMIN).toList();
                                                    var orgAdmins = tuple.getT2();
                                                    var adminMembers = orgAdmins.stream().filter(orgAdmin -> users.stream().anyMatch(member -> member.getUserId().equals(orgAdmin.getUserId()))).toList();
                                                    if(group.isAllUsersGroup()) {
                                                        return GroupView.from(group, memberRole.getValue(), orgAdmins.size(), users.size(), users.stream().map(GroupMember::getUserId).toList());
                                                    } else {
                                                        return GroupView.from(group, memberRole.getValue(), adminMembers.size(), users.size(), users.stream().map(GroupMember::getUserId).toList());
                                                    }
                                                })
                                            )
                                            .collectList();
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
                                                    .flatMapSequential(group -> {
                                                        var allMembers = groupMembers.stream().filter(groupMember -> groupMember.getGroupId().equals(group.getId()) && groupMember.getRole() != MemberRole.SUPER_ADMIN).toList();
                                                        var adminMembers = orgAdmins.stream().filter(orgAdmin -> allMembers.stream().anyMatch(member -> member.getUserId().equals(orgAdmin.getUserId()))).toList();
                                                        if(group.isAllUsersGroup()) {
                                                            return GroupView.from(group,
                                                                    groupMemberMap.get(group.getId()).getRole().getValue(),
                                                                    orgAdmins.size(),
                                                                    allMembers.size(),
                                                                    allMembers.stream().map(GroupMember::getUserId).toList());
                                                        } else {
                                                            return GroupView.from(group,
                                                                    groupMemberMap.get(group.getId()).getRole().getValue(),
                                                                    adminMembers.size(),
                                                                    allMembers.size(),
                                                                    allMembers.stream().map(GroupMember::getUserId).toList());
                                                        }
                                                    })
                                                    .collectList();
                                        });
                            });

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

    @Override
    public Mono<OrgMemberListView> getPotentialGroupMembers(String groupId, String searchName, Integer pageNum, Integer pageSize) {
        return groupService.getById(groupId)
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

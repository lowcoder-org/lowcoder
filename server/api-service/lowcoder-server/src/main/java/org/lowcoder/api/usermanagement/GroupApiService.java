package org.lowcoder.api.usermanagement;

import org.lowcoder.api.usermanagement.view.*;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.domain.group.model.Group;
import reactor.core.publisher.Mono;

import java.util.List;

public interface GroupApiService {
    Mono<GroupMemberAggregateView> getGroupMembers(String groupId, int page, int count);

    Mono<GroupMemberAggregateView> getGroupMembersForSearch(String groupId, String search, String role, String sort, String order, Integer pageNum, Integer pageSize);

    Mono<Boolean> addGroupMember(String groupId, String newUserId, String roleName);

    Mono<Boolean> updateRoleForMember(String groupId, UpdateRoleRequest updateRoleRequest);

    Mono<Boolean> leaveGroup(String groupId);

    Mono<List<GroupView>> getGroups();

    Mono<Boolean> deleteGroup(String groupId);

    Mono<Group> create(CreateGroupRequest createGroupRequest);

    Mono<Boolean> update(String groupId, UpdateGroupRequest updateGroupRequest);

    Mono<Boolean> removeUser(String groupId, String userId);

    Mono<OrgMemberListView> getPotentialGroupMembers(String groupId, String searchName, Integer pageNum, Integer pageSize);
}

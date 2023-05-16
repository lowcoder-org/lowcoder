package org.lowcoder.domain.group.service;

import java.util.Collection;
import java.util.List;

import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.infra.birelation.BiRelation;

import reactor.core.publisher.Mono;

public interface GroupMemberService {

    Mono<List<GroupMember>> getGroupMembers(String groupId, int page, int count);

    Mono<Boolean> addMember(String orgId, String groupId, String userId, MemberRole memberRole);

    Mono<Boolean> updateMemberRole(String groupId, String userId, MemberRole memberRole);

    Mono<Boolean> removeMember(String groupId, String userId);

    /**
     * @return all group ids user belongs to under specific org
     */
    Mono<List<String>> getUserGroupIdsInOrg(String orgId, String userId);

    Mono<List<String>> getNonDynamicUserGroupIdsInOrg(String orgId, String userId);

    Mono<List<GroupMember>> getUserGroupMembersInOrg(String orgId, String userId);

    Mono<GroupMember> getGroupMember(String groupId, String userId);

    Mono<List<GroupMember>> getAllGroupAdmin(String groupId);

    Mono<Boolean> deleteGroupMembers(String groupId);

    Mono<Boolean> isMember(Group group, String userId);

    Mono<List<GroupMember>> bulkAddMember(Collection<GroupMember> groupMembers);

    Mono<Boolean> bulkRemoveMember(String groupId, Collection<String> userIds);

}

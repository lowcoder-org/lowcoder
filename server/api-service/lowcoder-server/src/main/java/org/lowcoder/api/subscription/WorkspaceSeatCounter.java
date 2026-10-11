package org.lowcoder.api.subscription;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceSeatCounter {
    private final OrgMemberService orgMembers;
    private final GroupService groups;
    private final GroupMemberService groupMembers;

    public Mono<Integer> count(String orgId) {
        return orgMembers.getOrganizationMembers(orgId).collectList()
                .zipWith(groups.getDevGroup(orgId)
                        .flatMap(group -> groupMembers.getGroupMembers(group.getId()))
                        .defaultIfEmpty(List.of()))
                .map(tuple -> count(orgId, tuple.getT1(), tuple.getT2()));
    }

    public static int count(String orgId, List<OrgMember> members, List<GroupMember> developers) {
        Set<String> editorIds = developers.stream()
                .filter(member -> orgId.equals(member.getOrgId()))
                .map(GroupMember::getUserId).collect(Collectors.toSet());
        // Intersect with current workspace membership: a stale Developers-group row is not a seat.
        return (int) members.stream().filter(member -> orgId.equals(member.getOrgId()))
                .filter(member -> member.isAdmin() || member.isSuperAdmin() || editorIds.contains(member.getUserId()))
                .map(OrgMember::getUserId).distinct().count();
    }
}

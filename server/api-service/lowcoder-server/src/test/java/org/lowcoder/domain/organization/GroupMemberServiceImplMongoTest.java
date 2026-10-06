package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.infra.birelation.BiRelationBizType.GROUP_MEMBER;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.organization.model.MemberRole;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * GroupMemberServiceImpl against the MongoDB test container (unit U14, task L3-11a), shared {@code test} context, ids
 * generated per test. Not repeated: deleteGroupMembers (the L4-8 section 9 row on BiRelationServiceImpl.removeAllBiRelations)
 * and the bulk methods without a production caller (owner decision).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class GroupMemberServiceImplMongoTest extends OrganizationMongoTestBase {

    private static final String ADMIN = "admin";

    private static Group group(String id) {
        return Group.builder().id(id).build();
    }

    /** Catches: wrong rows from the group queries, a lost org id, an admin list that includes other roles. */
    @Test
    void groupMembersAreReadBackWithTheirRoleAndOrgAndFilteredByRole() {
        String org = newId();
        String groupId = newId();
        String otherGroup = newId();
        String member = newId();
        String admin = newId();
        String stranger = newId();
        assertThat(groupMemberService.addMember(org, groupId, member, MemberRole.MEMBER).block(TIMEOUT)).isTrue();
        groupMemberService.addMember(org, groupId, admin, MemberRole.ADMIN).block(TIMEOUT);
        groupMemberService.addMember(org, otherGroup, stranger, MemberRole.ADMIN).block(TIMEOUT);

        List<GroupMember> members = groupMemberService.getGroupMembers(groupId).block(TIMEOUT);
        System.out.println("[GroupMemberServiceImplMongoTest] members of the group: " + members.stream().map(GroupMember::getUserId).toList());
        assertThat(members).extracting(GroupMember::getUserId).containsExactlyInAnyOrder(member, admin);
        assertThat(members).extracting(GroupMember::getOrgId).containsOnly(org);
        assertThat(groupMemberService.getGroupMember(groupId, admin).block(TIMEOUT).getRole()).isEqualTo(MemberRole.ADMIN);
        assertThat(groupMemberService.getGroupMember(groupId, stranger).blockOptional(TIMEOUT)).isEmpty();

        assertThat(groupMemberService.isMember(group(groupId), member).block(TIMEOUT)).isTrue();
        assertThat(groupMemberService.isMember(group(groupId), stranger).block(TIMEOUT)).isFalse();
        assertThat(groupMemberService.getGroupMembersByIdAndRole(groupId, ADMIN).block(TIMEOUT))
                .extracting(GroupMember::getUserId).containsExactly(admin);
        assertThat(groupMemberService.getAllGroupAdmin(groupId).block(TIMEOUT))
                .extracting(GroupMember::getUserId).containsExactly(admin);
        assertThat(groupMemberService.getGroupMembersByIdAndRole(groupId, MemberRole.SUPER_ADMIN.getValue()).block(TIMEOUT)).isEmpty();
    }

    /**
     * Catches: groups of another organisation leaking into a user's group list (permission checks are built on these
     * ids): the organisation of a membership is stored in extParam1 and is the only thing separating the orgs.
     */
    @Test
    void aUsersGroupsAreScopedToTheAskedOrg() {
        String orgA = newId();
        String orgB = newId();
        String groupA = newId();
        String groupB = newId();
        String user = newId();
        groupMemberService.addMember(orgA, groupA, user, MemberRole.MEMBER).block(TIMEOUT);
        groupMemberService.addMember(orgB, groupB, user, MemberRole.ADMIN).block(TIMEOUT);

        assertThat(groupMemberService.getUserGroupIdsInOrg(orgA, user).block(TIMEOUT)).containsExactly(groupA);
        assertThat(groupMemberService.getNonDynamicUserGroupIdsInOrg(orgB, user).block(TIMEOUT)).containsExactly(groupB);
        List<GroupMember> inA = groupMemberService.getUserGroupMembersInOrg(orgA, user).block(TIMEOUT);
        System.out.println("[GroupMemberServiceImplMongoTest] memberships of the user in org A: " + inA.size());
        assertThat(inA).extracting(GroupMember::getGroupId).containsExactly(groupA);
        assertThat(inA.get(0).getRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(groupMemberService.getUserGroupIdsInOrg(newId(), user).block(TIMEOUT)).isEmpty();
        assertThat(groupMemberService.getUserGroupMembersInOrg(newId(), user).block(TIMEOUT)).isEmpty();
    }

    /** Catches: the role change leaking to the user's other groups or to other members of the same group. */
    @Test
    void updateMemberRoleChangesOnlyThatGroupMembershipOfThatUser() {
        String org = newId();
        String groupA = newId();
        String groupB = newId();
        String user = newId();
        String bystander = newId();
        groupMemberService.addMember(org, groupA, user, MemberRole.MEMBER).block(TIMEOUT);
        groupMemberService.addMember(org, groupB, user, MemberRole.MEMBER).block(TIMEOUT);
        groupMemberService.addMember(org, groupA, bystander, MemberRole.MEMBER).block(TIMEOUT);

        assertThat(groupMemberService.updateMemberRole(groupA, user, MemberRole.ADMIN).block(TIMEOUT)).isTrue();

        assertThat(singleRow(GROUP_MEMBER, groupA, user).getRelation()).isEqualTo(ADMIN);
        assertThat(singleRow(GROUP_MEMBER, groupB, user).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
        assertThat(singleRow(GROUP_MEMBER, groupA, bystander).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
    }

    /**
     * Pins plan section 9 row "updateMemberRole answers true for a member that does not exist (hasElement on the update
     * result; OrgMemberServiceImpl:142-143, GroupMemberServiceImpl:47-48)" (the org line is now OrgMemberServiceImpl:150-151).
     * Caller GroupApiServiceImpl.updateRoleForMember (:243-251) returns that value to the client. A fix (map the update's boolean) changes this test on purpose.
     */
    @Test
    void updateMemberRoleAnswersTrueForAMemberWhoIsNotInTheGroup_pinsTheSection9Row() {
        String groupId = newId();
        String stranger = newId();

        Boolean answer = groupMemberService.updateMemberRole(groupId, stranger, MemberRole.ADMIN).block(TIMEOUT);

        System.out.println("[GroupMemberServiceImplMongoTest] PINNED updateMemberRole of a non-member answers " + answer);
        assertThat(rows(GROUP_MEMBER, groupId, stranger)).isEmpty();
        assertThat(answer).isTrue();
    }

    /** Catches: removing the user from every group (or every user from the group) instead of one membership. */
    @Test
    void removeMemberRemovesOnlyThatMembershipAndAbsentMembersAnswerFalse() {
        String org = newId();
        String groupA = newId();
        String groupB = newId();
        String user = newId();
        String other = newId();
        groupMemberService.addMember(org, groupA, user, MemberRole.MEMBER).block(TIMEOUT);
        groupMemberService.addMember(org, groupB, user, MemberRole.MEMBER).block(TIMEOUT);
        groupMemberService.addMember(org, groupA, other, MemberRole.MEMBER).block(TIMEOUT);

        assertThat(groupMemberService.removeMember(groupA, user).block(TIMEOUT)).isTrue();

        assertThat(rows(GROUP_MEMBER, groupA, user)).isEmpty();
        assertThat(rows(GROUP_MEMBER, groupB, user)).hasSize(1);
        assertThat(rows(GROUP_MEMBER, groupA, other)).hasSize(1);
        assertThat(groupMemberService.removeMember(groupA, user).block(TIMEOUT)).isFalse();
        System.out.println("[GroupMemberServiceImplMongoTest] removeMember kept the other group and the other member");
    }
}

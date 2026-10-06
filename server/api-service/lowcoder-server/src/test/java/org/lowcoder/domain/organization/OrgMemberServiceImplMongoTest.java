package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.infra.birelation.BiRelationBizType.GROUP_MEMBER;
import static org.lowcoder.infra.birelation.BiRelationBizType.ORG_MEMBER;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrgMemberService.UserOrgMemberInfo;
import org.lowcoder.infra.birelation.BiRelation;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * OrgMemberServiceImpl against the MongoDB test container (unit U14, task L3-11a), shared {@code test} context: every
 * test works only under ids it generates. Not repeated here: adding members + getOrganizationMembers (OrgMemberServiceTest; it adds with bulkAddMember on this branch and with addMember on coverage-gate),
 * deleteOrgMembers (the L4-8 section 9 row on BiRelationServiceImpl.removeAllBiRelations), the L1 role rules of
 * OrgApiServiceImpl, and the bulk methods that have no production caller (owner decision).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class OrgMemberServiceImplMongoTest extends OrganizationMongoTestBase {

    private static final String NORMAL = "normal";
    private static final String CURRENT = "current";

    /** Catches: the member row written with a wrong role or state, or the user not joining the org's all-users group. */
    @Test
    void addMemberWritesTheRowAndJoinsTheAllUsersGroupAsMember() {
        String[] org = createActiveOrgWithAllUsersGroup();
        String[] otherOrg = createActiveOrgWithAllUsersGroup();
        String user = newId();

        assertThat(orgMemberService.addMember(org[0], user, MemberRole.ADMIN).block(TIMEOUT)).isTrue();

        BiRelation row = singleRow(ORG_MEMBER, org[0], user);
        System.out.println("[OrgMemberServiceImplMongoTest] member row relation=" + row.getRelation() + " state=" + row.getState());
        assertThat(row.getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
        assertThat(row.getState()).isEqualTo(NORMAL);
        OrgMember member = orgMemberService.getOrgMember(org[0], user).block(TIMEOUT);
        assertThat(member.getRole()).isEqualTo(MemberRole.ADMIN);

        GroupMember groupMember = groupMemberService.getGroupMember(org[1], user).block(TIMEOUT);
        assertThat(groupMember.getRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(groupMember.getOrgId()).isEqualTo(org[0]);
        assertThat(rowsOfSource(GROUP_MEMBER, otherOrg[1])).isEmpty();
        assertThat(rows(ORG_MEMBER, otherOrg[0], user)).isEmpty();
    }

    /** Catches: an org without an all-users group failing the add (the member row must still be written). */
    @Test
    void addMemberToAnOrgWithoutAnAllUsersGroupStillWritesTheMemberRow() {
        String org = createActiveOrg();
        String user = newId();

        assertThat(orgMemberService.addMember(org, user, MemberRole.MEMBER).block(TIMEOUT)).isTrue();
        assertThat(rows(ORG_MEMBER, org, user)).hasSize(1);
        assertThat(rowsOfSource(GROUP_MEMBER, org)).isEmpty();
    }

    /** Catches: tryAddOrgMember overwriting or duplicating an existing membership. */
    @Test
    void tryAddOrgMemberOnlyAddsNewMembersAndNeverChangesAnExistingRole() {
        String org = createActiveOrg();
        String user = newId();

        assertThat(orgMemberService.tryAddOrgMember(org, user, MemberRole.MEMBER).block(TIMEOUT)).isTrue();
        assertThat(orgMemberService.tryAddOrgMember(org, user, MemberRole.ADMIN).block(TIMEOUT)).isFalse();

        List<BiRelation> stored = rows(ORG_MEMBER, org, user);
        System.out.println("[OrgMemberServiceImplMongoTest] after two tryAdd calls: " + stored.size() + " row, role " + stored.get(0).getRelation());
        assertThat(stored).hasSize(1);
        assertThat(stored.get(0).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
    }

    /** Catches: the role change leaking to the user's other organisations or to other users of the same org. */
    @Test
    void updateMemberRoleChangesOnlyThatMembershipOfThatUser() {
        String orgA = createActiveOrg();
        String orgB = createActiveOrg();
        String user = newId();
        String bystander = newId();
        orgMemberService.addMember(orgA, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgB, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgA, bystander, MemberRole.MEMBER).block(TIMEOUT);

        assertThat(orgMemberService.updateMemberRole(orgA, user, MemberRole.ADMIN).block(TIMEOUT)).isTrue();

        assertThat(singleRow(ORG_MEMBER, orgA, user).getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
        assertThat(singleRow(ORG_MEMBER, orgB, user).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
        assertThat(singleRow(ORG_MEMBER, orgA, bystander).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
    }

    /**
     * Pins plan section 9 row "updateMemberRole answers true for a member that does not exist (hasElement on the update
     * result; OrgMemberServiceImpl:142-143, GroupMemberServiceImpl:47-48)" (now OrgMemberServiceImpl:150-151):
     * {@code Mono<Boolean>.hasElement()} is true whenever the update helper emits any value, false included. Caller OrgApiServiceImpl.updateRoleForMember
     * (:159-165) returns that value to the client. A fix (map the update's boolean) changes this test on purpose.
     */
    @Test
    void updateMemberRoleAnswersTrueForAMemberWhoDoesNotExist_pinsTheSection9Row() {
        String org = createActiveOrg();
        String stranger = newId();

        Boolean answer = orgMemberService.updateMemberRole(org, stranger, MemberRole.ADMIN).block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplMongoTest] PINNED updateMemberRole of a non-member answers " + answer);
        assertThat(rows(ORG_MEMBER, org, stranger)).isEmpty();
        assertThat(answer).isTrue();
    }

    /** Catches: removing the user from every organisation instead of one (the analysis' defect). */
    @Test
    void removeMemberRemovesOnlyThatOrgAndAbsentMembersAnswerFalse() {
        String orgA = createActiveOrg();
        String orgB = createActiveOrg();
        String user = newId();
        String other = newId();
        orgMemberService.addMember(orgA, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgB, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgA, other, MemberRole.MEMBER).block(TIMEOUT);

        assertThat(orgMemberService.removeMember(orgA, user).block(TIMEOUT)).isTrue();

        assertThat(rows(ORG_MEMBER, orgA, user)).isEmpty();
        assertThat(rows(ORG_MEMBER, orgB, user)).hasSize(1);
        assertThat(rows(ORG_MEMBER, orgA, other)).hasSize(1);
        assertThat(orgMemberService.removeMember(orgA, user).block(TIMEOUT)).isFalse();
        System.out.println("[OrgMemberServiceImplMongoTest] removeMember kept the other org and the other user");
    }

    /** Catches: an off-by-one in the page number (pages are 1-based), overlapping or short pages. */
    @Test
    void membersArePagedOneBasedWithoutOverlap() {
        String org = createActiveOrg();
        Set<String> users = new HashSet<>();
        for (int i = 0; i < 5; i++) {
            String user = newId();
            users.add(user);
            orgMemberService.addMember(org, user, MemberRole.MEMBER).block(TIMEOUT);
        }

        List<String> page1 = orgMemberService.getOrganizationMembers(org, 1, 2).map(OrgMember::getUserId).collectList().block(TIMEOUT);
        List<String> page2 = orgMemberService.getOrganizationMembers(org, 2, 2).map(OrgMember::getUserId).collectList().block(TIMEOUT);
        List<String> page3 = orgMemberService.getOrganizationMembers(org, 3, 2).map(OrgMember::getUserId).collectList().block(TIMEOUT);
        List<String> page4 = orgMemberService.getOrganizationMembers(org, 4, 2).map(OrgMember::getUserId).collectList().block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplMongoTest] page sizes " + page1.size() + "," + page2.size() + "," + page3.size() + "," + page4.size());
        assertThat(page1).hasSize(2);
        assertThat(page2).hasSize(2);
        assertThat(page3).hasSize(1);
        assertThat(page4).isEmpty();
        Set<String> union = new HashSet<>(page1);
        union.addAll(page2);
        union.addAll(page3);
        assertThat(union).isEqualTo(users);
    }

    /** Behaviour (candidate C6): pages are 1-based, so page 0 throws synchronously from PageRequest.of(-1, n). */
    @Test
    void pageZeroIsRejectedSynchronously() {
        String org = createActiveOrg();
        assertThrows(IllegalArgumentException.class, () -> orgMemberService.getOrganizationMembers(org, 0, 2));
    }

    /** Catches: counting other orgs' rows, or counting super admins and plain members as admins. */
    @Test
    void countAndAdminListAreScopedToTheOrgAndToTheAdminRole() {
        String org = createActiveOrg();
        String otherOrg = createActiveOrg();
        String admin = newId();
        orgMemberService.addMember(org, newId(), MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(org, newId(), MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(org, admin, MemberRole.ADMIN).block(TIMEOUT);
        orgMemberService.addMember(org, newId(), MemberRole.SUPER_ADMIN).block(TIMEOUT);
        orgMemberService.addMember(otherOrg, newId(), MemberRole.ADMIN).block(TIMEOUT);

        assertThat(orgMemberService.getOrgMemberCount(org).block(TIMEOUT)).isEqualTo(4L);
        List<OrgMember> admins = orgMemberService.getAllOrgAdmins(org).block(TIMEOUT);
        System.out.println("[OrgMemberServiceImplMongoTest] admins of the org: " + admins.stream().map(OrgMember::getUserId).toList());
        assertThat(admins).extracting(OrgMember::getUserId).containsExactly(admin);
    }

    /** Catches: roles of other orgs or other users leaking into the role map, or a missing org key. */
    @Test
    void orgMemberRolesAreKeyedByTheAskedOrgsForThatUserOnly() {
        String orgA = createActiveOrg();
        String orgB = createActiveOrg();
        String orgC = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(orgA, user, MemberRole.ADMIN).block(TIMEOUT);
        orgMemberService.addMember(orgB, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgA, newId(), MemberRole.SUPER_ADMIN).block(TIMEOUT);

        Map<String, OrgMember> roles = orgMemberService.getOrgMemberRoles(List.of(orgA, orgB, orgC), user).block(TIMEOUT);
        System.out.println("[OrgMemberServiceImplMongoTest] roles " + roles.keySet());
        assertThat(roles).containsOnlyKeys(orgA, orgB);
        assertThat(roles.get(orgA).getRole()).isEqualTo(MemberRole.ADMIN);
        assertThat(roles.get(orgB).getRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(orgMemberService.getOrgMemberRoles(List.of(orgB), user).block(TIMEOUT)).containsOnlyKeys(orgB);
    }

    /** Catches: deleted organisations, or memberships of organisations that no longer exist, being listed as active. */
    @Test
    void activeOrgsExcludeDeletedOrgsAndMembershipsWithoutAnOrganisation() {
        String active = createActiveOrg();
        String deleted = createOrg(OrganizationState.DELETED);
        String ghost = newId();
        String user = newId();
        orgMemberService.addMember(active, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(deleted, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(ghost, user, MemberRole.MEMBER).block(TIMEOUT);

        List<String> orgIds = orgMemberService.getAllActiveOrgs(user).map(OrgMember::getOrgId).collectList().block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplMongoTest] active orgs " + orgIds + " of 3 memberships");
        assertThat(orgIds).containsExactly(active);
        assertThat(orgMemberService.countAllActiveOrgs(user).block(TIMEOUT)).isEqualTo(1L);
        assertThat(orgMemberService.countAllActiveOrgs(newId()).block(TIMEOUT)).isZero();
    }

    /**
     * Catches: the current org not being persisted (the first active org must be marked CURRENT when none is), the wrong
     * org returned, and the explicit mark / unmark writing wrong state values.
     */
    @Test
    void currentOrgIsMarkedWhenNoneIsAndCanBeSwitched() {
        String orgA = createActiveOrg();
        String orgB = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(orgA, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgB, user, MemberRole.MEMBER).block(TIMEOUT);

        OrgMember first = orgMemberService.getCurrentOrgMember(user).block(TIMEOUT);
        String marked = first.getOrgId();
        System.out.println("[OrgMemberServiceImplMongoTest] first current org " + marked);
        assertThat(marked).isIn(orgA, orgB);
        assertThat(singleRow(ORG_MEMBER, marked, user).getState()).isEqualTo(CURRENT);
        String unmarked = marked.equals(orgA) ? orgB : orgA;
        assertThat(singleRow(ORG_MEMBER, unmarked, user).getState()).isEqualTo(NORMAL);

        UserOrgMemberInfo info = orgMemberService.getUserOrgMemberInfo(user).block(TIMEOUT);
        assertThat(info.currentOrgMember().getOrgId()).isEqualTo(marked);
        assertThat(info.orgMembers()).extracting(OrgMember::getOrgId).containsExactlyInAnyOrder(orgA, orgB);

        assertThat(orgMemberService.removeCurrentOrgMark(marked, user).block(TIMEOUT)).isTrue();
        assertThat(orgMemberService.markAsUserCurrentOrgId(unmarked, user).block(TIMEOUT)).isTrue();
        assertThat(orgMemberService.getCurrentOrgMember(user).block(TIMEOUT).getOrgId()).isEqualTo(unmarked);
        assertThat(singleRow(ORG_MEMBER, marked, user).getState()).isEqualTo(NORMAL);
    }

    /** Catches: getUserOrgMemberInfo not persisting the first org as current when none is marked (it has its own path). */
    @Test
    void orgMemberInfoMarksTheFirstOrgAsCurrentWhenNoneIsMarked() {
        String orgA = createActiveOrg();
        String orgB = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(orgA, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(orgB, user, MemberRole.MEMBER).block(TIMEOUT);

        UserOrgMemberInfo info = orgMemberService.getUserOrgMemberInfo(user).block(TIMEOUT);

        String marked = info.currentOrgMember().getOrgId();
        System.out.println("[OrgMemberServiceImplMongoTest] info marked " + marked + " as current of " + info.orgMembers().size());
        assertThat(singleRow(ORG_MEMBER, marked, user).getState()).isEqualTo(CURRENT);
        assertThat(singleRow(ORG_MEMBER, marked.equals(orgA) ? orgB : orgA, user).getState()).isEqualTo(NORMAL);
        assertThat(info.orgMembers()).hasSize(2);
    }

    /** Catches: a user without any active organisation getting a current org or an error instead of nothing. */
    @Test
    void aUserWithoutActiveOrgsHasNoCurrentOrgAndNoOrgInfo() {
        String user = newId();
        assertThat(orgMemberService.getCurrentOrgMember(user).blockOptional(TIMEOUT)).isEmpty();
        assertThat(orgMemberService.getUserOrgMemberInfo(user).blockOptional(TIMEOUT)).isEmpty();

        String deleted = createOrg(OrganizationState.DELETED);
        orgMemberService.addMember(deleted, user, MemberRole.MEMBER).block(TIMEOUT);
        assertThat(orgMemberService.getCurrentOrgMember(user).blockOptional(TIMEOUT)).isEmpty();
    }
}

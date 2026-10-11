package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.infra.birelation.BiRelationBizType.GROUP_MEMBER;

import java.util.Locale;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.util.SystemGroups;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.sdk.constants.GlobalContext;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * GroupServiceImpl against the MongoDB test container (unit U14, task L3-11a), shared {@code test} context, ids
 * generated per test. The delete event is in GroupServiceImplDeleteEventMongoTest (it needs its own context).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class GroupServiceImplMongoTest extends OrganizationMongoTestBase {

    /** The name field as stored: for a system group getName(locale) re-localises, so the document is read raw. */
    private String storedName(Group group) {
        org.bson.Document stored = mongo.findById(group.getId(), org.bson.Document.class, mongo.getCollectionName(Group.class)).block(TIMEOUT);
        return stored.getString("name");
    }

    private Group saveGroup(String orgId, String name) {
        Group group = Group.builder().organizationId(orgId).name(name).gid(newId()).build();
        return mongo.save(group).block(TIMEOUT);
    }

    /** Catches: a created group without its creator as ADMIN member, or a returned group that was not stored. */
    @Test
    void createStoresTheGroupAndMakesTheCreatorItsAdmin() {
        String org = newId();
        String creator = newId();
        Group draft = Group.builder().organizationId(org).name("team").gid(newId()).build();

        Group created = groupService.create(draft, creator, org).block(TIMEOUT);

        System.out.println("[GroupServiceImplMongoTest] created group " + created.getId());
        assertThat(created.getId()).isNotBlank();
        assertThat(groupService.getById(created.getId()).block(TIMEOUT).getName(Locale.ENGLISH)).isEqualTo("team");
        BiRelation row = singleRow(GROUP_MEMBER, created.getId(), creator);
        assertThat(row.getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
        GroupMember member = groupMemberService.getGroupMember(created.getId(), creator).block(TIMEOUT);
        assertThat(member.getOrgId()).isEqualTo(org);
        assertThat(rowsOfSource(GROUP_MEMBER, created.getId())).hasSize(1);
    }

    /** Catches: groups of another organisation in the lookups or counts, and an id lookup returning too much. */
    @Test
    void lookupsAndCountsAreScopedToTheOrgAndTheIds() {
        String orgA = newId();
        String orgB = newId();
        Group a1 = saveGroup(orgA, "a1");
        Group a2 = saveGroup(orgA, "a2");
        Group b1 = saveGroup(orgB, "b1");

        assertThat(groupService.getByOrgId(orgA).collectList().block(TIMEOUT)).extracting(Group::getId)
                .containsExactlyInAnyOrder(a1.getId(), a2.getId());
        assertThat(groupService.getOrgGroupCount(orgA).block(TIMEOUT)).isEqualTo(2L);
        assertThat(groupService.getOrgGroupCount(orgB).block(TIMEOUT)).isEqualTo(1L);
        assertThat(groupService.getOrgGroupCount(newId()).block(TIMEOUT)).isZero();
        assertThat(groupService.getByIds(Set.of(a1.getId(), b1.getId())).collectList().block(TIMEOUT)).extracting(g -> g.getName(Locale.ENGLISH))
                .containsExactlyInAnyOrder("a1", "b1");
        assertThat(groupService.getById(newId()).blockOptional(TIMEOUT)).isEmpty();
        System.out.println("[GroupServiceImplMongoTest] org A has " + groupService.getOrgGroupCount(orgA).block(TIMEOUT) + " groups");
    }

    /** Catches: swapped system group types or flags, an unlocalised name, and lookups of another org's system groups. */
    @Test
    void systemGroupsCarryTheirTypeFlagLocalisedNameAndAreFoundPerOrg() {
        String org = newId();
        String bareOrg = newId();

        Group allUsers = groupService.createAllUserGroup(org).block(TIMEOUT);
        Group dev = groupService.createDevGroup(org).block(TIMEOUT);

        System.out.println("[GroupServiceImplMongoTest] system groups: " + storedName(allUsers) + " / " + storedName(dev));
        assertThat(allUsers.isAllUsersGroup()).isTrue();
        assertThat(allUsers.getType()).isEqualTo(SystemGroups.ALL_USER);
        assertThat(allUsers.getName(Locale.ENGLISH)).isEqualTo("All Users");
        assertThat(allUsers.getGid()).isNotBlank();
        assertThat(storedName(allUsers)).isEqualTo("All Users");
        assertThat(storedName(dev)).isEqualTo("Developers");
        assertThat(dev.isAllUsersGroup()).isFalse();
        assertThat(dev.isDevGroup()).isTrue();
        assertThat(dev.getName(Locale.ENGLISH)).isEqualTo("Developers");

        assertThat(groupService.getAllUsersGroup(org).block(TIMEOUT).getId()).isEqualTo(allUsers.getId());
        assertThat(groupService.getDevGroup(org).block(TIMEOUT).getId()).isEqualTo(dev.getId());
        assertThat(groupService.getAllUsersGroup(bareOrg).blockOptional(TIMEOUT)).isEmpty();
        assertThat(groupService.getDevGroup(bareOrg).blockOptional(TIMEOUT)).isEmpty();
    }

    /** Catches: the system group name ignoring the locale of the request context (the stored name is what clients see). */
    @Test
    void systemGroupNameFollowsTheLocaleOfTheReactorContext() {
        Group chinese = groupService.createAllUserGroup(newId())
                .contextWrite(context -> context.put(GlobalContext.CLIENT_LOCALE, Locale.CHINESE)).block(TIMEOUT);
        Group english = groupService.createDevGroup(newId()).block(TIMEOUT);

        System.out.println("[GroupServiceImplMongoTest] stored names: " + storedName(chinese) + " / " + storedName(english));
        assertThat(storedName(chinese)).isEqualTo("所有用户");
        assertThat(storedName(english)).isEqualTo("Developers");
    }

    /** Catches: a partial update overwriting the unset fields with null. */
    @Test
    void updateGroupChangesOnlyTheGivenFields() {
        String org = newId();
        Group group = saveGroup(org, "keep-me");

        Boolean updated = groupService.updateGroup(Group.builder().id(group.getId()).dynamicRule("role=dev").build()).block(TIMEOUT);

        Group stored = groupService.getById(group.getId()).block(TIMEOUT);
        System.out.println("[GroupServiceImplMongoTest] updated=" + updated + " name=" + stored.getName(Locale.ENGLISH) + " rule=" + stored.getDynamicRule());
        assertThat(updated).isTrue();
        assertThat(stored.getDynamicRule()).isEqualTo("role=dev");
        assertThat(stored.getName(Locale.ENGLISH)).isEqualTo("keep-me");
        assertThat(stored.getOrganizationId()).isEqualTo(org);
    }
}

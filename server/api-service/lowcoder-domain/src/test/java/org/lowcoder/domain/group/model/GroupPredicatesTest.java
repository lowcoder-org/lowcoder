package org.lowcoder.domain.group.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.domain.group.util.SystemGroups;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;

/**
 * Group, GroupMember and organisation-settings decisions (unit U4b, task L3-7).
 */
class GroupPredicatesTest {

    private static final String CUSTOM_NAME = "Team Rocket";
    private static final String GROUP_ID = "g1";
    private static final String SOURCE = "ldap";
    private static final long OLD_MILLIS = 1_000L;
    private static final long NEWER_MILLIS = 2_000L;

    private static Group group(String name, Boolean allUsers, String type) {
        return Group.builder().name(name).allUsersGroup(allUsers).type(type).createdAt(Instant.ofEpochMilli(OLD_MILLIS)).build();
    }

    // ---------------------------------------------------------------- GroupMember

    private static GroupMember member(String groupId, MemberRole role) {
        return GroupMember.builder().groupId(groupId).userId("u1").role(role).orgId("o1").build();
    }

    /** Catches: admin and super-admin confused, or a null role counting as one of them. */
    @ParameterizedTest
    @EnumSource(MemberRole.class)
    void adminPredicatesMatchExactlyTheirOwnRole(MemberRole role) {
        GroupMember member = member(GROUP_ID, role);
        System.out.println("[GroupPredicatesTest] role " + role + " admin=" + member.isAdmin() + " super=" + member.isSuperAdmin());
        assertThat(member.isAdmin()).isEqualTo(role == MemberRole.ADMIN);
        assertThat(member.isSuperAdmin()).isEqualTo(role == MemberRole.SUPER_ADMIN);
    }

    @Test
    void aMemberWithoutARoleIsNeitherAdminNorSuperAdmin() {
        GroupMember member = member(GROUP_ID, null);
        assertThat(member.isAdmin()).isFalse();
        assertThat(member.isSuperAdmin()).isFalse();
    }

    /** Catches: the NOT_EXIST sentinel or a blank/null group id counting as a real membership. */
    @Test
    void membershipIsInvalidForTheSentinelAndForABlankGroupId() {
        assertThat(GroupMember.NOT_EXIST.isInvalid()).isTrue();
        assertThat(GroupMember.NOT_EXIST.isValid()).isFalse();
        assertThat(member("", MemberRole.MEMBER).isInvalid()).isTrue();
        assertThat(member("  ", MemberRole.MEMBER).isInvalid()).isTrue();
        assertThat(member(null, MemberRole.MEMBER).isInvalid()).isTrue();

        GroupMember real = member(GROUP_ID, MemberRole.MEMBER);
        assertThat(real.isInvalid()).isFalse();
        assertThat(real.isValid()).isTrue();
        System.out.println("[GroupPredicatesTest] sentinel/blank invalid, real valid");
    }

    // ---------------------------------------------------------------- Group

    /** Catches: either half of the all-users detection (flag, or stored type) being dropped. */
    @Test
    void allUsersGroupIsDetectedByTheFlagOrByTheStoredType() {
        assertThat(group(CUSTOM_NAME, true, null).isAllUsersGroup()).isTrue();
        assertThat(group(CUSTOM_NAME, null, SystemGroups.ALL_USER).isAllUsersGroup()).isTrue();
        assertThat(group(CUSTOM_NAME, false, SystemGroups.ALL_USER).isAllUsersGroup()).isTrue();
        assertThat(group(CUSTOM_NAME, null, null).isAllUsersGroup()).isFalse();
        assertThat(group(CUSTOM_NAME, false, SystemGroups.DEV).isAllUsersGroup()).isFalse();
    }

    /** Catches: system-group detection missing the dev group, or flagging a custom group; the negation drifting. */
    @Test
    void systemGroupsAreAllUsersAndDevOnly() {
        Group allUsers = group("x", true, null);
        Group dev = group("x", null, SystemGroups.DEV);
        Group custom = group(CUSTOM_NAME, null, null);

        assertThat(dev.isDevGroup()).isTrue();
        assertThat(allUsers.isDevGroup()).isFalse();
        assertThat(allUsers.isSystemGroup()).isTrue();
        assertThat(dev.isSystemGroup()).isTrue();
        assertThat(custom.isSystemGroup()).isFalse();
        assertThat(allUsers.isNotSystemGroup()).isFalse();
        assertThat(dev.isNotSystemGroup()).isFalse();
        assertThat(custom.isNotSystemGroup()).isTrue();
        System.out.println("[GroupPredicatesTest] system group detection checked");
    }

    /** Catches: the all-users flag not overriding the stored type; a custom group's type being replaced. */
    @Test
    void typeIsAllUsersWhenFlaggedAndOtherwiseStored() {
        assertThat(group("x", true, "custom").getType()).isEqualTo(SystemGroups.ALL_USER);
        assertThat(group("x", null, SystemGroups.DEV).getType()).isEqualTo(SystemGroups.DEV);
        assertThat(group("x", null, null).getType()).isNull();
    }

    /** Catches: a system group showing its stored name, or a custom group showing a system name; the locale being ignored. */
    @Test
    void nameIsLocalisedForSystemGroupsAndStoredForCustomOnes() {
        assertThat(group("stored", true, null).getName(Locale.ENGLISH)).isEqualTo("All Users");
        assertThat(group("stored", null, SystemGroups.DEV).getName(Locale.ENGLISH)).isEqualTo("Developers");
        assertThat(group("stored", true, null).getName(Locale.CHINESE)).isEqualTo("所有用户");
        assertThat(group(CUSTOM_NAME, null, null).getName(Locale.ENGLISH)).isEqualTo(CUSTOM_NAME);
        System.out.println("[GroupPredicatesTest] names: " + group("stored", true, null).getName(Locale.ENGLISH));
    }

    /** Catches: blank sources / rules counting as sync or dynamic groups. */
    @Test
    void syncAndDynamicNeedANonBlankSourceOrRule() {
        assertThat(Group.builder().source(SOURCE).build().isSyncGroup()).isTrue();
        assertThat(Group.builder().source(" ").build().isSyncGroup()).isFalse();
        assertThat(Group.builder().build().isSyncGroup()).isFalse();
        assertThat(Group.builder().dynamicRule("a=b").build().isDynamic()).isTrue();
        assertThat(Group.builder().dynamicRule("").build().isDynamic()).isFalse();
        assertThat(Group.builder().dynamicRule("  ").build().isDynamic()).isFalse();
        assertThat(Group.builder().build().isDynamic()).isFalse();
    }

    /** Catches: a group without audit data failing; create time in the wrong unit. */
    @Test
    void createTimeIsEpochMillisOrZero() {
        assertThat(Group.builder().createdAt(Instant.ofEpochMilli(NEWER_MILLIS)).build().getCreateTime()).isEqualTo(NEWER_MILLIS);
        assertThat(Group.builder().build().getCreateTime()).isZero();
        assertThat(Organization.builder().createdAt(Instant.ofEpochMilli(NEWER_MILLIS)).build().getCreateTime()).isEqualTo(NEWER_MILLIS);
        assertThat(Organization.builder().build().getCreateTime()).isZero();
    }

    /** Catches: the ordering of the listing: all users, dev, sync groups, then by creation time. */
    @Test
    void groupsSortAllUsersThenDevThenSyncThenByCreationTime() {
        Group allUsers = group("a", true, null);
        Group dev = group("d", null, SystemGroups.DEV);
        Group sync = Group.builder().name("s").source(SOURCE).createdAt(Instant.ofEpochMilli(NEWER_MILLIS * 10)).build();
        Group older = Group.builder().name("older").createdAt(Instant.ofEpochMilli(NEWER_MILLIS)).build();
        Group newer = Group.builder().name("newer").createdAt(Instant.ofEpochMilli(NEWER_MILLIS * 2)).build();

        List<Group> sorted = List.of(newer, sync, older, dev, allUsers).stream().sorted().toList();
        System.out.println("[GroupPredicatesTest] sorted: " + sorted.stream().map(g -> g.getName(Locale.ENGLISH)).toList());
        assertThat(sorted).containsExactly(allUsers, dev, sync, older, newer);
    }

    // ---------------------------------------------------------------- OrganizationCommonSettings

    /** Catches: the password-reset template leaking into an export; other keys lost; the original mutated. */
    @Test
    void sanitizedDropsOnlyThePasswordResetTemplate() {
        Organization.OrganizationCommonSettings settings = new Organization.OrganizationCommonSettings();
        settings.put(Organization.OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE, "<html>secret</html>");
        settings.put("theme", "dark");

        Organization.OrganizationCommonSettings sanitized = settings.sanitized();
        System.out.println("[GroupPredicatesTest] sanitized=" + sanitized + " original keys=" + settings.keySet());
        assertThat(sanitized).containsOnly(java.util.Map.entry("theme", "dark"));
        assertThat(settings).hasSize(2);
        assertThat(sanitized).isNotSameAs(settings);
    }

    /** Catches: an empty settings map returning itself (callers mutate the result) or throwing. */
    @Test
    void sanitizedOfEmptySettingsIsANewEmptyInstance() {
        Organization.OrganizationCommonSettings empty = new Organization.OrganizationCommonSettings();
        Organization.OrganizationCommonSettings sanitized = empty.sanitized();
        assertThat(sanitized).isEmpty();
        assertThat(sanitized).isNotSameAs(empty);
    }
}

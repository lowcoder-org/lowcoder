package org.lowcoder.api.contract.support;

import org.lowcoder.api.authentication.dto.RedirectView;
import org.lowcoder.api.usermanagement.InvitationEndpoints.InviteEmailRequest;
import org.lowcoder.api.usermanagement.OrganizationEndpoints.UpdateOrgCommonSettingsRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.CreateUserRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.LostPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.MarkUserStatusRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.ResetLostPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.ResetPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.UpdatePasswordRequest;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.CreateGroupRequest;
import org.lowcoder.api.usermanagement.view.GroupMemberAggregateView;
import org.lowcoder.api.usermanagement.view.GroupMemberView;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.api.usermanagement.view.OrgAndVisitorRoleView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateGroupRequest;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.usermanagement.view.UpdateUserRequest;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Samples of the user-management types (docs/API_PAYLOAD_TEST_PLAN.md §3.3), with the conventions of
 * {@link PayloadSamples}. These types are WP4's; task T2.1 wrote {@link #groupView()} and {@link #orgMemberView()} first
 * because they are the concrete payloads of {@code ApplicationEndpoints#getGroupsOrMembersWithoutPermissions}
 * (Appendix A), and tasks T4.1 to T4.4 add the types of {@code UserEndpoints}, {@code OrganizationEndpoints},
 * {@code GroupEndpoints} and {@code InvitationEndpoints}.
 * Exceptions to the unique values, each because production reads the value: {@code CreateUserRequest.email} is a
 * lower-case address ({@code EmailUtils} validates and normalizes it), {@code MarkUserStatusRequest.type} is a real
 * {@code UserStatusType} value, and {@code UpdateRoleRequest.role} a real {@code MemberRole} value; likewise
 * {@code GroupMemberView.role}, which the view reads from a {@code MemberRole}.
 */
public final class UserManagementSamples {

    /** Lower case and trimmed, so that {@code EmailUtils.normalize} leaves it as it is. */
    public static final String CREATE_USER_EMAIL = "createuserrequest.email@example.com";
    /** The domain {@code OrganizationDomainCheckResult#redirect} names; the controller prefixes {@code https://}. */
    public static final String REDIRECT_DOMAIN = "redirectview.redirecturi.example.com";
    public static final String REDIRECT_SCHEME = "https://";

    private UserManagementSamples() {
    }

    public static CreateUserRequest createUserRequest() {
        return new CreateUserRequest(CREATE_USER_EMAIL, "CreateUserRequest.password");
    }

    public static LostPasswordRequest lostPasswordRequest() {
        return new LostPasswordRequest("LostPasswordRequest.userEmail");
    }

    /** {@code value} is declared {@code Object}: the representative input (adequacy check 3). */
    public static MarkUserStatusRequest markUserStatusRequest() {
        return new MarkUserStatusRequest(UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE.getValue(), PayloadSamples.representativeObject());
    }

    public static ResetLostPasswordRequest resetLostPasswordRequest() {
        return new ResetLostPasswordRequest("ResetLostPasswordRequest.token", "ResetLostPasswordRequest.userEmail",
                "ResetLostPasswordRequest.newPassword");
    }

    public static ResetPasswordRequest resetPasswordRequest() {
        return new ResetPasswordRequest("ResetPasswordRequest.userId");
    }

    public static UpdatePasswordRequest updatePasswordRequest() {
        return new UpdatePasswordRequest("UpdatePasswordRequest.oldPassword", "UpdatePasswordRequest.newPassword");
    }

    public static UpdateUserRequest updateUserRequest() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setName("UpdateUserRequest.name");
        request.setUiLanguage("UpdateUserRequest.uiLanguage");
        return request;
    }

    /**
     * {@code connections} is a {@code LinkedHashSet}, as in {@code UserSamples#user}: production's {@code HashSet} of a
     * class without {@code hashCode} has no stable order, and the sample's order becomes the fixture's.
     */
    public static UserProfileView userProfileView() {
        Set<Connection> connections = new LinkedHashSet<>();
        connections.add(UserSamples.connection("UserProfileView.connections[0]", 10));
        connections.add(UserSamples.connection("UserProfileView.connections[1]", 11));
        return UserProfileView.builder()
                .id("UserProfileView.id")
                .orgAndRoles(new ArrayList<>(List.of(orgAndVisitorRoleView("UserProfileView.orgAndRoles[0]"),
                        orgAndVisitorRoleView("UserProfileView.orgAndRoles[1]"))))
                .currentOrgId("UserProfileView.currentOrgId")
                .username("UserProfileView.username")
                .connections(connections)
                .isAnonymous(true)
                .isEnabled(false)
                .uiLanguage("UserProfileView.uiLanguage")
                .avatar("UserProfileView.avatar")
                .avatarUrl("UserProfileView.avatarUrl")
                .hasPassword(true)
                .hasSetNickname(false)
                .hasShownNewUserGuidance(true)
                .userStatus(ApplicationSamples.map(UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE.getValue(), Boolean.TRUE,
                        UserStatusType.NON_DEV_POP_UP_FOR_OLD_USERS.getValue(), 40_130))
                .isOrgDev(false)
                .createdTimeMs(3_000_000_130L)
                .ip("UserProfileView.ip")
                .build();
    }

    public static OrgAndVisitorRoleView orgAndVisitorRoleView() {
        return orgAndVisitorRoleView("OrgAndVisitorRoleView");
    }

    /** The organization is {@code OrganizationSamples#organization}; {@code prefix} keeps the role unique. */
    static OrgAndVisitorRoleView orgAndVisitorRoleView(String prefix) {
        return new OrgAndVisitorRoleView(OrganizationSamples.organization(), prefix + ".role");
    }

    public static UserDetail userDetail() {
        return UserDetail.builder()
                .id("UserDetail.id")
                .name("UserDetail.name")
                .avatarUrl("UserDetail.avatarUrl")
                .uiLanguage("UserDetail.uiLanguage")
                .email("UserDetail.email")
                .ip("UserDetail.ip")
                .groups(new ArrayList<>(List.of(stringMap("UserDetail.groups[0]"), stringMap("UserDetail.groups[1]"))))
                .extra(ApplicationSamples.map("department", "UserDetail.extra.department", "level", 40_140))
                .userAuth(ApplicationSamples.map("source", "UserDetail.userAuth.source", "expiresIn", 40_141))
                .build();
    }

    private static Map<String, String> stringMap(String prefix) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("groupId", prefix + ".groupId");
        map.put("groupName", prefix + ".groupName");
        return map;
    }

    /** The view the controllers build from {@link #orgViewOrganization()}. */
    public static OrgView orgView() {
        return new OrgView(orgViewOrganization());
    }

    /**
     * The organization behind {@link #orgView()}: {@code OrgView} reads its id, name and the {@code @JsonIgnore}d
     * audit times, so an endpoint test stubs the service with this organization and expects the {@code OrgView} S1.
     */
    public static Organization orgViewOrganization() {
        return Organization.builder()
                .id("OrgView.orgId")
                .name("OrgView.orgName")
                .createdAt(ApplicationSamples.instant(130))
                .updatedAt(ApplicationSamples.instant(131))
                .build();
    }

    public static UpdateOrgRequest updateOrgRequest() {
        UpdateOrgRequest request = new UpdateOrgRequest();
        request.setOrgName("UpdateOrgRequest.orgName");
        request.setContactName("UpdateOrgRequest.contactName");
        request.setContactEmail("UpdateOrgRequest.contactEmail");
        request.setContactPhoneNumber("UpdateOrgRequest.contactPhoneNumber");
        request.setState(OrganizationState.DELETED);
        return request;
    }

    public static UpdateRoleRequest updateRoleRequest() {
        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setUserId("UpdateRoleRequest.userId");
        request.setRole(MemberRole.ADMIN.getValue());
        return request;
    }

    /** {@code value} is declared {@code Object}: the representative input (adequacy check 3). */
    public static UpdateOrgCommonSettingsRequest updateOrgCommonSettingsRequest() {
        return new UpdateOrgCommonSettingsRequest("UpdateOrgCommonSettingsRequest.key", PayloadSamples.representativeObject());
    }

    /** A page of two members, as {@code OrgApiService#getOrganizationMembers} answers it. */
    public static OrgMemberListView orgMemberListView() {
        return OrgMemberListView.builder()
                .visitorRole("OrgMemberListView.visitorRole")
                .members(new ArrayList<>(List.of(orgMemberView("OrgMemberListView.members[0]", 10), orgMemberView("OrgMemberListView.members[1]", 11))))
                .total(40_150)
                .pageNum(40_151)
                .pageSize(40_152)
                .build();
    }

    /**
     * {@code definition} is declared {@code Object}: the representative input (adequacy check 3). The
     * {@code @JsonIgnore}d {@code pluginExecutorKey} is set, so S1 shows it absent; {@code connectionPool}, also ignored,
     * is a class and stays unset.
     */
    public static DatasourceMetaInfo datasourceMetaInfo() {
        return datasourceMetaInfo("DatasourceMetaInfo");
    }

    static DatasourceMetaInfo datasourceMetaInfo(String prefix) {
        return DatasourceMetaInfo.builder()
                .type(prefix + ".type")
                .displayName(prefix + ".displayName")
                .pluginExecutorKey(prefix + ".pluginExecutorKey")
                .version(prefix + ".version")
                .hasStructureInfo(true)
                .definition(PayloadSamples.representativeObject())
                .build();
    }

    /**
     * {@code Organization#organizationDomain} is write-only, so this is a request type: a domain with two auth configs.
     * The {@code authConfigs} field is MongoDB's copy, not a JSON property.
     */
    public static OrganizationDomain organizationDomain() {
        OrganizationDomain domain = new OrganizationDomain();
        domain.setDomain("OrganizationDomain.domain");
        domain.setConfigs(new ArrayList<>(List.of(OrganizationSamples.emailAuthConfig("OrganizationDomain.configs[0]"),
                OrganizationSamples.oauth2GenericAuthConfig("OrganizationDomain.configs[1]"))));
        return domain;
    }

    /** A {@code HashMap} subclass: two settings, as {@code OrgApiService#getOrgCommonSettings} answers them. */
    public static OrganizationCommonSettings organizationCommonSettings() {
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put("themeId", "OrganizationCommonSettings.themeId");
        settings.put("maxRows", 40_160);
        return settings;
    }

    /** {@code redirectUri} as {@code OrganizationDomainCheckResult#buildOrganizationDomainCheckView} builds it. */
    public static RedirectView redirectView() {
        return RedirectView.builder().redirectUri(REDIRECT_SCHEME + REDIRECT_DOMAIN).build();
    }

    public static CreateGroupRequest createGroupRequest() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("CreateGroupRequest.name");
        request.setDynamicRule("CreateGroupRequest.dynamicRule");
        return request;
    }

    public static UpdateGroupRequest updateGroupRequest() {
        UpdateGroupRequest request = new UpdateGroupRequest();
        request.setGroupName("UpdateGroupRequest.groupName");
        request.setDynamicRule("UpdateGroupRequest.dynamicRule");
        return request;
    }

    public static AddMemberRequest addMemberRequest() {
        AddMemberRequest request = new AddMemberRequest();
        request.setUserId("AddMemberRequest.userId");
        request.setRole("AddMemberRequest.role");
        return request;
    }

    /** A page of two group members, as {@code GroupApiService#getGroupMembersForSearch} answers it. */
    public static GroupMemberAggregateView groupMemberAggregateView() {
        return GroupMemberAggregateView.builder()
                .visitorRole("GroupMemberAggregateView.visitorRole")
                .members(new ArrayList<>(List.of(groupMemberView("GroupMemberAggregateView.members[0]", 10),
                        groupMemberView("GroupMemberAggregateView.members[1]", 11))))
                .total(40_190)
                .pageNum(40_191)
                .pageSize(40_192)
                .build();
    }

    /** A getter-only view of a group member and its user. */
    public static GroupMemberView groupMemberView() {
        return groupMemberView("GroupMemberView", 0);
    }

    /**
     * {@code prefix} keeps the values of nested copies unique; {@code offset} varies the numbers. The user is made with
     * its no-argument constructor: the builder leaves the memoized {@code avatarUrl} unset, and the view would read
     * {@code ""}.
     */
    static GroupMemberView groupMemberView(String prefix, int offset) {
        User user = new User();
        user.setId(prefix + ".userId");
        user.setName(prefix + ".userName");
        user.setTpAvatarLink(prefix + ".avatarUrl");
        GroupMember member = new GroupMember(prefix + ".groupId", user.getId(), MemberRole.SUPER_ADMIN, prefix + ".orgId",
                3_000_000_180L + offset);
        return new GroupMemberView(member, user);
    }

    /**
     * The group behind {@link #groupView()} where {@code GroupView#from} copies it: not a system group (its name stays),
     * a sync group ({@code source} set), created at {@code GroupView.createTime} in epoch milliseconds.
     */
    public static Group groupViewGroup() {
        return Group.builder()
                .id("GroupView.groupId")
                .createdAt(Instant.ofEpochMilli(groupView().getCreateTime()))
                .gid("GroupView.groupGid")
                .name("GroupView.groupName")
                .organizationId("GroupView.organizationId")
                .allUsersGroup(Boolean.FALSE)
                .dynamicRule("GroupView.dynamicRule")
                .source("GroupView.source")
                .syncDeleted(false)
                .build();
    }

    public static InvitationVO invitationVO() {
        return InvitationVO.builder()
                .inviteCode("InvitationVO.inviteCode")
                .createUserName("InvitationVO.createUserName")
                .invitedOrganizationName("InvitationVO.invitedOrganizationName")
                .invitedOrganizationId("InvitationVO.invitedOrganizationId")
                .build();
    }

    public static InviteEmailRequest inviteEmailRequest() {
        return new InviteEmailRequest(new String[] {"InviteEmailRequest.emails[0]", "InviteEmailRequest.emails[1]"}, "InviteEmailRequest.orgId");
    }

    /** {@code stats} has the keys and value types {@code GroupView#from} puts there. */
    public static GroupView groupView() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("adminUserCount", 40_110);
        stats.put("userCount", 40_111);
        stats.put("users", new ArrayList<>(List.of("GroupView.stats.users[0]", "GroupView.stats.users[1]")));
        return GroupView.builder()
                .groupId("GroupView.groupId")
                .groupGid("GroupView.groupGid")
                .groupName("GroupView.groupName")
                .allUsersGroup(true)
                .isDevGroup(false)
                .visitorRole("GroupView.visitorRole")
                .createTime(3_000_000_110L)
                .dynamicRule("GroupView.dynamicRule")
                .isSyncGroup(true)
                .isSyncDelete(false)
                .stats(stats)
                .build();
    }

    /** {@code rawUserInfos}: source → the raw user info of that connection. */
    public static OrgMemberView orgMemberView() {
        return orgMemberView("OrgMemberView", 0);
    }

    /** {@code prefix} keeps the values of nested copies unique; {@code offset} varies the numbers. */
    static OrgMemberView orgMemberView(String prefix, int offset) {
        Map<String, Map<String, Object>> rawUserInfos = new LinkedHashMap<>();
        rawUserInfos.put(prefix + ".rawUserInfos.first", ApplicationSamples.map("sub", prefix + ".rawUserInfos.first.sub", "loginCount", 40_120 + offset));
        rawUserInfos.put(prefix + ".rawUserInfos.second", ApplicationSamples.map("sub", prefix + ".rawUserInfos.second.sub", "loginCount", 40_121 + offset));
        return OrgMemberView.builder()
                .userId(prefix + ".userId")
                .name(prefix + ".name")
                .avatarUrl(prefix + ".avatarUrl")
                .role(prefix + ".role")
                .joinTime(3_000_000_120L + offset)
                .rawUserInfos(rawUserInfos)
                .build();
    }
}

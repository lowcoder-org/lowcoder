package org.lowcoder.domain.permission.service;

import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Shared constants and builders of the permission-handler tests. The handlers are package-private and take their
 * org/group/permission collaborators by field injection, so the tests inject them reflectively.
 */
final class PermissionTestFixtures {

    static final String ORG_ID = "org-1";
    static final String USER_ID = "user-1";
    static final String OTHER_USER_ID = "user-other";
    static final String GROUP_ID = "group-1";
    static final String OTHER_GROUP_ID = "group-other";
    static final String RESOURCE_ID = "resource-1";

    private PermissionTestFixtures() {
    }

    static ResourcePermission permission(ResourceType type, String resourceId, ResourceHolder holder, String holderId,
            ResourceRole role) {
        return ResourcePermission.builder()
                .resourceType(type)
                .resourceId(resourceId)
                .resourceHolder(holder)
                .resourceHolderId(holderId)
                .resourceRole(role)
                .build();
    }

    static OrgMember orgMember(MemberRole role) {
        return OrgMember.builder().orgId(ORG_ID).userId(USER_ID).role(role).build();
    }

    static void inject(ResourcePermissionHandler handler, OrgMemberService orgMemberService,
            GroupMemberService groupMemberService, ResourcePermissionService resourcePermissionService,
            CommonConfig config) {
        ReflectionTestUtils.setField(handler, ResourcePermissionHandler.class, "orgMemberService", orgMemberService, OrgMemberService.class);
        ReflectionTestUtils.setField(handler, ResourcePermissionHandler.class, "groupMemberService", groupMemberService, GroupMemberService.class);
        ReflectionTestUtils.setField(handler, ResourcePermissionHandler.class, "resourcePermissionService", resourcePermissionService, ResourcePermissionService.class);
        ReflectionTestUtils.setField(handler, ResourcePermissionHandler.class, "config", config, CommonConfig.class);
    }
}

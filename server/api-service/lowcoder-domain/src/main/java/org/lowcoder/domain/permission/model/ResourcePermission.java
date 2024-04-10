package org.lowcoder.domain.permission.model;

import static org.lowcoder.domain.permission.config.PermissionConst.ID_SPLITTER;

import java.util.List;
import java.util.Set;

import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.sdk.models.HasIdAndAuditing;

import com.google.common.base.Splitter;

import lombok.Builder;
import lombok.Getter;

@Getter
@SuperBuilder
@Jacksonized
public class ResourcePermission extends HasIdAndAuditing {

    private ResourceType resourceType;
    private String resourceId;
    private ResourceHolder resourceHolder;
    private String resourceHolderId;
    private ResourceRole resourceRole;

    public boolean matchUser(String userId, ResourceAction resourceAction) {
        return resourceHolder == ResourceHolder.USER
                && StringUtils.equals(userId, resourceHolderId)
                && resourceRole.canDo(resourceAction);
    }

    public boolean matchGroup(Set<String> userGroupIds, ResourceAction resourceAction) {
        return resourceHolder == ResourceHolder.GROUP
                && userGroupIds.contains(resourceHolderId)
                && resourceRole.canDo(resourceAction);
    }

    public boolean ownedByGroup() {
        return resourceHolder == ResourceHolder.GROUP;
    }

    public boolean ownedByUser() {
        return resourceHolder == ResourceHolder.USER;
    }

    public static String parseId(String joinedStr) {
        return StringUtils.substringAfter(joinedStr, ID_SPLITTER);
    }

    public static ResourcePermission fromBiRelation(BiRelation biRelation) {
        String sourceId = biRelation.getSourceId();
        List<String> sourceStrings = Splitter.on(ID_SPLITTER).splitToList(sourceId);
        String resourceId = sourceStrings.get(1);
        ResourceType resourceType = ResourceType.from(sourceStrings.get(0));

        String targetId = biRelation.getTargetId();
        List<String> targetStrings = Splitter.on(ID_SPLITTER).splitToList(targetId);
        ResourceHolder holderType = ResourceHolder.from(targetStrings.get(0));
        String holderId = targetStrings.get(1);

        ResourceRole role = ResourceRole.fromValue(biRelation.getRelation());

        ResourcePermission permission = ResourcePermission.builder()
                .resourceType(resourceType)
                .resourceId(resourceId)
                .resourceHolder(holderType)
                .resourceHolderId(holderId)
                .resourceRole(role)
                .build();
        permission.setId(biRelation.getId());
        return permission;
    }

    public BiRelation toBiRelation() {
        return BiRelation.builder()
                .bizType(BiRelationBizType.RESOURCE)
                .sourceId(resourceType.join(resourceId))
                .targetId(resourceHolder.join(resourceHolderId))
                .relation(resourceRole == null ? "" : resourceRole.getValue())
                .build();
    }
}

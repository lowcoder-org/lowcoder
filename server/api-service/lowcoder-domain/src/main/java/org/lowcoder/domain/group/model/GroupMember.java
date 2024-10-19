package org.lowcoder.domain.group.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.infra.birelation.BiRelation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Jacksonized
@Builder
@AllArgsConstructor
public class GroupMember {

    private final String groupId;
    private final String userId;
    private final MemberRole role;
    private final String orgId;
    private final long joinTime;

    public static final GroupMember NOT_EXIST = new GroupMember("", "", MemberRole.MEMBER, "", 0);

    public static GroupMember from(BiRelation biRelation) {
        return new GroupMember(biRelation.getSourceId(), biRelation.getTargetId(),
                MemberRole.fromValue(biRelation.getRelation()), biRelation.getExtParam1(),
                biRelation.getCreateTime());
    }

    public boolean isAdmin() {
        return role == MemberRole.ADMIN;
    }

    public boolean isSuperAdmin() {
        return role == MemberRole.SUPER_ADMIN;
    }


    @JsonIgnore
    public boolean isInvalid() {
        return this == NOT_EXIST || StringUtils.isBlank(groupId);
    }

    @JsonIgnore
    public boolean isValid() {
        return !isInvalid();
    }

    public String getOrgId() {
        return orgId;
    }

    public String getGroupId() {
        return groupId;
    }

    public String getUserId() {
        return userId;
    }

    public MemberRole getRole() {
        return role;
    }

    public long getJoinTime() {
        return joinTime;
    }
}

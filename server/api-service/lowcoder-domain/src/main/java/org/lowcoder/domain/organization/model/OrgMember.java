package org.lowcoder.domain.organization.model;

import static com.google.common.base.Strings.nullToEmpty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.infra.birelation.BiRelation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Jacksonized
@Builder
@AllArgsConstructor
public class OrgMember {

    private final String orgId;
    private final String userId;
    private final MemberRole role;
    private final String state;
    private final long joinTime;

    public static final OrgMember NOT_EXIST = new OrgMember("", "", MemberRole.MEMBER, "", 0);

    @JsonIgnore
    public boolean isInvalid() {
        return this == NOT_EXIST || StringUtils.isBlank(orgId);
    }

    public static OrgMember from(BiRelation biRelation) {
        return new OrgMember(biRelation.getSourceId(),
                biRelation.getTargetId(),
                MemberRole.fromValue(biRelation.getRelation()),
                nullToEmpty(biRelation.getState()),
                biRelation.getCreatedAt().toEpochMilli());
    }

    public String getOrgId() {
        return orgId;
    }

    public String getUserId() {
        return userId;
    }

    public MemberRole getRole() {
        return role;
    }

    public boolean isSuperAdmin() {
        return role == MemberRole.SUPER_ADMIN;
    }

    public boolean isAdmin() {
        return role == MemberRole.ADMIN;
    }

    public boolean isCurrentOrg() {
        return OrgMemberState.CURRENT.getValue().equals(state);
    }

    public long getJoinTime() {
        return joinTime;
    }
}

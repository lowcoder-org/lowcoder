package org.lowcoder.api.usermanagement.view;

import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.user.model.User;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class InvitationVO {

    private final String inviteCode;

    private final String createUserName;

    private final String invitedOrganizationName;

    private final String invitedOrganizationId;

    public static InvitationVO from(Invitation invitation, User createUser, Organization invitedOrganization) {
        return InvitationVO.builder()
                .inviteCode(invitation.getId())
                .createUserName(createUser.getName())
                .invitedOrganizationName(invitedOrganization.getName())
                .invitedOrganizationId(invitedOrganization.getId())
                .build();
    }

}

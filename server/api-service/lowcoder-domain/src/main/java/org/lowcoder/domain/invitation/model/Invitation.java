package org.lowcoder.domain.invitation.model;

import java.util.Set;

import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Getter;

@Document
@Builder
@Getter
public class Invitation extends HasIdAndAuditing {

    /**
     * user who create this invitation
     */
    private final String createUserId;

    private final String invitedOrganizationId;

    /**
     * invited user ids by this invitation
     */
    private final Set<String> invitedUserIds;

}

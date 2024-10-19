package org.lowcoder.domain.invitation.service;

import jakarta.annotation.Nonnull;
import org.lowcoder.domain.invitation.model.Invitation;
import reactor.core.publisher.Mono;

public interface InvitationService {
    Mono<Invitation> create(Invitation invitation);

    Mono<Invitation> getById(@Nonnull String invitationId);

    Mono<Boolean> inviteToOrg(String userId, String orgId);
}

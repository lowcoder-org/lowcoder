package org.lowcoder.api.usermanagement;

import org.lowcoder.api.usermanagement.view.InvitationVO;
import reactor.core.publisher.Mono;

public interface InvitationApiService {
    Mono<Boolean> inviteUser(String invitationId);

    Mono<InvitationVO> getInvitationView(String invitationId);

    Mono<InvitationVO> create(String orgId);

    public record JoinOrgResult(boolean alreadyInOrg, boolean success) {

    }
}

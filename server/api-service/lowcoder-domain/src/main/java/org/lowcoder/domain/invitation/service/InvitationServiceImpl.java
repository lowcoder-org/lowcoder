package org.lowcoder.domain.invitation.service;


import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.invitation.repository.InvitationRepository;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class InvitationServiceImpl implements InvitationService {

    private final InvitationRepository invitationRepository;
    private final OrgMemberService orgMemberService;
    private final InvitationRepository repository;

    @Override
    public Mono<Invitation> create(Invitation invitation) {
        return repository.save(invitation);
    }

    @Override
    public Mono<Invitation> getById(@Nonnull String invitationId) {
        return invitationRepository.findById(invitationId);
    }

    @Override
    public Mono<Boolean> inviteToOrg(String userId, String orgId) {
        return orgMemberService.addMember(orgId, userId, MemberRole.MEMBER);
    }

}

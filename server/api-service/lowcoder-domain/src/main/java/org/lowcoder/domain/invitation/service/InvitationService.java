package org.lowcoder.domain.invitation.service;


import javax.annotation.Nonnull;

import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.invitation.repository.InvitationRepository;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@Lazy
@Service
public class InvitationService {

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private OrgMemberService orgMemberService;

    @Autowired
    private InvitationRepository repository;

    public Mono<Invitation> create(Invitation invitation) {
        return repository.save(invitation);
    }

    public Mono<Invitation> getById(@Nonnull String invitationId) {
        return invitationRepository.findById(invitationId);
    }

    public Mono<Boolean> inviteToOrg(String userId, String orgId) {
        return orgMemberService.addMember(orgId, userId, MemberRole.MEMBER);
    }

}

package org.lowcoder.api.usermanagement;

import static org.lowcoder.sdk.exception.BizError.INVITED_ORG_DELETED;
import static org.lowcoder.sdk.exception.BizError.INVITER_NOT_FOUND;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

import javax.annotation.Nonnull;

import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.invitation.service.InvitationService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@Service
public class InvitationApiService {

    @Autowired
    private InvitationService invitationService;

    @Autowired
    private OrgApiService orgApiService;

    @Autowired
    private UserService userService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private OrgMemberService orgMemberService;

    @Autowired
    private AbstractBizThresholdChecker bizThresholdChecker;

    public Mono<Boolean> inviteUser(String invitationId) {
        return sessionUserService.getVisitorId()
                .zipWith(invitationService.getById(invitationId)
                        .switchIfEmpty(deferredError(BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE", invitationId)))
                .flatMap(tuple -> {
                    String visitorId = tuple.getT1();
                    Invitation invitation = tuple.getT2();
                    String orgId = invitation.getInvitedOrganizationId();

                    return tryJoinOrg(visitorId, orgId)
                            .handle((joinOrgResult, sink) -> {
                                if (joinOrgResult.alreadyInOrg()) {
                                    sink.error(ofException(BizError.ALREADY_IN_ORGANIZATION, "ALREADY_IN_ORGANIZATION"));
                                    return;
                                }
                                sink.next(joinOrgResult);
                            })
                            .then(orgApiService.switchCurrentOrganizationTo(orgId));
                });
    }

    private Mono<JoinOrgResult> tryJoinOrg(String visitorId, String orgId) {
        return organizationService.getById(orgId)
                .switchIfEmpty(deferredError(INVITED_ORG_DELETED, "INVITED_ORG_DELETED"))
                .then(orgMemberService.getOrgMember(orgId, visitorId)
                        .hasElement()
                        .flatMap(inOrg -> {
                            if (inOrg) {
                                return Mono.just(new JoinOrgResult(true, false));
                            }

                            return bizThresholdChecker.checkMaxOrgCount(visitorId)
                                    .then(bizThresholdChecker.checkMaxOrgMemberCount(orgId))
                                    .then(invitationService.inviteToOrg(visitorId, orgId))
                                    .map(result -> new JoinOrgResult(false, result));
                        }));
    }

    public Mono<InvitationVO> getInvitationView(String invitationId) {
        return invitationService.getById(invitationId)
                .switchIfEmpty(deferredError(BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE", invitationId))
                .flatMap(invitation -> Mono.zip(getUserMono(invitation), getOrgMono(invitation))
                        .map(tuple -> InvitationVO.from(invitation, tuple.getT1(), tuple.getT2())));
    }

    @Nonnull
    private Mono<Organization> getOrgMono(Invitation invitation) {
        return organizationService.getById(invitation.getInvitedOrganizationId())
                .switchIfEmpty(deferredError(INVITED_ORG_DELETED, "INVITED_ORG_DELETED"));
    }

    @Nonnull
    private Mono<User> getUserMono(Invitation invitation) {
        return userService.findById(invitation.getCreateUserId())
                .switchIfEmpty(deferredError(INVITER_NOT_FOUND, "INVITED_ORG_DELETED"));
    }

    public Mono<InvitationVO> create(String orgId) {
        return sessionUserService.getVisitor()
                .zipWith(organizationService.getById(orgId)
                        .switchIfEmpty(Mono.error(new BizException(BizError.INVALID_ORG_ID, "INVALID_ORG_ID"))))
                .flatMap(tuple2 -> {
                    User user = tuple2.getT1();
                    Organization org = tuple2.getT2();
                    Invitation invitation = Invitation
                            .builder()
                            .createUserId(user.getId())
                            .invitedOrganizationId(orgId)
                            .build();
                    return invitationService.create(invitation)
                            .flatMap(i -> Mono.just(InvitationVO.from(i, user, org)));
                });
    }

    private record JoinOrgResult(boolean alreadyInOrg, boolean success) {

    }
}

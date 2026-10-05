package org.lowcoder.api.usermanagement;

import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
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
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.exception.BizError.INVITED_ORG_DELETED;
import static org.lowcoder.sdk.exception.BizError.INVITER_NOT_FOUND;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

@RequiredArgsConstructor
@Service
public class InvitationApiServiceImpl implements InvitationApiService {

    private final InvitationService invitationService;
    private final OrgApiService orgApiService;
    private final UserService userService;
    private final SessionUserService sessionUserService;
    private final OrganizationService organizationService;
    private final OrgMemberService orgMemberService;
    private final AbstractBizThresholdChecker bizThresholdChecker;

    @Override
    public Mono<Boolean> inviteUser(String invitationId) {
        return sessionUserService.getVisitorId()
                .zipWith(invitationService.getById(invitationId)
                        .switchIfEmpty(deferredError(BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE", invitationId)))
                .flatMap(tuple -> {
                    String visitorId = tuple.getT1();
                    Invitation invitation = tuple.getT2();
                    String orgId = invitation.getInvitedOrganizationId();

                    return tryJoinOrg(visitorId, invitation)
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

    /**
     * Joins the invited organization. An invitation counts only while its creator is a member of that organization
     * (INVALID_INVITATION_CODE otherwise), so an invitation minted by someone outside the organization before
     * {@link #create} checked membership, or by a member who has since left, no longer lets anyone join. Sign-up and login
     * with an invitation id (AuthenticationApiServiceImpl.loginOrRegister) join through here too, and get this error as
     * they get one for an unknown invitation code.
     */
    private Mono<JoinOrgResult> tryJoinOrg(String visitorId, Invitation invitation) {
        String orgId = invitation.getInvitedOrganizationId();
        return organizationService.getById(orgId)
                .switchIfEmpty(deferredError(INVITED_ORG_DELETED, "INVITED_ORG_DELETED"))
                .then(orgMemberService.getOrgMember(orgId, invitation.getCreateUserId())
                        .switchIfEmpty(deferredError(BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE", invitation.getId())))
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

    @Override
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

    /**
     * An invitation to an organization the visitor is a member of; a visitor outside it gets NOT_AUTHORIZED and nothing is
     * saved.
     * <p>Limits: any member may invite, not only admins: the client also shows "Invite user" to the organization's developers
     * (the all-members page, client pages/setting/permission/orgUsersPermission.tsx, inside settings that admins and
     * developers reach), so an admin-only rule needs a client change first.
     */
    @Override
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
                    return orgMemberService.getOrgMember(orgId, user.getId())
                            .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                            .then(Mono.defer(() -> invitationService.create(invitation)))
                            .flatMap(i -> Mono.just(InvitationVO.from(i, user, org)));
                });
    }

}

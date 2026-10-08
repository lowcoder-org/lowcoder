package org.lowcoder.api.usermanagement;


import static org.lowcoder.sdk.constants.Authentication.isAnonymousUser;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.exception.BizError.INVITED_USER_NOT_LOGIN;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.domain.user.service.EmailCommunicationService;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
public class InvitationController implements InvitationEndpoints
{

    /** The request field named by the INVALID_PARAMETER answer of {@link #sendInvitationEmails}. */
    static final String EMAILS_PARAMETER = "emails";

    @Autowired
    private InvitationApiService invitationApiService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private EmailCommunicationService emailCommunicationService;

    @Autowired
    private CommonConfig config;

    @Override
    public Mono<ResponseView<InvitationVO>> create(@RequestParam String orgId) {
        return invitationApiService.create(orgId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<InvitationVO>> get(@PathVariable String invitationId) {
        return invitationApiService.getInvitationView(invitationId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<?>> inviteUser(@PathVariable String invitationId) {
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> {
                            if (isAnonymousUser(visitorId)) {
                                return invitationApiService.getInvitationView(invitationId)
                                        .map(invitationVO -> ResponseView.error(INVITED_USER_NOT_LOGIN.getBizErrorCode(), "", invitationVO));
                            }
                            return invitationApiService.inviteUser(invitationId)
                                    .map(ResponseView::success);
                        }
                );
    }

    /**
     * Creates an invitation to the request's organization and mails its link to the request's addresses. A request
     * without addresses, or with a blank one, is INVALID_PARAMETER "emails" and creates no invitation (BF-139: an empty
     * array stored an invitation, mailed it to nobody and answered true).
     * <p>Limits: an address is only checked for being blank here; one the mail server rejects still makes the answer false
     * after the invitation is stored.
     */
    @Override
    public Mono<ResponseView<Boolean>> sendInvitationEmails(InviteEmailRequest req) {
        if (ArrayUtils.isEmpty(req.emails()) || StringUtils.isAnyBlank(req.emails())) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", EMAILS_PARAMETER);
        }
        return invitationApiService.create(req.orgId()).map(invitation -> 
                emailCommunicationService.sendInvitationEmails(req.emails(), 
                config.getLowcoderPublicUrl() + "/invite/" + invitation.getInviteCode(), 
                    "You have been invited to join our platform. Click here to accept the invitation: %s"))
            .map(ResponseView::success);
    }

}

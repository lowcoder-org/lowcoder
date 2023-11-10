package org.lowcoder.api.usermanagement;


import static org.lowcoder.sdk.constants.Authentication.isAnonymousUser;
import static org.lowcoder.sdk.exception.BizError.INVITED_USER_NOT_LOGIN;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
public class InvitationController implements InvitationEndpoints
{

    @Autowired
    private InvitationApiService invitationApiService;

    @Autowired
    private SessionUserService sessionUserService;

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

}

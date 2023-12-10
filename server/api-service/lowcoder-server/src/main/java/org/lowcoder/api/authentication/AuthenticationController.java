package org.lowcoder.api.authentication;

import java.util.List;

import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.UserController;
import org.lowcoder.api.usermanagement.UserEndpoints.UpdatePasswordRequest;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class AuthenticationController implements AuthenticationEndpoints 
{

    private final AuthenticationApiService authenticationApiService;
    private final SessionUserService sessionUserService;
    private final CookieHelper cookieHelper;
    private final BusinessEventPublisher businessEventPublisher;

    /**
     * login by email or phone with password; or register by email for now.
     *
     * @see UserController#updatePassword(UpdatePasswordRequest)
     */
    @Override
    public Mono<ResponseView<Boolean>> formLogin(@RequestBody FormLoginRequest formLoginRequest,
                                                 @RequestParam(required = false) String invitationId,
                                                 @RequestParam(required = false) String orgId,
                                                 ServerWebExchange exchange) {
        return authenticationApiService.authenticateByForm(formLoginRequest.loginId(), formLoginRequest.password(),
                        formLoginRequest.source(), formLoginRequest.register(), formLoginRequest.authId(), orgId)
                .flatMap(user -> authenticationApiService.loginOrRegister(user, exchange, invitationId, Boolean.FALSE))
                .thenReturn(ResponseView.success(true));
    }

    /**
     * third party login api
     */
    @Override
    public Mono<ResponseView<Boolean>> loginWithThirdParty(
            @RequestParam(required = false) String authId,
            @RequestParam(required = false) String source,
            @RequestParam String code,
            @RequestParam(required = false) String invitationId,
            @RequestParam String redirectUrl,
            @RequestParam String orgId,
            ServerWebExchange exchange) {
        return authenticationApiService.authenticateByOauth2(authId, source, code, redirectUrl, orgId)
                .flatMap(authUser -> authenticationApiService.loginOrRegister(authUser, exchange, invitationId, Boolean.FALSE))
                .thenReturn(ResponseView.success(true));
    }

    @Override
    public Mono<ResponseView<Boolean>> linkAccountWithThirdParty(
            @RequestParam(required = false) String authId,
            @RequestParam(required = false) String source,
            @RequestParam String code,
            @RequestParam String redirectUrl,
            @RequestParam String orgId,
            ServerWebExchange exchange) {
        return authenticationApiService.authenticateByOauth2(authId, source, code, redirectUrl, orgId)
                .flatMap(authUser -> authenticationApiService.loginOrRegister(authUser, exchange, null, Boolean.TRUE))
                .thenReturn(ResponseView.success(true));
    }

    @Override
    public Mono<ResponseView<Boolean>> logout(ServerWebExchange exchange) {
        String cookieToken = cookieHelper.getCookieToken(exchange);
        return sessionUserService.removeUserSession(cookieToken)
                .then(businessEventPublisher.publishUserLogoutEvent())
                .thenReturn(ResponseView.success(true));
    }

    @Override
    public Mono<ResponseView<Void>> enableAuthConfig(@RequestBody AuthConfigRequest authConfigRequest) {
        return authenticationApiService.enableAuthConfig(authConfigRequest)
                .thenReturn(ResponseView.success(null));
    }

    @Override
    public Mono<ResponseView<Void>> disableAuthConfig(@PathVariable("id") String id, @RequestParam(required = false) boolean delete) {
        return authenticationApiService.disableAuthConfig(id, delete)
                .thenReturn(ResponseView.success(null));
    }

    @Override
    public Mono<ResponseView<List<AbstractAuthConfig>>> getAllConfigs() {
        return authenticationApiService.findAuthConfigs(false)
                .map(FindAuthConfig::authConfig)
                .collectList()
                .map(ResponseView::success);
    }

    // ----------- API Key Management ----------------
    @Override
    public Mono<ResponseView<APIKeyVO>> createAPIKey(@RequestBody APIKeyRequest apiKeyRequest) {
        return authenticationApiService.createAPIKey(apiKeyRequest)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> deleteAPIKey(@PathVariable("id") String id) {
        return authenticationApiService.deleteAPIKey(id)
                .thenReturn(ResponseView.success(null));
    }

    @Override
    public Mono<ResponseView<List<APIKey>>> getAllAPIKeys() {
        return authenticationApiService.findAPIKeys()
                .collectList()
                .map(ResponseView::success);
    }

}

package org.lowcoder.api.authentication;

import java.util.List;

import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.UserController;
import org.lowcoder.api.usermanagement.UserController.UpdatePasswordRequest;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.SerializeConfig.JsonViews;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.annotation.JsonView;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {NewUrl.CUSTOM_AUTH})
public class AuthenticationController {

    @Autowired
    private AuthenticationApiService authenticationApiService;
    @Autowired
    private SessionUserService sessionUserService;
    @Autowired
    private CookieHelper cookieHelper;
    @Autowired
    private BusinessEventPublisher businessEventPublisher;

    /**
     * login by email or phone with password; or register by email for now.
     *
     * @see UserController#updatePassword(UpdatePasswordRequest)
     */
    @PostMapping("/form/login")
    public Mono<ResponseView<Boolean>> formLogin(@RequestBody FormLoginRequest formLoginRequest,
            @RequestParam(required = false) String invitationId,
            ServerWebExchange exchange) {
        return authenticationApiService.authenticateByForm(formLoginRequest.loginId(), formLoginRequest.password(),
                        formLoginRequest.source(), formLoginRequest.register(), formLoginRequest.authId())
                .flatMap(user -> authenticationApiService.loginOrRegister(user, exchange, invitationId))
                .thenReturn(ResponseView.success(true));
    }

    /**
     * third party login api
     */
    @PostMapping("/tp/login")
    public Mono<ResponseView<Boolean>> loginWithThirdParty(
            @RequestParam(required = false) String authId,
            @RequestParam(required = false) String source,
            @RequestParam String code,
            @RequestParam(required = false) String invitationId,
            @RequestParam String redirectUrl,
            @RequestParam String orgId,
            ServerWebExchange exchange) {
        return authenticationApiService.authenticateByOauth2(authId, source, code, redirectUrl, orgId)
                .flatMap(authUser -> authenticationApiService.loginOrRegister(authUser, exchange, invitationId))
                .thenReturn(ResponseView.success(true));
    }

    @PostMapping("/logout")
    public Mono<ResponseView<Boolean>> logout(ServerWebExchange exchange) {
        String cookieToken = cookieHelper.getCookieToken(exchange);
        return sessionUserService.removeUserSession(cookieToken)
                .then(businessEventPublisher.publishUserLogoutEvent())
                .thenReturn(ResponseView.success(true));
    }

    @PostMapping("/config")
    public Mono<ResponseView<Void>> enableAuthConfig(@RequestBody AuthConfigRequest authConfigRequest) {
        return authenticationApiService.enableAuthConfig(authConfigRequest)
                .thenReturn(ResponseView.success(null));
    }

    @DeleteMapping("/config/{id}")
    public Mono<ResponseView<Void>> disableAuthConfig(@PathVariable("id") String id, @RequestParam(required = false) boolean delete) {
        return authenticationApiService.disableAuthConfig(id, delete)
                .thenReturn(ResponseView.success(null));
    }

    @JsonView(JsonViews.Internal.class)
    @GetMapping("/configs")
    public Mono<ResponseView<List<AbstractAuthConfig>>> getAllConfigs() {
        return authenticationApiService.findAuthConfigs(false)
                .map(FindAuthConfig::authConfig)
                .collectList()
                .map(ResponseView::success);
    }

    // ----------- API Key Management ----------------
    @PostMapping("/api-key")
    public Mono<ResponseView<APIKeyVO>> createAPIKey(@RequestBody APIKeyRequest apiKeyRequest) {
        return authenticationApiService.createAPIKey(apiKeyRequest)
                .map(ResponseView::success);
    }

    @DeleteMapping("/api-key/{id}")
    public Mono<ResponseView<Void>> deleteAPIKey(@PathVariable("id") String id) {
        return authenticationApiService.deleteAPIKey(id)
                .thenReturn(ResponseView.success(null));
    }

    @GetMapping("/api-keys")
    public Mono<ResponseView<List<APIKey>>> getAllAPIKeys() {
        return authenticationApiService.findAPIKeys()
                .collectList()
                .map(ResponseView::success);
    }

    /**
     * @param loginId phone number or email for now.
     * @param register register or login
     * @param source {@link AuthSourceConstants#PHONE} or {@link AuthSourceConstants#EMAIL}
     */
    public record FormLoginRequest(String loginId, String password, boolean register, String source, String authId) {
    }
}

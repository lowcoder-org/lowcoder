package org.lowcoder.api.authentication.service;

import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.user.model.AuthUser;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AuthenticationApiService {

    Mono<AuthUser> authenticateByForm(String loginId, String password, String source, boolean register, String authId);

    Mono<AuthUser> authenticateByOauth2(String authId, String source, String code, String redirectUrl, String orgId);

    Mono<Void> loginOrRegister(AuthUser authUser, ServerWebExchange exchange, String invitationId);

    Mono<Boolean> enableAuthConfig(AuthConfigRequest authConfigRequest);

    Mono<Boolean> disableAuthConfig(String authId, boolean delete);

    Flux<FindAuthConfig> findAuthConfigs(boolean enableOnly);
}

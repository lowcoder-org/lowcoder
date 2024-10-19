package org.lowcoder.api.authentication.service;

import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.model.AuthUser;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AuthenticationApiService {

    Mono<AuthUser> authenticateByForm(String loginId, String password, String source, boolean register, String authId, String orgId);

    Mono<AuthUser> authenticateByOauth2(String authId, String source, String code, String redirectUrl, String orgId);

    Mono<Void> loginOrRegister(AuthUser authUser, ServerWebExchange exchange, String invitationId, boolean linKExistingUser);

    Mono<Boolean> enableAuthConfig(AuthConfigRequest authConfigRequest);

    Mono<Boolean> disableAuthConfig(String authId, boolean delete);

    Flux<FindAuthConfig> findAuthConfigs(boolean enableOnly);

    Mono<APIKeyVO> createAPIKey(APIKeyRequest apiKeyRequest);

    Mono<Void> deleteAPIKey(String authId);

    Flux<APIKey> findAPIKeys();
}

package org.lowcoder.domain.authentication;

import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AuthenticationService {

    EmailAuthConfig DEFAULT_AUTH_CONFIG = new EmailAuthConfig(AuthSourceConstants.EMAIL, true, true);

    Mono<FindAuthConfig> findAuthConfigByAuthId(String orgId, String authId);

    Mono<FindAuthConfig> findAuthConfigBySource(String orgId, String source);

    Flux<FindAuthConfig> findAllAuthConfigs(String orgId, boolean enableOnly);
}

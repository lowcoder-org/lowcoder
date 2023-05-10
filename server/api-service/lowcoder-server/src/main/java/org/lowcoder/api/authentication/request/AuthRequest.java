package org.lowcoder.api.authentication.request;

import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;

import reactor.core.publisher.Mono;

/**
 * @see AuthRequestFactory
 */
public interface AuthRequest {

    Mono<AuthUser> auth(AuthRequestContext authRequestContext);

    default Mono<AuthToken> refresh(String refreshToken) {
        return Mono.error(new UnsupportedOperationException());
    }
}

package org.lowcoder.api.authentication.request;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.AUTH_REQUEST_THREAD_POOL;

import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.AuthUser;

import reactor.core.publisher.Mono;

public abstract class AbstractBlockedAuthRequest implements AuthRequest {

    @Override
    public final Mono<AuthUser> auth(AuthRequestContext authRequestContext) {
        return Mono.fromSupplier(() -> authSync(authRequestContext))
                .subscribeOn(AUTH_REQUEST_THREAD_POOL);
    }

    protected abstract AuthUser authSync(AuthRequestContext authRequestContext);
}

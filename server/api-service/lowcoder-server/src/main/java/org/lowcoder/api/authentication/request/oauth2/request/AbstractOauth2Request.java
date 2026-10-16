package org.lowcoder.api.authentication.request.oauth2.request;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.AUTH_REQUEST_THREAD_POOL;
import static org.lowcoder.sdk.exception.BizError.FAIL_TO_GET_OIDC_INFO;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.request.oauth2.Oauth2Source;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
public abstract class AbstractOauth2Request<T extends Oauth2SimpleAuthConfig> implements AuthRequest {

    protected T config;
    protected Oauth2Source source;

    public AbstractOauth2Request(T config, Oauth2Source source) {
        this.config = config;
        this.source = source;
    }

    public Mono<AuthUser> auth(AuthRequestContext authRequestContext) {
        return getAuthToken((OAuth2RequestContext) authRequestContext)
                .flatMap(authToken -> getAuthUser(authToken).flatMap(authUser -> requireUid(authUser, NO_USER_ID)).doOnNext(authUser -> authUser.setAuthToken(authToken)))
                .onErrorResume(throwable -> {
                    log.error("get oidc failed: {}", toJson(authRequestContext), throwable);
                    return deferredError(FAIL_TO_GET_OIDC_INFO, "FAIL_TO_GET_OIDC_INFO", throwable.getMessage());
                })
                .subscribeOn(AUTH_REQUEST_THREAD_POOL);
    }

    public Mono<AuthUser> refresh(String refreshToken) {
        return refreshAuthToken(refreshToken)
                .flatMap(authToken -> getAuthUser(authToken).flatMap(authUser -> requireUid(authUser, NO_USER_ID)).doOnNext(authUser -> authUser.setAuthToken(authToken)))
                .onErrorResume(throwable -> {
                    log.error("failed to refresh token: ", throwable);
                    return deferredError(FAIL_TO_GET_OIDC_INFO, "FAIL_TO_GET_OIDC_INFO", throwable.getMessage());
                })
                .subscribeOn(AUTH_REQUEST_THREAD_POOL);
    }

    protected abstract Mono<AuthToken> getAuthToken(OAuth2RequestContext context);

    protected abstract Mono<AuthToken> refreshAuthToken(String refreshToken);

    protected abstract Mono<AuthUser> getAuthUser(AuthToken authToken);

    static final String NO_USER_ID = "The identity provider's user information has no user id";

    /**
     * The user, or an {@link AuthException} with {@code reason} when its uid is null or blank (NEW-27). {@link #auth} and
     * {@link #refresh} apply it to every user {@code getAuthUser} answers, so a login is never looked up or stored with a
     * null uid, which would find the account an earlier login without a uid left behind; {@code GenericAuthRequest}
     * applies it with its own message as well.
     * <p>
     * Limits: only a null or blank uid is refused, as sent (nothing is trimmed or normalized); an answer with no user at
     * all passes, since the check never runs on an empty {@code Mono}; a subclass that overrides {@code auth} or
     * {@code refresh} bypasses it, while one that inherits them now refuses a blank uid it passed on before.
     */
    protected static Mono<AuthUser> requireUid(AuthUser authUser, String reason) {
        if (StringUtils.isBlank(authUser.getUid())) {
            return Mono.error(new AuthException(reason));
        }
        return Mono.just(authUser);
    }
}

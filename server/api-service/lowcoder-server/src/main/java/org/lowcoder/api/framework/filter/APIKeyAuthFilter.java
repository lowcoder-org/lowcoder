package org.lowcoder.api.framework.filter;

import io.jsonwebtoken.Claims;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.toAuthentication;
import static org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication;

@Slf4j
public class APIKeyAuthFilter implements WebFilter {

    private final SessionUserService service;
    private final CookieHelper cookieHelper;
    private final JWTUtils jwtUtils;

    public APIKeyAuthFilter(SessionUserService service, CookieHelper cookieHelper, JWTUtils jwtUtils) {
        this.service = service;
        this.cookieHelper = cookieHelper;
        this.jwtUtils = jwtUtils;
    }

    @Nonnull
    @Override
    public Mono<Void> filter(@Nonnull ServerWebExchange exchange, WebFilterChain chain) {
        String jwtToken = jwtUtils.resolveToken(exchange);
        if (StringUtils.isEmpty(jwtToken)) {
            // no API key presented, nothing for this filter to do
            return chain.filter(exchange);
        }

        String cookieToken = cookieHelper.getCookieToken(exchange);
        if (StringUtils.isBlank(cookieToken)) {
            return authenticateWithJwt(jwtToken, exchange, chain);
        }

        // the session cookie keeps precedence, but only while it still resolves to a live session; a stale cookie
        // left behind by a logout must not permanently mask the API key
        return service.tokenExist(cookieToken)
                .defaultIfEmpty(false)
                .flatMap(sessionAlive -> Boolean.TRUE.equals(sessionAlive)
                        ? chain.filter(exchange)
                        : authenticateWithJwt(jwtToken, exchange, chain));
    }

    private Mono<Void> authenticateWithJwt(String jwtToken, ServerWebExchange exchange, WebFilterChain chain) {
        Claims claims = jwtUtils.parseJwtClaims(jwtToken);
        if (claims == null) {
            return chain.filter(exchange);
        }
        // resolveSessionUserForJWT reads the claims eagerly, so defer it to turn any failure into an error signal;
        // switchIfEmpty keeps an unknown API key falling through to anonymous instead of completing with an empty body
        return Mono.defer(() -> service.resolveSessionUserForJWT(claims, jwtToken))
                .switchIfEmpty(Mono.<User> defer(() -> chain.filter(exchange).then(Mono.empty())))
                .flatMap(user -> chain.filter(exchange).contextWrite(withAuthentication(toAuthentication(user))));
    }
}

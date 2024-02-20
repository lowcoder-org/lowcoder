package org.lowcoder.api.framework.filter;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.annotation.Nonnull;

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
        String cookieToken = cookieHelper.getCookieToken(exchange);
        if(cookieToken.isEmpty()) {
            String jwtToken = jwtUtils.resolveToken(exchange);
            if(jwtToken == null || jwtToken.isEmpty()) {
                return chain.filter(exchange);
            } else {
                Claims claims = jwtUtils.parseJwtClaims(jwtToken);
                if(claims == null) {
                    return chain.filter(exchange);
                } else {
                    return service.resolveSessionUserForJWT(claims, jwtToken)
                            .flatMap(user -> chain.filter(exchange).contextWrite(withAuthentication(toAuthentication(user))));
                }

            }
        } else {
            return chain.filter(exchange);
        }
    }
}

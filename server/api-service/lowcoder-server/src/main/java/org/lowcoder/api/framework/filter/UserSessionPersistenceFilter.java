package org.lowcoder.api.framework.filter;

import lombok.extern.slf4j.Slf4j;
import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.annotation.Nonnull;
import java.time.Instant;
import java.util.LinkedList;
import java.util.List;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.toAuthentication;
import static org.lowcoder.domain.authentication.AuthenticationService.DEFAULT_AUTH_CONFIG;
import static org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication;

@Slf4j
public class UserSessionPersistenceFilter implements WebFilter {

    private final SessionUserService service;
    private final CookieHelper cookieHelper;

    private final AuthenticationService authenticationService;

    private final AuthenticationApiServiceImpl authenticationApiService;

    private final AuthRequestFactory<AuthRequestContext> authRequestFactory;

    public UserSessionPersistenceFilter(SessionUserService service, CookieHelper cookieHelper, AuthenticationService authenticationService,
                                        AuthenticationApiServiceImpl authenticationApiService, AuthRequestFactory<AuthRequestContext> authRequestFactory) {
        this.service = service;
        this.cookieHelper = cookieHelper;
        this.authenticationService = authenticationService;
        this.authenticationApiService = authenticationApiService;
        this.authRequestFactory = authRequestFactory;
    }

    @Nonnull
    @Override
    public Mono<Void> filter(@Nonnull ServerWebExchange exchange, WebFilterChain chain) {
        String cookieToken = cookieHelper.getCookieToken(exchange);
        return service.resolveSessionUserFromCookie(cookieToken)
                .switchIfEmpty(chain.filter(exchange).then(Mono.empty()))
                .doOnNext(user -> {

                    List<String> tokensToRemove = new LinkedList<>();

                    user.getConnections().forEach(connection -> {
                        if(!connection.getAuthId().equals(DEFAULT_AUTH_CONFIG.getId())) {
                            Instant next5Minutes = Instant.now().plusSeconds( 300 );
                            boolean isAccessTokenExpiryNear = (connection.getAuthConnectionAuthToken().getExpireAt()*1000) <= next5Minutes.toEpochMilli();
                            if(isAccessTokenExpiryNear) {
                                connection.getOrgIds().forEach(orgId -> {
                                    FindAuthConfig findAuthConfig = authenticationService.findAuthConfigByAuthId(orgId, connection.getAuthId()).block();
                                    if(findAuthConfig == null) {
                                        return;
                                    }
                                    OAuth2RequestContext oAuth2RequestContext = new OAuth2RequestContext(orgId, null, null);
                                    oAuth2RequestContext.setAuthConfig(findAuthConfig.authConfig());
                                    AuthRequest authRequest = authRequestFactory.build(oAuth2RequestContext).block();
                                    try {
                                        AuthUser authUser = authRequest.refresh(connection.getAuthConnectionAuthToken().getRefreshToken()).block();
                                        authUser.setAuthContext(oAuth2RequestContext);
                                        authenticationApiService.updateConnection(authUser, user);
                                    } catch (Exception e) {
                                        log.error("Failed to refresh access token. Removing user sessions/tokens.");
                                        tokensToRemove.addAll(connection.getTokens());
                                    }
                                });

                            }
                        }
                    });

                    tokensToRemove.forEach(token -> {
                        service.removeUserSession(token).block();
                    });

                })
                .flatMap(user -> chain.filter(exchange).contextWrite(withAuthentication(toAuthentication(user)))
                        .then(service.extendValidity(cookieToken))
                );
    }
}

package org.lowcoder.api.framework.filter;

import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang3.tuple.Triple;
import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.toAuthentication;
import static org.lowcoder.domain.authentication.AuthenticationService.DEFAULT_AUTH_CONFIG;
import static org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication;

@Slf4j
public class UserSessionPersistenceFilter implements WebFilter {

    private final SessionUserService service;

    private final UserService userService;
    private final CookieHelper cookieHelper;

    private final AuthenticationService authenticationService;

    private final AuthenticationApiServiceImpl authenticationApiService;

    private final AuthRequestFactory<AuthRequestContext> authRequestFactory;

    public UserSessionPersistenceFilter(SessionUserService service, UserService userService, CookieHelper cookieHelper, AuthenticationService authenticationService,
                                        AuthenticationApiServiceImpl authenticationApiService, AuthRequestFactory<AuthRequestContext> authRequestFactory) {
        this.service = service;
        this.userService = userService;
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
                .map(user -> {

                    Connection activeConnection = null;
                    List<String> orgIds = List.of();

                    Optional<Connection> activeConnectionOptional = user.getConnections()
                            .stream()
                            .filter(connection -> connection.getAuthId().equals(user.getActiveAuthId()))
                            .findFirst();

                    if(!activeConnectionOptional.isPresent()) {
                        return Triple.of(user, activeConnection, orgIds);
                    }

                    activeConnection = activeConnectionOptional.get();

                    if(!activeConnection.getAuthId().equals(DEFAULT_AUTH_CONFIG.getId())) {
                        if(activeConnection.getAuthConnectionAuthToken().getExpireAt() == 0) {
                            return Triple.of(user, activeConnection, orgIds);
                        }
                        boolean isAccessTokenExpired = (activeConnection.getAuthConnectionAuthToken().getExpireAt()*1000) < Instant.now().toEpochMilli();
                        if(isAccessTokenExpired) {

                            List<String> activeOrgIds = activeConnection.getOrgIds().stream().toList();
                            if(!activeOrgIds.isEmpty()) {
                                return Triple.of(user, activeConnection, activeOrgIds);
                            }
                            orgIds = activeOrgIds;
                        }
                    }

                    return Triple.of(user, activeConnection, orgIds);

                }).flatMap(this::refreshOauthToken)
                .flatMap(user -> chain.filter(exchange).contextWrite(withAuthentication(toAuthentication(user)))
                        .then(service.extendValidity(cookieToken))
                );
    }

    private Mono<User> refreshOauthToken(Triple<User, Connection, List<String>> triple) {

        User user = triple.getLeft();
        Connection connection = triple.getMiddle();
        Collection<String> orgIds = triple.getRight();

        if (connection == null || orgIds == null || orgIds.isEmpty()) {
            return Mono.just(user);
        }

        return Flux.fromIterable(orgIds).flatMap(orgId -> {
            OAuth2RequestContext oAuth2RequestContext = new OAuth2RequestContext(orgId, null, null);

            log.info("Refreshing token for user: [ name: {}, id: {} ], orgIds: {}, activeConnection: [ authId: {}, name: {}, orgIds: ({})]",
                    user.getName(), user.getId(),
                    orgIds,
                    connection.getAuthId(), connection.getName(), StringUtils.join(connection.getOrgIds(), ", "));

            return authenticationService
                    .findAllAuthConfigs(orgId, true)
                    .filter(findAuthConfig -> findAuthConfig.authConfig().getId().equals(connection.getAuthId()))
                    .switchIfEmpty(Mono.empty())
                    .flatMap(findAuthConfig -> {

                        Mono<AuthRequest> authRequestMono = Mono.empty();

                        if (findAuthConfig == null) {
                            return authRequestMono;
                        }
                        oAuth2RequestContext.setAuthConfig(findAuthConfig.authConfig());

                        return authRequestFactory.build(oAuth2RequestContext);
                    })
                    .publishOn(Schedulers.boundedElastic()).flatMap(authRequest -> {
                        if (authRequest == null) {
                            return Mono.just(user);
                        }
                        try {
                            if (StringUtils.isEmpty(connection.getAuthConnectionAuthToken().getRefreshToken())) {
                                log.error("Refresh token is empty");
                                throw new Exception("Refresh token is empty");
                            }
                            AuthUser authUser = authRequest.refresh(connection.getAuthConnectionAuthToken().getRefreshToken()).block();
                            authUser.setAuthContext(oAuth2RequestContext);
                            authenticationApiService.updateConnection(authUser, user);
                            return userService.update(user.getId(), user);
                        } catch (Exception e) {
                            log.error("Failed to refresh access token. Removing user sessions/tokens.");
                            connection.getTokens().forEach(token -> {
                                service.removeUserSession(token).block();
                            });
                        }
                        return Mono.just(user);
                    });
        }).next();
    }

}

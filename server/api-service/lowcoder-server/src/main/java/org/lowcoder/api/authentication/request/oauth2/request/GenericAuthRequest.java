package org.lowcoder.api.authentication.request.oauth2.request;

import lombok.Setter;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.oauth2.GenericOAuthProviderSource;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.mapToAuthToken;
import static org.lowcoder.api.authentication.util.AuthenticationUtils.mapToAuthUser;
import static org.lowcoder.sdk.plugin.common.constant.Constants.HTTP_TIMEOUT;

/**
 * This class is for Generic Auth Request
 */
public class GenericAuthRequest  extends AbstractOauth2Request<Oauth2GenericAuthConfig>{

    public GenericAuthRequest(Oauth2GenericAuthConfig context) {
        super(context, new GenericOAuthProviderSource(context));
    }

    @Override
    protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
        return WebClientBuildHelper.builder()
                .systemProxy()
                .timeoutMs(HTTP_TIMEOUT)
                .build()
                .post()
                .uri(config.getTokenEndpoint())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("code", context.getCode())
                        .with("client_id", config.getClientId())
                        .with("client_secret", config.getClientSecret())
                        .with("grant_type", "authorization_code")
                        .with("redirect_uri", context.getRedirectUrl()))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    return Mono.just(mapToAuthToken(map));
                });
    }

    @Override
    protected Mono<AuthToken> refreshAuthToken(String refreshToken) {
        return WebClientBuildHelper.builder()
                .systemProxy()
                .timeoutMs(HTTP_TIMEOUT)
                .build()
                .post()
                .uri(config.getTokenEndpoint())
                .body(BodyInserters.fromFormData("grant_type", "refresh_token")
                        .with("refresh_token", refreshToken)
                        .with("client_id", config.getClientId())
                        .with("client_secret", config.getClientSecret()))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    return Mono.just(mapToAuthToken(map));
                });
    }

    @Override
    protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
        if(!Boolean.TRUE.equals(config.getUserInfoIntrospection())) return Mono.just(AuthUser.builder().build());
        return WebClientBuildHelper.builder()
                .systemProxy()
                .timeoutMs(HTTP_TIMEOUT)
                .build()
                .get()
                .uri(config.getUserInfoEndpoint())
                .headers(headers -> headers.setBearerAuth(authToken.getAccessToken()))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    return Mono.just(mapToAuthUser(map, config.getSourceMappings()));
                });
    }
}

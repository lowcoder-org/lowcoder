package org.lowcoder.api.authentication.request.oauth2.request;

import lombok.Setter;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.oauth2.GenericOAuthProviderSource;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.util.JwtDecoderUtil;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.*;
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
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    return Mono.just(mapToAuthToken(map, config.getSourceMappings()));
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
                    return Mono.just(mapToAuthToken(map, config.getSourceMappings()));
                });
    }

    @Override
    protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
        //parse the JWT token
        String jwt = authToken.getJwt();
        Map<String, Object> jwtMap = null;
        if(jwt != null) {
            try {
                jwtMap = JwtDecoderUtil.decodeJwtPayload(jwt);
            } catch (Exception ignored) {
            }
        }

        if(!Boolean.TRUE.equals(config.getUserInfoIntrospection())) {
            if(jwtMap == null) return Mono.error(new AuthException("No JWT token found"));
            return Mono.just(mapToAuthUser(jwtMap, config.getSourceMappings()));
        }

        Map<String, Object> finalJwtMap = jwtMap;
        return WebClientBuildHelper.builder()
                .systemProxy()
                .timeoutMs(HTTP_TIMEOUT)
                .build()
                .method(Boolean.TRUE.equals(config.getPostForUserEndpoint())? HttpMethod.POST: HttpMethod.GET)
                .uri(config.getUserInfoEndpoint())
                .headers(headers -> headers.setBearerAuth(authToken.getAccessToken()))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    AuthUser merged = mergeAuthUser(mapToAuthUser(finalJwtMap, config.getSourceMappings()), mapToAuthUser(map, config.getSourceMappings()));
                    return Mono.just(merged);
                });
    }
}

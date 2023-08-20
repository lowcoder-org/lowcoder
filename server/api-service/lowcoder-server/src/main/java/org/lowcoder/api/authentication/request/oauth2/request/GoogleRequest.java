package org.lowcoder.api.authentication.request.oauth2.request;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.apache.http.client.utils.URIBuilder;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.request.oauth2.Oauth2DefaultSource;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.core.ParameterizedTypeReference;

import reactor.core.publisher.Mono;

public class GoogleRequest extends AbstractOauth2Request<Oauth2SimpleAuthConfig> {

    public GoogleRequest(Oauth2SimpleAuthConfig config) {
        super(config, Oauth2DefaultSource.GOOGLE);
    }

    @Override
    protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
        URI uri;
        try {
            uri = new URIBuilder(source.accessToken())
                    .addParameter("code", context.getCode())
                    .addParameter("client_id", config.getClientId())
                    .addParameter("client_secret", config.getClientSecret())
                    .addParameter("grant_type", "authorization_code")
                    .addParameter("redirect_uri", context.getRedirectUrl())
                    .build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }

        return WebClientBuildHelper.builder()
                .systemProxy()
                .build()
                .post()
                .uri(uri)
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        throw new AuthException(JsonUtils.toJson(map));
                    }
                    AuthToken authToken = AuthToken.builder()
                            .accessToken(MapUtils.getString(map, "access_token"))
                            .expireIn(MapUtils.getIntValue(map, "expires_in"))
                            .refreshToken(MapUtils.getString(map, "refresh_token"))
                            .build();
                    return Mono.just(authToken);
                });
    }

    @Override
    protected Mono<AuthToken> refreshAuthToken(String refreshToken) {

        URI uri;
        try {
            uri = new URIBuilder(source.refresh())
                    .addParameter("refresh_token", refreshToken)
                    .addParameter("client_id", config.getClientId())
                    .addParameter("client_secret", config.getClientSecret())
                    .addParameter("grant_type", "refresh_token")
                    .build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }

        return WebClientBuildHelper.builder()
                .systemProxy()
                .build()
                .post()
                .uri(uri)
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        throw new AuthException(JsonUtils.toJson(map));
                    }
                    AuthToken authToken = AuthToken.builder()
                            .accessToken(MapUtils.getString(map, "access_token"))
                            .expireIn(MapUtils.getIntValue(map, "expires_in"))
                            .build();
                    return Mono.just(authToken);
                });

    }

    @Override
    protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
        return WebClientBuildHelper.builder()
                .systemProxy()
                .build()
                .post()
                .uri(source.userInfo())
                .header("Authorization", "Bearer " + authToken.getAccessToken())
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        throw new AuthException(JsonUtils.toJson(map));
                    }
                    AuthUser authUser = AuthUser.builder()
                            .uid(MapUtils.getString(map, "sub"))
                            .username(MapUtils.getString(map, "name"))
                            .avatar(MapUtils.getString(map, "picture"))
                            .rawUserInfo(map)
                            .build();
                    return Mono.just(authUser);
                });
    }
}

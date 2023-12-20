package org.lowcoder.api.authentication.request.oauth2.request;

import static org.springframework.web.reactive.function.BodyInserters.fromFormData;

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
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;

import reactor.core.publisher.Mono;

public class KeycloakRequest extends AbstractOauth2Request<Oauth2KeycloakAuthConfig> 
{

	public KeycloakRequest(Oauth2KeycloakAuthConfig config) 
	{
		super(config, Oauth2DefaultSource.KEYCLOAK);
	}

    @Override
    protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
        URI uri;
        try {
            uri = new URIBuilder(config.replaceAuthUrlClientIdPlaceholder(source.accessToken())).build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }

        return WebClientBuildHelper.builder()
                .systemProxy()
                .build()
                .post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(fromFormData("code", context.getCode())
                        .with("client_id", config.getClientId())
                        .with("client_secret", config.getClientSecret())
                        .with("grant_type", "authorization_code")
                        .with("redirect_uri", context.getRedirectUrl()))
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
            uri = new URIBuilder(config.replaceAuthUrlClientIdPlaceholder(source.refresh())).build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }

        return WebClientBuildHelper.builder()
                .systemProxy()
                .build()
                .post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(fromFormData("refresh_token", refreshToken)
                        .with("client_id", config.getClientId())
                        .with("client_secret", config.getClientSecret())
                        .with("grant_type", "refresh_token"))
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
                            .refreshTokenExpireIn(MapUtils.getIntValue(map, "refresh_expires_in"))
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
                .uri(config.replaceAuthUrlClientIdPlaceholder(source.userInfo()))
                .header("Authorization", "Bearer " + authToken.getAccessToken())
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (map.containsKey("error") || map.containsKey("error_description")) {
                        throw new AuthException(JsonUtils.toJson(map));
                    }
                    AuthUser authUser = AuthUser.builder()
                            .uid(MapUtils.getString(map, "sub"))
                            .username(MapUtils.getString(map, "email"))
                            .rawUserInfo(map)
                            .build();
                    return Mono.just(authUser);
                });
    }
}

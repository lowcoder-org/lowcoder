package org.lowcoder.api.authentication.request.oauth2;

import java.util.HashMap;
import java.util.Set;

import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.request.*;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.auth.constants.AuthTypeConstants.*;

@Component
public class Oauth2AuthRequestFactory implements AuthRequestFactory<OAuth2RequestContext> {

    @Override
    public Mono<AuthRequest> build(OAuth2RequestContext context) {
        return Mono.fromSupplier(() -> buildRequest(context));
    }

    private AbstractOauth2Request<? extends Oauth2SimpleAuthConfig> buildRequest(OAuth2RequestContext context) {
        return switch (context.getAuthConfig().getAuthType()) {
            case GITHUB -> {
                HashMap<String, String> sourceMappings = new HashMap<>();
                sourceMappings.put("uid", "id");
                sourceMappings.put("email", "email");
                sourceMappings.put("username", "login");
                sourceMappings.put("avatar", "avatar_url");
                Oauth2SimpleAuthConfig config = (Oauth2SimpleAuthConfig) context.getAuthConfig();
                yield new GenericAuthRequest(Oauth2GenericAuthConfig.builder()
                        .tokenEndpoint(Oauth2DefaultSource.GITHUB.accessToken())
                        .userInfoEndpoint(Oauth2DefaultSource.GITHUB.userInfo())
                        .userInfoIntrospection(true)
                        .source(config.getSource())
                        .sourceName(config.getSourceName())
                        .enableRegister(config.isEnableRegister())
                        .enable(config.isEnable())
                        .scope("read:email read:user")
                        .sourceMappings(sourceMappings)
                        .clientSecret(config.getClientSecret())
                        .clientId(config.getClientId())
                        .authType(GENERIC)
                        .build());
            }
            case GOOGLE -> {
                HashMap<String, String> sourceMappings = new HashMap<>();
                sourceMappings.put("uid", "sub");
                sourceMappings.put("email", "email");
                sourceMappings.put("username", "email");
                sourceMappings.put("avatar", "picture");
                Oauth2SimpleAuthConfig config = (Oauth2SimpleAuthConfig) context.getAuthConfig();
                yield new GenericAuthRequest(Oauth2GenericAuthConfig.builder()
                        .tokenEndpoint(Oauth2DefaultSource.GOOGLE.accessToken())
                        .userInfoEndpoint(Oauth2DefaultSource.GOOGLE.userInfo())
                        .userInfoIntrospection(true)
                        .source(config.getSource())
                        .sourceName(config.getSourceName())
                        .enableRegister(config.isEnableRegister())
                        .enable(config.isEnable())
                        .scope("openid email profile")
                        .userCanSelectAccounts(true)
                        .sourceMappings(sourceMappings)
                        .clientSecret(config.getClientSecret())
                        .clientId(config.getClientId())
                        .authType(GENERIC)
                        .build());
            }
            case ORY -> {
                HashMap<String, String> sourceMappings = new HashMap<>();
                sourceMappings.put("uid", "sub");
                sourceMappings.put("email", "email");
                sourceMappings.put("username", "email");
                sourceMappings.put("avatar", "picture");
                Oauth2OryAuthConfig config = (Oauth2OryAuthConfig) context.getAuthConfig();
                yield new GenericAuthRequest(Oauth2GenericAuthConfig.builder()
                        .tokenEndpoint(config.replaceAuthUrlClientIdPlaceholder(Oauth2DefaultSource.ORY.accessToken()))
                        .userInfoEndpoint(config.replaceAuthUrlClientIdPlaceholder(Oauth2DefaultSource.ORY.userInfo()))
                        .userInfoIntrospection(true)
                        .source(config.getSource())
                        .sourceName(config.getSourceName())
                        .enableRegister(config.isEnableRegister())
                        .enable(config.isEnable())
                        .scope(config.getScope())
                        .userCanSelectAccounts(false)
                        .sourceMappings(sourceMappings)
                        .clientSecret(config.getClientSecret())
                        .clientId(config.getClientId())
                        .authType(GENERIC)
                        .build());
            }
            case KEYCLOAK -> {
                HashMap<String, String> sourceMappings = new HashMap<>();
                sourceMappings.put("uid", "sub");
                sourceMappings.put("email", "email");
                sourceMappings.put("username", "email");
                sourceMappings.put("avatar", "false");
                Oauth2KeycloakAuthConfig config = (Oauth2KeycloakAuthConfig) context.getAuthConfig();
                yield new GenericAuthRequest(Oauth2GenericAuthConfig.builder()
                        .tokenEndpoint(config.replaceAuthUrlClientIdPlaceholder(Oauth2DefaultSource.KEYCLOAK.accessToken()))
                        .userInfoEndpoint(config.replaceAuthUrlClientIdPlaceholder(Oauth2DefaultSource.KEYCLOAK.userInfo()))
                        .userInfoIntrospection(true)
                        .source(config.getSource())
                        .sourceName(config.getSourceName())
                        .enableRegister(config.isEnableRegister())
                        .enable(config.isEnable())
                        .scope(config.getScope())
                        .userCanSelectAccounts(false)
                        .sourceMappings(sourceMappings)
                        .clientSecret(config.getClientSecret())
                        .clientId(config.getClientId())
                        .authType(GENERIC)
                        .build());
            }
            case GENERIC -> new GenericAuthRequest((Oauth2GenericAuthConfig) context.getAuthConfig());
            default -> throw new UnsupportedOperationException(context.getAuthConfig().getAuthType());
        };
    }

    @Override
    public Set<String> supportedAuthTypes() {
        return Set.of(
                GITHUB,
                GOOGLE,
                ORY,
                KEYCLOAK,
                GENERIC);
    }
}

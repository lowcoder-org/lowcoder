package org.lowcoder.api.authentication.service.factory;

import static java.util.Objects.requireNonNull;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GITHUB;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GITHUB_NAME;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GOOGLE;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GOOGLE_NAME;

import java.util.Set;

import org.apache.commons.collections4.MapUtils;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.*;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.stereotype.Component;

@Component
public class AuthConfigFactoryImpl implements AuthConfigFactory {

    @Override
    public AbstractAuthConfig build(AuthConfigRequest authConfigRequest, boolean enable) {
        return switch (authConfigRequest.getAuthType()) {
            case AuthTypeConstants.FORM -> buildEmailAuthConfig(authConfigRequest, enable);
            case AuthTypeConstants.GITHUB -> buildOauth2SimpleAuthConfig(GITHUB, GITHUB_NAME, authConfigRequest, enable);
            case AuthTypeConstants.GOOGLE -> buildOauth2SimpleAuthConfig(GOOGLE, GOOGLE_NAME, authConfigRequest, enable);
            case AuthTypeConstants.ORY -> buildOauth2OryAuthConfig(authConfigRequest, enable);
            case AuthTypeConstants.KEYCLOAK -> buildOauth2KeycloakAuthConfig(authConfigRequest, enable);
            case AuthTypeConstants.GENERIC -> buildOauth2GenericAuthConfig(authConfigRequest, enable);
            default -> throw new UnsupportedOperationException(authConfigRequest.getAuthType());
        };
    }

    @Override
    public Set<String> supportAuthTypes() {
        return Set.of(
                AuthTypeConstants.FORM,
                AuthTypeConstants.GITHUB,
                AuthTypeConstants.GOOGLE,
                AuthTypeConstants.ORY,
                AuthTypeConstants.KEYCLOAK,
                AuthTypeConstants.GENERIC
        );
    }

    private EmailAuthConfig buildEmailAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        Boolean enableRegister = MapUtils.getBoolean(authConfigRequest, "enableRegister");
        return new EmailAuthConfig(authConfigRequest.getId(), enable, enableRegister);
    }

    private Oauth2SimpleAuthConfig buildOauth2SimpleAuthConfig(String source, String sourceName, AuthConfigRequest authConfigRequest,
            boolean enable) {
        return Oauth2SimpleAuthConfig.builder()
                .id(authConfigRequest.getId())
                .enable(enable)
                .enableRegister(authConfigRequest.isEnableRegister())
                .source(source)
                .sourceName(sourceName)
                .clientId(requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."))
                .clientSecret(authConfigRequest.getClientSecret())
                .authType(authConfigRequest.getAuthType())
                .build();
    }

    private Oauth2SimpleAuthConfig buildOauth2OryAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        return Oauth2OryAuthConfig.builder()
                .id(authConfigRequest.getId())
                .enable(enable)
                .enableRegister(authConfigRequest.isEnableRegister())
                .source(AuthTypeConstants.ORY)
                .sourceName(org.lowcoder.sdk.constants.AuthSourceConstants.ORY_NAME)
                .clientId(requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."))
                .clientSecret(authConfigRequest.getClientSecret())
                .baseUrl(authConfigRequest.getString("baseUrl"))
                .scope(authConfigRequest.getString("scope"))
                .authType(authConfigRequest.getAuthType())
                .build();
    }
    
    private Oauth2SimpleAuthConfig buildOauth2KeycloakAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        return Oauth2KeycloakAuthConfig.builder()
                .id(authConfigRequest.getId())
                .enable(enable)
                .enableRegister(authConfigRequest.isEnableRegister())
                .source(AuthTypeConstants.KEYCLOAK)
                .sourceName(org.lowcoder.sdk.constants.AuthSourceConstants.KEYCLOAK_NAME)
                .clientId(requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."))
                .clientSecret(authConfigRequest.getClientSecret())
                .baseUrl(authConfigRequest.getString("baseUrl"))
                .realm(authConfigRequest.getString("realm"))
                .scope(authConfigRequest.getString("scope"))
                .authType(authConfigRequest.getAuthType())
                .build();
    }

    /**
     * This method is to build Oauth2GenericAuth config
     * @param authConfigRequest AuthConfigRequest
     * @param enable boolean
     * @return Oauth2SimpleAuthConfig
     */
    private Oauth2SimpleAuthConfig buildOauth2GenericAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        return Oauth2GenericAuthConfig.builder()
                .id(authConfigRequest.getId())
                .enable(enable)
                .enableRegister(authConfigRequest.isEnableRegister())
                .source(authConfigRequest.getSource(AuthTypeConstants.GENERIC))
                .sourceName(authConfigRequest.getSourceName(AuthTypeConstants.GENERIC))
                .sourceDescription(authConfigRequest.getSourceDescription())
                .sourceIcon(authConfigRequest.getSourceIcon())
                .sourceCategory(authConfigRequest.getSourceCategory())
                .sourceMappings(authConfigRequest.getSourceMappings())
                .clientId(requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."))
                .clientSecret(authConfigRequest.getClientSecret())
                .issuerUri(authConfigRequest.getIssuerUri())
                .authorizationEndpoint(authConfigRequest.getAuthorizationEndpoint())
                .tokenEndpoint(authConfigRequest.getTokenEndpoint())
                .userInfoEndpoint(authConfigRequest.getUserInfoEndpoint())
                .scope(authConfigRequest.getScope())
                .authType(AuthTypeConstants.GENERIC)
                .userInfoIntrospection(MapUtils.getBoolean(authConfigRequest,"userInfoIntrospection", false))
                .build();
    }
}

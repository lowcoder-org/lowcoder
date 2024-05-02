package org.lowcoder.api.authentication.request.oauth2;

import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;

/**
 * This class is the implementation of Oauth2Source and uses an instance of GenericOAuthProviderConfig
 * to return the appropriate URLs
 */
public class GenericOAuthProviderSource implements Oauth2Source {

    private final Oauth2GenericAuthConfig config;

    public GenericOAuthProviderSource(Oauth2GenericAuthConfig config) {
        this.config = config;
    }

    @Override
    public String accessToken() {
        return config.getTokenEndpoint();
    }

    @Override
    public String userInfo() {
        return config.getUserInfoEndpoint();
    }

    @Override
    public String refresh() {
        return config.getTokenEndpoint();
    }
}
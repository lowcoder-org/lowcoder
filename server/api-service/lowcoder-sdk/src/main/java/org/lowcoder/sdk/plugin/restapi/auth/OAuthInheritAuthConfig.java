package org.lowcoder.sdk.plugin.restapi.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;

import javax.annotation.Nullable;

/**
 * oauth(inherit from login) auth config
 */
@Getter
public final class OAuthInheritAuthConfig extends AuthConfig {

    private String authId;

    @JsonCreator
    public OAuthInheritAuthConfig(String authId, RestApiAuthType type) {
        super(type);
        this.authId = authId;
    }

    @Override
    public AuthConfig mergeWithUpdatedConfig(@Nullable AuthConfig updatedConfig) {
        // return new auth config if auth type changed
        if (!(updatedConfig instanceof OAuthInheritAuthConfig oAuthInheritAuthConfig)) {
            return updatedConfig;
        }
        // otherwise merge oauth auth config
        return new OAuthInheritAuthConfig(oAuthInheritAuthConfig.getAuthId(),
                oAuthInheritAuthConfig.getType());
    }
}

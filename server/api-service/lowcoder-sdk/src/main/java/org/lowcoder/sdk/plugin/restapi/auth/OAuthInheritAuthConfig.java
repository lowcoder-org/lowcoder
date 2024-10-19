package org.lowcoder.sdk.plugin.restapi.auth;

import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

/**
 * oauth(inherit from login) auth config
 */
@Getter
@SuperBuilder
@Jacksonized
public final class OAuthInheritAuthConfig extends AuthConfig {

    private String authId;

    @Override
    public AuthConfig mergeWithUpdatedConfig(@Nullable AuthConfig updatedConfig) {
        // return new auth config if auth type changed
        if (!(updatedConfig instanceof OAuthInheritAuthConfig oAuthInheritAuthConfig)) {
            return updatedConfig;
        }
        // otherwise merge oauth auth config
        return OAuthInheritAuthConfig.builder()
                .authId(oAuthInheritAuthConfig.getAuthId())
                .type(oAuthInheritAuthConfig.getType())
                .build();
    }
}

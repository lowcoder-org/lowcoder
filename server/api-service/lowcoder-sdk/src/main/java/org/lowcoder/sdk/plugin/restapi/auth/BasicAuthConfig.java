package org.lowcoder.sdk.plugin.restapi.auth;

import com.fasterxml.jackson.annotation.JsonView;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.ObjectUtils;
import org.lowcoder.sdk.config.JsonViews;

import java.util.function.Function;

/**
 * not only basic auth config, but also digest auth config.
 */
@Getter
@SuperBuilder
@Jacksonized
public final class BasicAuthConfig extends AuthConfig {
    private final String username;
    @JsonView(JsonViews.Internal.class)
    private String password;

    @Override
    public void doEncrypt(Function<String, String> encryptFunc) {
        this.password = encryptFunc.apply(this.password);
    }

    @Override
    public void doDecrypt(Function<String, String> decryptFunc) {
        this.password = decryptFunc.apply(this.password);
    }

    @Override
    public AuthConfig mergeWithUpdatedConfig(@Nullable AuthConfig updatedConfig) {
        // return new auth config if auth type changed
        if (!(updatedConfig instanceof BasicAuthConfig basicAuthConfig)) {
            return updatedConfig;
        }
        // otherwise merge basic auth config
        return BasicAuthConfig.builder()
                .username(basicAuthConfig.getUsername())
                .password(ObjectUtils.firstNonNull(basicAuthConfig.getPassword(), this.password))
                .type(basicAuthConfig.getType())
                .build();
    }
}

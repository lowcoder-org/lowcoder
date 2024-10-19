package org.lowcoder.sdk.plugin.restapi.auth;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeInfo.Id;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.sdk.models.Encrypt;

@Getter
@JsonTypeInfo(use = Id.NAME, property = "type", visible = true, defaultImpl = DefaultAuthConfig.class)
@JsonSubTypes({
        @Type(value = BasicAuthConfig.class, name = "DIGEST_AUTH"),
        @Type(value = BasicAuthConfig.class, name = "BASIC_AUTH"),
        @Type(value = NoneAuthConfig.class, name = "NO_AUTH"),
        @Type(value = OAuthInheritAuthConfig.class, name = "OAUTH2_INHERIT_FROM_LOGIN")
})
@SuperBuilder
public abstract class AuthConfig implements Encrypt {

    protected final RestApiAuthType type;

    protected AuthConfig(RestApiAuthType type) {
        this.type = type;
    }

    public AuthConfig mergeWithUpdatedConfig(@Nullable AuthConfig updatedConfig) {
        return updatedConfig;
    }
}

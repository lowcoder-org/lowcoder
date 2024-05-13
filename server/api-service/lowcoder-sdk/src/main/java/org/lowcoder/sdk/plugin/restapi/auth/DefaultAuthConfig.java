package org.lowcoder.sdk.plugin.restapi.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

@Jacksonized
@SuperBuilder
public class DefaultAuthConfig extends AuthConfig {

    @JsonCreator
    protected DefaultAuthConfig(RestApiAuthType type) {
        super(type);
    }
}

package org.lowcoder.sdk.plugin.restapi.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.validation.constraints.Size;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

@SuperBuilder
@Jacksonized
public class NoneAuthConfig extends AuthConfig {

    @JsonCreator
    public NoneAuthConfig(RestApiAuthType type) {
        super(type);
    }
}

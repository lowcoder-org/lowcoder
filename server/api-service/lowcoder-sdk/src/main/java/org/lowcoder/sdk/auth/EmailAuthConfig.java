package org.lowcoder.sdk.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

import static org.lowcoder.sdk.auth.constants.AuthTypeConstants.FORM;
import static org.lowcoder.sdk.constants.AuthSourceConstants.EMAIL;

@Getter
@SuperBuilder
@Jacksonized
public class EmailAuthConfig extends AbstractAuthConfig {

    @JsonCreator
    public EmailAuthConfig(@Nullable String id, boolean enable, boolean enableRegister) {
        super(id, EMAIL, EMAIL, enable, enableRegister, FORM);
    }
}

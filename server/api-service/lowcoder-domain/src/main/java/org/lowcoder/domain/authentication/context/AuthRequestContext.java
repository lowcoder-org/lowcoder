package org.lowcoder.domain.authentication.context;


import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.Setter;
import org.lowcoder.sdk.auth.AbstractAuthConfig;

@Setter
@Getter
public abstract class AuthRequestContext {

    protected volatile AbstractAuthConfig authConfig;

    @Nullable
    private volatile String orgId;
}

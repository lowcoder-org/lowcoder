package org.lowcoder.domain.authentication.context;

import javax.annotation.Nullable;

import org.lowcoder.sdk.auth.AbstractAuthConfig;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public abstract class AuthRequestContext {

    protected volatile AbstractAuthConfig authConfig;

    @Nullable
    private volatile String orgId;
}

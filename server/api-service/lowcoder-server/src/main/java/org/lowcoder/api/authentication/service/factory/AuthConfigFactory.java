package org.lowcoder.api.authentication.service.factory;

import java.util.Set;

import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.AbstractAuthConfig;

public interface AuthConfigFactory {

    AbstractAuthConfig build(AuthConfigRequest authConfigRequest, boolean enable);

    Set<String> supportAuthTypes();
}

package org.lowcoder.api.authentication.service.factory;

import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

import java.util.Set;

import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.exception.BizException;

public interface AuthConfigFactory {

    String INVALID_PARAMETER_KEY = "INVALID_PARAMETER";
    String AUTH_TYPE_PARAMETER = "authType=%s";

    AbstractAuthConfig build(AuthConfigRequest authConfigRequest, boolean enable);

    Set<String> supportAuthTypes();

    /**
     * The coded error for a request whose {@code authType} is missing or not supported (BF-108: a missing type failed
     * with a NullPointerException or an UnsupportedOperationException, answered as an internal error).
     */
    static BizException unsupportedAuthType(String authType) {
        return ofException(INVALID_PARAMETER, INVALID_PARAMETER_KEY, String.format(AUTH_TYPE_PARAMETER, authType));
    }
}

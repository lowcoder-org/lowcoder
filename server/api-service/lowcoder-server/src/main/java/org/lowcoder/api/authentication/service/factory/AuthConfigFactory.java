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
    String CLIENT_ID_PARAMETER = "clientId";

    AbstractAuthConfig build(AuthConfigRequest authConfigRequest, boolean enable);

    Set<String> supportAuthTypes();

    /**
     * The coded error for a request whose {@code authType} is missing or not supported (BF-108: a missing type failed
     * with a NullPointerException or an UnsupportedOperationException, answered as an internal error).
     */
    static BizException unsupportedAuthType(String authType) {
        return ofException(INVALID_PARAMETER, INVALID_PARAMETER_KEY, String.format(AUTH_TYPE_PARAMETER, authType));
    }

    /**
     * The client id of an OAuth config request, which every OAuth config needs; a request without one (no {@code clientId}
     * key, or a JSON null) is the coded error INVALID_PARAMETER naming {@code clientId} (NEW-34: it was a NullPointerException,
     * answered as an internal error).
     * <p>
     * Limits: only a null client id is refused; any other value is kept, an empty or blank string included (the tests cover
     * empty, a space and a tab; {@code requireNonNull} passed them too), and a value that is not a string (a number, a boolean,
     * a list, an object) is kept as its {@code toString}, as {@link AuthConfigRequest#getClientId} reads it with
     * {@code MapUtils.getString}. The client secret and the other OAuth fields are not checked; FORM configs do not call this.
     */
    static String requireClientId(AuthConfigRequest authConfigRequest) {
        String clientId = authConfigRequest.getClientId();
        if (clientId == null) {
            throw ofException(INVALID_PARAMETER, INVALID_PARAMETER_KEY, CLIENT_ID_PARAMETER);
        }
        return clientId;
    }
}

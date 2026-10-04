package org.lowcoder.api.contract.support;

import org.lowcoder.api.authentication.AuthenticationEndpoints.FormLoginRequest;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.usermanagement.view.APIKeyVO;

/**
 * Samples of the authentication types of WP7 (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T7.1), with the conventions of
 * {@link PayloadSamples}. The login password carries {@link PayloadSamples#SECRET_MARKER} (§4.5); it is request-only.
 */
public final class AuthenticationSamples {

    private AuthenticationSamples() {
    }

    /** {@code AuthenticationEndpoints#formLogin}; {@code register} is {@code true}, not the primitive's default. */
    public static FormLoginRequest formLoginRequest() {
        return new FormLoginRequest("FormLoginRequest.loginId", PayloadSamples.SECRET_MARKER + "FormLoginRequest.password", true,
                "FormLoginRequest.source", "FormLoginRequest.authId");
    }

    /**
     * {@code AuthenticationEndpoints#createAPIKey}; a {@code HashMap} subclass (Appendix A: dynamic map) with the three
     * keys its getters read.
     */
    public static APIKeyRequest apiKeyRequest() {
        APIKeyRequest request = new APIKeyRequest();
        request.put("id", "APIKeyRequest.id");
        request.put("name", "APIKeyRequest.name");
        request.put("description", "APIKeyRequest.description");
        return request;
    }

    /** {@code createAPIKey}'s answer, which hands the new key's token to its owner. */
    public static APIKeyVO apiKeyVO() {
        return APIKeyVO.builder().id("APIKeyVO.id").token("APIKeyVO.token").build();
    }
}

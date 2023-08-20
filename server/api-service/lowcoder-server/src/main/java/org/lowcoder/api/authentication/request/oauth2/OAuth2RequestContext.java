package org.lowcoder.api.authentication.request.oauth2;

import org.lowcoder.domain.authentication.context.AuthRequestContext;

import lombok.Getter;

@Getter
public final class OAuth2RequestContext extends AuthRequestContext {
    private final String code;
    private final String redirectUrl;

    public OAuth2RequestContext(String orgId, String code, String redirectUrl) {
        this.setOrgId(orgId);
        this.code = code;
        this.redirectUrl = redirectUrl;
    }
}

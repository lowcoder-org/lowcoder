package org.lowcoder.sdk.auth;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.BASE_URL_PLACEHOLDER;

import javax.annotation.Nullable;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Getter;

/**
 * OAuth2 ORY auth config.
 */
@Getter
public class Oauth2OryAuthConfig extends Oauth2SimpleAuthConfig {

    protected String baseUrl;

    @JsonCreator
    public Oauth2OryAuthConfig(
            @Nullable String id,
            Boolean enable,
            Boolean enableRegister,
            String source,
            String sourceName,
            String clientId,
            String clientSecret,
            String baseUrl,
            String authType) {
        super(id, enable, enableRegister, source, sourceName, clientId, clientSecret, authType);
        this.baseUrl = baseUrl;
    }

    @Override
    public String replaceAuthUrlClientIdPlaceholder(String url) {
        return super.replaceAuthUrlClientIdPlaceholder(url).replace(BASE_URL_PLACEHOLDER, baseUrl);
    }
}

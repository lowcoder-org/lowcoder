package org.lowcoder.sdk.auth;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

import java.util.HashMap;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.BASE_URL_PLACEHOLDER;
import static org.lowcoder.sdk.auth.constants.Oauth2Constants.SCOPE_PLACEHOLDER;

/**
 * This class is for Generic Auth Provider
 */
@Getter
@SuperBuilder
@Jacksonized
public class Oauth2GenericAuthConfig extends Oauth2SimpleAuthConfig {
    private String sourceDescription;
    private String sourceIcon;
    private String sourceCategory;
    private String issuerUri;
    private String authorizationEndpoint;
    private String tokenEndpoint;
    private String userInfoEndpoint;
    private String scope;
    private HashMap<String, String> sourceMappings;
    private Boolean userInfoIntrospection;

    @Override
    public String replaceAuthUrlClientIdPlaceholder(String url)
    {
        return super.replaceAuthUrlClientIdPlaceholder(url)
                .replace(BASE_URL_PLACEHOLDER, authorizationEndpoint)
                .replace(SCOPE_PLACEHOLDER, scope);
    }


}

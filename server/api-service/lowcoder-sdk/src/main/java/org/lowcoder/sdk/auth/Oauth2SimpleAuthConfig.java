package org.lowcoder.sdk.auth;

import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.auth.constants.Oauth2Constants;
import org.lowcoder.sdk.config.JsonViews;

import java.util.function.Function;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.CLIENT_ID_PLACEHOLDER;

/**
 * simple oauth2 auth config.
 */
@Getter
@SuperBuilder
@Jacksonized
public class Oauth2SimpleAuthConfig extends AbstractAuthConfig {

    protected String clientId;
    @JsonView(JsonViews.Internal.class)
    protected String clientSecret;

    /**
     * used by fe.
     * <p>
     * we only render client-id, leaving redirect-url and state rendered by fe.
     */
    @SuppressWarnings("unused")
    @JsonView(JsonViews.Public.class)
    public String getAuthorizeUrl() {
        return switch (authType) {
            case AuthTypeConstants.GOOGLE -> replaceAuthUrlClientIdPlaceholder(Oauth2Constants.GOOGLE_AUTHORIZE_URL);
            case AuthTypeConstants.GITHUB -> replaceAuthUrlClientIdPlaceholder(Oauth2Constants.GITHUB_AUTHORIZE_URL);
            case AuthTypeConstants.ORY -> replaceAuthUrlClientIdPlaceholder(Oauth2Constants.ORY_AUTHORIZE_URL);
            case AuthTypeConstants.KEYCLOAK -> replaceAuthUrlClientIdPlaceholder(Oauth2Constants.KEYCLOAK_AUTHORIZE_URL);
            case AuthTypeConstants.GENERIC -> replaceAuthUrlClientIdPlaceholder(Oauth2Constants.GENERIC_AUTHORIZE_URL);
            default -> null;
        };
    }

    @Override
    public void doEncrypt(Function<String, String> encryptFunc) {
        this.clientSecret = encryptFunc.apply(clientSecret);
    }

    @Override
    public void doDecrypt(Function<String, String> decryptFunc) {
        this.clientSecret = decryptFunc.apply(clientSecret);
    }

    @Override
    public void merge(AbstractAuthConfig oldConfig) {
        if (StringUtils.isBlank(this.clientSecret) && oldConfig instanceof Oauth2SimpleAuthConfig oldSimpleConfig) {
            this.clientSecret = oldSimpleConfig.getClientSecret();
        }
    }

    public String replaceAuthUrlClientIdPlaceholder(String url) {
        return url.replace(CLIENT_ID_PLACEHOLDER, clientId);
    }
}

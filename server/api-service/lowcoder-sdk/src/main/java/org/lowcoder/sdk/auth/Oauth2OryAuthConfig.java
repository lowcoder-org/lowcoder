package org.lowcoder.sdk.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.auth.constants.Oauth2Constants;
import org.lowcoder.sdk.config.SerializeConfig.JsonViews;

import javax.annotation.Nullable;
import java.util.function.Function;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.CLIENT_ID_PLACEHOLDER;
import static org.lowcoder.sdk.auth.constants.Oauth2Constants.INSTANCE_ID_PLACEHOLDER;

/**
 * OAuth2 ORY auth config.
 */
@Getter
public class Oauth2OryAuthConfig extends Oauth2SimpleAuthConfig {

    protected String instanceId;

    @JsonCreator
    public Oauth2OryAuthConfig(
            @Nullable String id,
            Boolean enable,
            Boolean enableRegister,
            String source,
            String sourceName,
            String clientId,
            String clientSecret,
            String instanceId,
            String authType) {
        super(id, enable, enableRegister, source, sourceName, clientId, clientSecret, authType);
        this.instanceId = instanceId;
    }

    @Override
    public String replaceAuthUrlClientIdPlaceholder(String url) {
        return super.replaceAuthUrlClientIdPlaceholder(url).replace(INSTANCE_ID_PLACEHOLDER, instanceId);
    }
}

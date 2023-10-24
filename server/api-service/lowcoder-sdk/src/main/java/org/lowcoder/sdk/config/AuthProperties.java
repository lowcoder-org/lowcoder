package org.lowcoder.sdk.config;

import static org.lowcoder.sdk.constants.AuthSourceConstants.GITHUB;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GITHUB_NAME;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GOOGLE;
import static org.lowcoder.sdk.constants.AuthSourceConstants.GOOGLE_NAME;

import java.util.ArrayList;
import java.util.List;

import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    private Email email = new Email();
    private Oauth2Simple google = new Oauth2Simple();
    private Oauth2Simple github = new Oauth2Simple();
    private ApiKey apiKey = new ApiKey();

    @Getter
    @Setter
    public static class AuthWay {

        protected boolean enable = false;
        protected Boolean enableRegister;

        public boolean isEnableRegister() {
            if (enableRegister == null) {
                return enable;
            }
            return enable && enableRegister;
        }
    }

    public static class Email extends AuthWay {
    }

    @Setter
    @Getter
    public static class Oauth2Simple extends AuthWay {
        private String clientId;
        private String clientSecret;
    }

    @Setter
    @Getter
    public static class ApiKey {
        private String secret;
    }

    /**
     * For saas mode, such as app.lowcoder.cloud
     */
    public List<AbstractAuthConfig> getAuthConfigs() {
        List<AbstractAuthConfig> authConfigs = new ArrayList<>();
        if (email.isEnable()) {
            EmailAuthConfig email = new EmailAuthConfig(null, this.email.isEnable(), this.email.isEnableRegister());
            authConfigs.add(email);
        }
        // google
        if (google.isEnable()) {
            Oauth2SimpleAuthConfig googleConfig = new Oauth2SimpleAuthConfig(
                    null,
                    true,
                    google.isEnableRegister(),
                    GOOGLE,
                    GOOGLE_NAME,
                    google.getClientId(),
                    google.getClientSecret(),
                    AuthTypeConstants.GOOGLE);
            authConfigs.add(googleConfig);
        }
        // github
        if (github.isEnable()) {
            Oauth2SimpleAuthConfig githubConfig = new Oauth2SimpleAuthConfig(
                    null,
                    true,
                    github.isEnableRegister(),
                    GITHUB,
                    GITHUB_NAME,
                    github.getClientId(),
                    github.getClientSecret(),
                    AuthTypeConstants.GITHUB);
            authConfigs.add(githubConfig);
        }
        return authConfigs;
    }
}

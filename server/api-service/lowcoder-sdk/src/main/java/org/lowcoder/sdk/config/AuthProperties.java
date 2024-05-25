package org.lowcoder.sdk.config;

import lombok.Getter;
import lombok.Setter;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

import static org.lowcoder.sdk.constants.AuthSourceConstants.*;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    private Email email = new Email();
    private Oauth2Simple google = new Oauth2Simple();
    private Oauth2Simple github = new Oauth2Simple();
    private ApiKey apiKey = new ApiKey();
    private Boolean workspaceCreation;

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
            Oauth2SimpleAuthConfig googleConfig = Oauth2SimpleAuthConfig.builder()
                    .id(null)
                    .enable(true)
                    .enableRegister(google.isEnableRegister())
                    .source(GOOGLE)
                    .sourceName(GOOGLE_NAME)
                    .clientId(google.getClientId())
                    .clientSecret(google.getClientSecret())
                    .authType(AuthTypeConstants.GOOGLE)
                    .build();
            authConfigs.add(googleConfig);
        }
        // github
        if (github.isEnable()) {
            Oauth2SimpleAuthConfig githubConfig = Oauth2SimpleAuthConfig.builder()
                    .id(null)
                    .enable(true)
                    .enableRegister(github.isEnableRegister())
                    .source(GITHUB)
                    .sourceName(GITHUB_NAME)
                    .clientId(github.getClientId())
                    .clientSecret(github.getClientSecret())
                    .authType(AuthTypeConstants.GITHUB)
                    .build();
            authConfigs.add(githubConfig);
        }
        return authConfigs;
    }
}

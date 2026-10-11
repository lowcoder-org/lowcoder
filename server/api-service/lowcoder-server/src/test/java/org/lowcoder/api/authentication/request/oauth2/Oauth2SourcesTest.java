package org.lowcoder.api.authentication.request.oauth2;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.auth.constants.Oauth2Constants;

/** Tests of the endpoint providers: {@link Oauth2DefaultSource}, {@link GenericOAuthProviderSource} and {@link Oauth2Source#getName()}. */
class Oauth2SourcesTest {

    private static final String TOKEN_ENDPOINT = "https://idp.example/token";
    private static final String USER_INFO_ENDPOINT = "https://idp.example/userinfo";

    private static GenericOAuthProviderSource genericSource() {
        return new GenericOAuthProviderSource(Oauth2GenericAuthConfig.builder().authType(AuthTypeConstants.GENERIC)
                .tokenEndpoint(TOKEN_ENDPOINT).userInfoEndpoint(USER_INFO_ENDPOINT).build());
    }

    /** Catches a refresh sent to the wrong endpoint: a generic provider refreshes at its token endpoint. */
    @Test
    void genericSource_readsItsEndpointsFromTheConfig_andRefreshesAtTheTokenEndpoint() {
        GenericOAuthProviderSource source = genericSource();

        assertThat(source.accessToken()).isEqualTo(TOKEN_ENDPOINT);
        assertThat(source.userInfo()).isEqualTo(USER_INFO_ENDPOINT);
        assertThat(source.refresh()).isEqualTo(TOKEN_ENDPOINT);
        System.out.println("[Oauth2SourcesTest] generic source " + source.accessToken() + " / " + source.userInfo() + " / " + source.refresh());
    }

    /** Catches a provider refreshing at another provider's endpoint. */
    @Test
    void defaultSources_refreshEndpoints() {
        assertThat(Oauth2DefaultSource.GITHUB.refresh()).isEqualTo("https://github.com/login/oauth/access_token");
        assertThat(Oauth2DefaultSource.GOOGLE.refresh()).isEqualTo("https://www.googleapis.com/oauth2/v4/token");
        assertThat(Oauth2DefaultSource.ORY.refresh()).isEqualTo(Oauth2Constants.BASE_URL_PLACEHOLDER + "/oauth2/token");
        assertThat(Oauth2DefaultSource.KEYCLOAK.refresh()).isEqualTo(Oauth2Constants.BASE_URL_PLACEHOLDER + "/realms/"
                + Oauth2Constants.REALM_PLACEHOLDER + "/protocol/openid-connect/token");
        System.out.println("[Oauth2SourcesTest] default refresh endpoints checked");
    }

    /** The source name: an enum source is named by its constant, any other source by its class. */
    @Test
    void getName_isTheEnumConstant_orTheSimpleClassName() {
        assertThat(Oauth2DefaultSource.GITHUB.getName()).isEqualTo("GITHUB");
        assertThat(Oauth2DefaultSource.KEYCLOAK.getName()).isEqualTo("KEYCLOAK");
        assertThat(genericSource().getName()).isEqualTo("GenericOAuthProviderSource");
        System.out.println("[Oauth2SourcesTest] names " + Oauth2DefaultSource.GITHUB.getName() + ", " + genericSource().getName());
    }
}

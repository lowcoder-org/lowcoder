package org.lowcoder.api.authentication.request.oauth2;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.oauth2.request.GenericAuthRequest;
import org.lowcoder.api.authentication.util.AdvancedMapUtils;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.test.StepVerifier;

/**
 * Tests of {@link Oauth2AuthRequestFactory}: for GITHUB, GOOGLE, ORY and KEYCLOAK it synthesises a generic config with
 * fixed endpoints, scope and attribute mappings. A wrong endpoint or mapping changes who a provider login resolves to,
 * so every value is asserted against a literal. The built request's protected {@code config} is read by reflection.
 */
class Oauth2AuthRequestFactoryTest {

    private static final String SOURCE_NAME = "Provider";
    private static final String CLIENT_ID = "client-1";
    private static final String CLIENT_SECRET = "secret-1";
    private static final String CONFIG_ID = "cfg-1";
    private static final boolean ENABLE = true;
    private static final boolean ENABLE_REGISTER = false;

    private final Oauth2AuthRequestFactory factory = new Oauth2AuthRequestFactory();

    private Oauth2GenericAuthConfig builtConfig(AbstractAuthConfig authConfig) {
        OAuth2RequestContext context = new OAuth2RequestContext("org-1", null, null);
        context.setAuthConfig(authConfig);
        AuthRequest request = factory.build(context).block();
        assertThat(request).isInstanceOf(GenericAuthRequest.class);
        return (Oauth2GenericAuthConfig) ReflectionTestUtils.getField(request, "config");
    }

    private static Oauth2SimpleAuthConfig simple(String authType) {
        return Oauth2SimpleAuthConfig.builder().id(CONFIG_ID).source(authType).sourceName(SOURCE_NAME).enable(ENABLE)
                .enableRegister(ENABLE_REGISTER).clientId(CLIENT_ID).clientSecret(CLIENT_SECRET).authType(authType).build();
    }

    private static void assertCommonFields(Oauth2GenericAuthConfig built, String source) {
        assertThat(built.getSource()).isEqualTo(source);
        assertThat(built.getSourceName()).isEqualTo(SOURCE_NAME);
        assertThat(built.isEnable()).isEqualTo(ENABLE);
        assertThat(built.isEnableRegister()).isEqualTo(ENABLE_REGISTER);
        assertThat(built.getClientId()).isEqualTo(CLIENT_ID);
        assertThat(built.getClientSecret()).isEqualTo(CLIENT_SECRET);
        assertThat(built.getAuthType()).isEqualTo(AuthTypeConstants.GENERIC);
        assertThat(built.getUserInfoIntrospection()).isTrue();
    }

    private static Stream<Arguments> simpleProviders() {
        return Stream.of(
                Arguments.of(AuthTypeConstants.GITHUB, "https://github.com/login/oauth/access_token", "https://api.github.com/user",
                        "read:email read:user", null,
                        Map.of("uid", "id", "email", "email", "username", "login", "avatar", "avatar_url")),
                Arguments.of(AuthTypeConstants.GOOGLE, "https://www.googleapis.com/oauth2/v4/token",
                        "https://www.googleapis.com/oauth2/v3/userinfo", "openid email profile", Boolean.TRUE,
                        Map.of("uid", "sub", "email", "email", "username", "email", "avatar", "picture")));
    }

    /** Catches a wrong endpoint/mapping (identity confusion) or a credential not being copied for GITHUB and GOOGLE. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("simpleProviders")
    void build_githubAndGoogle_synthesiseTheGenericConfig(String authType, String tokenEndpoint, String userInfoEndpoint,
            String scope, Boolean userCanSelectAccounts, Map<String, String> sourceMappings) {
        Oauth2GenericAuthConfig built = builtConfig(simple(authType));

        assertCommonFields(built, authType);
        assertThat(built.getTokenEndpoint()).isEqualTo(tokenEndpoint);
        assertThat(built.getUserInfoEndpoint()).isEqualTo(userInfoEndpoint);
        assertThat(built.getScope()).isEqualTo(scope);
        assertThat(built.getUserCanSelectAccounts()).isEqualTo(userCanSelectAccounts);
        assertThat(built.getSourceMappings()).isEqualTo(sourceMappings);
        System.out.println("[Oauth2AuthRequestFactoryTest] " + authType + " token=" + built.getTokenEndpoint() + " mappings=" + built.getSourceMappings());
    }

    /** Catches tokens being requested from a literal {@code $BASE_URL} host, or a wrong ORY attribute mapping. */
    @Test
    void build_ory_replacesThePlaceholders_andUsesTheConfigsScope() {
        Oauth2OryAuthConfig ory = Oauth2OryAuthConfig.builder().id(CONFIG_ID).source(AuthTypeConstants.ORY).sourceName(SOURCE_NAME)
                .enable(ENABLE).enableRegister(ENABLE_REGISTER).clientId(CLIENT_ID).clientSecret(CLIENT_SECRET)
                .authType(AuthTypeConstants.ORY).baseUrl("https://ory.example").scope("openid offline").build();

        Oauth2GenericAuthConfig built = builtConfig(ory);

        assertCommonFields(built, AuthTypeConstants.ORY);
        assertThat(built.getTokenEndpoint()).isEqualTo("https://ory.example/oauth2/token");
        assertThat(built.getUserInfoEndpoint()).isEqualTo("https://ory.example/userinfo");
        assertThat(built.getScope()).isEqualTo("openid offline");
        assertThat(built.getUserCanSelectAccounts()).isFalse();
        assertThat(built.getSourceMappings()).isEqualTo(Map.of("uid", "sub", "email", "email", "username", "email", "avatar", "picture"));
        System.out.println("[Oauth2AuthRequestFactoryTest] ORY token=" + built.getTokenEndpoint() + " userinfo=" + built.getUserInfoEndpoint());
    }

    /**
     * KEYCLOAK: base url and realm are substituted; its avatar mapping is the literal {@code "false"}, which
     * {@link AdvancedMapUtils#getString} treats as "no such attribute".
     */
    @Test
    void build_keycloak_replacesThePlaceholders_andMapsNoAvatar() {
        Oauth2KeycloakAuthConfig keycloak = Oauth2KeycloakAuthConfig.builder().id(CONFIG_ID).source(AuthTypeConstants.KEYCLOAK)
                .sourceName(SOURCE_NAME).enable(ENABLE).enableRegister(ENABLE_REGISTER).clientId(CLIENT_ID).clientSecret(CLIENT_SECRET)
                .authType(AuthTypeConstants.KEYCLOAK).baseUrl("https://kc.example").realm("lowcoder").scope("openid profile").build();

        Oauth2GenericAuthConfig built = builtConfig(keycloak);

        assertCommonFields(built, AuthTypeConstants.KEYCLOAK);
        assertThat(built.getTokenEndpoint()).isEqualTo("https://kc.example/realms/lowcoder/protocol/openid-connect/token");
        assertThat(built.getUserInfoEndpoint()).isEqualTo("https://kc.example/realms/lowcoder/protocol/openid-connect/userinfo");
        assertThat(built.getScope()).isEqualTo("openid profile");
        assertThat(built.getUserCanSelectAccounts()).isFalse();
        assertThat(built.getSourceMappings()).isEqualTo(Map.of("uid", "sub", "email", "email", "username", "email", "avatar", "false"));
        assertThat(AdvancedMapUtils.getString(Map.of("false", "x"), built.getSourceMappings().get("avatar"))).isNull();
        System.out.println("[Oauth2AuthRequestFactoryTest] KEYCLOAK token=" + built.getTokenEndpoint() + " avatar mapping=" + built.getSourceMappings().get("avatar"));
    }

    /** Catches a generic config being rebuilt (and so altered) instead of used as the admin saved it. */
    @Test
    void build_generic_usesTheGivenConfigInstance() {
        Oauth2GenericAuthConfig generic = Oauth2GenericAuthConfig.builder().id(CONFIG_ID).source(AuthTypeConstants.GENERIC)
                .sourceName(SOURCE_NAME).enable(ENABLE).enableRegister(ENABLE_REGISTER).clientId(CLIENT_ID)
                .authType(AuthTypeConstants.GENERIC).tokenEndpoint("https://idp.example/token").build();

        assertThat(builtConfig(generic)).isSameAs(generic);
        System.out.println("[Oauth2AuthRequestFactoryTest] GENERIC config used as given");
    }

    /** Catches an unsupported auth type producing a request: it is an UnsupportedOperationException naming the type. */
    @Test
    void build_unsupportedAuthType_failsWithUnsupportedOperationInTheMono() {
        OAuth2RequestContext context = new OAuth2RequestContext("org-1", null, null);
        context.setAuthConfig(new EmailAuthConfig(CONFIG_ID, true, true));

        StepVerifier.create(factory.build(context))
                .expectErrorSatisfies(e -> {
                    assertThat(e).isInstanceOf(UnsupportedOperationException.class);
                    assertThat(e).hasMessage(AuthTypeConstants.FORM);
                })
                .verify();
        System.out.println("[Oauth2AuthRequestFactoryTest] FORM -> UnsupportedOperationException(FORM)");
    }

    @Test
    void supportedAuthTypes_areExactlyGithubGoogleOryKeycloakAndGeneric() {
        assertThat(factory.supportedAuthTypes()).isEqualTo(Set.of(AuthTypeConstants.GITHUB, AuthTypeConstants.GOOGLE,
                AuthTypeConstants.ORY, AuthTypeConstants.KEYCLOAK, AuthTypeConstants.GENERIC));
        System.out.println("[Oauth2AuthRequestFactoryTest] supported " + factory.supportedAuthTypes());
    }
}

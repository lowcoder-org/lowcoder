package org.lowcoder.api.authentication.service.factory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;

/**
 * Tests of {@link AuthConfigFactoryImpl#build}: what each auth type builds from the request (the generic type with a
 * fully populated request is covered by {@code AuthConfigRequestConsumerTest}; this class covers the other types, the
 * defaults and the failures).
 *
 * <p>Pinned under D-6, plan §9 row "malformed admin auth-config input fails with raw exceptions instead of a coded
 * error": a null {@code authType} fails with a NullPointerException (switch on null). A fix changes the test on purpose.
 */
class AuthConfigFactoryImplTest {

    private static final String CLIENT_ID = "client-1";
    private static final String CLIENT_SECRET = "secret-1";
    private static final String CONFIG_ID = "cfg-1";

    private final AuthConfigFactoryImpl factory = new AuthConfigFactoryImpl();

    private static AuthConfigRequest request(String authType, String... keyValues) {
        AuthConfigRequest request = new AuthConfigRequest();
        request.put("authType", authType);
        for (int i = 0; i < keyValues.length; i += 2) {
            request.put(keyValues[i], keyValues[i + 1]);
        }
        return request;
    }

    /** Catches wrong fixed source names, or enable/register/secret/id not coming from the request and the caller. */
    @ParameterizedTest(name = "{0} enable={1}")
    @CsvSource({"GITHUB,Github,true", "GITHUB,Github,false", "GOOGLE,Google,true", "GOOGLE,Google,false"})
    void build_githubAndGoogle_useTheFixedSourceNames_andTheRequestsValues(String authType, String sourceName, boolean enable) {
        AuthConfigRequest request = request(authType, "id", CONFIG_ID, "clientId", CLIENT_ID, "clientSecret", CLIENT_SECRET);

        AbstractAuthConfig built = factory.build(request, enable);

        assertThat(built).isExactlyInstanceOf(Oauth2SimpleAuthConfig.class);
        Oauth2SimpleAuthConfig simple = (Oauth2SimpleAuthConfig) built;
        assertThat(simple.getId()).isEqualTo(CONFIG_ID);
        assertThat(simple.getSource()).isEqualTo(authType);
        assertThat(simple.getSourceName()).isEqualTo(sourceName);
        assertThat(simple.isEnable()).isEqualTo(enable);
        assertThat(simple.isEnableRegister()).as("enableRegister defaults to true").isTrue();
        assertThat(simple.getClientId()).isEqualTo(CLIENT_ID);
        assertThat(simple.getClientSecret()).isEqualTo(CLIENT_SECRET);
        assertThat(simple.getAuthType()).isEqualTo(authType);
        System.out.println("[AuthConfigFactoryImplTest] " + authType + " -> " + simple.getSource() + "/" + simple.getSourceName() + " enable=" + enable);
    }

    @Test
    void build_oauth_explicitEnableRegisterFalse_andGeneratedId() {
        AuthConfigRequest request = request(AuthTypeConstants.GITHUB, "clientId", CLIENT_ID);
        request.put("enableRegister", false);

        AbstractAuthConfig built = factory.build(request, true);

        assertThat(built.isEnableRegister()).isFalse();
        assertThat(built.getId()).as("an id is generated when the request has none").isNotBlank().isNotEqualTo(AuthTypeConstants.GITHUB);
        System.out.println("[AuthConfigFactoryImplTest] enableRegister=false kept, generated id " + built.getId());
    }

    @Test
    void build_ory_copiesBaseUrlAndScope() {
        AuthConfigRequest request = request(AuthTypeConstants.ORY, "id", CONFIG_ID, "clientId", CLIENT_ID,
                "clientSecret", CLIENT_SECRET, "baseUrl", "https://ory.example", "scope", "openid offline");

        AbstractAuthConfig built = factory.build(request, true);

        assertThat(built).isExactlyInstanceOf(Oauth2OryAuthConfig.class);
        Oauth2OryAuthConfig ory = (Oauth2OryAuthConfig) built;
        assertThat(ory.getSource()).isEqualTo(AuthTypeConstants.ORY);
        assertThat(ory.getSourceName()).isEqualTo("Ory");
        assertThat(ory.getBaseUrl()).isEqualTo("https://ory.example");
        assertThat(ory.getScope()).isEqualTo("openid offline");
        assertThat(ory.getClientSecret()).isEqualTo(CLIENT_SECRET);
        assertThat(ory.isEnable()).isTrue();
        System.out.println("[AuthConfigFactoryImplTest] ORY base=" + ory.getBaseUrl() + " scope=" + ory.getScope());
    }

    @Test
    void build_keycloak_copiesBaseUrlRealmAndScope() {
        AuthConfigRequest request = request(AuthTypeConstants.KEYCLOAK, "id", CONFIG_ID, "clientId", CLIENT_ID,
                "clientSecret", CLIENT_SECRET, "baseUrl", "https://kc.example", "realm", "lowcoder", "scope", "openid profile");

        AbstractAuthConfig built = factory.build(request, false);

        assertThat(built).isExactlyInstanceOf(Oauth2KeycloakAuthConfig.class);
        Oauth2KeycloakAuthConfig keycloak = (Oauth2KeycloakAuthConfig) built;
        assertThat(keycloak.getSource()).isEqualTo(AuthTypeConstants.KEYCLOAK);
        assertThat(keycloak.getSourceName()).isEqualTo("Keycloak");
        assertThat(keycloak.getBaseUrl()).isEqualTo("https://kc.example");
        assertThat(keycloak.getRealm()).isEqualTo("lowcoder");
        assertThat(keycloak.getScope()).isEqualTo("openid profile");
        assertThat(keycloak.isEnable()).isFalse();
        System.out.println("[AuthConfigFactoryImplTest] KEYCLOAK base=" + keycloak.getBaseUrl() + " realm=" + keycloak.getRealm());
    }

    /** Catches a login config being saved without a client id: every OAuth type rejects it. */
    @ParameterizedTest
    @ValueSource(strings = {"GITHUB", "GOOGLE", "ORY", "KEYCLOAK", "GENERIC"})
    void build_everyOauthType_requiresAClientId(String authType) {
        AuthConfigRequest request = request(authType, "baseUrl", "https://x.example", "realm", "r", "scope", "s");

        assertThatThrownBy(() -> factory.build(request, true))
                .isInstanceOf(NullPointerException.class)
                .hasMessage("clientId can not be null.");
        System.out.println("[AuthConfigFactoryImplTest] " + authType + " without clientId -> NullPointerException");
    }

    /** Catches the generic defaults changing: introspection off, account selection on, GET for the user endpoint. */
    @Test
    void build_generic_appliesItsDefaults_whenTheRequestOmitsThem() {
        AbstractAuthConfig built = factory.build(request(AuthTypeConstants.GENERIC, "clientId", CLIENT_ID), true);

        assertThat(built).isExactlyInstanceOf(Oauth2GenericAuthConfig.class);
        Oauth2GenericAuthConfig generic = (Oauth2GenericAuthConfig) built;
        assertThat(generic.getSource()).isEqualTo(AuthTypeConstants.GENERIC);
        assertThat(generic.getSourceName()).isEqualTo(AuthTypeConstants.GENERIC);
        assertThat(generic.getUserInfoIntrospection()).isFalse();
        assertThat(generic.getUserCanSelectAccounts()).isTrue();
        assertThat(generic.getPostForUserEndpoint()).isFalse();
        assertThat(generic.getAuthType()).isEqualTo(AuthTypeConstants.GENERIC);
        System.out.println("[AuthConfigFactoryImplTest] GENERIC defaults introspection=" + generic.getUserInfoIntrospection()
                + " selectAccounts=" + generic.getUserCanSelectAccounts() + " post=" + generic.getPostForUserEndpoint());
    }

    @Test
    void build_generic_explicitFlagsOverrideTheDefaults() {
        AuthConfigRequest request = request(AuthTypeConstants.GENERIC, "clientId", CLIENT_ID, "source", "my-idp", "sourceName", "My IdP");
        request.put("userInfoIntrospection", true);
        request.put("userCanSelectAccounts", false);
        request.put("postForUserEndpoint", true);
        request.put("sourceMappings", new HashMap<>(java.util.Map.of("uid", "sub")));

        Oauth2GenericAuthConfig generic = (Oauth2GenericAuthConfig) factory.build(request, true);

        assertThat(generic.getSource()).isEqualTo("my-idp");
        assertThat(generic.getSourceName()).isEqualTo("My IdP");
        assertThat(generic.getUserInfoIntrospection()).isTrue();
        assertThat(generic.getUserCanSelectAccounts()).isFalse();
        assertThat(generic.getPostForUserEndpoint()).isTrue();
        assertThat(generic.getSourceMappings()).containsEntry("uid", "sub");
        System.out.println("[AuthConfigFactoryImplTest] GENERIC explicit flags kept, source " + generic.getSource());
    }

    /** Catches the form (email) config taking its values from the wrong place; present enableRegister values are kept. */
    @ParameterizedTest(name = "enable={0} enableRegister={1}")
    @CsvSource({"true,true", "true,false", "false,true", "false,false"})
    void build_form_buildsTheEmailConfig(boolean enable, boolean enableRegister) {
        AuthConfigRequest request = request(AuthTypeConstants.FORM, "id", CONFIG_ID);
        request.put("enableRegister", enableRegister);

        AbstractAuthConfig built = factory.build(request, enable);

        assertThat(built).isExactlyInstanceOf(EmailAuthConfig.class);
        assertThat(built.getId()).isEqualTo(CONFIG_ID);
        assertThat(built.isEnable()).isEqualTo(enable);
        assertThat(built.isEnableRegister()).isEqualTo(enableRegister);
        assertThat(built.getAuthType()).isEqualTo(AuthTypeConstants.FORM);
        System.out.println("[AuthConfigFactoryImplTest] FORM enable=" + enable + " enableRegister=" + enableRegister + " -> " + built.isEnable() + "/" + built.isEnableRegister());
    }

    /**
     * Pins the plan §9 candidate "FORM config without an enableRegister key" (reproduced by L2-5): the request's value
     * is read with {@code MapUtils.getBoolean(request, "enableRegister")}, which is null when the key is absent, and
     * {@code EmailAuthConfig}'s constructor takes a primitive {@code boolean}, so building fails with a
     * NullPointerException on unboxing (the other types default to true). A fix changes this test on purpose.
     */
    @Test
    void build_formWithoutEnableRegister_failsWithNpeOnUnboxing_pinsMissingEnableRegisterDefect() {
        assertThatThrownBy(() -> factory.build(request(AuthTypeConstants.FORM, "id", CONFIG_ID), true))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("enableRegister");
        System.out.println("[AuthConfigFactoryImplTest] FORM without enableRegister -> NullPointerException on unboxing (today's behaviour)");
    }

    /** Catches an unsupported auth type building something: it is an UnsupportedOperationException naming the type. */
    @Test
    void build_unsupportedAuthType_failsWithUnsupportedOperation() {
        assertThatThrownBy(() -> factory.build(request("SAML"), true))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessage("SAML");
        System.out.println("[AuthConfigFactoryImplTest] SAML -> UnsupportedOperationException");
    }

    /**
     * Pins plan §9 row "malformed admin auth-config input fails with raw exceptions instead of a coded error": a
     * request without {@code authType} fails with a NullPointerException from the switch, not a coded error.
     */
    @Test
    void build_nullAuthType_failsWithNpe_pinsRawExceptionDefect() {
        assertThatThrownBy(() -> factory.build(new AuthConfigRequest(), true)).isInstanceOf(NullPointerException.class);
        System.out.println("[AuthConfigFactoryImplTest] missing authType -> NullPointerException (today's behaviour)");
    }

    @Test
    void supportAuthTypes_areExactlyTheSixSupportedTypes() {
        assertThat(factory.supportAuthTypes()).isEqualTo(Set.of(AuthTypeConstants.FORM, AuthTypeConstants.GITHUB,
                AuthTypeConstants.GOOGLE, AuthTypeConstants.ORY, AuthTypeConstants.KEYCLOAK, AuthTypeConstants.GENERIC));
        System.out.println("[AuthConfigFactoryImplTest] supported " + factory.supportAuthTypes());
    }
}

package org.lowcoder.sdk.plugin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.auth.constants.Oauth2Constants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.common.ssl.DisableVerifySslConfig;
import org.lowcoder.sdk.plugin.common.ssl.SslCertVerificationType;
import org.lowcoder.sdk.plugin.common.ssl.SslConfig;
import org.lowcoder.sdk.plugin.common.ssl.SslHelper;
import org.lowcoder.sdk.plugin.common.ssl.VerifySelfSignedCertSslConfig;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;

/**
 * Merge and encryption of the REST API and GraphQL datasource configs and of the auth / ssl configs they hold, plus
 * the simple OAuth2 auth config and {@link SslHelper}. Secrets must survive an edit that does not resend them, and
 * every secret must pass through the encrypt function exactly once.
 */
class DatasourceConfigMergeAndCryptoTest {

    private static final String STORED_PASSWORD = "stored-pw";
    private static final String NEW_PASSWORD = "new-pw";
    private static final String STORED_CERT = "stored-cert";
    private static final String NEW_CERT = "new-cert";
    private static final String CLIENT_ID = "client-1";
    private static final String OLD_SECRET = "old-secret";
    private static final String NEW_SECRET = "new-secret";
    private static final Function<String, String> ENCRYPT = s -> s + "|enc";
    private static final Function<String, String> DECRYPT = s -> s.substring(0, s.length() - "|enc".length());

    /**
     * Self-signed test certificate (CN=lowcoder-test-cert, RSA 2048, valid until 2126), generated once offline with
     * {@code openssl req -x509 -newkey rsa:2048 -nodes -days 36500 -subj /CN=lowcoder-test-cert}; the private key was discarded.
     */
    private static final String TEST_CERT_PEM = ""
            + "-----BEGIN CERTIFICATE-----\n"
            + "MIIDHTCCAgWgAwIBAgIUD0FPOCIXricK4D5BHhVnkjmXZxYwDQYJKoZIhvcNAQEL\n"
            + "BQAwHTEbMBkGA1UEAwwSbG93Y29kZXItdGVzdC1jZXJ0MCAXDTI2MTAwNDE4MzY1\n"
            + "OVoYDzIxMjYwOTEwMTgzNjU5WjAdMRswGQYDVQQDDBJsb3djb2Rlci10ZXN0LWNl\n"
            + "cnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCgMqiAYniA/wkuwMzs\n"
            + "RzfvqR4yCCgu5eX0RuWy9hPHKxml6NubsaKL80e5J21ggmtQD7RI+3M48aDCGP7A\n"
            + "EZJnfKjba+4UKaieQgrSdw7Sy58rljnVfKfsfDFdVmCOXkhjSIusohbDCiSdxG3b\n"
            + "FQpd+hjvGyCMPgwp3qZn4u7QU876fhSgSRl9Uc6TsR8P7K73bKJ+4vzD7+TB5abi\n"
            + "i20Gc0cBE7SW26HJE3BKQaSbZ+IMdf3wFCPyKyKPRYaTbyZvsIGAbty6tFIggpDf\n"
            + "Wjp1N3+bznSpd6t/ck0pqBFBQE/otu7cWD14J9yzD71GiUyWo7mfTCPe0rfoIxj+\n"
            + "9XhBAgMBAAGjUzBRMB0GA1UdDgQWBBR7z/sKuaWqy14Xf0cAO0+vO26yIjAfBgNV\n"
            + "HSMEGDAWgBR7z/sKuaWqy14Xf0cAO0+vO26yIjAPBgNVHRMBAf8EBTADAQH/MA0G\n"
            + "CSqGSIb3DQEBCwUAA4IBAQBJhDE8fVd1mrS0OGCaiVCoIayuB7RHzhbobWj9RzOk\n"
            + "M/LcndxsyZB1NAWgQXHDqy2SUx8IMVexBdzjy5RHT9Q/AMOZWJYvHTdOngrCD0JZ\n"
            + "hzvLcYCozc49n8fPQzC84D50YY/oRM9i+yfKH0HzpNOEU0KZ5gIXh6EPAvc3pXH8\n"
            + "5jygly5r/YVdb5zmvAXG22+p25iZDQG7wnww9Swhei5vujWdDE4tYVH4g1xwPOXb\n"
            + "HOk33q6QugBDCmDO3iUyPnCC5Cita3dC6HRbMcwMSnsRJZ0o/dV8QS1WXYutOOYY\n"
            + "k3q0IUvVGf3MQ3uRtsrtwUD3Xq6/19wl1xIbSzSk+kQU\n"
            + "-----END CERTIFICATE-----\n"
            ;
    private static final String TEST_CERT_SUBJECT = "CN=lowcoder-test-cert";

    private static BasicAuthConfig basic(String username, String password) {
        return BasicAuthConfig.builder().username(username).password(password).type(RestApiAuthType.BASIC_AUTH).build();
    }

    private static OAuthInheritAuthConfig inherit(String authId) {
        return OAuthInheritAuthConfig.builder().authId(authId).type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build();
    }

    private static VerifySelfSignedCertSslConfig selfSigned(String cert) {
        return VerifySelfSignedCertSslConfig.builder().sslCertVerificationType(SslCertVerificationType.VERIFY_SELF_SIGNED_CERT)
                .selfSignedCert(cert).build();
    }

    private static RestApiDatasourceConfig rest(AuthConfig auth, SslConfig ssl) {
        return RestApiDatasourceConfig.builder().authConfig(auth).sslConfig(ssl).build();
    }

    private static GraphQLDatasourceConfig graphql(AuthConfig auth) {
        return GraphQLDatasourceConfig.builder().authConfig(auth).build();
    }

    private static Function<String, String> counting(AtomicInteger calls) {
        return s -> {
            calls.incrementAndGet();
            return ENCRYPT.apply(s);
        };
    }

    // ---- REST / GraphQL merge ----

    @Test
    void restMergeRejectsOtherConfigClass() {
        assertThatThrownBy(() -> rest(null, null).mergeWithUpdatedConfig(graphql(null)))
                .isInstanceOfSatisfying(BizException.class, e -> {
                    assertThat(e.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIG_TYPE);
                    assertThat(e.getArgs()).containsExactly("GraphQLDatasourceConfig");
                });
        System.out.println("[DatasourceConfigMergeAndCryptoTest] rest merge rejects a GraphQL update");
    }

    @Test
    void graphqlMergeRejectsOtherConfigClass() {
        assertThatThrownBy(() -> graphql(null).mergeWithUpdatedConfig(rest(null, null)))
                .isInstanceOfSatisfying(BizException.class, e -> {
                    assertThat(e.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIG_TYPE);
                    assertThat(e.getArgs()).containsExactly("RestApiDatasourceConfig");
                });
        System.out.println("[DatasourceConfigMergeAndCryptoTest] graphql merge rejects a REST update");
    }

    @Test
    void restMergeMergesStoredAuthAndSslIntoUpdate() {
        RestApiDatasourceConfig update = rest(basic("user2", null), selfSigned(null));

        DatasourceConnectionConfig merged = rest(basic("user1", STORED_PASSWORD), selfSigned(STORED_CERT)).mergeWithUpdatedConfig(update);

        assertThat(merged).isSameAs(update);
        BasicAuthConfig auth = (BasicAuthConfig) update.getAuthConfig();
        assertThat(auth.getUsername()).isEqualTo("user2");
        assertThat(auth.getPassword()).as("password not resent: stored one kept").isEqualTo(STORED_PASSWORD);
        VerifySelfSignedCertSslConfig ssl = (VerifySelfSignedCertSslConfig) update.getSslConfig();
        assertThat(ssl.getSelfSignedCert()).as("cert not resent: stored one kept").isEqualTo(STORED_CERT);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] rest merge kept stored password and cert");
    }

    @Test
    void restMergeLeavesUpdateUntouchedWhenStoredHasNoAuthOrSsl() {
        BasicAuthConfig updateAuth = basic("user", NEW_PASSWORD);
        VerifySelfSignedCertSslConfig updateSsl = selfSigned(NEW_CERT);
        RestApiDatasourceConfig update = rest(updateAuth, updateSsl);

        rest(null, null).mergeWithUpdatedConfig(update);

        assertThat(update.getAuthConfig()).isSameAs(updateAuth);
        assertThat(update.getSslConfig()).isSameAs(updateSsl);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] rest merge without stored auth/ssl keeps the update's objects");
    }

    @Test
    void graphqlMergeMergesStoredAuth() {
        GraphQLDatasourceConfig update = graphql(basic("user2", null));

        DatasourceConnectionConfig merged = graphql(basic("user1", STORED_PASSWORD)).mergeWithUpdatedConfig(update);

        assertThat(merged).isSameAs(update);
        assertThat(((BasicAuthConfig) update.getAuthConfig()).getPassword()).isEqualTo(STORED_PASSWORD);

        BasicAuthConfig updateAuth = basic("user", NEW_PASSWORD);
        GraphQLDatasourceConfig noStored = graphql(updateAuth);
        graphql(null).mergeWithUpdatedConfig(noStored);
        assertThat(noStored.getAuthConfig()).isSameAs(updateAuth);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] graphql merge kept stored password");
    }

    // ---- REST / GraphQL encryption ----

    @Test
    void restEncryptAndDecryptReachAuthAndSslExactlyOnce() {
        AtomicInteger calls = new AtomicInteger();
        BasicAuthConfig auth = basic("user", "pw");
        VerifySelfSignedCertSslConfig ssl = selfSigned("cert");
        RestApiDatasourceConfig config = rest(auth, ssl);

        DatasourceConnectionConfig encrypted = config.doEncrypt(counting(calls));

        assertThat(encrypted).isSameAs(config);
        assertThat(calls).as("auth password + ssl cert, once each").hasValue(2);
        assertThat(auth.getPassword()).isEqualTo("pw|enc");
        assertThat(ssl.getSelfSignedCert()).isEqualTo("cert|enc");

        assertThat(config.doDecrypt(DECRYPT)).isSameAs(config);
        assertThat(auth.getPassword()).isEqualTo("pw");
        assertThat(ssl.getSelfSignedCert()).isEqualTo("cert");
        System.out.println("[DatasourceConfigMergeAndCryptoTest] rest encrypt/decrypt reached auth and ssl once");
    }

    @Test
    void restEncryptAndDecryptDoNothingWithoutAuthAndSsl() {
        AtomicInteger calls = new AtomicInteger();
        RestApiDatasourceConfig config = rest(null, null);

        assertThat(config.doEncrypt(counting(calls))).isSameAs(config);
        assertThat(config.doDecrypt(counting(calls))).isSameAs(config);

        assertThat(calls).hasValue(0);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] rest crypto with null auth/ssl is a no-op");
    }

    @Test
    void graphqlEncryptAndDecryptReachAuthOnce() {
        AtomicInteger calls = new AtomicInteger();
        BasicAuthConfig auth = basic("user", "pw");
        GraphQLDatasourceConfig config = graphql(auth);

        assertThat(config.doEncrypt(counting(calls))).isSameAs(config);
        assertThat(calls).hasValue(1);
        assertThat(auth.getPassword()).isEqualTo("pw|enc");
        assertThat(config.doDecrypt(DECRYPT)).isSameAs(config);
        assertThat(auth.getPassword()).isEqualTo("pw");

        GraphQLDatasourceConfig noAuth = graphql(null);
        assertThat(noAuth.doEncrypt(counting(calls))).isSameAs(noAuth);
        assertThat(noAuth.doDecrypt(counting(calls))).isSameAs(noAuth);
        assertThat(calls).as("no auth: function never called").hasValue(1);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] graphql encrypt/decrypt reached auth once");
    }

    @Test
    void fromReturnsSameInstanceOrNull() {
        RestApiDatasourceConfig rest = rest(null, null);
        GraphQLDatasourceConfig graphql = graphql(null);

        assertThat(RestApiDatasourceConfig.from(rest)).isSameAs(rest);
        assertThat(RestApiDatasourceConfig.from(graphql)).isNull();
        assertThat(GraphQLDatasourceConfig.from(graphql)).isSameAs(graphql);
        assertThat(GraphQLDatasourceConfig.from(rest)).isNull();
        System.out.println("[DatasourceConfigMergeAndCryptoTest] from() casts or returns null");
    }

    // ---- BasicAuthConfig ----

    static Stream<Arguments> basicMergeCases() {
        Supplier<AuthConfig> noPassword = () -> basic("user2", null);
        Supplier<AuthConfig> newPassword = () -> basic("user2", NEW_PASSWORD);
        return Stream.of(
                Arguments.of("update without password keeps stored", noPassword, "user2", STORED_PASSWORD),
                Arguments.of("update with password replaces stored", newPassword, "user2", NEW_PASSWORD));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("basicMergeCases")
    void basicAuthMergeKeepsOldPasswordOnlyWhenUpdateHasNone(String label, Supplier<AuthConfig> update, String expectedUser, String expectedPassword) {
        AuthConfig merged = basic("user1", STORED_PASSWORD).mergeWithUpdatedConfig(update.get());

        BasicAuthConfig basic = (BasicAuthConfig) merged;
        assertThat(basic.getUsername()).isEqualTo(expectedUser);
        assertThat(basic.getPassword()).isEqualTo(expectedPassword);
        assertThat(basic.getType()).isEqualTo(RestApiAuthType.BASIC_AUTH);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] basic merge: " + label);
    }

    @Test
    void basicAuthMergeReturnsUpdatedConfigWhenTypeChangedOrCleared() {
        OAuthInheritAuthConfig other = inherit("auth-1");

        assertThat(basic("user1", STORED_PASSWORD).mergeWithUpdatedConfig(other)).isSameAs(other);
        assertThat(basic("user1", STORED_PASSWORD).mergeWithUpdatedConfig(null)).isNull();
        System.out.println("[DatasourceConfigMergeAndCryptoTest] basic merge with another auth type returns the update as is");
    }

    @Test
    void basicAuthEncryptAndDecryptTransformThePassword() {
        BasicAuthConfig auth = basic("user", "pw");

        auth.doEncrypt(ENCRYPT);
        assertThat(auth.getPassword()).isEqualTo("pw|enc");
        auth.doDecrypt(DECRYPT);
        assertThat(auth.getPassword()).isEqualTo("pw");
        assertThat(auth.getUsername()).isEqualTo("user");
        System.out.println("[DatasourceConfigMergeAndCryptoTest] basic auth password encrypt/decrypt roundtrip");
    }

    // ---- OAuthInheritAuthConfig ----

    static Stream<Arguments> inheritMergeCases() {
        OAuthInheritAuthConfig sameTypeUpdate = inherit("auth-new");
        BasicAuthConfig otherType = basic("u", "p");
        return Stream.of(
                Arguments.of("same type: update's authId, new instance", sameTypeUpdate, false, "auth-new"),
                Arguments.of("other type: update returned as is", otherType, true, null),
                Arguments.of("null update: null", null, true, null));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("inheritMergeCases")
    void oauthInheritMerge(String label, AuthConfig update, boolean returnedAsIs, String expectedAuthId) {
        AuthConfig merged = inherit("auth-old").mergeWithUpdatedConfig(update);

        if (returnedAsIs) {
            assertThat(merged).isSameAs(update);
        } else {
            assertThat(merged).isNotSameAs(update).isInstanceOf(OAuthInheritAuthConfig.class);
            assertThat(((OAuthInheritAuthConfig) merged).getAuthId()).isEqualTo(expectedAuthId);
            assertThat(merged.getType()).isEqualTo(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN);
        }
        System.out.println("[DatasourceConfigMergeAndCryptoTest] oauth inherit merge: " + label);
    }

    // ---- VerifySelfSignedCertSslConfig ----

    static Stream<Arguments> selfSignedMergeCases() {
        DisableVerifySslConfig disabled = new DisableVerifySslConfig(SslCertVerificationType.DISABLED);
        return Stream.of(
                Arguments.of("update without cert keeps stored cert", selfSigned(null), false, STORED_CERT),
                Arguments.of("update with cert replaces stored cert", selfSigned(NEW_CERT), false, NEW_CERT),
                Arguments.of("update of another ssl type returned as is", disabled, true, null),
                Arguments.of("null update returned as is", null, true, null));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("selfSignedMergeCases")
    void selfSignedSslMerge(String label, SslConfig update, boolean returnedAsIs, String expectedCert) {
        SslConfig merged = selfSigned(STORED_CERT).mergeWithUpdatedConfig(update);

        if (returnedAsIs) {
            assertThat(merged).isSameAs(update);
        } else {
            assertThat(merged).isInstanceOf(VerifySelfSignedCertSslConfig.class);
            assertThat(((VerifySelfSignedCertSslConfig) merged).getSelfSignedCert()).isEqualTo(expectedCert);
            assertThat(merged.getSslCertVerificationType()).isEqualTo(SslCertVerificationType.VERIFY_SELF_SIGNED_CERT);
        }
        System.out.println("[DatasourceConfigMergeAndCryptoTest] self-signed ssl merge: " + label);
    }

    @Test
    void selfSignedSslEncryptAndDecryptTransformTheCert() {
        VerifySelfSignedCertSslConfig ssl = selfSigned("cert");

        ssl.doEncrypt(ENCRYPT);
        assertThat(ssl.getSelfSignedCert()).isEqualTo("cert|enc");
        ssl.doDecrypt(DECRYPT);
        assertThat(ssl.getSelfSignedCert()).isEqualTo("cert");
        System.out.println("[DatasourceConfigMergeAndCryptoTest] self-signed cert encrypt/decrypt roundtrip");
    }

    // ---- Oauth2SimpleAuthConfig ----

    private static Oauth2SimpleAuthConfig simple(String authType, String clientSecret) {
        return Oauth2SimpleAuthConfig.builder().authType(authType).clientId(CLIENT_ID).clientSecret(clientSecret).build();
    }

    static Stream<Arguments> authorizeUrlCases() {
        return Stream.of(
                Arguments.of(AuthTypeConstants.GOOGLE, Oauth2Constants.GOOGLE_AUTHORIZE_URL),
                Arguments.of(AuthTypeConstants.GITHUB, Oauth2Constants.GITHUB_AUTHORIZE_URL),
                Arguments.of(AuthTypeConstants.ORY, Oauth2Constants.ORY_AUTHORIZE_URL),
                Arguments.of(AuthTypeConstants.KEYCLOAK, Oauth2Constants.KEYCLOAK_AUTHORIZE_URL),
                Arguments.of(AuthTypeConstants.GENERIC, Oauth2Constants.GENERIC_AUTHORIZE_URL));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("authorizeUrlCases")
    void oauth2SimpleAuthorizeUrlSubstitutesOnlyTheClientId(String authType, String template) {
        String url = simple(authType, OLD_SECRET).getAuthorizeUrl();

        assertThat(url).isEqualTo(template.replace(Oauth2Constants.CLIENT_ID_PLACEHOLDER, CLIENT_ID));
        assertThat(url).contains("client_id=" + CLIENT_ID).doesNotContain(Oauth2Constants.CLIENT_ID_PLACEHOLDER);
        assertThat(url).as("redirect url and state are rendered by the front end").contains(Oauth2Constants.REDIRECT_URL_PLACEHOLDER)
                .contains(Oauth2Constants.STATE_PLACEHOLDER);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] authorize url " + authType + ": " + url);
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {AuthTypeConstants.FORM, "UNKNOWN"})
    void oauth2SimpleAuthorizeUrlIsNullForOtherAuthTypes(String authType) {
        assertThat(simple(authType, OLD_SECRET).getAuthorizeUrl()).isNull();
        System.out.println("[DatasourceConfigMergeAndCryptoTest] no authorize url for " + authType);
    }

    @ParameterizedTest(name = "[{index}] blank secret: \"{0}\"")
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void oauth2SimpleMergeKeepsOldClientSecretWhenBlank(String blankSecret) {
        Oauth2SimpleAuthConfig updated = simple(AuthTypeConstants.GITHUB, blankSecret);

        updated.merge(simple(AuthTypeConstants.GITHUB, OLD_SECRET));

        assertThat(updated.getClientSecret()).isEqualTo(OLD_SECRET);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] blank client secret replaced by the old one");
    }

    @Test
    void oauth2SimpleMergeKeepsNewSecretAndIgnoresOldConfigOfAnotherClass() {
        Oauth2SimpleAuthConfig withSecret = simple(AuthTypeConstants.GITHUB, NEW_SECRET);
        withSecret.merge(simple(AuthTypeConstants.GITHUB, OLD_SECRET));
        assertThat(withSecret.getClientSecret()).isEqualTo(NEW_SECRET);

        Oauth2SimpleAuthConfig blank = simple(AuthTypeConstants.GITHUB, null);
        AbstractAuthConfig other = EmailAuthConfig.builder().id("email").build();
        blank.merge(other);
        assertThat(blank.getClientSecret()).isNull();
        System.out.println("[DatasourceConfigMergeAndCryptoTest] new client secret kept; other config class ignored");
    }

    @Test
    void oauth2SimpleEncryptAndDecryptTransformTheClientSecret() {
        Oauth2SimpleAuthConfig config = simple(AuthTypeConstants.GITHUB, "secret");

        config.doEncrypt(ENCRYPT);
        assertThat(config.getClientSecret()).isEqualTo("secret|enc");
        config.doDecrypt(DECRYPT);
        assertThat(config.getClientSecret()).isEqualTo("secret");
        System.out.println("[DatasourceConfigMergeAndCryptoTest] client secret encrypt/decrypt roundtrip");
    }

    // ---- SslHelper ----

    @ParameterizedTest(name = "[{index}] blank certificate: \"{0}\"")
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\n"})
    void parseCertificateRejectsBlankInput(String blank) {
        assertThatThrownBy(() -> SslHelper.parseCertificate(blank))
                .isInstanceOfSatisfying(BizException.class, e -> assertThat(e.getError()).isEqualTo(BizError.CERTIFICATE_IS_EMPTY));
        System.out.println("[DatasourceConfigMergeAndCryptoTest] blank certificate rejected");
    }

    @Test
    void parseCertificateAcceptsPemWithAndWithoutMarkerLines() throws CertificateException {
        X509Certificate withMarkers = SslHelper.parseCertificate(TEST_CERT_PEM);
        String bare = TEST_CERT_PEM.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "");
        X509Certificate withoutMarkers = SslHelper.parseCertificate(bare);

        assertThat(withMarkers.getSubjectX500Principal().getName()).isEqualTo(TEST_CERT_SUBJECT);
        assertThat(withoutMarkers).isEqualTo(withMarkers);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] parsed " + withMarkers.getSubjectX500Principal());
    }

    @Test
    void parseCertificateRejectsGarbage() {
        assertThatThrownBy(() -> SslHelper.parseCertificate("bm90IGEgY2VydGlmaWNhdGU="))
                .isInstanceOf(CertificateException.class);
        System.out.println("[DatasourceConfigMergeAndCryptoTest] base64 garbage rejected with CertificateException");
    }
}

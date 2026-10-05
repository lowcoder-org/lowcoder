package org.lowcoder.api.authentication.request.oauth2.request;

import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.api.authentication.request.oauth2.request.OauthProviderStubs.*;

import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;

import com.github.tomakehurst.wiremock.http.RequestMethod;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Failure and edge branches of the OAuth provider requests, against WireMock (dynamic port) and, for the fixed
 * {@code https} GitHub/Google endpoints, the existing {@link OauthProviderStubs#redirectTo} (read-only reuse). The
 * happy paths and the plain {@code error} bodies are pinned by the two {@code OauthProvider*ContractTest} classes;
 * this class covers what they leave out: an {@code error_description}-only body, the id-token-only user path of the
 * Generic provider, the form-encoded GitHub parser and a malformed Ory/Keycloak base URL.
 *
 * <p>Pinned under D-6: plan §9 row "malformed admin auth-config input fails with raw exceptions instead of a coded
 * error" (a malformed Ory/Keycloak {@code baseUrl}).
 */
@WireMockTest
class OauthProviderFailureTest {

    private static final String ERROR_DESCRIPTION_ONLY = "{\"error_description\":\"the code was already used\"}";
    private static final String ACCESS_TOKEN = "at.failure.0001";
    private static final String BEARER = "Bearer " + ACCESS_TOKEN;
    private static final String MALFORMED_BASE_URL = "http://bad host";

    private static AuthToken token() {
        return AuthToken.builder().accessToken(ACCESS_TOKEN).build();
    }

    private static void stubAnyMethod(WireMockRuntimeInfo wireMock, String path, int status, String body) {
        wireMock.getWireMock().register(any(urlPathEqualTo(path))
                .willReturn(com.github.tomakehurst.wiremock.client.WireMock.aResponse().withStatus(status)
                        .withHeader(CONTENT_TYPE, "application/json").withBody(body)));
    }

    private static void expectAuthException(String site, Mono<?> call) {
        StepVerifier.create(call)
                .expectErrorSatisfies(e -> {
                    assertThat(e).as(site).isInstanceOf(AuthException.class);
                    assertThat(e.getMessage()).contains("the code was already used");
                })
                .verify(BLOCK_TIMEOUT);
        System.out.println("[OauthProviderFailureTest] " + site + " rejected the error_description-only body");
    }

    private static String jwt(String payload) {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        return encoder.encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8)) + "."
                + encoder.encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + ".sig";
    }

    private static Oauth2GenericAuthConfig genericWithUserEndpointMethod(String baseUrl, boolean post) {
        HashMap<String, String> mappings = new HashMap<>();
        mappings.put("uid", "sub");
        return Oauth2GenericAuthConfig.builder()
                .authType(AuthTypeConstants.GENERIC).source("GENERIC").sourceName("Generic IdP").enable(true).enableRegister(true)
                .clientId(CLIENT_ID).clientSecret(CLIENT_SECRET).scope(SCOPE)
                .tokenEndpoint(baseUrl + GENERIC_TOKEN_PATH).userInfoEndpoint(baseUrl + GENERIC_USER_PATH)
                .sourceMappings(mappings).userInfoIntrospection(true).postForUserEndpoint(post).build();
    }

    // ---------------------------------------------------------------- Generic

    /** Catches an {@code error_description}-only body (no {@code error} key) being taken for a token or a user. */
    @Test
    void generic_errorDescriptionOnly_isAnAuthException_atTokenRefreshAndUserInfo(WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), true));
        stubJson(wireMock, RequestMethod.POST, GENERIC_TOKEN_PATH, OK, ERROR_DESCRIPTION_ONLY);
        stubJson(wireMock, RequestMethod.GET, GENERIC_USER_PATH, OK, ERROR_DESCRIPTION_ONLY);

        expectAuthException("Generic token", request.getAuthToken(context()));
        expectAuthException("Generic refresh", request.refreshAuthToken(REFRESH_TOKEN));
        expectAuthException("Generic user info", request.getAuthUser(token()));
    }

    /**
     * Catches the user being built from nothing, or the user endpoint being called when introspection is off:
     * with introspection off the user comes from the id token's claims alone.
     */
    @Test
    void generic_introspectionOff_usesTheIdTokenClaims_withoutCallingTheUserEndpoint(WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), false));
        AuthToken withJwt = AuthToken.builder().accessToken(ACCESS_TOKEN).jwt(jwt(
                "{\"sub\":\"u-1\",\"preferred_username\":\"neo\",\"email\":\"neo@example.com\",\"picture\":\"https://pic\",\"groups\":[\"g1\"]}")).build();

        AuthUser user = request.getAuthUser(withJwt).block(BLOCK_TIMEOUT);

        assertThat(user.getUid()).isEqualTo("u-1");
        assertThat(user.getUsername()).isEqualTo("neo");
        assertThat(user.getEmail()).isEqualTo("neo@example.com");
        assertThat(user.getAvatar()).isEqualTo("https://pic");
        assertThat(user.getGroupId()).isEqualTo("g1");
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("no request to the provider").isEmpty();
        System.out.println("[OauthProviderFailureTest] introspection off: " + user.getUid() + "/" + user.getUsername() + " from the id token, no HTTP request");
    }

    /** Catches a user being created without any identity proof: no JWT, or one that cannot be decoded, is an AuthException. */
    @ParameterizedTest(name = "jwt [{0}]")
    @ValueSource(strings = {"", "not-a-jwt", "a.b-not-base64!.c"})
    void generic_introspectionOff_withoutADecodableJwt_failsWithNoJwtToken(String jwt, WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), false));
        AuthToken token = AuthToken.builder().accessToken(ACCESS_TOKEN).jwt(jwt.isEmpty() ? null : jwt).build();

        StepVerifier.create(request.getAuthUser(token))
                .expectErrorSatisfies(e -> assertThat(e).isInstanceOf(AuthException.class).hasMessage("No JWT token found"))
                .verify(BLOCK_TIMEOUT);
        System.out.println("[OauthProviderFailureTest] jwt [" + jwt + "] -> AuthException: No JWT token found");
    }

    /** Catches the user endpoint being called with the wrong method, or without the bearer token. */
    @ParameterizedTest(name = "postForUserEndpoint={0}")
    @ValueSource(booleans = {true, false})
    void generic_userEndpoint_usesPostOrGet_withTheBearerToken(boolean post, WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(genericWithUserEndpointMethod(wireMock.getHttpBaseUrl(), post));
        stubAnyMethod(wireMock, GENERIC_USER_PATH, OK, "{\"sub\":\"u-2\"}");

        AuthUser user = request.getAuthUser(token()).block(BLOCK_TIMEOUT);

        assertThat(user.getUid()).isEqualTo("u-2");
        if (post) {
            wireMock.getWireMock().verifyThat(1, postRequestedFor(urlPathEqualTo(GENERIC_USER_PATH)).withHeader("Authorization", equalTo(BEARER)));
            wireMock.getWireMock().verifyThat(0, getRequestedFor(urlPathEqualTo(GENERIC_USER_PATH)));
        } else {
            wireMock.getWireMock().verifyThat(1, getRequestedFor(urlPathEqualTo(GENERIC_USER_PATH)).withHeader("Authorization", equalTo(BEARER)));
            wireMock.getWireMock().verifyThat(0, postRequestedFor(urlPathEqualTo(GENERIC_USER_PATH)));
        }
        System.out.println("[OauthProviderFailureTest] user endpoint called with " + (post ? "POST" : "GET") + " and the bearer token");
    }

    // ------------------------------------------------- Ory, Keycloak, Google

    private void assertThreeSitesRejectErrorDescription(String provider, AbstractOauth2Request<?> request) {
        expectAuthException(provider + " token", request.getAuthToken(context()));
        expectAuthException(provider + " refresh", request.refreshAuthToken(REFRESH_TOKEN));
        expectAuthException(provider + " user info", request.getAuthUser(token()));
    }

    /** Catches an {@code error_description}-only body being taken for a token or a user (Ory). */
    @Test
    void ory_errorDescriptionOnly_isRejectedAtTokenRefreshAndUserInfo(WireMockRuntimeInfo wireMock) {
        stubAnyMethod(wireMock, ORY_TOKEN_PATH, BAD_REQUEST, ERROR_DESCRIPTION_ONLY);
        stubAnyMethod(wireMock, ORY_USER_PATH, BAD_REQUEST, ERROR_DESCRIPTION_ONLY);

        assertThreeSitesRejectErrorDescription("Ory", new OryRequest(ory(wireMock.getHttpBaseUrl())));
    }

    /** Same for Keycloak. */
    @Test
    void keycloak_errorDescriptionOnly_isRejectedAtTokenRefreshAndUserInfo(WireMockRuntimeInfo wireMock) {
        stubAnyMethod(wireMock, KEYCLOAK_TOKEN_PATH, BAD_REQUEST, ERROR_DESCRIPTION_ONLY);
        stubAnyMethod(wireMock, KEYCLOAK_USER_PATH, BAD_REQUEST, ERROR_DESCRIPTION_ONLY);

        assertThreeSitesRejectErrorDescription("Keycloak", new KeycloakRequest(keycloak(wireMock.getHttpBaseUrl())));
    }

    /** Same for Google, whose fixed https endpoints are redirected to WireMock. */
    @Test
    void google_errorDescriptionOnly_isRejectedAtTokenRefreshAndUserInfo(WireMockRuntimeInfo wireMock) {
        stubAnyMethod(wireMock, GOOGLE_TOKEN_PATH, BAD_REQUEST, ERROR_DESCRIPTION_ONLY);
        stubAnyMethod(wireMock, GOOGLE_USER_PATH, BAD_REQUEST, ERROR_DESCRIPTION_ONLY);
        GoogleRequest request = new GoogleRequest(simple(AuthTypeConstants.GOOGLE));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            assertThreeSitesRejectErrorDescription("Google", request);
        }
    }

    /**
     * Pins plan §9 row "malformed admin auth-config input fails with raw exceptions instead of a coded error": an
     * Ory/Keycloak {@code baseUrl} that is not a valid URI makes {@code getAuthToken} and {@code refreshAuthToken}
     * throw a {@code RuntimeException(URISyntaxException)} synchronously, instead of returning a failed Mono or
     * raising a coded error. A fix changes this test on purpose.
     */
    @Test
    void oryAndKeycloak_malformedBaseUrl_throwRawRuntimeExceptionSynchronously_pinsRawExceptionDefect() {
        OryRequest ory = new OryRequest(ory(MALFORMED_BASE_URL));
        KeycloakRequest keycloak = new KeycloakRequest(keycloak(MALFORMED_BASE_URL));

        assertThatThrownBy(() -> ory.getAuthToken(context())).isExactlyInstanceOf(RuntimeException.class).hasCauseInstanceOf(URISyntaxException.class);
        assertThatThrownBy(() -> ory.refreshAuthToken(REFRESH_TOKEN)).isExactlyInstanceOf(RuntimeException.class).hasCauseInstanceOf(URISyntaxException.class);
        assertThatThrownBy(() -> keycloak.getAuthToken(context())).isExactlyInstanceOf(RuntimeException.class).hasCauseInstanceOf(URISyntaxException.class);
        assertThatThrownBy(() -> keycloak.refreshAuthToken(REFRESH_TOKEN)).isExactlyInstanceOf(RuntimeException.class).hasCauseInstanceOf(URISyntaxException.class);
        System.out.println("[OauthProviderFailureTest] baseUrl '" + MALFORMED_BASE_URL + "' -> RuntimeException(URISyntaxException) from all four sites");
    }

    // ----------------------------------------------------------------- GitHub

    private static Stream<Arguments> githubTokenBodies() {
        return Stream.of(
                Arguments.of("access_token=t1&scope=read%3Auser&token_type=bearer", "t1"),
                Arguments.of("   ", null),
                Arguments.of("a=b&&access_token=t2", "t2"),
                Arguments.of("access_token=a=b", null));
    }

    /**
     * GitHub answers the token request form-encoded; {@code parseStringToMap} turns it into the map the code reads.
     * Pinned as behaviour (coordinator ruling): a value containing {@code =} (three parts) is dropped to null, and
     * GitHub access tokens contain no {@code =}; a whitespace-only body parses to an empty map (a token without access
     * token); blank items between {@code &} are skipped.
     */
    @ParameterizedTest(name = "body [{0}] -> access token {1}")
    @MethodSource("githubTokenBodies")
    void github_tokenResponseParsing(String body, String expectedAccessToken, WireMockRuntimeInfo wireMock) {
        stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, body);
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            AuthToken parsed = request.getAuthToken(context()).block(BLOCK_TIMEOUT);

            assertThat(parsed).isNotNull();
            assertThat(parsed.getAccessToken()).isEqualTo(expectedAccessToken);
        }
        System.out.println("[OauthProviderFailureTest] GitHub token body [" + body + "] -> accessToken " + expectedAccessToken);
    }

    /**
     * Pins the plan §9 row "GithubRequest.getAuthToken: an empty token response body ... the login completes empty"
     * (D-6): an empty response body makes {@code bodyToMono(String.class)} complete without a value, so
     * {@code getAuthToken} emits neither a token nor an error (the Mono is empty, not a token without access token,
     * and not an auth error). A fix changes this test on purpose.
     */
    @Test
    void github_blankTokenResponse_emitsNothing(WireMockRuntimeInfo wireMock) {
        stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, "");
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            assertThat(request.getAuthToken(context()).block(BLOCK_TIMEOUT)).isNull();
        }
        System.out.println("[OauthProviderFailureTest] GitHub blank token response -> empty Mono (no token, no error)");
    }

    /** A key without a value ({@code error}) is still an error response: the key is present with a null value. */
    @Test
    void github_tokenResponseWithAValuelessErrorKey_isAnAuthException(WireMockRuntimeInfo wireMock) {
        stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, "error");
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            StepVerifier.create(request.getAuthToken(context())).expectError(AuthException.class).verify(BLOCK_TIMEOUT);
        }
        System.out.println("[OauthProviderFailureTest] GitHub body 'error' -> AuthException");
    }

    /** Catches the username choice: the email when GitHub returns one, otherwise the login. */
    @ParameterizedTest(name = "email {0} -> username {1}")
    @MethodSource("githubUsers")
    void github_getAuthUser_usernameIsTheEmailOtherwiseTheLogin(String userJson, String expectedUsername, WireMockRuntimeInfo wireMock) {
        stubJson(wireMock, RequestMethod.GET, GITHUB_USER_PATH, OK, userJson);
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            AuthUser user = request.getAuthUser(token()).block(BLOCK_TIMEOUT);

            assertThat(user.getUid()).isEqualTo("42");
            assertThat(user.getUsername()).isEqualTo(expectedUsername);
            assertThat(user.getAvatar()).isEqualTo("https://avatars/42");
        }
        System.out.println("[OauthProviderFailureTest] GitHub user " + userJson + " -> username " + expectedUsername);
    }

    /** Catches a GitHub user-info error body being mapped as a user: an {@code error} key is an AuthException. */
    @Test
    void github_getAuthUser_errorBody_isAnAuthException(WireMockRuntimeInfo wireMock) {
        stubJson(wireMock, RequestMethod.GET, GITHUB_USER_PATH, OK, "{\"error\":\"bad_credentials\",\"id\":42}");
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            StepVerifier.create(request.getAuthUser(token())).expectError(AuthException.class).verify(BLOCK_TIMEOUT);
        }
        System.out.println("[OauthProviderFailureTest] GitHub user info with an error key -> AuthException");
    }

    private static Stream<Arguments> githubUsers() {
        return Stream.of(
                Arguments.of("{\"id\":42,\"login\":\"octo\",\"avatar_url\":\"https://avatars/42\"}", "octo"),
                Arguments.of("{\"id\":42,\"login\":\"octo\",\"email\":\"octo@example.com\",\"avatar_url\":\"https://avatars/42\"}", "octo@example.com"));
    }
}

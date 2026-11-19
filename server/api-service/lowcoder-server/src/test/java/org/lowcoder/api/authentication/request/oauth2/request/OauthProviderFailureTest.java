package org.lowcoder.api.authentication.request.oauth2.request;

import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.api.authentication.request.oauth2.request.OauthProviderStubs.*;

import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.request.oauth2.Oauth2AuthRequestFactory;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
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
 * <p>BF-108 (fixed; was pinned under D-6 as the plan §9 row "malformed admin auth-config input fails with raw exceptions
 * instead of a coded error"): a malformed Ory/Keycloak {@code baseUrl} fails the Mono instead of throwing.
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

    private static Oauth2GenericAuthConfig genericWithMapping(String baseUrl, boolean userInfoIntrospection, String attribute, String mapping) {
        Oauth2GenericAuthConfig config = generic(baseUrl, userInfoIntrospection);
        config.getSourceMappings().put(attribute, mapping);
        return config;
    }

    private static Stream<Arguments> uidMappingsThatFindNothing() {
        return Stream.of(
                Arguments.of("sub[x]", false), Arguments.of("sub[x]", true),   // malformed index (BF-074)
                Arguments.of("subject", false), Arguments.of("subject", true)); // a claim the IdP does not send
    }

    /**
     * BF-074: a uid mapping that finds nothing, a malformed index included (which threw a raw NumberFormatException
     * before), fails the login with an {@link AuthException}, from the id token alone and with the user endpoint, instead
     * of building a user without a uid, whom the login would look up with a null uid.
     */
    @ParameterizedTest(name = "uid mapping {0}, introspection {1}")
    @MethodSource("uidMappingsThatFindNothing")
    void generic_aUidMappingThatFindsNothing_isAnAuthExceptionBF074(String uidMapping, boolean introspection, WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(genericWithMapping(wireMock.getHttpBaseUrl(), introspection, "uid", uidMapping));
        stubJson(wireMock, RequestMethod.GET, GENERIC_USER_PATH, OK, "{\"sub\":\"u-2\",\"email\":\"two@example.com\"}");
        AuthToken withJwt = AuthToken.builder().accessToken(ACCESS_TOKEN).jwt(jwt("{\"sub\":\"u-1\",\"email\":\"one@example.com\"}")).build();

        StepVerifier.create(request.getAuthUser(withJwt))
                .expectErrorSatisfies(e -> assertThat(e).isInstanceOf(AuthException.class).hasMessage(GenericAuthRequest.NO_UID))
                .verify(BLOCK_TIMEOUT);
        System.out.println("[OauthProviderFailureTest] uid mapping " + uidMapping + ", introspection " + introspection + " -> AuthException " + GenericAuthRequest.NO_UID);
    }

    /** BF-074: a blank uid claim is refused like a missing one. */
    @Test
    void generic_aBlankUidClaim_isAnAuthExceptionBF074(WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), false));
        AuthToken withJwt = AuthToken.builder().accessToken(ACCESS_TOKEN).jwt(jwt("{\"sub\":\"  \",\"email\":\"one@example.com\"}")).build();

        StepVerifier.create(request.getAuthUser(withJwt))
                .expectErrorSatisfies(e -> assertThat(e).isInstanceOf(AuthException.class).hasMessage(GenericAuthRequest.NO_UID))
                .verify(BLOCK_TIMEOUT);
        System.out.println("[OauthProviderFailureTest] blank sub -> AuthException " + GenericAuthRequest.NO_UID);
    }

    /**
     * BF-074 as the login sees it: a malformed index in another mapping ({@code avatar}) leaves that attribute empty and
     * the user is built, where the raw exception failed every login of the provider.
     */
    @Test
    void generic_aMalformedIndexInTheAvatarMapping_leavesTheAvatarEmptyBF074(WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(genericWithMapping(wireMock.getHttpBaseUrl(), false, "avatar", "picture[x]"));
        AuthToken withJwt = AuthToken.builder().accessToken(ACCESS_TOKEN).jwt(jwt("{\"sub\":\"u-1\",\"picture\":\"https://pic\"}")).build();

        AuthUser user = request.getAuthUser(withJwt).block(BLOCK_TIMEOUT);

        System.out.println("[OauthProviderFailureTest] avatar mapping picture[x] -> uid " + user.getUid() + ", avatar " + user.getAvatar());
        assertThat(user.getUid()).isEqualTo("u-1");
        assertThat(user.getAvatar()).isNull();
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

    private static Stream<Arguments> malformedBaseUrlSites() {
        OryRequest ory = new OryRequest(ory(MALFORMED_BASE_URL));
        KeycloakRequest keycloak = new KeycloakRequest(keycloak(MALFORMED_BASE_URL));
        return Stream.of(
                Arguments.of("Ory getAuthToken", (Supplier<Mono<?>>) () -> ory.getAuthToken(context())),
                Arguments.of("Ory refreshAuthToken", (Supplier<Mono<?>>) () -> ory.refreshAuthToken(REFRESH_TOKEN)),
                Arguments.of("Keycloak getAuthToken", (Supplier<Mono<?>>) () -> keycloak.getAuthToken(context())),
                Arguments.of("Keycloak refreshAuthToken", (Supplier<Mono<?>>) () -> keycloak.refreshAuthToken(REFRESH_TOKEN)));
    }

    /**
     * BF-108 (fixed; was pinned as the plan §9 row "malformed admin auth-config input fails with raw exceptions instead of
     * a coded error"): an Ory/Keycloak {@code baseUrl} that is not a valid URI fails the Mono with the
     * {@link URISyntaxException}; {@code getAuthToken} and {@code refreshAuthToken} threw a
     * {@code RuntimeException(URISyntaxException)} synchronously.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("malformedBaseUrlSites")
    void oryAndKeycloak_malformedBaseUrl_failTheMonoBF108(String site, Supplier<Mono<?>> call) {
        Mono<?> mono = call.get();

        StepVerifier.create(mono).expectError(URISyntaxException.class).verify(BLOCK_TIMEOUT);
        System.out.println("[OauthProviderFailureTest] baseUrl '" + MALFORMED_BASE_URL + "', " + site + " -> failed Mono (URISyntaxException)");
    }

    /**
     * BF-108 as the login and the session refresh see it: {@code auth} and {@code refresh} answer a malformed
     * {@code baseUrl} with FAIL_TO_GET_OIDC_INFO, carrying the URI error; the synchronous throw passed their error mapping by.
     */
    @Test
    void oryAndKeycloak_malformedBaseUrl_failAuthAndRefreshWithFailToGetOidcInfoBF108() {
        Map<String, AbstractOauth2Request<?>> requests = Map.of(
                "Ory", new OryRequest(ory(MALFORMED_BASE_URL)), "Keycloak", new KeycloakRequest(keycloak(MALFORMED_BASE_URL)));

        requests.forEach((provider, request) -> {
            for (Mono<AuthUser> call : List.of(request.auth(context()), request.refresh(REFRESH_TOKEN))) {
                StepVerifier.create(call)
                        .expectErrorSatisfies(e -> {
                            System.out.println("[OauthProviderFailureTest] " + provider + " baseUrl '" + MALFORMED_BASE_URL + "' -> " + e);
                            assertThat(e).isInstanceOf(BizException.class);
                            assertThat(((BizException) e).getError()).isEqualTo(BizError.FAIL_TO_GET_OIDC_INFO);
                            assertThat(e.getMessage()).contains(MALFORMED_BASE_URL);
                        })
                        .verify(BLOCK_TIMEOUT);
            }
        });
    }

    // ----------------------------------------------------------------- GitHub

    private static Stream<Arguments> githubTokenBodies() {
        return Stream.of(
                Arguments.of("access_token=t1&scope=read%3Auser&token_type=bearer", "t1"),
                Arguments.of("a=b&&access_token=t2", "t2"));
    }

    private static Stream<String> githubTokenBodiesWithoutAnAccessToken() {
        return Stream.of("", "   ", "access_token=a=b", "access_token=", "scope=read%3Auser&token_type=bearer");
    }

    /**
     * GitHub answers the token request form-encoded; {@code parseStringToMap} turns it into the map the code reads.
     * Blank items between {@code &} are skipped. A body the parser reads no access token from (a value containing
     * {@code =}, which GitHub access tokens do not contain, is dropped to null; a whitespace-only body is an empty map)
     * is refused: see {@link #github_tokenResponseWithoutAnAccessToken_isAnAuthExceptionBF073}.
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
     * BF-073 (fixed; was pinned as the plan §9 row "GithubRequest.getAuthToken: an empty token response body ... the
     * login completes empty"): an answer without an access token, an empty body included (which completed without a
     * value), fails with an {@link AuthException}.
     */
    @ParameterizedTest(name = "body [{0}]")
    @MethodSource("githubTokenBodiesWithoutAnAccessToken")
    void github_tokenResponseWithoutAnAccessToken_isAnAuthExceptionBF073(String body, WireMockRuntimeInfo wireMock) {
        stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, body);
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            StepVerifier.create(request.getAuthToken(context()))
                    .expectErrorSatisfies(e -> assertThat(e).isInstanceOf(AuthException.class).hasMessage(GithubRequest.NO_ACCESS_TOKEN))
                    .verify(BLOCK_TIMEOUT);
        }
        System.out.println("[OauthProviderFailureTest] GitHub token body [" + body + "] -> AuthException " + GithubRequest.NO_ACCESS_TOKEN);
    }

    /**
     * BF-073 as the login sees it: {@code auth} turns an answer without an access token into FAIL_TO_GET_OIDC_INFO, which
     * the login endpoints answer as an error, and the failure is the token step's ({@code NO_ACCESS_TOKEN} in the
     * message). Before, an empty answer completed empty (answered as a success without a session), and the other answers
     * went on to the user step with {@code token null} and failed there.
     * <p>
     * Limits: {@code auth} runs the user step on its own thread pool, where the static {@link OauthProviderStubs#redirectTo} mock does not
     * apply, so whether the user endpoint was asked is read from the message, not from WireMock's request journal.
     */
    @ParameterizedTest(name = "body [{0}]")
    @MethodSource("githubTokenBodiesWithoutAnAccessToken")
    void github_tokenResponseWithoutAnAccessToken_failsTheAuthInTheTokenStepBF073(String body, WireMockRuntimeInfo wireMock) {
        stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, body);
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));

        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            StepVerifier.create(request.auth(context()))
                    .expectErrorSatisfies(e -> {
                        System.out.println("[OauthProviderFailureTest] GitHub token body [" + body + "], auth -> " + e);
                        assertThat(e).isInstanceOf(BizException.class);
                        assertThat(((BizException) e).getError()).isEqualTo(BizError.FAIL_TO_GET_OIDC_INFO);
                        assertThat(((BizException) e).getMessageKey()).isEqualTo(BizError.FAIL_TO_GET_OIDC_INFO.name());
                        assertThat(e.getMessage()).contains(GithubRequest.NO_ACCESS_TOKEN);
                    })
                    .verify(BLOCK_TIMEOUT);
        }
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

    // ------------------------------------------------- NEW-27: a user without a uid

    private static final String NO_SUB_EMAIL = "nosub@example.com";
    private static final String USER_WITHOUT_SUB = "{\"email\":\"" + NO_SUB_EMAIL + "\"}";
    private static final String USER_WITH_NULL_SUB = "{\"sub\":null,\"email\":\"" + NO_SUB_EMAIL + "\"}";
    private static final String USER_WITH_EMPTY_SUB = "{\"sub\":\"\",\"email\":\"" + NO_SUB_EMAIL + "\"}";
    private static final String USER_WITH_BLANK_SUB = "{\"sub\":\"  \",\"email\":\"" + NO_SUB_EMAIL + "\"}";
    /** A uid with a {@code |} and a trailing space: the controls require it back exactly as sent, untrimmed. */
    private static final String UID_AS_SENT = "auth0|u-27 ";
    private static final String USER_WITH_SUB = "{\"sub\":\"" + UID_AS_SENT + "\",\"email\":\"u27@example.com\"}";
    private static final String GITHUB_WITHOUT_ID = "{\"login\":\"octo\"}";
    private static final String GITHUB_WITH_NULL_ID = "{\"id\":null,\"login\":\"octo\"}";
    private static final String GITHUB_WITH_EMPTY_ID = "{\"id\":\"\",\"login\":\"octo\"}";
    private static final String GITHUB_WITH_BLANK_ID = "{\"id\":\"  \",\"login\":\"octo\"}";
    private static final String GITHUB_UID_AS_SENT = "auth0|42 ";
    private static final String GITHUB_WITH_ID = "{\"id\":\"" + GITHUB_UID_AS_SENT + "\",\"login\":\"octo\"}";
    private static final String TOKEN_ANSWER = "{\"access_token\":\"" + ACCESS_TOKEN + "\",\"expires_in\":300,\"refresh_token\":\"rt.new27\"}";
    private static final List<String> USERS_WITHOUT_A_USABLE_SUB = List.of(USER_WITHOUT_SUB, USER_WITH_NULL_SUB, USER_WITH_EMPTY_SUB, USER_WITH_BLANK_SUB);
    private static final List<String> GITHUB_USERS_WITHOUT_A_USABLE_ID = List.of(GITHUB_WITHOUT_ID, GITHUB_WITH_NULL_ID, GITHUB_WITH_EMPTY_ID, GITHUB_WITH_BLANK_ID);
    /** Legacy GitHub dereferences the id ({@code GithubRequest.java:120}): these two throw before any uid check. */
    private static final List<String> GITHUB_USERS_THAT_THROW = List.of(GITHUB_WITHOUT_ID, GITHUB_WITH_NULL_ID);

    /** The production request for {@code config}: what {@code Oauth2AuthRequestFactory} builds, a GenericAuthRequest for every type. */
    private static AbstractOauth2Request<?> factoryBuilt(AbstractAuthConfig config) {
        OAuth2RequestContext context = context();
        context.setAuthConfig(config);
        AbstractOauth2Request<?> request = (AbstractOauth2Request<?>) new Oauth2AuthRequestFactory().build(context).block(BLOCK_TIMEOUT);
        assertThat(request).as(config.getAuthType() + " request").isInstanceOf(GenericAuthRequest.class);
        return request;
    }

    /**
     * An {@link AbstractOauth2Request} whose token step answers {@link #token()} and whose user step answers a publisher
     * built beforehand: the base class's {@code auth} and {@code refresh} run as for any provider, on its worker thread.
     */
    private static final class Assembled extends AbstractOauth2Request<Oauth2SimpleAuthConfig> {
        private final Mono<AuthUser> user;

        Assembled(Mono<AuthUser> user) {
            super(null, null);
            this.user = user;
        }

        @Override
        protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
            return Mono.just(token());
        }

        @Override
        protected Mono<AuthToken> refreshAuthToken(String refreshToken) {
            return Mono.just(token());
        }

        @Override
        protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
            return user;
        }
    }

    private static void expectFailToGetOidcInfo(String site, Mono<AuthUser> call, String reason) {
        StepVerifier.create(call)
                .expectErrorSatisfies(e -> {
                    System.out.println("[OauthProviderFailureTest] " + site + " -> " + e);
                    assertThat(e).as(site).isInstanceOf(BizException.class);
                    assertThat(((BizException) e).getError()).as(site).isEqualTo(BizError.FAIL_TO_GET_OIDC_INFO);
                    if (reason != null) {
                        assertThat(e.getMessage()).as(site).contains(reason);
                    }
                })
                .verify(BLOCK_TIMEOUT);
    }

    private static AuthUser expectUser(String site, Mono<AuthUser> call) {
        AuthUser user = call.block(BLOCK_TIMEOUT);
        System.out.println("[OauthProviderFailureTest] " + site + " -> uid [" + (user == null ? null : user.getUid()) + "]");
        assertThat(user).as(site).isNotNull();
        return user;
    }

    private static void stubTokenAndUser(WireMockRuntimeInfo wireMock, String tokenPath, String userPath, String userBody) {
        stubAnyMethod(wireMock, tokenPath, OK, TOKEN_ANSWER);
        stubAnyMethod(wireMock, userPath, OK, userBody);
    }

    private static int requestsTo(WireMockRuntimeInfo wireMock, String path) {
        return wireMock.getWireMock().find(anyRequestedFor(urlPathEqualTo(path))).size();
    }

    private static Stream<Arguments> oryAndKeycloakUsersWithoutAUsableSub() {
        Stream.Builder<Arguments> cases = Stream.builder();
        for (String body : USERS_WITHOUT_A_USABLE_SUB) {
            cases.add(Arguments.of(AuthTypeConstants.ORY, body));
            cases.add(Arguments.of(AuthTypeConstants.KEYCLOAK, body));
        }
        return cases.build();
    }

    private static AbstractAuthConfig oryOrKeycloak(String authType, String baseUrl) {
        return AuthTypeConstants.ORY.equals(authType) ? ory(baseUrl) : keycloak(baseUrl);
    }

    private static String tokenPath(String authType) {
        return AuthTypeConstants.ORY.equals(authType) ? ORY_TOKEN_PATH : KEYCLOAK_TOKEN_PATH;
    }

    private static String userPath(String authType) {
        return AuthTypeConstants.ORY.equals(authType) ? ORY_USER_PATH : KEYCLOAK_USER_PATH;
    }

    /**
     * NEW-27 on the production path: an Ory or Keycloak login, through the request the factory builds, whose user
     * information has no usable {@code sub} fails with FAIL_TO_GET_OIDC_INFO carrying Generic's {@code NO_UID} (T67's
     * check), after the user endpoint was asked once, so the login never looks a user up with a null uid.
     */
    @ParameterizedTest(name = "{0}, user {1}")
    @MethodSource("oryAndKeycloakUsersWithoutAUsableSub")
    void factoryBuiltOryAndKeycloakLogins_refuseAUserWithoutAUidNEW27(String authType, String userBody, WireMockRuntimeInfo wireMock) {
        stubTokenAndUser(wireMock, tokenPath(authType), userPath(authType), userBody);
        AbstractOauth2Request<?> request = factoryBuilt(oryOrKeycloak(authType, wireMock.getHttpBaseUrl()));

        expectFailToGetOidcInfo(authType + " factory-built auth, user " + userBody, request.auth(context()), GenericAuthRequest.NO_UID);
        assertThat(requestsTo(wireMock, userPath(authType))).as("user-info requests").isEqualTo(1);
    }

    /** The control: the same exchange with a {@code sub} answers that uid exactly as sent, with the token set. */
    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {AuthTypeConstants.ORY, AuthTypeConstants.KEYCLOAK})
    void factoryBuiltOryAndKeycloakLogins_acceptAUserWithAUid(String authType, WireMockRuntimeInfo wireMock) {
        stubTokenAndUser(wireMock, tokenPath(authType), userPath(authType), USER_WITH_SUB);
        AbstractOauth2Request<?> request = factoryBuilt(oryOrKeycloak(authType, wireMock.getHttpBaseUrl()));

        AuthUser user = expectUser(authType + " factory-built auth, user " + USER_WITH_SUB, request.auth(context()));

        assertThat(user.getUid()).isEqualTo(UID_AS_SENT);
        assertThat(user.getAuthToken().getAccessToken()).isEqualTo(ACCESS_TOKEN);
    }

    private static Stream<Arguments> googleAndGithubUsers() {
        Stream.Builder<Arguments> cases = Stream.builder();
        for (String body : USERS_WITHOUT_A_USABLE_SUB) {
            cases.add(Arguments.of(AuthTypeConstants.GOOGLE, body, null));
        }
        cases.add(Arguments.of(AuthTypeConstants.GOOGLE, USER_WITH_SUB, UID_AS_SENT));
        for (String body : GITHUB_USERS_WITHOUT_A_USABLE_ID) {
            cases.add(Arguments.of(AuthTypeConstants.GITHUB, body, null));
        }
        cases.add(Arguments.of(AuthTypeConstants.GITHUB, GITHUB_WITH_ID, GITHUB_UID_AS_SENT));
        return cases.build();
    }

    private static String fixedUserPath(String authType) {
        return AuthTypeConstants.GOOGLE.equals(authType) ? GOOGLE_USER_PATH : GITHUB_USER_PATH;
    }

    /**
     * Google's and GitHub's user step composed with the base class's {@code auth}: their endpoints are fixed {@code https}
     * URLs, reached only through the thread-local {@link OauthProviderStubs#redirectTo}, which does not apply on
     * {@code auth}'s worker thread, so the provider's real {@code getAuthUser} is built on the test thread under the
     * redirect and handed to {@link Assembled}, and the subscription runs while the redirect is open. Limit: this is the
     * provider's mapping plus the base class's {@code auth} code, not the request's own {@code auth} call.
     */
    private static void composedWithTheBaseAuth(String site, WireMockRuntimeInfo wireMock, String authType, String userBody,
                                                String expectedUid, Function<AuthToken, Mono<AuthUser>> userStep, String reason) {
        stubAnyMethod(wireMock, fixedUserPath(authType), OK, userBody);
        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            Mono<AuthUser> auth = new Assembled(userStep.apply(token())).auth(context());
            if (expectedUid == null) {
                expectFailToGetOidcInfo(site, auth, reason);
            } else {
                assertThat(expectUser(site, auth).getUid()).as(site).isEqualTo(expectedUid);
            }
        }
        assertThat(requestsTo(wireMock, fixedUserPath(authType))).as(site + " user-info requests").isEqualTo(1);
    }

    /**
     * NEW-27 for Google and GitHub through the request the factory builds: T67's Generic check refuses a user without a
     * uid ({@code NO_UID}) before the base check sees it; the controls come back exactly as sent.
     */
    @ParameterizedTest(name = "{0}, user {1}")
    @MethodSource("googleAndGithubUsers")
    void factoryBuiltGoogleAndGithubUserMappings_areRefusedNEW27(String authType, String userBody, String expectedUid, WireMockRuntimeInfo wireMock) {
        AbstractOauth2Request<?> request = factoryBuilt(simple(authType));

        composedWithTheBaseAuth(authType + " factory-built user step, user " + userBody, wireMock, authType, userBody, expectedUid,
                request::getAuthUser, GenericAuthRequest.NO_UID);
    }

    /**
     * The base check for the legacy {@code GoogleRequest} and {@code GithubRequest}, which production no longer builds:
     * their user without a uid is refused with {@code NO_USER_ID}. Legacy GitHub's missing and null {@code id} throw in
     * the provider first, which {@code auth} turns into FAIL_TO_GET_OIDC_INFO as well.
     */
    @ParameterizedTest(name = "{0}, user {1}")
    @MethodSource("googleAndGithubUsers")
    void legacyGoogleAndGithubUserMappings_areRefusedByTheBaseCheckNEW27(String authType, String userBody, String expectedUid, WireMockRuntimeInfo wireMock) {
        AbstractOauth2Request<?> request = AuthTypeConstants.GOOGLE.equals(authType)
                ? new GoogleRequest(simple(authType)) : new GithubRequest(simple(authType));
        String reason = GITHUB_USERS_THAT_THROW.contains(userBody) ? null : AbstractOauth2Request.NO_USER_ID;

        composedWithTheBaseAuth(authType + " legacy user step, user " + userBody, wireMock, authType, userBody, expectedUid,
                request::getAuthUser, reason);
    }

    private static Stream<Arguments> legacyLoginsWithoutAUsableSub() {
        Stream.Builder<Arguments> cases = Stream.builder();
        for (String body : USERS_WITHOUT_A_USABLE_SUB) {
            cases.add(Arguments.of(AuthTypeConstants.ORY, body));
            cases.add(Arguments.of(AuthTypeConstants.KEYCLOAK, body));
        }
        return cases.build();
    }

    private static AbstractOauth2Request<?> legacy(String authType, String baseUrl) {
        return AuthTypeConstants.ORY.equals(authType) ? new OryRequest(ory(baseUrl)) : new KeycloakRequest(keycloak(baseUrl));
    }

    private static AuthUser userWithUid(String uid) {
        return AuthUser.builder().uid(uid).username(NO_SUB_EMAIL).build();
    }

    /**
     * The base check in {@code auth}: the legacy {@code OryRequest} and {@code KeycloakRequest} (their real token and
     * user steps on WireMock) refuse a user without a usable {@code sub} with {@code NO_USER_ID}, which no provider
     * check refused before T168.
     */
    @ParameterizedTest(name = "{0}, user {1}")
    @MethodSource("legacyLoginsWithoutAUsableSub")
    void everyOauth2Request_refusesAUserWithoutAUidInAuthNEW27(String authType, String userBody, WireMockRuntimeInfo wireMock) {
        stubTokenAndUser(wireMock, tokenPath(authType), userPath(authType), userBody);

        expectFailToGetOidcInfo(authType + " legacy auth, user " + userBody, legacy(authType, wireMock.getHttpBaseUrl()).auth(context()),
                AbstractOauth2Request.NO_USER_ID);
    }

    /** The same check for a provider the factory does not know: a test subclass whose user has a null, empty or blank uid. */
    @ParameterizedTest(name = "uid [{0}]")
    @NullSource
    @ValueSource(strings = {"", "  "})
    void anyOauth2Request_refusesAUserWithoutAUidInAuthNEW27(String uid) {
        expectFailToGetOidcInfo("subclass auth, uid [" + uid + "]", new Assembled(Mono.fromSupplier(() -> userWithUid(uid))).auth(context()),
                AbstractOauth2Request.NO_USER_ID);
    }

    /** Its control, the legacy classes and the subclass: a uid comes back exactly as sent, with the token set. */
    @Test
    void everyOauth2Request_acceptsAUserWithAUidInAuthAndRefresh(WireMockRuntimeInfo wireMock) {
        for (String authType : List.of(AuthTypeConstants.ORY, AuthTypeConstants.KEYCLOAK)) {
            stubTokenAndUser(wireMock, tokenPath(authType), userPath(authType), USER_WITH_SUB);
            AbstractOauth2Request<?> request = legacy(authType, wireMock.getHttpBaseUrl());
            for (AuthUser user : List.of(expectUser(authType + " legacy auth", request.auth(context())),
                    expectUser(authType + " legacy refresh", request.refresh(REFRESH_TOKEN)))) {
                assertThat(user.getUid()).isEqualTo(UID_AS_SENT);
                assertThat(user.getAuthToken().getAccessToken()).isEqualTo(ACCESS_TOKEN);
            }
        }
        Assembled subclass = new Assembled(Mono.fromSupplier(() -> userWithUid(UID_AS_SENT)));
        for (AuthUser user : List.of(expectUser("subclass auth", subclass.auth(context())), expectUser("subclass refresh", subclass.refresh(REFRESH_TOKEN)))) {
            assertThat(user.getUid()).isEqualTo(UID_AS_SENT);
            assertThat(user.getAuthToken().getAccessToken()).isEqualTo(ACCESS_TOKEN);
        }
    }

    /**
     * The base check in {@code refresh}, a test of its own so that a failure of the {@code auth} one cannot hide it: the
     * legacy Ory and Keycloak refresh (their real refresh-token and user steps) and the test subclass refuse a user
     * without a uid with {@code NO_USER_ID}.
     */
    @ParameterizedTest(name = "{0}, user {1}")
    @MethodSource("legacyLoginsWithoutAUsableSub")
    void everyOauth2Request_refusesAUserWithoutAUidInRefreshNEW27(String authType, String userBody, WireMockRuntimeInfo wireMock) {
        stubTokenAndUser(wireMock, tokenPath(authType), userPath(authType), userBody);

        expectFailToGetOidcInfo(authType + " legacy refresh, user " + userBody, legacy(authType, wireMock.getHttpBaseUrl()).refresh(REFRESH_TOKEN),
                AbstractOauth2Request.NO_USER_ID);
    }

    /** The same check in {@code refresh} for the test subclass whose user has a null, empty or blank uid. */
    @ParameterizedTest(name = "uid [{0}]")
    @NullSource
    @ValueSource(strings = {"", "  "})
    void anyOauth2Request_refusesAUserWithoutAUidInRefreshNEW27(String uid) {
        expectFailToGetOidcInfo("subclass refresh, uid [" + uid + "]", new Assembled(Mono.fromSupplier(() -> userWithUid(uid))).refresh(REFRESH_TOKEN),
                AbstractOauth2Request.NO_USER_ID);
    }
}

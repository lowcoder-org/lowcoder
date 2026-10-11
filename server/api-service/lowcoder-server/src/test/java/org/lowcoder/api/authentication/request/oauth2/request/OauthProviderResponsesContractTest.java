package org.lowcoder.api.authentication.request.oauth2.request;

import com.github.tomakehurst.wiremock.http.RequestMethod;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.springframework.core.ResolvableType;

import java.util.LinkedHashMap;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.api.authentication.request.oauth2.request.OauthProviderStubs.*;

/**
 * Group {@code oauth} of docs/API_PAYLOAD_TEST_PLAN.md §4.9: recorded token and user-info responses of each provider
 * (Generic, GitHub, Google, Keycloak, Ory), {@code boundary/oauth/<provider>.<step>.json}, decoded by the
 * {@code WebClientBuildHelper} client codecs at each {@code bodyToMono} site, as the site declares it ({@code Map.class}
 * or {@code Map<String, Object>}). Pinned per provider in {@code boundary/oauth/<provider>.decoded.json}: the request
 * each step sent, the Java class of every decoded value (numbers such as {@code expires_in}, nested maps, lists) and
 * the {@code AuthToken}/{@code AuthUser} the site built from it.
 *
 * <p>The recorded {@code expires_in} comes as an integer, as a string (Generic refresh) and as a decimal (Ory
 * refresh), forms providers are known to send; {@code MapUtils.getIntValue} turns each into the token's {@code int}.
 * The Generic id token is the {@code jwt-claims} input, so the Generic user mapping also pins the claims
 * {@code JwtDecoderUtil} reads (user info merged over the claims, and the claims alone without introspection).
 *
 * <p>Limits: see {@link OauthProviderStubs} for the GitHub/Google redirection and for why the token steps' classes
 * come from a decode with the same client codecs rather than from the site's own map. Error responses are the
 * {@code error-message-json} group ({@link OauthProviderErrorMessagesContractTest}).
 */
@WireMockTest
class OauthProviderResponsesContractTest {

    static final String TOKEN_STEP = "token";
    static final String REFRESH_STEP = "refresh";
    static final String USER_STEP = "user";
    static final String USER_FROM_ID_TOKEN_STEP = "userFromIdToken";
    static final String REQUEST_KEY = "request";
    static final String DECODED_KEY = "decoded";
    static final String AUTH_TOKEN_KEY = "authToken";
    static final String AUTH_USER_KEY = "authUser";
    static final String REFRESH_IS_EMPTY = "refresh returns an empty Mono";

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GenericAuthRequest.java#GenericAuthRequest.getAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GenericAuthRequest.java#GenericAuthRequest.refreshAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GenericAuthRequest.java#GenericAuthRequest.getAuthUser#bodyToMono#1"})
    @Test
    void genericResponses(WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), true));
        Map<String, Object> steps = new LinkedHashMap<>();

        String tokenBody = recorded(OAUTH_FIXTURES + "generic.token.json");
        stubJson(wireMock, RequestMethod.POST, GENERIC_TOKEN_PATH, OK, tokenBody);
        AuthToken token = request.getAuthToken(context()).block(BLOCK_TIMEOUT);
        steps.put(TOKEN_STEP, tokenStep(onlyRequest(wireMock), tokenBody, RAW_MAP, token));

        String refreshBody = recorded(OAUTH_FIXTURES + "generic.refresh.json");
        stubJson(wireMock, RequestMethod.POST, GENERIC_TOKEN_PATH, OK, refreshBody);
        AuthToken refreshed = request.refreshAuthToken(REFRESH_TOKEN).block(BLOCK_TIMEOUT);
        steps.put(REFRESH_STEP, tokenStep(onlyRequest(wireMock), refreshBody, RAW_MAP, refreshed));

        String userBody = recorded(OAUTH_FIXTURES + "generic.user.json");
        stubJson(wireMock, RequestMethod.GET, GENERIC_USER_PATH, OK, userBody);
        AuthUser user = request.getAuthUser(token).block(BLOCK_TIMEOUT);
        steps.put(USER_STEP, userStep(onlyRequest(wireMock), userBody, RAW_MAP, user));

        AuthUser fromIdToken = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), false)).getAuthUser(token).block(BLOCK_TIMEOUT);
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("no user-info request without introspection").isEmpty();
        Map<String, Object> fromIdTokenStep = new LinkedHashMap<>();
        fromIdTokenStep.put(DECODED_KEY, JavaValueWalker.shape(fromIdToken.getRawUserInfo()));
        fromIdTokenStep.put(AUTH_USER_KEY, fields(fromIdToken));
        steps.put(USER_FROM_ID_TOKEN_STEP, fromIdTokenStep);

        assertPinned("generic", steps);
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GithubRequest.java#GithubRequest.getAuthUser#bodyToMono#1")
    @Test
    void githubResponses(WireMockRuntimeInfo wireMock) {
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));
        Map<String, Object> steps = new LinkedHashMap<>();
        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, GOLDEN.read(OAUTH_FIXTURES + "github.token.txt"));
            AuthToken token = request.getAuthToken(context()).block(BLOCK_TIMEOUT);
            Map<String, Object> tokenStep = new LinkedHashMap<>();
            tokenStep.put(REQUEST_KEY, onlyRequest(wireMock));
            tokenStep.put(AUTH_TOKEN_KEY, fields(token));
            steps.put(TOKEN_STEP, tokenStep);

            assertThat(request.refreshAuthToken(REFRESH_TOKEN).block(BLOCK_TIMEOUT)).isNull();
            steps.put(REFRESH_STEP, REFRESH_IS_EMPTY);

            String userBody = recorded(OAUTH_FIXTURES + "github.user.json");
            stubJson(wireMock, RequestMethod.GET, GITHUB_USER_PATH, OK, userBody);
            AuthUser user = request.getAuthUser(token).block(BLOCK_TIMEOUT);
            steps.put(USER_STEP, userStep(onlyRequest(wireMock), userBody, STRING_OBJECT_MAP, user));
        }
        assertPinned("github", steps);
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GoogleRequest.java#GoogleRequest.getAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GoogleRequest.java#GoogleRequest.refreshAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GoogleRequest.java#GoogleRequest.getAuthUser#bodyToMono#1"})
    @Test
    void googleResponses(WireMockRuntimeInfo wireMock) {
        GoogleRequest request = new GoogleRequest(simple(AuthTypeConstants.GOOGLE));
        Map<String, Object> steps;
        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            steps = tokenRefreshAndUser(wireMock, request, "google", GOOGLE_TOKEN_PATH, GOOGLE_USER_PATH);
        }
        assertPinned("google", steps);
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/KeycloakRequest.java#KeycloakRequest.getAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/KeycloakRequest.java#KeycloakRequest.refreshAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/KeycloakRequest.java#KeycloakRequest.getAuthUser#bodyToMono#1"})
    @Test
    void keycloakResponses(WireMockRuntimeInfo wireMock) {
        KeycloakRequest request = new KeycloakRequest(keycloak(wireMock.getHttpBaseUrl()));
        assertPinned("keycloak", tokenRefreshAndUser(wireMock, request, "keycloak", KEYCLOAK_TOKEN_PATH, KEYCLOAK_USER_PATH));
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/OryRequest.java#OryRequest.getAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/OryRequest.java#OryRequest.refreshAuthToken#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/OryRequest.java#OryRequest.getAuthUser#bodyToMono#1"})
    @Test
    void oryResponses(WireMockRuntimeInfo wireMock) {
        OryRequest request = new OryRequest(ory(wireMock.getHttpBaseUrl()));
        assertPinned("ory", tokenRefreshAndUser(wireMock, request, "ory", ORY_TOKEN_PATH, ORY_USER_PATH));
    }

    /** The three steps of a provider whose sites all decode {@code Map<String, Object>} and post to the user endpoint. */
    private static Map<String, Object> tokenRefreshAndUser(WireMockRuntimeInfo wireMock, AbstractOauth2Request<?> request,
                                                           String provider, String tokenPath, String userPath) {
        Map<String, Object> steps = new LinkedHashMap<>();
        String tokenBody = recorded(OAUTH_FIXTURES + provider + ".token.json");
        stubJson(wireMock, RequestMethod.POST, tokenPath, OK, tokenBody);
        AuthToken token = request.getAuthToken(context()).block(BLOCK_TIMEOUT);
        steps.put(TOKEN_STEP, tokenStep(onlyRequest(wireMock), tokenBody, STRING_OBJECT_MAP, token));

        String refreshBody = recorded(OAUTH_FIXTURES + provider + ".refresh.json");
        stubJson(wireMock, RequestMethod.POST, tokenPath, OK, refreshBody);
        AuthToken refreshed = request.refreshAuthToken(REFRESH_TOKEN).block(BLOCK_TIMEOUT);
        steps.put(REFRESH_STEP, tokenStep(onlyRequest(wireMock), refreshBody, STRING_OBJECT_MAP, refreshed));

        String userBody = recorded(OAUTH_FIXTURES + provider + ".user.json");
        stubJson(wireMock, RequestMethod.POST, userPath, OK, userBody);
        AuthUser user = request.getAuthUser(token).block(BLOCK_TIMEOUT);
        steps.put(USER_STEP, userStep(onlyRequest(wireMock), userBody, STRING_OBJECT_MAP, user));
        return steps;
    }

    private static Map<String, Object> tokenStep(String request, String body, ResolvableType target, AuthToken token) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put(REQUEST_KEY, request);
        step.put(DECODED_KEY, JavaValueWalker.shape(decodedByClientCodecs(body, target)));
        step.put(AUTH_TOKEN_KEY, fields(token));
        return step;
    }

    /** The user-info site keeps its decoded map as {@code rawUserInfo}; the client-codec decode must equal it. */
    private static Map<String, Object> userStep(String request, String body, ResolvableType target, AuthUser user) {
        CanonicalJson.assertSameJava(decodedByClientCodecs(body, target), user.getRawUserInfo());
        Map<String, Object> step = new LinkedHashMap<>();
        step.put(REQUEST_KEY, request);
        step.put(DECODED_KEY, JavaValueWalker.shape(user.getRawUserInfo()));
        step.put(AUTH_USER_KEY, fields(user));
        return step;
    }

    private static void assertPinned(String provider, Map<String, Object> steps) {
        String actual = pretty(steps);
        System.out.println("[OauthProviderResponsesContractTest] " + provider + ":\n" + actual);
        GOLDEN.assertJson(OAUTH_FIXTURES + provider + ".decoded.json", actual);
    }
}

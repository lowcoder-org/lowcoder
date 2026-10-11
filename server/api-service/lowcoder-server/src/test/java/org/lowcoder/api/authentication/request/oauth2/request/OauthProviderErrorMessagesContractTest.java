package org.lowcoder.api.authentication.request.oauth2.request;

import com.github.tomakehurst.wiremock.http.RequestMethod;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.api.authentication.request.oauth2.request.OauthProviderStubs.*;

/**
 * The OAuth rows of group {@code error-message-json} (docs/API_PAYLOAD_TEST_PLAN.md §4.9): at 14 sites a provider
 * error response, decoded by the client codecs, is written back with {@code JsonUtils.toJson} into the
 * {@code AuthException} message, which {@code AbstractOauth2Request.auth}/{@code refresh} pass as the argument of
 * {@code FAIL_TO_GET_OIDC_INFO} ({@code AbstractOauth2Request.java:33-35}, {@code :43-45}). The message text of
 * every site, and the two {@code BizException} messages, are pinned in
 * {@code boundary/error-message-json/<class>.messages.json}: a number lexeme the decoder changes ({@code 1.50}), key
 * order, escapes and non-ASCII text all show in it.
 *
 * <p>The error body is {@code boundary/error-message-json/provider.error.json}; GitHub's token endpoint answers in
 * form encoding, {@code github.token.error.txt}, parsed into a {@code HashMap} before {@code toJson}, so its key order
 * is the {@code HashMap}'s. Generic reads with {@code retrieve()}, which turns a 4xx status into a
 * {@code WebClientResponseException} before the body is inspected, so its sites are reached only by an error body
 * with status 200; the same body with status 400 is pinned as that exception (plan §9, O32). The others read the
 * body whatever the status, and get 400 here.
 *
 * <p>For 12 of the 14 sites the test also runs {@code auth} or {@code refresh} and requires the site's text as the one
 * argument of {@code FAIL_TO_GET_OIDC_INFO}. Limits: the GitHub and Google user-info sites are not run that way:
 * {@code auth} calls {@code getAuthUser} on {@code AUTH_REQUEST_THREAD_POOL}, where the static mock that redirects
 * them is not active (the wrapping is the same {@code AbstractOauth2Request} code). See {@link OauthProviderStubs} for
 * the redirection.
 */
@WireMockTest
class OauthProviderErrorMessagesContractTest {

    static final String ERROR_BODY_FIXTURE = ERROR_FIXTURES + "provider.error.json";
    static final String GITHUB_TOKEN_ERROR_FIXTURE = ERROR_FIXTURES + "github.token.error.txt";
    static final String FAIL_TO_GET_OIDC_INFO = "FAIL_TO_GET_OIDC_INFO";
    static final String ACCESS_TOKEN = "at.input.0001";
    static final int UNAUTHORIZED = 401;

    private final Map<String, String> messages = new LinkedHashMap<>();

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GenericAuthRequest.java#GenericAuthRequest.getAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GenericAuthRequest.java#GenericAuthRequest.refreshAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GenericAuthRequest.java#GenericAuthRequest.getAuthUser#toJson#1"})
    @Test
    void genericErrors(WireMockRuntimeInfo wireMock) {
        GenericAuthRequest request = new GenericAuthRequest(generic(wireMock.getHttpBaseUrl(), true));
        String error = GOLDEN.read(ERROR_BODY_FIXTURE);
        stubJson(wireMock, RequestMethod.POST, GENERIC_TOKEN_PATH, OK, error);
        stubJson(wireMock, RequestMethod.GET, GENERIC_USER_PATH, OK, error);
        record("GenericAuthRequest.getAuthToken", request.getAuthToken(context()));
        record("GenericAuthRequest.refreshAuthToken", request.refreshAuthToken(REFRESH_TOKEN));
        record("GenericAuthRequest.getAuthUser", request.getAuthUser(accessToken()));
        assertWrapped("GenericAuthRequest.getAuthToken", request.auth(context()));
        assertWrapped("GenericAuthRequest.refreshAuthToken", request.refresh(REFRESH_TOKEN));
        stubJson(wireMock, RequestMethod.POST, GENERIC_TOKEN_PATH, OK, recorded(OAUTH_FIXTURES + "generic.token.json"));
        assertWrapped("GenericAuthRequest.getAuthUser", request.auth(context()));
        stubJson(wireMock, RequestMethod.POST, GENERIC_TOKEN_PATH, BAD_REQUEST, error);
        recordRejected("GenericAuthRequest.getAuthToken (HTTP 400)", request.getAuthToken(context()));
        assertPinned("GenericAuthRequest");
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GithubRequest.java#GithubRequest.getAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GithubRequest.java#GithubRequest.getAuthUser#toJson#1"})
    @Test
    void githubErrors(WireMockRuntimeInfo wireMock) {
        GithubRequest request = new GithubRequest(simple(AuthTypeConstants.GITHUB));
        stub(wireMock, RequestMethod.POST, GITHUB_TOKEN_PATH, OK, FORM_CONTENT_TYPE, GOLDEN.read(GITHUB_TOKEN_ERROR_FIXTURE));
        stubJson(wireMock, RequestMethod.GET, GITHUB_USER_PATH, UNAUTHORIZED, GOLDEN.read(ERROR_BODY_FIXTURE));
        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            record("GithubRequest.getAuthToken", request.getAuthToken(context()));
            record("GithubRequest.getAuthUser", request.getAuthUser(accessToken()));
            assertWrapped("GithubRequest.getAuthToken", request.auth(context()));
        }
        assertPinned("GithubRequest");
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GoogleRequest.java#GoogleRequest.getAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GoogleRequest.java#GoogleRequest.refreshAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/GoogleRequest.java#GoogleRequest.getAuthUser#toJson#1"})
    @Test
    void googleErrors(WireMockRuntimeInfo wireMock) {
        GoogleRequest request = new GoogleRequest(simple(AuthTypeConstants.GOOGLE));
        try (MockedStatic<WebClientBuildHelper> ignored = redirectTo(wireMock.getHttpBaseUrl())) {
            recordThreeSites(wireMock, request, "GoogleRequest", GOOGLE_TOKEN_PATH, GOOGLE_USER_PATH);
            assertWrapped("GoogleRequest.getAuthToken", request.auth(context()));
            assertWrapped("GoogleRequest.refreshAuthToken", request.refresh(REFRESH_TOKEN));
        }
        assertPinned("GoogleRequest");
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/KeycloakRequest.java#KeycloakRequest.getAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/KeycloakRequest.java#KeycloakRequest.refreshAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/KeycloakRequest.java#KeycloakRequest.getAuthUser#toJson#1"})
    @Test
    void keycloakErrorsAndTheirOidcInfoMessages(WireMockRuntimeInfo wireMock) {
        KeycloakRequest request = new KeycloakRequest(keycloak(wireMock.getHttpBaseUrl()));
        recordThreeSites(wireMock, request, "KeycloakRequest", KEYCLOAK_TOKEN_PATH, KEYCLOAK_USER_PATH);
        recordOidcInfo("AbstractOauth2Request.auth (Keycloak token error)", request.auth(context()));
        recordOidcInfo("AbstractOauth2Request.refresh (Keycloak token error)", request.refresh(REFRESH_TOKEN));
        assertWrapped("KeycloakRequest.getAuthToken", request.auth(context()));
        assertWrapped("KeycloakRequest.refreshAuthToken", request.refresh(REFRESH_TOKEN));
        assertUserErrorWrapped(wireMock, request, "keycloak", "KeycloakRequest", KEYCLOAK_TOKEN_PATH);
        assertPinned("KeycloakRequest");
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/OryRequest.java#OryRequest.getAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/OryRequest.java#OryRequest.refreshAuthToken#toJson#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/request/oauth2/request/OryRequest.java#OryRequest.getAuthUser#toJson#1"})
    @Test
    void oryErrors(WireMockRuntimeInfo wireMock) {
        OryRequest request = new OryRequest(ory(wireMock.getHttpBaseUrl()));
        recordThreeSites(wireMock, request, "OryRequest", ORY_TOKEN_PATH, ORY_USER_PATH);
        assertWrapped("OryRequest.getAuthToken", request.auth(context()));
        assertWrapped("OryRequest.refreshAuthToken", request.refresh(REFRESH_TOKEN));
        assertUserErrorWrapped(wireMock, request, "ory", "OryRequest", ORY_TOKEN_PATH);
        assertPinned("OryRequest");
    }

    private void recordThreeSites(WireMockRuntimeInfo wireMock, AbstractOauth2Request<?> request, String owner, String tokenPath, String userPath) {
        String error = GOLDEN.read(ERROR_BODY_FIXTURE);
        stubJson(wireMock, RequestMethod.POST, tokenPath, BAD_REQUEST, error);
        stubJson(wireMock, RequestMethod.POST, userPath, BAD_REQUEST, error);
        record(owner + ".getAuthToken", request.getAuthToken(context()));
        record(owner + ".refreshAuthToken", request.refreshAuthToken(REFRESH_TOKEN));
        record(owner + ".getAuthUser", request.getAuthUser(accessToken()));
    }

    /** With a good token answer, {@code auth} reaches the user-info site, whose error it must wrap. */
    private void assertUserErrorWrapped(WireMockRuntimeInfo wireMock, AbstractOauth2Request<?> request, String provider, String owner,
                                        String tokenPath) {
        stubJson(wireMock, RequestMethod.POST, tokenPath, OK, recorded(OAUTH_FIXTURES + provider + ".token.json"));
        assertWrapped(owner + ".getAuthUser", request.auth(context()));
    }

    /**
     * {@code auth}/{@code refresh} signal {@code FAIL_TO_GET_OIDC_INFO} whose one argument is the site's
     * {@code AuthException} text, as recorded by {@link #record}.
     */
    private void assertWrapped(String site, Mono<?> call) {
        assertThat(messages).as("site recorded before its wrapping is checked").containsKey(site);
        try {
            Object result = call.block(BLOCK_TIMEOUT);
            throw new AssertionError(site + ": expected a BizException, got " + result);
        } catch (BizException e) {
            System.out.println("[OauthProviderErrorMessagesContractTest] " + site + " wrapped: " + e.getMessage());
            assertThat(e.getError()).as(site).isEqualTo(BizError.FAIL_TO_GET_OIDC_INFO);
            assertThat(e.getArgs()).as(site).containsExactly(messages.get(site));
        }
    }

    private static AuthToken accessToken() {
        return AuthToken.builder().accessToken(ACCESS_TOKEN).build();
    }

    /** The message of the {@code AuthException} the site signals; any other outcome fails. */
    private void record(String site, Mono<?> call) {
        try {
            Object result = call.block(BLOCK_TIMEOUT);
            throw new AssertionError(site + ": expected an AuthException, got " + result);
        } catch (AuthException e) {
            System.out.println("[OauthProviderErrorMessagesContractTest] " + site + ": " + e.getMessage());
            messages.put(site, e.getMessage());
        }
    }

    /**
     * O32: {@code retrieve()} signals a 4xx answer as a {@code WebClientResponseException} before the body reaches the
     * site; its class and status are pinned (its message holds WireMock's random port).
     */
    private void recordRejected(String site, Mono<?> call) {
        try {
            Object result = call.block(BLOCK_TIMEOUT);
            throw new AssertionError(site + ": expected a WebClientResponseException, got " + result);
        } catch (WebClientResponseException e) {
            System.out.println("[OauthProviderErrorMessagesContractTest] " + site + ": " + e.getClass().getName() + " " + e.getMessage());
            messages.put(site, e.getClass().getName() + " " + e.getStatusCode());
        }
    }

    private void recordOidcInfo(String path, Mono<?> call) {
        try {
            Object result = call.block(BLOCK_TIMEOUT);
            throw new AssertionError(path + ": expected a BizException, got " + result);
        } catch (BizException e) {
            System.out.println("[OauthProviderErrorMessagesContractTest] " + path + ": " + e.getError() + " " + e.getMessage());
            assertThat(e.getError()).isEqualTo(BizError.FAIL_TO_GET_OIDC_INFO);
            assertThat(e.getMessageKey()).isEqualTo(FAIL_TO_GET_OIDC_INFO);
            messages.put(path, e.getMessage());
        }
    }

    private void assertPinned(String owner) {
        String actual = pretty(messages);
        System.out.println("[OauthProviderErrorMessagesContractTest] " + owner + " messages:\n" + actual);
        GOLDEN.assertJson(ERROR_FIXTURES + owner + ".messages.json", actual);
    }
}

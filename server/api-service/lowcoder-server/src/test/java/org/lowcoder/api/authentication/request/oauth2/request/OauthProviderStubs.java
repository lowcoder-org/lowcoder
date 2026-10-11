package org.lowcoder.api.authentication.request.oauth2.request;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.http.RequestMethod;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.contract.boundary.JwtClaimsContractTest;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.contract.ClientCodecs;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.ResolvableType;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.request;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.lowcoder.sdk.plugin.common.constant.Constants.HTTP_TIMEOUT;

/**
 * Recorded OAuth provider responses for the {@code oauth} and {@code error-message-json} groups of
 * docs/API_PAYLOAD_TEST_PLAN.md §4.9, served by WireMock to the real request classes.
 *
 * <p>Generic, Keycloak and Ory take their endpoints from the auth config, so their configs point at WireMock and the
 * request classes run unchanged. GitHub and Google call fixed {@code https} endpoints ({@code Oauth2DefaultSource});
 * {@link #redirectTo} ({@link WebClientRedirect}) makes {@code WebClientBuildHelper.builder()} return the real helper
 * whose client builder keeps its codecs and has only its connector replaced with one that sends the same method, path
 * and query to WireMock.
 *
 * <p>Limits: the redirection is a Mockito static mock, which applies on the calling thread only, so callers invoke
 * the request methods directly on the test thread, where the clients are built; it replaces the GitHub/Google
 * transport (proxy, timeouts), not their codecs. {@link #decodedByClientCodecs} decodes a recorded body with the
 * codecs of the same {@code WebClientBuildHelper} configuration every site builds; it stands in for the token sites,
 * whose decoded map production does not keep, and is checked against the real decoded user-info maps.
 */
final class OauthProviderStubs {

    static final String CLIENT_ID = "lowcoder-client";
    static final String CLIENT_SECRET = "s3cr3t";
    static final String CODE = "c0de";
    static final String REDIRECT_URL = "https://lowcoder.example.com/apps/oauth/redirect";
    static final String ORG_ID = "org01";
    static final String REALM = "lowcoder";
    static final String SCOPE = "openid email profile";
    static final String REFRESH_TOKEN = "rt.input.0001";
    static final String ID_TOKEN_PLACEHOLDER = "$ID_TOKEN";
    static final String OAUTH_FIXTURES = "boundary/oauth/";
    static final String ERROR_FIXTURES = "boundary/error-message-json/";
    static final String CONTENT_TYPE = "Content-Type";
    static final String FORM_CONTENT_TYPE = "application/x-www-form-urlencoded; charset=utf-8";
    static final int OK = 200;
    static final int BAD_REQUEST = 400;
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);

    static final String GENERIC_TOKEN_PATH = "/generic/token";
    static final String GENERIC_USER_PATH = "/generic/userinfo";
    static final String GITHUB_TOKEN_PATH = "/login/oauth/access_token";
    static final String GITHUB_USER_PATH = "/user";
    static final String GOOGLE_TOKEN_PATH = "/oauth2/v4/token";
    static final String GOOGLE_USER_PATH = "/oauth2/v3/userinfo";
    static final String KEYCLOAK_TOKEN_PATH = "/realms/" + REALM + "/protocol/openid-connect/token";
    static final String KEYCLOAK_USER_PATH = "/realms/" + REALM + "/protocol/openid-connect/userinfo";
    static final String ORY_TOKEN_PATH = "/oauth2/token";
    static final String ORY_USER_PATH = "/userinfo";

    /** The declared targets of the sites: {@code bodyToMono(Map.class)} (Generic) and {@code Map<String, Object>}. */
    static final ResolvableType RAW_MAP = ResolvableType.forClass(Map.class);
    static final ResolvableType STRING_OBJECT_MAP = ResolvableType.forType(new ParameterizedTypeReference<Map<String, Object>>() {
    });

    static final GoldenJson GOLDEN = GoldenJson.forModule();

    private OauthProviderStubs() {
    }

    static OAuth2RequestContext context() {
        return new OAuth2RequestContext(ORG_ID, CODE, REDIRECT_URL);
    }

    /** The source mappings of a Generic provider configured for an OIDC IdP (the claims of the id token). */
    static Oauth2GenericAuthConfig generic(String baseUrl, boolean userInfoIntrospection) {
        HashMap<String, String> sourceMappings = new HashMap<>();
        sourceMappings.put("jwt", "id_token");
        sourceMappings.put("uid", "sub");
        sourceMappings.put("username", "preferred_username");
        sourceMappings.put("email", "email");
        sourceMappings.put("avatar", "picture");
        sourceMappings.put("group_id", "groups[0]");
        return Oauth2GenericAuthConfig.builder()
                .authType(AuthTypeConstants.GENERIC).source("GENERIC").sourceName("Generic IdP").enable(true).enableRegister(true)
                .clientId(CLIENT_ID).clientSecret(CLIENT_SECRET).scope(SCOPE)
                .tokenEndpoint(baseUrl + GENERIC_TOKEN_PATH).userInfoEndpoint(baseUrl + GENERIC_USER_PATH)
                .sourceMappings(sourceMappings).userInfoIntrospection(userInfoIntrospection).postForUserEndpoint(false)
                .build();
    }

    static Oauth2SimpleAuthConfig simple(String authType) {
        return Oauth2SimpleAuthConfig.builder()
                .authType(authType).source(authType).sourceName(authType).enable(true).enableRegister(true)
                .clientId(CLIENT_ID).clientSecret(CLIENT_SECRET)
                .build();
    }

    static Oauth2KeycloakAuthConfig keycloak(String baseUrl) {
        return Oauth2KeycloakAuthConfig.builder()
                .authType(AuthTypeConstants.KEYCLOAK).source(AuthTypeConstants.KEYCLOAK).sourceName("Keycloak").enable(true).enableRegister(true)
                .clientId(CLIENT_ID).clientSecret(CLIENT_SECRET).baseUrl(baseUrl).realm(REALM).scope(SCOPE)
                .build();
    }

    static Oauth2OryAuthConfig ory(String baseUrl) {
        return Oauth2OryAuthConfig.builder()
                .authType(AuthTypeConstants.ORY).source(AuthTypeConstants.ORY).sourceName("Ory").enable(true).enableRegister(true)
                .clientId(CLIENT_ID).clientSecret(CLIENT_SECRET).baseUrl(baseUrl).scope(SCOPE)
                .build();
    }

    /** A recorded body; {@value #ID_TOKEN_PLACEHOLDER} becomes the JWT of the {@code jwt-claims} input. */
    static String recorded(String fixture) {
        return GOLDEN.read(fixture).replace(ID_TOKEN_PLACEHOLDER, idToken());
    }

    static String idToken() {
        return JwtClaimsContractTest.jwt(GOLDEN.read(JwtClaimsContractTest.INPUT_FIXTURE));
    }

    static void stubJson(WireMockRuntimeInfo wireMock, RequestMethod method, String path, int status, String body) {
        stub(wireMock, method, path, status, MediaType.APPLICATION_JSON_VALUE, body);
    }

    static void stub(WireMockRuntimeInfo wireMock, RequestMethod method, String path, int status, String contentType, String body) {
        wireMock.getWireMock().register(request(method.getName(), urlPathEqualTo(path))
                .willReturn(aResponse().withStatus(status).withHeader(CONTENT_TYPE, contentType).withBody(body)));
    }

    /**
     * {@code METHOD path?query} of the one request WireMock received since the last call; fails unless there was
     * exactly one, and forgets it.
     */
    static String onlyRequest(WireMockRuntimeInfo wireMock) {
        List<LoggedRequest> requests = wireMock.getWireMock().find(WireMock.anyRequestedFor(WireMock.anyUrl()));
        if (requests.size() != 1) {
            throw new AssertionError("expected one request, received " + requests.stream().map(LoggedRequest::getUrl).toList());
        }
        wireMock.getWireMock().resetRequests();
        return requests.get(0).getMethod() + " " + requests.get(0).getUrl();
    }

    /**
     * Makes {@code WebClientBuildHelper.builder()} return the real helper, whose clients send their requests to
     * {@code baseUrl}; close it to restore the helper ({@link WebClientRedirect#redirectTo}, whose limits apply).
     */
    static MockedStatic<WebClientBuildHelper> redirectTo(String baseUrl) {
        return WebClientRedirect.redirectTo(baseUrl);
    }

    /** {@code text} decoded by the codecs of {@code WebClientBuildHelper.builder().systemProxy().timeoutMs(HTTP_TIMEOUT)}. */
    static Object decodedByClientCodecs(String text, ResolvableType target) {
        return ClientCodecs.decoder(ClientCodecs.effective(WebClientBuildHelper.builder().systemProxy().timeoutMs(HTTP_TIMEOUT).toWebClientBuilder()))
                .decode(DefaultDataBufferFactory.sharedInstance.wrap(text.getBytes(StandardCharsets.UTF_8)), target,
                        MediaType.APPLICATION_JSON, Map.of());
    }

    static Map<String, Object> fields(AuthToken token) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("accessToken", token.getAccessToken());
        fields.put("expireIn", token.getExpireIn());
        fields.put("refreshToken", token.getRefreshToken());
        fields.put("refreshTokenExpireIn", token.getRefreshTokenExpireIn());
        fields.put("jwt", token.getJwt() == null ? null : token.getJwt().equals(idToken()) ? "<id token of " + JwtClaimsContractTest.INPUT_FIXTURE + ">" : token.getJwt());
        return fields;
    }

    /** The mapped fields; {@code getSource()} is left out, it needs an auth context that the request classes never set. */
    static Map<String, Object> fields(AuthUser user) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("uid", user.getUid());
        fields.put("username", user.getUsername());
        fields.put("email", user.getEmail());
        fields.put("avatar", user.getAvatar());
        fields.put("groupId", user.getGroupId());
        fields.put("rawUserInfo", user.getRawUserInfo());
        return fields;
    }

    static String pretty(Object value) {
        try {
            return JsonUtils.getObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("cannot write " + value, e);
        }
    }
}

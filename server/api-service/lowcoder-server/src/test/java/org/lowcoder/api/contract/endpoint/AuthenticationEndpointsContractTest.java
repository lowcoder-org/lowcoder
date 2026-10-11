package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.AuthenticationController;
import org.lowcoder.api.authentication.AuthenticationEndpoints;
import org.lowcoder.api.authentication.AuthenticationEndpoints.FormLoginRequest;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.contract.support.AuthenticationSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.OrganizationSamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.UserSamples;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 11 {@link AuthenticationEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), through
 * the production {@link AuthenticationController} in the {@link ContractTestClient} harness, with every collaborator
 * mocked.
 *
 * <p>Request: the JSON bodies are D1 goldens; {@code formLogin}'s record components reach the service one by one,
 * {@code enableAuthConfig}'s {@link AuthConfigRequest} and {@code createAPIKey}'s {@link APIKeyRequest} (two
 * {@code HashMap} subclasses, Appendix A) are captured and compared with D1's rules. Response: the service mocks return
 * the samples, so the body must be the envelope golden around their S1 goldens; the five {@code ResponseView<Void>}
 * answers have no {@code data}. {@code getAllConfigs} is {@code @JsonView(Internal)} (§4.5): each auth config is its
 * {@code S1Internal} golden, which has the {@code SECRET-} client secret and not the {@code Public}-only
 * {@code authorizeUrl}. Untyped root (Appendix A): {@code bindEmail} answers the {@code Boolean} of
 * {@code UserService#bindEmail}.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code pass-through} for all eleven; each wraps one service
 * result, or {@code true} after it, in a {@code ResponseView}.
 */
class AuthenticationEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(AuthenticationEndpoints.class);
    static final String ORG_ID = "AuthenticationEndpointsContractTest.orgId";
    static final String INVITATION_ID = "AuthenticationEndpointsContractTest.invitationId";
    static final String AUTH_ID = "AuthenticationEndpointsContractTest.authId";
    static final String SOURCE = "AuthenticationEndpointsContractTest.source";
    static final String CODE = "AuthenticationEndpointsContractTest.code";
    static final String REDIRECT_URL = "https://authenticationendpointscontracttest.example.com/redirect";
    static final String CONFIG_ID = "AuthenticationEndpointsContractTest.configId";
    static final String API_KEY_ID = "AuthenticationEndpointsContractTest.apiKeyId";
    static final String EMAIL = "authenticationendpointscontracttest@example.com";
    static final String COOKIE_NAME = "AuthenticationEndpointsContractTest-cookie";
    static final String SESSION_TOKEN = "AuthenticationEndpointsContractTest.sessionToken";
    static final String TRUE = "true";
    /** {@code AuthenticationController}'s {@code loginOrRegister} flag: link to the signed-in user, or log in. */
    static final boolean LINK_EXISTING_USER = true;
    static final boolean LOG_IN = false;
    /** {@code AbstractAuthConfig}'s type id property ({@code @JsonTypeInfo(property = "authType")}). */
    static final String TYPE_ID_PROPERTY = "authType";
    static final Pattern LEADING_TYPE_ID = Pattern.compile("\\{\\s*\"" + TYPE_ID_PROPERTY + "\"\\s*:\\s*\"[A-Z_]+\"\\s*,");
    /** {@code disableAuthConfig}'s {@code delete} parameter, the non-default value. */
    static final boolean DELETE = true;

    private ContractTestClient.Builder builder;
    private AuthenticationApiService authenticationApiService;
    private AuthUser authUser;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        authenticationApiService = builder.mock(AuthenticationApiService.class);
        authUser = AuthUser.builder().uid("AuthenticationEndpointsContractTest.authUser.uid").build();
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(AuthenticationEndpointsContractTest.class);
    }

    /** The D1 body's five components reach the service; the query parameters reach the service and the login. */
    @Test
    void formLogin() {
        FormLoginRequest sample = (FormLoginRequest) PayloadSamples.of(FormLoginRequest.class).value();
        Mockito.when(authenticationApiService.authenticateByForm(sample.loginId(), sample.password(), sample.source(), sample.register(),
                sample.authId(), ORG_ID)).thenReturn(Mono.just(authUser));
        Mockito.when(authenticationApiService.loginOrRegister(eq(authUser), any(ServerWebExchange.class), eq(INVITATION_ID), eq(LOG_IN)))
                .thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "formLogin", Map.of("invitationId", INVITATION_ID, "orgId", ORG_ID),
                    EndpointContract.d1(FormLoginRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(authenticationApiService).loginOrRegister(eq(authUser), any(ServerWebExchange.class), eq(INVITATION_ID), eq(LOG_IN));
        }
    }

    @Test
    void loginWithThirdParty() {
        Mockito.when(authenticationApiService.authenticateByOauth2(AUTH_ID, SOURCE, CODE, REDIRECT_URL, ORG_ID)).thenReturn(Mono.just(authUser));
        Mockito.when(authenticationApiService.loginOrRegister(eq(authUser), any(ServerWebExchange.class), eq(INVITATION_ID), eq(LOG_IN)))
                .thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "loginWithThirdParty", Map.of("authId", AUTH_ID, "source", SOURCE,
                    "code", CODE, "invitationId", INVITATION_ID, "redirectUrl", REDIRECT_URL, "orgId", ORG_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(authenticationApiService).loginOrRegister(eq(authUser), any(ServerWebExchange.class), eq(INVITATION_ID), eq(LOG_IN));
        }
    }

    @Test
    void linkAccountWithThirdParty() {
        Mockito.when(authenticationApiService.authenticateByOauth2(AUTH_ID, SOURCE, CODE, REDIRECT_URL, ORG_ID)).thenReturn(Mono.just(authUser));
        Mockito.when(authenticationApiService.loginOrRegister(eq(authUser), any(ServerWebExchange.class), eq(null), eq(LINK_EXISTING_USER)))
                .thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "linkAccountWithThirdParty", Map.of("authId", AUTH_ID, "source", SOURCE,
                    "code", CODE, "redirectUrl", REDIRECT_URL, "orgId", ORG_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(authenticationApiService).loginOrRegister(eq(authUser), any(ServerWebExchange.class), eq(null), eq(LINK_EXISTING_USER));
        }
    }

    /** The request's session cookie is dropped on the server and expired in the browser. */
    @Test
    void logout() {
        CommonConfig cookieConfig = new CommonConfig();
        cookieConfig.setCookieName(COOKIE_NAME);
        builder.singleton("cookieHelper", new CookieHelper(cookieConfig));
        SessionUserService sessions = builder.mock(SessionUserService.class);
        Mockito.when(sessions.removeUserSession(SESSION_TOKEN)).thenReturn(Mono.empty());
        Mockito.when(builder.mock(BusinessEventPublisher.class).publishUserLogoutEvent()).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeWithCookie(client, "logout", Map.of(), COOKIE_NAME, SESSION_TOKEN);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(sessions).removeUserSession(SESSION_TOKEN);
            ResponseCookie expired = result.getResponseCookies().getFirst(COOKIE_NAME);
            System.out.println("[AuthenticationEndpointsContractTest] logout Set-Cookie " + result.getResponseHeaders().get(HttpHeaders.SET_COOKIE));
            assertThat(expired).as("the expired session cookie").isNotNull();
            assertThat(expired.getValue()).isEmpty();
            assertThat(expired.getMaxAge()).isEqualTo(Duration.ZERO);
        }
    }

    /** The D1 body binds to the {@code AuthConfigRequest} the service receives; the answer has no data. */
    @Test
    void enableAuthConfig() {
        Mockito.when(authenticationApiService.enableAuthConfig(any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "enableAuthConfig", Map.of(), EndpointContract.d1(AuthConfigRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            ArgumentCaptor<AuthConfigRequest> captured = ArgumentCaptor.forClass(AuthConfigRequest.class);
            Mockito.verify(authenticationApiService).enableAuthConfig(captured.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(AuthConfigRequest.class), captured.getValue());
        }
    }

    @Test
    void disableAuthConfig() {
        Mockito.when(authenticationApiService.disableAuthConfig(CONFIG_ID, DELETE)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "disableAuthConfig", Map.of("delete", DELETE), null, CONFIG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(authenticationApiService).disableAuthConfig(CONFIG_ID, DELETE);
        }
    }

    /**
     * §4.5: under {@code Internal}, each of the five auth config classes is its {@code S1Internal} golden (or S1),
     * without the type id those goldens begin with (O61): the list is the envelope's generic {@code data}, and a value
     * written without its declared type gets no {@code AbstractAuthConfig} type id, so no duplicate {@code authType}
     * key either (O3 does not occur here).
     */
    @Test
    void getAllConfigs() {
        List<AbstractAuthConfig> configs = List.of(OrganizationSamples.emailAuthConfig(), OrganizationSamples.oauth2SimpleAuthConfig(),
                OrganizationSamples.oauth2GenericAuthConfig(), OrganizationSamples.oauth2KeycloakAuthConfig(), OrganizationSamples.oauth2OryAuthConfig());
        Mockito.when(authenticationApiService.findAuthConfigs(false))
                .thenReturn(Flux.fromIterable(configs).map(config -> new FindAuthConfig(config, null)));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getAllConfigs", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(
                    withoutTypeId(EndpointContract.s1(EmailAuthConfig.class, JsonViews.Internal.class)),
                    withoutTypeId(EndpointContract.s1(Oauth2SimpleAuthConfig.class, JsonViews.Internal.class)),
                    withoutTypeId(EndpointContract.s1(Oauth2GenericAuthConfig.class, JsonViews.Internal.class)),
                    withoutTypeId(EndpointContract.s1(Oauth2KeycloakAuthConfig.class, JsonViews.Internal.class)),
                    withoutTypeId(EndpointContract.s1(Oauth2OryAuthConfig.class, JsonViews.Internal.class)))));
        }
    }

    /** The D1 body binds to the {@code APIKeyRequest} the service receives; the answer is the new key. */
    @Test
    void createAPIKey() {
        Mockito.when(authenticationApiService.createAPIKey(any())).thenReturn(Mono.just(AuthenticationSamples.apiKeyVO()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "createAPIKey", Map.of(), EndpointContract.d1(APIKeyRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(APIKeyVO.class)));
            ArgumentCaptor<APIKeyRequest> captured = ArgumentCaptor.forClass(APIKeyRequest.class);
            Mockito.verify(authenticationApiService).createAPIKey(captured.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(APIKeyRequest.class), captured.getValue());
        }
    }

    @Test
    void deleteAPIKey() {
        Mockito.when(authenticationApiService.deleteAPIKey(API_KEY_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "deleteAPIKey", Map.of(), null, API_KEY_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(authenticationApiService).deleteAPIKey(API_KEY_ID);
        }
    }

    @Test
    void getAllAPIKeys() {
        Mockito.when(authenticationApiService.findAPIKeys()).thenReturn(Flux.just(UserSamples.apiKey(), UserSamples.apiKey()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getAllAPIKeys", Map.of(), null);
            String apiKey = EndpointContract.s1(APIKey.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(apiKey, apiKey)));
        }
    }

    /** Untyped root (Appendix A): the visitor's email binding answers {@code UserService#bindEmail}'s {@code Boolean}. */
    @Test
    void bindEmail() {
        User visitor = UserSamples.user();
        Mockito.when(builder.mock(SessionUserService.class).getVisitor()).thenReturn(Mono.just(visitor));
        Mockito.when(builder.mock(UserService.class).bindEmail(visitor, EMAIL)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "bindEmail", Map.of("email", EMAIL), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /**
     * {@code golden} without its first member, the {@value #TYPE_ID_PROPERTY} type id that a writer for the declared
     * {@code AbstractAuthConfig} type puts first; fails unless the golden begins with it.
     */
    static String withoutTypeId(String golden) {
        Matcher typeId = LEADING_TYPE_ID.matcher(golden);
        assertThat(typeId.lookingAt()).as("the golden begins with the type id: " + golden).isTrue();
        return "{" + golden.substring(typeId.end());
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(AuthenticationController.class).build();
    }
}

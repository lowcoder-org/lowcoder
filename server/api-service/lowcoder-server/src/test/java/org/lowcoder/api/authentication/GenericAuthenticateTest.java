package org.lowcoder.api.authentication;

import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.google.common.collect.Iterables;
import org.bson.Document;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.GlobalContext;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Signal;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.time.Duration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * This class is for testing GenericAuth feature
 */
@ActiveProfiles("testGeneric")
@SpringBootTest
//@RunWith(SpringRunner.class)
@WireMockTest
@ExtendWith(MockitoExtension.class)
@Slf4j
public class GenericAuthenticateTest {

    @Autowired
    private AuthenticationController authenticationController;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthenticationService authenticationService;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private InitData initData;
    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    @BeforeEach
    public void beforeEach() {
        initData.init();
    }
    @Test
    @WithMockUser
    public void testGoogleLoginSuccess(WireMockRuntimeInfo wmRuntimeInfo) {
        log.info("Running mock server on port: {}", wmRuntimeInfo.getHttpPort());
        //Begin mocking services
        HashMap<String, String> sourceMappings = new HashMap<String, String>();
        sourceMappings.put("jwt", "id_token");
        sourceMappings.put("uid", "sub");
        sourceMappings.put("username", "name");
        sourceMappings.put("email", "email");
        sourceMappings.put("avatar", "picture");
        var authConfig = Oauth2GenericAuthConfig.builder()
                .source(AuthSourceConstants.GOOGLE)
                .sourceName(AuthSourceConstants.GOOGLE_NAME)
                .enable(true)
                .enableRegister(true)
                .authType(AuthTypeConstants.GENERIC)
                .clientId("clientid")
                .clientSecret("clientsecret")
                .sourceDescription("Google Auth")
                .sourceIcon("")
                .sourceCategory("cat")
                .issuerUri("http://google.com")
                .authorizationEndpoint(wmRuntimeInfo.getHttpBaseUrl() + "/oauth2/v4/token")
                .tokenEndpoint(wmRuntimeInfo.getHttpBaseUrl() + "/oauth2/v4/token")
                .userInfoEndpoint(wmRuntimeInfo.getHttpBaseUrl() + "/oauth2/v2/userinfo")
                .scope("scope")
                .sourceMappings(sourceMappings)
                .userInfoIntrospection(true)
                .userCanSelectAccounts(true)
                .build();

        var organization = Organization.builder()
                .id("org01")
                .build();
        var mockAuthConfig = new FindAuthConfig(authConfig, organization);
        Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));
        Mockito.when(authenticationService.findAuthConfigBySource(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));

        stubFor(post(urlPathEqualTo("/oauth2/v4/token"))
                .willReturn(okJson("{\"access_token\":\"ya29.a0AfH6SMB...\",\"expires_in\":3600,\"token_type\":\"Bearer\",\"scope\":\"https://www.googleapis.com/auth/userinfo.profile\",\"id_token\": \"eyJhbGciOiJSUzI1NiIsImtpZCI6IjNkNTgwZjBhZjdhY2U2OThhMGNlZTdmMjMwYmNhNTk0ZGM2ZGJiNTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyMjIwMTc1NDgwNzYtcWU1bzBnbWxiMjRtcHRmanE5aGlwazRzNHFvcnN2OGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjIwMTc1NDgwNzYtcWU1bzBnbWxiMjRtcHRmanE5aGlwazRzNHFvcnN2OGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTMyNDk5MjY4NDI2Mzg2NDkzNzEiLCJhdF9oYXNoIjoiblRwVUJzamRXbnlMcDZfM2RsM2MxUSIsIm5hbWUiOiJUZWNoIE5pbmphIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xfS3Z5OXI5SVVibVoySmRlSnJwUUpOY2pUbGhqdHpEY2hvVlJabVdrUkxUUEozOTg9czk2LWMiLCJnaXZlbl9uYW1lIjoiVGVjaCIsImZhbWlseV9uYW1lIjoiTmluamEiLCJpYXQiOjE3MTg4MDUwNzQsImV4cCI6MTcxODgwODY3NH0.UiT0D77_jG5cwAHNZFOT-M2tX-ht2EztOSqZKDfEU7P1-Y6cv0CTESvueI7DC6M_5l942UxXnNBE5SCYluQGNNBg6gLU_lpLNoUnfVUE2ocPjKIxSZeTwyCxYbCtOGL7G5BdWAk-dJhyAudzG3_lLSuz8M7XgomWPC1s7Z5uaD8TH5BdNclV-3kYzNV0CtOPxQ00eAtHhi3MUswTCdwb0cFQl_2GXRdLiXjBGzBY4fe_tarihMDjXXXFrxHsIiB-VcLKWBfl8vRvMxR4Rb\"}")));
        stubFor(get(urlPathEqualTo("/oauth2/v2/userinfo"))
                .willReturn(okJson("{\"sub\":\"user001\",\"email\":\"test_register@ob.dev\",\"name\":\"Tech Ninja\"}")));
        //

        String source = AuthSourceConstants.GOOGLE;
        String code = "test-code-123456";
        String orgId = "org01";
        String redirectUrl = "https://test.com";

        String uid = "user001";

        MockServerHttpRequest request = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange = MockServerWebExchange.builder(request).build();

        var authId = getGenericAuthConfigId(orgId).block();
        Mono<User> userMono = authenticationController.loginWithThirdParty(authId, source, code, null, redirectUrl, orgId, exchange).hasElement()
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source, uid));

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertEquals("Tech Ninja", user.getName());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertEquals(1, user.getConnections().size());
                    assertTrue(user.getIsEnabled());
                })
                .verifyComplete();

        String email = "test_register@ob.dev";
        String password = "lowcoder";
        String source1 = AuthSourceConstants.EMAIL;

        var authConfig1 = new EmailAuthConfig(AuthSourceConstants.EMAIL, true, true);

        mockAuthConfig = new FindAuthConfig(authConfig1, organization);
        Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));
        Mockito.when(authenticationService.findAuthConfigBySource(Mockito.any(), Mockito.any())).thenReturn(Mono.just(mockAuthConfig));

        String authId1 = getEmailAuthConfigId();
        AuthenticationEndpoints.FormLoginRequest formLoginRequest = new AuthenticationEndpoints.FormLoginRequest(email, password, true, source1, authId1);
        MockServerHttpRequest request1 = MockServerHttpRequest.post("").build();
        MockServerWebExchange exchange1 = MockServerWebExchange.builder(request1).build();

        Mono<User> userMono1 = authenticationController.formLogin(formLoginRequest, null, null, exchange1)
                .then(userRepository.findByConnections_SourceAndConnections_RawId(source1, email));

        StepVerifier.create(userMono1)
                .assertNext(user -> {
                    assertEquals(email, user.getEmail());
                    assertEquals(UserState.ACTIVATED, user.getState());
                    assertTrue(user.getIsEnabled());
                    assertTrue(encryptionService.matchPassword(password, user.getPassword()));
                    assertFalse(user.getIsAnonymous());
                    assertFalse(user.getIsNewUser());//
                    assertFalse(user.isHasSetNickname());
                    assertNotNull(user.getId());
                    //connections
                    assertEquals(2, user.getConnections().size());
                    Connection connection = Iterables.getLast(user.getConnections(), null);
                    assertNotNull(connection);
                    assertEquals(authId1, connection.getAuthId());
                    assertEquals(source1, connection.getSource());
                    assertEquals(email, connection.getRawId());
                    assertEquals(email, connection.getName());
                    assertNull(connection.getAvatar());
                    assertEquals(1, connection.getOrgIds().size());
                    assertNull(connection.getAuthConnectionAuthToken());
                    assertEquals(Map.of("email", email), connection.getRawUserInfo());
                })
                .verifyComplete();

        // Mockito.framework().clearInlineMocks();
    }

    private static final String NEW27_SOURCE_PREFIX = "KEYCLOAK_NEW27_";
    private static final String NEW27_AUTH_ID = "keycloak-new27";
    private static final String NEW27_REALM = "lowcoder";
    private static final String NEW27_TOKEN_PATH = "/realms/" + NEW27_REALM + "/protocol/openid-connect/token";
    private static final String NEW27_USER_PATH = "/realms/" + NEW27_REALM + "/protocol/openid-connect/userinfo";
    private static final String NEW27_TOKEN_ANSWER = "{\"access_token\":\"at.new27\",\"expires_in\":300,\"refresh_token\":\"rt.new27\"}";
    private static final String NEW27_SEEDED_EMAIL_TEMPLATE = "seeded-%s@example.com";
    private static final String NEW27_LOGIN_EMAIL_TEMPLATE = "new27-%s@example.com";
    private static final String NEW27_ORG_ID = "org01";
    private static final String NEW27_CODE = "new27-code";
    private static final String NEW27_REDIRECT_URL = "https://test.com";
    private static final String NEW27_SEEDED_NAME = "Seeded";
    private static final String NEW27_SOURCE_NAME = "Keycloak NEW-27";
    private static final String NEW27_CLIENT_ID = "clientid";
    private static final String NEW27_CLIENT_SECRET = "clientsecret";
    private static final String NEW27_SCOPE = "openid";
    private static final String EMAIL_KEY = "email";
    /** The user endpoint's answer: an email and no {@code sub}. */
    private static final String NEW27_USER_WITHOUT_SUB_TEMPLATE = "{\"email\":\"%s\"}";
    /** The uid refusals the login may answer: Generic's ({@code GenericAuthRequest.NO_UID}), or the base class's
     * ({@code AbstractOauth2Request.NO_USER_ID}) should Generic's no longer run; both are package-private elsewhere. */
    private static final Set<String> NEW27_UID_REFUSALS = Set.of("The user information has no value for the source mapping uid",
            "The identity provider's user information has no user id");
    private static final int NEW27_ONE_REQUEST = 1;
    private static final int NEW27_REFUSAL_ARGUMENTS = 1;
    private static final String CONNECTIONS_FIELD = "connections";
    private static final String RAW_ID_FIELD = "rawId";
    private static final Duration NEW27_TIMEOUT = Duration.ofSeconds(30);

    /**
     * NEW-27's collision: an account left by an earlier login without a uid (its connection stored without a raw id) must
     * not be found by a later login without a uid. The test establishes the premise first — the stored connection has no
     * {@code rawId} key, and the login's null lookup finds that account — then logs in through the controller with a
     * Keycloak user that has no {@code sub}: the account's raw document is unchanged, the null lookup still finds only it,
     * no account has the login's email, and the login fails with FAIL_TO_GET_OIDC_INFO after one token and one user
     * request, for a uid refusal. The source is a fresh UUID, so no earlier state can match.
     * <p>
     * Limits: the HTTP mapping of the refusal (the global exception handler) and {@code /tp/link}, which runs the same
     * {@code authenticateByOauth2}, are not run here.
     */
    @Test
    @WithMockUser
    @SuppressWarnings("unchecked")
    public void keycloakLoginWithoutASub_isRefusedAndLeavesAnAccountWithoutARawIdAloneNEW27(WireMockRuntimeInfo wmRuntimeInfo) {
        String run = UUID.randomUUID().toString();
        String source = NEW27_SOURCE_PREFIX + run;
        String seededEmail = String.format(NEW27_SEEDED_EMAIL_TEMPLATE, run);
        String loginEmail = String.format(NEW27_LOGIN_EMAIL_TEMPLATE, run);
        String seededId = null;
        Throwable primary = null;
        try {
            assertNull(userRepository.findByConnections_SourceAndConnections_RawId(source, null).block(NEW27_TIMEOUT), "source unknown before the test");
            Connection withoutRawId = Connection.builder().authId(NEW27_AUTH_ID).source(source).name(NEW27_SEEDED_NAME).email(seededEmail)
                    .orgIds(new HashSet<>(Set.of(NEW27_ORG_ID))).rawUserInfo(Map.of(EMAIL_KEY, seededEmail)).build();
            User seeded = userRepository.save(User.builder().name(NEW27_SEEDED_NAME).email(seededEmail).state(UserState.ACTIVATED).isEnabled(true)
                    .connections(new HashSet<>(Set.of(withoutRawId))).build()).block(NEW27_TIMEOUT);
            seededId = seeded.getId();
            String collection = mongoTemplate.getCollectionName(User.class);
            Document baseline = mongoTemplate.findById(seededId, Document.class, collection).block(NEW27_TIMEOUT);
            Document storedConnection = ((List<Document>) baseline.get(CONNECTIONS_FIELD)).get(0);
            System.out.println("[GenericAuthenticateTest] NEW-27 source " + source + ", seeded " + seededId + ", stored connection " + storedConnection.toJson());
            assertFalse(storedConnection.containsKey(RAW_ID_FIELD), "the connection is stored without a rawId key");
            User foundByNull = userRepository.findByConnections_SourceAndConnections_RawId(source, null).block(NEW27_TIMEOUT);
            System.out.println("[GenericAuthenticateTest] NEW-27 null lookup before the login -> " + (foundByNull == null ? null : foundByNull.getId()));
            assertNotNull(foundByNull, "the null lookup matches a connection without a rawId key");
            assertEquals(seededId, foundByNull.getId());
            assertTrue(userRepository.findByEmailOrConnections_Email(loginEmail, loginEmail).collectList().block(NEW27_TIMEOUT).isEmpty(), "login email unknown");

            var keycloak = Oauth2KeycloakAuthConfig.builder().id(NEW27_AUTH_ID).authType(AuthTypeConstants.KEYCLOAK).source(source)
                    .sourceName(NEW27_SOURCE_NAME).enable(true).enableRegister(true).clientId(NEW27_CLIENT_ID).clientSecret(NEW27_CLIENT_SECRET)
                    .baseUrl(wmRuntimeInfo.getHttpBaseUrl()).realm(NEW27_REALM).scope(NEW27_SCOPE).build();
            var found = new FindAuthConfig(keycloak, Organization.builder().id(NEW27_ORG_ID).build());
            Mockito.when(authenticationService.findAuthConfigByAuthId(Mockito.any(), Mockito.any())).thenReturn(Mono.just(found));
            stubFor(post(urlPathEqualTo(NEW27_TOKEN_PATH)).willReturn(okJson(NEW27_TOKEN_ANSWER)));
            stubFor(any(urlPathEqualTo(NEW27_USER_PATH)).willReturn(okJson(String.format(NEW27_USER_WITHOUT_SUB_TEMPLATE, loginEmail))));

            MockServerWebExchange exchange = MockServerWebExchange.builder(MockServerHttpRequest.post("").build()).build();
            Signal<?> outcome = authenticationController.loginWithThirdParty(NEW27_AUTH_ID, source, NEW27_CODE, null, NEW27_REDIRECT_URL, NEW27_ORG_ID, exchange)
                    .materialize().block(NEW27_TIMEOUT);
            System.out.println("[GenericAuthenticateTest] NEW-27 login outcome " + outcome);
            int tokenRequests = findAll(postRequestedFor(urlPathEqualTo(NEW27_TOKEN_PATH))).size();
            int userRequests = findAll(anyRequestedFor(urlPathEqualTo(NEW27_USER_PATH))).size();
            System.out.println("[GenericAuthenticateTest] NEW-27 token requests " + tokenRequests + ", user requests " + userRequests);

            Document after = mongoTemplate.findById(seededId, Document.class, collection).block(NEW27_TIMEOUT);
            System.out.println("[GenericAuthenticateTest] NEW-27 seeded after the login " + (after == null ? null : after.toJson()));
            assertEquals(baseline, after, "the seeded account without a rawId is unchanged by the login without a uid");
            User foundByNullAfter = userRepository.findByConnections_SourceAndConnections_RawId(source, null).block(NEW27_TIMEOUT);
            System.out.println("[GenericAuthenticateTest] NEW-27 null lookup after the login -> " + (foundByNullAfter == null ? null : foundByNullAfter.getId()));
            assertEquals(seededId, foundByNullAfter == null ? null : foundByNullAfter.getId(), "the null lookup still finds only the seeded account");
            assertTrue(userRepository.findByEmailOrConnections_Email(loginEmail, loginEmail).collectList().block(NEW27_TIMEOUT).isEmpty(),
                    "no account has the login's email");
            assertNotNull(outcome);
            assertTrue(outcome.isOnError(), "the login fails");
            BizException error = assertInstanceOf(BizException.class, outcome.getThrowable());
            assertEquals(BizError.FAIL_TO_GET_OIDC_INFO, error.getError());
            System.out.println("[GenericAuthenticateTest] NEW-27 refusal " + error.getMessage());
            assertEquals(NEW27_ONE_REQUEST, tokenRequests, "the login reached the token endpoint");
            assertEquals(NEW27_ONE_REQUEST, userRequests, "the login reached the user endpoint, so the refusal is about its answer");
            assertEquals(NEW27_REFUSAL_ARGUMENTS, error.getArgs().length);
            assertTrue(NEW27_UID_REFUSALS.contains(error.getArgs()[0]), "the refusal is a uid refusal: " + error.getArgs()[0]);
        } catch (Throwable failure) {
            primary = failure;
        }
        try {
            if (seededId != null) {
                userRepository.deleteById(seededId).block(NEW27_TIMEOUT);
            }
            Long removed = userRepository.findByEmailOrConnections_Email(loginEmail, loginEmail).flatMap(user -> userRepository.delete(user).thenReturn(user))
                    .count().block(NEW27_TIMEOUT);
            System.out.println("[GenericAuthenticateTest] NEW-27 cleanup: seeded " + seededId + " deleted, " + removed + " account(s) with the login email deleted");
        } catch (Throwable cleanupFailure) {
            if (primary == null) {
                primary = cleanupFailure;
            } else {
                primary.addSuppressed(cleanupFailure);
            }
        }
        if (primary instanceof RuntimeException runtime) {
            throw runtime;
        }
        if (primary instanceof Error error) {
            throw error;
        }
        if (primary != null) {
            throw new AssertionError(primary);
        }
    }

    private String getEmailAuthConfigId() {
        return authenticationService.findAuthConfigBySource(null, AuthSourceConstants.EMAIL)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .contextWrite(Context.of(GlobalContext.DOMAIN, "avengers.com"))
                .block();
    }

    private Mono<String> getGenericAuthConfigId(String orgId) {
        return authenticationService.findAuthConfigBySource(orgId, AuthSourceConstants.GOOGLE)
                .map(FindAuthConfig::authConfig)
                .map(AbstractAuthConfig::getId)
                .contextWrite(Context.of(GlobalContext.DOMAIN, "avengers.com"));
    }
}

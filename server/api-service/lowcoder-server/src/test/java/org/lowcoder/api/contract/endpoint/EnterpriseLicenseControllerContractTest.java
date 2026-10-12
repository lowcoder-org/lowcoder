package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.subscription.EnterpriseLicenseController;
import org.lowcoder.api.subscription.RedirectedEnterpriseLicenseController;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;

/**
 * Tests of the 1 {@link EnterpriseLicenseController} endpoint, {@code POST /api/enterprise-licenses/{action}} (B01), level
 * {@code codec}, group {@code subscription-relay}. {@code request} takes the action from the path and any JSON value as
 * body ({@code JsonNode}); it authenticates the session's member itself (an admin or super admin of the body's
 * {@code orgId}, {@code EnterpriseLicenseController.java:47-52}), refuses a checkout on the public cloud ({@code :56-61})
 * and an installation without a deployment id or relay URL ({@code :62-65}), builds the relay payload from the session
 * and the configuration, never from the browser's ids ({@code :67-98}), and answers the relay's {@code JsonNode} as the
 * envelope's {@code data} ({@code :100-102}). {@code send} refuses a relay URL that is not {@code https}
 * ({@code :115-118}) and posts the payload with the owner token header ({@code :119-123}).
 *
 * <p>The controller under test is a {@link RedirectedEnterpriseLicenseController}, the production class whose
 * {@code send} runs with {@link WebClientRedirect} open, so its relay request goes to WireMock; the session, the
 * configuration and the token service are mocks. Every refusal test sends an otherwise valid request, so that only the
 * guard under test refuses it, and asserts that the relay received nothing; the token was never requested, except in
 * {@link #requestToARelayWithoutHttps}, whose refusal comes from {@code send}, after the token ({@code :100-101}):
 *
 * <ul>
 *   <li>the branches: {@link #request} (the client's {@code status} body: the relay receives the owner token and the
 *       session's and configuration's members, the client the relay's answer), {@link #requestWithoutASession},
 *       {@link #requestByANonAdmin}, {@link #checkoutOnThePublicCloud} and {@link #requestNotConfigured};</li>
 *   <li>the other guards: {@link #requestForAnotherWorkspace}, {@link #requestByAnInvalidMember},
 *       {@link #requestWithAJsonNullBody}, {@link #requestWithABodyThatIsNotAnObject}, {@link #requestWithoutABody},
 *       {@link #checkoutWithAnUnsafeReturnOrigin}, {@link #checkoutWithoutARequiredMember},
 *       {@link #checkoutWithForeignDeployments} and {@link #requestToARelayWithoutHttps}; {@link #requestRelayFailed}:
 *       a relay error;</li>
 *   <li>the payloads: {@link #checkoutRepresentativeData}, the {@code subscription-relay} group's enterprise test (the
 *       §4.6 representative input as {@code contactData} and as the relay's answer, pinned in {@value #CHECKOUT_BODY}
 *       and {@value #ENTERPRISE_ANSWER}), and {@link #everyActionSendsItsMembers}.</li>
 * </ul>
 *
 * <p>Each {@code ResponseStatusException} answers HTTP 500 today: outside the plugin path the global handler answers
 * its generic {@code INTERNAL_SERVER_ERROR} (NEW-53, see {@link #assertStatusExceptionAnsweredAs500NEW53}).
 *
 * <p>Limits: the controller is a test subclass whose {@code send} only redirects; the transport (system proxy,
 * timeout) is WireMock's; the harness has no security chain, so the login that {@code /api/**} requires in production
 * is not run, only the controller's own session check. The 400 and 503 branches thrown inside the handler's lambda
 * ({@code :75-80}, {@code :91-97}) and {@code send}'s {@code https} refusal ({@code :116-118}) are not response-branch
 * occurrences; they are {@link #checkoutWithForeignDeployments}, {@link #checkoutWithoutARequiredMember},
 * {@link #checkoutWithAnUnsafeReturnOrigin} and {@link #requestToARelayWithoutHttps}; the other return-origin URL tricks
 * stay with {@code EnterpriseLicenseControllerTest#httpReturnExceptionDoesNotAllowRemoteHostsOrUrlTricks}.
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}: the answer is the relay's.
 */
@WireMockTest
class EnterpriseLicenseControllerContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(EnterpriseLicenseController.class);
    /** The handler method's name. */
    static final String REQUEST = "request";
    /** The bean name of the controller, as Spring would name {@code EnterpriseLicenseController}. */
    static final String CONTROLLER_BEAN = "enterpriseLicenseController";
    static final String CHECKOUT = "checkout";
    static final String STATUS = "status";
    static final String SYNC = "sync";
    static final String DOWNLOAD = "download";
    static final String PORTAL = "portal";
    static final String ORG_ID = "EnterpriseLicenseControllerContractTest.workspace";
    static final String OTHER_ORG_ID = "EnterpriseLicenseControllerContractTest.other-workspace";
    static final String BLANK = "";
    static final String USER_ID = "EnterpriseLicenseControllerContractTest.admin";
    static final String MEMBER_STATE = "normal";
    static final long JOIN_TIME = 0L;
    static final String HOST_ID = "EnterpriseLicenseControllerContractTest.host";
    static final String OTHER_HOST_ID = "EnterpriseLicenseControllerContractTest.other-host";
    static final String SECOND_HOST_ID = "EnterpriseLicenseControllerContractTest.second-host";
    static final String THIRD_HOST_ID = "EnterpriseLicenseControllerContractTest.third-host";
    static final String FOURTH_HOST_ID = "EnterpriseLicenseControllerContractTest.fourth-host";
    static final String OWNER_TOKEN = "EnterpriseLicenseControllerContractTest.owner-token";
    static final String LICENSE_ID = "EnterpriseLicenseControllerContractTest.license";
    static final String REQUEST_ID = "00000000-0000-4000-8000-000000000001";
    static final String BILLING_INTERVAL = "year";
    /** The relay's path: the production default URL's, {@code EnterpriseLicenseController.java:35}. */
    static final String RELAY_PATH = "/webhook/secure/enterprise-licenses";
    /** A reserved host (RFC 2606): a request that missed the redirection fails instead of reaching a real relay. */
    static final String RELAY_URL = "https://enterprise-relay.invalid" + RELAY_PATH;
    static final String RELAY_URL_WITHOUT_HTTPS = "http://enterprise-relay.invalid" + RELAY_PATH;
    static final String OWNER_HEADER = "Lowcoder-Enterprise-Owner";
    /** The relay's HTTP method, as WireMock reports it. */
    static final String RELAY_METHOD = "POST";
    static final String PUBLIC_URL = "https://lowcoder.example";
    static final String PUBLIC_CLOUD_URL = "https://app.lowcoder.cloud";
    static final String UNSAFE_RETURN_ORIGIN = "http://example.test";
    static final String RETURN_PATH = "/setting/subscription?enterpriseLicense=return";
    /** The deployment id's configuration key and default, as {@code EnterpriseLicenseController.java:62} reads it. */
    static final String DEPLOYMENT_ID_KEY = "id";
    static final String ACTION_MEMBER = "action";
    static final String HOST_ID_MEMBER = "hostId";
    static final String ORG_ID_MEMBER = "orgId";
    static final String USER_ID_MEMBER = "userId";
    static final String ISSUED_AT_MEMBER = "issuedAt";
    static final String REQUEST_ID_MEMBER = "requestId";
    static final String BILLING_INTERVAL_MEMBER = "billingInterval";
    static final String CONTACT_DATA_MEMBER = "contactData";
    static final String DEPLOYMENT_IDS_MEMBER = "deploymentIds";
    static final String RETURN_URL_MEMBER = "returnUrl";
    static final String RETURN_ORIGIN_MEMBER = "returnOrigin";
    static final String LICENSE_ID_MEMBER = "licenseId";
    static final String COMPANY_NAME_MEMBER = "companyName";
    static final String COMPANY_NAME = "EnterpriseLicenseControllerContractTest.company";
    /** Bodies that are JSON but not an object: an array, a string, a number. */
    static final String ARRAY_BODY = "[]";
    static final String STRING_BODY = "\"EnterpriseLicenseControllerContractTest.text\"";
    static final String NUMBER_BODY = "1";
    /** The cases of {@link #checkoutWithForeignDeployments}, by name. */
    static final String ANOTHER_HOST_FIRST = "another host first";
    static final String FOUR_DEPLOYMENTS = "four deployments";
    static final String NO_DEPLOYMENT = "an empty array";
    static final String DEPLOYMENT_AS_A_STRING = "a string";
    /** {@code issuedAt} as the payload writes it, a number, in the text WireMock received. */
    static final Pattern ISSUED_AT = Pattern.compile("\"" + ISSUED_AT_MEMBER + "\":(-?\\d+)");
    /** The group of {@link #ISSUED_AT} that holds the number. */
    static final int ISSUED_AT_VALUE = 1;
    /** Stands for {@code issuedAt}'s value in {@value #CHECKOUT_BODY}. */
    static final String ISSUED_AT_PLACEHOLDER = "@@enterprise-issued-at@@";
    /** Stands for {@code contactData} while the request is written; replaced, quotes included, by the representative input. */
    static final String CONTACT_DATA_PLACEHOLDER = "@@enterprise-contact-data@@";
    static final String CHECKOUT_BODY = "boundary/subscription-relay/checkout.body.json";
    static final String ENTERPRISE_ANSWER = "boundary/subscription-relay/enterprise-license.answer.json";
    static final String RELAY_ANSWER = "{\"EnterpriseLicenseControllerContractTest.answer\":\"EnterpriseLicenseControllerContractTest.value\"}";
    static final int OK = 200;
    static final int RELAY_ERROR = 503;
    /** {@code catchServerWebInputException}'s message key and its reason's form, {@code <parameter>' : <Controller>.<method>}. */
    static final String DECODE_MESSAGE_KEY = "INVALID_PARAMETER_PLZ_CHECK";
    static final String BODY_PARAMETER = "body";
    static final String REASON_CONTROLLER_SEPARATOR = "' : ";
    static final String REASON_METHOD_SEPARATOR = ".";
    static final String JSON_NULL = "null";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private WireMockRuntimeInfo wireMock;
    private ContractTestClient.Builder builder;
    private SessionUserService sessions;
    private ConfigCenter config;
    private EnterpriseLicenseCapabilityService capabilities;
    private EnterpriseLicenseController controller;

    @BeforeEach
    void harness(WireMockRuntimeInfo wireMock) {
        this.wireMock = wireMock;
        wireMock.getWireMock().resetMappings();
        wireMock.getWireMock().resetRequests();
        builder = ContractTestClient.builder();
        sessions = builder.mock(SessionUserService.class);
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(ORG_ID, MemberRole.ADMIN)));
        config = Mockito.mock(ConfigCenter.class, Mockito.RETURNS_DEEP_STUBS);
        Mockito.when(config.deployment().ofString(DEPLOYMENT_ID_KEY, BLANK).get()).thenReturn(HOST_ID);
        capabilities = Mockito.mock(EnterpriseLicenseCapabilityService.class);
        Mockito.when(capabilities.token(anyString(), anyString(), anyString())).thenReturn(Mono.just(OWNER_TOKEN));
        relayAnswers(json(RELAY_ANSWER));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(EnterpriseLicenseControllerContractTest.class);
    }

    /** The client's {@code status} request ({@code licenseRequestApi.ts:45}, {@code :53}) by an admin of the workspace. */
    @Test
    void request() throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        long before = System.currentTimeMillis();
        EntityExchangeResult<byte[]> result = exchange(STATUS, write(orgBody(ORG_ID).put(RETURN_ORIGIN_MEMBER, PUBLIC_URL)));
        long after = System.currentTimeMillis();
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(RELAY_ANSWER));
        String sent = sentRelayRequest().getBodyAsString();
        assertThat(issuedAtOf(sent)).as("issuedAt, a time of the exchange").isBetween(before, after);
        CanonicalJson.assertEquivalent(write(commonMembers(STATUS).put(ISSUED_AT_MEMBER, ISSUED_AT_PLACEHOLDER)), withIssuedAtPlaceholder(sent));
        Mockito.verify(capabilities).token(HOST_ID, ORG_ID, USER_ID);
    }

    @Test
    void requestWithoutASession() throws JsonProcessingException {
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(ORG_ID))));
    }

    @Test
    void requestByANonAdmin() throws JsonProcessingException {
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(ORG_ID, MemberRole.MEMBER)));
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(ORG_ID))));
    }

    @Test
    void checkoutOnThePublicCloud() throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_CLOUD_URL);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(checkoutBody())));
    }

    @Test
    void requestNotConfigured() throws JsonProcessingException {
        Mockito.when(config.deployment().ofString(DEPLOYMENT_ID_KEY, BLANK).get()).thenReturn(BLANK);
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(ORG_ID))));
    }

    /** An admin of another workspace than the body's {@code orgId}: the third part of the condition at {@code :50-51}. */
    @Test
    void requestForAnotherWorkspace() throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(OTHER_ORG_ID))));
    }

    /**
     * An admin whose org id is blank, for a body whose {@code orgId} is blank too: the role and the workspace match, so
     * only {@code isInvalid} ({@code OrgMember.java:28-29}), the first part of the condition at {@code :50}, refuses.
     */
    @Test
    void requestByAnInvalidMember() throws JsonProcessingException {
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(BLANK, MemberRole.ADMIN)));
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(BLANK))));
    }

    /** The body {@code null} decodes to a {@code NullNode}, whose {@code orgId} reads as "": the workspace check refuses. */
    @Test
    void requestWithAJsonNullBody() {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, JSON_NULL));
    }

    /** A {@code JsonNode} body binds any JSON value; a non-object's {@code orgId} reads as "": the workspace check refuses. */
    @ParameterizedTest
    @ValueSource(strings = {ARRAY_BODY, STRING_BODY, NUMBER_BODY})
    void requestWithABodyThatIsNotAnObject(String body) {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, body));
    }

    /** No body: the required {@code @RequestBody} fails before the controller runs; the global handler names the parameter. */
    @Test
    void requestWithoutABody() {
        register(RELAY_URL, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(SYNC, null);
        String reason = BODY_PARAMETER + REASON_CONTROLLER_SEPARATOR + controller.getClass().getSimpleName() + REASON_METHOD_SEPARATOR + REQUEST;
        EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, DECODE_MESSAGE_KEY, reason);
        assertNoRelayRequest();
        Mockito.verify(capabilities, Mockito.never()).token(anyString(), anyString(), anyString());
    }

    /** The relay answers 503: {@code retrieve()} turns it into a {@code WebClientResponseException}, answered as HTTP 500. */
    @Test
    void requestRelayFailed() throws JsonProcessingException {
        relayAnswers(aResponse().withStatus(RELAY_ERROR));
        register(RELAY_URL, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(SYNC, write(orgBody(ORG_ID)));
        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
        assertThat(sentRelayRequest().getUrl()).as("relay path").isEqualTo(RELAY_PATH);
    }

    /** No public URL configured and a {@code returnOrigin} that is neither {@code https} nor loopback: the 503 of {@code :96}. */
    @Test
    void checkoutWithAnUnsafeReturnOrigin() throws JsonProcessingException {
        register(RELAY_URL, BLANK);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(checkoutBody().put(RETURN_ORIGIN_MEMBER, UNSAFE_RETURN_ORIGIN))));
    }

    /** A valid checkout without one of the members {@code :79-80} require: the {@code BAD_REQUEST} of {@code :80}. */
    @ParameterizedTest
    @ValueSource(strings = {REQUEST_ID_MEMBER, BILLING_INTERVAL_MEMBER, CONTACT_DATA_MEMBER})
    void checkoutWithoutARequiredMember(String member) throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        ObjectNode body = checkoutBody();
        body.remove(member);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(body)));
    }

    static Stream<Arguments> foreignDeployments() {
        ArrayNode anotherHostFirst = PayloadAssertions.FIXTURE_EDITOR.createArrayNode().add(OTHER_HOST_ID).add(HOST_ID);
        ArrayNode fourHosts = PayloadAssertions.FIXTURE_EDITOR.createArrayNode().add(HOST_ID).add(SECOND_HOST_ID).add(THIRD_HOST_ID)
                .add(FOURTH_HOST_ID);
        ArrayNode none = PayloadAssertions.FIXTURE_EDITOR.createArrayNode();
        return Stream.of(Arguments.of(ANOTHER_HOST_FIRST, anotherHostFirst), Arguments.of(FOUR_DEPLOYMENTS, fourHosts),
                Arguments.of(NO_DEPLOYMENT, none), Arguments.of(DEPLOYMENT_AS_A_STRING, TextNode.valueOf(HOST_ID)));
    }

    /** {@code deploymentIds} that are not one to three ids led by this deployment: the {@code BAD_REQUEST} of {@code :75-77}. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("foreignDeployments")
    void checkoutWithForeignDeployments(String name, JsonNode deploymentIds) throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        ObjectNode body = checkoutBody();
        body.set(DEPLOYMENT_IDS_MEMBER, deploymentIds);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(body)));
    }

    /** A relay URL that is not {@code https}: {@code send} answers the 503 of {@code :117} before it builds a client. */
    @Test
    void requestToARelayWithoutHttps() throws JsonProcessingException {
        register(RELAY_URL_WITHOUT_HTTPS, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(SYNC, write(orgBody(ORG_ID)));
        assertStatusExceptionAnsweredAs500NEW53(result);
        assertNoRelayRequest();
        Mockito.verify(capabilities).token(HOST_ID, ORG_ID, USER_ID);
    }

    /**
     * A checkout whose {@code contactData} is the §4.6 representative input, answered with that input: the relay's body
     * is pinned in {@value #CHECKOUT_BODY} ({@code issuedAt} replaced), the client's in {@value #ENTERPRISE_ANSWER}.
     */
    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/EnterpriseLicenseController.java#EnterpriseLicenseController.send#bodyValue#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/EnterpriseLicenseController.java#EnterpriseLicenseController.send#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/EnterpriseLicenseController.java#<file>#import#1"})
    @Test
    void checkoutRepresentativeData() throws JsonProcessingException {
        relayAnswers(json(PayloadSamples.representativeInputText()));
        register(RELAY_URL, PUBLIC_URL);
        String request = write(checkoutBody().put(CONTACT_DATA_MEMBER, CONTACT_DATA_PLACEHOLDER))
                .replace("\"" + CONTACT_DATA_PLACEHOLDER + "\"", PayloadSamples.representativeInputText());
        long before = System.currentTimeMillis();
        EntityExchangeResult<byte[]> result = exchange(CHECKOUT, request);
        long after = System.currentTimeMillis();
        assertThat(result.getStatus().value()).as("status").isEqualTo(OK);
        String sent = sentRelayRequest().getBodyAsString();
        assertThat(issuedAtOf(sent)).as("issuedAt, a time of the exchange").isBetween(before, after);
        String answer = new String(result.getResponseBodyContent(), StandardCharsets.UTF_8);
        String output = GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT);
        JsonNode sentTree = PayloadAssertions.FIXTURE_EDITOR.readTree(sent);
        JsonNode answerTree = PayloadAssertions.FIXTURE_EDITOR.readTree(answer);
        System.out.println("[EnterpriseLicenseControllerContractTest] the relay's contactData "
                + (CanonicalJson.compare(output, write(sentTree.get(CONTACT_DATA_MEMBER))).equivalent() ? "equals" : "differs from")
                + " and the client's data " + (CanonicalJson.compare(output, write(answerTree.get(EndpointContract.DATA))).equivalent()
                ? "equals" : "differs from") + " the production mapper's output " + PayloadSamples.REPRESENTATIVE_OUTPUT);
        GOLDEN.assertJson(CHECKOUT_BODY, withIssuedAtPlaceholder(sent));
        GOLDEN.assertJson(ENTERPRISE_ANSWER, answer);
    }

    /**
     * The client's other actions ({@code licenseRequestApi.ts:54-58}): {@code sync} sends the common members only
     * ({@code :67-72}), {@code download} adds {@code licenseId} ({@code :84}), {@code portal} adds {@code requestId}
     * ({@code :85}) and the {@code returnUrl} built from the configured public URL ({@code :86-98}).
     */
    @ParameterizedTest
    @ValueSource(strings = {SYNC, DOWNLOAD, PORTAL})
    void everyActionSendsItsMembers(String action) throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        ObjectNode body = orgBody(ORG_ID).put(RETURN_ORIGIN_MEMBER, PUBLIC_URL);
        ObjectNode expected = commonMembers(action).put(ISSUED_AT_MEMBER, ISSUED_AT_PLACEHOLDER);
        switch (action) {
            case DOWNLOAD -> {
                body.put(LICENSE_ID_MEMBER, LICENSE_ID);
                expected.put(LICENSE_ID_MEMBER, LICENSE_ID);
            }
            case PORTAL -> {
                body.put(REQUEST_ID_MEMBER, REQUEST_ID);
                expected.put(REQUEST_ID_MEMBER, REQUEST_ID).put(RETURN_URL_MEMBER, PUBLIC_URL + RETURN_PATH);
            }
            default -> {
            }
        }
        EntityExchangeResult<byte[]> result = exchange(action, write(body));
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(RELAY_ANSWER));
        CanonicalJson.assertEquivalent(write(expected), withIssuedAtPlaceholder(sentRelayRequest().getBodyAsString()));
    }

    /** Registers the controller with {@code relayUrl} and {@code publicUrl}; its relay requests go to WireMock. */
    private void register(String relayUrl, String publicUrl) {
        controller = new RedirectedEnterpriseLicenseController(sessions, config, capabilities, relayUrl, publicUrl, wireMock.getHttpBaseUrl());
        builder.singleton(CONTROLLER_BEAN, controller);
    }

    /** Sends {@code body} (none when {@code null}) to the action {@code action}. */
    private EntityExchangeResult<byte[]> exchange(String action, String body) {
        try (ContractTestClient client = builder.build()) {
            return CONTRACT.exchange(client, REQUEST, Map.of(), body, action);
        }
    }

    private void relayAnswers(ResponseDefinitionBuilder answer) {
        wireMock.getWireMock().register(post(urlPathEqualTo(RELAY_PATH)).willReturn(answer));
    }

    private static ResponseDefinitionBuilder json(String body) {
        return aResponse().withStatus(OK).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).withBody(body);
    }

    /** The one request the relay received, with the owner token and a JSON body. */
    private LoggedRequest sentRelayRequest() {
        List<LoggedRequest> requests = wireMock.getWireMock().find(anyRequestedFor(anyUrl()));
        assertThat(requests).as("relay requests").hasSize(1);
        LoggedRequest request = requests.get(0);
        System.out.println("[EnterpriseLicenseControllerContractTest] relay received " + request.getMethod() + " " + request.getUrl() + " "
                + request.getHeaders().all() + " " + request.getBodyAsString());
        assertThat(request.getMethod().value()).as("relay method").isEqualTo(RELAY_METHOD);
        assertThat(request.getUrl()).as("relay path").isEqualTo(RELAY_PATH);
        assertThat(request.getHeader(OWNER_HEADER)).as("relay owner token header").isEqualTo(OWNER_TOKEN);
        assertThat(request.getHeader(HttpHeaders.CONTENT_TYPE)).as("relay Content-Type").isEqualTo(MediaType.APPLICATION_JSON_VALUE);
        return request;
    }

    private void assertNoRelayRequest() {
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("relay requests").isEmpty();
    }

    /** A guard refused: HTTP 500 today (NEW-53), no relay request, and the token never requested. */
    private void assertRefusedBeforeTheRelay(EntityExchangeResult<byte[]> result) {
        assertStatusExceptionAnsweredAs500NEW53(result);
        assertNoRelayRequest();
        Mockito.verify(capabilities, Mockito.never()).token(anyString(), anyString(), anyString());
    }

    /**
     * Pins how a {@code ResponseStatusException} of this endpoint reaches the client today: the global handler keeps its
     * status only under the plugin path and otherwise answers its generic {@code INTERNAL_SERVER_ERROR}, HTTP 500
     * ({@code GlobalExceptionHandler.java:141-154}, {@code :158-167}). NEW-53, recorded, not fixed: its fix changes this
     * one method.
     */
    private static void assertStatusExceptionAnsweredAs500NEW53(EntityExchangeResult<byte[]> result) {
        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
    }

    /** {@code issuedAt} in the text the relay received. */
    private static long issuedAtOf(String sent) {
        Matcher matcher = ISSUED_AT.matcher(sent);
        assertThat(matcher.find()).as("issuedAt in " + sent).isTrue();
        return Long.parseLong(matcher.group(ISSUED_AT_VALUE));
    }

    /** The text the relay received with {@code issuedAt}'s value replaced by {@link #ISSUED_AT_PLACEHOLDER}, order kept. */
    private static String withIssuedAtPlaceholder(String sent) {
        return ISSUED_AT.matcher(sent).replaceFirst(Matcher.quoteReplacement("\"" + ISSUED_AT_MEMBER + "\":\"" + ISSUED_AT_PLACEHOLDER + "\""));
    }

    /** The members every action sends, from the session and the configuration ({@code :67-71}), without {@code issuedAt}. */
    private static ObjectNode commonMembers(String action) {
        return PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(ACTION_MEMBER, action).put(HOST_ID_MEMBER, HOST_ID)
                .put(ORG_ID_MEMBER, ORG_ID).put(USER_ID_MEMBER, USER_ID);
    }

    private static ObjectNode orgBody(String orgId) {
        return PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(ORG_ID_MEMBER, orgId);
    }

    /** A checkout that passes {@code :73-83}: this deployment first, every required member, the client's {@code returnOrigin}. */
    private static ObjectNode checkoutBody() {
        ObjectNode body = orgBody(ORG_ID).put(REQUEST_ID_MEMBER, REQUEST_ID).put(BILLING_INTERVAL_MEMBER, BILLING_INTERVAL)
                .put(RETURN_ORIGIN_MEMBER, PUBLIC_URL);
        body.set(DEPLOYMENT_IDS_MEMBER, PayloadAssertions.FIXTURE_EDITOR.createArrayNode().add(HOST_ID).add(SECOND_HOST_ID));
        body.set(CONTACT_DATA_MEMBER, PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(COMPANY_NAME_MEMBER, COMPANY_NAME));
        return body;
    }

    private static OrgMember member(String orgId, MemberRole role) {
        return new OrgMember(orgId, USER_ID, role, MEMBER_STATE, JOIN_TIME);
    }

    private static String write(JsonNode tree) throws JsonProcessingException {
        return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(tree);
    }
}

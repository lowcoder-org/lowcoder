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
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService.PurchaseState;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;

/**
 * Tests of the 1 {@link EnterpriseLicenseController} endpoint, {@code POST /api/enterprise-licenses/{action}} (B01, B02),
 * level {@code codec}, group {@code subscription-relay}. {@code request} takes the action from the path and any JSON value
 * as body ({@code JsonNode}); it authenticates the session's member itself (an admin or super admin of the body's
 * {@code orgId}, {@code EnterpriseLicenseController.java:50-56}), refuses a checkout on the public cloud ({@code :59-64})
 * and an installation without a deployment id ({@code :65-69}), builds the relay payload from the session and the
 * configuration, never from the browser's ids ({@code :70-107}), and answers the relay's {@code JsonNode} as the
 * envelope's {@code data} ({@code :117}). {@code status} and {@code sync} go through {@code library} ({@code :120-142}):
 * without a purchase and without {@code refresh} it answers an empty library without the relay ({@code :123-128});
 * otherwise it relays a lookup, whose action is {@code status} unless the purchase is confirmed ({@code :129-132}),
 * records what the lookup found ({@code :133-135}) and, for a {@code sync} whose lookup found a purchase, relays the
 * {@code sync} itself ({@code :136-138}). Every relay goes through {@code relay} ({@code :148-169}), which accepts only an
 * answer with {@code success: true} and the members its action needs ({@code :153-163}). {@code send} refuses a relay
 * URL that is not {@code https} ({@code :190-198}) and posts the payload with the owner token header ({@code :199-203}).
 *
 * <p>The controller's own handler ({@code :173-179}) answers every {@code ResponseStatusException} with its status and
 * the {@code ResponseView.error} envelope, its reason or "Enterprise licensing request could not be completed", and
 * {@code Retry-After: 60} on 503 ({@link #assertLicensingError}): NEW-53 is fixed upstream for this endpoint.
 *
 * <p>The controller under test is a {@link RedirectedEnterpriseLicenseController}, the production class whose
 * {@code send} runs with {@link WebClientRedirect} open, so its relay request goes to WireMock; the session, the
 * configuration and the capability service (token and purchase state) are mocks, the purchase {@code CONFIRMED} unless
 * a test says otherwise. Every refusal test sends an otherwise valid request, so that only the guard under test refuses
 * it, and asserts that the relay received nothing and the token was never requested, except
 * {@link #requestToARelayWithoutHttps}, whose refusal comes from {@code send}, after the token:
 *
 * <ul>
 *   <li>the branches (rule 8): {@link #request} (the client's {@code status} body), {@link #requestWithoutASession},
 *       {@link #requestByANonAdmin}, {@link #checkoutOnThePublicCloud}, {@link #requestNotConfigured},
 *       {@link #everyActionSendsItsMembers} (the token chain and the non-checkout relay) and
 *       {@link #checkoutRepresentativeData} (the checkout relay);</li>
 *   <li>the other guards: {@link #requestForAnotherWorkspace}, {@link #requestByAnInvalidMember},
 *       {@link #requestWithAJsonNullBody}, {@link #requestWithABodyThatIsNotAnObject}, {@link #requestWithoutABody},
 *       {@link #checkoutWithAnUnsafeReturnOrigin}, {@link #checkoutWithAMalformedReturnOrigin},
 *       {@link #checkoutWithoutARequiredMember}, {@link #checkoutWithForeignDeployments} and
 *       {@link #requestToARelayWithoutHttps};</li>
 *   <li>the relay's answers: {@link #requestRelayFailed} (an HTTP error), {@link #relayAnswerThatIsNotValid};</li>
 *   <li>the library: {@link #statusWithoutAPurchaseAnswersAnEmptyLibrary},
 *       {@link #statusRefreshWithoutAPurchaseAsksTheRelay}, {@link #syncOfAnUnconfirmedPurchase};</li>
 *   <li>the payloads: {@link #checkoutRepresentativeData}, the {@code subscription-relay} group's enterprise test (the
 *       §4.6 representative input as {@code contactData} and as the relay's answer, pinned in {@value #CHECKOUT_BODY}
 *       and {@value #ENTERPRISE_ANSWER}), and {@link #everyActionSendsItsMembers}.</li>
 * </ul>
 *
 * <p>Not pinned, on purpose: the checkout's {@code recordPurchaseStatus(…, true)} after the relay answers
 * ({@code :113-114}) is stubbed but not asserted. It marks the purchase confirmed before any payment, which NEW-61
 * questions for the owner; a test asserting it would fight that decision.
 *
 * <p>Limits: the controller is a test subclass whose {@code send} only redirects; the transport (system proxy,
 * timeout) is WireMock's; the harness has no security chain, so the login that {@code /api/**} requires in production
 * is not run, only the controller's own session check. {@link #requestWithoutABody} pins how Spring routes the missing
 * body's {@code ServerWebInputException}, a {@code ResponseStatusException}, to the controller's handler: framework
 * behaviour an upgrade could change. The checkout order is checked against the relay request only, not against the
 * token. {@code issuedAt} is checked to be a time of the exchange; that it is set after the database calls
 * ({@code :151}) is not. The other return-origin URL tricks stay with
 * {@code EnterpriseLicenseControllerTest#httpReturnExceptionDoesNotAllowRemoteHostsOrUrlTricks}.
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
    static final String OTHER_REQUEST_ID = "00000000-0000-4000-8000-000000000002";
    static final String BILLING_INTERVAL = "year";
    /** The relay's path: the production default URL's, {@code EnterpriseLicenseController.java:38}. */
    static final String RELAY_PATH = "/webhook/secure/enterprise-licenses";
    /** A reserved host (RFC 2606): a request that missed the redirection fails instead of reaching a real relay. */
    static final String RELAY_URL = "https://enterprise-relay.invalid" + RELAY_PATH;
    static final String RELAY_URL_WITHOUT_HTTPS = "http://enterprise-relay.invalid" + RELAY_PATH;
    /** A relay URL {@code URI.create} rejects: a space in the host. */
    static final String MALFORMED_RELAY_URL = "https://enterprise relay.invalid" + RELAY_PATH;
    static final String OWNER_HEADER = "Lowcoder-Enterprise-Owner";
    /** The relay's HTTP method, as WireMock reports it. */
    static final String RELAY_METHOD = "POST";
    static final String PUBLIC_URL = "https://lowcoder.example";
    static final String PUBLIC_CLOUD_URL = "https://app.lowcoder.cloud";
    static final String UNSAFE_RETURN_ORIGIN = "http://example.test";
    /** A return origin {@code URI.create} rejects: a space in the host. */
    static final String MALFORMED_RETURN_ORIGIN = "https://bad origin.test";
    static final String RETURN_PATH = "/setting/subscription?enterpriseLicense=return";
    static final String CHECKOUT_URL = "https://checkout.stripe.com/c/pay/EnterpriseLicenseControllerContractTest";
    static final String PORTAL_URL = "https://billing.stripe.com/p/session/EnterpriseLicenseControllerContractTest";
    static final String LICENSE_FILENAME = "EnterpriseLicenseControllerContractTest.lic";
    static final String LICENSE_TEXT = "EnterpriseLicenseControllerContractTest.license-text";
    /** The deployment id's configuration key and default, as {@code EnterpriseLicenseController.java:65} reads it. */
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
    static final String REFRESH_MEMBER = "refresh";
    static final String SUCCESS_MEMBER = "success";
    static final String ORDERS_MEMBER = "orders";
    static final String LICENSES_MEMBER = "licenses";
    static final String CHECKOUT_URL_MEMBER = "checkoutUrl";
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
    /** The relay's answer to a {@code status} or {@code sync} that found nothing: valid for {@code relay} ({@code :156-157}). */
    static final String EMPTY_LIBRARY = "{\"success\":true,\"orders\":[],\"licenses\":[]}";
    /** A library with one order: a purchase, for {@code hasPurchase} ({@code :144-146}). */
    static final String LIBRARY_WITH_AN_ORDER = "{\"success\":true,\"orders\":[{\"" + REQUEST_ID_MEMBER + "\":\"" + REQUEST_ID
            + "\"}],\"licenses\":[]}";
    /** The {@code sync} answer after a found purchase: a license, so that it differs from the lookup's answer. */
    static final String LIBRARY_WITH_A_LICENSE = "{\"success\":true,\"orders\":[{\"" + REQUEST_ID_MEMBER + "\":\"" + REQUEST_ID
            + "\"}],\"licenses\":[{\"id\":\"" + LICENSE_ID + "\"}]}";
    /** A valid checkout answer: {@code success}, a checkout URL and the request's id ({@code :159-161}). */
    static final String CHECKOUT_ANSWER = "{\"success\":true,\"checkoutUrl\":\"" + CHECKOUT_URL + "\",\"requestId\":\"" + REQUEST_ID + "\"}";
    /** The answers the client reads for {@code download} and {@code portal} ({@code licenseRequestApi.ts:86-89}). */
    static final String DOWNLOAD_ANSWER = "{\"success\":true,\"filename\":\"" + LICENSE_FILENAME + "\",\"license\":\"" + LICENSE_TEXT + "\"}";
    static final String PORTAL_ANSWER = "{\"success\":true,\"url\":\"" + PORTAL_URL + "\"}";
    /** The members the test writes into the representative input to make it a valid checkout answer, then a comma. */
    static final String CHECKOUT_ANSWER_MEMBERS = "\"success\":true,\"checkoutUrl\":\"" + CHECKOUT_URL + "\",\"requestId\":\"" + REQUEST_ID + "\",";
    static final String JSON_OBJECT_START = "{";
    static final int RELAY_ERROR = 503;
    /** The handler's {@code Retry-After} on 503, {@code EnterpriseLicenseController.java:176}. */
    static final String RETRY_AFTER = "Retry-After";
    static final String RETRY_AFTER_SECONDS = "60";
    /** The reasons of {@code EnterpriseLicenseController.java}, at the lines named. */
    static final String DEFAULT_MESSAGE = "Enterprise licensing request could not be completed"; // :178
    static final String PUBLIC_CLOUD_MESSAGE = "Enterprise Edition is self-hosted. Purchase a license from your own Lowcoder installation."; // :63
    static final String NOT_CONFIGURED_MESSAGE = "Enterprise licensing is not configured for this installation"; // :68
    static final String FOREIGN_DEPLOYMENTS_MESSAGE = "First instance must be this deployment"; // :82
    static final String MISSING_MEMBER_PREFIX = "Missing "; // :85
    static final String MALFORMED_RETURN_ORIGIN_MESSAGE = "Invalid Enterprise return origin"; // :96
    static final String UNSAFE_RETURN_ORIGIN_MESSAGE = "Use an HTTPS UI origin or localhost for Enterprise checkout"; // :105
    static final String INVALID_ANSWER_MESSAGE = "Enterprise license service returned an invalid response. Please retry shortly."; // :165
    static final String UNAVAILABLE_MESSAGE = "Enterprise license service is temporarily unavailable. Please retry shortly."; // :168
    static final String RELAY_NOT_HTTPS_MESSAGE = "Enterprise relay requires HTTPS"; // :194, :197
    /** The reason of the {@code ServerWebInputException} for a missing body, Spring's (observed, not derived). */
    static final String NO_BODY_MESSAGE = "No request body";
    static final String JSON_NULL = "null";
    /** The cases of {@link #relayAnswerThatIsNotValid}, by name. */
    static final String WITHOUT_SUCCESS = "status without success";
    static final String NOT_SUCCESS = "status with success false";
    static final String STATUS_WITHOUT_ORDERS = "status without orders";
    static final String SYNC_WITHOUT_LICENSES = "sync without licenses";
    static final String CHECKOUT_WITH_A_BLANK_URL = "checkout with a blank checkoutUrl";
    static final String CHECKOUT_FOR_ANOTHER_REQUEST = "checkout with another requestId";
    /** The cases of {@link #requestToARelayWithoutHttps}, by name. */
    static final String HTTP_RELAY = "http";
    static final String MALFORMED_RELAY = "malformed";
    static final String BLANK_RELAY = "blank";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private WireMockRuntimeInfo wireMock;
    private ContractTestClient.Builder builder;
    private SessionUserService sessions;
    private ConfigCenter config;
    private EnterpriseLicenseCapabilityService capabilities;

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
        Mockito.when(capabilities.purchaseState(anyString(), anyString(), anyString())).thenReturn(Mono.just(PurchaseState.CONFIRMED));
        Mockito.when(capabilities.checkoutAttempted(anyString(), anyString(), anyString())).thenReturn(Mono.empty());
        Mockito.when(capabilities.recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean())).thenReturn(Mono.empty());
        relayAnswers(json(EMPTY_LIBRARY));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(EnterpriseLicenseControllerContractTest.class);
    }

    /**
     * The client's {@code status} request ({@code licenseRequestApi.ts:83-84}) by an admin of the workspace, with a
     * confirmed purchase: the relay receives the lookup, the client its answer, and the empty answer is recorded.
     */
    @Test
    void request() throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        long before = System.currentTimeMillis();
        EntityExchangeResult<byte[]> result = exchange(STATUS, write(orgBody(ORG_ID).put(RETURN_ORIGIN_MEMBER, PUBLIC_URL)));
        long after = System.currentTimeMillis();
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EMPTY_LIBRARY));
        String sent = sentRelayRequest().getBodyAsString();
        assertThat(issuedAtOf(sent)).as("issuedAt, a time of the exchange").isBetween(before, after);
        CanonicalJson.assertEquivalent(write(commonMembers(STATUS).put(ISSUED_AT_MEMBER, ISSUED_AT_PLACEHOLDER)), withIssuedAtPlaceholder(sent));
        Mockito.verify(capabilities).token(HOST_ID, ORG_ID, USER_ID);
        Mockito.verify(capabilities).recordPurchaseStatus(HOST_ID, ORG_ID, USER_ID, false);
    }

    @Test
    void requestWithoutASession() throws JsonProcessingException {
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(ORG_ID))), HttpStatus.UNAUTHORIZED, DEFAULT_MESSAGE);
    }

    @Test
    void requestByANonAdmin() throws JsonProcessingException {
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(ORG_ID, MemberRole.MEMBER)));
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(ORG_ID))), HttpStatus.FORBIDDEN, DEFAULT_MESSAGE);
    }

    @Test
    void checkoutOnThePublicCloud() throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_CLOUD_URL);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(checkoutBody())), HttpStatus.FORBIDDEN, PUBLIC_CLOUD_MESSAGE);
    }

    @Test
    void requestNotConfigured() throws JsonProcessingException {
        Mockito.when(config.deployment().ofString(DEPLOYMENT_ID_KEY, BLANK).get()).thenReturn(BLANK);
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(ORG_ID))), HttpStatus.SERVICE_UNAVAILABLE, NOT_CONFIGURED_MESSAGE);
    }

    /** An admin of another workspace than the body's {@code orgId}: the third part of the condition at {@code :53-54}. */
    @Test
    void requestForAnotherWorkspace() throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(OTHER_ORG_ID))), HttpStatus.FORBIDDEN, DEFAULT_MESSAGE);
    }

    /**
     * An admin whose org id is blank, for a body whose {@code orgId} is blank too: the role and the workspace match, so
     * only {@code isInvalid} ({@code OrgMember.java:28-29}), the first part of the condition at {@code :53}, refuses.
     */
    @Test
    void requestByAnInvalidMember() throws JsonProcessingException {
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(BLANK, MemberRole.ADMIN)));
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, write(orgBody(BLANK))), HttpStatus.FORBIDDEN, DEFAULT_MESSAGE);
    }

    /** The body {@code null} decodes to a {@code NullNode}, whose {@code orgId} reads as "": the workspace check refuses. */
    @Test
    void requestWithAJsonNullBody() {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, JSON_NULL), HttpStatus.FORBIDDEN, DEFAULT_MESSAGE);
    }

    /** A {@code JsonNode} body binds any JSON value; a non-object's {@code orgId} reads as "": the workspace check refuses. */
    @ParameterizedTest
    @ValueSource(strings = {ARRAY_BODY, STRING_BODY, NUMBER_BODY})
    void requestWithABodyThatIsNotAnObject(String body) {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, body), HttpStatus.FORBIDDEN, DEFAULT_MESSAGE);
    }

    /**
     * No body: the required {@code @RequestBody} fails before the controller runs, with a {@code ServerWebInputException},
     * a {@code ResponseStatusException}, which Spring routes to the controller's handler ({@code :173-179}): the licensing
     * envelope with Spring's reason. Framework behaviour, pinned as observed; a Spring upgrade could route it elsewhere.
     */
    @Test
    void requestWithoutABody() {
        register(RELAY_URL, PUBLIC_URL);
        assertRefusedBeforeTheRelay(exchange(SYNC, null), HttpStatus.BAD_REQUEST, NO_BODY_MESSAGE);
    }

    /** The relay answers 503: {@code retrieve()} fails, and {@code relay} maps the error to its own 503 ({@code :166-168}). */
    @Test
    void requestRelayFailed() throws JsonProcessingException {
        relayAnswers(aResponse().withStatus(RELAY_ERROR));
        register(RELAY_URL, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(SYNC, write(orgBody(ORG_ID)));
        assertLicensingError(result, HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE_MESSAGE);
        assertThat(sentRelayRequest().getUrl()).as("relay path").isEqualTo(RELAY_PATH);
        Mockito.verify(capabilities, Mockito.never()).recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean());
    }

    /** No public URL configured and a {@code returnOrigin} that is neither {@code https} nor loopback: the 503 of {@code :105}. */
    @Test
    void checkoutWithAnUnsafeReturnOrigin() throws JsonProcessingException {
        register(RELAY_URL, BLANK);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(checkoutBody().put(RETURN_ORIGIN_MEMBER, UNSAFE_RETURN_ORIGIN))),
                HttpStatus.SERVICE_UNAVAILABLE, UNSAFE_RETURN_ORIGIN_MESSAGE);
    }

    /** No public URL configured and a {@code returnOrigin} that {@code URI.create} rejects: the 400 of {@code :94-97}. */
    @Test
    void checkoutWithAMalformedReturnOrigin() throws JsonProcessingException {
        register(RELAY_URL, BLANK);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(checkoutBody().put(RETURN_ORIGIN_MEMBER, MALFORMED_RETURN_ORIGIN))),
                HttpStatus.BAD_REQUEST, MALFORMED_RETURN_ORIGIN_MESSAGE);
    }

    /** A valid checkout without one of the members {@code :84-87} require: the {@code BAD_REQUEST} of {@code :85}. */
    @ParameterizedTest
    @ValueSource(strings = {REQUEST_ID_MEMBER, BILLING_INTERVAL_MEMBER, CONTACT_DATA_MEMBER})
    void checkoutWithoutARequiredMember(String member) throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        ObjectNode body = checkoutBody();
        body.remove(member);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(body)), HttpStatus.BAD_REQUEST, MISSING_MEMBER_PREFIX + member);
    }

    static Stream<Arguments> foreignDeployments() {
        ArrayNode anotherHostFirst = PayloadAssertions.FIXTURE_EDITOR.createArrayNode().add(OTHER_HOST_ID).add(HOST_ID);
        ArrayNode fourHosts = PayloadAssertions.FIXTURE_EDITOR.createArrayNode().add(HOST_ID).add(SECOND_HOST_ID).add(THIRD_HOST_ID)
                .add(FOURTH_HOST_ID);
        ArrayNode none = PayloadAssertions.FIXTURE_EDITOR.createArrayNode();
        return Stream.of(Arguments.of(ANOTHER_HOST_FIRST, anotherHostFirst), Arguments.of(FOUR_DEPLOYMENTS, fourHosts),
                Arguments.of(NO_DEPLOYMENT, none), Arguments.of(DEPLOYMENT_AS_A_STRING, TextNode.valueOf(HOST_ID)));
    }

    /** {@code deploymentIds} that are not one to three ids led by this deployment: the {@code BAD_REQUEST} of {@code :79-83}. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("foreignDeployments")
    void checkoutWithForeignDeployments(String name, JsonNode deploymentIds) throws JsonProcessingException {
        register(RELAY_URL, PUBLIC_URL);
        ObjectNode body = checkoutBody();
        body.set(DEPLOYMENT_IDS_MEMBER, deploymentIds);
        assertRefusedBeforeTheRelay(exchange(CHECKOUT, write(body)), HttpStatus.BAD_REQUEST, FOREIGN_DEPLOYMENTS_MESSAGE);
    }

    static Stream<Arguments> relayUrlsWithoutHttps() {
        return Stream.of(Arguments.of(HTTP_RELAY, RELAY_URL_WITHOUT_HTTPS), Arguments.of(MALFORMED_RELAY, MALFORMED_RELAY_URL),
                Arguments.of(BLANK_RELAY, BLANK));
    }

    /**
     * A relay URL that is not {@code https}, one {@code URI.create} rejects, and a blank one, which {@code request} no
     * longer refuses before the token ({@code :65-69} checks only the deployment id): {@code send} answers the 503 of
     * {@code :192-198} before it builds a client.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("relayUrlsWithoutHttps")
    void requestToARelayWithoutHttps(String name, String relayUrl) throws JsonProcessingException {
        register(relayUrl, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(SYNC, write(orgBody(ORG_ID)));
        assertLicensingError(result, HttpStatus.SERVICE_UNAVAILABLE, RELAY_NOT_HTTPS_MESSAGE);
        assertNoRelayRequest();
        Mockito.verify(capabilities).token(HOST_ID, ORG_ID, USER_ID);
    }

    /**
     * A checkout whose {@code contactData} is the §4.6 representative input, answered with that input made a valid
     * checkout answer ({@value #CHECKOUT_ANSWER_MEMBERS} written in front of its members, as text, so its lexemes travel
     * unchanged): the relay's body is pinned in {@value #CHECKOUT_BODY} ({@code issuedAt} replaced), the client's in
     * {@value #ENTERPRISE_ANSWER}. The attempt is recorded before the relay request ({@code :111-112}): its stub notes
     * the actions the relay had received when it runs, none. The {@code recordPurchaseStatus(…, true)} that follows the
     * relay ({@code :113-114}) is not asserted (NEW-61, see the class comment).
     */
    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/EnterpriseLicenseController.java#EnterpriseLicenseController.send#bodyValue#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/EnterpriseLicenseController.java#EnterpriseLicenseController.send#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/EnterpriseLicenseController.java#<file>#import#1"})
    @Test
    void checkoutRepresentativeData() throws JsonProcessingException {
        String representative = PayloadSamples.representativeInputText().strip();
        assertThat(representative).as("the representative input is an object").startsWith(JSON_OBJECT_START);
        relayAnswers(json(JSON_OBJECT_START + CHECKOUT_ANSWER_MEMBERS + representative.substring(JSON_OBJECT_START.length())));
        AtomicReference<List<String>> actionsAtTheAttempt = new AtomicReference<>();
        Mockito.when(capabilities.checkoutAttempted(HOST_ID, ORG_ID, USER_ID))
                .thenReturn(Mono.fromRunnable(() -> actionsAtTheAttempt.set(receivedActions())));
        register(RELAY_URL, PUBLIC_URL);
        String request = write(checkoutBody().put(CONTACT_DATA_MEMBER, CONTACT_DATA_PLACEHOLDER))
                .replace("\"" + CONTACT_DATA_PLACEHOLDER + "\"", PayloadSamples.representativeInputText());
        long before = System.currentTimeMillis();
        EntityExchangeResult<byte[]> result = exchange(CHECKOUT, request);
        long after = System.currentTimeMillis();
        String sent = sentRelayRequest().getBodyAsString();
        String answer = new String(result.getResponseBodyContent(), StandardCharsets.UTF_8);
        GOLDEN.assertJson(CHECKOUT_BODY, withIssuedAtPlaceholder(sent));
        GOLDEN.assertJson(ENTERPRISE_ANSWER, answer);
        assertThat(result.getStatus().value()).as("status").isEqualTo(HttpStatus.OK.value());
        assertThat(issuedAtOf(sent)).as("issuedAt, a time of the exchange").isBetween(before, after);
        String output = GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT);
        JsonNode sentTree = PayloadAssertions.FIXTURE_EDITOR.readTree(sent);
        JsonNode answerTree = PayloadAssertions.FIXTURE_EDITOR.readTree(answer);
        System.out.println("[EnterpriseLicenseControllerContractTest] the relay's contactData "
                + (CanonicalJson.compare(output, write(sentTree.get(CONTACT_DATA_MEMBER))).equivalent() ? "equals" : "differs from")
                + " the production mapper's output " + PayloadSamples.REPRESENTATIVE_OUTPUT
                + "; relay actions when the attempt was recorded: " + actionsAtTheAttempt.get());
        assertThat(answerTree.path(EndpointContract.DATA).path(CHECKOUT_URL_MEMBER).asText()).as("checkoutUrl").isEqualTo(CHECKOUT_URL);
        assertThat(actionsAtTheAttempt.get()).as("relay actions when the attempt was recorded").isEmpty();
        Mockito.verify(capabilities).checkoutAttempted(HOST_ID, ORG_ID, USER_ID);
    }

    static Stream<Arguments> actionsAndAnswers() {
        return Stream.of(Arguments.of(SYNC, EMPTY_LIBRARY), Arguments.of(DOWNLOAD, DOWNLOAD_ANSWER), Arguments.of(PORTAL, PORTAL_ANSWER));
    }

    /**
     * The client's other actions ({@code licenseRequestApi.ts:85-89}), each answered with what the client reads:
     * {@code sync} with a confirmed purchase sends the common members ({@code :70-74}) with its own action
     * ({@code :132}), {@code download} adds {@code licenseId} ({@code :89}), {@code portal} adds {@code requestId}
     * ({@code :90}) and the {@code returnUrl} built from the configured public URL ({@code :91-107}).
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("actionsAndAnswers")
    void everyActionSendsItsMembers(String action, String relayAnswer) throws JsonProcessingException {
        relayAnswers(json(relayAnswer));
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
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(relayAnswer));
        CanonicalJson.assertEquivalent(write(expected), withIssuedAtPlaceholder(sentRelayRequest().getBodyAsString()));
    }

    static Stream<Arguments> libraryRequestsWithoutAPurchase() {
        return Stream.of(Arguments.of(STATUS, false), Arguments.of(SYNC, false), Arguments.of(SYNC, true));
    }

    /**
     * No purchase ({@code NONE}): {@code status} without {@code refresh}, and {@code sync} with or without it, since
     * {@code request} passes {@code refresh} to {@code library} for {@code status} only ({@code :75-76}), answer an empty
     * library without the token, the relay or a record ({@code :123-128}).
     */
    @ParameterizedTest(name = "{0} refresh={1}")
    @MethodSource("libraryRequestsWithoutAPurchase")
    void statusWithoutAPurchaseAnswersAnEmptyLibrary(String action, boolean refresh) throws JsonProcessingException {
        Mockito.when(capabilities.purchaseState(HOST_ID, ORG_ID, USER_ID)).thenReturn(Mono.just(PurchaseState.NONE));
        register(RELAY_URL, PUBLIC_URL);
        ObjectNode body = orgBody(ORG_ID);
        if (refresh) {
            body.put(REFRESH_MEMBER, true);
        }
        EntityExchangeResult<byte[]> result = exchange(action, write(body));
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EMPTY_LIBRARY));
        assertNoRelayRequest();
        Mockito.verify(capabilities, Mockito.never()).token(anyString(), anyString(), anyString());
        Mockito.verify(capabilities, Mockito.never()).recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean());
    }

    /** No purchase and {@code refresh}: the deliberate discovery relays a {@code status} lookup ({@code :129-132}). */
    @Test
    void statusRefreshWithoutAPurchaseAsksTheRelay() throws JsonProcessingException {
        Mockito.when(capabilities.purchaseState(HOST_ID, ORG_ID, USER_ID)).thenReturn(Mono.just(PurchaseState.NONE));
        register(RELAY_URL, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(STATUS, write(orgBody(ORG_ID).put(REFRESH_MEMBER, true)));
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EMPTY_LIBRARY));
        CanonicalJson.assertEquivalent(write(commonMembers(STATUS).put(ISSUED_AT_MEMBER, ISSUED_AT_PLACEHOLDER)),
                withIssuedAtPlaceholder(sentRelayRequest().getBodyAsString()));
        Mockito.verify(capabilities).recordPurchaseStatus(HOST_ID, ORG_ID, USER_ID, false);
    }

    /**
     * A {@code sync} of an unconfirmed purchase ({@code UNKNOWN}, the state other than {@code CONFIRMED} that reaches the
     * relay for {@code sync}): the relay gets a {@code status} lookup ({@code :132}); when it finds an order, the
     * purchase is recorded and then the {@code sync} itself is relayed, whose answer the client gets ({@code :133-138});
     * when it finds none, the client gets the lookup's answer. The record's stub notes the actions the relay had
     * received when it runs: the lookup only.
     */
    @ParameterizedTest(name = "lookup finds a purchase={0}")
    @ValueSource(booleans = {true, false})
    void syncOfAnUnconfirmedPurchase(boolean found) throws JsonProcessingException {
        Mockito.when(capabilities.purchaseState(HOST_ID, ORG_ID, USER_ID)).thenReturn(Mono.just(PurchaseState.UNKNOWN));
        AtomicReference<List<String>> actionsAtTheRecord = new AtomicReference<>();
        Mockito.when(capabilities.recordPurchaseStatus(HOST_ID, ORG_ID, USER_ID, found))
                .thenReturn(Mono.fromRunnable(() -> actionsAtTheRecord.set(receivedActions())));
        String lookupAnswer = found ? LIBRARY_WITH_AN_ORDER : EMPTY_LIBRARY;
        relayAnswersTo(STATUS, json(lookupAnswer));
        relayAnswersTo(SYNC, json(LIBRARY_WITH_A_LICENSE));
        register(RELAY_URL, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(SYNC, write(orgBody(ORG_ID)));
        List<String> actions = receivedActions();
        System.out.println("[EnterpriseLicenseControllerContractTest] relay actions " + actions + "; at the record " + actionsAtTheRecord.get());
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(found ? LIBRARY_WITH_A_LICENSE : lookupAnswer));
        assertThat(actionsAtTheRecord.get()).as("relay actions when the purchase was recorded").containsExactly(STATUS);
        assertThat(actions).as("relay actions").containsExactlyInAnyOrderElementsOf(found ? List.of(STATUS, SYNC) : List.of(STATUS));
        Mockito.verify(capabilities).recordPurchaseStatus(HOST_ID, ORG_ID, USER_ID, found);
    }

    static Stream<Arguments> invalidAnswers() {
        return Stream.of(
                Arguments.of(WITHOUT_SUCCESS, STATUS, "{\"orders\":[],\"licenses\":[]}"),
                Arguments.of(NOT_SUCCESS, STATUS, "{\"success\":false,\"orders\":[],\"licenses\":[]}"),
                Arguments.of(STATUS_WITHOUT_ORDERS, STATUS, "{\"success\":true,\"licenses\":[]}"),
                Arguments.of(SYNC_WITHOUT_LICENSES, SYNC, "{\"success\":true,\"orders\":[]}"),
                Arguments.of(CHECKOUT_WITH_A_BLANK_URL, CHECKOUT, "{\"success\":true,\"checkoutUrl\":\"\",\"requestId\":\"" + REQUEST_ID + "\"}"),
                Arguments.of(CHECKOUT_FOR_ANOTHER_REQUEST, CHECKOUT,
                        "{\"success\":true,\"checkoutUrl\":\"" + CHECKOUT_URL + "\",\"requestId\":\"" + OTHER_REQUEST_ID + "\"}"));
    }

    /** An answer {@code relay} rejects ({@code :153-163}): the 503 of {@code :164-165}, and nothing recorded. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidAnswers")
    void relayAnswerThatIsNotValid(String name, String action, String relayAnswer) throws JsonProcessingException {
        relayAnswers(json(relayAnswer));
        register(RELAY_URL, PUBLIC_URL);
        EntityExchangeResult<byte[]> result = exchange(action, write(CHECKOUT.equals(action) ? checkoutBody() : orgBody(ORG_ID)));
        assertLicensingError(result, HttpStatus.SERVICE_UNAVAILABLE, INVALID_ANSWER_MESSAGE);
        sentRelayRequest();
        Mockito.verify(capabilities, Mockito.never()).recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean());
    }

    /** Registers the controller with {@code relayUrl} and {@code publicUrl}; its relay requests go to WireMock. */
    private void register(String relayUrl, String publicUrl) {
        builder.singleton(CONTROLLER_BEAN, new RedirectedEnterpriseLicenseController(sessions, config, capabilities, relayUrl, publicUrl,
                wireMock.getHttpBaseUrl()));
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

    /** The relay answers {@code answer} to a request whose {@code action} is {@code action}. */
    private void relayAnswersTo(String action, ResponseDefinitionBuilder answer) {
        wireMock.getWireMock().register(post(urlPathEqualTo(RELAY_PATH))
                .withRequestBody(matchingJsonPath("$." + ACTION_MEMBER, equalTo(action))).willReturn(answer));
    }

    private static ResponseDefinitionBuilder json(String body) {
        return aResponse().withStatus(HttpStatus.OK.value()).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .withBody(body);
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

    /** The {@code action} of every request the relay has received so far, each printed. */
    private List<String> receivedActions() {
        List<String> actions = new ArrayList<>();
        for (LoggedRequest request : wireMock.getWireMock().find(anyRequestedFor(anyUrl()))) {
            System.out.println("[EnterpriseLicenseControllerContractTest] relay received " + request.getBodyAsString());
            try {
                actions.add(PayloadAssertions.FIXTURE_EDITOR.readTree(request.getBodyAsString()).path(ACTION_MEMBER).asText());
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("the relay received a body that is not JSON: " + request.getBodyAsString(), e);
            }
        }
        return actions;
    }

    private void assertNoRelayRequest() {
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("relay requests").isEmpty();
    }

    /** A guard refused with {@code status} and {@code message}: no relay request, and the token never requested. */
    private void assertRefusedBeforeTheRelay(EntityExchangeResult<byte[]> result, HttpStatus status, String message) {
        assertLicensingError(result, status, message);
        assertNoRelayRequest();
        Mockito.verify(capabilities, Mockito.never()).token(anyString(), anyString(), anyString());
    }

    /**
     * How the controller's handler answers a {@code ResponseStatusException} ({@code EnterpriseLicenseController.java:173-179}):
     * its status, the {@code ResponseView.error} envelope with the status as code and {@code message}, and
     * {@code Retry-After: 60} on 503 only.
     */
    private static void assertLicensingError(EntityExchangeResult<byte[]> result, HttpStatus status, String message) {
        EndpointContract.assertResponse(result, status, EndpointContract.error(status.value(), message));
        String retryAfter = result.getResponseHeaders().getFirst(RETRY_AFTER);
        System.out.println("[EnterpriseLicenseControllerContractTest] " + RETRY_AFTER + ": " + retryAfter);
        if (status == HttpStatus.SERVICE_UNAVAILABLE) {
            assertThat(retryAfter).as(RETRY_AFTER + " of a 503").isEqualTo(RETRY_AFTER_SECONDS);
        } else {
            assertThat(retryAfter).as(RETRY_AFTER + " of a " + status.value()).isNull();
        }
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

    /** The members every action sends, from the session and the configuration ({@code :70-74}), without {@code issuedAt}. */
    private static ObjectNode commonMembers(String action) {
        return PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(ACTION_MEMBER, action).put(HOST_ID_MEMBER, HOST_ID)
                .put(ORG_ID_MEMBER, ORG_ID).put(USER_ID_MEMBER, USER_ID);
    }

    private static ObjectNode orgBody(String orgId) {
        return PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(ORG_ID_MEMBER, orgId);
    }

    /** A checkout that passes {@code :78-87}: this deployment first, every required member, the client's {@code returnOrigin}. */
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

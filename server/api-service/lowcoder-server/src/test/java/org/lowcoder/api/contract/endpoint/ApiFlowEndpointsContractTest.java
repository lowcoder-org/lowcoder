package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.api.parallel.Resources;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.MiscSamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.misc.ApiFlowController;
import org.lowcoder.api.misc.ApiFlowEndpoints;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.api.subscription.RedirectedWorkspaceSeatSyncService;
import org.lowcoder.api.subscription.WorkspaceSeatCounter;
import org.lowcoder.api.subscription.WorkspaceSeatSyncService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.request;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Tests of the 1 {@link ApiFlowEndpoints} endpoint (docs/API_PAYLOAD_TEST_PLAN.md §1.3, §4.9, task T7.3), level
 * {@code decode-only}, and groups {@code api-flow} and {@code subscription-relay}. {@code ApiFlowController#flow} decodes a
 * {@link FlowRequest} with the server codec. For any path but the seat-sync path it writes its {@code data} with a bare
 * {@code new ObjectMapper()} ({@code ApiFlowController.java:67-68}) and sends that text unchanged ({@code :75}), with the
 * request's headers, none when they are absent ({@code :76}), to a fixed {@code https} URL through a client built
 * inline; it answers the upstream's text as a {@code String}. Outside the seat-sync path a blank method is refused
 * before the request is built ({@code :62-64}). The seat-sync path ({@code WorkspaceSeatSyncService.FLOW_PATH},
 * {@code :55-61}) takes only the method {@code post} ({@code :56-57}) and hands {@code data.orgId}, when it is a
 * string, else "" ({@code :59-60}), to
 * {@code WorkspaceSeatSyncService#synchronize}, which authenticates the visitor itself, takes a Redis lease, sends the
 * server's own seat count to the seat relay and answers the relay's confirmation as text.
 *
 * <p>The controller under test is {@link RedirectedApiFlowController}: the production class, whose {@code flow} records
 * each decoded request and runs the production method with {@link WebClientRedirect} open on the thread that calls it,
 * so the inline client is built against WireMock. Its seat-sync service is a {@link RedirectedWorkspaceSeatSyncService}
 * over mocks of the session, the seat counter, Redis and the configuration, whose relay request goes to WireMock too. A
 * generic request is the D1 golden of {@link FlowRequest}, edited where a test needs a property left out; a seat-sync
 * request is the client's ({@code client/packages/lowcoder/src/util/workspaceSeatSync.ts:18-19}):
 *
 * <ul>
 *   <li>{@link #flow}: the decoded request must bind as D1 does ({@link PayloadAssertions#assertBindsTo}); WireMock must
 *       receive the request's method, path and headers and, as body, D1's {@code data} written again (compared
 *       canonically); the upstream's text must reach the client unchanged;</li>
 *   <li>{@link #flowUpstreamFailed}: without {@code retries} and {@code timeout} (so no retry), an upstream error becomes
 *       {@code BizException(FLOW_ERROR)} with the upstream exception's message ({@code :82});</li>
 *   <li>{@link #flowWithoutHeaders}: with {@code headers} left out or null the request is sent with none of its own and
 *       the upstream's text answered, on both mounts (NEW-44; before, the controller threw at the headers and answered
 *       {@code INTERNAL_SERVER_ERROR});</li>
 *   <li>{@link #flowWithoutMethod} and {@link #flowWithoutMethodKeepingTheRetries}: a method absent, null, empty or of
 *       whitespace only, with or without the D1 sample's retries, is refused with
 *       {@code INVALID_PARAMETER} "method" before the client is built (NEW-44), on both mounts;</li>
 *   <li>{@link #flowFailingBeforeTheRequest}: the client cannot be built (the test makes the builder throw), before any
 *       I/O, and {@code :83-85} answer {@code Mono.error}: the global handler's {@code INTERNAL_SERVER_ERROR};</li>
 *   <li>{@link #flowRepresentativeData}: {@code data} is the §4.6 representative input, spliced in as text; the body
 *       WireMock receives, the bare mapper's writing of what the server codec bound, is pinned in
 *       {@value #REPRESENTATIVE_BODY}. This is the {@code api-flow} group's test;</li>
 *   <li>{@link #flowSeatSync}: a member's seat sync: the relay receives the token header and the server's snapshot
 *       ({@code hostId}, {@code orgId}, the counter's {@code quantity}, the lease's {@code requestId}, {@code issuedAt}),
 *       the lease is released, and the relay's answer, written with {@code JsonNode.toString()}, reaches the client as
 *       text, pinned in {@value #SEAT_SYNC_ANSWER} with the request id replaced. This is the {@code subscription-relay}
 *       group's seat-sync test;</li>
 *   <li>{@link #flowSeatSyncWithAnotherMethod}, {@link #flowSeatSyncAlreadyRunning} and {@link #flowSeatSyncRefused}:
 *       another method ({@code :57}), a lease already held, and the service's own checks (session, member, workspace,
 *       configuration) refuse before the relay; {@link #flowSeatSyncRelayFailed} and {@link #flowSeatSyncNotConfirmed}:
 *       a relay error, or an answer that does not confirm the snapshot, keeps the lease; and
 *       {@link #flowSeatSyncWithoutMethod}: a blank method is refused there as another method is, not with the generic
 *       path's {@code INVALID_PARAMETER}.</li>
 * </ul>
 *
 * <p>Every seat-sync test runs on both mounts, {@code /api/flow} through {@link #CONTRACT} and {@code /api/v1/flow}
 * through the harness's client, with the same assertions. Each refusal answers HTTP 500 today: the
 * {@code ResponseStatusException}s of the seat-sync path reach the global handler's generic branch (NEW-53, see
 * {@link #assertStatusExceptionAnsweredAs500NEW53}).
 *
 * <p>Limits: the controller is a test subclass, so the request reaches {@code flow} through its override, which only
 * records and redirects; the transport (system proxy, timeout) is WireMock's, not the production one; the answer is
 * the upstream's text, which no JSON codec writes, so the level stays {@code decode-only}. Retries with a backoff are
 * not run: the D1 request asks for {@value MiscSamples#FLOW_RETRIES} of them, which only an error would start. The
 * seat-sync lease is a Redis mock, so Redis's own {@code SET NX} exclusivity is not run.
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}: the answer is the upstream's.
 */
@WireMockTest
class ApiFlowEndpointsContractTest {

    /** A default locale whose case mapping of {@code i} and {@code I} differs from {@code Locale.ROOT}'s (NEW-40). */
    static final Locale TURKISH = Locale.forLanguageTag("tr-TR");
    /** The one standard method with an {@code i}, in lower case as a client may send it. */
    static final String LOWER_CASE_OPTIONS = "options";
    /** The separator before the upstream path a flow request names. */
    static final String PATH_SEPARATOR = "/";

    static final EndpointContract CONTRACT = new EndpointContract(ApiFlowEndpoints.class);
    static final String FLOW = "flow";
    static final String REPRESENTATIVE_BODY = "boundary/api-flow/representative.body.json";
    /** {@code ApiFlowController}'s fixed upstream, which {@code flowRequest.path()} is appended to. */
    static final String FLOW_BASE_URL = "https://flow.lowcoder.cloud/";
    static final String PATH = "path";
    static final String METHOD = "method";
    static final String DATA = "data";
    static final String HEADERS = "headers";
    static final String TIMEOUT = "timeout";
    static final String RETRIES = "retries";
    /** Stands for {@code data} while the D1 tree is written; replaced, quotes included, by the representative input. */
    static final String DATA_PLACEHOLDER = "@@api-flow-data@@";
    static final String UPSTREAM_ANSWER = "{\"ApiFlowEndpointsContractTest.answer\":\"ApiFlowEndpointsContractTest.value\"}";
    static final int OK = 200;
    static final int UPSTREAM_ERROR = 503;
    static final String UPSTREAM_ERROR_REASON = "Service Unavailable";
    /** The bean name of the controller, as Spring would name {@code ApiFlowController}. */
    static final String CONTROLLER_BEAN = "apiFlowController";
    static final MediaType TEXT_PLAIN_UTF8 = MediaType.parseMediaType(MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8");

    /** The seat relay's path: the production default URL's, {@code WorkspaceSeatSyncService.java:37}. */
    static final String SEAT_RELAY_PATH = "/" + WorkspaceSeatSyncService.FLOW_PATH;
    /** A reserved host (RFC 2606): a request that missed the redirection fails instead of reaching a real relay. */
    static final String SEAT_RELAY_URL = "https://seat-relay.invalid" + SEAT_RELAY_PATH;
    static final String SEAT_TOKEN_HEADER = "Lowcoder-Seat-Sync-Token";
    static final String SEAT_RELAY_TOKEN = "ApiFlowEndpointsContractTest.seat-relay-token";
    static final String BLANK = "";
    static final String SEAT_HOST_ID = "ApiFlowEndpointsContractTest.host";
    static final String SEAT_ORG_ID = "ApiFlowEndpointsContractTest.workspace";
    static final String OTHER_SEAT_ORG_ID = "ApiFlowEndpointsContractTest.other-workspace";
    static final String SEAT_USER_ID = "ApiFlowEndpointsContractTest.member";
    /** A workspace id that is also a number's text, for {@code data.orgId} sent as that number. */
    static final String NUMERIC_ORG_ID = "7";
    static final int NUMERIC_ORG_ID_VALUE = 7;
    static final String MEMBER_STATE = "normal";
    static final long JOIN_TIME = 0L;
    static final int QUANTITY = 4;
    static final String POST = "post";
    static final String OTHER_METHOD = "get";
    /** Blank methods a client can send: empty, one space, and a mix of the whitespace {@code StringUtils.isBlank} counts. */
    static final String EMPTY_METHOD = "";
    static final String SPACE_METHOD = " ";
    static final String MIXED_WHITESPACE_METHOD = "\t \n";
    /** The message of the failure {@link #flowFailingBeforeTheRequest} makes the client builder throw. */
    static final String BUILDER_FAILURE = "ApiFlowEndpointsContractTest.builder-failure";
    /** The deployment id's configuration key and default, as {@code WorkspaceSeatSyncService.java:53} reads it. */
    static final String DEPLOYMENT_ID_KEY = "id";
    static final String LEASE_KEY_PREFIX = "billing:seat-sync:";
    static final String LEASE_KEY_SEPARATOR = ":";
    /** The arguments of {@code setIfAbsent(key, requestId, LEASE)}, {@code WorkspaceSeatSyncService.java:59}. */
    static final int LEASE_KEY_ARGUMENT = 0;
    static final int LEASE_REQUEST_ID_ARGUMENT = 1;
    static final String SUCCESS_MEMBER = "success";
    static final String REQUEST_ID_MEMBER = "requestId";
    static final String QUANTITY_MEMBER = "quantity";
    static final String DETAIL_MEMBER = "detail";
    static final String HOST_ID_MEMBER = "hostId";
    static final String ORG_ID_MEMBER = "orgId";
    static final String ISSUED_AT_MEMBER = "issuedAt";
    static final String UNCONFIRMED_REQUEST_ID = "ApiFlowEndpointsContractTest.another-request";
    /** Stands for the relay answer's {@code detail} while it is written; replaced, quotes included, by the representative input. */
    static final String DETAIL_PLACEHOLDER = "@@seat-sync-detail@@";
    /** Stands for the lease's random request id in {@value #SEAT_SYNC_ANSWER}. */
    static final String REQUEST_ID_PLACEHOLDER = "@@seat-sync-request-id@@";
    static final String SEAT_SYNC_ANSWER = "boundary/subscription-relay/seat-sync.answer.json";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static final byte[] NO_BODY = {};

    private WireMockRuntimeInfo wireMock;
    private ContractTestClient.Builder builder;
    private RedirectedApiFlowController controller;
    private SessionUserService sessions;
    private WorkspaceSeatCounter seats;
    private ReactiveRedisTemplate<String, String> redis;
    private ConfigCenter config;
    /** The key and request id of the lease the service took, recorded by the Redis mock. */
    private String leaseKey;
    private String leaseRequestId;

    @BeforeEach
    void harness(WireMockRuntimeInfo wireMock) {
        harness(wireMock, SEAT_RELAY_TOKEN);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(ApiFlowEndpointsContractTest.class);
    }

    @Test
    void flow(WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        upstreamAnswers(wireMock, sample, aResponse().withStatus(OK).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .withBody(UPSTREAM_ANSWER));
        EntityExchangeResult<byte[]> result = exchange(EndpointContract.d1(FlowRequest.class));
        PayloadAssertions.assertBindsTo(PayloadSamples.of(FlowRequest.class), decoded());
        LoggedRequest sent = sentRequest(wireMock);
        assertThat(sent.getMethod().value()).as("upstream method").isEqualTo(sample.method().toUpperCase());
        assertThat(sent.getUrl()).as("upstream path").isEqualTo("/" + sample.path());
        sample.headers().forEach((name, value) -> assertThat(sent.getHeader(name)).as("upstream header " + name).isEqualTo(value));
        assertThat(sent.getHeader(HttpHeaders.CONTENT_TYPE)).as("upstream Content-Type of the String body")
                .isEqualTo(MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8");
        CanonicalJson.assertEquivalent(d1Data(), sent.getBodyAsString());
        EndpointContract.assertBytes(result, HttpStatus.OK, TEXT_PLAIN_UTF8, UPSTREAM_ANSWER.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void flowUpstreamFailed(WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        upstreamAnswers(wireMock, sample, aResponse().withStatus(UPSTREAM_ERROR));
        EntityExchangeResult<byte[]> result = exchange(d1Without(tree -> tree.remove(List.of(RETRIES, TIMEOUT))));
        assertThat(decoded().retries()).as("retries left out").isNull();
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("upstream requests: no retry").hasSize(1);
        String upstreamMessage = UPSTREAM_ERROR + " " + UPSTREAM_ERROR_REASON + " from " + sample.method().toUpperCase() + " " + FLOW_BASE_URL
                + sample.path();
        EndpointContract.assertBizError(result, BizError.FLOW_ERROR, BizError.FLOW_ERROR.name(), upstreamMessage);
    }

    /** The ways a client can send no headers: the member left out, or JSON null. */
    enum NoHeaders {
        ABSENT, NULL;

        /** Writes this into a request tree. */
        void writeInto(ObjectNode tree) {
            if (this == ABSENT) {
                tree.remove(HEADERS);
            } else {
                tree.putNull(HEADERS);
            }
        }
    }

    /** Every value on both mounts, {@code /api/flow} first. */
    private static Stream<Arguments> onBothMounts(Object... values) {
        List<Arguments> cases = new ArrayList<>();
        for (String mount : List.of(NewUrl.FLOW_URL, Url.FLOW_URL)) {
            for (Object value : values) {
                cases.add(Arguments.of(mount, value));
            }
        }
        return cases.stream();
    }

    static Stream<Arguments> noHeadersOnBothMounts() {
        return onBothMounts((Object[]) NoHeaders.values());
    }

    /**
     * NEW-44: with {@code headers} left out or null the request goes upstream without the sample's headers, and the
     * upstream's text is answered. The retries and the timeout are left out, as in {@link #flowUpstreamFailed}, so that
     * a failure is not retried.
     */
    @ParameterizedTest
    @MethodSource("noHeadersOnBothMounts")
    void flowWithoutHeaders(String mount, NoHeaders headers, WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        upstreamAnswers(wireMock, sample, aResponse().withStatus(OK).withBody(UPSTREAM_ANSWER));
        EntityExchangeResult<byte[]> result = exchangeOn(mount, d1Without(tree -> {
            tree.remove(List.of(RETRIES, TIMEOUT));
            headers.writeInto(tree);
        }));
        System.out.println("[ApiFlowEndpointsContractTest] " + mount + " headers " + headers);
        assertThat(decoded()).as("the D1 request without headers, retries and timeout")
                .isEqualTo(new FlowRequest(sample.path(), sample.method(), sample.data(), null, null, null));
        LoggedRequest sent = sentRequest(wireMock);
        assertThat(sent.getMethod().value()).as("upstream method").isEqualTo(sample.method().toUpperCase(Locale.ROOT));
        assertThat(sent.getUrl()).as("upstream path").isEqualTo(PATH_SEPARATOR + sample.path());
        sample.headers().keySet().forEach(name -> assertThat(sent.containsHeader(name)).as("upstream header " + name + " left out").isFalse());
        CanonicalJson.assertEquivalent(d1Data(), sent.getBodyAsString());
        EndpointContract.assertBytes(result, HttpStatus.OK, TEXT_PLAIN_UTF8, UPSTREAM_ANSWER.getBytes(StandardCharsets.UTF_8));
    }

    /** The ways a client can send no usable method: the member left out, JSON null, empty, one space, mixed whitespace. */
    enum BlankMethod {
        ABSENT(null), NULL(null), EMPTY(EMPTY_METHOD), SPACE(SPACE_METHOD), MIXED_WHITESPACE(MIXED_WHITESPACE_METHOD);

        /** The method the server codec decodes. */
        final String decoded;

        BlankMethod(String decoded) {
            this.decoded = decoded;
        }

        /** Writes this method into a request tree. */
        void writeInto(ObjectNode tree) {
            switch (this) {
                case ABSENT -> tree.remove(METHOD);
                case NULL -> tree.putNull(METHOD);
                default -> tree.put(METHOD, decoded);
            }
        }
    }

    static Stream<Arguments> blankMethodsOnBothMounts() {
        return onBothMounts((Object[]) BlankMethod.values());
    }

    /**
     * NEW-44: a blank method is refused with {@code INVALID_PARAMETER} "method" before the client is built, so no request is
     * sent and no retry is set up; before, a
     * null method threw at its upper-casing and answered {@code INTERNAL_SERVER_ERROR}, and an empty or whitespace one
     * failed in the client. The retries and the timeout are left out, as in {@link #flowUpstreamFailed}, so that such a
     * failure is not retried.
     */
    @ParameterizedTest
    @MethodSource("blankMethodsOnBothMounts")
    void flowWithoutMethod(String mount, BlankMethod method, WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        upstreamAnswers(wireMock, sample, aResponse().withStatus(OK).withBody(UPSTREAM_ANSWER));
        EntityExchangeResult<byte[]> result = exchangeOn(mount, d1Without(tree -> {
            tree.remove(List.of(RETRIES, TIMEOUT));
            method.writeInto(tree);
        }));
        System.out.println("[ApiFlowEndpointsContractTest] " + mount + " method " + method + " decoded as "
                + (method.decoded == null ? "null" : "\"" + method.decoded.replace("\t", "\\t").replace("\n", "\\n") + "\""));
        assertThat(decoded().method()).as("decoded method of " + method).isEqualTo(method.decoded);
        assertThat(controller.builderCalls).as("builder calls: the refusal comes before the client is built").hasValue(0);
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("upstream requests").isEmpty();
        EndpointContract.assertInvalidParameter(result, METHOD);
    }

    /**
     * NEW-44: an absent method is refused before the client is built also when the request asks for the D1 sample's
     * retries and timeout, so no retry set-up delays the refusal (a delayed answer fails the case on the client's blocking
     * timeout); before, the method threw at its upper-casing and answered {@code INTERNAL_SERVER_ERROR}.
     */
    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    void flowWithoutMethodKeepingTheRetries(String mount, WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        upstreamAnswers(wireMock, sample, aResponse().withStatus(OK).withBody(UPSTREAM_ANSWER));
        EntityExchangeResult<byte[]> result = exchangeOn(mount, d1Without(tree -> tree.remove(METHOD)));
        System.out.println("[ApiFlowEndpointsContractTest] " + mount + " no method, retries " + sample.retries() + ", timeout " + sample.timeout());
        assertThat(decoded()).as("the D1 request without method, its retries and timeout kept")
                .isEqualTo(new FlowRequest(sample.path(), null, sample.data(), sample.headers(), sample.timeout(), sample.retries()));
        assertThat(controller.builderCalls).as("builder calls: the refusal comes before the client is built").hasValue(0);
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("upstream requests").isEmpty();
        EndpointContract.assertInvalidParameter(result, METHOD);
    }

    /**
     * The client cannot be built ({@code WebClientBuildHelper.builder()} throws, as the test controller is told to make
     * it), so the request fails before any I/O; the controller's catch answers the exception as {@code Mono.error}: the
     * failure was thrown once, {@code flow} returned an answer instead of letting it escape, that answer's error is the
     * failure itself, and the global handler answers it with its generic {@code INTERNAL_SERVER_ERROR}. Limit: an
     * injected synchronous failure; a failure during the request takes the retry path ({@link #flowUpstreamFailed}).
     */
    @Test
    void flowFailingBeforeTheRequest(WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        IllegalStateException failure = new IllegalStateException(BUILDER_FAILURE);
        controller.builderFailure = failure;
        EntityExchangeResult<byte[]> result = exchange(EndpointContract.d1(FlowRequest.class));
        PayloadAssertions.assertBindsTo(PayloadSamples.of(FlowRequest.class), decoded());
        System.out.println("[ApiFlowEndpointsContractTest] builder calls " + controller.builderCalls + ", answers returned "
                + controller.answers.size());
        assertThat(controller.builderCalls).as("builder calls, the one that threw").hasValue(1);
        assertThat(controller.answers).as("answers flow returned (none if the failure escaped it)").hasSize(1);
        assertThatThrownBy(() -> controller.answers.get(0).block()).as("the error of flow's answer: the injected failure, from the catch")
                .isSameAs(failure);
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("upstream requests").isEmpty();
        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/misc/ApiFlowController.java#ApiFlowController.flow#new ObjectMapper#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/misc/ApiFlowController.java#ApiFlowController.flow#writeValueAsString#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/misc/ApiFlowController.java#<file>#import#1"})
    @Test
    void flowRepresentativeData(WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        upstreamAnswers(wireMock, sample, aResponse().withStatus(OK).withBody(UPSTREAM_ANSWER));
        String request = d1Without(tree -> tree.put(DATA, DATA_PLACEHOLDER))
                .replace("\"" + DATA_PLACEHOLDER + "\"", PayloadSamples.representativeInputText());
        EntityExchangeResult<byte[]> result = exchange(request);
        assertThat(result.getStatus().value()).as("status").isEqualTo(OK);
        String body = sentRequest(wireMock).getBodyAsString();
        System.out.println("[ApiFlowEndpointsContractTest] the bare mapper's body "
                + (CanonicalJson.compare(GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT), body).equivalent() ? "equals" : "differs from")
                + " the production mapper's output " + PayloadSamples.REPRESENTATIVE_OUTPUT);
        GOLDEN.assertJson(REPRESENTATIVE_BODY, body);
    }

    /**
     * A member's seat sync, as the client sends it: the relay receives the token and the server's snapshot, the lease
     * is released with the key and request id it was taken with, and the relay's answer reaches the client as text.
     */
    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/WorkspaceSeatSyncService.java#WorkspaceSeatSyncService.send#bodyValue#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/WorkspaceSeatSyncService.java#WorkspaceSeatSyncService.send#bodyToMono#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/subscription/WorkspaceSeatSyncService.java#<file>#import#1"})
    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    void flowSeatSync(String mount) throws JsonProcessingException {
        long before = System.currentTimeMillis();
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(POST, orgData(SEAT_ORG_ID)));
        long after = System.currentTimeMillis();
        assertThat(result.getStatus().value()).as("status of " + mount).isEqualTo(OK);
        assertThat(result.getResponseHeaders().getContentType()).as("Content-Type of " + mount).isEqualTo(TEXT_PLAIN_UTF8);
        LoggedRequest sent = sentRequest(wireMock);
        assertThat(sent.getUrl()).as("seat relay path").isEqualTo(SEAT_RELAY_PATH);
        assertThat(sent.getHeader(SEAT_TOKEN_HEADER)).as("seat relay token header").isEqualTo(SEAT_RELAY_TOKEN);
        assertThat(sent.getHeader(HttpHeaders.CONTENT_TYPE)).as("seat relay Content-Type").isEqualTo(MediaType.APPLICATION_JSON_VALUE);
        assertSeatSnapshot(PayloadAssertions.FIXTURE_EDITOR.readTree(sent.getBodyAsString()), before, after);
        assertThat(leaseKey).as("lease key").isEqualTo(LEASE_KEY_PREFIX + SEAT_HOST_ID + LEASE_KEY_SEPARATOR + SEAT_ORG_ID);
        Mockito.verify(redis).execute(any(), eq(List.of(leaseKey)), eq(List.of(leaseRequestId)));
        String answer = new String(result.getResponseBodyContent(), StandardCharsets.UTF_8);
        GOLDEN.assertJson(SEAT_SYNC_ANSWER, answer.replace(leaseRequestId, REQUEST_ID_PLACEHOLDER));
    }

    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    void flowSeatSyncWithAnotherMethod(String mount) throws JsonProcessingException {
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(OTHER_METHOD, orgData(SEAT_ORG_ID)));
        assertStatusExceptionAnsweredAs500NEW53(result);
        assertNoRelayRequest();
        Mockito.verify(sessions, Mockito.never()).getVisitorOrgMember();
        Mockito.verify(seats, Mockito.never()).count(anyString());
        Mockito.verify(redis.opsForValue(), Mockito.never()).setIfAbsent(anyString(), anyString(), any(Duration.class));
    }

    static Stream<Arguments> blankSeatSyncMethodsOnBothMounts() {
        return onBothMounts(null, EMPTY_METHOD, SPACE_METHOD);
    }

    /**
     * The seat-sync path checks its method before the generic path's blank-method check (NEW-44), so a null, empty or
     * whitespace method is refused there as another method is, not with {@code INVALID_PARAMETER}.
     */
    @ParameterizedTest
    @MethodSource("blankSeatSyncMethodsOnBothMounts")
    void flowSeatSyncWithoutMethod(String mount, String method) throws JsonProcessingException {
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(method, orgData(SEAT_ORG_ID)));
        assertThat(decoded().method()).as("decoded seat-sync method").isEqualTo(method);
        assertStatusExceptionAnsweredAs500NEW53(result);
        assertNoRelayRequest();
        Mockito.verify(sessions, Mockito.never()).getVisitorOrgMember();
    }

    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    void flowSeatSyncAlreadyRunning(String mount) throws JsonProcessingException {
        Mockito.when(redis.opsForValue().setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(Mono.just(false));
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(POST, orgData(SEAT_ORG_ID)));
        assertStatusExceptionAnsweredAs500NEW53(result);
        assertNoRelayRequest();
        Mockito.verify(seats, Mockito.never()).count(anyString());
    }

    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    void flowSeatSyncRelayFailed(String mount) throws JsonProcessingException {
        leaseThenRelayAnswers(requestId -> aResponse().withStatus(UPSTREAM_ERROR));
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(POST, orgData(SEAT_ORG_ID)));
        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
        assertThat(sentRequest(wireMock).getUrl()).as("seat relay path").isEqualTo(SEAT_RELAY_PATH);
        Mockito.verify(redis, Mockito.never()).execute(any(), anyList(), anyList());
    }

    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    void flowSeatSyncNotConfirmed(String mount) throws JsonProcessingException {
        leaseThenRelayAnswers(requestId -> relayConfirmation(UNCONFIRMED_REQUEST_ID));
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(POST, orgData(SEAT_ORG_ID)));
        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
        assertThat(sentRequest(wireMock).getUrl()).as("seat relay path").isEqualTo(SEAT_RELAY_PATH);
        Mockito.verify(redis, Mockito.never()).execute(any(), anyList(), anyList());
    }

    /** The seat-sync path's own checks, each refusing an otherwise valid request before the lease and the relay. */
    enum SeatSyncRefusal {
        /** No session: the {@code UNAUTHORIZED} of {@code WorkspaceSeatSyncService.java:48-49}. */
        NO_SESSION,
        /** A member whose org id is blank, with {@code data.orgId} blank too: only {@code isInvalid} ({@code :50}) refuses. */
        INVALID_MEMBER,
        /** {@code data.orgId} names another workspace than the member's ({@code :50}). */
        ANOTHER_WORKSPACE,
        /** {@code data} without {@code orgId}: the controller passes "" ({@code ApiFlowController.java:59-60}). */
        NO_ORG_ID,
        /** {@code data} null: the controller passes "" ({@code ApiFlowController.java:59-60}). */
        NO_DATA,
        /** {@code data.orgId} the number 7 for a member of workspace "7": the controller passes "" for a non-string ({@code :60}). */
        ORG_ID_NOT_A_STRING,
        /** No deployment id: the {@code SERVICE_UNAVAILABLE} of {@code WorkspaceSeatSyncService.java:54-55}. */
        NO_HOST_ID,
        /** No relay token: the {@code SERVICE_UNAVAILABLE} of {@code WorkspaceSeatSyncService.java:54-55}. */
        NO_RELAY_TOKEN
    }

    static Stream<Arguments> seatSyncRefusals() {
        List<Arguments> cases = new ArrayList<>();
        for (String mount : List.of(NewUrl.FLOW_URL, Url.FLOW_URL)) {
            for (SeatSyncRefusal refusal : SeatSyncRefusal.values()) {
                cases.add(Arguments.of(mount, refusal));
            }
        }
        return cases.stream();
    }

    @ParameterizedTest
    @MethodSource("seatSyncRefusals")
    void flowSeatSyncRefused(String mount, SeatSyncRefusal refusal) throws JsonProcessingException {
        JsonNode data = orgData(SEAT_ORG_ID);
        switch (refusal) {
            case NO_SESSION -> Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
            case INVALID_MEMBER -> {
                Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(BLANK)));
                data = orgData(BLANK);
            }
            case ANOTHER_WORKSPACE -> data = orgData(OTHER_SEAT_ORG_ID);
            case NO_ORG_ID -> data = PayloadAssertions.FIXTURE_EDITOR.createObjectNode();
            case NO_DATA -> data = NullNode.getInstance();
            case ORG_ID_NOT_A_STRING -> {
                Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(NUMERIC_ORG_ID)));
                data = PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(ORG_ID_MEMBER, NUMERIC_ORG_ID_VALUE);
            }
            case NO_HOST_ID -> Mockito.when(config.deployment().ofString(DEPLOYMENT_ID_KEY, BLANK).get()).thenReturn(BLANK);
            case NO_RELAY_TOKEN -> harness(wireMock, BLANK);
        }
        EntityExchangeResult<byte[]> result = exchangeOn(mount, seatSyncRequest(POST, data));
        assertStatusExceptionAnsweredAs500NEW53(result);
        assertNoRelayRequest();
        Mockito.verify(redis.opsForValue(), Mockito.never()).setIfAbsent(anyString(), anyString(), any(Duration.class));
    }

    /**
     * Builds the harness: the mocks of the seat-sync service (a member of {@link #SEAT_ORG_ID}, the deployment id, a
     * counter of {@link #QUANTITY}, a Redis whose lease is taken and released), WireMock reset and answering the
     * snapshot's confirmation once the lease is taken, and the controller over a {@link RedirectedWorkspaceSeatSyncService}
     * with {@code relayToken}.
     */
    private void harness(WireMockRuntimeInfo wireMock, String relayToken) {
        this.wireMock = wireMock;
        wireMock.getWireMock().resetMappings();
        wireMock.getWireMock().resetRequests();
        builder = ContractTestClient.builder();
        sessions = builder.mock(SessionUserService.class);
        Mockito.when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(member(SEAT_ORG_ID)));
        seats = Mockito.mock(WorkspaceSeatCounter.class);
        Mockito.when(seats.count(SEAT_ORG_ID)).thenReturn(Mono.just(QUANTITY));
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> redisMock = Mockito.mock(ReactiveRedisTemplate.class, Mockito.RETURNS_DEEP_STUBS);
        redis = redisMock;
        Mockito.when(redis.execute(any(), anyList(), anyList())).thenReturn(Flux.just(1L));
        config = Mockito.mock(ConfigCenter.class, Mockito.RETURNS_DEEP_STUBS);
        Mockito.when(config.deployment().ofString(DEPLOYMENT_ID_KEY, BLANK).get()).thenReturn(SEAT_HOST_ID);
        leaseThenRelayAnswers(this::relayConfirmation);
        WorkspaceSeatSyncService seatSync = new RedirectedWorkspaceSeatSyncService(sessions, seats, redis, config, relayToken, SEAT_RELAY_URL,
                wireMock.getHttpBaseUrl());
        controller = new RedirectedApiFlowController(seatSync, wireMock.getHttpBaseUrl());
        builder.singleton(CONTROLLER_BEAN, controller);
    }

    /**
     * The Redis lease is taken: the mock records its key and request id and only then registers the relay's answer for
     * that request id, so the answer can confirm the request the service is about to send.
     */
    private void leaseThenRelayAnswers(Function<String, ResponseDefinitionBuilder> relayAnswer) {
        Mockito.when(redis.opsForValue().setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(invocation -> {
            leaseKey = invocation.getArgument(LEASE_KEY_ARGUMENT);
            leaseRequestId = invocation.getArgument(LEASE_REQUEST_ID_ARGUMENT);
            wireMock.getWireMock().register(post(urlPathEqualTo(SEAT_RELAY_PATH)).willReturn(relayAnswer.apply(leaseRequestId)));
            return Mono.just(true);
        });
    }

    /** The relay's confirmation of {@code requestId} and {@link #QUANTITY}, with the §4.6 representative input as {@code detail}. */
    private ResponseDefinitionBuilder relayConfirmation(String requestId) {
        ObjectNode confirmation = PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(SUCCESS_MEMBER, true).put(REQUEST_ID_MEMBER, requestId)
                .put(QUANTITY_MEMBER, QUANTITY).put(DETAIL_MEMBER, DETAIL_PLACEHOLDER);
        try {
            String body = PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(confirmation)
                    .replace("\"" + DETAIL_PLACEHOLDER + "\"", PayloadSamples.representativeInputText());
            return aResponse().withStatus(OK).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).withBody(body);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("cannot write the seat relay's confirmation", e);
        }
    }

    /** The snapshot the seat relay received: exactly the five members, the server's values, {@code issuedAt} in the exchange. */
    private void assertSeatSnapshot(JsonNode snapshot, long before, long after) {
        List<String> members = new ArrayList<>();
        snapshot.fieldNames().forEachRemaining(members::add);
        assertThat(members).as("snapshot members").containsExactlyInAnyOrder(HOST_ID_MEMBER, ORG_ID_MEMBER, QUANTITY_MEMBER,
                REQUEST_ID_MEMBER, ISSUED_AT_MEMBER);
        assertThat(snapshot.get(HOST_ID_MEMBER).isTextual() ? snapshot.get(HOST_ID_MEMBER).asText() : null).as("snapshot hostId")
                .isEqualTo(SEAT_HOST_ID);
        assertThat(snapshot.get(ORG_ID_MEMBER).isTextual() ? snapshot.get(ORG_ID_MEMBER).asText() : null).as("snapshot orgId")
                .isEqualTo(SEAT_ORG_ID);
        assertThat(snapshot.get(QUANTITY_MEMBER).isInt() ? snapshot.get(QUANTITY_MEMBER).intValue() : null).as("snapshot quantity, an integer")
                .isEqualTo(QUANTITY);
        assertThat(snapshot.get(REQUEST_ID_MEMBER).isTextual() ? snapshot.get(REQUEST_ID_MEMBER).asText() : null)
                .as("snapshot requestId, the lease's").isEqualTo(leaseRequestId);
        assertThat(snapshot.get(ISSUED_AT_MEMBER).isIntegralNumber()).as("snapshot issuedAt is an integral number").isTrue();
        assertThat(snapshot.get(ISSUED_AT_MEMBER).longValue()).as("snapshot issuedAt, a time of the exchange").isBetween(before, after);
    }

    /**
     * Pins how a {@code ResponseStatusException} of the seat-sync path reaches the client today: the global handler keeps
     * its status only under the plugin path and otherwise answers its generic {@code INTERNAL_SERVER_ERROR}, HTTP 500
     * ({@code GlobalExceptionHandler.java:141-154}, {@code :158-167}). NEW-53, recorded, not fixed: its fix changes this
     * one method.
     */
    private static void assertStatusExceptionAnsweredAs500NEW53(EntityExchangeResult<byte[]> result) {
        EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
    }

    private void assertNoRelayRequest() {
        assertThat(wireMock.getWireMock().find(anyRequestedFor(anyUrl()))).as("relay requests").isEmpty();
    }

    private static OrgMember member(String orgId) {
        return new OrgMember(orgId, SEAT_USER_ID, MemberRole.MEMBER, MEMBER_STATE, JOIN_TIME);
    }

    private static ObjectNode orgData(String orgId) {
        return PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(ORG_ID_MEMBER, orgId);
    }

    /** The client's seat-sync request ({@code workspaceSeatSync.ts:18-19}) with {@code method} and {@code data}. */
    private static String seatSyncRequest(String method, JsonNode data) throws JsonProcessingException {
        ObjectNode request = PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(PATH, WorkspaceSeatSyncService.FLOW_PATH).put(METHOD, method);
        request.set(DATA, data);
        request.set(HEADERS, PayloadAssertions.FIXTURE_EDITOR.createObjectNode());
        return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(request);
    }

    private static FlowRequest sample() {
        return (FlowRequest) PayloadSamples.of(FlowRequest.class).value();
    }

    private EntityExchangeResult<byte[]> exchange(String jsonBody) {
        try (ContractTestClient client = builder.build()) {
            return CONTRACT.exchange(client, FLOW, Map.of(), jsonBody);
        }
    }

    /**
     * Sends {@code jsonBody} to {@code mount}: {@code /api/flow} through {@link #CONTRACT}, which marks the endpoint
     * exercised, {@code /api/v1/flow} through the harness's client, which {@code EndpointContract} does not call.
     */
    private EntityExchangeResult<byte[]> exchangeOn(String mount, String jsonBody) {
        if (NewUrl.FLOW_URL.equals(mount)) {
            return exchange(jsonBody);
        }
        try (ContractTestClient client = builder.build()) {
            EntityExchangeResult<byte[]> result = client.web().post().uri(mount).contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(jsonBody.getBytes(StandardCharsets.UTF_8)).exchange().expectBody().returnResult();
            System.out.println("[ApiFlowEndpointsContractTest] " + result.getMethod() + " " + result.getUrl() + " body " + jsonBody.length()
                    + " chars -> " + result.getStatus().value() + " " + new String(Objects.requireNonNullElse(result.getResponseBodyContent(), NO_BODY), StandardCharsets.UTF_8));
            return result;
        }
    }

    /** The one request the controller decoded. */
    private FlowRequest decoded() {
        assertThat(controller.decoded).as("requests decoded").hasSize(1);
        return controller.decoded.get(0);
    }

    private static void upstreamAnswers(WireMockRuntimeInfo wireMock, FlowRequest sample,
            ResponseDefinitionBuilder answer) {
        wireMock.getWireMock().register(post(urlPathEqualTo("/" + sample.path())).willReturn(answer));
    }

    /** The one request the upstream received. */
    private static LoggedRequest sentRequest(WireMockRuntimeInfo wireMock) {
        List<LoggedRequest> requests = wireMock.getWireMock().find(anyRequestedFor(anyUrl()));
        assertThat(requests).as("upstream requests").hasSize(1);
        LoggedRequest request = requests.get(0);
        System.out.println("[ApiFlowEndpointsContractTest] upstream received " + request.getMethod() + " " + request.getUrl() + " "
                + request.getHeaders().all() + " " + request.getBodyAsString());
        return request;
    }

    /** D1's {@code data} member as text, with its number lexemes. */
    private static String d1Data() throws JsonProcessingException {
        return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.d1(FlowRequest.class))
                .get(DATA));
    }

    /** The D1 golden after {@code edit}, with its number lexemes. */
    private static String d1Without(Consumer<ObjectNode> edit) throws JsonProcessingException {
        ObjectNode tree = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.d1(FlowRequest.class));
        edit.accept(tree);
        return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(tree);
    }

    /**
     * The production controller, which records each request the server codec decoded and runs the production
     * {@code flow} with {@link WebClientRedirect} open on the calling thread: {@code flow} builds its client before it
     * returns, so the client is built against {@code baseUrl}. The seat-sync path builds no client in {@code flow}; its
     * service redirects its own relay request. It counts the calls of {@code WebClientBuildHelper.builder()} made in
     * {@code flow}, and when {@link #builderFailure} is set, that call throws it, a failure while the request is built.
     */
    static final class RedirectedApiFlowController extends ApiFlowController {

        final List<FlowRequest> decoded = new CopyOnWriteArrayList<>();
        private final String baseUrl;
        /** Thrown by {@code WebClientBuildHelper.builder()} inside {@code flow} when set; null for a redirected client. */
        RuntimeException builderFailure;
        /** The calls of {@code WebClientBuildHelper.builder()} in {@code flow}, a throwing one included. */
        final AtomicInteger builderCalls = new AtomicInteger();
        /** The answers {@code flow} returned, in order; an exception thrown out of it adds none. */
        final List<Mono<String>> answers = new CopyOnWriteArrayList<>();

        RedirectedApiFlowController(WorkspaceSeatSyncService seatSyncService, String baseUrl) {
            super(seatSyncService);
            this.baseUrl = baseUrl;
        }

        @Override
        public Mono<String> flow(FlowRequest flowRequest) {
            decoded.add(flowRequest);
            try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(baseUrl, () -> {
                builderCalls.incrementAndGet();
                if (builderFailure != null) {
                    throw builderFailure;
                }
            })) {
                Mono<String> answer = super.flow(flowRequest);
                answers.add(answer);
                return answer;
            }
        }
    }


    /**
     * NEW-40: on both mounts, a method with an {@code i} sent in lower case reaches the upstream as that method under a
     * Turkish default locale too; the default locale's rule made {@code options} {@code OPTİONS}, a method of another
     * name. The retries and the timeout are left out, as in {@link #flowUpstreamFailed}, so that a failure is not
     * retried. The case holds JUnit's {@code Resources.LOCALE} lock while it changes the default locale; the lock
     * orders it only against tests that hold the same lock, and it restores the locale after its calls, which block,
     * have completed.
     */
    @ParameterizedTest
    @ValueSource(strings = {NewUrl.FLOW_URL, Url.FLOW_URL})
    @ResourceLock(Resources.LOCALE)
    void flowWithALowerCaseOptionsMethodUnderATurkishDefaultLocaleNEW40(String mount, WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        wireMock.getWireMock().register(request(HttpMethod.OPTIONS.name(), urlPathEqualTo(PATH_SEPARATOR + sample.path()))
                .willReturn(aResponse().withStatus(OK).withBody(UPSTREAM_ANSWER)));
        String body = d1Without(tree -> {
            tree.remove(List.of(RETRIES, TIMEOUT));
            tree.put(METHOD, LOWER_CASE_OPTIONS);
        });
        Locale previous = Locale.getDefault();
        Locale.setDefault(TURKISH);
        EntityExchangeResult<byte[]> result;
        try {
            result = exchangeOn(mount, body);
        } finally {
            Locale.setDefault(previous);
        }
        List<LoggedRequest> requests = wireMock.getWireMock().find(anyRequestedFor(urlPathEqualTo(PATH_SEPARATOR + sample.path())));
        System.out.println("[ApiFlowEndpointsContractTest] " + mount + " under " + TURKISH + ": upstream methods " + requests.stream().map(LoggedRequest::getMethod).toList()
                + ", answer " + result.getStatus());
        assertThat(requests).as("upstream requests").singleElement().satisfies(request ->
                assertThat(request.getMethod().value()).as("upstream method").isEqualTo(HttpMethod.OPTIONS.name()));
        EndpointContract.assertBytes(result, HttpStatus.OK, TEXT_PLAIN_UTF8, UPSTREAM_ANSWER.getBytes(StandardCharsets.UTF_8));
    }
}

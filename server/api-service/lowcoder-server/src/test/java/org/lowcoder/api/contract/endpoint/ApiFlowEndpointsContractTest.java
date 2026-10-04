package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.MiscSamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.misc.ApiFlowController;
import org.lowcoder.api.misc.ApiFlowEndpoints;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests of the 1 {@link ApiFlowEndpoints} endpoint (docs/API_PAYLOAD_TEST_PLAN.md §1.3, §4.9, task T7.3), level
 * {@code decode-only}, and group {@code api-flow}. {@code ApiFlowController#flow} decodes a {@link FlowRequest} with the
 * server codec, writes its {@code data} with a bare {@code new ObjectMapper()} ({@code ApiFlowController.java:38-39})
 * and sends that text unchanged ({@code :46}), with the request's headers, to a fixed {@code https} URL through a
 * client built inline; it answers the upstream's text as a {@code String}.
 *
 * <p>The controller under test is {@link RedirectedApiFlowController}: the production class, whose {@code flow} records
 * each decoded request and runs the production method with {@link WebClientRedirect} open on the thread that calls it,
 * so the inline client is built against WireMock. A request is the D1 golden of {@link FlowRequest}, edited where a
 * test needs a property left out:
 *
 * <ul>
 *   <li>{@link #flow}: the decoded request must bind as D1 does ({@link PayloadAssertions#assertBindsTo}); WireMock must
 *       receive the request's method, path and headers and, as body, D1's {@code data} written again (compared
 *       canonically); the upstream's text must reach the client unchanged;</li>
 *   <li>{@link #flowUpstreamFailed}: without {@code retries} and {@code timeout} (so no retry), an upstream error becomes
 *       {@code BizException(FLOW_ERROR)} with the upstream exception's message ({@code :53});</li>
 *   <li>{@link #flowWithoutHeaders}: without {@code headers} the controller throws at {@code :47}, before any I/O, and
 *       {@code :54-56} answer {@code Mono.error}: the global handler's {@code INTERNAL_SERVER_ERROR};</li>
 *   <li>{@link #flowRepresentativeData}: {@code data} is the §4.6 representative input, spliced in as text; the body
 *       WireMock receives, the bare mapper's writing of what the server codec bound, is pinned in
 *       {@value #REPRESENTATIVE_BODY}. This is the {@code api-flow} group's test.</li>
 * </ul>
 *
 * <p>Limits: the controller is a test subclass, so the request reaches {@code flow} through its override, which only
 * records and redirects; the transport (system proxy, timeout) is WireMock's, not the production one; the answer is
 * the upstream's text, which no JSON codec writes, so the level stays {@code decode-only}. Retries with a backoff are
 * not run: the D1 request asks for {@value MiscSamples#FLOW_RETRIES} of them, which only an error would start.
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}: the answer is the upstream's.
 */
@WireMockTest
class ApiFlowEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(ApiFlowEndpoints.class);
    static final String FLOW = "flow";
    static final String REPRESENTATIVE_BODY = "boundary/api-flow/representative.body.json";
    /** {@code ApiFlowController}'s fixed upstream, which {@code flowRequest.path()} is appended to. */
    static final String FLOW_BASE_URL = "https://flow.lowcoder.cloud/";
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

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private ContractTestClient.Builder builder;
    private RedirectedApiFlowController controller;

    @BeforeEach
    void harness(WireMockRuntimeInfo wireMock) {
        builder = ContractTestClient.builder();
        controller = new RedirectedApiFlowController(wireMock.getHttpBaseUrl());
        builder.singleton(CONTROLLER_BEAN, controller);
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
        EndpointContract.assertBytes(result, HttpStatus.OK, MediaType.parseMediaType(MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8"),
                UPSTREAM_ANSWER.getBytes(StandardCharsets.UTF_8));
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

    @Test
    void flowWithoutHeaders(WireMockRuntimeInfo wireMock) throws JsonProcessingException {
        FlowRequest sample = sample();
        EntityExchangeResult<byte[]> result = exchange(d1Without(tree -> tree.remove(HEADERS)));
        assertThat(decoded()).as("the D1 request without headers")
                .isEqualTo(new FlowRequest(sample.path(), sample.method(), sample.data(), null, sample.timeout(), sample.retries()));
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

    private static FlowRequest sample() {
        return (FlowRequest) PayloadSamples.of(FlowRequest.class).value();
    }

    private EntityExchangeResult<byte[]> exchange(String jsonBody) {
        try (ContractTestClient client = builder.build()) {
            return CONTRACT.exchange(client, FLOW, Map.of(), jsonBody);
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
     * returns, so the client is built against {@code baseUrl}.
     */
    static final class RedirectedApiFlowController extends ApiFlowController {

        final List<FlowRequest> decoded = new CopyOnWriteArrayList<>();
        private final String baseUrl;

        RedirectedApiFlowController(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        @Override
        public Mono<String> flow(FlowRequest flowRequest) {
            decoded.add(flowRequest);
            try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(baseUrl)) {
                return super.flow(flowRequest);
            }
        }
    }
}

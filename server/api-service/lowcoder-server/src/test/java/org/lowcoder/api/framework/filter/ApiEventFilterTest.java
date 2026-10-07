package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.NoSuchElementException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.event.APICallEvent;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.constants.GlobalContext;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.WebFilterChain;

import com.google.common.hash.Hashing;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

/**
 * Tests of {@link ApiEventFilter}. The event is published asynchronously ({@code subscribeOn(boundedElastic)},
 * {@code subscribe()}), so a published event is awaited with a bounded Mockito {@code timeout}; the absence of an event
 * can only be asserted for a bounded time ({@code after(...).never()}), which is the limit of the "no event" tests.
 *
 * <p>BF-038 (fixed; was pinned under D-6 as plan §9 row "ApiEventFilter publishes no event without an X-Real-IP header":
 * a NullPointerException on {@code headers.remove("X-Real-IP").stream()}, swallowed by the fire-and-forget subscribe): a
 * request without that header is audited with an empty ip address. Still pinned: the filter fails with a
 * NullPointerException after the chain when the response status was never set.
 */
class ApiEventFilterTest {

    private static final String TOKEN = "session-token";
    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final long EVENT_TIMEOUT_MILLIS = 5000;
    private static final long NO_EVENT_WINDOW_MILLIS = 700;

    private ApplicationEventPublisher publisher;
    private ApiEventFilter filter;

    @BeforeEach
    void setUp() {
        publisher = mock(ApplicationEventPublisher.class);
        filter = new ApiEventFilter(publisher, mock(SessionUserService.class));
    }

    private static OrgMember member(String userId) {
        return OrgMember.builder().orgId("org-1").userId(userId).role(MemberRole.MEMBER).build();
    }

    private static Context context(String userId) {
        return Context.of(GlobalContext.VISITOR_TOKEN, TOKEN,
                GlobalContext.CURRENT_ORG_MEMBER, Mono.just(member(userId)),
                GlobalContext.HEADERS, Map.of("eventHeader", "value"));
    }

    private static WebFilterChain answering(HttpStatus status) {
        return exchange -> {
            exchange.getResponse().setStatusCode(status);
            return Mono.empty();
        };
    }

    private Mono<Void> run(MockServerHttpRequest request, WebFilterChain chain, Context context) {
        return filter.filter(MockServerWebExchange.from(request), chain).contextWrite(context);
    }

    private APICallEvent awaitEvent() {
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(publisher, timeout(EVENT_TIMEOUT_MILLIS)).publishEvent(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(APICallEvent.class);
        return (APICallEvent) captor.getValue();
    }

    private void expectNoEvent() {
        verify(publisher, after(NO_EVENT_WINDOW_MILLIS).never()).publishEvent(org.mockito.ArgumentMatchers.<Object>any());
    }

    /**
     * Catches event fields dropped or mixed up, and the session cookie leaking into the audit event: the event carries
     * user, org, anonymous flag, SHA-512 session hash, method, path, query and the other headers; the {@code Cookie}
     * header is removed and the {@code X-Real-IP} header becomes the ip address.
     */
    @Test
    void successfulResponse_publishesAnEventWithoutTheCookie_andWithTheRealIp() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/orders?a=1&b=2&b=3")
                .header("Cookie", "LOWCODE_TOKEN=secret")
                .header("X-Real-IP", "203.0.113.9")
                .header("X-Other", "kept")
                .build();

        StepVerifier.create(run(request, answering(HttpStatus.OK), context("user-1"))).verifyComplete();

        APICallEvent event = awaitEvent();
        assertThat(event.getUserId()).isEqualTo("user-1");
        assertThat(event.getOrgId()).isEqualTo("org-1");
        assertThat(event.getIsAnonymous()).isFalse();
        assertThat(event.getSessionHash()).isEqualTo(Hashing.sha512().hashString(TOKEN, StandardCharsets.UTF_8).toString());
        assertThat(event.getHttpMethod()).isEqualTo("POST");
        assertThat(event.getRequestUri()).isEqualTo("/api/orders");
        assertThat(event.getQueryParams()).containsEntry("a", java.util.List.of("1")).containsEntry("b", java.util.List.of("2", "3"));
        assertThat(event.getIpAddress()).isEqualTo("203.0.113.9");
        assertThat(event.getHeaders()).containsKey("X-Other").doesNotContainKey("Cookie").doesNotContainKey("X-Real-IP");
        assertThat(event.getEventHeaders()).containsEntry("eventHeader", "value");
        System.out.println("[ApiEventFilterTest] event for " + event.getUserId() + " " + event.getHttpMethod() + " " + event.getRequestUri()
                + " ip " + event.getIpAddress() + " headers " + event.getHeaders().keySet());
    }

    @Test
    void anonymousVisitor_isFlaggedAnonymous() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/x").header("X-Real-IP", "1.1.1.1").build();

        StepVerifier.create(run(request, answering(HttpStatus.NO_CONTENT), context(Authentication.ANONYMOUS_USER_ID))).verifyComplete();

        assertThat(awaitEvent().getIsAnonymous()).isTrue();
    }

    /** Catches events for failed requests: only 2xx responses are audited. */
    @ParameterizedTest
    @ValueSource(ints = {302, 400, 404, 500})
    void nonSuccessfulResponse_publishesNoEvent(int status) {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/x").header("X-Real-IP", "1.1.1.1").build();

        StepVerifier.create(run(request, answering(HttpStatus.valueOf(status)), context("user-1"))).verifyComplete();

        expectNoEvent();
    }

    /**
     * Pins today's behaviour of the fire-and-forget part: when the context lacks the visitor token, the filter's own
     * Mono fails with NoSuchElementException (the context lookup runs before anything is emitted).
     */
    @Test
    void missingVisitorToken_failsWithNoSuchElement() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/x").header("X-Real-IP", "1.1.1.1").build();

        StepVerifier.create(run(request, answering(HttpStatus.OK), Context.of(GlobalContext.CURRENT_ORG_MEMBER, Mono.just(member("u")))))
                .expectError(NoSuchElementException.class).verify(WAIT);
        expectNoEvent();
    }

    /**
     * Pins today's behaviour (no §9 row): a response whose status was never set makes the filter fail with a
     * NullPointerException after the chain. Not reachable in production: the server runs on Reactor Netty, whose
     * {@code ReactorServerHttpResponse.getStatusCode()} falls back to the Netty response status (200); only the mock
     * response of {@code MockServerWebExchange}/{@code WebTestClient} reports null (observed through the harness: the
     * NPE shows up for a controller that answers 200 without setting a status).
     */
    @Test
    void responseWithoutStatus_failsWithNullPointer_afterTheChain() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/x").header("X-Real-IP", "1.1.1.1").build();

        StepVerifier.create(run(request, exchange -> Mono.empty(), context("user-1")))
                .expectError(NullPointerException.class).verify(WAIT);
        expectNoEvent();
    }

    // -------------------------------------------------------- real request stack

    @RestController
    static class ProbeController {
        @GetMapping("/probe/ok")
        public Mono<org.springframework.http.ResponseEntity<ResponseView<String>>> ok() {
            // an explicit status: the mock response of the test stack reports null for a status never set, the Reactor
            // Netty response of the server falls back to the Netty status (ReactorServerHttpResponse.getStatusCode)
            return Mono.just(org.springframework.http.ResponseEntity.ok(ResponseView.success("fine")));
        }
    }

    private ContractTestClient harness() {
        return ContractTestClient.builder()
                .controller(ProbeController.class)
                .visitor("user-1", member("user-1"))
                .webFilter(filter)
                .build();
    }

    /**
     * Probe of the request stack (production GlobalContextFilter, codecs and handler mapping, a controller answering
     * 200 with an explicit status): an event is published when {@code X-Real-IP} is present.
     */
    @Test
    void throughTheRequestStack_aPlain200WithXRealIp_publishesAnEvent() {
        try (ContractTestClient client = harness()) {
            client.web().get().uri("/probe/ok").header("X-Real-IP", "198.51.100.4").exchange().expectStatus().isOk();

            APICallEvent event = awaitEvent();
            assertThat(event.getRequestUri()).isEqualTo("/probe/ok");
            assertThat(event.getIpAddress()).isEqualTo("198.51.100.4");
            System.out.println("[ApiEventFilterTest] real stack: event for " + event.getRequestUri() + " ip " + event.getIpAddress());
        }
    }

    /**
     * BF-038: a request without {@code X-Real-IP} (one that does not pass a reverse proxy) is audited too, with an empty ip
     * address and the other fields as with the header; the event was lost before (ApiEventFilter:57-60 at the pin).
     */
    @Test
    void throughTheRequestStack_withoutXRealIp_publishesAnEventWithAnEmptyIpBF038() {
        try (ContractTestClient client = harness()) {
            client.web().get().uri("/probe/ok?q=1").header("X-Other", "kept").exchange().expectStatus().isOk();

            APICallEvent event = awaitEvent();
            System.out.println("[ApiEventFilterTest] real stack: no X-Real-IP -> event for " + event.getRequestUri() + " ip '"
                    + event.getIpAddress() + "' headers " + event.getHeaders().keySet());
            assertThat(event.getIpAddress()).isEmpty();
            assertThat(event.getRequestUri()).isEqualTo("/probe/ok");
            assertThat(event.getHttpMethod()).isEqualTo("GET");
            assertThat(event.getUserId()).isEqualTo("user-1");
            assertThat(event.getQueryParams()).containsEntry("q", java.util.List.of("1"));
            assertThat(event.getHeaders()).containsKey("X-Other").doesNotContainKey("X-Real-IP");
        }
    }

    /** BF-038, the filter alone: without X-Real-IP the event is published with an empty ip, and the cookie is still removed. */
    @Test
    void withoutXRealIp_theFilterAlonePublishesAnEventWithAnEmptyIpBF038() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/orders").header("Cookie", "LOWCODE_TOKEN=secret").build();

        StepVerifier.create(run(request, answering(HttpStatus.OK), context("user-1"))).verifyComplete();

        APICallEvent event = awaitEvent();
        assertThat(event.getIpAddress()).isEmpty();
        assertThat(event.getHeaders()).doesNotContainKey("Cookie");
        assertThat(event.getHttpMethod()).isEqualTo("POST");
    }
}

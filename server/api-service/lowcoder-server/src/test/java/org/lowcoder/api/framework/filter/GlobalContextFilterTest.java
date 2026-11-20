package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.sdk.constants.GlobalContext;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

/**
 * Tests of the request id handling of {@link GlobalContextFilter}, through the request stack of {@link ContractTestClient}
 * (production filter, codecs and handler mapping). The probe controller records what the filter wrote into the Reactor
 * context: the log context's {@code requestId} and the analytics {@code headers} map.
 */
class GlobalContextFilterTest {

    private static final String REQUEST_ID_HEADER = "X-REQUEST-ID";
    private static final String CLIENT_REQUEST_ID = "client-request-1";
    private static final String COOKIE_HEADER = "Cookie";

    /** What the probe saw in the Reactor context of the request. */
    private record Seen(String requestId, MultiValueMap<String, String> headers) {
    }

    private static final AtomicReference<Seen> SEEN = new AtomicReference<>();

    @BeforeEach
    void reset() {
        SEEN.set(null);
    }

    @RestController
    static class ContextProbeController {
        @GetMapping("/probe/context")
        public Mono<ResponseEntity<ResponseView<String>>> context() {
            return Mono.deferContextual(ctx -> {
                SEEN.set(new Seen(ctx.get(GlobalContext.REQUEST_ID_LOG), ctx.get(GlobalContext.HEADERS)));
                return Mono.just(ResponseEntity.ok(ResponseView.success("fine")));
            });
        }
    }

    private static ContractTestClient harness() {
        return ContractTestClient.builder()
                .controller(ContextProbeController.class)
                .visitor("user-1", OrgMember.builder().orgId("org-1").userId("user-1").role(MemberRole.MEMBER).build())
                .build();
    }

    /**
     * A request without X-REQUEST-ID is answered normally (it failed with HTTP 500 when the id was looked up in the
     * original headers after a discarded {@code mutate()}), and the generated id is the context's requestId and the
     * X-REQUEST-ID value of the analytics headers.
     */
    @Test
    void withoutRequestIdHeader_theRequestIsAnsweredAndAnIdIsGeneratedIntoContextAndHeaders() {
        try (ContractTestClient client = harness()) {
            client.web().get().uri("/probe/context").header(COOKIE_HEADER, "LOWCODE_TOKEN=secret").exchange()
                    .expectStatus().isOk();

            Seen seen = SEEN.get();
            System.out.println("[GlobalContextFilterTest] no client id -> requestId '" + seen.requestId() + "', headers "
                    + seen.headers().keySet());
            assertThat(seen.requestId()).as("requestId in the log context").isNotBlank();
            assertThat(seen.headers().get(REQUEST_ID_HEADER))
                    .as("X-REQUEST-ID of the analytics headers must be the generated requestId")
                    .containsExactly(seen.requestId());
            assertThat(seen.headers()).as("the cookie is still removed from the analytics headers")
                    .doesNotContainKey(COOKIE_HEADER);
        }
    }

    /** A request with X-REQUEST-ID keeps the client's value in the context's requestId and in the analytics headers. */
    @Test
    void withRequestIdHeader_theClientValueIsKeptInContextAndHeaders() {
        try (ContractTestClient client = harness()) {
            client.web().get().uri("/probe/context").header(REQUEST_ID_HEADER, CLIENT_REQUEST_ID).exchange()
                    .expectStatus().isOk();

            Seen seen = SEEN.get();
            System.out.println("[GlobalContextFilterTest] client id -> requestId '" + seen.requestId() + "', headers "
                    + seen.headers().get(REQUEST_ID_HEADER));
            assertThat(seen.requestId()).as("requestId in the log context must be the client's value")
                    .isEqualTo(CLIENT_REQUEST_ID);
            assertThat(seen.headers().get(REQUEST_ID_HEADER))
                    .as("X-REQUEST-ID of the analytics headers must be the client's value, unchanged")
                    .containsExactly(CLIENT_REQUEST_ID);
        }
    }
}

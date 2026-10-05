package org.lowcoder.api.framework.filter;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;

import reactor.core.publisher.Mono;

/** Exchange and chain helpers shared by the filter tests (new test support, L2-9). */
final class FilterTestSupport {

    private FilterTestSupport() {
    }

    static MockServerWebExchange exchange(String path) {
        return MockServerWebExchange.from(MockServerHttpRequest.get(path).build());
    }

    /** A chain that counts how often it was called and how often its Mono was subscribed. */
    static final class ChainProbe implements WebFilterChain {
        final AtomicInteger invoked = new AtomicInteger();
        final AtomicInteger subscribed = new AtomicInteger();

        @Override
        public Mono<Void> filter(ServerWebExchange exchange) {
            invoked.incrementAndGet();
            return Mono.defer(() -> {
                subscribed.incrementAndGet();
                return Mono.empty();
            });
        }
    }
}

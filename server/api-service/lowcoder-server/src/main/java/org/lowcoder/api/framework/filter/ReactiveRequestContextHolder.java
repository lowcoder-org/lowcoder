package org.lowcoder.api.framework.filter;

import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

public class ReactiveRequestContextHolder {
    public static final Class<ServerHttpRequest> SERVER_HTTP_REQUEST = ServerHttpRequest.class;

    public static Mono<ServerHttpRequest> getRequest() {
        return Mono.subscriberContext()
                .map(ctx -> ctx.get(SERVER_HTTP_REQUEST));
    }
}
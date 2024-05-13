package org.lowcoder.api.framework.filter;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Configuration
public class ReactiveRequestContextFilter implements WebFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return Mono.deferContextual(contextView -> {
            ServerHttpRequest request = exchange.getRequest();
            return chain.filter(exchange)
                    .contextWrite(context -> context.put(ReactiveRequestContextHolder.SERVER_HTTP_REQUEST, request));
        });
    }
}

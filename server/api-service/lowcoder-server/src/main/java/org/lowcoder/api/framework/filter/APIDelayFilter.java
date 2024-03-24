package org.lowcoder.api.framework.filter;

import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;

import static org.lowcoder.api.framework.filter.FilterOrder.API_DELAY_FILTER;

@Component
public class APIDelayFilter implements WebFilter, Ordered {

    @Autowired
    private ServerConfigRepository serverConfigRepository;

    @Override
    public int getOrder() {
        return API_DELAY_FILTER.getOrder();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return serverConfigRepository.findByKey("isRateLimited")
                .map(serverConfig -> {
                    if(serverConfig.getValue() != null && Boolean.parseBoolean(serverConfig.getValue().toString())) {
                        return Mono.delay(Duration.ofSeconds(5)).block();
                    } else {
                        return Mono.empty();
                    }
                }).then(chain.filter(exchange));
    }
}
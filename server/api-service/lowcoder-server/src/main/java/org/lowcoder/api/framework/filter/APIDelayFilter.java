package org.lowcoder.api.framework.filter;

import org.lowcoder.infra.config.model.ServerConfig;
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

    /**
     * The server config key that turns the delay on. Written by installed plugin code through
     * {@code LowcoderServices.setConfig} (the enterprise plugin's license check sets it, every 15 s, to whether the licensed
     * API calls are used up) and through {@code POST /api/configs/{key}}.
     */
    static final String RATE_LIMITED_KEY = "isRateLimited";

    /** How long every request waits while {@link #RATE_LIMITED_KEY} is true. */
    static final Duration DELAY = Duration.ofSeconds(5);

    @Autowired
    private ServerConfigRepository serverConfigRepository;

    @Override
    public int getOrder() {
        return API_DELAY_FILTER.getOrder();
    }

    /**
     * Delays the request by {@link #DELAY} while the server config {@link #RATE_LIMITED_KEY} is true. BF-062: the delay is a
     * timer the chain waits for; it was a {@code block()} inside {@code map}, which Reactor refuses on the server's
     * non-blocking threads, so every request failed while the key was true.
     * <p>
     * Limits: the key is read from the database on every request; a value whose text is not {@code true} (in any case)
     * counts as false. The delay holds no thread, but the request and its connection stay open while it runs.
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return serverConfigRepository.findByKey(RATE_LIMITED_KEY)
                .filter(APIDelayFilter::isRateLimited)
                .flatMap(serverConfig -> Mono.delay(DELAY))
                .then(chain.filter(exchange));
    }

    private static boolean isRateLimited(ServerConfig serverConfig) {
        return serverConfig.getValue() != null && Boolean.parseBoolean(serverConfig.getValue().toString());
    }
}

package org.lowcoder.api.framework.filter;

import static java.util.Collections.emptyMap;
import static org.lowcoder.api.framework.filter.FilterOrder.THROTTLING;
import static org.lowcoder.sdk.exception.BizError.REQUEST_THROTTLED;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import javax.annotation.Nonnull;

import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import com.google.common.util.concurrent.RateLimiter;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@ConditionalOnExpression("${default.api-rate-limit:0} > 0")
@SuppressWarnings("UnstableApiUsage")
@Slf4j
@Component
public class ThrottlingFilter implements WebFilter, Ordered {

	@Value("${default.api-rate-limit}")
    private int defaultApiRateLimit;

    
    private final Map<String, RateLimiterWrapper> rateLimiterMap = new ConcurrentHashMap<>();
    private Supplier<Map<String, Integer>> urlRateLimiter;

    @Autowired
    private ConfigCenter configCenter;

    @PostConstruct
    private void init() {
        urlRateLimiter = configCenter.threshold().ofMap("urlRateLimiter", String.class, Integer.class, emptyMap());
        log.info("API rate limit filter enabled with default rate limit set to: {} requests per second");
    }

    @Nonnull
    @Override
    public Mono<Void> filter(@Nonnull ServerWebExchange exchange, @Nonnull WebFilterChain chain) {

        ServerHttpRequest request = exchange.getRequest();
        String requestUrl = request.getPath().pathWithinApplication().value();

        RateLimiterWrapper rateLimiter = rateLimiterMap.compute(requestUrl,
                (url, currentLimiter) -> {
                    int targetRate = urlRateLimiter.get().getOrDefault(url, defaultApiRateLimit);
                    if (currentLimiter == null) {
                        return RateLimiterWrapper.create(targetRate);
                    }
                    if (currentLimiter.rateNotChanged(targetRate)) {
                        return currentLimiter;
                    }
                    return currentLimiter.updateRate(targetRate);
                });


        if (!rateLimiter.tryAcquire()) {
            return ofError(REQUEST_THROTTLED, "REQUEST_THROTTLED");
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return THROTTLING.getOrder();
    }

    @Getter
    private static class RateLimiterWrapper {
        private final RateLimiter rateLimiter;

        private volatile long initMillis;

        private RateLimiterWrapper(int targetRate) {
            this.rateLimiter = RateLimiter.create(targetRate);
            this.initMillis = System.currentTimeMillis();
        }

        public static RateLimiterWrapper create(int targetRate) {
            return new RateLimiterWrapper(targetRate);
        }

        public boolean rateNotChanged(int targetRate) {
            return Math.abs(targetRate - rateLimiter.getRate()) < 1e-6;
        }

        public RateLimiterWrapper updateRate(int targetRate) {
            rateLimiter.setRate(targetRate);
            initMillis = System.currentTimeMillis();
            return this;
        }

        public boolean tryAcquire() {
            // might fail when just init, e.g. multiple queries come after server restarted
            // so here we give one second for the rateLimiter to become active
            if (System.currentTimeMillis() - initMillis <= 1000) {
                return true;
            }
            return rateLimiter.tryAcquire();
        }

    }

}

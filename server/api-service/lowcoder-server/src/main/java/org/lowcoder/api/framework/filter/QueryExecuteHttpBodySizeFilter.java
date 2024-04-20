package org.lowcoder.api.framework.filter;

import jakarta.annotation.Nonnull;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstanceHelper;
import org.lowcoder.sdk.exception.BizException;
import org.reactivestreams.Publisher;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicLong;

import static org.lowcoder.api.framework.filter.FilterOrder.QUERY_EXECUTE_HTTP_BODY_SIZE;
import static org.lowcoder.sdk.exception.BizError.EXCEED_QUERY_REQUEST_SIZE;
import static org.lowcoder.sdk.exception.BizError.EXCEED_QUERY_RESPONSE_SIZE;

/**
 * check query request and response size
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(value = "common.cloud", havingValue = "true")
public class QueryExecuteHttpBodySizeFilter implements WebFilter, Ordered {

    private final ConfigCenter configCenter;
    private final CommonConfig commonConfig;

    private ConfigInstanceHelper configInstance;

    @PostConstruct
    public void init() {
        configInstance = new ConfigInstanceHelper(configCenter.threshold());
    }

    @Nonnull
    @Override
    public Mono<Void> filter(@Nonnull ServerWebExchange exchange, @Nonnull WebFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();
        // check query api
        if (path.startsWith(NewUrl.QUERY_URL) || path.startsWith(Url.QUERY_URL)) {

            String maxSize = configInstance.ofString("maxRequestSize", commonConfig.getMaxQueryRequestSize());
            long maxRequestSize = DataSize.parse(maxSize).toBytes();
            maxSize = configInstance.ofString("maxResponseSize", commonConfig.getMaxQueryResponseSize());
            long maxResponseSize = DataSize.parse(maxSize).toBytes();

            log.info("Setting up maximum query request size to: {} bytes", maxRequestSize);
            log.info("Setting up maximum query response size to: {} bytes", maxResponseSize);
            ServerWebExchange newServerWebExchange = exchange.mutate()
                    .request(new CustomServerHttpRequestDecorator(exchange.getRequest(), maxRequestSize))
                    .response(new CustomServerHttpResponseDecorator(exchange.getResponse(), maxResponseSize))
                    .build();
            return chain.filter(newServerWebExchange);
        }
        // pass
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return QUERY_EXECUTE_HTTP_BODY_SIZE.getOrder();
    }

    private static class CustomServerHttpRequestDecorator extends ServerHttpRequestDecorator {

        private final AtomicLong readBytes = new AtomicLong();
        private final long maxReadBytes;

        public CustomServerHttpRequestDecorator(ServerHttpRequest delegate, long maxReadBytes) {
            super(delegate);
            this.maxReadBytes = maxReadBytes;
        }

        @Nonnull
        @Override
        public Flux<DataBuffer> getBody() {
            return super.getBody()
                    .delayUntil(dataBuffer -> {
                        if (readBytes.addAndGet(dataBuffer.readableByteCount()) > maxReadBytes) {
                            return Mono.error(new BizException(EXCEED_QUERY_REQUEST_SIZE, "EXCEED_QUERY_REQUEST_SIZE"));
                        }
                        return Mono.empty();
                    });
        }
    }

    private static class CustomServerHttpResponseDecorator extends ServerHttpResponseDecorator {

        private final AtomicLong writeBytes = new AtomicLong();

        private final long maxWriteBytes;

        public CustomServerHttpResponseDecorator(ServerHttpResponse delegate, long maxWriteBytes) {
            super(delegate);
            this.maxWriteBytes = maxWriteBytes;
        }

        @Nonnull
        @Override
        public Mono<Void> writeWith(@Nonnull Publisher<? extends DataBuffer> body) {
            return super.writeWith(Flux.from(body)
                    .delayUntil(dataBuffer -> {
                        if (writeBytes.addAndGet(dataBuffer.readableByteCount()) > maxWriteBytes) {
                            return Mono.error(new BizException(EXCEED_QUERY_RESPONSE_SIZE, "EXCEED_QUERY_RESPONSE_SIZE"));
                        }
                        return Mono.empty();
                    }));
        }
    }
    
}

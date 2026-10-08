package org.lowcoder.api.material;

import org.lowcoder.domain.asset.service.AssetService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class AssetController implements AssetEndpoints
{
    /** An asset id names fixed bytes, so a served image may be kept for 90 days. */
    static final String IMAGE_CACHE_CONTROL = "public, max-age=7776000, immutable";

    private final AssetService service;

    /**
     * The asset's image. The cache header is added when the response commits, and only to a 200 answer (BF-129: it was
     * set up front, so the answer for an unknown id, now a 404, or an error answer could be cached for 90 days). Limit:
     * an error answer with status 200 would carry it; a failed asset read is answered 500 by the catch-all of
     * GlobalExceptionHandler.
     */
    @Override
    public Mono<Void> getById(@PathVariable String id, ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.beforeCommit(() -> Mono.fromRunnable(() -> {
            if (response.getStatusCode() != null && response.getStatusCode().isSameCodeAs(HttpStatus.OK)) {
                response.getHeaders().set(HttpHeaders.CACHE_CONTROL, IMAGE_CACHE_CONTROL);
            }
        }));
        return service.makeImageResponse(exchange, id);
    }
}

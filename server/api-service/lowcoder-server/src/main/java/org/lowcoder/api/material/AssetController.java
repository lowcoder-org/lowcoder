package org.lowcoder.api.material;

import org.lowcoder.domain.asset.service.AssetService;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class AssetController implements AssetEndpoints
{
    private final AssetService service;

    @Override
    public Mono<Void> getById(@PathVariable String id, ServerWebExchange exchange) {
        exchange.getResponse().getHeaders().set(HttpHeaders.CACHE_CONTROL, "public, max-age=7776000, immutable");
        return service.makeImageResponse(exchange, id);
    }
}

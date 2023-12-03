package org.lowcoder.api.material;

import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.ASSET_URL, NewUrl.ASSET_URL})
public interface AssetEndpoints 
{
	public static final String TAG_ASSET_MANAGEMENT = "Image Assets APIs";
	
	@Operation(
			tags = TAG_ASSET_MANAGEMENT,
		    operationId = "getAsset",
		    summary = "Retrieve Image Asset",
		    description = "Retrieve an image asset within Lowcoder using its unique ID, which can be used for various purposes such as displaying images in applications."
	)
    @GetMapping("/{id}")
    public Mono<Void> getById(@PathVariable String id, ServerWebExchange exchange);
}

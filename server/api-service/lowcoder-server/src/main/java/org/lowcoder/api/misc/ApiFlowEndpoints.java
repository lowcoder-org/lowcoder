package org.lowcoder.api.misc;

import io.swagger.v3.oas.annotations.Hidden;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping(value = {Url.FLOW_URL, NewUrl.FLOW_URL})
public interface ApiFlowEndpoints
{
	@Hidden
    @PostMapping
	Mono<String> flow(@RequestBody FlowRequest flowRequest);
	public record FlowRequest(String path,
							  String method,
							  Map<String, Object> data,
							  Map<String, String> headers) {
	}
}

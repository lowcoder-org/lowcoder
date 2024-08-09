package org.lowcoder.api.misc;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.annotation.Nullable;
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
	String TAG_SERVER_SETTING_MANAGEMENT = "Flow APIs";
	
	@Operation(
			tags = TAG_SERVER_SETTING_MANAGEMENT,
		    operationId = "flow",
		    summary = "Call flow api",
		    description = "Call flow api."
	)
    @PostMapping
	Mono<String> flow(@RequestBody FlowRequest flowRequest);
	public record FlowRequest(String path,
							  String method,
							  Map<String, Object> data,
							  Map<String, String> headers) {
	}
}

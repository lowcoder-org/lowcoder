package org.lowcoder.api.config;

import io.swagger.v3.oas.annotations.Operation;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping(value = {Url.SERVER_SETTING_URL, NewUrl.SERVER_SETTING_URL})
public interface ServerSettingEndpoints
{
	String TAG_SERVER_SETTING_MANAGEMENT = "Server Setting APIs";
	
	@Operation(
			tags = TAG_SERVER_SETTING_MANAGEMENT,
		    operationId = "serverSettings",
		    summary = "Get Lowcoder server settings",
		    description = "Retrieve the list of server settings for Lowcoder."
	)
    @GetMapping
	Mono<Map<String, String>> getServerSettings();
}

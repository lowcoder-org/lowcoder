package org.lowcoder.api.config;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.SerializeConfig.JsonViews;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.annotation.JsonView;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.CONFIG_URL, NewUrl.CONFIG_URL})
public interface ConfigEndpoints 
{
	public static final String TAG_CONFIGURATION_MANAGEMENT = "Configuration APIs";
	
	@Operation(
			tags = TAG_CONFIGURATION_MANAGEMENT,
		    operationId = "getDeploymentId",
		    summary = "Get Lowcoder deployment ID",
		    description = "Retrieve the unique deployment ID for Lowcoder. (not available on public cloud)"			
	)
    @GetMapping(value = "/deploymentId")
    public Mono<String> getDeploymentId();

	@Operation(
			tags = TAG_CONFIGURATION_MANAGEMENT,
		    operationId = "getConfigurationEntry",
		    summary = "Get Configuration for key",
		    description = "Retrieve a specific Configuration entry within Lowcoder identified by its key and the current Organization / Workspace by the impersonated User."
	)
    @GetMapping("/{key}")
    public Mono<ResponseView<ServerConfig>> getServerConfig(@PathVariable String key);

	@Operation(
			tags = TAG_CONFIGURATION_MANAGEMENT,
		    operationId = "createConfigurationEntry",
		    summary = "Create Configuration entry",
		    description = "Create a new Configuration entry within Lowcoder and the current Organization / Workspace by the impersonated User for managing various settings and configurations. (not available on public cloud)"
	)
    @PostMapping("/{key}")
    public Mono<ResponseView<ServerConfig>> updateServerConfig(@PathVariable String key, @RequestBody UpdateConfigRequest updateConfigRequest);

	@Operation(
			tags = TAG_CONFIGURATION_MANAGEMENT,
		    operationId = "listConfigs",
		    summary = "Get Configurations",
		    description = "Retrieve a list of configuration entries within Lowcoder based on the current Organization / Workspace by the impersonated User, providing an overview of available configurations."
	)
    @JsonView(JsonViews.Public.class)
    @GetMapping
    public Mono<ResponseView<ConfigView>> getConfig(ServerWebExchange exchange,@RequestParam(required = false) String orgId);

    public record UpdateConfigRequest(String value) {
    }
}

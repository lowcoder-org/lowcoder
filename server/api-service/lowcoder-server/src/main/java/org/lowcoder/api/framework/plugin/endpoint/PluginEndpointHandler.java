package org.lowcoder.api.framework.plugin.endpoint;

import java.util.List;

import org.lowcoder.plugin.api.PluginEndpoint;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

public interface PluginEndpointHandler 
{
	public static final String PLUGINS_BASE_URL = "/api/plugins/";
	
	void registerEndpoints(String urlPrefix, List<PluginEndpoint> endpoints);
	List<RouterFunction<ServerResponse>> registeredEndpoints();
}

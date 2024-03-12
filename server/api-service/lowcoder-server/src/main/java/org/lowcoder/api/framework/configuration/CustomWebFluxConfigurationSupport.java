package org.lowcoder.api.framework.configuration;

import org.lowcoder.api.framework.plugin.endpoint.ReloadableRouterFunctionMapping;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.WebFluxConfigurationSupport;
import org.springframework.web.reactive.function.server.support.RouterFunctionMapping;

@Configuration
public class CustomWebFluxConfigurationSupport extends WebFluxConfigurationSupport
{
	@Override
	protected RouterFunctionMapping createRouterFunctionMapping() 
	{
		return new ReloadableRouterFunctionMapping();
	}
}

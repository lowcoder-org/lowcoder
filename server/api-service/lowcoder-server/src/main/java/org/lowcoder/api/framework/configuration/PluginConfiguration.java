package org.lowcoder.api.framework.configuration;

import java.util.ArrayList;

import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.plugin.PluginLoader;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.web.reactive.function.server.RequestPredicates;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Configuration
public class PluginConfiguration
{
	private final ApplicationContext applicationContext;
	private final PluginLoader pluginLoader;

	public LowcoderPluginManager lowcoderPluginManager()
	{
		return new LowcoderPluginManager(applicationContext, pluginLoader);
	}

    @SuppressWarnings("unchecked")
    @Bean
    @DependsOn("lowcoderPluginManager")
    RouterFunction<?> pluginEndpoints(LowcoderPluginManager pluginManager) 
    {
        RouterFunction<?> pluginsList = RouterFunctions.route()
        		.GET(RequestPredicates.path("/plugins"), req -> ServerResponse.ok().body(Mono.just(pluginManager.getLoadedPluginsInfo()), ArrayList.class))
        		.build();
        
        RouterFunction<?> endpoints = pluginManager.getEndpoints().stream()
        		.map(r-> (RouterFunction<ServerResponse>)r)
                .reduce((o, r )-> (RouterFunction<ServerResponse>) o.andOther(r))
                .orElse(null);
        
        return (endpoints == null) ? pluginsList : pluginsList.andOther(endpoints);
    }
}

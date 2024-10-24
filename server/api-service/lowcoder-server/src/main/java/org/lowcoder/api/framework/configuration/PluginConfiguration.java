package org.lowcoder.api.framework.configuration;

import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.web.reactive.function.server.RequestPredicates;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.ArrayList;

@Configuration
public class PluginConfiguration
{

    @SuppressWarnings("unchecked")
    @Bean
    @DependsOn("lowcoderPluginManager")
    RouterFunction<?> pluginEndpoints(LowcoderPluginManager pluginManager, PluginEndpointHandler pluginEndpointHandler) 
    {
        RouterFunction<?> pluginsList = RouterFunctions.route()
        		.GET(RequestPredicates.path(PluginEndpointHandler.PLUGINS_BASE_URL), req -> ServerResponse.ok().body(Mono.just(pluginManager.getLoadedPluginsInfo()), ArrayList.class))
        		.build();
        
        RouterFunction<?> endpoints = pluginEndpointHandler.registeredEndpoints().stream()
        		.map(r-> (RouterFunction<ServerResponse>)r)
                .reduce((o, r )-> (RouterFunction<ServerResponse>) o.andOther(r))
                .orElse(null);
        
        return (endpoints == null) ? pluginsList : pluginsList.andOther(endpoints);
    }
}

package org.lowcoder.api.framework.configuration;

import java.util.ArrayList;

import org.aopalliance.aop.Advice;
import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
import org.lowcoder.api.framework.plugin.security.PluginAuthorizationManager;
import org.lowcoder.plugin.api.EndpointExtension;
import org.springframework.aop.support.annotation.AnnotationMatchingPointcut;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Role;
import org.springframework.security.authorization.method.AuthorizationManagerBeforeReactiveMethodInterceptor;
import org.springframework.web.reactive.function.server.RequestPredicates;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import reactor.core.publisher.Mono;

@Configuration
public class PluginConfiguration
{

    @SuppressWarnings("unchecked")
    @Bean
    @DependsOn("lowcoderPluginManager")
    RouterFunction<?> pluginEndpoints(LowcoderPluginManager pluginManager, PluginEndpointHandler pluginEndpointHandler) 
    {
        RouterFunction<?> pluginsList = RouterFunctions.route()
        		.GET(RequestPredicates.path("/plugins"), req -> ServerResponse.ok().body(Mono.just(pluginManager.getLoadedPluginsInfo()), ArrayList.class))
        		.build();
        
        RouterFunction<?> endpoints = pluginEndpointHandler.registeredEndpoints().stream()
        		.map(r-> (RouterFunction<ServerResponse>)r)
                .reduce((o, r )-> (RouterFunction<ServerResponse>) o.andOther(r))
                .orElse(null);
        
        return (endpoints == null) ? pluginsList : pluginsList.andOther(endpoints);
    }
    
    
    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    static Advice protectPluginEndpoints(PluginAuthorizationManager pluginAauthManager)
    {
    	AnnotationMatchingPointcut pointcut = new AnnotationMatchingPointcut(EndpointExtension.class, true);    	
    	return new AuthorizationManagerBeforeReactiveMethodInterceptor(pointcut, pluginAauthManager);
    }
    
    

}

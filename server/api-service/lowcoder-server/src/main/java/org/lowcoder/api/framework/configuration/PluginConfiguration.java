package org.lowcoder.api.framework.configuration;

import java.util.ArrayList;

import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
// Falk: eventually not needed
import org.lowcoder.api.framework.plugin.security.PluginAuthorizationManager;
import org.lowcoder.plugin.api.EndpointExtension;
import org.springframework.aop.Advisor;
import org.springframework.aop.support.annotation.AnnotationMatchingPointcut;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Role;
import org.springframework.security.authorization.method.AuthorizationInterceptorsOrder;
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
        		.GET(RequestPredicates.path(PluginEndpointHandler.PLUGINS_BASE_URL), req -> ServerResponse.ok().body(Mono.just(pluginManager.getLoadedPluginsInfo()), ArrayList.class))
        		.build();
        
        RouterFunction<?> endpoints = pluginEndpointHandler.registeredEndpoints().stream()
        		.map(r-> (RouterFunction<ServerResponse>)r)
                .reduce((o, r )-> (RouterFunction<ServerResponse>) o.andOther(r))
                .orElse(null);
        
        return (endpoints == null) ? pluginsList : pluginsList.andOther(endpoints);
    }
    
    // Falk: eventually not needed
    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    Advisor protectPluginEndpoints(PluginAuthorizationManager pluginAauthManager)
    {
    	AnnotationMatchingPointcut pointcut = new AnnotationMatchingPointcut(EndpointExtension.class, true);
    	AuthorizationManagerBeforeReactiveMethodInterceptor interceptor = new AuthorizationManagerBeforeReactiveMethodInterceptor(pointcut, pluginAauthManager);
    	interceptor.setOrder(AuthorizationInterceptorsOrder.PRE_AUTHORIZE.getOrder() -1);
    	return interceptor;
    }
}

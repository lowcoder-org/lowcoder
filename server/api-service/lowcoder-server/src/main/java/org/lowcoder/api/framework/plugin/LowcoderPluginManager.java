package org.lowcoder.api.framework.plugin;

import static org.springframework.web.reactive.function.server.RequestPredicates.DELETE;
import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RequestPredicates.OPTIONS;
import static org.springframework.web.reactive.function.server.RequestPredicates.PATCH;
import static org.springframework.web.reactive.function.server.RequestPredicates.POST;
import static org.springframework.web.reactive.function.server.RequestPredicates.PUT;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.framework.plugin.data.PluginServerRequest;
import org.lowcoder.plugin.api.EndpointExtension;
import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.lowcoder.plugin.api.data.EndpointRequest;
import org.lowcoder.plugin.api.data.EndpointResponse;
import org.lowcoder.sdk.exception.BaseException;
import org.springframework.core.ResolvableType;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RequestPredicate;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.reactive.function.server.ServerResponse.BodyBuilder;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
@Slf4j
public class LowcoderPluginManager
{
	private final LowcoderServices lowcoderServices;
	private final PluginLoader pluginLoader;	
	
	private Map<String, LowcoderPlugin> plugins = new LinkedHashMap<>();
	private List<RouterFunction<ServerResponse>> routes = new ArrayList<>();

	@PostConstruct
	private void loadPlugins()
	{
		registerPlugins();
		List<LowcoderPlugin> sorted = new ArrayList<>(plugins.values());
		sorted.sort(Comparator.comparing(LowcoderPlugin::loadOrder));
		
		for (LowcoderPlugin plugin : sorted)
		{
			if (plugin.load(lowcoderServices))
			{
				log.info("Plugin [{}] loaded successfully.", plugin.pluginId());
				registerEndpoints(plugin);
			}
		}
	}

	@PreDestroy
	public void unloadPlugins()
	{
		for (LowcoderPlugin plugin : plugins.values())
		{
			try
			{
				plugin.unload();
			}
			catch(Throwable cause)
			{
				log.warn("Error unloading plugin: {}!", plugin.pluginId(), cause);
			}
		}
	}
	
	public List<RouterFunction<ServerResponse>> getEndpoints()
	{
		return this.routes;
	}
	
	public List<PluginInfo> getLoadedPluginsInfo()
	{
		List<PluginInfo> infos = new ArrayList<>();
		for (LowcoderPlugin plugin : plugins.values())
		{
			infos.add(new PluginInfo(plugin.pluginId(), plugin.description(), plugin.pluginInfo()));
		}
		return infos;
	}
	
	private void registerPlugins()
	{
		List<LowcoderPlugin> loaded = pluginLoader.loadPlugins();
		if (CollectionUtils.isNotEmpty(loaded))
		{
			for (LowcoderPlugin plugin : loaded)
			{
				if (!plugins.containsKey(plugin.pluginId()))
				{
					log.info("Registered plugin: {}  ({})", plugin.pluginId(), plugin.getClass().getName());
					plugins.put(plugin.pluginId(), plugin);
				}
				else
				{
					log.warn("Plugin {} already registered (from: {}), skipping {}.", plugin.pluginId(),
							plugins.get(plugin.pluginId()).getClass().getName(),
							plugin.getClass().getName());
				}
			}
		}		
	}
	
	
	private void registerEndpoints(LowcoderPlugin plugin)
	{		
		if (CollectionUtils.isNotEmpty(plugin.endpoints()))
		{
			for (PluginEndpoint endpoint : plugin.endpoints())
			{
				Method[] handlers = endpoint.getClass().getDeclaredMethods();
				if (handlers != null && handlers.length > 0)
				{
					for (Method handler : handlers)
					{
						registerEndpointHandler(plugin, endpoint, handler);
					}
				}
			}			
		}
	}

	private void registerEndpointHandler(LowcoderPlugin plugin, PluginEndpoint endpoint, Method handler)
	{
		if (handler.isAnnotationPresent(EndpointExtension.class))
		{
			if (checkHandlerMethod(handler))
			{
				
				EndpointExtension endpointMeta = handler.getAnnotation(EndpointExtension.class);
				routes.add(route(createRequestPredicate(plugin, endpointMeta), req -> {
						Mono<ServerResponse> result = null;
						try
						{
							EndpointResponse response = (EndpointResponse)handler.invoke(endpoint, PluginServerRequest.fromServerRequest(req));
							result = createServerResponse(response);
						}
						catch (IllegalAccessException | InvocationTargetException cause) 
						{
							throw new BaseException("Error running handler for [ " + endpointMeta.method() + ": " + endpointMeta.uri() + "] !");
						}
						return result; 
					})
				);
				log.info("Registered plugin endpoint: {} -> {} -> {}: {}", plugin.pluginId(), endpoint.getClass().getSimpleName(), endpointMeta.method(), endpointMeta.uri());
			}
			else
			{
				log.error("Cannot register plugin endpoint: {} -> {} -> {}! Handler method must be defined as: public Mono<ServerResponse> {}(ServerRequest request)", plugin.pluginId(), endpoint.getClass().getSimpleName(), handler.getName(), handler.getName());
			}
		}
	}
	
	private Mono<ServerResponse> createServerResponse(EndpointResponse pluginResponse)
	{
		/** Create response with given status **/
		BodyBuilder builder = ServerResponse.status(pluginResponse.statusCode());

		/** Set response headers **/
		if (pluginResponse.headers() != null && !pluginResponse.headers().isEmpty())
		{
			pluginResponse.headers().entrySet()
				.forEach(entry -> {
					builder.header(entry.getKey(), entry.getValue().toArray(new String[] {}));
				});
			
		}
		
		/** Set cookies if available **/
		if (pluginResponse.cookies() != null && !pluginResponse.cookies().isEmpty())
		{
			pluginResponse.cookies().values()
				.forEach(cookies -> {
					cookies.forEach(cookie -> {
						builder.cookie(ResponseCookie.from(cookie.getKey(), cookie.getValue()).build());
					});
					
				});
		}
		
		/** Set response body if available **/
		if (pluginResponse.body() != null)
		{
			return builder.bodyValue(pluginResponse.body());
		}

		return builder.build();
	}
	
	private boolean checkHandlerMethod(Method method)
	{
		ResolvableType returnType = ResolvableType.forMethodReturnType(method);

		return (returnType.getRawClass().isAssignableFrom(EndpointResponse.class)
					&& method.getParameterCount() == 1
					&& method.getParameterTypes()[0].isAssignableFrom(EndpointRequest.class)
		);
	}
	
	private RequestPredicate createRequestPredicate(LowcoderPlugin plugin, EndpointExtension endpoint)
	{
		String basePath = "/plugins/" + plugin.pluginId();
		
		switch(endpoint.method())
		{
			case GET:
				return GET(pluginEndpointUri(basePath, endpoint.uri()));
			case POST:
				return POST(pluginEndpointUri(basePath, endpoint.uri()));
			case PUT:
				return PUT(pluginEndpointUri(basePath, endpoint.uri()));
			case PATCH:
				return PATCH(pluginEndpointUri(basePath, endpoint.uri()));
			case DELETE:
				return DELETE(pluginEndpointUri(basePath, endpoint.uri()));
			case OPTIONS:
				return OPTIONS(pluginEndpointUri(basePath, endpoint.uri()));
		}
		return null;
	}

	private String pluginEndpointUri(String basePath, String uri)
	{
		return StringUtils.join(basePath, StringUtils.prependIfMissing(uri, "/"));
	}
	
	
	private record PluginInfo(
		String id,
		String description,
		Object info
	) {}
	
}

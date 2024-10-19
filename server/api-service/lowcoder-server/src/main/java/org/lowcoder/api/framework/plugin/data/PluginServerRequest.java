package org.lowcoder.api.framework.plugin.data;

import org.lowcoder.plugin.api.PluginEndpoint;
import org.lowcoder.plugin.api.PluginEndpoint.Method;
import org.lowcoder.plugin.api.data.EndpointRequest;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.server.ServerRequest;

import java.net.URI;
import java.security.Principal;
import java.util.AbstractMap.SimpleEntry;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;

public class PluginServerRequest implements EndpointRequest 
{
	private URI uri;
	private PluginEndpoint.Method method;
	private CompletableFuture<byte[]> body;
	private Map<String, List<String>> headers;
	private Map<String, List<Map.Entry<String, String>>> cookies;
	private Map<String, Object> attributes;
	private Map<String, String> pathVariables;

	private Map<String, List<String>> queryParams;
	private CompletableFuture<? extends Principal> principal;


	public PluginServerRequest()
	{
		headers = new HashMap<>();
		cookies = new HashMap<>();
		attributes = new HashMap<>();
		pathVariables = new HashMap<>();
		queryParams = new HashMap<>();
	}
	
	public static PluginServerRequest fromServerRequest(ServerRequest request)
	{
		PluginServerRequest psr = new PluginServerRequest();
		
		psr.uri = request.uri();
		psr.method = fromHttpMetod(request.method());		
		psr.body = request.bodyToMono(byte[].class).toFuture();
		
		if (request.headers() != null)
		{
			HttpHeaders httpHeaders = request.headers().asHttpHeaders();
			psr.headers = httpHeaders;
		}
		
		if (request.cookies() != null)
		{
			request.cookies().entrySet().stream()
				.forEach(entry -> {
					psr.cookies.put(entry.getKey(), fromHttpCookieList(entry.getValue()));
				});
		}
		
		if (request.attributes() != null)
		{
			request.attributes().forEach((name, value) -> {
				psr.attributes.put(name, value);
			});
		}
		
		if (request.pathVariables() != null)
		{
			request.pathVariables().entrySet()
				.forEach(entry -> {
					psr.pathVariables.put(entry.getKey(), entry.getValue());
				});
		}

		if (request.queryParams() != null)
		{
			request.queryParams().entrySet()
					.forEach(entry -> {
						psr.queryParams.put(entry.getKey(), entry.getValue());
					});
		}
		
		psr.principal =  request.principal().toFuture();
		
		return psr;
	}
	
	private static List<Map.Entry<String, String>> fromHttpCookieList(List<HttpCookie> cookies)
	{
		List<Map.Entry<String, String>> list = new LinkedList<>();
		
		if (cookies != null)
		{
			cookies.stream()
				.forEach(cookie -> {
					list.add(new SimpleEntry<String, String>(cookie.getName(), cookie.getValue()));
				});
		}
		
		return list;
	}
	
	
	
	@Override
	public URI uri() {
		return uri;
	}
	@Override
	public Method method() {
		return method;
	}
	@Override
	public CompletableFuture<byte[]> body() {
		return body;
	}
	@Override
	public Map<String, List<String>> headers() {
		return headers;
	}
	@Override
	public Map<String, List<Entry<String, String>>> cookies() {
		return cookies;
	}
	@Override
	public Map<String, Object> attributes() {
		return attributes;
	}
	@Override
	public Map<String, String> pathVariables() {
		return pathVariables;
	}

	@Override
	public Map<String, List<String>> queryParams() {
		return queryParams;
	}
	@Override
	public CompletableFuture<? extends Principal> principal() {
		return principal;
	}
	
	
	public static HttpMethod fromPluginEndpointMethod(PluginEndpoint.Method method)
	{
		switch(method)
		{
			case GET:
				return HttpMethod.GET;
			case POST:
				return HttpMethod.POST;
			case PUT:
				return HttpMethod.PUT;
			case PATCH:
				return HttpMethod.PATCH;
			case DELETE:
				return HttpMethod.DELETE;
			case OPTIONS:
				return HttpMethod.OPTIONS;
		}		
		return null;
	}
	
	public static PluginEndpoint.Method fromHttpMetod(HttpMethod method)
	{
		if (method == HttpMethod.GET)
		{
			return PluginEndpoint.Method.GET;
		}
		else if (method == HttpMethod.POST)
		{
			return PluginEndpoint.Method.POST;
		}
		else if (method == HttpMethod.PUT)
		{
			return PluginEndpoint.Method.PUT;
		}
		else if (method == HttpMethod.PATCH)
		{
			return PluginEndpoint.Method.PATCH;
		}
		else if (method == HttpMethod.DELETE)
		{
			return PluginEndpoint.Method.DELETE;
		}
		else if (method == HttpMethod.OPTIONS)
		{
			return PluginEndpoint.Method.OPTIONS;
		}
		return null;
	}
}

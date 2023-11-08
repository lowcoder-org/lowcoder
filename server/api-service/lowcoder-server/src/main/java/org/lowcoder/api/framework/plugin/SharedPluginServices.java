package org.lowcoder.api.framework.plugin;

import java.util.LinkedList;
import java.util.List;
import java.util.function.Consumer;

import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.plugin.api.LowcoderServices;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.lowcoder.plugin.api.event.LowcoderEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Component
public class SharedPluginServices implements LowcoderServices
{
	private final PluginEndpointHandler pluginEndpointHandler;

	@Autowired
	private ServerConfigRepository serverConfigRepository;
	
	private List<Consumer<LowcoderEvent>> eventListeners = new LinkedList<>();

	@Override
	public void registerEventListener(Consumer<LowcoderEvent> listener) 
	{
		this.eventListeners.add(listener);
	}

	@EventListener(classes = LowcoderEvent.class)
	private void publishEvents(LowcoderEvent event)
	{
		for (Consumer<LowcoderEvent> listener : eventListeners)
		{
			listener.accept(event);
		}
	}

	@Override
	public void registerEndpoints(String urlPrefix, List<PluginEndpoint> endpoints) 
	{
		pluginEndpointHandler.registerEndpoints(urlPrefix, endpoints);
	}

	@Override
	public void setConfig(String key, Object value) {
		serverConfigRepository.upsert(key, value).block();
	}

	@Override
	public Object getConfig(String key) {
		return serverConfigRepository.findByKey(key).block();
	}
}

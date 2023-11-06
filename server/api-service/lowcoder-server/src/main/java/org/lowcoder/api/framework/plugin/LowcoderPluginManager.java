package org.lowcoder.api.framework.plugin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Component
@Slf4j
public class LowcoderPluginManager
{
	private final LowcoderServices lowcoderServices;
	private final PluginLoader pluginLoader;	
	
	private Map<String, LowcoderPlugin> plugins = new LinkedHashMap<>();

	@PostConstruct
	private void loadPlugins()
	{
		registerPlugins();
		List<LowcoderPlugin> sorted = new ArrayList<>(plugins.values());
		sorted.sort(Comparator.comparing(LowcoderPlugin::loadOrder));
		
		for (LowcoderPlugin plugin : sorted)
		{
			PluginExecutor executor = new PluginExecutor(plugin, lowcoderServices);
			executor.start();
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
	
	private record PluginInfo(
		String id,
		String description,
		Object info
	) {}
	
}

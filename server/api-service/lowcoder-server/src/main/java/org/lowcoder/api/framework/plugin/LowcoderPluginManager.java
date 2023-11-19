package org.lowcoder.api.framework.plugin;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;
import org.springframework.core.env.AbstractEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.Environment;
import org.springframework.core.env.MutablePropertySources;
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
	private final Environment environment;
	
	private Map<String, LowcoderPlugin> plugins = new LinkedHashMap<>();

	@PostConstruct
	private void loadPlugins()
	{
		registerPlugins();
		List<LowcoderPlugin> sorted = new ArrayList<>(plugins.values());
		sorted.sort(Comparator.comparing(LowcoderPlugin::loadOrder));
		
		for (LowcoderPlugin plugin : sorted)
		{
			PluginExecutor executor = new PluginExecutor(plugin, getPluginEnvironmentVariables(plugin), lowcoderServices);
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
	
	private Map<String, Object> getPluginEnvironmentVariables(LowcoderPlugin plugin)
	{
		Map<String, Object> env = new HashMap<>();
		
		String varPrefix = "PLUGIN_" + plugin.pluginId().toUpperCase().replaceAll("-", "_") + "_";
		MutablePropertySources propertySources = ((AbstractEnvironment) environment).getPropertySources();
        List<String> properties = StreamSupport.stream(propertySources.spliterator(), false)
                .filter(propertySource -> propertySource instanceof EnumerablePropertySource)
                .map(propertySource -> ((EnumerablePropertySource<?>) propertySource).getPropertyNames())
                .flatMap(Arrays::<String> stream)
                .distinct()
                .sorted()
                .filter(prop -> prop.startsWith(varPrefix))
                .collect(Collectors.toList());
        
        for (String prop : properties)
        {
        	env.put(StringUtils.removeStart(prop, varPrefix), environment.getProperty(prop));
        }
        
		return env;
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

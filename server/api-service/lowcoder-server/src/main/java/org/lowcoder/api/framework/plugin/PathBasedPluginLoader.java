package org.lowcoder.api.framework.plugin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.ServiceLoader;

@Slf4j
@RequiredArgsConstructor
@Component
public class PathBasedPluginLoader implements PluginLoader 
{
	private final CommonConfig common;
	private final ApplicationHome applicationHome;
	
	@Override
	public List<LowcoderPlugin> loadPlugins() 
	{
		List<LowcoderPlugin> plugins = new ArrayList<>();
		
		List<String> pluginJars = findPluginsJars();
		if (pluginJars.isEmpty())
		{
			return plugins;
		}

		for (String pluginJar : pluginJars)
		{
			log.debug("Inspecting plugin jar candidate: {}", pluginJar);
			List<LowcoderPlugin> loadedPlugins = loadPluginCandidates(pluginJar);
			if (loadedPlugins.isEmpty())
			{
				log.debug("   - no plugins found in the jar file");
			}
			else
			{
				for (LowcoderPlugin plugin : loadedPlugins)
				{
					plugins.add(plugin);
				}				
			}
		}
		
		return plugins;
	}
	
	protected List<String> findPluginsJars() 
	{
		List<String> candidates = new ArrayList<>();
		if (CollectionUtils.isNotEmpty(common.getPluginDirs()))
		{
			for (String pluginDir : common.getPluginDirs())
			{
				final Path pluginPath = getAbsoluteNormalizedPath(pluginDir);
				if (pluginPath != null)
				{
					candidates.addAll(findPluginCandidates(pluginPath));
				}
			}
		}
		
		return candidates;
	}

	
	protected List<String> findPluginCandidates(Path pluginsDir)
	{
		List<String> pluginCandidates = new ArrayList<>();
		try
		{
			Files.walk(pluginsDir)
		        .filter(Files::isRegularFile)
		        .filter(path -> StringUtils.endsWithIgnoreCase(path.toAbsolutePath().toString(), ".jar"))
		        .forEach(path -> pluginCandidates.add(path.toString()));
		}
		catch(IOException cause)
		{
			log.error("Error walking plugin folder! - {}", cause.getMessage());
		}
		
		return pluginCandidates;
	}
	
	protected List<LowcoderPlugin> loadPluginCandidates(String pluginJar)
	{
		List<LowcoderPlugin> pluginCandidates = new ArrayList<>();

		try
		{
			Path pluginPath = Path.of(pluginJar);
			PluginClassLoader pluginClassLoader = new PluginClassLoader(pluginPath.getFileName().toString(), pluginPath);

			ServiceLoader<LowcoderPlugin> pluginServices = ServiceLoader.load(LowcoderPlugin.class, pluginClassLoader);
			if (pluginServices != null )
			{
				Iterator<LowcoderPlugin> pluginIterator = pluginServices.iterator();
				while(pluginIterator.hasNext())
				{
					LowcoderPlugin plugin = pluginIterator.next();
					log.debug("      - loaded plugin: {} - {}", plugin.pluginId(), plugin.description());
					pluginCandidates.add(plugin);
				}
			}
		}
		catch(Throwable cause)
		{
			log.warn("Error loading plugin!", cause);
		}
		
		return pluginCandidates;
	}
	
	private Path getAbsoluteNormalizedPath(String path)
	{
		if (StringUtils.isNotBlank(path))
		{
			Path absPath = Path.of(path);
			if (!absPath.isAbsolute())
			{
				absPath = Path.of(applicationHome.getDir().getAbsolutePath(), absPath.toString());
			}
			return absPath.normalize().toAbsolutePath();
		}
		
		return null;
	}
}

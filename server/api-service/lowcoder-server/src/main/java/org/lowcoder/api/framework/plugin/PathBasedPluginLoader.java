package org.lowcoder.api.framework.plugin;

import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.LowcoderPlugin;
import org.lowcoder.sdk.config.CommonConfig;
import org.reflections.Reflections;
import org.reflections.scanners.SubTypesScanner;
import org.reflections.scanners.TypeAnnotationsScanner;
import org.reflections.util.ClasspathHelper;
import org.reflections.util.ConfigurationBuilder;
import org.springframework.beans.factory.BeanClassLoaderAware;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@Component
public class PathBasedPluginLoader implements PluginLoader, BeanClassLoaderAware 
{
	private final CommonConfig common;
	private final ApplicationHome applicationHome;

	private ClassLoader beanClassLoader;
	
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
					log.debug("   - loaded plugin: {}  ::  {}", plugin.pluginId(), plugin.description());
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
	
	protected List<LowcoderPlugin> loadPluginCandidates(String pluginsDir)
	{
		List<LowcoderPlugin> pluginCandidates = new ArrayList<>();
		
		URLClassLoader testClassLoader = null;
		
		try
		{
			testClassLoader = URLClassLoader.newInstance(new URL[] {
					Path.of(pluginsDir).toUri().toURL()
			}, beanClassLoader);

			Reflections reflections = new Reflections(new ConfigurationBuilder()
					.addClassLoader(testClassLoader)
					.addUrls(ClasspathHelper.forClassLoader(testClassLoader))
				    .setScanners(new SubTypesScanner(false), new TypeAnnotationsScanner())
			);

			Set<Class<? extends LowcoderPlugin>> found = reflections.getSubTypesOf(LowcoderPlugin.class);
			for (Class<? extends LowcoderPlugin> pluginClass : found)
			{
				log.debug("      - found plugin: {}", pluginClass.getName());
				try
				{
					LowcoderPlugin plugin = pluginClass.getConstructor().newInstance();
					log.debug("      - loaded plugin: {} - {}", plugin.pluginId(), plugin.description());
					pluginCandidates.add(plugin);
				}
				catch(Throwable loadFail)
				{
					log.error("    - error loading plugin: {}!", pluginClass.getName(), loadFail);
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


	@Override
	public void setBeanClassLoader(ClassLoader classLoader) 
	{
		this.beanClassLoader = classLoader;
	}
}

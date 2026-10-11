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
import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Component
public class PathBasedPluginLoader implements PluginLoader {
	private final CommonConfig common;
	private final ApplicationHome applicationHome;

	// Cache for plugin JAR paths to avoid redundant filesystem scans
	private static final Map<String, List<String>> cachedPluginJars = new HashMap<>();

	@Override
	public List<LowcoderPlugin> loadPlugins() {
		List<LowcoderPlugin> plugins = new ArrayList<>();

		// Find plugin JARs using caching
		List<String> pluginJars = findPluginsJars();
		if (pluginJars.isEmpty()) {
			log.debug("No plugin JARs found.");
			return plugins;
		}

		// Load plugins from JARs
		pluginJars.parallelStream().forEach(pluginJar -> {
			log.debug("Inspecting plugin jar candidate: {}", pluginJar);
			List<LowcoderPlugin> loadedPlugins = loadPluginCandidates(pluginJar);
			if (loadedPlugins.isEmpty()) {
				log.debug("   - no plugins found in the jar file");
			} else {
				synchronized (plugins) {
					plugins.addAll(loadedPlugins);
				}
			}
		});

		return plugins;
	}

	protected List<String> findPluginsJars() {
		String cacheKey = common.getPluginDirs().toString();

		// Use cached JAR paths if available
		if (cachedPluginJars.containsKey(cacheKey)) {
			log.debug("Using cached plugin jar candidates for key: {}", cacheKey);
			return cachedPluginJars.get(cacheKey);
		}

		List<String> candidates = new ArrayList<>();
		if (CollectionUtils.isNotEmpty(common.getPluginDirs())) {
			for (String pluginDir : common.getPluginDirs()) {
				final Path pluginPath = getAbsoluteNormalizedPath(pluginDir);
				if (pluginPath != null) {
					candidates.addAll(findPluginCandidates(pluginPath));
				}
			}
		}

		// Cache the results
		cachedPluginJars.put(cacheKey, candidates);
		return candidates;
	}

	protected List<String> findPluginCandidates(Path pluginsDir) {
		try {
			return Files.walk(pluginsDir)
					.filter(Files::isRegularFile)
					.filter(path -> StringUtils.endsWithIgnoreCase(path.toAbsolutePath().toString(), ".jar"))
					.map(Path::toString)
					.toList(); // Use Java 16+ `toList()` for better performance
		} catch (IOException cause) {
			log.error("Error walking plugin folder! - {}", cause.getMessage());
			return Collections.emptyList();
		}
	}

	protected List<LowcoderPlugin> loadPluginCandidates(String pluginJar) {
		List<LowcoderPlugin> pluginCandidates = new ArrayList<>();

		try {
			Path pluginPath = Path.of(pluginJar);
			PluginClassLoader pluginClassLoader = new PluginClassLoader(pluginPath.getFileName().toString(), pluginPath);

			ServiceLoader<LowcoderPlugin> pluginServices = ServiceLoader.load(LowcoderPlugin.class, pluginClassLoader);
			if (pluginServices != null) {
				for (LowcoderPlugin plugin : pluginServices) {
					log.debug("      - loaded plugin: {} - {}", plugin.pluginId(), plugin.description());
					pluginCandidates.add(plugin);
				}
			}
		} catch (Throwable cause) {
			log.warn("Error loading plugin!", cause);
		}

		return pluginCandidates;
	}

	private Path getAbsoluteNormalizedPath(String path) {
		if (StringUtils.isNotBlank(path)) {
			Path absPath = Path.of(path);
			if (!absPath.isAbsolute()) {
				absPath = Path.of(applicationHome.getDir().getAbsolutePath(), absPath.toString());
			}
			return absPath.normalize().toAbsolutePath();
		}
		return null;
	}
}
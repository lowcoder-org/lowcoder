package org.lowcoder.api.framework.plugin;

import java.util.List;

import org.lowcoder.plugin.LowcoderPlugin;

public interface PluginLoader 
{
	List<LowcoderPlugin> loadPlugins();
	
}

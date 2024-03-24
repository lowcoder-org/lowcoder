package org.lowcoder.api.framework.plugin;

import java.util.List;

import org.lowcoder.plugin.api.LowcoderPlugin;

public interface PluginLoader 
{
	List<LowcoderPlugin> loadPlugins();
	
}

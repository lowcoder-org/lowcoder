package org.lowcoder.api.framework.plugin;

import java.util.Map;

import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PluginExecutor extends Thread
{
	private Map<String, Object> env;
	private LowcoderPlugin plugin;
	private LowcoderServices services;
	
	public PluginExecutor(LowcoderPlugin plugin, Map<String, Object> env, LowcoderServices services)
	{
		this.env = env;
		this.plugin = plugin;
		this.services = services;
		this.setContextClassLoader(plugin.getClass().getClassLoader());
		this.setName(plugin.pluginId());
	}

	@Override
	public void run() 
	{
		if (plugin.load(env, services))
		{
			log.info("Plugin [{}] loaded and running.", plugin.pluginId());
		}
	}
	
	
}

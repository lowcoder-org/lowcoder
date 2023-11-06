package org.lowcoder.api.framework.plugin;

import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PluginExecutor extends Thread
{
	private LowcoderPlugin plugin;
	private LowcoderServices services;
	
	public PluginExecutor(LowcoderPlugin plugin, LowcoderServices services)
	{
		this.plugin = plugin;
		this.services = services;
		this.setContextClassLoader(plugin.getClass().getClassLoader());
		this.setName(plugin.pluginId());
	}

	@Override
	public void run() 
	{
		if (plugin.load(services))
		{
			log.info("Plugin [{}] loaded and running.", plugin.pluginId());
		}
	}
	
	
}

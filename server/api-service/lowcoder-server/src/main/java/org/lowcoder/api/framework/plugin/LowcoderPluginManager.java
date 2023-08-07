package org.lowcoder.api.framework.plugin;

import java.util.Map;

import org.lowcoder.plugin.LowcoderPlugin;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Component
@Slf4j
public class LowcoderPluginManager
{
	private final ConfigurableApplicationContext applicationContext;
	private final CommonConfig common;
	private final ApplicationHome applicationHome;
	
	private Map<String, LowcoderPlugin> plugins;
	
	
	@PostConstruct
	private void loadPlugins()
	{
		
	}
	
}

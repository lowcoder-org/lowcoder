package org.lowcoder.api.framework.configuration;

import org.lowcoder.api.ServerApplication;
import org.pf4j.spring.SpringPluginManager;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfiguration
{
	@Bean("applicationHome")
	public ApplicationHome applicatioHome()
	{
		return new ApplicationHome(ServerApplication.class);
	}

	@Bean
	public SpringPluginManager pluginManager()
	{
		return new SpringPluginManager();
	}
}

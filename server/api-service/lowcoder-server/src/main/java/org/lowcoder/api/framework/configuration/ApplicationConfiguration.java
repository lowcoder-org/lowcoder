package org.lowcoder.api.framework.configuration;

import jakarta.servlet.MultipartConfigElement;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.sdk.config.CommonConfig;
import org.pf4j.spring.SpringPluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

@Configuration
public class ApplicationConfiguration 
{
	@Autowired
	private CommonConfig common;  
	
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
	
	@Bean
	public MultipartConfigElement multipartConfigElement() 
	{
		MultipartConfigFactory factory = new MultipartConfigFactory();
		factory.setMaxRequestSize(DataSize.parse(common.getMaxUploadSize()));
		factory.setMaxFileSize(DataSize.parse(common.getMaxUploadSize()));
		return factory.createMultipartConfig();
	}
}

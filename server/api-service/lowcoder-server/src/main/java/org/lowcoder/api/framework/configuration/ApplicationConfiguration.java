package org.lowcoder.api.framework.configuration;

import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

import jakarta.servlet.MultipartConfigElement;

@Configuration
public class ApplicationConfiguration 
{
	@Autowired
	private CommonConfig common;  
	
	@Bean
	public MultipartConfigElement multipartConfigElement() 
	{
		MultipartConfigFactory factory = new MultipartConfigFactory();
		factory.setMaxRequestSize(DataSize.parse(common.getMaxUploadSize()));
		factory.setMaxFileSize(DataSize.parse(common.getMaxUploadSize()));
		return factory.createMultipartConfig();
	}
}

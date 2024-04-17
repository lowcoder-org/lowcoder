package org.lowcoder.api.framework.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.plugin.endpoint.ReloadableRouterFunctionMapping;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.config.WebFluxConfigurationSupport;
import org.springframework.web.reactive.function.server.support.RouterFunctionMapping;

@RequiredArgsConstructor
@Configuration
public class CustomWebFluxConfigurationSupport extends WebFluxConfigurationSupport
{
	private final ObjectMapper objectMapper;

	@Override
	protected RouterFunctionMapping createRouterFunctionMapping() 
	{
		return new ReloadableRouterFunctionMapping();
	}


	@Override
	protected void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
		configurer.defaultCodecs()
				.jackson2JsonDecoder(new Jackson2JsonDecoder(objectMapper));
		configurer.defaultCodecs()
				.jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper));
	}
}

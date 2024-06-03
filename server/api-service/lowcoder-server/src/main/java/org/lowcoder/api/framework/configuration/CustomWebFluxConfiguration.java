package org.lowcoder.api.framework.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.plugin.endpoint.ReloadableRouterFunctionMapping;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.util.unit.DataSize;
import org.springframework.web.reactive.config.DelegatingWebFluxConfiguration;
import org.springframework.web.reactive.function.server.support.RouterFunctionMapping;

@RequiredArgsConstructor
@Configuration
public class CustomWebFluxConfiguration extends DelegatingWebFluxConfiguration
{
	@Value("${spring.codec.max-in-memory-size:20MB}")
	private String codecMaxInMemorySize = "20MB";

	@Bean
	public ObjectMapper objectMapper() {
		return JsonUtils.getObjectMapper();
	}

	@Override
	protected RouterFunctionMapping createRouterFunctionMapping() 
	{
		return new ReloadableRouterFunctionMapping();
	}


	@Override
	protected void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
		configurer.defaultCodecs()
				.maxInMemorySize((int)DataSize.parse(codecMaxInMemorySize).toBytes());
		configurer.defaultCodecs()
				.jackson2JsonDecoder(new Jackson2JsonDecoder(objectMapper()));
		configurer.defaultCodecs()
				.jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper()));
	}

}

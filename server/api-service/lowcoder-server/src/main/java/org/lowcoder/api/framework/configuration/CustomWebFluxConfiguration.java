package org.lowcoder.api.framework.configuration;

import tools.jackson.databind.json.JsonMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.framework.plugin.endpoint.ReloadableRouterFunctionMapping;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.i18n.LocaleContext;
import org.springframework.context.i18n.SimpleLocaleContext;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.JacksonJsonDecoder;
import org.springframework.http.codec.json.JacksonJsonEncoder;
import org.springframework.util.unit.DataSize;
import org.springframework.web.reactive.config.DelegatingWebFluxConfiguration;
import org.springframework.web.reactive.function.server.support.RouterFunctionMapping;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.i18n.LocaleContextResolver;

import java.util.List;
import java.util.Locale;

@RequiredArgsConstructor
@Configuration
public class CustomWebFluxConfiguration extends DelegatingWebFluxConfiguration
{
	@Value("${spring.http.codecs.max-in-memory-size:${spring.codec.max-in-memory-size:20MB}}")
	private String codecMaxInMemorySize = "20MB";

	@Bean
	public JsonMapper objectMapper() {
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
				.jacksonJsonDecoder(new JacksonJsonDecoder(objectMapper()));
		configurer.defaultCodecs()
				.jacksonJsonEncoder(new JacksonJsonEncoder(objectMapper()));
	}

	@Bean
	public LocaleContextResolver localeContextResolver() {
		return new LocaleContextResolver() {
			@Override
			public LocaleContext resolveLocaleContext(ServerWebExchange exchange) {
				String defaultLocaleStr = "en_US";
				List<String> language = exchange.getRequest().getQueryParams().getOrDefault("lang", List.of(defaultLocaleStr));
				String localeStr = language.get(0);
				String[] parts = localeStr.split("_");
				if(parts.length == 2) {
					Locale locale = new Locale(parts[0], parts[1]);
					return new SimpleLocaleContext(locale);
				} else {
					String safeLocaleStr = StringUtils.defaultIfBlank(parts[0], defaultLocaleStr);
					Locale locale = new Locale(safeLocaleStr);
					return new SimpleLocaleContext(locale);
				}
			}

			@Override
			public void setLocaleContext(ServerWebExchange exchange, LocaleContext localeContext) {
				throw new UnsupportedOperationException("Cannot change HTTP accept header - use a different locale context resolution strategy");
			}
		};
	}

}

package org.lowcoder.sdk.config;

import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.config.DelegatingWebFluxConfiguration;

@Configuration
public class SerializeConfig extends DelegatingWebFluxConfiguration {

    @Bean
    public ObjectMapper objectMapper() {
        return JsonUtils.getObjectMapper();
    }

    @Override
    protected void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer.defaultCodecs().jackson2JsonEncoder(
                new Jackson2JsonEncoder(objectMapper())
        );

        configurer.defaultCodecs().jackson2JsonDecoder(
                new Jackson2JsonDecoder(objectMapper())
        );
    }

    public static class JsonViews {
        public static class Public {
        }

        public static class Internal {
        }
    }
}

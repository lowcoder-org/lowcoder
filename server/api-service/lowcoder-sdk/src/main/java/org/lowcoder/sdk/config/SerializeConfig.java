package org.lowcoder.sdk.config;

import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class SerializeConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return JsonUtils.getObjectMapper();
    }

    public static class JsonViews {
        public static class Public {
        }

        public static class Internal {
        }
    }
}

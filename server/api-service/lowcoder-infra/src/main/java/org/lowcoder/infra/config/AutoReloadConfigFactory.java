package org.lowcoder.infra.config;

import jakarta.annotation.Nullable;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.infra.localcache.ReloadableCache;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;

import static java.util.Collections.emptyMap;
import static java.util.stream.Collectors.toUnmodifiableMap;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Slf4j
@Component
class AutoReloadConfigFactory {

    @Autowired
    private ServerConfigRepository configRepository;

    private ReloadableCache<Map<String, Object>> allConfigs;

    @PostConstruct
    private void init() {
        allConfigs = ReloadableCache.<Map<String, Object>> newBuilder()
                .setFactory(() -> configRepository.findAll()
                        .filter(it -> it.getValue() != null)
                        .collectList()
                        .map(configs -> configs.stream().collect(toUnmodifiableMap(ServerConfig::getKey, ServerConfig::getValue))))
                .setInterval(Duration.ofSeconds(3))
                .setName("autoReloadConfCache")
                .build();
    }

    @Nullable
    public String getValue(String confKey) {
        Object result = allConfigs.getCachedOrDefault(emptyMap()).get(confKey);
        if (result == null) {
            return null;
        }

        return toJson(result);
    }
}

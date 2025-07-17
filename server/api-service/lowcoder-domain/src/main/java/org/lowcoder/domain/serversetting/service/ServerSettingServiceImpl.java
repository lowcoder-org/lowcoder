package org.lowcoder.domain.serversetting.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.serversetting.model.ServerSetting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.*;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;


@RequiredArgsConstructor
@Slf4j
@Service
public class ServerSettingServiceImpl implements ServerSettingService {

    private final Environment environment;
    private final ServerSettingRepository repository;

    private final List<String> EXCLUDED_KEYS = List.of("LOWCODER_MONGODB_EXPOSED",
    "LOWCODER_PUID",
    "LOWCODER_PGID",
    "LOWCODER_MONGODB_URL",
    "LOWCODER_REDIS_URL",
    "LOWCODER_DB_ENCRYPTION_PASSWORD",
    "LOWCODER_DB_ENCRYPTION_SALT",
    "LOWCODER_API_KEY_SECRET",
    "LOWCODER_ADMIN_SMTP_HOST",
    "LOWCODER_ADMIN_SMTP_PORT",
    "LOWCODER_ADMIN_SMTP_USERNAME",
    "LOWCODER_ADMIN_SMTP_PASSWORD",
    "LOWCODER_SUPERUSER_PASSWORD",
    "LOWCODER_SUPERUSER_USERNAME",
    "LOWCODER_NODE_SERVICE_SECRET",
    "LOWCODER_NODE_SERVICE_SECRET_SALT");

    @Override
    public Mono<Map<String, String>> getServerSettingsMap() {
        return repository.findAll().collectMap(ServerSetting::getKey, ServerSetting::getValue);
    }

    @PostConstruct
    public void saveEnvironmentVariables() {

        Map<String, String> defaults = getEnvironmentVariablesDefaults();

        Map<String, String> envVariables = new TreeMap<>(System.getenv().entrySet().stream()
                .filter(entry -> StringUtils.startsWith(entry.getKey(), "LOWCODER_"))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

        Map<String, String> merged = new TreeMap<>(defaults);
        merged.keySet().removeAll(envVariables.keySet());
        merged.putAll(envVariables);

        Flux.fromIterable(merged.keySet())
                .map(key -> {
                    String value = envVariables.getOrDefault(key, "");
                    if(EXCLUDED_KEYS.contains(key)) {
                        value = "stored on the server";
                    }
                    return ServerSetting.builder()
                            .key(key)
                            .value(value)
                            .build();
                })
                .flatMap(repository::save)
                .subscribe();
    }


    private Map<String, String> getEnvironmentVariablesDefaults() {
        Map<String, String> defaults = new HashMap<>();

        MutablePropertySources propertySources = ((AbstractEnvironment) environment).getPropertySources();
        StreamSupport.stream(propertySources.spliterator(), false)
            .filter(EnumerablePropertySource.class::isInstance)
            .map(EnumerablePropertySource.class::cast)
            .forEach(propertySource -> {
                String[] names = propertySource.getPropertyNames();
                if (names.length > 0) {
                    Arrays.stream(names).forEach(name -> {
                        String rawValue = Objects.toString(propertySource.getProperty(name), "");
                        if (rawValue != null && StringUtils.contains(rawValue, "${LOWCODER_")) {
                            String defaultValue = StringUtils.substringBetween(rawValue, "${", "}");
                            String[] keyValue = StringUtils.split(defaultValue, ":");
                            if (keyValue.length == 2 && !defaults.containsKey(keyValue[0])) {
                                defaults.put(keyValue[0], keyValue[1]);
                            }
                        }
                    });
                }
            });
        return defaults;
    }
}

package org.lowcoder.domain.serversetting.service;

import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.serversetting.model.ServerSetting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;


@Slf4j
@Service
public class ServerSettingServiceImpl implements ServerSettingService {
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
    "LOWCODER_SUPERADMIN_PASSWORD",
    "LOWCODER_SUPERADMIN_USERNAME",
    "LOWCODER_SUPERUSER_PASSWORD",
    "LOWCODER_SUPERUSER_USERNAME");

    @Autowired
    public ServerSettingServiceImpl(ServerSettingRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<Map<String, String>> getServerSettingsMap() {
        return repository.findAll().collectMap(ServerSetting::getKey, ServerSetting::getValue);
    }

    @PostConstruct
    public void saveEnvironmentVariables() {
        Map<String, String> envVariables = System.getenv();
        Flux.fromIterable(envVariables.keySet())
                .filter(key -> key.startsWith("LOWCODER_"))
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
}

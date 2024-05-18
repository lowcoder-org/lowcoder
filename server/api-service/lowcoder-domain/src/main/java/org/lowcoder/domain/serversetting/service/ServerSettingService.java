package org.lowcoder.domain.serversetting.service;

import reactor.core.publisher.Mono;

import java.util.Map;

public interface ServerSettingService {

    Mono<Map<String, String>> getServerSettingsMap();
}

package org.lowcoder.infra.config.repository;

import org.lowcoder.infra.config.model.ServerConfig;
import reactor.core.publisher.Mono;

interface CustomServerConfigRepository {

    Mono<ServerConfig> upsert(String key, Object value);
}

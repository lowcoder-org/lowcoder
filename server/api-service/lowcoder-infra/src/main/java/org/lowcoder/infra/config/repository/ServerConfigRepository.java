package org.lowcoder.infra.config.repository;

import org.lowcoder.infra.config.model.ServerConfig;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import com.google.common.annotations.VisibleForTesting;

import reactor.core.publisher.Mono;

@VisibleForTesting
public interface ServerConfigRepository extends ReactiveMongoRepository<ServerConfig, String>, CustomServerConfigRepository {

    Mono<ServerConfig> findByKey(String key);

}

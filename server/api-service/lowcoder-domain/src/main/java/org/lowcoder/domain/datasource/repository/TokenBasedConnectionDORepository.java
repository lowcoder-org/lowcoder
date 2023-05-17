package org.lowcoder.domain.datasource.repository;

import org.lowcoder.domain.datasource.model.TokenBasedConnectionDO;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import reactor.core.publisher.Mono;


public interface TokenBasedConnectionDORepository extends ReactiveMongoRepository<TokenBasedConnectionDO, String> {

    Mono<TokenBasedConnectionDO> findByDatasourceId(String datasourceId);
}

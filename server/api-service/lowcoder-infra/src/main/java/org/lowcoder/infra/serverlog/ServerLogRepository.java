package org.lowcoder.infra.serverlog;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Mono;

public interface ServerLogRepository extends ReactiveMongoRepository<ServerLog, String> {

    Mono<Long> countByOrgId(String orgId);

    Mono<Long> countByOrgIdAndCreateTimeBetween(String orgId, Long startMonthEpoch, Long endMonthEpoch);

}


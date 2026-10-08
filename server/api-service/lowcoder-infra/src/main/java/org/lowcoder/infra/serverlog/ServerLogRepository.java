package org.lowcoder.infra.serverlog;

import org.springframework.data.domain.Range;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Mono;

public interface ServerLogRepository extends ReactiveMongoRepository<ServerLog, String> {

    Mono<Long> countByOrgId(String orgId);

    /**
     * The org's logs whose {@code createTime} (epoch milliseconds) is in {@code createTime}, each bound inclusive or
     * exclusive as the range says (two plain values would make both exclusive: {@code $gt} and {@code $lt}).
     */
    Mono<Long> countByOrgIdAndCreateTimeBetween(String orgId, Range<Long> createTime);

}


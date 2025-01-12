package org.lowcoder.domain.application.repository;


import org.lowcoder.domain.application.model.ApplicationVersion;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Repository
public interface ApplicationRecordRepository extends ReactiveMongoRepository<ApplicationVersion, String> {

    Mono<Long> deleteByApplicationId(String applicationId);

    Flux<ApplicationVersion> findByApplicationId(String applicationId);

    Flux<ApplicationVersion> findByApplicationIdIn(List<String> ids);

    Mono<ApplicationVersion> findTop1ByApplicationIdOrderByCreatedAtDesc(String applicationId);

}

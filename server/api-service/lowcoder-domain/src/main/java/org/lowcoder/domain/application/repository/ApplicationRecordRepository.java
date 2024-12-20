package org.lowcoder.domain.application.repository;


import org.lowcoder.domain.application.model.ApplicationRecord;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Repository
public interface ApplicationRecordRepository extends ReactiveMongoRepository<ApplicationRecord, String> {

    Mono<Long> deleteByApplicationId(String applicationId);

    Flux<ApplicationRecord> findByApplicationId(String applicationId);

    Flux<ApplicationRecord> findByApplicationIdIn(List<String> ids);

    Mono<ApplicationRecord> findTop1ByApplicationIdOrderByCreatedAtDesc(String applicationId);

}

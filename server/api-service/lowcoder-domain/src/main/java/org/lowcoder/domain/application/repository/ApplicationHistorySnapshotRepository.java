package org.lowcoder.domain.application.repository;

import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationHistorySnapshotRepository extends ReactiveMongoRepository<ApplicationHistorySnapshot, String> {

    @Query(fields = "{applicationId : 1, context: 1, createdBy : 1, createdAt : 1}")
    Flux<ApplicationHistorySnapshot> findAllByApplicationId(String applicationId, Pageable pageable);

    Mono<Long> countByApplicationId(String applicationId);
}

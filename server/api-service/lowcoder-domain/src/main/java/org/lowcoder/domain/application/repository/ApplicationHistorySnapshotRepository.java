package org.lowcoder.domain.application.repository;

import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Repository
public interface ApplicationHistorySnapshotRepository extends ReactiveMongoRepository<ApplicationHistorySnapshot, String> {

    @Query(value = "{ 'applicationId': ?0, $and: [" +
            "{$or: [ { 'context.operations': { $elemMatch: { 'compName': ?1 } } }, { $expr: { $eq: [?1, null] } } ]}, " +
            "{$or: [ { 'dsl.settings.themeId': ?2 }, { $expr: { $eq: [?2, null] } } ] }, " +
            "{$or: [ { 'createdAt': { $gte: ?3} }, { $expr: { $eq: [?3, null] } } ] }, " +
            "{$or: [ { 'createdAt': { $lte: ?4} }, { $expr: { $eq: [?4, null] } } ] } " +
            "]}",
            fields = "{applicationId : 1, context: 1, createdBy : 1, createdAt : 1}")
    Flux<ApplicationHistorySnapshot> findAllByApplicationId(String applicationId, String compName, String theme, Instant createdAtFrom, Instant createdAtTo, Pageable pageable);

    Mono<Long> countByApplicationId(String applicationId);
}

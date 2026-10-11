package org.lowcoder.domain.user.repository;

import java.util.Collection;
import java.util.List;

import org.lowcoder.domain.user.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.data.mongodb.repository.Query;

@Repository
public interface UserRepository extends ReactiveMongoRepository<User, String> {

    Flux<User> findByIdIn(Collection<String> ids);
    Mono<User> findBySuperAdminIsTrue();

    Mono<User> findByConnections_SourceAndConnections_RawId(String source, String rawId);

    Flux<User> findByConnections_SourceAndConnections_RawIdIn(String source, Collection<String> rawIds);

    Mono<User> findByName(String rawUuid);

    //email1 and email2 should be equal
    Flux<User> findByEmailOrConnections_Email(String email1, String email2);

    @Query("{ '_id': { $in: ?0 }, 'state': ?1, 'isEnabled': ?2, $or: [ { 'name': { $regex: ?3, $options: 'i' } }, { '_id': { $regex: ?3, $options: 'i' } } ] }")
    Flux<User> findUsersByIdsAndSearchNameForPagination(Collection<String> ids, String state, boolean isEnabled, String searchRegex, Pageable pageable);

    @Query(value = "{ '_id': { $in: ?0 }, 'state': ?1, 'isEnabled': ?2, $or: [ { 'name': { $regex: ?3, $options: 'i' } }, { '_id': { $regex: ?3, $options: 'i' } } ] }", count = true)
    Mono<Long> countUsersByIdsAndSearchName(Collection<String> ids, String state, boolean isEnabled, String searchRegex);
}

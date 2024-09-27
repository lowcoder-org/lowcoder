package org.lowcoder.domain.user.repository;

import java.util.Collection;

import org.lowcoder.domain.user.model.User;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends ReactiveMongoRepository<User, String> {

    Flux<User> findByIdIn(Collection<String> ids);
    Mono<User> findBySuperAdminIsTrue();

    Mono<User> findByConnections_SourceAndConnections_RawId(String source, String rawId);

    Flux<User> findByConnections_SourceAndConnections_RawIdIn(String source, Collection<String> rawIds);

    Mono<User> findByName(String rawUuid);

    //email1 and email2 should be equal
    Flux<User> findByEmailOrConnections_Email(String email1, String email2);
}

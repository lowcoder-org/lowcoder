package org.lowcoder.domain.query.repository;

import org.lowcoder.domain.query.model.LibraryQuery;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface LibraryQueryRepository extends ReactiveMongoRepository<LibraryQuery, String> {

    Flux<LibraryQuery> findByOrganizationId(String organizationId);

    Mono<LibraryQuery> findByName(String name);
    Mono<Void> deleteByGid(String gid);
    Flux<LibraryQuery> findByGid(String gid);
    Flux<LibraryQuery> findByGidIn(Collection<String> gids);
}

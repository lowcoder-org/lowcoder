package org.lowcoder.domain.bundle.repository;

import org.lowcoder.domain.bundle.model.Bundle;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface BundleRepository extends ReactiveMongoRepository<Bundle, String> {

    Flux<Bundle> findByUserId(String userId);
}

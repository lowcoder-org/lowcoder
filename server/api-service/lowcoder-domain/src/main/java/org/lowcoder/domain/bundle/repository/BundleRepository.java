package org.lowcoder.domain.bundle.repository;

import org.lowcoder.domain.bundle.model.Bundle;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.Collection;

@Repository
public interface BundleRepository extends ReactiveMongoRepository<Bundle, String> {

    Flux<Bundle> findByCreatedBy(String userId);
    /**
     * Filter marketplace bundles from list of supplied IDs
     */
    Flux<Bundle> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(Collection<String> ids);
    /**
     * Filter public bundles from list of supplied IDs
     */
    Flux<Bundle> findByPublicToAllIsTrueAndIdIn(Collection<String> ids);
    Flux<Bundle> findByCreatedByAndIdIn(String userId, Collection<String> ids);
    /**
     * Filter agency bundles from list of supplied IDs
     */
    Flux<Bundle> findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(Collection<String> ids);

    Flux<Bundle> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();

    Flux<Bundle> findByPublicToAllIsTrueAndAgencyProfileIsTrue();
}

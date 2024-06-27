package org.lowcoder.domain.bundle.repository;

import jakarta.annotation.Nonnull;
import org.lowcoder.domain.bundle.model.Bundle;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface BundleRepository extends ReactiveMongoRepository<Bundle, String> {
    Mono<Void> deleteAllByGid(Collection<String> gids);
    Flux<Bundle> findByGid(@Nonnull String gid);

    Flux<Bundle> findByCreatedBy(String userId);
    /**
     * Filter marketplace bundles from list of supplied IDs
     */
    Flux<Bundle> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(Collection<String> ids);
    Flux<Bundle> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(Collection<String> gids);
    /**
     * Filter public bundles from list of supplied IDs
     */
    Flux<Bundle> findByPublicToAllIsTrueAndIdIn(Collection<String> ids);
    Flux<Bundle> findByPublicToAllIsTrueAndGidIn(Collection<String> gids);
    Flux<Bundle> findByCreatedByAndIdIn(String userId, Collection<String> ids);
    Flux<Bundle> findByCreatedByAndGidIn(String userId, Collection<String> gids);
    /**
     * Filter agency bundles from list of supplied IDs
     */
    Flux<Bundle> findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(Collection<String> ids);
    Flux<Bundle> findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(Collection<String> gids);

    Flux<Bundle> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();

    Flux<Bundle> findByPublicToAllIsTrueAndAgencyProfileIsTrue();
}

package org.lowcoder.domain.application.repository;


import jakarta.annotation.Nonnull;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface ApplicationRepository extends ReactiveMongoRepository<Application, String>, CustomApplicationRepository {

    // publishedApplicationDSL : 0 -> excludes publishedApplicationDSL from the return
    @Query(fields = "{ publishedApplicationDSL : 0 , editingApplicationDSL : 0 }")
    Flux<Application> findByOrganizationId(String organizationId);


    @Override
    @Nonnull
    @Query(fields = "{ publishedApplicationDSL : 0 , editingApplicationDSL : 0 }")
    Mono<Application> findById(@Nonnull String id);

    @Query(fields = "{ publishedApplicationDSL : 0 , editingApplicationDSL : 0 }")
    Flux<Application> findByGid(@Nonnull String gid);

    Mono<Long> countByOrganizationIdAndApplicationStatus(String organizationId, ApplicationStatus applicationStatus);

    @Query("{$or : [{'publishedApplicationDSL.queries.datasourceId':?0},{'editingApplicationDSL.queries.datasourceId':?0}]}")
    Flux<Application> findByDatasourceId(String datasourceId);

    Flux<Application> findByIdIn(Collection<String> ids);
    Flux<Application> findByGidIn(Collection<String> ids);

    Flux<Application> findByCreatedByAndIdIn(String userId, Collection<String> ids);
    Flux<Application> findByCreatedByAndGidIn(String userId, Collection<String> gids);

    /**
     * Filter public applications from list of supplied IDs
     */
    Flux<Application> findByPublicToAllIsTrueAndIdIn(Collection<String> ids);
    Flux<Application> findByPublicToAllIsTrueAndGidIn(Collection<String> gids);

    /**
     * Filter marketplace applications from list of supplied IDs
     */
    Flux<Application> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(Collection<String> ids);
    Flux<Application> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(Collection<String> ids);

    /**
     * Filter agency applications from list of supplied IDs
     */
    Flux<Application> findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(Collection<String> ids);
    Flux<Application> findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(Collection<String> ids);

    /**
     * Find all marketplace applications
     */
    Flux<Application> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();
    
    /**
     * Find all agency applications
     */
    Flux<Application> findByPublicToAllIsTrueAndAgencyProfileIsTrue();
}

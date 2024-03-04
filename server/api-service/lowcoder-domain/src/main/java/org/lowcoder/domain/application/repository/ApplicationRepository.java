package org.lowcoder.domain.application.repository;


import java.util.Collection;

import javax.annotation.Nonnull;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationRepository extends ReactiveMongoRepository<Application, String>, CustomApplicationRepository {

    // publishedApplicationDSL : 0 -> excludes publishedApplicationDSL from the return
    @Query(fields = "{ publishedApplicationDSL : 0 , editingApplicationDSL : 0 }")
    Flux<Application> findByOrganizationId(String organizationId);


    @Override
    @Nonnull
    @Query(fields = "{ publishedApplicationDSL : 0 , editingApplicationDSL : 0 }")
    Mono<Application> findById(@Nonnull String id);

    Mono<Long> countByOrganizationIdAndApplicationStatus(String organizationId, ApplicationStatus applicationStatus);

    @Query("{$or : [{'publishedApplicationDSL.queries.datasourceId':?0},{'editingApplicationDSL.queries.datasourceId':?0}]}")
    Flux<Application> findByDatasourceId(String datasourceId);

    Flux<Application> findByIdIn(Collection<String> ids);

    /**
     * Filter public applications from list of supplied IDs
     */
    Flux<Application> findByPublicToAllIsTrueAndIdIn(Collection<String> ids);

    /**
     * Filter marketplace applications from list of supplied IDs
     */
    Flux<Application> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(Collection<String> ids);

    /**
     * Filter agency applications from list of supplied IDs
     */
    Flux<Application> findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(Collection<String> ids);

    /**
     * Find all marketplace applications
     */
    Flux<Application> findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();
    
    /**
     * Find all agency applications
     */
    Flux<Application> findByPublicToAllIsTrueAndAgencyProfileIsTrue();
}

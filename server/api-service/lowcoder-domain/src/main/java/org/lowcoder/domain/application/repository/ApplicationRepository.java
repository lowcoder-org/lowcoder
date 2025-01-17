package org.lowcoder.domain.application.repository;


import jakarta.annotation.Nonnull;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface ApplicationRepository extends ReactiveMongoRepository<Application, String>, CustomApplicationRepository {

    // publishedApplicationDSL : 0 -> excludes publishedApplicationDSL from the return
    @Aggregation(pipeline = {"{ $match: { organizationId: ?0 } }", "{ $project:  { 'editingApplicationDSL.settings': 1, _id: 1, gid: 1, organizationId: 1, name: 1, applicationType: 1, applicationStatus: 1, publicToAll: 1, publicToMarketplace: 1, agencyProfile: 1, editingUserId: 1, lastEditedAt: 1, createdAt: 1, updatedAt: 1, createdBy: 1, modifiedBy: 1, _class: 1}}"})
    Flux<Application> findByOrganizationId(String organizationId);


    @Override
    @Nonnull
    @Aggregation(pipeline = {"{ $match: { _id: ?0 } }", "{ $project:  { 'editingApplicationDSL.settings': 1, _id: 1, gid: 1, organizationId: 1, name: 1, applicationType: 1, applicationStatus: 1, publicToAll: 1, publicToMarketplace: 1, agencyProfile: 1, editingUserId: 1, lastEditedAt: 1, createdAt: 1, updatedAt: 1, createdBy: 1, modifiedBy: 1, _class: 1}}"})
    Mono<Application> findById(@Nonnull String id);

    @Aggregation(pipeline = {"{ $match: { gid: ?0 } }", "{ $project:  { 'editingApplicationDSL.settings': 1, _id: 1, gid: 1, organizationId: 1, name: 1, applicationType: 1, applicationStatus: 1, publicToAll: 1, publicToMarketplace: 1, agencyProfile: 1, editingUserId: 1, lastEditedAt: 1, createdAt: 1, updatedAt: 1, createdBy: 1, modifiedBy: 1, _class: 1}}"})
    Flux<Application> findByGid(@Nonnull String gid);

    @Aggregation(pipeline = {"{ $match: { slug: ?0 } }", "{ $project:  { 'editingApplicationDSL.settings': 1, _id: 1, gid: 1, organizationId: 1, name: 1, applicationType: 1, applicationStatus: 1, publicToAll: 1, publicToMarketplace: 1, agencyProfile: 1, editingUserId: 1, lastEditedAt: 1, createdAt: 1, updatedAt: 1, createdBy: 1, modifiedBy: 1, _class: 1}}"})
    Flux<Application> findBySlug(@Nonnull String slug);

    Mono<Long> countByOrganizationIdAndApplicationStatus(String organizationId, ApplicationStatus applicationStatus);

    @Query("{$or : [{'publishedApplicationDSL.queries.datasourceId':?0},{'editingApplicationDSL.queries.datasourceId':?0}]}")
    Flux<Application> findByDatasourceId(String datasourceId);

    Flux<Application> findByIdIn(Collection<String> ids);
    Flux<Application> findByGidIn(Collection<String> ids);
    Flux<Application> findBySlugIn(Collection<String> slugs);

    Flux<Application> findByCreatedByAndIdIn(String userId, Collection<String> ids);
    Flux<Application> findByCreatedByAndGidIn(String userId, Collection<String> gids);
    Flux<Application> findByCreatedByAndSlugIn(String userId, Collection<String> slugs);

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

    @Query("{ 'organizationId': ?0, 'slug': ?1 }")
    Mono<Boolean> existsByOrganizationIdAndSlug(String organizationId, String slug);

}

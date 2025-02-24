package org.lowcoder.domain.application.service;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.infra.annotation.NonEmptyMono;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ApplicationService {
    Mono<Application> findById(String id);

    Mono<Application> findByIdWithoutDsl(String id);

    Mono<Boolean> updateById(String applicationId, Application application);

    Mono<Boolean> updateEditState(String applicationId, Boolean editingFinished);

    Mono<Application> create(Application newApplication, String visitorId);

    Flux<Application> findByOrganizationIdWithDsl(String organizationId);

    Flux<Application> findByOrganizationIdWithoutDsl(String organizationId);

    Flux<Application> findAllMarketplaceApps();

    Flux<Application> findAllAgencyProfileApps();

    Mono<Long> countByOrganizationId(String orgId, ApplicationStatus applicationStatus);

    Flux<Application> findByIdIn(List<String> applicationIds);

    Mono<List<Application>> getAllDependentModulesFromApplicationId(String applicationId, boolean viewMode);

    Mono<List<Application>> getAllDependentModulesFromApplication(Application application, boolean viewMode);

    Mono<List<Application>> getAllDependentModulesFromDsl(Map<String, Object> dsl);

    Mono<Boolean> setApplicationPublicToAll(String applicationId, boolean publicToAll);

    // Falk: String title, String category, String description, String image will be set in Application Settings inside DSL by Frontend
    Mono<Boolean> setApplicationPublicToMarketplace(String applicationId, Boolean publicToMarketplace);

    Mono<Boolean> setApplicationAsAgencyProfile(String applicationId, boolean agencyProfile);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getFilteredPublicApplicationIds(ApplicationRequestType requestType, Collection<String> applicationIds, String userId, Boolean isPrivateMarketplace);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPublicApplicationIds(Collection<String> applicationIds);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPrivateApplicationIds(Collection<String> applicationIds, String userId);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPublicMarketplaceApplicationIds(Collection<String> applicationIds, boolean isAnonymous, boolean isPrivateMarketplace);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPublicAgencyApplicationIds(Collection<String> applicationIds);

    Flux<Application> findAll();

    Mono<Boolean> updateLastEditedAt(String applicationId, Instant time, String visitorId);
    Mono<Map<String, Object>> getLiveDSLByApplicationId(String applicationId);

    Mono<Application> updateSlug(String applicationId, String newSlug);
}

package org.lowcoder.domain.bundle.service;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.infra.annotation.NonEmptyMono;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Set;

public interface BundleService {
    Mono<Boolean> updateById(String id, Bundle resource);

    Mono<Bundle> findById(String id);

    Mono<Bundle> create(Bundle bundle, String userId);

    Flux<Bundle> findByUserId(String bundleId);

    Mono<Void> deleteAllById(Collection<String> ids);

    Mono<Boolean> exist(String id);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getFilteredPublicBundleIds(BundleRequestType requestType, Collection<String> bundleIds, String userId, Boolean isPrivateMarketplace);
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPublicBundleIds(Collection<String> bundleIds);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPrivateBundleIds(Collection<String> bundleIds, String userId);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPublicMarketplaceBundleIds(Collection<String> bundleIds, boolean isAnonymous, boolean isPrivateMarketplace);

    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    Mono<Set<String>> getPublicAgencyBundleIds(Collection<String> bundleIds);

    Mono<Boolean> setBundlePublicToAll(String bundleId, boolean publicToAll);

    Mono<Boolean> setBundlePublicToMarketplace(String bundleId, Boolean publicToMarketplace);

    Mono<Boolean> setBundleAsAgencyProfile(String bundleId, boolean agencyProfile);

    Flux<Bundle> findAllMarketplaceBundles();

    Flux<Bundle> findAllAgencyProfileBundles();
}

package org.lowcoder.domain.bundle.service;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.BizError.NO_RESOURCE_FOUND;

@RequiredArgsConstructor
@Service
public class BundleServiceImpl implements BundleService {

    private final BundleRepository repository;
    private final MongoUpsertHelper mongoUpsertHelper;
    private final ResourcePermissionService resourcePermissionService;

    @Override
    public Mono<Boolean> updateById(String id, Bundle resource) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return mongoUpsertHelper.updateById(resource, id);
    }

    @Override
    public Mono<Bundle> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findById(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "BUNDLE_NOT_FOUND", id)));
    }

    @Override
    public Mono<Bundle> create(Bundle newbundle, String visitorId) {
        return repository.save(newbundle)
                .delayUntil(bundle -> resourcePermissionService.addResourcePermissionToUser(bundle.getId(), visitorId, ResourceRole.OWNER, ResourceType.BUNDLE));
    }

    @Override
    public Flux<Bundle> findByUserId(String userId) {
        return repository.findByCreatedBy(userId);
    }

    @Override
    public Mono<Void> deleteAllById(Collection<String> ids) {
        return repository.deleteAllById(ids);
    }

    @Override
    public Mono<Boolean> exist(String id) {
        return findById(id)
                .hasElement()
                .onErrorResume(throwable -> {
                    if (throwable instanceof BizException bizException && bizException.getError() == NO_RESOURCE_FOUND) {
                        return Mono.just(false);
                    }
                    return Mono.error(throwable);
                });
    }


    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getFilteredPublicBundleIds(BundleRequestType requestType, Collection<String> bundleIds, String userId, Boolean isPrivateMarketplace) {
        boolean isAnonymous = StringUtils.isBlank(userId);
        switch(requestType)
        {
            case PUBLIC_TO_ALL:
                if (isAnonymous)
                {
                    return getPublicBundleIds(bundleIds);
                }
                else
                {
                    return getPrivateBundleIds(bundleIds, userId);
                }
            case PUBLIC_TO_MARKETPLACE:
                return getPublicMarketplaceBundleIds(bundleIds, isAnonymous, isPrivateMarketplace);
            case AGENCY_PROFILE:
                return getPublicAgencyBundleIds(bundleIds);
            default:
                return Mono.empty();
        }
    }

    /**
     * Find all public bundles - doesn't matter if user is anonymous, because these apps are public 
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicBundleIds(Collection<String> bundleIds) {

        return repository.findByPublicToAllIsTrueAndIdIn(bundleIds)
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());
    }


    /**
     * Find all private bundles for viewing.
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPrivateBundleIds(Collection<String> bundleIds, String userId) {

        // TODO: in 2.4.0 we need to check whether the app was published or not
        return repository.findByCreatedByAndIdIn(userId, bundleIds)
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());

//        return repository.findByIdIn(bundleIds)
//                        .map(HasIdAndAuditing::getId)
//                        .collect(Collectors.toSet());
    }


    /**
     * Find all marketplace bundles - filter based on whether user is anonymous and whether it's a private marketplace
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicMarketplaceBundleIds(Collection<String> bundleIds, boolean isAnonymous, boolean isPrivateMarketplace) {

        if ((isAnonymous && !isPrivateMarketplace) || !isAnonymous)
        {
            return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(bundleIds)
                    .map(HasIdAndAuditing::getId)
                    .collect(Collectors.toSet());
        }
        return Mono.empty();
    }

    /**
     * Find all agency bundles
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicAgencyBundleIds(Collection<String> bundleIds) {

        return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(bundleIds)
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());
    }

    @Override
    public Flux<Bundle> findAllMarketplaceBundles() {
        return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();
    }

    @Override
    public Flux<Bundle> findAllAgencyProfileBundles() {
        return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrue();
    }

    @Override
    public Mono<Boolean> setBundlePublicToAll(String bundleId, boolean publicToAll) {
        Bundle bundle = Bundle.builder()
                .publicToAll(publicToAll)
                .build();
        return mongoUpsertHelper.updateById(bundle, bundleId);
    }

    @Override
    public Mono<Boolean> setBundlePublicToMarketplace(String bundleId, Boolean publicToMarketplace) {

        return findById(bundleId)

                .map(bundle -> Bundle.builder()
                        .publicToMarketplace(publicToMarketplace)
                        .build())
                .flatMap(bundle -> mongoUpsertHelper.updateById(bundle, bundleId));


    }

    @Override
    public Mono<Boolean> setBundleAsAgencyProfile(String bundleId, boolean agencyProfile) {
        Bundle bundle = Bundle.builder()
                .agencyProfile(agencyProfile)
                .build();
        return mongoUpsertHelper.updateById(bundle, bundleId);
    }

}

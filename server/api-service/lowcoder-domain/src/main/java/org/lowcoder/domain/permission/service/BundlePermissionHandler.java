package org.lowcoder.domain.permission.service;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.*;

import static com.google.common.collect.Sets.newHashSet;
import static java.util.Collections.emptyMap;
import static java.util.function.Function.identity;
import static org.apache.commons.collections4.SetUtils.union;
import static org.lowcoder.domain.permission.model.ResourceHolder.USER;
import static org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID;
import static org.lowcoder.sdk.util.StreamUtils.collectMap;

@RequiredArgsConstructor
@Component
class BundlePermissionHandler extends ResourcePermissionHandler {

    private static final ResourceRole ANONYMOUS_USER_ROLE = ResourceRole.VIEWER;

    @Lazy
    private final BundleService bundleService;
    private final TemplateSolutionService templateSolutionService;

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserPermissions(Collection<String> resourceIds,
            ResourceAction resourceAction) {
        if (!ANONYMOUS_USER_ROLE.canDo(resourceAction)) {
            return Mono.just(emptyMap());
        }

        Set<String> bundleIds = newHashSet(resourceIds);
        return bundleService.getPublicBundleIds(bundleIds)
                .map(publicAppIds -> collectMap(publicAppIds, identity(), this::getAnonymousUserPermission));
    }

    // This is for PTM apps that are public but only available to logged-in users
    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserPublicResourcePermissions
            (Collection<String> resourceIds, ResourceAction resourceAction, String userId) {

        Set<String> bundleIds = newHashSet(resourceIds);
        return bundleService.getPrivateBundleIds(bundleIds, userId)
                .map(publicAppIds -> collectMap(publicAppIds, identity(), this::getAnonymousUserPermission));
    }

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserApplicationPermissions(Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType) {
        return Mono.just(Collections.emptyMap());
    }

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserApplicationPublicResourcePermissions(Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType, String userId) {
        return Mono.just(Collections.emptyMap());
    }


    @Override
	protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserBundlePermissions(
			Collection<String> resourceIds, ResourceAction resourceAction, BundleRequestType requestType) 
    {
        if (!ANONYMOUS_USER_ROLE.canDo(resourceAction)) {
            return Mono.just(emptyMap());
        }

        Set<String> bundleIds = newHashSet(resourceIds);
        return bundleService.getFilteredPublicBundleIds(requestType, bundleIds, null, config.getMarketplace().isPrivateMode())
        					.defaultIfEmpty(new HashSet<>()).map(publicAppIds -> collectMap(publicAppIds, identity(), this::getAnonymousUserPermission));
	}

	@Override
	protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserBundlePublicResourcePermissions(
			Collection<String> resourceIds, ResourceAction resourceAction, BundleRequestType requestType, String userId) {
        Set<String> bundleIds = newHashSet(resourceIds);
        return bundleService.getFilteredPublicBundleIds(requestType, bundleIds, userId, config.getMarketplace().isPrivateMode())
                .map(publicAppIds -> collectMap(publicAppIds, identity(), this::getAnonymousUserPermission));
	}

	private List<ResourcePermission> getAnonymousUserPermission(String bundleId) {
        return Collections.singletonList(ResourcePermission.builder()
                .resourceId(bundleId)
                .resourceType(ResourceType.BUNDLE)
                .resourceHolder(USER)
                .resourceHolderId(ANONYMOUS_USER_ID)
                .resourceRole(ANONYMOUS_USER_ROLE)
                .build());
    }

    @Override
    protected Mono<String> getOrgId(String resourceId) {
        return bundleService.findById(resourceId)
                .map(Bundle::getOrganizationId);
    }
}

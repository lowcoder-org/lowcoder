package org.lowcoder.domain.permission.service;

import static com.google.common.collect.Sets.newHashSet;
import static java.util.Collections.emptyMap;
import static java.util.function.Function.identity;
import static org.apache.commons.collections4.SetUtils.union;
import static org.lowcoder.domain.permission.model.ResourceHolder.USER;
import static org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID;
import static org.lowcoder.sdk.util.StreamUtils.collectMap;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
class ApplicationPermissionHandler extends ResourcePermissionHandler {

    private static final ResourceRole ANONYMOUS_USER_ROLE = ResourceRole.VIEWER;

    private final ApplicationService applicationService;
    private final TemplateSolutionService templateSolutionService;

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserPermissions(Collection<String> resourceIds,
            ResourceAction resourceAction) {
        if (!ANONYMOUS_USER_ROLE.canDo(resourceAction)) {
            return Mono.just(emptyMap());
        }

        Set<String> applicationIds = newHashSet(resourceIds);
        return Mono.zip(applicationService.getPublicApplicationIds(applicationIds),
                        templateSolutionService.getTemplateApplicationIds(applicationIds))
                .map(tuple -> {
                    Set<String> publicAppIds = tuple.getT1();
                    Set<String> templateAppIds = tuple.getT2();
                    return collectMap(union(publicAppIds, templateAppIds), identity(), this::getAnonymousUserPermission);
                });
    }

    // This is for PTM apps that are public but only available to logged-in users
    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserPublicResourcePermissions
            (Collection<String> resourceIds, ResourceAction resourceAction) {

        Set<String> applicationIds = newHashSet(resourceIds);
        return Mono.zip(applicationService.getPrivateApplicationIds(applicationIds),
                        templateSolutionService.getTemplateApplicationIds(applicationIds))
                .map(tuple -> {
                    Set<String> publicAppIds = tuple.getT1();
                    Set<String> templateAppIds = tuple.getT2();
                    return collectMap(union(publicAppIds, templateAppIds), identity(), this::getAnonymousUserPermission);
                });
    }

    
    @Override
	protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserApplicationPermissions(
			Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType) 
    {
        if (!ANONYMOUS_USER_ROLE.canDo(resourceAction)) {
            return Mono.just(emptyMap());
        }

        Set<String> applicationIds = newHashSet(resourceIds);
        return Mono.zip(applicationService.getFilteredPublicApplicationIds(requestType, applicationIds, Boolean.TRUE, config.getMarketplace().isPrivateMode())
        					.defaultIfEmpty(new HashSet<>()),
                        templateSolutionService.getTemplateApplicationIds(applicationIds)
                        	.defaultIfEmpty(new HashSet<>())
               ).map(tuple -> {
                    Set<String> publicAppIds = tuple.getT1();
                    Set<String> templateAppIds = tuple.getT2();
                    return collectMap(union(publicAppIds, templateAppIds), identity(), this::getAnonymousUserPermission);
                });
	}

	@Override
	protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserApplicationPublicResourcePermissions(
			Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType) {
        Set<String> applicationIds = newHashSet(resourceIds);
        return Mono.zip(applicationService.getFilteredPublicApplicationIds(requestType, applicationIds, Boolean.FALSE, config.getMarketplace().isPrivateMode()),
                        templateSolutionService.getTemplateApplicationIds(applicationIds))
                .map(tuple -> {
                    Set<String> publicAppIds = tuple.getT1();
                    Set<String> templateAppIds = tuple.getT2();
                    return collectMap(union(publicAppIds, templateAppIds), identity(), this::getAnonymousUserPermission);
                });
	}

	private List<ResourcePermission> getAnonymousUserPermission(String applicationId) {
        return Collections.singletonList(ResourcePermission.builder()
                .resourceId(applicationId)
                .resourceType(ResourceType.APPLICATION)
                .resourceHolder(USER)
                .resourceHolderId(ANONYMOUS_USER_ID)
                .resourceRole(ANONYMOUS_USER_ROLE)
                .build());
    }

    @Override
    protected Mono<String> getOrgId(String resourceId) {
        return applicationService.findByIdWithoutDsl(resourceId)
                .map(Application::getOrganizationId);
    }
}

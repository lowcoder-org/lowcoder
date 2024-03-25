package org.lowcoder.domain.application.service;


import static org.lowcoder.domain.application.ApplicationUtil.getDependentModulesFromDsl;

import java.util.*;
import java.util.stream.Collectors;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import com.google.common.collect.Lists;
import com.google.common.collect.Sets;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Lazy
@Service
@Slf4j
public class ApplicationService {


    @Autowired
    private MongoUpsertHelper mongoUpsertHelper;

    @Autowired
    private ResourcePermissionService resourcePermissionService;

    @Autowired
    private ApplicationRepository repository;

    public Mono<Application> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findByIdWithDsl(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", id)));
    }

    public Mono<Application> findByIdWithoutDsl(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findById(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", id)));
    }

    public Mono<Boolean> updateById(String applicationId, Application application) {
        if (applicationId == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return mongoUpsertHelper.updateById(application, applicationId);
    }


    public Mono<Boolean> updatePublishedApplicationDSL(String applicationId, Map<String, Object> applicationDSL) {
        Application application = Application.builder().publishedApplicationDSL(applicationDSL).build();
        return mongoUpsertHelper.updateById(application, applicationId);
    }

    public Mono<Application> publish(String applicationId) {
        return findById(applicationId)
                .flatMap(newApplication -> { // copy editingApplicationDSL to publishedApplicationDSL
                    Map<String, Object> editingApplicationDSL = newApplication.getEditingApplicationDSL();
                    return updatePublishedApplicationDSL(applicationId, editingApplicationDSL)
                            .thenReturn(newApplication);
                });
    }

    public Mono<Application> create(Application newApplication, String visitorId) {
        return repository.save(newApplication)
                .delayUntil(app -> resourcePermissionService.addApplicationPermissionToUser(app.getId(), visitorId, ResourceRole.OWNER));
    }

    /**
     * If you don't need dsl, please use {@link #findByOrganizationIdWithoutDsl(String)}
     */
    public Flux<Application> findByOrganizationIdWithDsl(String organizationId) {
        return repository.findByOrganizationIdWithDsl(organizationId);
    }

    public Flux<Application> findByOrganizationIdWithoutDsl(String organizationId) {
        return repository.findByOrganizationId(organizationId);
    }

    public Flux<Application> findAllMarketplaceApps() {
        return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();
    }

    public Flux<Application> findAllAgencyProfileApps() {
        return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrue();
    }

    public Mono<Long> countByOrganizationId(String orgId, ApplicationStatus applicationStatus) {
        return repository.countByOrganizationIdAndApplicationStatus(orgId, applicationStatus);
    }

    public Flux<Application> findByIdIn(List<String> applicationIds) {
        return repository.findByIdIn(applicationIds);
    }

    public Mono<List<Application>> getAllDependentModulesFromApplicationId(String applicationId, boolean viewMode) {
        return findById(applicationId)
                .flatMap(app -> getAllDependentModulesFromApplication(app, viewMode));
    }

    public Mono<List<Application>> getAllDependentModulesFromApplication(Application application, boolean viewMode) {
        Map<String, Object> dsl = viewMode ? application.getLiveApplicationDsl() : application.getEditingApplicationDSL();
        return getAllDependentModulesFromDsl(dsl);
    }

    public Mono<List<Application>> getAllDependentModulesFromDsl(Map<String, Object> dsl) {
        Set<String> circularDependencyCheckSet = Sets.newHashSet();
        return Mono.just(getDependentModulesFromDsl(dsl))
                .doOnNext(circularDependencyCheckSet::addAll)
                .flatMapMany(moduleSet -> findByIdIn(Lists.newArrayList(moduleSet)))
                .onErrorContinue((e, i) -> log.warn("get dependent modules on error continue , {}", e.getMessage()))
                .expandDeep(module -> getDependentModules(module, circularDependencyCheckSet))
                .collectList();
    }

    private Flux<Application> getDependentModules(Application module, Set<String> circularDependencyCheckSet) {
        return Flux.fromIterable(module.getLiveModules())
                .filter(moduleId -> !circularDependencyCheckSet.contains(moduleId))
                .doOnNext(circularDependencyCheckSet::add)
                .collectList()
                .flatMapMany(this::findByIdIn)
                .onErrorContinue((e, i) -> log.warn("get dependent modules on error continue , {}", e.getMessage()));
    }

    public Mono<Boolean> setApplicationPublicToAll(String applicationId, boolean publicToAll) {
        Application application = Application.builder()
                .publicToAll(publicToAll)
                .build();
        return mongoUpsertHelper.updateById(application, applicationId);
    }

    // Falk: String title, String category, String description, String image will be set in Application Settings inside DSL by Frontend
    public Mono<Boolean> setApplicationPublicToMarketplace(String applicationId, Boolean publicToMarketplace) {

        return findById(applicationId)

                .map(application -> {

                    Map<String, Object> applicationDsl = application.getEditingApplicationDSL();
                    
                    // Falk: this logic is not needed anymore, because we set Meta Data in Settings in the UI already
                    /* if (applicationDsl.containsKey("ui")) {
                        Map<String, Object> dataObject = (Map<String, Object>) applicationDsl.get("ui");

                        if(publicToMarketplace) {
                            Map<String, Object> marketplaceMeta = new HashMap<>();
                            marketplaceMeta.put("title", title);
                            marketplaceMeta.put("description", description);
                            marketplaceMeta.put("category", category);
                            marketplaceMeta.put("image", image);
                            if (dataObject.containsKey("marketplaceMeta")) {
                                dataObject.replace("marketplaceMeta", marketplaceMeta);
                            } else {
                                dataObject.put("marketplaceMeta", marketplaceMeta);
                            }
                        } else {
                            dataObject.remove("marketplaceMeta");
                        }

                        applicationDsl.replace("ui", dataObject);

                    } */

                    return Application.builder()
                            .publicToMarketplace(publicToMarketplace)
                            .editingApplicationDSL(applicationDsl)
                            .build();

                })
                .flatMap(application -> mongoUpsertHelper.updateById(application, applicationId));


    }

    public Mono<Boolean> setApplicationAsAgencyProfile(String applicationId, boolean agencyProfile) {
        Application application = Application.builder()
                .agencyProfile(agencyProfile)
                .build();
        return mongoUpsertHelper.updateById(application, applicationId);
    }


    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getFilteredPublicApplicationIds(ApplicationRequestType requestType, Collection<String> applicationIds, boolean isAnonymous, Boolean isPrivateMarketplace) {

    	switch(requestType)
    	{
	    	case PUBLIC_TO_ALL:
	    		if (isAnonymous)
	    		{
	    			return getPublicApplicationIds(applicationIds);
	    		}
	    		else
	    		{
	    			return getPrivateApplicationIds(applicationIds);
	    		}
	    	case PUBLIC_TO_MARKETPLACE:
	    		return getPublicMarketplaceApplicationIds(applicationIds, isAnonymous, isPrivateMarketplace);
	    	case AGENCY_PROFILE:
	    		return getPublicAgencyApplicationIds(applicationIds);
	    	default:
	    		return Mono.empty();
    	}
    }
    
    
    /**
     * Find all public applications - doesn't matter if user is anonymous, because these apps are public 
     */
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicApplicationIds(Collection<String> applicationIds) {

        return repository.findByPublicToAllIsTrueAndIdIn(applicationIds)
                        .map(HasIdAndAuditing::getId)
                        .collect(Collectors.toSet());
    }


    /**
     * Find all private applications for viewing.
     */
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPrivateApplicationIds(Collection<String> applicationIds) {
    	// TODO: in 2.4.0 we need to check whether the app was published or not
        return repository.findByIdIn(applicationIds)
                        .map(HasIdAndAuditing::getId)
                        .collect(Collectors.toSet());
    }
    
    
    /**
     * Find all marketplace applications - filter based on whether user is anonymous and whether it's a private marketplace
     */
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicMarketplaceApplicationIds(Collection<String> applicationIds, boolean isAnonymous, boolean isPrivateMarketplace) {

    	if ((isAnonymous && !isPrivateMarketplace) || !isAnonymous)
    	{
            return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(applicationIds)
                    .map(HasIdAndAuditing::getId)
                    .collect(Collectors.toSet());
    	}
    	return Mono.empty();
    }

    /**
     * Find all agency applications
     */
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicAgencyApplicationIds(Collection<String> applicationIds) {

        return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(applicationIds)
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());
    }

    public Flux<Application> findAll() {
        return repository.findAll();
    }
}

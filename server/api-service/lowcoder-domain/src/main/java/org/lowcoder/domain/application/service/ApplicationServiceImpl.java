package org.lowcoder.domain.application.service;


import static org.lowcoder.domain.application.ApplicationUtil.getDependentModulesFromDsl;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.util.SlugUtils;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.stereotype.Service;

import com.google.common.collect.Lists;
import com.google.common.collect.Sets;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
@Slf4j
public class ApplicationServiceImpl implements ApplicationService {

    private final MongoUpsertHelper mongoUpsertHelper;
    private final ResourcePermissionService resourcePermissionService;
    private final ApplicationRepository repository;
    private final UserRepository userRepository;
    private final ApplicationRecordService applicationRecordService;

    @Override
    public Mono<Application> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findByIdWithDsl(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", id)));
    }

    @Override
    public Mono<Application> findByIdWithoutDsl(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return Mono.from(repository.findBySlug(id))
                .switchIfEmpty(
                        Mono.defer(() -> {
                            if (FieldName.isGID(id))
                                return Mono.from(repository.findByGid(id));
                            return repository.findById(id);
                        }))
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", id)));
    }

    @Override
    public Mono<Boolean> updateById(String applicationId, Application application) {
        if (applicationId == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return mongoUpsertHelper.updateById(application, applicationId);
    }

    @Override
    public Mono<Boolean> updateEditState(String applicationId, Boolean editingFinished) {
        return findById(applicationId)
                .flatMap(newApplication -> {
                    Application application = Application.builder().editingUserId("").build();
                    if(editingFinished) return mongoUpsertHelper.updateById(application, applicationId);
                    return Mono.just(true);
                });
    }

    @Override
    public Mono<Application> create(Application newApplication, String visitorId) {
        return repository.save(newApplication)
                .delayUntil(app -> resourcePermissionService.addResourcePermissionToUser(app.getId(), visitorId, ResourceRole.OWNER, ResourceType.APPLICATION));
    }

    /**
     * If you don't need dsl, please use {@link #findByOrganizationIdWithoutDsl(String)}
     */
    @Override
    public Flux<Application> findByOrganizationIdWithDsl(String organizationId) {
        return repository.findByOrganizationIdWithDsl(organizationId);
    }

    @Override
    public Flux<Application> findByOrganizationIdWithoutDsl(String organizationId) {
        return repository.findByOrganizationId(organizationId);
    }

    @Override
    public Flux<Application> findAllMarketplaceApps() {
        return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue();
    }

    @Override
    public Flux<Application> findAllAgencyProfileApps() {
        return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrue();
    }

    @Override
    public Mono<Long> countByOrganizationId(String orgId, ApplicationStatus applicationStatus) {
        return repository.countByOrganizationIdAndApplicationStatus(orgId, applicationStatus);
    }

    @Override
    public Flux<Application> findByIdIn(List<String> applicationIds) {
        if(!applicationIds.isEmpty() && FieldName.isGID(applicationIds.get(0)))
            return repository.findByGidIn(applicationIds);
        return repository.findBySlugIn(applicationIds).switchIfEmpty(repository.findByIdIn(applicationIds));
    }

    @Override
    public Mono<List<Application>> getAllDependentModulesFromApplicationId(String applicationId, boolean viewMode) {
        return findById(applicationId)
                .flatMap(app -> getAllDependentModulesFromApplication(app, viewMode));
    }

    @Override
    public Mono<List<Application>> getAllDependentModulesFromApplication(Application application, boolean viewMode) {
        return application.getLiveApplicationDsl(applicationRecordService).switchIfEmpty(Mono.just(new HashMap<>())).flatMap(liveApplicationDsl -> {
            Map<String, Object> dsl = viewMode ? liveApplicationDsl : application.getEditingApplicationDSL();
            return getAllDependentModulesFromDsl(dsl);
        });
    }

    @Override
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
        return module.getLiveModules(applicationRecordService).flatMapMany(modules -> Flux.fromIterable(modules)
                .filter(moduleId -> !circularDependencyCheckSet.contains(moduleId))
                .doOnNext(circularDependencyCheckSet::add)
                .collectList()
                .flatMapMany(this::findByIdIn)
                .onErrorContinue((e, i) -> log.warn("get dependent modules on error continue , {}", e.getMessage())));
    }

    @Override
    public Mono<Boolean> setApplicationPublicToAll(String applicationId, boolean publicToAll) {
        Application application = Application.builder()
                .publicToAll(publicToAll)
                .build();
        return mongoUpsertHelper.updateById(application, applicationId);
    }

    // Falk: String title, String category, String description, String image will be set in Application Settings inside DSL by Frontend
    @Override
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

    @Override
    public Mono<Boolean> setApplicationAsAgencyProfile(String applicationId, boolean agencyProfile) {
        Application application = Application.builder()
                .agencyProfile(agencyProfile)
                .build();
        return mongoUpsertHelper.updateById(application, applicationId);
    }


    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getFilteredPublicApplicationIds(ApplicationRequestType requestType, Collection<String> applicationIds, String userId, Boolean isPrivateMarketplace) {
        boolean isAnonymous = StringUtils.isBlank(userId);
    	switch(requestType)
    	{
	    	case PUBLIC_TO_ALL:
	    		if (isAnonymous)
	    		{
	    			return getPublicApplicationIds(applicationIds);
	    		}
	    		else
	    		{
	    			return getPrivateApplicationIds(applicationIds, userId);
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
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicApplicationIds(Collection<String> applicationIds) {
        if(!applicationIds.isEmpty() && FieldName.isGID(applicationIds.stream().findFirst().get()))
            return repository.findByPublicToAllIsTrueAndGidIn(applicationIds)
                    .map(Application::getGid)
                    .collect(Collectors.toSet());

        return repository.findByPublicToAllIsTrueAndIdIn(applicationIds)
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());
    }


    /**
     * Find all private applications for viewing.
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPrivateApplicationIds(Collection<String> applicationIds, String userId) {

    	// TODO: in 2.4.0 we need to check whether the app was published or not
        if(!applicationIds.isEmpty() && FieldName.isGID(applicationIds.stream().findFirst().get()))
            return repository.findByCreatedByAndGidIn(userId, applicationIds)
                    .map(Application::getGid)
                    .collect(Collectors.toSet());

        return repository.findByCreatedByAndSlugIn(userId, applicationIds).switchIfEmpty(repository.findByCreatedByAndIdIn(userId, applicationIds))
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());
    }
    
    
    /**
     * Find all marketplace applications - filter based on whether user is anonymous and whether it's a private marketplace
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicMarketplaceApplicationIds(Collection<String> applicationIds, boolean isAnonymous, boolean isPrivateMarketplace) {

    	if ((isAnonymous && !isPrivateMarketplace) || !isAnonymous)
    	{
            if(!applicationIds.isEmpty() && FieldName.isGID(applicationIds.stream().findFirst().get()))
                return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(applicationIds)
                        .map(Application::getGid)
                        .collect(Collectors.toSet());

            return repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(applicationIds)
                    .map(HasIdAndAuditing::getId)
                    .collect(Collectors.toSet());
    	}
    	return Mono.empty();
    }

    /**
     * Find all agency applications
     */
    @Override
    @NonEmptyMono
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    public Mono<Set<String>> getPublicAgencyApplicationIds(Collection<String> applicationIds) {

        if(!applicationIds.isEmpty() && FieldName.isGID(applicationIds.stream().findFirst().get()))
            return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(applicationIds)
                    .map(Application::getGid)
                    .collect(Collectors.toSet());

        return repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(applicationIds)
                .map(HasIdAndAuditing::getId)
                .collect(Collectors.toSet());
    }

    @Override
    public Flux<Application> findAll() {
        return repository.findAll();
    }

    @Override
    public Mono<Boolean> updateLastEditedAt(String applicationId, Instant time, String visitorId) {
        return repository.findByIdIn(List.of(applicationId))
                .doOnNext(application -> application.setLastEditedAt(time))
                .doOnNext(application -> application.setEditingUserId(visitorId))
                .flatMap(repository::save)
                .hasElements();
    }

    @Override
    public Mono<Map<String, Object>> getLiveDSLByApplicationId(String applicationId) {
        return applicationRecordService.getLatestRecordByApplicationId(applicationId)
                .map(ApplicationVersion::getApplicationDSL)
                .switchIfEmpty(findById(applicationId)
                        .map(Application::getEditingApplicationDSL));
    }

    @Override
    public Mono<Application> updateSlug(String applicationId, String newSlug) {
        return repository.findById(applicationId).flatMap(application -> repository.existsByOrganizationIdAndSlug(application.getOrganizationId(), newSlug).flatMap(exists -> {
            if (!SlugUtils.validate(newSlug)) {
                return Mono.error(new BizException(BizError.SLUG_INVALID, "SLUG_INVALID"));
            }
            if (exists) {
                return Mono.error(new BizException(BizError.SLUG_DUPLICATE_ENTRY, "SLUG_DUPLICATE_ENTRY"));
            }
            application.setSlug(newSlug);
            return repository.save(application);
        }));
    }
}

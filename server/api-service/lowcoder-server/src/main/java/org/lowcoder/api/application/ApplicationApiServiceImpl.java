package org.lowcoder.api.application;

import com.github.f4b6a3.uuid.UuidCreator;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.SetUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.*;
import org.lowcoder.domain.application.service.ApplicationHistorySnapshotService;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.interaction.UserApplicationInteractionService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.*;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.permission.solution.SuggestAppAdminSolutionService;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.lowcoder.domain.template.model.Template;
import org.lowcoder.domain.template.service.TemplateService;
import org.lowcoder.infra.util.TupleUtils;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.util.ExceptionUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.lowcoder.domain.application.model.ApplicationStatus.NORMAL;
import static org.lowcoder.domain.permission.model.ResourceAction.*;
import static org.lowcoder.sdk.exception.BizError.*;
import static org.lowcoder.sdk.util.ExceptionUtils.*;

@RequiredArgsConstructor
@Service
@Slf4j
public class ApplicationApiServiceImpl implements ApplicationApiService {

    private static final String LIBRARY_QUERY_DATASOURCE_TYPE = "libraryQuery";
    private static final String JS_DATASOURCE_TYPE = "js";
    private static final String VIEW_DATASOURCE_TYPE = "view";

    private final ApplicationService applicationService;
    private final ResourcePermissionService resourcePermissionService;
    private final SessionUserService sessionUserService;
    private final OrgMemberService orgMemberService;
    private final OrganizationService organizationService;

    private final AbstractBizThresholdChecker bizThresholdChecker;
    private final OrgDevChecker orgDevChecker;
    private final TemplateSolutionService templateSolutionService;
    private final SuggestAppAdminSolutionService suggestAppAdminSolutionService;
    
    private final FolderApiService folderApiService;
    private final UserHomeApiService userHomeApiService;
    private final UserApplicationInteractionService userApplicationInteractionService;
    private final DatasourceMetaInfoService datasourceMetaInfoService;
    private final CompoundApplicationDslFilter compoundApplicationDslFilter;
    private final TemplateService templateService;
    private final PermissionHelper permissionHelper;
    private final DatasourceService datasourceService;
    private final ApplicationHistorySnapshotService applicationHistorySnapshotService;
    private final ApplicationRecordService applicationRecordService;
    private final FolderElementRelationService folderElementRelationService;

    @Override
    public Mono<ApplicationView> create(CreateApplicationRequest createApplicationRequest) {

        Application application = new Application(createApplicationRequest.organizationId(),
                UuidCreator.getTimeOrderedEpoch().toString(),
                createApplicationRequest.name(),
                createApplicationRequest.applicationType(),
                NORMAL,
                createApplicationRequest.editingApplicationDSL(),
                false, false, false, "", Instant.now());

        if (StringUtils.isBlank(application.getOrganizationId())) {
            return deferredError(INVALID_PARAMETER, "ORG_ID_EMPTY");
        }

        if (StringUtils.isBlank(application.getName())) {
            return deferredError(INVALID_PARAMETER, "APP_NAME_EMPTY");
        }

        return sessionUserService.getVisitorId()
                .flatMap(userId -> orgMemberService.getOrgMember(application.getOrganizationId(), userId))
                .switchIfEmpty(deferredError(NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .delayUntil(orgMember -> orgDevChecker.checkCurrentOrgDev())
                .delayUntil(bizThresholdChecker::checkMaxOrgApplicationCount)
                .delayUntil(orgMember -> {
                    String folderId = createApplicationRequest.folderId();
                    if (StringUtils.isBlank(folderId)) {
                        return Mono.empty();
                    }
                    return folderApiService.checkFolderExist(folderId)
                            .flatMap(folder -> folderApiService.checkFolderCurrentOrg(folder, orgMember.getOrgId()));
                })
                .flatMap(org -> applicationService.create(application, org.getUserId()))
                .delayUntil(created -> autoGrantPermissionsByFolderDefault(created.getId(), createApplicationRequest.folderId()))
                .delayUntil(created -> folderApiService.move(created.getId(),
                        createApplicationRequest.folderId()))
                .map(applicationCreated -> ApplicationView.builder()
                        .applicationInfoView(buildView(applicationCreated, "", createApplicationRequest.folderId()))
                        .applicationDSL(applicationCreated.getEditingApplicationDSL())
                        .build());
    }

    private Mono<Void> autoGrantPermissionsByFolderDefault(String applicationId, @Nullable String folderId) {
        if (StringUtils.isBlank(folderId)) {
            return Mono.empty();
        }
        return folderApiService.getPermissions(folderId)
                .flatMapIterable(ApplicationPermissionView::getPermissions)
                .groupBy(PermissionItemView::getRole)
                .flatMap(sameRolePermissionItemViewFlux -> {
                    String role = sameRolePermissionItemViewFlux.key();
                    Flux<PermissionItemView> permissionItemViewFlux = sameRolePermissionItemViewFlux.cache();

                    Mono<List<String>> userIdsMono = permissionItemViewFlux
                            .filter(permissionItemView -> permissionItemView.getType() == ResourceHolder.USER)
                            .map(PermissionItemView::getId)
                            .collectList();

                    Mono<List<String>> groupIdsMono = permissionItemViewFlux
                            .filter(permissionItemView -> permissionItemView.getType() == ResourceHolder.GROUP)
                            .map(PermissionItemView::getId)
                            .collectList();

                    return Mono.zip(userIdsMono, groupIdsMono)
                            .flatMap(tuple -> {
                                List<String> userIds = tuple.getT1();
                                List<String> groupIds = tuple.getT2();
                                return resourcePermissionService.insertBatchPermission(ResourceType.APPLICATION, applicationId,
                                        new HashSet<>(userIds), new HashSet<>(groupIds),
                                        ResourceRole.fromValue(role));
                            });
                })
                .then();
    }

    @Override
    public Flux<ApplicationInfoView> getRecycledApplications(String name, String category) {
        return userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(null, ApplicationStatus.RECYCLED, false, name, category);
    }

    private Mono<Void> checkCurrentUserApplicationPermission(String applicationId, ResourceAction action) {
        return sessionUserService.getVisitorId()
                .flatMap(userId -> resourcePermissionService.checkResourcePermissionWithError(userId, applicationId, action));
    }

    @Override
    public Mono<ApplicationView> delete(String applicationId) {
        return checkApplicationStatus(applicationId, ApplicationStatus.RECYCLED)
                .then(updateApplicationStatus(applicationId, ApplicationStatus.DELETED))
                .then(applicationService.findById(applicationId))
                .flatMap(application -> buildView(application).map(appInfoView -> ApplicationView.builder()
                        .applicationInfoView(appInfoView)
                        .applicationDSL(application.getEditingApplicationDSL())
                        .build()));
    }

    @Override
    public Mono<Boolean> recycle(String applicationId) {
        return checkApplicationStatus(applicationId, NORMAL)
                .then(updateApplicationStatus(applicationId, ApplicationStatus.RECYCLED));
    }

    @Override
    public Mono<Boolean> restore(String applicationId) {
        return checkApplicationStatus(applicationId, ApplicationStatus.RECYCLED)
                .then(updateApplicationStatus(applicationId, NORMAL));
    }

    private Mono<Void> checkApplicationStatus(String applicationId, ApplicationStatus expected) {
        return applicationService.findByIdWithoutDsl(applicationId)
                .flatMap(application -> checkApplicationStatus(application, expected));
    }

    private Mono<Void> checkApplicationStatus(Application application, ApplicationStatus expected) {
        if (expected == application.getApplicationStatus()) {
            return Mono.empty();
        }
        return Mono.error(new BizException(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"));
    }

    private Mono<Void> checkApplicationViewRequest(Application application, ApplicationRequestType expected) {

    	// TODO: check application.isPublicToAll() from v2.4.0
    	if (expected == ApplicationRequestType.PUBLIC_TO_ALL) {
            return Mono.empty();
        }

        // Falk: here is to check the ENV Variable LOWCODER_MARKETPLACE_PRIVATE_MODE
        // isPublicToMarketplace & isPublicToAll must be both true
        if (expected == ApplicationRequestType.PUBLIC_TO_MARKETPLACE && application.isPublicToMarketplace() && application.isPublicToAll()) {
            return Mono.empty();
        }
        
        // 
        // Falk: application.agencyProfile() & isPublicToAll must be both true
        if (expected == ApplicationRequestType.AGENCY_PROFILE && application.agencyProfile() && application.isPublicToAll()) {
            return Mono.empty();
        }
        return Mono.error(new BizException(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"));
    }

    private Mono<Boolean> updateApplicationStatus(String applicationId, ApplicationStatus applicationStatus) {
        return checkCurrentUserApplicationPermission(applicationId, MANAGE_APPLICATIONS)
                .then(Mono.defer(() -> {
                    Application application = Application.builder()
                            .applicationStatus(applicationStatus)
                            .build();
                    return applicationService.updateById(applicationId, application);
                }));
    }

    @Override
    public Mono<ApplicationView> getEditingApplication(String applicationId) {
        return applicationService.findById(applicationId).filter(application -> application.isPublicToAll() && application.isPublicToMarketplace())
                .map(application -> {
                    ResourcePermission permission = ResourcePermission.builder().resourceRole(ResourceRole.VIEWER).build();
                    return permission;
                })
                .switchIfEmpty(checkPermissionWithReadableErrorMsg(applicationId, EDIT_APPLICATIONS))
                .zipWhen(permission -> applicationService.findById(applicationId)
                        .delayUntil(application -> checkApplicationStatus(application, NORMAL)))
                .zipWhen(tuple -> applicationService.getAllDependentModulesFromApplication(tuple.getT2(), false), TupleUtils::merge)
                .zipWhen(tuple -> organizationService.getOrgCommonSettings(tuple.getT2().getOrganizationId()), TupleUtils::merge)
                .flatMap(tuple -> {
                    ResourcePermission permission = tuple.getT1();
                    Application application = tuple.getT2();
                    List<Application> dependentModules = tuple.getT3();
                    Map<String, Object> commonSettings = tuple.getT4();

                    return Flux.fromIterable(dependentModules)
                            .flatMap(app -> app.getLiveApplicationDsl(applicationRecordService)
                                    .map(dsl -> Map.entry(app.getId(), sanitizeDsl(dsl))))
                            .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                            .flatMap(dependentModuleDsl ->
                                applicationService.updateById(applicationId, application).flatMap(__ ->
                                    buildView(application, permission.getResourceRole().getValue()).map(appInfoView ->
                                        ApplicationView.builder()
                                            .applicationInfoView(appInfoView)
                                            .applicationDSL(application.getEditingApplicationDSL())
                                            .moduleDSL(dependentModuleDsl)
                                            .orgCommonSettings(commonSettings)
                                            .build())));
                });
    }

    @Override
    public Mono<ApplicationView> getPublishedApplication(String applicationId, ApplicationRequestType requestType) {
        return checkApplicationPermissionWithReadableErrorMsg(applicationId, READ_APPLICATIONS, requestType)
                .zipWhen(permission -> applicationService.findById(applicationId)
                        .delayUntil(application -> checkApplicationStatus(application, NORMAL))
                        .delayUntil(application -> checkApplicationViewRequest(application, requestType)))
                .zipWhen(tuple -> applicationService.getAllDependentModulesFromApplication(tuple.getT2(), true), TupleUtils::merge)
                .zipWhen(tuple -> organizationService.getOrgCommonSettings(tuple.getT2().getOrganizationId()), TupleUtils::merge)
                .zipWith(getTemplateIdFromApplicationId(applicationId), TupleUtils::merge)
                .flatMap(tuple -> {
                    ResourcePermission permission = tuple.getT1();
                    Application application = tuple.getT2();
                    List<Application> dependentModules = tuple.getT3();
                    Map<String, Object> commonSettings = tuple.getT4();
                    String templateId = tuple.getT5();
                    return Flux.fromIterable(dependentModules)
                            .flatMap(app -> app.getLiveApplicationDsl(applicationRecordService)
                                    .map(dsl -> Map.entry(app.getId(), sanitizeDsl(dsl))))
                            .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                            .flatMap(dependentModuleDsl ->
                                application.getLiveApplicationDsl(applicationRecordService).flatMap(liveDsl ->
                                    buildView(application, permission.getResourceRole().getValue()).map(appInfoView ->
                                        ApplicationView.builder()
                                            .applicationInfoView(appInfoView)
                                            .applicationDSL(sanitizeDsl(liveDsl))
                                            .moduleDSL(dependentModuleDsl)
                                            .orgCommonSettings(commonSettings)
                                            .templateId(templateId)
                                            .build()))
                            );
                })
                .delayUntil(applicationView -> {
                    if (applicationView.getApplicationInfoView().getApplicationType() == ApplicationType.NAV_LAYOUT.getValue()) {
                        return compoundApplicationDslFilter.removeSubAppsFromCompoundDsl(applicationView.getApplicationDSL());
                    }
                    return Mono.empty();
                });
    }

    private Mono<String> getTemplateIdFromApplicationId(String applicationId) {
        return templateService.getByApplicationId(applicationId)
                .map(Template::getId)
                .defaultIfEmpty("")
                .onErrorResume(e -> {
                    log.error("get template from applicationId error", e);
                    return Mono.just("");
                });
    }

    @Override
    public Mono<Void> updateUserApplicationLastViewTime(String applicationId) {
        return sessionUserService.getVisitorId()
                .filter(Authentication::isNotAnonymousUser)
                .flatMap(visitorId -> userApplicationInteractionService.upsert(visitorId, applicationId, Instant.now()))
                .onErrorResume(throwable -> {
                    log.error("updateUserApplicationLastViewTime error.", throwable);
                    return Mono.empty();
                });
    }

    @Override
    public Mono<ApplicationView> update(String applicationId, Application application) {
        return checkApplicationStatus(applicationId, NORMAL)
                .then(sessionUserService.getVisitorId())
                .flatMap(userId -> resourcePermissionService.checkAndReturnMaxPermission(userId,
                        applicationId, EDIT_APPLICATIONS))
                .delayUntil(__ -> checkDatasourcePermissions(application))
                .flatMap(permission -> doUpdateApplication(applicationId, application)
                        .flatMap(applicationUpdated -> buildView(applicationUpdated, permission.getResourceRole().getValue()).map(appInfoView -> ApplicationView.builder()
                                .applicationInfoView(appInfoView)
                                .applicationDSL(applicationUpdated.getEditingApplicationDSL())
                                .build())));
    }

    private Mono<Application> doUpdateApplication(String applicationId, Application application) {
        Application applicationUpdate = Application.builder()
                .editingApplicationDSL(application.getEditingApplicationDSLOrNull())
                .name(application.getName())
                .build();
        return applicationService.updateById(applicationId, applicationUpdate)
                .then(applicationService.findById(applicationId));
    }

    @Override
    public Mono<ApplicationView> publish(String applicationId, ApplicationPublishRequest applicationPublishRequest) {
        return checkApplicationStatus(applicationId, NORMAL)
                .then(sessionUserService.getVisitorId())
                .flatMap(userId -> resourcePermissionService.checkAndReturnMaxPermission(userId,
                        applicationId, PUBLISH_APPLICATIONS))
                .delayUntil(__ -> applicationService.findById(applicationId)
                        .map(application -> ApplicationVersion.builder()
                                .tag(applicationPublishRequest.tag())
                                .commitMessage(applicationPublishRequest.commitMessage())
                                .applicationId(application.getId())
                                .applicationDSL(application.getEditingApplicationDSL())
                                .build())
                        .flatMap(applicationRecordService::insert))
                .flatMap(permission -> applicationService.findById(applicationId)
                        .flatMap(applicationUpdated -> buildView(applicationUpdated, permission.getResourceRole().getValue()).map(appInfoView -> ApplicationView.builder()
                                .applicationInfoView(appInfoView)
                                .applicationDSL(applicationUpdated.getEditingApplicationDSL())
                                .build())));
    }

    @Override
    public Mono<Boolean> updateEditState(String applicationId, ApplicationEndpoints.UpdateEditStateRequest updateEditStateRequest) {
        return checkApplicationStatus(applicationId, NORMAL)
                .then(sessionUserService.getVisitorId())
                .flatMap(userId -> resourcePermissionService.checkAndReturnMaxPermission(userId,
                        applicationId, EDIT_APPLICATIONS))
                .flatMap(permission -> applicationService.updateEditState(applicationId, updateEditStateRequest.editingFinished()));
    }

    @Override
    public Mono<Boolean> grantPermission(String applicationId,
                                         Set<String> userIds,
                                         Set<String> groupIds, ResourceRole role) {
        if (userIds.isEmpty() && groupIds.isEmpty()) {
            return Mono.just(true);
        }

        return checkCurrentUserApplicationPermission(applicationId, MANAGE_APPLICATIONS)
                .then(applicationService.findByIdWithoutDsl(applicationId))
                .delayUntil(application -> checkApplicationStatus(application, NORMAL))
                .switchIfEmpty(deferredError(BizError.APPLICATION_NOT_FOUND, "APPLICATION_NOT_FOUND", applicationId))
                .then(resourcePermissionService.insertBatchPermission(ResourceType.APPLICATION, applicationId,
                        userIds, groupIds, role))
                .thenReturn(true);
    }

    @Override
    public Mono<Boolean> updatePermission(String applicationId, String permissionId, ResourceRole role) {
        return checkCurrentUserApplicationPermission(applicationId, MANAGE_APPLICATIONS)
                .then(checkApplicationStatus(applicationId, NORMAL))
                .then(resourcePermissionService.getById(permissionId))
                .filter(permission -> StringUtils.equals(permission.getResourceId(), applicationId))
                .switchIfEmpty(deferredError(ILLEGAL_APPLICATION_PERMISSION_ID, "ILLEGAL_APPLICATION_PERMISSION_ID"))
                .then(resourcePermissionService.updateRoleById(permissionId, role));

    }

    @Override
    public Mono<Boolean> removePermission(String applicationId, String permissionId) {
        return checkCurrentUserApplicationPermission(applicationId, MANAGE_APPLICATIONS)
                .then(checkApplicationStatus(applicationId, NORMAL))
                .then(resourcePermissionService.getById(permissionId))
                .filter(permission -> StringUtils.equals(permission.getResourceId(), applicationId))
                .switchIfEmpty(deferredError(ILLEGAL_APPLICATION_PERMISSION_ID, "ILLEGAL_APPLICATION_PERMISSION_ID"))
                .then(resourcePermissionService.removeById(permissionId));
    }

    @Override
    public Mono<ApplicationPermissionView> getApplicationPermissions(String applicationId) {

        Mono<List<ResourcePermission>> applicationPermissions = resourcePermissionService.getByApplicationId(applicationId).cache();

        Mono<List<PermissionItemView>> groupPermissionPairsMono = applicationPermissions
                .flatMap(permissionHelper::getGroupPermissions);

        Mono<List<PermissionItemView>> userPermissionPairsMono = applicationPermissions
                .flatMap(permissionHelper::getUserPermissions);

        return checkCurrentUserApplicationPermission(applicationId, READ_APPLICATIONS)
                .then(applicationService.findByIdWithoutDsl(applicationId))
                .delayUntil(application -> checkApplicationStatus(application, NORMAL))
                .flatMap(application -> {
                    String creatorId = application.getCreatedBy();
                    String orgId = application.getOrganizationId();

                    Mono<Organization> orgMono = organizationService.getById(orgId);
                    return Mono.zip(groupPermissionPairsMono, userPermissionPairsMono, orgMono)
                            .map(tuple -> {
                                List<PermissionItemView> groupPermissionPairs = tuple.getT1();
                                List<PermissionItemView> userPermissionPairs = tuple.getT2();
                                Organization organization = tuple.getT3();
                                return ApplicationPermissionView.builder()
                                        .groupPermissions(groupPermissionPairs)
                                        .userPermissions(userPermissionPairs)
                                        .creatorId(creatorId)
                                        .orgName(organization.getName())
                                        .publicToAll(application.isPublicToAll())
                                        .publicToMarketplace(application.isPublicToMarketplace())
                                        .agencyProfile(application.agencyProfile())
                                        .build();
                            });
                });
    }

    @Override
    public Mono<ApplicationView> createFromTemplate(String templateId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .delayUntil(orgMember -> orgDevChecker.checkCurrentOrgDev())
                .delayUntil(bizThresholdChecker::checkMaxOrgApplicationCount)
                .flatMap(orgMember -> templateSolutionService.createFromTemplate(templateId, orgMember.getOrgId(), orgMember.getUserId())
                        .flatMap(applicationCreated -> buildView(applicationCreated).map(appInfoView -> ApplicationView.builder()
                                .applicationInfoView(appInfoView)
                                .applicationDSL(applicationCreated.getEditingApplicationDSL())
                                .build())));
    }

    @Override
    @Nonnull
    public Mono<ResourcePermission> checkPermissionWithReadableErrorMsg(String applicationId, ResourceAction action) {
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> resourcePermissionService.checkUserPermissionStatusOnResource(visitorId, applicationId, action))
                .flatMap(permissionStatus -> {
                    if (!permissionStatus.hasPermission()) {
                        if (permissionStatus.failByAnonymousUser()) {
                            return ofError(USER_NOT_SIGNED_IN, "USER_NOT_SIGNED_IN");
                        }

                        if (permissionStatus.failByNotInOrg()) {
                            return ofError(NO_PERMISSION_TO_REQUEST_APP, "INSUFFICIENT_PERMISSION");
                        }

                        return suggestAppAdminSolutionService.getSuggestAppAdminNames(applicationId)
                                .flatMap(names -> {
                                    String messageKey = action == EDIT_APPLICATIONS ? "NO_PERMISSION_TO_EDIT" : "NO_PERMISSION_TO_VIEW";
                                    return ofError(NO_PERMISSION_TO_REQUEST_APP, messageKey, names);
                                });
                    }
                    return Mono.just(permissionStatus.getPermission());
                });
    }

    @Override
    @Nonnull
    public Mono<ResourcePermission> checkApplicationPermissionWithReadableErrorMsg(String applicationId, ResourceAction action, ApplicationRequestType requestType) {
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> resourcePermissionService.checkUserPermissionStatusOnApplication(visitorId, applicationId, action, requestType))
                .publishOn(Schedulers.boundedElastic())
                .flatMap(permissionStatus -> {
                    if (!permissionStatus.hasPermission()) {

                        String orgId = "";
                        try {
                            orgId = applicationService.findById(applicationId)
                                    .map(Application::getOrganizationId)
                                    .onErrorReturn("")
                                    .block(Duration.ofSeconds(5));
                        } catch(Throwable cause) {
                            log.warn("Couldn't get orgId! - {}", cause.getMessage());
                        }

                        HttpHeaders headers = new HttpHeaders();
                        if (StringUtils.isNotBlank(orgId)) {
                            headers.add("X-ORG-ID", orgId);
                        }

                        if (permissionStatus.failByAnonymousUser()) {
                            return ofErrorWithHeaders(USER_NOT_SIGNED_IN, "USER_NOT_SIGNED_IN", headers);
                        }

                        if (permissionStatus.failByNotInOrg()) {
                            return ofErrorWithHeaders(NO_PERMISSION_TO_REQUEST_APP, "INSUFFICIENT_PERMISSION", headers);
                        }

                        return suggestAppAdminSolutionService.getSuggestAppAdminNames(applicationId)
                                .flatMap(names -> {
                                    String messageKey = action == EDIT_APPLICATIONS ? "NO_PERMISSION_TO_EDIT" : "NO_PERMISSION_TO_VIEW";
                                    return ofErrorWithHeaders(NO_PERMISSION_TO_REQUEST_APP, messageKey, headers, names);
                                });
                    }
                    return Mono.just(permissionStatus.getPermission());
                });
    }
    
    
    
    private Mono<ApplicationInfoView> buildView(Application application, String role) {
        return Mono.just(buildView(application, role, null)).delayUntil(applicationInfoView -> {
            String applicationId = applicationInfoView.getApplicationId();
            return folderElementRelationService.getByElementIds(List.of(applicationId))
                    .doOnNext(folderElement -> {
                        applicationInfoView.setFolderId(folderElement.folderId());
                    }).then();
        });
    }

    private ApplicationInfoView buildView(Application application, String role, @Nullable String folderId) {
        return ApplicationInfoView.builder()
                .applicationId(application.getId())
                .applicationGid(application.getGid())
                .orgId(application.getOrganizationId())
                .name(application.getName())
                .createBy(application.getCreatedBy())
                .createAt(application.getCreatedAt().toEpochMilli())
                .role(role)
                .applicationType(application.getApplicationType())
                .applicationStatus(application.getApplicationStatus())
                .folderId(folderId)
                .publicToAll(application.isPublicToAll())
                .publicToMarketplace(application.isPublicToMarketplace())
                .agencyProfile(application.agencyProfile())
                .editingUserId(application.getEditingUserId())
                .lastModifyTime(application.getUpdatedAt())
                .lastEditedAt(application.getLastEditedAt())
                .build();
    }

    private Mono<ApplicationInfoView> buildView(Application application) {
        return buildView(application, "");
    }

    @Override
    public Mono<Boolean> setApplicationPublicToAll(String applicationId, boolean publicToAll) {
        return checkCurrentUserApplicationPermission(applicationId, ResourceAction.SET_APPLICATIONS_PUBLIC)
                .then(checkApplicationStatus(applicationId, NORMAL))
                .then(applicationService.setApplicationPublicToAll(applicationId, publicToAll));
    }

    @Override
    public Mono<Boolean> setApplicationPublicToMarketplace(String applicationId, ApplicationEndpoints.ApplicationPublicToMarketplaceRequest request) {
        return checkCurrentUserApplicationPermission(applicationId, ResourceAction.SET_APPLICATIONS_PUBLIC_TO_MARKETPLACE)
                .then(checkApplicationStatus(applicationId, NORMAL))
                .then(applicationService.setApplicationPublicToMarketplace
                        (applicationId, request.publicToMarketplace()));
    }

    // Falk: why we have request.publicToMarketplace() - but here only agencyProfile? Not from request?
    @Override
    public Mono<Boolean> setApplicationAsAgencyProfile(String applicationId, boolean agencyProfile) {
        return checkCurrentUserApplicationPermission(applicationId, ResourceAction.SET_APPLICATIONS_AS_AGENCY_PROFILE)
                .then(checkApplicationStatus(applicationId, NORMAL))
                .then(applicationService.setApplicationAsAgencyProfile
                        (applicationId, agencyProfile));
    }

    @Override
    public Mono<Application> updateSlug(String applicationId, String slug) {
        return applicationService.updateSlug(applicationId, slug);
    }

    private Map<String, Object> sanitizeDsl(Map<String, Object> applicationDsl) {
        if (applicationDsl.get("queries") instanceof List<?> queries) {
            List<Map<String, Object>> list = queries.stream().map(this::doSanitizeQuery).toList();
            applicationDsl.put("queries", list);
            removeTestVariablesFromProductionView(applicationDsl);
            return applicationDsl;
        }
        removeTestVariablesFromProductionView(applicationDsl);
        return applicationDsl;
    }

    private void removeTestVariablesFromProductionView(Map<String, Object> applicationDsl) {
        /**Remove "test" object if it exists within "applicationDSL**/
        if (applicationDsl.containsKey("ui")) {
            Map<String, Object> dataObject = (Map<String, Object>) applicationDsl.get("ui");
            if (dataObject.containsKey("comp")) {
                Map<String, Object> applicationDSL = (Map<String, Object>) dataObject.get("comp");
                doRemoveTestVariablesFromProductionView(applicationDSL);
            }
        }
    }

    private void doRemoveTestVariablesFromProductionView(Map<String, Object> map) {
        if (map.containsKey("io")) {
            Map<String, Object> io = (Map<String, Object>) map.get("io");
            if (io.containsKey("inputs")) {
                List<Map<String, Object>> inputs = (List<Map<String, Object>>) io.get("inputs");
                    for (Map<String, Object> inputMap : inputs) {
                        if (inputMap.containsKey("test")) {
                            inputMap.remove("test");
                        }
                    }
            }

            if (io.containsKey("outputs")) {
                List<Map<String, Object>> outputs = (List<Map<String, Object>>) io.get("outputs");
                for (Map<String, Object> inputMap : outputs) {
                    if (inputMap.containsKey("test")) {
                        inputMap.remove("test");
                    }
                }
            }
        }
    }


    @SuppressWarnings("unchecked")
    private Map<String, Object> doSanitizeQuery(Object query) {
        if (!(query instanceof Map)) {
            return Maps.newHashMap();
        }
        Map<String, Object> queryMap = (Map<String, Object>) query;
        Object compType = ((Map<?, ?>) query).get("compType");
        if (!(compType instanceof String datasourceType)) {
            return queryMap;
        }
        if (LIBRARY_QUERY_DATASOURCE_TYPE.equalsIgnoreCase(datasourceType) ||
                JS_DATASOURCE_TYPE.equalsIgnoreCase(datasourceType) ||
                VIEW_DATASOURCE_TYPE.equalsIgnoreCase(datasourceType)) {
            return queryMap;
        }
        QueryExecutor<?, Object, ?> queryExecutor;
        try {
            queryExecutor = datasourceMetaInfoService.getQueryExecutor(datasourceType);
        } catch (Exception e) {
            return queryMap;
        }
        Object comp = queryMap.get("comp");
        if (!(comp instanceof Map<?, ?> queryConfig)) {
            return queryMap;
        }
        Map<String, Object> sanitizedQueryConfig;
        try {
            sanitizedQueryConfig = queryExecutor.sanitizeQueryConfig((Map<String, Object>) queryConfig);
        } catch (Exception e) {
            return queryMap;
        }
        queryMap.put("comp", sanitizedQueryConfig);
        if (isDesensitizedQueryConfig(sanitizedQueryConfig)) {
            queryMap.put("compType", "view");
        }
        return queryMap;
    }

    private boolean isDesensitizedQueryConfig(Map<String, Object> queryConfig) {
        return queryConfig.size() == 1 && queryConfig.containsKey("fields");
    }

    private Mono<Void> checkDatasourcePermissions(Application application) {
        return Mono.defer(() -> {
            Set<String> datasourceIds = SetUtils.emptyIfNull(application.getEditingQueries())
                    .stream()
                    .map(applicationQuery -> applicationQuery.getBaseQuery().getDatasourceId())
                    .filter(StringUtils::isNotBlank)
                    .filter(Datasource::isNotSystemStaticId)
                    .collect(Collectors.toSet());
            if (CollectionUtils.isEmpty(datasourceIds)) {
                return Mono.empty();
            }

            String organizationId = application.getOrganizationId();
            return sessionUserService.getVisitorId()
                    .flatMap(userId -> resourcePermissionService.getMaxMatchingPermission(userId, datasourceIds, USE_DATASOURCES))
                    .zipWith(datasourceService.retainNoneExistAndNonCurrentOrgDatasourceIds(datasourceIds, organizationId).collectList())
                    .flatMap(tuple -> {
                        Set<String> hasPermissionDatasourceIds = tuple.getT1().keySet();
                        List<String> noneExistDatasourceIds = tuple.getT2();

                        if (Sets.union(hasPermissionDatasourceIds, new HashSet<>(noneExistDatasourceIds)).containsAll(datasourceIds)) {
                            return Mono.empty();
                        }
                        return ExceptionUtils.ofError(BizError.NOT_AUTHORIZED, "APPLICATION_EDIT_ERROR_LACK_OF_DATASOURCE_PERMISSIONS");
                    });
        });
    }
}

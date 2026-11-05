package org.lowcoder.api.datasource;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.datasource.service.DatasourceStructureService;
import org.lowcoder.domain.datasource.service.JsDatasourceHelper;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.ServerException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.lowcoder.domain.permission.model.ResourceAction.*;
import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;

@RequiredArgsConstructor
@Service
public class DatasourceApiServiceImpl implements DatasourceApiService {

    private final SessionUserService sessionUserService;
    private final OrgMemberService orgMemberService;
    private final DatasourceService datasourceService;
    private final ResourcePermissionService resourcePermissionService;
    private final PermissionHelper permissionHelper;
    private final OrgDevChecker orgDevChecker;

    private final UserService userService;
    private final DatasourceConnectionPool datasourceConnectionPool;
    private final OrganizationService organizationService;
    private final ApplicationService applicationService;
    private final JsDatasourceHelper jsDatasourceHelper;
    private final DatasourceMetaInfoService datasourceMetaInfoService;
    private final DatasourcePluginClient datasourcePluginClient;
    private final DatasourceRepository datasourceRepository;
    private final ApplicationApiService applicationApiService;
    private final DatasourceStructureService datasourceStructureService;

    @Override
    public Mono<Datasource> create(Datasource datasource) {
        if(StringUtils.isEmpty(datasource.getGid())) datasource.setGid(UuidCreator.getTimeOrderedEpoch().toString());
        return sessionUserService.getVisitorId()
                .flatMap(userId -> orgMemberService.getOrgMember(datasource.getOrganizationId(), userId))
                .switchIfEmpty(deferredError(NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .delayUntil(orgMember -> orgDevChecker.checkCurrentOrgDev())
                .flatMap(orgMember -> datasourceService.create(datasource, orgMember.getUserId()))
                .delayUntil(jsDatasourceHelper::processDynamicQueryConfig);
    }

    @Override
    public Flux<Datasource> listJsDatasourcePlugins(String applicationId, String name, String type) {
        return applicationService.findById(applicationId)
                .delayUntil(application -> applicationApiService.checkPermissionWithReadableErrorMsg(applicationId, READ_APPLICATIONS))
                .flatMapMany(application -> datasourceService.getByOrgId(application.getOrganizationId()))
                .filter(datasource -> datasource.getDatasourceStatus() == DatasourceStatus.NORMAL)
                .filter(datasource -> datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType()) &&
                        (name == null || StringUtils.containsIgnoreCase(datasource.getName(), name)) &&
                        (type == null || datasource.getType().equals(type))
                )
                .delayUntil(jsDatasourceHelper::processDynamicQueryConfig)
                .doOnNext(datasource -> datasource.setDetailConfig(null));
    }

    @Override
    public Flux<DatasourceView> listAppDataSources(String appId, String name, String type) {
        return applicationService.findById(appId)
                .flatMapMany(application -> listOrgDataSources(application.getOrganizationId(), name, type));
    }

    @Override
    public Flux<DatasourceView> listOrgDataSources(String orgId, String name, String type) {
        // get datasource
        Flux<Datasource> datasourceFlux = datasourceService.getByOrgId(orgId)
                .filter(datasource -> datasource.getDatasourceStatus() == DatasourceStatus.NORMAL &&
                        (name == null || StringUtils.containsIgnoreCase(datasource.getName(), name)) &&
                        (type == null || datasource.getType().equals(type))
                )
                .cache();

        // get user-datasource permissions
        Mono<Map<String, ResourcePermission>> datasourceId2MaxPermissionMapMono = datasourceFlux
                .map(Datasource::getId)
                .collectList()
                .zipWith(sessionUserService.getVisitorId())
                .flatMap(tuple -> {
                    List<String> allDatasourceIds = tuple.getT1();
                    String visitorId = tuple.getT2();
                    return resourcePermissionService.getMaxMatchingPermission(visitorId, allDatasourceIds, USE_DATASOURCES);
                })
                .cache();

        // filter by user-datasource permissions
        datasourceFlux = datasourceFlux
                .filterWhen(datasource ->
                        datasourceId2MaxPermissionMapMono.map(map -> {
                            ResourcePermission maxPermission = map.get(datasource.getId());
                            return maxPermission != null && maxPermission.getResourceRole().canDo(USE_DATASOURCES);
                        }))
                .cache();

        // get datasource creator
        Mono<Map<String, User>> userMapMono = datasourceFlux.map(Datasource::getCreatedBy)
                .collectList()
                .flatMap(userIds -> userService.getByIds(userIds))
                .cache();

        // build view
        return datasourceFlux
                .delayUntil(datasourceService::removePasswordTypeKeysFromJsDatasourcePluginConfig)
                .delayUntil(jsDatasourceHelper::processDynamicQueryConfig)
                .flatMap(datasource ->
                        Mono.zip(datasourceId2MaxPermissionMapMono, userMapMono)
                                .map(tuple -> {
                                    Map<String, ResourcePermission> datasourceId2MaxPermissionMap = tuple.getT1();
                                    Map<String, User> userMap = tuple.getT2();
                                    User creator = userMap.get(datasource.getCreatedBy());
                                    ResourcePermission maxPermission = datasourceId2MaxPermissionMap.get(datasource.getId());
                                    boolean manage = maxPermission != null && maxPermission.getResourceRole().canDo(MANAGE_DATASOURCES);
                                    return new DatasourceView(datasource, manage, creator == null ? null : creator.getName());
                                }));
    }

    @Override
    public Mono<Datasource> update(String datasourceId, Datasource updatedDatasource) {
        if (datasourceId == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return checkCurrentUserManageDatasourcePermission(datasourceId)
                .then(datasourceService.update(datasourceId, updatedDatasource));
    }

    @Override
    public Mono<Datasource> findByIdWithPermission(String datasourceId) {
        return checkCurrentUserManageDatasourcePermission(datasourceId)
                .then(datasourceService.getById(datasourceId));
    }

    /**
     * The structure of the datasource, for a visitor who may use it ({@code USE_DATASOURCES}: a VIEWER or higher grant to the user or one of the user's groups, or an ADMIN or SUPER_ADMIN membership of the datasource's organization). Anyone else, including a visitor outside that organization, an id that names no stored datasource, and a call with no visitor, gets NOT_AUTHORIZED before {@link DatasourceStructureService#getStructure} is called, so neither the structure cache nor a connection is touched.
     * <p>
     * Limits: the check and the read are two operations, not one atomic step, so a grant or membership removed between them still lets that one read through; the structure cache is keyed by datasource id only, so a cached structure is served to every permitted visitor whoever filled it, and {@code ignoreCache=true} lets every permitted visitor, a VIEWER included, open a connection with the stored credentials and overwrite the cache; system static datasource ids pass the check for every visitor ({@code DatasourcePermissionHandler}), as before; a datasource marked deleted is found and checked like a live one; {@code datasourceId} is the object id: the controller converts a gid first, and a gid that names no datasource completes empty there, for anyone, before this check.
     */
    @Override
    public Mono<DatasourceStructure> getStructureWithPermission(String datasourceId, boolean ignoreCache) {
        return checkCurrentUserUseDatasourcePermission(datasourceId)
                .then(Mono.defer(() -> datasourceStructureService.getStructure(datasourceId, ignoreCache)));
    }

    @Override
    public Mono<DatasourceTestResult> testDatasource(Datasource testDatasource) {
        return Mono.defer(() -> {
                    if (testDatasource.getId() != null) {
                        return checkCurrentUserManageDatasourcePermission(testDatasource.getId());
                    }
                    return Mono.empty();
                })
                .then(datasourceService.testDatasource(testDatasource));
    }

    @Override
    public Mono<Boolean> delete(String datasourceId) {

        return checkCurrentUserManageDatasourcePermission(datasourceId)
                .then(datasourceService.delete(datasourceId));
    }

    @Override
    public Object info(@Nullable String datasourceId) {
        return datasourceConnectionPool.info(datasourceId);
    }

    /**
     * Forwards the requests to the plugin service, first putting into each request that names a datasource the
     * {@code extra} of that JS-plugin datasource. Only datasources the visitor may manage give their {@code extra}, the
     * permission the datasource edit form that sends these requests already needs to load the datasource
     * ({@link #findByIdWithPermission}). Each id is checked on its own, so that the organization and the admin role are
     * resolved for that datasource: a batched permission lookup resolves both from the first id only and would grant an
     * organization's admin every id of the batch. Any other id, including one of another organization's datasource, is
     * treated like an unknown id: its request gets a null {@code extra}, and no error is raised.
     * <p>
     * Limits: ids are matched as object ids only, so a gid reference gets a null {@code extra}. System static datasource
     * ids pass the permission check for everyone, but they are not stored, so they give no {@code extra} either. The rest
     * of each request, including the {@code dataSourceConfig} the caller sends, is forwarded unchecked.
     */
    @Override
    public Mono<List<Object>> getPluginDynamicConfig(List<GetPluginDynamicConfigRequestDTO> getPluginDynamicConfigRequestDTOS) {
        if (CollectionUtils.isEmpty(getPluginDynamicConfigRequestDTOS)) {
            return Mono.just(Collections.emptyList());
        }
        Set<String> datasourceIds = getPluginDynamicConfigRequestDTOS.stream()
                .map(GetPluginDynamicConfigRequestDTO::getDataSourceId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toSet());
        if (CollectionUtils.isEmpty(datasourceIds)) {
            return datasourcePluginClient.getPluginDynamicConfig(getPluginDynamicConfigRequestDTOS);
        }
        return sessionUserService.getVisitorId()
                .flatMapMany(visitorId -> Flux.fromIterable(datasourceIds)
                        .concatMap(datasourceId -> resourcePermissionService
                                .getMaxMatchingPermission(visitorId, datasourceId, MANAGE_DATASOURCES)
                                .map(permission -> datasourceId)))
                .collectList()
                .flatMapMany(manageableIds -> manageableIds.isEmpty() ? Flux.<Datasource> empty()
                                                                      : datasourceRepository.findAllById(manageableIds))
                .filter(datasource -> datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())
                        && datasource.getDetailConfig() instanceof JsDatasourceConnectionConfig jsDatasourceConnectionConfig
                        && jsDatasourceConnectionConfig.getExtra() != null)
                .collectMap(HasIdAndAuditing::getId, datasource -> {
                    JsDatasourceConnectionConfig detailConfig = (JsDatasourceConnectionConfig) datasource.getDetailConfig();
                    return detailConfig.getExtra();
                })
                .doOnNext(datasourceId2ExtraMap -> getPluginDynamicConfigRequestDTOS
                        .forEach(getPluginDynamicConfigRequestDTO -> {
                            if (StringUtils.isNotBlank(getPluginDynamicConfigRequestDTO.getDataSourceId())) {
                                Object extra = datasourceId2ExtraMap.get(getPluginDynamicConfigRequestDTO.getDataSourceId());
                                getPluginDynamicConfigRequestDTO.getDataSourceConfig().put(JsDatasourceConnectionConfig.EXTRA_KEY, extra);
                            }
                        }))
                .then(datasourcePluginClient.getPluginDynamicConfig(getPluginDynamicConfigRequestDTOS));
    }

    // ================================ PERMISSIONS ================================

    @Override
    public Mono<CommonPermissionView> getPermissions(String datasourceId) {
        Mono<List<ResourcePermission>> allPermissionListMono = resourcePermissionService.getByDataSourceId(datasourceId).cache();
        Mono<List<PermissionItemView>> groupPermissionListMono = allPermissionListMono.flatMap(permissionHelper::getGroupPermissions);
        Mono<List<PermissionItemView>> userPermissionListMono = allPermissionListMono.flatMap(permissionHelper::getUserPermissions);

        return datasourceService.getById(datasourceId)
                .switchIfEmpty(Mono.error(new ServerException("data source not exist. {}", datasourceId)))
                .delayUntil(__ -> checkCurrentUserManageDatasourcePermission(datasourceId))
                .flatMap(datasource -> Mono.zip(groupPermissionListMono, userPermissionListMono, Mono.just(datasource.getCreatedBy()),
                        organizationService.getById(datasource.getOrganizationId())))
                .map(tuple -> {
                    List<PermissionItemView> groupPermissions = tuple.getT1();
                    List<PermissionItemView> userPermissions = tuple.getT2();
                    String creator = tuple.getT3();
                    Organization organization = tuple.getT4();
                    return CommonPermissionView.builder()
                            .groupPermissions(groupPermissions)
                            .userPermissions(userPermissions)
                            .creatorId(creator)
                            .orgName(organization.getName())
                            .build();
                });
    }

    @Override
    public Mono<Boolean> grantPermission(String datasourceId, @Nullable Set<String> userIds, @Nullable Set<String> groupIds, ResourceRole role) {

        if (CollectionUtils.isEmpty(userIds) && CollectionUtils.isEmpty(groupIds)) {
            return Mono.just(true);
        }

        return checkCurrentUserManageDatasourcePermission(datasourceId)
                .then(checkRole(role))
                .then(datasourceService.getById(datasourceId))
                .switchIfEmpty(deferredError(BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND", datasourceId))
                .then(resourcePermissionService.insertBatchPermission(ResourceType.DATASOURCE, datasourceId, userIds, groupIds, role))
                .thenReturn(true);
    }

    @Override
    public Mono<Boolean> updatePermission(String permissionId, ResourceRole role) {
        return checkBeforePermissionDeleteOrUpdate(permissionId)
                .then(checkRole(role))
                .then(resourcePermissionService.updateRoleById(permissionId, role));
    }

    @Override
    public Mono<Boolean> deletePermission(String permissionId) {
        return checkBeforePermissionDeleteOrUpdate(permissionId)
                .then(resourcePermissionService.removeById(permissionId));
    }

    private Mono<Void> checkRole(ResourceRole role) {
        if (MANAGE_DATASOURCES.getRole() == role || USE_DATASOURCES.getRole() == role) {
            return Mono.empty();
        }
        return Mono.error(new ServerException("error role for datasource. {}", role));
    }

    private Mono<Void> checkBeforePermissionDeleteOrUpdate(String permissionId) {
        return resourcePermissionService.getById(permissionId)
                .switchIfEmpty(Mono.error(new ServerException("permission not exist. {}", permissionId)))
                .delayUntil(resourcePermission -> {
                    if (resourcePermission.getResourceType() != ResourceType.DATASOURCE) {
                        return Mono.error(new ServerException("resource type should be datasource. {}", permissionId));
                    }
                    return Mono.empty();
                })
                .flatMap(resourcePermission -> checkCurrentUserManageDatasourcePermission(resourcePermission.getResourceId()));
    }

    /**
     * Whether the visitor may manage the datasource ({@code MANAGE_DATASOURCES}, the OWNER role). No visitor is NOT_AUTHORIZED.
     */
    private Mono<Void> checkCurrentUserManageDatasourcePermission(String datasourceId) {
        return checkCurrentUserDatasourcePermission(datasourceId, MANAGE_DATASOURCES);
    }

    /**
     * Whether the visitor may use the datasource ({@code USE_DATASOURCES}, the VIEWER role or higher). No visitor is NOT_AUTHORIZED.
     */
    private Mono<Void> checkCurrentUserUseDatasourcePermission(String datasourceId) {
        return checkCurrentUserDatasourcePermission(datasourceId, USE_DATASOURCES);
    }

    /**
     * Whether the visitor may do {@code action} on the datasource, for this one id: a batched lookup would resolve the organization and the admin role from the first id only. A call with no visitor ({@code getVisitorId()} completes empty: no security context) is NOT_AUTHORIZED before the permission service is asked (NEW-115). Limits: the check and the guarded operation are two steps, not one atomic step; an anonymous visitor is a visitor and is judged by the permission service as before; system static datasource ids pass for every visitor.
     */
    private Mono<Void> checkCurrentUserDatasourcePermission(String datasourceId, ResourceAction action) {
        return sessionUserService.getVisitorId()
                .switchIfEmpty(deferredError(NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .flatMap(visitorId -> resourcePermissionService.checkResourcePermissionWithError(visitorId, datasourceId, action));
    }
}

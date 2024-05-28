package org.lowcoder.domain.permission.service;

import jakarta.annotation.Nullable;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.permission.model.*;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.annotation.PossibleEmptyMono;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ResourcePermissionService {
    Mono<Map<String, Collection<ResourcePermission>>> getByResourceTypeAndResourceIds(ResourceType resourceType,
                                                                                      Collection<String> resourceIds);

    @NonEmptyMono
    Mono<List<ResourcePermission>> getByResourceTypeAndResourceId(ResourceType resourceType, String resourceId);

    @NonEmptyMono
    Mono<List<ResourcePermission>> getByApplicationId(String applicationId);

    @NonEmptyMono
    Mono<List<ResourcePermission>> getByDataSourceId(String dataSourceId);

    Mono<Void> insertBatchPermission(ResourceType resourceType, String resourceId, @Nullable Set<String> userIds,
                                     @Nullable Set<String> groupIds, ResourceRole role);

    Mono<Boolean> addDataSourcePermissionToUser(String dataSourceId,
                                                String userId,
                                                ResourceRole role);

    Mono<Boolean> addResourcePermissionToUser(String resourceId,
                                                 String userId,
                                                 ResourceRole role,
                                                 ResourceType type);

    Mono<Boolean> addApplicationPermissionToGroup(String applicationId,
                                                  String groupId,
                                                  ResourceRole role);

    Mono<ResourcePermission> getById(String permissionId);

    Mono<Boolean> removeById(String permissionId);

    Mono<Boolean> updateRoleById(String permissionId, ResourceRole role);

    Flux<String> filterResourceWithPermission(String userId, Collection<String> resourceIds, ResourceAction resourceAction);

    Mono<Void> checkResourcePermissionWithError(String userId, String resourceId, ResourceAction action);

    @PossibleEmptyMono
    Mono<ResourcePermission> getMaxMatchingPermission(String userId, String resourceId, ResourceAction resourceAction);

    Mono<Boolean> haveAllEnoughPermissions(String userId, Collection<String> resourceIds, ResourceAction resourceAction);

    Mono<Map<String, ResourcePermission>> getMaxMatchingPermission(String userId,
                                                                   Collection<String> resourceIds, ResourceAction resourceAction);

    Mono<ResourcePermission> checkAndReturnMaxPermission(String userId, String resourceId, ResourceAction resourceAction);

    Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnResource
            (String userId, String resourceId, ResourceAction resourceAction);

    Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnApplication
            (String userId, String resourceId, ResourceAction resourceAction, ApplicationRequestType requestType);
    Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnBundle
            (String userId, String resourceId, ResourceAction resourceAction, BundleRequestType requestType);

    Mono<Boolean> removeUserApplicationPermission(String appId, String userId);

    Mono<Boolean> removeUserDatasourcePermission(String appId, String userId);

    Mono<ResourcePermission> getUserAssignedPermissionForApplication(String applicationId, String userId);
}

package org.lowcoder.domain.permission.service;

import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface ResourcePermissionHandlerService {
    Mono<Map<String, List<ResourcePermission>>> getAllMatchingPermissions(String userId,
                                                                          Collection<String> resourceIds,
                                                                          ResourceAction resourceAction);

    Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnResource(String userId,
                                                                             String resourceId, ResourceAction resourceAction);

    Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnApplication(String userId, String resourceId,
                                                                                ResourceAction resourceAction, ApplicationRequestType requestType);

    Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnBundle(String userId, String resourceId,
                                                                                ResourceAction resourceAction, BundleRequestType requestType);
}

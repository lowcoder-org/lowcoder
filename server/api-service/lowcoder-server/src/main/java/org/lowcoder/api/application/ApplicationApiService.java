package org.lowcoder.api.application;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;

import jakarta.annotation.Nonnull;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ApplicationApiService {
    Mono<ApplicationView> create(ApplicationEndpoints.CreateApplicationRequest createApplicationRequest);

    Flux<ApplicationInfoView> getRecycledApplications(String name, String category);

    Mono<ApplicationView> delete(String applicationId);

    Mono<Boolean> recycle(String applicationId);

    Mono<Boolean> restore(String applicationId);

    Mono<ApplicationView> getEditingApplication(String applicationId, Boolean withDeleted);

    Mono<ApplicationView> getPublishedApplication(String applicationId, ApplicationRequestType requestType, Boolean withDeleted);

    Mono<Void> updateUserApplicationLastViewTime(String applicationId);

    Mono<ApplicationView> update(String applicationId, Application application, Boolean updateStatus);

    Mono<ApplicationView> publish(String applicationId, ApplicationPublishRequest applicationPublishRequest);

    Mono<ApplicationView> publishWithRollback(String applicationId, ApplicationPublishRequest applicationPublishRequest, Map<String, Object> rollbackDsl);

    Mono<Boolean> updateEditState(String applicationId, ApplicationEndpoints.UpdateEditStateRequest updateEditStateRequest);

    Mono<Boolean> grantPermission(String applicationId,
                                  Set<String> userIds,
                                  Set<String> groupIds, ResourceRole role);

    Mono<Boolean> updatePermission(String applicationId, String permissionId, ResourceRole role);

    Mono<Boolean> removePermission(String applicationId, String permissionId);

    Mono<ApplicationPermissionView> getApplicationPermissions(String applicationId);

    Mono<ApplicationView> createFromTemplate(String templateId);

    @Nonnull
    Mono<ResourcePermission> checkPermissionWithReadableErrorMsg(String applicationId, ResourceAction action);

    @Nonnull
    Mono<ResourcePermission> checkApplicationPermissionWithReadableErrorMsg(String applicationId, ResourceAction action, ApplicationRequestType requestType);

    Mono<Boolean> setApplicationPublicToAll(String applicationId, boolean publicToAll);

    Mono<Boolean> setApplicationPublicToMarketplace(String applicationId, ApplicationEndpoints.ApplicationPublicToMarketplaceRequest request);

    // Falk: why we have request.publicToMarketplace() - but here only agencyProfile? Not from request?
    Mono<Boolean> setApplicationAsAgencyProfile(String applicationId, boolean agencyProfile);

    Mono<Application> updateSlug(String applicationId, String slug);

    Mono<List<Object>> getGroupsOrMembersWithoutPermissions(String appId);
}

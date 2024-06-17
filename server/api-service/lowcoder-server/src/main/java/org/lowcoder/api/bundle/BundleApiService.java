package org.lowcoder.api.bundle;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface BundleApiService {
    Mono<BundleInfoView> create(BundleEndpoints.CreateBundleRequest createBundleRequest);

    Mono<Bundle> checkBundleExist(String bundleId);

    Mono<Void> checkBundleCurrentUser(Bundle bundle, String currentOrgId);
    Mono<BundleInfoView> getPublishedBundle(String bundleId, BundleRequestType requestType);

    Mono<Bundle> delete(@Nonnull String bundleId);

    Mono<Boolean> recycle(String bundleId);

    Mono<Boolean> restore(String bundleId);
    Flux<BundleInfoView> getRecycledBundles();

    Mono<BundleInfoView> update(Bundle bundle);

    Mono<Void> moveApp(String applicationId, String fromBundled, String toBundleId);

    Mono<Void> addApp(String applicationId, String toBundleId);

    Flux<?> getElements(@Nullable String bundleId, @Nullable ApplicationType applicationType);

    @Nonnull
    Mono<ResourcePermission> checkBundlePermissionWithReadableErrorMsg(String bundleId, ResourceAction action, BundleRequestType requestType);

    Mono<Void> grantPermission(String bundleId, Set<String> userIds, Set<String> groupIds, ResourceRole role);

    Mono<Void> updatePermission(String bundleId, String permissionId, ResourceRole role);

    Mono<Void> removePermission(String bundleId, String permissionId);

    Mono<BundlePermissionView> getPermissions(String bundleId);

    Mono<BundleInfoView> buildBundleInfoView(Bundle bundle, boolean visible, boolean manageable, String folderId);

    Mono<Boolean> setBundlePublicToAll(String bundleId, boolean publicToAll);

    Mono<Boolean> setBundlePublicToMarketplace(String bundleId, BundleEndpoints.BundlePublicToMarketplaceRequest request);

    Mono<Boolean> setBundleAsAgencyProfile(String bundleId, boolean agencyProfile);

    Mono<Void> reorder(String bundleId, List<String> elementIds);
}

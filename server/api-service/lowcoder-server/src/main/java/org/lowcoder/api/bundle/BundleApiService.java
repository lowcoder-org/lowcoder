package org.lowcoder.api.bundle;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.permission.model.ResourceRole;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface BundleApiService {
    Mono<BundleInfoView> create(Bundle bundle);

    Mono<Bundle> checkBundleExist(String bundleId);

    Mono<Void> checkBundleCurrentUser(Bundle bundle, String currentOrgId);

    Mono<Bundle> delete(@Nonnull String bundleId);

    Mono<BundleInfoView> update(Bundle bundle);

    Mono<Void> move(String applicationLikeId, @Nullable String targetBundled);

    Flux<?> getElements(@Nullable String bundleId, @Nullable ApplicationType applicationType);

    Mono<Void> grantPermission(String bundleId, Set<String> userIds, Set<String> groupIds, ResourceRole role);

    Mono<Void> updatePermission(String bundleId, String permissionId, ResourceRole role);

    Mono<Void> removePermission(String bundleId, String permissionId);

    Mono<ApplicationPermissionView> getPermissions(String bundleId);

    Mono<BundleInfoView> buildBundleInfoView(Bundle bundle, boolean visible, boolean manageable);
}

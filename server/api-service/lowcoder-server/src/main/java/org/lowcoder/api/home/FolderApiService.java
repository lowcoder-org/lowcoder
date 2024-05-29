package org.lowcoder.api.home;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.permission.model.ResourceRole;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface FolderApiService {
    Mono<FolderInfoView> create(Folder folder);

    Mono<Folder> checkFolderExist(String folderId);

    Mono<Void> checkFolderCurrentOrg(Folder folder, String currentOrgId);

    Mono<Folder> delete(@Nonnull String folderId);

    Mono<FolderInfoView> update(Folder folder);

    Mono<Void> move(String applicationLikeId, @Nullable String targetFolderId);
    Mono<Void> moveBundle(String bundleId, @Nullable String targetFolderId);

    Mono<Void> upsertLastViewTime(@Nullable String folderId);

    Flux<?> getElements(@Nullable String folderId, @Nullable ApplicationType applicationType);

    Mono<Void> grantPermission(String folderId, Set<String> userIds, Set<String> groupIds, ResourceRole role);

    Mono<Void> updatePermission(String folderId, String permissionId, ResourceRole role);

    Mono<Void> removePermission(String folderId, String permissionId);

    Mono<ApplicationPermissionView> getPermissions(String folderId);

    Mono<FolderInfoView> buildFolderInfoView(Folder folder, boolean visible, boolean manageable);
}

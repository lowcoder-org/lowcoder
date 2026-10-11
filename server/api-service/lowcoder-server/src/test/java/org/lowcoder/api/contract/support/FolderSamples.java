package org.lowcoder.api.contract.support;

import org.lowcoder.api.home.FolderEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.home.FolderEndpoints.UpdatePermissionRequest;

import java.util.HashSet;
import java.util.List;

/**
 * Samples of the folder request types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T6.1), with the conventions of
 * {@link PayloadSamples}. {@code Folder} itself is WP1's representative ({@link PayloadSamples#folder()}), and the folder
 * responses are WP2's {@code FolderInfoView}, {@code ApplicationInfoView} and {@code ApplicationPermissionView}
 * ({@link ApplicationSamples}). Permission roles are real {@code ResourceRole} values ({@link ApplicationSamples#EDITOR_ROLE},
 * {@link ApplicationSamples#VIEWER_ROLE}), because {@code FolderController} rejects others.
 */
public final class FolderSamples {

    private FolderSamples() {
    }

    public static BatchAddPermissionRequest batchAddPermissionRequest() {
        return new BatchAddPermissionRequest(ApplicationSamples.EDITOR_ROLE,
                new HashSet<>(List.of("FolderEndpoints.BatchAddPermissionRequest.userIds[0]", "FolderEndpoints.BatchAddPermissionRequest.userIds[1]")),
                new HashSet<>(List.of("FolderEndpoints.BatchAddPermissionRequest.groupIds[0]", "FolderEndpoints.BatchAddPermissionRequest.groupIds[1]")));
    }

    public static UpdatePermissionRequest updatePermissionRequest() {
        return new UpdatePermissionRequest(ApplicationSamples.VIEWER_ROLE);
    }
}

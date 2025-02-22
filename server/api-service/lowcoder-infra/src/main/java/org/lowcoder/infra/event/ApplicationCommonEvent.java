package org.lowcoder.infra.event;


import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.Set;

@Getter
@SuperBuilder
public class ApplicationCommonEvent extends AbstractEvent {

    private final String applicationId;
    private final String applicationGid;
    private final String applicationName;
    private final String applicationCategory;
    private final String applicationDescription;
    private final EventType type;
    @Nullable
    private final String folderId;
    @Nullable
    private final String folderName;
    @Nullable
    private final String oldFolderId;
    @Nullable
    private final String oldFolderName;
    private final String permissionId;
    private final String role;
    private final Set<String> userIds;
    private final Set<String> groupIds;
    private final String shareType;
    private final String tag;
    private final String commitMessage;

    @Override
    public EventType getEventType() {
        return type;
    }
}

package org.lowcoder.infra.event;


import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class BundleCommonEvent extends AbstractEvent {

    private final String bundleId;
    private final String bundleGid;
    private final String bundleName;
    private final String bundleCategory;
    private final String bundleDescription;
    private final EventType type;
    @Nullable
    private final String folderId;
    @Nullable
    private final String folderName;
    @Nullable
    private final String oldFolderId;
    @Nullable
    private final String oldFolderName;

    @Override
    public EventType getEventType() {
        return type;
    }
}

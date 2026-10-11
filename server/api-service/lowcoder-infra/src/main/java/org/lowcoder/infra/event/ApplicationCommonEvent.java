package org.lowcoder.infra.event;


import com.fasterxml.jackson.annotation.JsonInclude;
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
    private final String applicationTitle;
    private final String oldApplicationName;
    private final String oldApplicationCategory;
    private final String oldApplicationDescription;
    private final String oldApplicationTitle;
    private final String applicationAuthor;
    private final String applicationAuthorOrgId;
    private final EventType type;
    @Nullable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String folderId;
    @Nullable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String folderName;
    @Nullable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String oldFolderId;
    @Nullable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String oldFolderName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String permissionId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String role;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final Set<String> userIds;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final Set<String> groupIds;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String shareType;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String tag;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String commitMessage;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final Object sharingDetails;

    @Override
    public EventType getEventType() {
        return type;
    }
}

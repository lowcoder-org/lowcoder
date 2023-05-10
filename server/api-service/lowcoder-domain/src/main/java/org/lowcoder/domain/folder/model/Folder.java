package org.lowcoder.domain.folder.model;

import javax.annotation.Nullable;

import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document
public class Folder extends HasIdAndAuditing {

    private String organizationId;
    @Nullable
    private String parentFolderId; // null represents folder in the root folder
    private String name;
}

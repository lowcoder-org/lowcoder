package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.folder.model.Folder;

@SuperBuilder
@Getter
public class FolderMetaView {
    private String id;
    private String name;

    public static FolderMetaView of(Folder folder) {
        return FolderMetaView.builder()
                    .id(folder.getId())
                    .name(folder.getName())
                    .build();
    }
}

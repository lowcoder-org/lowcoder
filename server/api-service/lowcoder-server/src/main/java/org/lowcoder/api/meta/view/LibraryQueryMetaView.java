package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.query.model.LibraryQuery;

@SuperBuilder
@Getter
public class LibraryQueryMetaView {
    private String id;
    private String name;

    public static LibraryQueryMetaView of(LibraryQuery libraryQuery) {
        return LibraryQueryMetaView.builder()
                    .id(libraryQuery.getId())
                    .name(libraryQuery.getName())
                    .build();
    }
}

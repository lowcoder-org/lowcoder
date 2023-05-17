package org.lowcoder.api.query.view;

import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.user.model.User;

public record LibraryQueryMetaView(String id,
                                   String datasourceType,
                                   String organizationId,
                                   String name,
                                   long createTime,
                                   String creatorName) {

    public static LibraryQueryMetaView from(LibraryQuery libraryQuery, User user) {
        return new LibraryQueryMetaView(libraryQuery.getId(),
                libraryQuery.getQuery().getCompType(),
                libraryQuery.getOrganizationId(),
                libraryQuery.getName(),
                libraryQuery.getCreatedAt().toEpochMilli(),
                user.getName());
    }
}

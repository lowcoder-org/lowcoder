package org.lowcoder.api.query.view;

import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.user.model.User;

public record LibraryQueryMetaView(String id,
                                   String gid,
                                   String datasourceType,
                                   String organizationId,
                                   String name,
                                   long createTime,
                                   String creatorName) {

    public static LibraryQueryMetaView from(LibraryQuery libraryQuery, User user) {
        // Null-safe creator: a library query whose createdBy no longer resolves to a User (deleted user, or
        // deployed cross-environment) must not NPE the whole list. Mirrors DatasourceApiServiceImpl /
        // FolderApiServiceImpl (creator == null ? null : creator.getName()).
        return new LibraryQueryMetaView(libraryQuery.getId(),
                libraryQuery.getGid(),
                libraryQuery.getQuery().getCompType(),
                libraryQuery.getOrganizationId(),
                libraryQuery.getName(),
                libraryQuery.getCreatedAt().toEpochMilli(),
                user == null ? null : user.getName());
    }
}

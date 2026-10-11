package org.lowcoder.api.meta.view;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class MetaView {
    private final List<ApplicationMetaView> apps;
    private final List<UserMetaView> users;
    private final List<OrgMetaView> orgs;
    private final List<FolderMetaView> folders;
    private final List<DatasourceMetaView> datasources;
    private final List<BundleMetaView> bundles;
    private final List<GroupMetaView> groups;
    private final List<LibraryQueryMetaView> queries;
}

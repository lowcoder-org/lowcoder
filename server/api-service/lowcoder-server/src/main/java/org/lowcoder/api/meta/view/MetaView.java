package org.lowcoder.api.meta.view;

import lombok.Builder;
import lombok.Getter;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.user.model.User;

import java.util.List;

@Builder
@Getter
public class MetaView {
    private final List<Application> apps;
    private final List<User> users;
    private final List<Organization> orgs;
    private final List<Folder> folders;
    private final List<Datasource> datasources;
    private final List<Bundle> bundles;
    private final List<Group> groups;
    private final List<LibraryQuery> queries;
}

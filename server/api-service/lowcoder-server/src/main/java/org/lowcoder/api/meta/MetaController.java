package org.lowcoder.api.meta;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.service.BundleServiceImpl;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.impl.DatasourceServiceImpl;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderServiceImpl;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupServiceImpl;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationServiceImpl;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.service.LibraryQueryServiceImpl;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserServiceImpl;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class MetaController implements MetaEndpoints {
    private final ApplicationApiService applicationApiService;
    private final ApplicationServiceImpl applicationServiceImpl;
    private final UserServiceImpl userServiceImpl;
    private final OrganizationServiceImpl organizationServiceImpl;
    private final FolderServiceImpl folderServiceImpl;
    private final DatasourceServiceImpl datasourceServiceImpl;
    private final BundleServiceImpl bundleServiceImpl;
    private final GroupServiceImpl groupServiceImpl;
    private final LibraryQueryServiceImpl libraryQueryServiceImpl;

    @Override
    public Mono<ResponseView<MetaView>> getMetaData(@RequestBody GetMetaDataRequest param) {
        Flux<Application> appsFlux = applicationServiceImpl.findByIdIn(param.appIds());
        Flux<User> usersFlux = userServiceImpl.getByIds(param.userIds()).flatMapMany(map -> Flux.fromIterable(map.values()));
        Flux<Organization> orgsFlux = organizationServiceImpl.getByIds(param.orgIds());
        Flux<Folder> foldersFlux = folderServiceImpl.findByIds(param.folderIds());
        Flux<Datasource> datasourcesFlux = datasourceServiceImpl.getByIds(param.datasourceIds());
        Flux<Bundle> bundlesFlux = bundleServiceImpl.findByIdIn(param.bundleIds());
        Flux<Group> groupsFlux = groupServiceImpl.getByIds(param.groupIds());
        Flux<LibraryQuery> queriesFlux = libraryQueryServiceImpl.getByIds(param.libraryQueryIds());
        return Mono.zip(
                        appsFlux.collectList(),
                        usersFlux.collectList(),
                        orgsFlux.collectList(),
                        foldersFlux.collectList(),
                        datasourcesFlux.collectList(),
                        bundlesFlux.collectList(),
                        groupsFlux.collectList(),
                        queriesFlux.collectList()
                ).map(tuple -> MetaView.builder()
                        .apps(tuple.getT1())
                        .users(tuple.getT2())
                        .orgs(tuple.getT3())
                        .folders(tuple.getT4())
                        .datasources(tuple.getT5())
                        .bundles(tuple.getT6())
                        .groups(tuple.getT7())
                        .queries(tuple.getT8())
                        .build())
                .map(ResponseView::success);
    }
}

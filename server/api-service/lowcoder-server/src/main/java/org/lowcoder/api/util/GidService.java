package org.lowcoder.api.util;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.lowcoder.domain.datasource.repository.DatasourceDORepository;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.repository.GroupRepository;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.repository.LibraryQueryRepository;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Optional;

@Component
public class GidService {
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private DatasourceDORepository datasourceDORepository;
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private LibraryQueryRepository libraryQueryRepository;
    @Autowired
    private FolderRepository folderRepository;
    @Autowired
    private BundleRepository bundleRepository;

    public Mono<String> convertApplicationIdToObjectId(String id) {
        return applicationRepository.findBySlug(id).next().mapNotNull(HasIdAndAuditing::getId).switchIfEmpty(
                Mono.defer(() -> {
                    if (FieldName.isGID(id)) {
                        return applicationRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
                    }
                    return Mono.just(id);
                }));
    }

    public Mono<String> convertDatasourceIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return datasourceDORepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
        }
        return Mono.just(id);
    }

    public Mono<String> convertOrganizationIdToObjectId(String id) {
        return organizationRepository.findBySlug(id).next().mapNotNull(HasIdAndAuditing::getId).switchIfEmpty(
                Mono.defer(() -> {
                    if(FieldName.isGID(id)) {
                        return organizationRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
                    }
                    return Mono.just(id);
                }));
    }

    public Mono<String> convertGroupIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return groupRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
        }
        return Mono.just(id);
    }

    public Mono<String> convertLibraryQueryIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return libraryQueryRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
        }
        return Mono.just(id);
    }

    public Mono<Optional<String>> convertFolderIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return folderRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId).map(Optional::ofNullable).switchIfEmpty(Mono.just(Optional.empty()));
        }
        return Mono.just(Optional.ofNullable(id));
    }

    public Mono<String> convertBundleIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return bundleRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
        }
        return Mono.just(id);
    }
}

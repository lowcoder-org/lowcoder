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
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Optional;

@Component
public class GidService {
    private static final String FOLDER_NOT_EXIST_KEY = "FOLDER_NOT_EXIST";

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

    /**
     * The object id of a folder named by its object id or its gid; empty for no id (null), which the folder endpoints read as
     * the root folder. A gid that no folder has is the error {@code FOLDER_NOT_EXIST} (BF-152, BF-158, BF-159): it used to be
     * empty too, so a move to it moved to the root, a delete of it targeted the whole folder tree, and a permission change
     * failed with a NullPointerException.
     * <p>
     * Limits: an id without a hyphen is not looked up here and is answered as given; whether such a folder exists is left to
     * the caller, as before.
     */
    public Mono<Optional<String>> convertFolderIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return folderRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId).map(Optional::of)
                    .switchIfEmpty(Mono.error(() -> new BizException(BizError.FOLDER_NOT_EXIST, FOLDER_NOT_EXIST_KEY, id)));
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

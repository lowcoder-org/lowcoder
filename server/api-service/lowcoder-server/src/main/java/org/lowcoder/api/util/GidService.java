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
    private static final String CANT_FIND_APPLICATION_KEY = "CANT_FIND_APPLICATION";

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

    /**
     * Converts the id a client sends for an application: a slug match whose application has an id gives that id, for any id;
     * otherwise (no slug match, or one without an id) an id with a hyphen ({@code FieldName.isGID}) is looked up as a gid, and
     * any other id is passed through unchanged and not checked. An id with a hyphen that matches no slug and then no
     * application gid, or whose application has no id, is the error {@code NO_RESOURCE_FOUND} with the key
     * {@code CANT_FIND_APPLICATION} and the id as its argument (NEW-30): the same error, not the same lookup, as
     * {@code ApplicationServiceImpl#findById} gives for an object id that names nothing; the texts of that key have no
     * placeholder, so the message does not show the id. It used to be empty, so an endpoint that converts with it answered an
     * empty 200.
     * <p>
     * Limits: an id without a hyphen that is no slug is answered as given, and whether such an application exists is left to
     * the caller, as before; the method does not defend against a null id (its HTTP callers never pass one: their ids are path
     * variables or required parameters); the datasource, group, library query and bundle converters, and the organization
     * converter after its slug lookup, still answer a gid that names nothing with an empty {@code Mono}.
     */
    public Mono<String> convertApplicationIdToObjectId(String id) {
        return applicationRepository.findBySlug(id).next().mapNotNull(HasIdAndAuditing::getId).switchIfEmpty(
                Mono.defer(() -> {
                    if (FieldName.isGID(id)) {
                        return applicationRepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId)
                                .switchIfEmpty(Mono.error(() -> new BizException(BizError.NO_RESOURCE_FOUND, CANT_FIND_APPLICATION_KEY, id)));
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

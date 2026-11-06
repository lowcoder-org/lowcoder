package org.lowcoder.api.util;

import org.apache.commons.lang3.StringUtils;
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
import org.lowcoder.domain.util.IdGidOrSlugLookup;
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
     * Converts the key a client sends for an application to its object id (NEW-78), as {@code IdGidOrSlugLookup.find} decides: a
     * key with a hyphen ({@code FieldName.isGID}) is looked up as a gid and any other key as an object id, and only a key that
     * names no application that way is looked up as a slug, answered when exactly one application has it. A slug several
     * applications share, and a key with a hyphen that names no application by gid or slug (NEW-30), are the error
     * {@code NO_RESOURCE_FOUND} with the key {@code CANT_FIND_APPLICATION} and the key as its argument (the texts of that key have
     * no placeholder). A key without a hyphen that names nothing is answered as given, and so is a blank key (empty or
     * whitespace), with no query (NEW-86's rule).
     * <p>
     * Limits: the slug lookup is not scoped to the caller's organization, so a slug only another organization's application has
     * resolves to it, before any permission check, and a slug two organizations' applications share is refused for everyone; no
     * index makes slugs unique (NEW-87); a gid two applications share resolves to the first; whether an application exists for a
     * key without a hyphen that names nothing is left to the caller, as before; a null key is not defended (its HTTP callers
     * pass path variables or required parameters); the datasource, group, library query and bundle converters, and the
     * organization converter after its slug lookup, still answer a gid that names nothing with an empty {@code Mono}.
     */
    public Mono<String> convertApplicationIdToObjectId(String id) {
        return IdGidOrSlugLookup.find(id, applicationRepository::findById, applicationRepository::findByGid,
                        applicationRepository::findBySlug, () -> new BizException(BizError.NO_RESOURCE_FOUND, CANT_FIND_APPLICATION_KEY, id))
                .mapNotNull(HasIdAndAuditing::getId)
                .switchIfEmpty(Mono.defer(() -> FieldName.isGID(id)
                        ? Mono.error(() -> new BizException(BizError.NO_RESOURCE_FOUND, CANT_FIND_APPLICATION_KEY, id))
                        : Mono.just(id)));
    }

    public Mono<String> convertDatasourceIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            return datasourceDORepository.findByGid(id).next().mapNotNull(HasIdAndAuditing::getId);
        }
        return Mono.just(id);
    }

    /**
     * The object id an organization key names: a slug match first, then a gid for a key with a hyphen, otherwise the
     * key itself. A blank key (empty or whitespace) is not looked up as a slug and is answered as given (NEW-86).
     * Limits: a null key is not defended (its HTTP callers pass path variables, or a parameter refused when blank); a
     * gid that names nothing answers empty, as before.
     */
    public Mono<String> convertOrganizationIdToObjectId(String id) {
        if (StringUtils.isBlank(id)) {
            return Mono.just(id);
        }
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

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

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

    public String convertApplicationIdToObjectId(String applicationId) {
        if(FieldName.isGID(applicationId)) {
            Application app = applicationRepository.findByGid(applicationId).blockFirst();
            return app!=null?app.getId():"";
        }
        return applicationId;
    }

    public String convertDatasourceIdToObjectId(String id) {
        if(FieldName.isGID(id)) {
            DatasourceDO datasourceDO = datasourceDORepository.findByGid(id).blockFirst();
            return datasourceDO!=null?datasourceDO.getId():"";
        }
        return id;
    }

    public String convertOrganizationIdToObjectId(String Id) {
        if(FieldName.isGID(Id)) {
            Organization org = organizationRepository.findByGid(Id).blockFirst();
            return org!=null?org.getId():"";
        }
        return Id;
    }

    public String convertGroupIdToObjectId(String Id) {
        if(FieldName.isGID(Id)) {
            Group group = groupRepository.findByGid(Id).blockFirst();
            return group!=null?group.getId():"";
        }
        return Id;
    }

    public String convertLibraryQueryIdToObjectId(String Id) {
        if(FieldName.isGID(Id)) {
            LibraryQuery libraryQuery = libraryQueryRepository.findByGid(Id).blockFirst();
            return libraryQuery!=null?libraryQuery.getId():"";
        }
        return Id;
    }

    public String convertFolderIdToObjectId(String Id) {
        if(FieldName.isGID(Id)) {
            Folder folder = folderRepository.findByGid(Id).blockFirst();
            return folder!=null?folder.getId():"";
        }
        return Id;
    }

    public String convertBundleIdToObjectId(String Id) {
        if(FieldName.isGID(Id)) {
            Bundle bundle = bundleRepository.findByGid(Id).blockFirst();
            return bundle!=null?bundle.getId():"";
        }
        return Id;
    }
}

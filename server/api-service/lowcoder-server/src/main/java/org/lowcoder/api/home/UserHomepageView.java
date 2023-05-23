package org.lowcoder.api.home;

import java.util.List;

import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.user.model.User;

public class UserHomepageView {

    private User user;
    private Organization organization;
    private List<ApplicationInfoView> applicationInfoViews;

    private List<FolderInfoView> folderInfoViews;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public List<ApplicationInfoView> getHomeApplicationViews() {
        return applicationInfoViews;
    }

    public void setHomeApplicationViews(List<ApplicationInfoView> applicationInfoViews) {
        this.applicationInfoViews = applicationInfoViews;
    }

    public List<FolderInfoView> getFolderInfoViews() {
        return folderInfoViews;
    }

    public void setFolderInfoViews(List<FolderInfoView> folderInfoViews) {
        this.folderInfoViews = folderInfoViews;
    }
}

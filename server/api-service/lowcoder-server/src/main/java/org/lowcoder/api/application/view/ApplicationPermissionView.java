package org.lowcoder.api.application.view;

import org.lowcoder.api.permission.view.CommonPermissionView;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class ApplicationPermissionView extends CommonPermissionView {

    private boolean publicToAll;
    private boolean publicToMarketplace;
    private boolean agencyProfile;

    public boolean isPublicToAll() {
        return publicToAll;
    }

    public boolean isPublicToMarketplace() {
        return publicToMarketplace;
    }

    public boolean isAgencyProfile() {
        return agencyProfile;
    }
}

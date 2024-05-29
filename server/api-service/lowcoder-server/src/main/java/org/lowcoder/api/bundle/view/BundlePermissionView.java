package org.lowcoder.api.bundle.view;

import lombok.experimental.SuperBuilder;
import org.lowcoder.api.permission.view.CommonPermissionView;
@SuperBuilder
public class BundlePermissionView extends CommonPermissionView {

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

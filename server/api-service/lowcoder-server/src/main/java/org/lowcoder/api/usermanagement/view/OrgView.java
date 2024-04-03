package org.lowcoder.api.usermanagement.view;

import jakarta.annotation.Nonnull;
import org.lowcoder.domain.organization.model.Organization;

public class OrgView {

    private final Organization organization;

    public OrgView(@Nonnull Organization organization) {
        this.organization = organization;
    }

    public String getOrgId() {
        return organization.getId();
    }

    public String getOrgName() {
        return organization.getName();
    }


}

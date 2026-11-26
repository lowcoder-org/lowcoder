package org.lowcoder.api.usermanagement.view;

import jakarta.annotation.Nonnull;
import org.lowcoder.domain.organization.model.Organization;

/**
 * What the anonymous lookup of the workspaces of an e-mail address answers per workspace: the id the sign-in and sign-up pages
 * send on, and the name they show when there are several. Nothing else of the workspace is exposed to an anonymous caller.
 */
public class OrgLoginChoiceView {

    private final Organization organization;

    public OrgLoginChoiceView(@Nonnull Organization organization) {
        this.organization = organization;
    }

    public String getOrgId() {
        return organization.getId();
    }

    public String getOrgName() {
        return organization.getName();
    }
}

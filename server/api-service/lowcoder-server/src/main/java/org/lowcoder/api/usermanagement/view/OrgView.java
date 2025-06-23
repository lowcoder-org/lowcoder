package org.lowcoder.api.usermanagement.view;

import jakarta.annotation.Nonnull;
import org.lowcoder.domain.organization.model.Organization;
import java.time.Instant;

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

    public Instant getCreatedAt() { return organization.getCreatedAt(); }

    public Instant getUpdatedAt() { return organization.getUpdatedAt(); }
}

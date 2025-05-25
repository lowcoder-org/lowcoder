package org.lowcoder.api.usermanagement.view;

import org.lowcoder.domain.organization.model.OrganizationState;

public class UpdateOrgRequest {

    private String orgName;

    private String contactName;

    private String contactEmail;

    private String contactPhoneNumber;

    private OrganizationState state;

    public OrganizationState getState() {
        return state;
    }

    public void setState(OrganizationState state) {
        this.state = state;
    }

    public String getOrgName() {
        return orgName;
    }

    public void setOrgName(String orgName) {
        this.orgName = orgName;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhoneNumber() {
        return contactPhoneNumber;
    }

    public void setContactPhoneNumber(String contactPhoneNumber) {
        this.contactPhoneNumber = contactPhoneNumber;
    }
}

package org.lowcoder.domain.authentication.context;

import lombok.Getter;

@Getter
public class FormAuthRequestContext extends AuthRequestContext {

    /**
     * phone or email for now.
     */
    private final String loginId;
    private final String password;
    private final boolean register;

    public FormAuthRequestContext(String loginId, String password, boolean register, String orgId) {
        this.loginId = loginId;
        this.password = password;
        this.register = register;
        this.setOrgId(orgId);
    }
}

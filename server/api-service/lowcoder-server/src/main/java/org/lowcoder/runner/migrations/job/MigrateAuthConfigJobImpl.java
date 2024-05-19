package org.lowcoder.runner.migrations.job;

import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MigrateAuthConfigJobImpl implements MigrateAuthConfigJob {

    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private CommonConfig commonConfig;
    @Autowired
    private AuthProperties authProperties;
    @Autowired
    private OrganizationRepository organizationRepository;

    @Override
    public void migrateAuthConfig() {
        if (commonConfig.getWorkspace().getMode() == WorkspaceMode.SAAS) {
            organizationRepository.findByOrganizationDomainIsNotNull()
                    .doOnNext(organization -> organization.getAuthConfigs()
                            .forEach(abstractAuthConfig -> {
                                abstractAuthConfig.setId(IDUtils.generate());
                                abstractAuthConfig.setEnable(true);
                                abstractAuthConfig.setEnableRegister(true);
                            }))
                    .flatMap(organization -> organizationService.update(organization.getId(), organization))
                    .blockLast();
        } else {
            organizationService.getOrganizationInEnterpriseMode()
                    .doOnNext(organization -> setAuthConfigs2OrganizationDomain(organization, authProperties.getAuthConfigs()))
                    .flatMap(organization -> organizationService.update(organization.getId(), organization))
                    .block();
        }
    }

    protected void setAuthConfigs2OrganizationDomain(Organization organization, List<AbstractAuthConfig> authConfigs) {
        if (CollectionUtils.isEmpty(authConfigs)) {
            return;
        }
        OrganizationDomain domain = organization.getOrganizationDomain();
        if (domain == null) {
            domain = new OrganizationDomain();
            organization.setOrganizationDomain(domain);
        }
        authConfigs.forEach(abstractAuthConfig -> abstractAuthConfig.setId(IDUtils.generate()));
        domain.setConfigs(authConfigs);
    }
}

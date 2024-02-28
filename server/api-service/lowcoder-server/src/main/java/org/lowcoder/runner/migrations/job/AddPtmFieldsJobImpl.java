package org.lowcoder.runner.migrations.job;

import org.lowcoder.domain.application.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AddPtmFieldsJobImpl implements AddPtmFieldsJob {

    @Autowired
    private ApplicationService applicationService;

    @Override
    public void migrateApplicationsToInitPtmFields() {
        applicationService.findAll()
                .doOnNext(application -> {
                    if(!application.isPublicToAll()) {
                        application.setPublicToAll(Boolean.FALSE);
                    }
                    if(!application.isPublicToMarketplace()) {
                        application.setPublicToMarketplace(Boolean.FALSE);
                    }
                    if(!application.agencyProfile()) {
                        application.setAgencyProfile(Boolean.FALSE);
                    }
                }).flatMap(application -> applicationService.updateById(application.getId(), application))
                .blockLast();
    }
}

package org.lowcoder.api.application;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationCombineId;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.lowcoder.api.util.ViewBuilder.multiBuild;
import static org.lowcoder.sdk.exception.BizError.APPLICATION_AND_ORG_NOT_MATCH;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@Service
public class ApplicationRecordApiServiceImpl implements ApplicationRecordApiService {

    private final ApplicationService applicationService;
    private final ApplicationRecordService applicationRecordService;
    private final ApplicationApiServiceImpl applicationApiService;
    private final SessionUserService sessionUserService;
    private final OrgDevChecker orgDevChecker;
    private final UserService userService;

    @Override
    public Mono<Map<String, Object>> getRecordDSLFromApplicationCombineId(ApplicationCombineId applicationCombineId) {
        return checkApplicationRecordViewPermission(applicationCombineId)
                .then(Mono.defer(() -> {
                    if (applicationCombineId.isUsingLiveRecord()) {
                        return applicationService.getLiveDSLByApplicationId(applicationCombineId.applicationId());
                    }
                    return applicationRecordService.getById(applicationCombineId.applicationRecordId())
                            .map(ApplicationVersion::getApplicationDSL);
                }));
    }

    @Override
    public Mono<Void> delete(String id) {
        return checkApplicationRecordManagementPermission(id)
                .then(applicationRecordService.deleteById(id));
    }

    @Override
    public Mono<List<ApplicationRecordMetaView>> getByApplicationId(String applicationId) {
        return applicationRecordService.getByApplicationId(applicationId)
                .flatMap(applicationRecords -> multiBuild(applicationRecords,
                        ApplicationVersion::getCreatedBy,
                        userService::getByIds,
                        ApplicationRecordMetaView::from
                ));
    }


    Mono<Void> checkApplicationRecordManagementPermission(String applicationRecordId) {
        return orgDevChecker.checkCurrentOrgDev()
                .then(sessionUserService.getVisitorOrgMemberCache())
                .zipWith(applicationRecordService.getById(applicationRecordId)
                        .flatMap(applicationRecord -> applicationService.findById(applicationRecord.getApplicationId())))
                .flatMap(tuple2 -> {
                    OrgMember orgMember = tuple2.getT1();
                    Application application = tuple2.getT2();
                    if (!orgMember.getOrgId().equals(application.getOrganizationId())) {
                        return ofError(APPLICATION_AND_ORG_NOT_MATCH, "APPLICATION_AND_ORG_NOT_MATCH");
                    }
                    return Mono.empty();
                });
    }

    Mono<Void> checkApplicationRecordViewPermission(ApplicationCombineId applicationCombineId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(Mono.defer(() -> {
                    if (applicationCombineId.isUsingLiveRecord()) {
                        return applicationService.findById(applicationCombineId.applicationId());
                    }
                    return applicationRecordService.getById(applicationCombineId.applicationRecordId())
                            .flatMap(applicationRecord -> applicationService.findById(applicationRecord.getApplicationId()));

                }))
                .flatMap(tuple2 -> {
                    OrgMember orgMember = tuple2.getT1();
                    Application application = tuple2.getT2();
                    if (!orgMember.getOrgId().equals(application.getOrganizationId())) {
                        return ofError(APPLICATION_AND_ORG_NOT_MATCH, "APPLICATION_AND_ORG_NOT_MATCH");
                    }
                    return Mono.empty();
                });
    }


}

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
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.lowcoder.api.util.ViewBuilder.multiBuild;
import static org.lowcoder.domain.permission.model.ResourceAction.EDIT_APPLICATIONS;
import static org.lowcoder.sdk.exception.BizError.APPLICATION_AND_ORG_NOT_MATCH;
import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;
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
    private final ResourcePermissionService resourcePermissionService;

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

    /**
     * The versions of an application of the visitor's organization; another organization's is APPLICATION_AND_ORG_NOT_MATCH,
     * as for the record DSL and the delete (BF-012). Limit: unlike the record DSL (D-32), this still checks the
     * organization only, not EDIT_APPLICATIONS on the application itself; the delete still checks the developer role and
     * the organization only.
     */
    @Override
    public Mono<List<ApplicationRecordMetaView>> getByApplicationId(String applicationId) {
        return checkApplicationOfVisitorOrg(applicationService.findById(applicationId))
                .then(applicationRecordService.getByApplicationId(applicationId))
                .flatMap(applicationRecords -> multiBuild(applicationRecords,
                        ApplicationVersion::getCreatedBy,
                        userService::getByIds,
                        ApplicationRecordMetaView::from
                ));
    }


    Mono<Void> checkApplicationRecordManagementPermission(String applicationRecordId) {
        return orgDevChecker.checkCurrentOrgDev()
                .then(checkApplicationOfVisitorOrg(applicationRecordService.getById(applicationRecordId)
                        .flatMap(applicationRecord -> applicationService.findById(applicationRecord.getApplicationId()))));
    }

    /**
     * Workspace match, then EDIT_APPLICATIONS on the record's own application (D-32); an empty visitor id is
     * NOT_AUTHORIZED.
     */
    Mono<Void> checkApplicationRecordViewPermission(ApplicationCombineId applicationCombineId) {
        return Mono.defer(() -> {
            if (applicationCombineId.isUsingLiveRecord()) {
                return applicationService.findById(applicationCombineId.applicationId());
            }
            return applicationRecordService.getById(applicationCombineId.applicationRecordId())
                    .flatMap(applicationRecord -> applicationService.findById(applicationRecord.getApplicationId()));
        }).flatMap(application -> checkApplicationOfVisitorOrg(Mono.just(application))
                .then(Mono.defer(() -> checkEditable(application))));
    }

    private Mono<Void> checkEditable(Application application) {
        return sessionUserService.getVisitorId()
                .switchIfEmpty(ofError(NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .flatMap(visitorId -> resourcePermissionService.checkResourcePermissionWithError(visitorId, application.getId(), EDIT_APPLICATIONS));
    }

    /** The application belongs to the visitor's current organization, else APPLICATION_AND_ORG_NOT_MATCH. */
    private Mono<Void> checkApplicationOfVisitorOrg(Mono<Application> applicationMono) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(applicationMono)
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

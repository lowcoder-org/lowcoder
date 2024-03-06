package org.lowcoder.api.application;

import static org.apache.commons.collections4.SetUtils.emptyIfNull;
import static org.lowcoder.infra.event.EventType.APPLICATION_CREATE;
import static org.lowcoder.infra.event.EventType.APPLICATION_DELETE;
import static org.lowcoder.infra.event.EventType.APPLICATION_RECYCLED;
import static org.lowcoder.infra.event.EventType.APPLICATION_RESTORE;
import static org.lowcoder.infra.event.EventType.APPLICATION_UPDATE;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.List;

import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
// should we not have a AgencyApplicationInfoView
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.infra.event.EventType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class ApplicationController implements ApplicationEndpoints {

    private final UserHomeApiService userHomeApiService;
    private final ApplicationApiService applicationApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final SessionUserService sessionUserService;

    @Override
    public Mono<ResponseView<ApplicationView>> create(@RequestBody CreateApplicationRequest createApplicationRequest) {
        return applicationApiService.create(createApplicationRequest)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> createFromTemplate(@RequestParam String templateId) {
        return applicationApiService.createFromTemplate(templateId)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> recycle(@PathVariable String applicationId) {
        return applicationApiService.recycle(applicationId)
                .delayUntil(__ -> businessEventPublisher.publishApplicationCommonEvent(applicationId, null, APPLICATION_RECYCLED))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> restore(@PathVariable String applicationId) {
        return applicationApiService.restore(applicationId)
                .delayUntil(__ -> businessEventPublisher.publishApplicationCommonEvent(applicationId, null, APPLICATION_RESTORE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<ApplicationInfoView>>> getRecycledApplications() {
        return applicationApiService.getRecycledApplications()
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> delete(@PathVariable String applicationId) {
        return applicationApiService.delete(applicationId)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_DELETE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getEditingApplication(@PathVariable String applicationId) {
        return applicationApiService.getEditingApplication(applicationId)
                .delayUntil(__ -> applicationApiService.updateUserApplicationLastViewTime(applicationId))
                .map(ResponseView::success);
    }

    // will call the check in ApplicationApiService and ApplicationService
    @Override
    public Mono<ResponseView<ApplicationView>> getPublishedApplication(@PathVariable String applicationId) {
        return applicationApiService.getPublishedApplication(applicationId, ApplicationRequestType.PUBLIC_TO_ALL)
                .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(applicationId))
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, EventType.VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getPublishedMarketPlaceApplication(@PathVariable String applicationId) {
        return applicationApiService.getPublishedApplication(applicationId, ApplicationRequestType.PUBLIC_TO_MARKETPLACE)
                .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(applicationId))
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, EventType.VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getAgencyProfileApplication(@PathVariable String applicationId) {
        return applicationApiService.getPublishedApplication(applicationId, ApplicationRequestType.AGENCY_PROFILE)
                .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(applicationId))
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, EventType.VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> update(@PathVariable String applicationId,
            @RequestBody Application newApplication) {
        return applicationApiService.update(applicationId, newApplication)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_UPDATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> publish(@PathVariable String applicationId) {
        return applicationApiService.publish(applicationId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<UserHomepageView>> getUserHomePage(@RequestParam(required = false, defaultValue = "0") int applicationType) {
        ApplicationType type = ApplicationType.fromValue(applicationType);
        return userHomeApiService.getUserHomePageView(type)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<ApplicationInfoView>>> getApplications(@RequestParam(required = false) Integer applicationType,
            @RequestParam(required = false) ApplicationStatus applicationStatus,
            @RequestParam(defaultValue = "true") boolean withContainerSize) {
        ApplicationType applicationTypeEnum = applicationType == null ? null : ApplicationType.fromValue(applicationType);
        return userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(applicationTypeEnum, applicationStatus, withContainerSize)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<MarketplaceApplicationInfoView>>> getMarketplaceApplications(@RequestParam(required = false) Integer applicationType) {
        ApplicationType applicationTypeEnum = applicationType == null ? null : ApplicationType.fromValue(applicationType);
        return userHomeApiService.getAllMarketplaceApplications(applicationTypeEnum)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<MarketplaceApplicationInfoView>>> getAgencyProfileApplications(@RequestParam(required = false) Integer applicationType) {
        ApplicationType applicationTypeEnum = applicationType == null ? null : ApplicationType.fromValue(applicationType);
        return userHomeApiService.getAllAgencyProfileApplications(applicationTypeEnum)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> updatePermission(@PathVariable String applicationId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest) {
        ResourceRole role = ResourceRole.fromValue(updatePermissionRequest.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", updatePermissionRequest);
        }

        return applicationApiService.updatePermission(applicationId, permissionId, role)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> removePermission(
            @PathVariable String applicationId,
            @PathVariable String permissionId) {

        return applicationApiService.removePermission(applicationId, permissionId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> grantPermission(
            @PathVariable String applicationId,
            @RequestBody BatchAddPermissionRequest request) {
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return applicationApiService.grantPermission(applicationId,
                        emptyIfNull(request.userIds()),
                        emptyIfNull(request.groupIds()),
                        role)
                .map(ResponseView::success);
    }


    @Override
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String applicationId) {
        return applicationApiService.getApplicationPermissions(applicationId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationPublicToAll(@PathVariable String applicationId,
            @RequestBody ApplicationPublicToAllRequest request) {
        return applicationApiService.setApplicationPublicToAll(applicationId, request.publicToAll())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationPublicToMarketplace(@PathVariable String applicationId,
                                                                         @RequestBody ApplicationPublicToMarketplaceRequest request) {
        return applicationApiService.setApplicationPublicToMarketplace(applicationId, request)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationAsAgencyProfile(@PathVariable String applicationId,
                                                                     @RequestBody ApplicationAsAgencyProfileRequest request) {
        return applicationApiService.setApplicationAsAgencyProfile(applicationId, request.agencyProfile())
                .map(ResponseView::success);
    }


}

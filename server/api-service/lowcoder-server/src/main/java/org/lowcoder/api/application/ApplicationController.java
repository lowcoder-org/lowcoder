package org.lowcoder.api.application;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.application.view.*;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Objects;

import static org.apache.commons.collections4.SetUtils.emptyIfNull;
import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.*;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@RestController
public class ApplicationController implements ApplicationEndpoints {

    private final UserHomeApiService userHomeApiService;
    private final ApplicationApiService applicationApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final SessionUserService sessionUserService;
    private final GidService gidService;
    private final ApplicationRecordService applicationRecordService;

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
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.recycle(appId)
                    .delayUntil(__ -> businessEventPublisher.publishApplicationCommonEvent(applicationId, null, APPLICATION_RECYCLED))
                    .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> restore(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.restore(appId)
                .delayUntil(__ -> businessEventPublisher.publishApplicationCommonEvent(applicationId, null, APPLICATION_RESTORE))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<List<ApplicationInfoView>>> getRecycledApplications(@RequestParam(required = false) String name, @RequestParam(required = false) String category) {
        return applicationApiService.getRecycledApplications(name, category)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> delete(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.delete(appId)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_DELETE))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getEditingApplication(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.getEditingApplication(appId)
                .delayUntil(__ -> applicationApiService.updateUserApplicationLastViewTime(appId))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getPublishedApplication(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.getPublishedApplication(appId, ApplicationRequestType.PUBLIC_TO_ALL)
                .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(appId))
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_VIEW))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getPublishedMarketPlaceApplication(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.getPublishedApplication(appId, ApplicationRequestType.PUBLIC_TO_MARKETPLACE)
                .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(appId))
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_VIEW))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getAgencyProfileApplication(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.getPublishedApplication(appId, ApplicationRequestType.AGENCY_PROFILE)
                .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(appId))
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_VIEW))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> update(@PathVariable String applicationId,
            @RequestBody Application newApplication) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.update(appId, newApplication)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, APPLICATION_UPDATE))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> publish(@PathVariable String applicationId,
                                                       @RequestBody(required = false) ApplicationPublishRequest applicationPublishRequest) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                    applicationRecordService.getLatestRecordByApplicationId(applicationId)
                        .map(applicationRecord -> {
                            String tag = applicationRecord.getTag(); // Assuming format is 1.0.0
                            String newtag = "1.0.0";

                            if (tag != null && tag.matches("\\d+\\.\\d+\\.\\d+")) { // Validate tag format
                                String[] parts = tag.split("\\."); // Split by "."
                                int major = Integer.parseInt(parts[0]);
                                int minor = Integer.parseInt(parts[1]);
                                int patch = Integer.parseInt(parts[2]);

                                patch++; // Increment the patch version
                                newtag = String.format("%d.%d.%d", major, minor, patch);
                            }

                            return newtag;
                        })
                        .switchIfEmpty(Mono.just("1.0.0"))
                        .flatMap(newtag -> applicationApiService.publish(appId, Objects.requireNonNullElse(applicationPublishRequest, new ApplicationPublishRequest("", newtag))))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> updateEditState(@PathVariable String applicationId, @RequestBody UpdateEditStateRequest updateEditStateRequest) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.updateEditState(appId, updateEditStateRequest)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Application>> updateSlug(@PathVariable String applicationId, @RequestBody String slug) {
        return applicationApiService.updateSlug(applicationId, slug)
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
                                                                         @RequestParam(defaultValue = "true") boolean withContainerSize,
                                                                         @RequestParam(required = false) String name,
                                                                         @RequestParam(required = false) String category,
                                                                         @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                                         @RequestParam(required = false, defaultValue = "0") Integer pageSize) {
        ApplicationType applicationTypeEnum = applicationType == null ? null : ApplicationType.fromValue(applicationType);
        var flux = userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(applicationTypeEnum, applicationStatus, withContainerSize, name, category)
                .cache();
        Mono<Long> countMono = flux.count();
        var flux1 = flux.skip((long) (pageNum - 1) * pageSize);
        if(pageSize > 0) flux1 = flux1.take(pageSize);
        return flux1.collectList().zipWith(countMono)
                .map(tuple -> PageResponseView.success(tuple.getT1(), pageNum, pageSize, Math.toIntExact(tuple.getT2())));
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
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.updatePermission(appId, permissionId, role)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> removePermission(
            @PathVariable String applicationId,
            @PathVariable String permissionId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.removePermission(appId, permissionId)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> grantPermission(
            @PathVariable String applicationId,
            @RequestBody BatchAddPermissionRequest request) {
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.grantPermission(appId,
                        emptyIfNull(request.userIds()),
                        emptyIfNull(request.groupIds()),
                        role)
                .map(ResponseView::success));
    }


    @Override
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.getApplicationPermissions(appId)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationPublicToAll(@PathVariable String applicationId,
            @RequestBody ApplicationPublicToAllRequest request) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.setApplicationPublicToAll(appId, request.publicToAll())
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationPublicToMarketplace(@PathVariable String applicationId,
                                                                         @RequestBody ApplicationPublicToMarketplaceRequest request) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.setApplicationPublicToMarketplace(appId, request)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationAsAgencyProfile(@PathVariable String applicationId,
                                                                     @RequestBody ApplicationAsAgencyProfileRequest request) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.setApplicationAsAgencyProfile(appId, request.agencyProfile())
                .map(ResponseView::success));
    }


}

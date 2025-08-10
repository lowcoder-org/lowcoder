package org.lowcoder.api.application;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.application.view.*;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.application.service.ApplicationService;
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
import reactor.core.publisher.Flux;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.ArrayList;
import java.util.HashMap;

@RequiredArgsConstructor
@RestController
public class ApplicationController implements ApplicationEndpoints {

    private final UserHomeApiService userHomeApiService;
    private final ApplicationApiService applicationApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final GidService gidService;
    private final ApplicationRecordService applicationRecordService;
    private final ApplicationService applicationService;

    @Override
    public Mono<ResponseView<ApplicationView>> create(@RequestBody CreateApplicationRequest createApplicationRequest) {
        return applicationApiService.create(createApplicationRequest)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(null, applicationView, APPLICATION_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ApplicationView>> createFromTemplate(@RequestParam String templateId) {
        return applicationApiService.createFromTemplate(templateId)
                .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(null, applicationView, APPLICATION_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> recycle(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                applicationApiService.getEditingApplication(appId, true).flatMap(originalApplicationView ->
                applicationApiService.recycle(appId)
                        .delayUntil(__ -> businessEventPublisher.publishApplicationCommonEvent(originalApplicationView, applicationId, originalApplicationView.getApplicationInfoView().getFolderId(), null, APPLICATION_RECYCLED))
                        .map(ResponseView::success)));
    }

    @Override
    public Mono<ResponseView<Boolean>> restore(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                applicationApiService.getEditingApplication(appId, true).flatMap(originalApplicationView ->
                applicationApiService.restore(appId)
                    .delayUntil(__ -> businessEventPublisher.publishApplicationCommonEvent(originalApplicationView, applicationId, null, null, APPLICATION_RESTORE))
                    .map(ResponseView::success)));
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
                applicationApiService.getEditingApplication(appId, true).flatMap(originalApplicationView ->
                applicationApiService.delete(appId)
                    .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(originalApplicationView, applicationView, APPLICATION_DELETE))
                    .map(ResponseView::success)));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getEditingApplication(@PathVariable String applicationId, @RequestParam(required = false) Boolean withDeleted) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.getEditingApplication(appId, withDeleted)
                .delayUntil(__ -> applicationApiService.updateUserApplicationLastViewTime(appId))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getPublishedApplication(@PathVariable String applicationId, @RequestParam(required = false) Boolean withDeleted) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                applicationApiService.getPublishedApplication(appId, ApplicationRequestType.PUBLIC_TO_ALL, withDeleted)
                    .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(appId))
                    .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, applicationView, APPLICATION_VIEW))
                    .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getPublishedMarketPlaceApplication(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                applicationApiService.getPublishedApplication(appId, ApplicationRequestType.PUBLIC_TO_MARKETPLACE, false)
                    .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(appId))
                    .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, applicationView, APPLICATION_VIEW))
                    .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> getAgencyProfileApplication(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                applicationApiService.getPublishedApplication(appId, ApplicationRequestType.AGENCY_PROFILE, false)
                    .delayUntil(applicationView -> applicationApiService.updateUserApplicationLastViewTime(appId))
                    .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(applicationView, applicationView, APPLICATION_VIEW))
                    .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<ApplicationView>> update(@PathVariable String applicationId,
            @RequestBody Application newApplication,
            @RequestParam(required = false) Boolean updateStatus) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                applicationApiService.getEditingApplication(appId, true).flatMap(originalApplicationView ->
                    applicationApiService.update(appId, newApplication, updateStatus)
                        .delayUntil(applicationView -> businessEventPublisher.publishApplicationCommonEvent(originalApplicationView, applicationView, APPLICATION_UPDATE))
                        .map(ResponseView::success)));
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
                        .delayUntil(newtag -> {
                            ApplicationPublishRequest req = Objects.requireNonNullElse(applicationPublishRequest, new ApplicationPublishRequest("", newtag));
                            return businessEventPublisher.publishApplicationPublishEvent(appId, req).then(Mono.defer(() -> {
                                if(newtag.equals(req.tag())) {
                                    return businessEventPublisher.publishApplicationVersionChangeEvent(appId, newtag);
                                } else return Mono.empty();
                            }));
                        })
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
                    .delayUntil(__ -> businessEventPublisher.publishApplicationPermissionEvent(applicationId, null, null, permissionId, role.getValue()))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> removePermission(
            @PathVariable String applicationId,
            @PathVariable String permissionId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.removePermission(appId, permissionId)
                    .delayUntil(__ -> businessEventPublisher.publishApplicationPermissionEvent(applicationId, null, null, permissionId, null))
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
                    .delayUntil(__ -> businessEventPublisher.publishApplicationPermissionEvent(applicationId, emptyIfNull(request.userIds()), emptyIfNull(request.groupIds()), null, role.getValue()))
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
                    .delayUntil(__ -> applicationApiService.getApplicationPermissions(appId)
                            .flatMap(applicationPermissionView -> businessEventPublisher.publishApplicationSharingEvent(applicationId, "PublicToAll", applicationPermissionView)))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationPublicToMarketplace(@PathVariable String applicationId,
                                                                         @RequestBody ApplicationPublicToMarketplaceRequest request) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.setApplicationPublicToMarketplace(appId, request)
                    .delayUntil(__ -> applicationApiService.getApplicationPermissions(appId)
                            .flatMap(applicationPermissionView -> businessEventPublisher.publishApplicationSharingEvent(applicationId, "PublicToMarketplace", applicationPermissionView)))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setApplicationAsAgencyProfile(@PathVariable String applicationId,
                                                                     @RequestBody ApplicationAsAgencyProfileRequest request) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            applicationApiService.setApplicationAsAgencyProfile(appId, request.agencyProfile())
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<List<Object>>> getGroupsOrMembersWithoutPermissions(
            @PathVariable String applicationId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "1") Integer pageNum,
            @RequestParam(required = false, defaultValue = "1000") Integer pageSize) {

        return gidService.convertLibraryQueryIdToObjectId(applicationId).flatMap(appId -> {
            var flx = applicationApiService.getGroupsOrMembersWithoutPermissions(appId)
                    .flatMapMany(Flux::fromIterable)
                    .filter(item -> {
                        if (search == null || search.isBlank()) return true;
                        if (!(item instanceof Map map)) return false;
                        Object type = map.get("type");
                        Object data = map.get("data");
                        if ("Group".equals(type) && data instanceof org.lowcoder.api.usermanagement.view.GroupView group) {
                            return group.getGroupName() != null && group.getGroupName().toLowerCase().contains(search.toLowerCase());
                        }
                        if ("User".equals(type) && data instanceof org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView user) {
                            return user.getName() != null && user.getName().toLowerCase().contains(search.toLowerCase());
                        }
                        return false;
                    })
                    .cache();
            var countMono = flx.count();
            var flux1 = flx.skip((long) (pageNum - 1) * pageSize);
            if (pageSize > 0) flux1 = flux1.take(pageSize);
            return flux1.collectList()
                    .zipWith(countMono)
                    .map(tuple -> PageResponseView.success(tuple.getT1(), pageNum, pageSize, Math.toIntExact(tuple.getT2())));
        });
    }

    @Override
    @GetMapping("/{applicationId}/manifest.json")
    public Mono<ResponseEntity<String>> getApplicationManifest(@PathVariable String applicationId) {
        return gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
            // Prefer published DSL; if absent, fall back to current editing DSL directly from DB
            applicationRecordService.getLatestRecordByApplicationId(appId)
                .map(record -> record.getApplicationDSL())
                .switchIfEmpty(
                    applicationService.findById(appId)
                        .map(app -> app.getEditingApplicationDSL())
                )
                .map(dsl -> {
                    Map<String, Object> safeDsl = dsl == null ? new HashMap<>() : dsl;
                    Map<String, Object> settings = (Map<String, Object>) safeDsl.get("settings");

                    String defaultName = "Lowcoder";
                    String appTitle = defaultName;
                    if (settings != null) {
                        Object titleObj = settings.get("title");
                        if (titleObj instanceof String) {
                            String t = (String) titleObj;
                            if (!t.isBlank()) {
                                appTitle = t;
                            }
                        }
                    }
                    String appDescription = settings != null && settings.get("description") instanceof String
                            ? (String) settings.get("description")
                            : "";
                    if (appDescription == null) appDescription = "";
                    String appIcon = settings != null ? (String) settings.get("icon") : "";

                    // Generate manifest JSON
                    Map<String, Object> manifest = new HashMap<>();
                    manifest.put("name", appTitle);
                    manifest.put("short_name", appTitle != null && appTitle.length() > 12 ? appTitle.substring(0, 12) : (appTitle == null ? "" : appTitle));
                    manifest.put("description", appDescription);
                    // PWA routing: open the installed app directly to the public view of this application
                    String appBasePath = "/apps/" + applicationId;
                    String appStartUrl = appBasePath + "/view";
                    manifest.put("id", appBasePath);
                    manifest.put("start_url", appStartUrl);
                    manifest.put("scope", appBasePath + "/");
                    manifest.put("display", "standalone");
                    manifest.put("theme_color", "#b480de");
                    manifest.put("background_color", "#ffffff");

                    // Generate icons array (serve via icon endpoints that render PNGs)
                    List<Map<String, Object>> icons = new ArrayList<>();
                    int[] sizes = new int[] {48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512};
                    for (int s : sizes) {
                        Map<String, Object> icon = new HashMap<>();
                        icon.put("src", "/api/applications/" + applicationId + "/icons/" + s + ".png");
                        icon.put("sizes", s + "x" + s);
                        icon.put("type", "image/png");
                        icon.put("purpose", "any maskable");
                        icons.add(icon);
                    }
                    manifest.put("icons", icons);

                    // Optional categories for better store/system grouping
                    List<String> categories = new ArrayList<>();
                    categories.add("productivity");
                    categories.add("business");
                    manifest.put("categories", categories);

                    // Add shortcuts for quick actions
                    List<Map<String, Object>> shortcuts = new ArrayList<>();
                    // View (start) shortcut
                    Map<String, Object> viewShortcut = new HashMap<>();
                    viewShortcut.put("name", appTitle);
                    viewShortcut.put("short_name", appTitle != null && appTitle.length() > 12 ? appTitle.substring(0, 12) : (appTitle == null ? "" : appTitle));
                    viewShortcut.put("description", appDescription);
                    viewShortcut.put("url", appStartUrl);
                    shortcuts.add(viewShortcut);
                    // Edit shortcut (may require auth)
                    Map<String, Object> editShortcut = new HashMap<>();
                    editShortcut.put("name", "Edit application");
                    editShortcut.put("short_name", "Edit");
                    editShortcut.put("description", "Open the application editor");
                    editShortcut.put("url", appBasePath);
                    shortcuts.add(editShortcut);
                    manifest.put("shortcuts", shortcuts);

                    try {
                        return ResponseEntity.ok()
                            .contentType(MediaType.valueOf("application/manifest+json"))
                            .body(new ObjectMapper().writeValueAsString(manifest));
                    } catch (JsonProcessingException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{}");
                    }
                })
                .onErrorReturn(ResponseEntity.status(HttpStatus.NOT_FOUND).body("{}"))
        );
    }
}

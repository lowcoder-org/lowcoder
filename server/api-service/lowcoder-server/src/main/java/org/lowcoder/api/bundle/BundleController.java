package org.lowcoder.api.bundle;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@RestController
public class BundleController implements BundleEndpoints
{

    private final BundleService bundleService;
    private final BundleApiService bundleApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final UserHomeApiService userHomeApiService;
    private final GidService gidService;

    @Override
    public Mono<ResponseView<BundleInfoView>> create(@RequestBody CreateBundleRequest bundle) {
        return bundleApiService.create(bundle)
                //TODO [thomasr]: add new method to BusinessEventPublisher(jar file)
//                .delayUntil(f -> businessEventPublisher.publishBundleCommonEvent(f.getBundleId(), f.getName(), EventType.BUNDLE_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.delete(objectId)
//                .delayUntil(f -> businessEventPublisher.publishBundleCommonEvent(f.getId(), f.getName(), EventType.BUNDLE_DELETE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    /**
     * update name only.
     */
    @Override
    public Mono<ResponseView<BundleInfoView>> update(@RequestBody Bundle bundle) {
        return bundleService.findById(bundle.getId())
                .zipWhen(__ -> bundleApiService.update(bundle))
//                .delayUntil(tuple2 -> {
//                    Bundle old = tuple2.getT1();
//                    return businessEventPublisher.publishBundleCommonEvent(bundle.getId(), old.getName() + " => " + bundle.getName(),
//                            EventType.BUNDLE_UPDATE);
//                })
                .map(tuple2 -> ResponseView.success(tuple2.getT2()));
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> publish(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.publish(objectId).map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> recycle(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.recycle(objectId)
//                .delayUntil(__ -> businessEventPublisher.publishBundleCommonEvent(bundleId, null, BUNDLE_RECYCLED))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> restore(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.restore(objectId)
//                .delayUntil(__ -> businessEventPublisher.publishBundleCommonEvent(bundleId, null, BUNDLE_RESTORE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<BundleInfoView>>> getRecycledBundles() {
        return bundleApiService.getRecycledBundles()
                .collectList()
                .map(ResponseView::success);
    }

    /**
     * get all files under bundle
     */
    @Override
    public Mono<ResponseView<List<?>>> getElements(@PathVariable String bundleId,
            @RequestParam(value = "applicationType", required = false) ApplicationType applicationType) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.getElements(objectId, applicationType)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> moveApp(@PathVariable("id") String applicationId,
                                            @RequestParam(value = "fromBundleId") String fromBundleId,
                                            @RequestParam(value = "toBundleId") String toBundleId) {
        String objectIdFrom = gidService.convertBundleIdToObjectId(fromBundleId);
        String objectIdTo = gidService.convertBundleIdToObjectId(toBundleId);
        String appId = gidService.convertApplicationIdToObjectId(applicationId);
        return bundleApiService.moveApp(appId, objectIdFrom, objectIdTo)
                //TODO: Event Type not defined yet
//                .then(businessEventPublisher.publishBundleCommonEvent(applicationLikeId, targetBundleId, BUNDLE_MOVE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> addApp(@PathVariable("id") String applicationId,
                                            @RequestParam(value = "toBundleId") String toBundleId) {
        String objectIdTo = gidService.convertBundleIdToObjectId(toBundleId);
        String appId = gidService.convertApplicationIdToObjectId(applicationId);
        return bundleApiService.addApp(appId, objectIdTo)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> reorder(@PathVariable("bundleId") String bundleId,
                                            @RequestParam(value = "elementIds", required = true) List<String> elementIds) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.reorder(objectId, elementIds)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }
    @Override
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String bundleId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        ResourceRole role = ResourceRole.fromValue(updatePermissionRequest.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", updatePermissionRequest);
        }

        return bundleApiService.updatePermission(objectId, permissionId, role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String bundleId,
            @PathVariable String permissionId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);

        return bundleApiService.removePermission(objectId, permissionId)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String bundleId,
            @RequestBody BatchAddPermissionRequest request) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return bundleApiService.grantPermission(objectId, request.userIds(), request.groupIds(), role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<BundlePermissionView>> getBundlePermissions(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.getPermissions(objectId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getPublishedBundle(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.getPublishedBundle(objectId, BundleRequestType.PUBLIC_TO_ALL)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getPublishedMarketPlaceBundle(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.getPublishedBundle(objectId, BundleRequestType.PUBLIC_TO_MARKETPLACE)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getAgencyProfileBundle(@PathVariable String bundleId) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.getPublishedBundle(objectId, BundleRequestType.AGENCY_PROFILE)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<BundleInfoView>>> getBundles(@RequestParam(required = false) BundleStatus bundleStatus) {
        return userHomeApiService.getAllAuthorisedBundles4CurrentOrgMember(bundleStatus)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<MarketplaceBundleInfoView>>> getMarketplaceBundles() {
        return userHomeApiService.getAllMarketplaceBundles()
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<MarketplaceBundleInfoView>>> getAgencyProfileBundles() {
        return userHomeApiService.getAllAgencyProfileBundles()
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundlePublicToAll(@PathVariable String bundleId,
                                                                 @RequestBody BundleEndpoints.BundlePublicToAllRequest request) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.setBundlePublicToAll(objectId, request.publicToAll())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundlePublicToMarketplace(@PathVariable String bundleId,
                                                                         @RequestBody BundleEndpoints.BundlePublicToMarketplaceRequest request) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.setBundlePublicToMarketplace(objectId, request)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundleAsAgencyProfile(@PathVariable String bundleId,
                                                                     @RequestBody BundleEndpoints.BundleAsAgencyProfileRequest request) {
        String objectId = gidService.convertBundleIdToObjectId(bundleId);
        return bundleApiService.setBundleAsAgencyProfile(objectId, request.agencyProfile())
                .map(ResponseView::success);
    }
}

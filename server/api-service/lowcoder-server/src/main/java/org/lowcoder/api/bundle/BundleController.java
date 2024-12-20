package org.lowcoder.api.bundle;

import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.framework.view.PageResponseView;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.lowcoder.api.util.Pagination.fluxToPageResponseView;
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
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.delete(objectId)
//                .delayUntil(f -> businessEventPublisher.publishBundleCommonEvent(f.getId(), f.getName(), EventType.BUNDLE_DELETE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
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
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.publish(objectId).map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> recycle(@PathVariable String bundleId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.recycle(objectId)
//                .delayUntil(__ -> businessEventPublisher.publishBundleCommonEvent(bundleId, null, BUNDLE_RECYCLED))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> restore(@PathVariable String bundleId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.restore(objectId)
//                .delayUntil(__ -> businessEventPublisher.publishBundleCommonEvent(bundleId, null, BUNDLE_RESTORE))
                .map(ResponseView::success));
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
    public Mono<PageResponseView<?>> getElements(@PathVariable String bundleId,
                                                   @RequestParam(value = "applicationType", required = false) ApplicationType applicationType,
                                                   @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                   @RequestParam(required = false, defaultValue = "0") Integer pageSize) {
        var flux = gidService.convertBundleIdToObjectId(bundleId).flatMapMany(objectId -> bundleApiService.getElements(objectId, applicationType)).cache();
        return fluxToPageResponseView(pageNum, pageSize, flux);
    }

    @Override
    public Mono<ResponseView<Void>> moveApp(@PathVariable("id") String applicationId,
                                            @RequestParam(value = "fromBundleId") String fromBundleId,
                                            @RequestParam(value = "toBundleId") String toBundleId) {
        return gidService.convertBundleIdToObjectId(fromBundleId).flatMap(objectIdFrom ->
            gidService.convertBundleIdToObjectId(toBundleId).flatMap(objectIdTo ->
                gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                    bundleApiService.moveApp(appId, objectIdFrom, objectIdTo)
                        //TODO: Event Type not defined yet
        //                .then(businessEventPublisher.publishBundleCommonEvent(applicationLikeId, targetBundleId, BUNDLE_MOVE))
                        .then(Mono.fromSupplier(() -> ResponseView.success(null))))));
    }

    @Override
    public Mono<ResponseView<Void>> addApp(@PathVariable("id") String applicationId,
                                            @RequestParam(value = "toBundleId") String toBundleId) {
        return gidService.convertBundleIdToObjectId(toBundleId).flatMap(objectIdTo ->
            gidService.convertApplicationIdToObjectId(applicationId).flatMap(appId ->
                bundleApiService.addApp(appId, objectIdTo)
                    .then(Mono.fromSupplier(() -> ResponseView.success(null)))));
    }

    @Override
    public Mono<ResponseView<Void>> reorder(@PathVariable("bundleId") String bundleId,
                                            @RequestParam(value = "elementIds", required = true) List<String> elementIds) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.reorder(objectId, elementIds)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }
    @Override
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String bundleId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest) {
        ResourceRole role = ResourceRole.fromValue(updatePermissionRequest.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", updatePermissionRequest);
        }

        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.updatePermission(objectId, permissionId, role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String bundleId,
            @PathVariable String permissionId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.removePermission(objectId, permissionId)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String bundleId,
            @RequestBody BatchAddPermissionRequest request) {
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.grantPermission(objectId, request.userIds(), request.groupIds(), role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<BundlePermissionView>> getBundlePermissions(@PathVariable String bundleId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.getPermissions(objectId)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getPublishedBundle(@PathVariable String bundleId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.getPublishedBundle(objectId, BundleRequestType.PUBLIC_TO_ALL)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getPublishedMarketPlaceBundle(@PathVariable String bundleId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.getPublishedBundle(objectId, BundleRequestType.PUBLIC_TO_MARKETPLACE)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getAgencyProfileBundle(@PathVariable String bundleId) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.getPublishedBundle(objectId, BundleRequestType.AGENCY_PROFILE)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success));
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
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.setBundlePublicToAll(objectId, request.publicToAll())
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundlePublicToMarketplace(@PathVariable String bundleId,
                                                                         @RequestBody BundleEndpoints.BundlePublicToMarketplaceRequest request) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.setBundlePublicToMarketplace(objectId, request)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundleAsAgencyProfile(@PathVariable String bundleId,
                                                                     @RequestBody BundleEndpoints.BundleAsAgencyProfileRequest request) {
        return gidService.convertBundleIdToObjectId(bundleId).flatMap(objectId ->
            bundleApiService.setBundleAsAgencyProfile(objectId, request.agencyProfile())
                .map(ResponseView::success));
    }
}

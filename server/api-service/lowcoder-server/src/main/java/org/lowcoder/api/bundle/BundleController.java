package org.lowcoder.api.bundle;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
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

    @Override
    public Mono<ResponseView<BundleInfoView>> create(@RequestBody CreateBundleRequest bundle) {
        return bundleApiService.create(bundle)
                //TODO [thomasr]: add new method to BusinessEventPublisher(jar file)
//                .delayUntil(f -> businessEventPublisher.publishBundleCommonEvent(f.getBundleId(), f.getName(), EventType.BUNDLE_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String bundleId) {
        return bundleApiService.delete(bundleId)
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
    public Mono<ResponseView<Boolean>> recycle(@PathVariable String bundleId) {
        return bundleApiService.recycle(bundleId)
//                .delayUntil(__ -> businessEventPublisher.publishBundleCommonEvent(bundleId, null, BUNDLE_RECYCLED))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> restore(@PathVariable String bundleId) {
        return bundleApiService.restore(bundleId)
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
        return bundleApiService.getElements(bundleId, applicationType)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> moveApp(@PathVariable("id") String applicationId,
                                            @RequestParam(value = "fromBundleId") String fromBundleId,
                                            @RequestParam(value = "toBundleId") String toBundleId) {
        return bundleApiService.moveApp(applicationId, fromBundleId, toBundleId)
                //TODO: Event Type not defined yet
//                .then(businessEventPublisher.publishBundleCommonEvent(applicationLikeId, targetBundleId, BUNDLE_MOVE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> addApp(@PathVariable("id") String applicationId,
                                            @RequestParam(value = "toBundleId") String toBundleId) {
        return bundleApiService.addApp(applicationId, toBundleId)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> reorder(@PathVariable("bundleId") String bundleId,
                                            @RequestParam(value = "elementIds", required = true) List<String> elementIds) {
        return bundleApiService.reorder(bundleId, elementIds)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }
    @Override
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String bundleId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest) {
        ResourceRole role = ResourceRole.fromValue(updatePermissionRequest.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", updatePermissionRequest);
        }

        return bundleApiService.updatePermission(bundleId, permissionId, role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String bundleId,
            @PathVariable String permissionId) {

        return bundleApiService.removePermission(bundleId, permissionId)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String bundleId,
            @RequestBody BatchAddPermissionRequest request) {
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return bundleApiService.grantPermission(bundleId, request.userIds(), request.groupIds(), role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<BundlePermissionView>> getBundlePermissions(@PathVariable String bundleId) {
        return bundleApiService.getPermissions(bundleId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getPublishedBundle(@PathVariable String bundleId) {
        return bundleApiService.getPublishedBundle(bundleId, BundleRequestType.PUBLIC_TO_ALL)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getPublishedMarketPlaceBundle(@PathVariable String bundleId) {
        return bundleApiService.getPublishedBundle(bundleId, BundleRequestType.PUBLIC_TO_MARKETPLACE)
//                .delayUntil(bundleView -> businessEventPublisher.publishBundleCommonEvent(bundleView, BUNDLE_VIEW))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<BundleInfoView>> getAgencyProfileBundle(@PathVariable String bundleId) {
        return bundleApiService.getPublishedBundle(bundleId, BundleRequestType.AGENCY_PROFILE)
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
        return bundleApiService.setBundlePublicToAll(bundleId, request.publicToAll())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundlePublicToMarketplace(@PathVariable String bundleId,
                                                                         @RequestBody BundleEndpoints.BundlePublicToMarketplaceRequest request) {
        return bundleApiService.setBundlePublicToMarketplace(bundleId, request)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> setBundleAsAgencyProfile(@PathVariable String bundleId,
                                                                     @RequestBody BundleEndpoints.BundleAsAgencyProfileRequest request) {
        return bundleApiService.setBundleAsAgencyProfile(bundleId, request.agencyProfile())
                .map(ResponseView::success);
    }
}

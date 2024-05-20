package org.lowcoder.api.bundle;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.APPLICATION_MOVE;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@RestController
public class BundleController implements BundleEndpoints
{

    private final BundleService bundleService;
    private final BundleApiService bundleApiService;
    private final BusinessEventPublisher businessEventPublisher;

    @Override
    public Mono<ResponseView<BundleInfoView>> create(@RequestBody Bundle bundle) {
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

    /**
     * get all files under bundle
     */
    @Override
    public Mono<ResponseView<List<?>>> getElements(@RequestParam(value = "id", required = false) String bundleId,
            @RequestParam(value = "applicationType", required = false) ApplicationType applicationType) {
        return bundleApiService.getElements(bundleId, applicationType)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> move(@PathVariable("id") String applicationLikeId,
            @RequestParam(value = "targetBundleId", required = false) String targetBundleId) {
        return bundleApiService.move(applicationLikeId, targetBundleId)
                .then(businessEventPublisher.publishApplicationCommonEvent(applicationLikeId, targetBundleId, APPLICATION_MOVE))
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
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String bundleId) {
        return bundleApiService.getPermissions(bundleId)
                .map(ResponseView::success);
    }
}

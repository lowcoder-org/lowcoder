package org.lowcoder.api.home;

import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.APPLICATION_MOVE;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class FolderController implements FolderEndpoints 
{

    private final FolderService folderService;
    private final FolderApiService folderApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final GidService gidService;

    @Override
    public Mono<ResponseView<FolderInfoView>> create(@RequestBody Folder folder) {
        return folderApiService.create(folder)
                .delayUntil(folderInfoView -> folderApiService.upsertLastViewTime(folderInfoView.getFolderId()))
                .delayUntil(f -> businessEventPublisher.publishFolderCommonEvent(f.getFolderId(), f.getName(), EventType.FOLDER_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String folderId) {
        return gidService.convertFolderIdToObjectId(folderId).flatMap(objectId ->
            folderApiService.delete(objectId.orElse(null))
                .delayUntil(f -> businessEventPublisher.publishFolderCommonEvent(f.getId(), f.getName(), EventType.FOLDER_DELETE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    /**
     * update name only.
     */
    @Override
    public Mono<ResponseView<FolderInfoView>> update(@RequestBody Folder folder) {
        return folderService.findById(folder.getId())
                .zipWhen(__ -> folderApiService.update(folder))
                .delayUntil(tuple2 -> {
                    Folder old = tuple2.getT1();
                    return businessEventPublisher.publishFolderCommonEvent(folder.getId(), old.getName() + " => " + folder.getName(),
                            EventType.FOLDER_UPDATE);
                })
                .map(tuple2 -> ResponseView.success(tuple2.getT2()));
    }

    /**
     * get all files under folder
     */
    @Override
    public Mono<PageResponseView<?>> getElements(@RequestParam(value = "id", required = false) String folderId,
                                                 @RequestParam(value = "applicationType", required = false) ApplicationType applicationType,
                                                 @RequestParam(required = false) String name,
                                                 @RequestParam(required = false) String category,
                                                 @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                 @RequestParam(required = false, defaultValue = "0") Integer pageSize) {
        return gidService.convertFolderIdToObjectId(folderId).flatMap(optionalObjectId -> {
            String objectId = optionalObjectId.orElse(null);
            var flux = folderApiService.getElements(optionalObjectId.orElse(null), applicationType, name, category).cache();
            var countMono = flux.count();
            var flux1 = flux.skip((long) (pageNum - 1) * pageSize);
            if (pageSize > 0) flux1 = flux1.take(pageSize);
            return flux1.collectList()
                    .delayUntil(__ -> folderApiService.upsertLastViewTime(objectId))
                    .zipWith(countMono)
                    .map(tuple -> PageResponseView.success(tuple.getT1(), pageNum, pageSize, Math.toIntExact(tuple.getT2())));
        });
    }

    @Override
    public Mono<ResponseView<Void>> move(@PathVariable("id") String applicationLikeId,
            @RequestParam(value = "targetFolderId", required = false) String targetFolderId) {
        return gidService.convertFolderIdToObjectId(targetFolderId).flatMap(objectId ->
            folderApiService.move(applicationLikeId, objectId.orElse(null))
                .then(businessEventPublisher.publishApplicationCommonEvent(applicationLikeId, objectId.orElse(null), APPLICATION_MOVE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String folderId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest) {
        ResourceRole role = ResourceRole.fromValue(updatePermissionRequest.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", updatePermissionRequest);
        }

        return gidService.convertFolderIdToObjectId(folderId).flatMap(objectId ->
            folderApiService.updatePermission(objectId.orElse(null), permissionId, role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String folderId,
            @PathVariable String permissionId) {
        return gidService.convertFolderIdToObjectId(folderId).flatMap(objectId ->
            folderApiService.removePermission(objectId.orElse(null), permissionId)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String folderId,
            @RequestBody BatchAddPermissionRequest request) {
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return gidService.convertFolderIdToObjectId(folderId).flatMap(objectId ->
            folderApiService.grantPermission(objectId.orElse(null), request.userIds(), request.groupIds(), role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null))));
    }

    @Override
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String folderId) {
        return gidService.convertFolderIdToObjectId(folderId).flatMap(objectId ->
            folderApiService.getPermissions(objectId.orElse(null))
                .map(ResponseView::success));
    }
}

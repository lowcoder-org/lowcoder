package org.lowcoder.api.application.marketplace;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.repository.ApplicationRecordRepository;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
public class MarketplacePreviewController {
    private final ApplicationService applications;
    private final ApplicationRecordRepository versions;
    private final ResourcePermissionService permissions;
    private final SessionUserService users;
    private final MarketplacePreviewStore store;

    /** Read-only: never queues, captures, loads the full app DSL or records an app view. */
    @GetMapping({Url.APPLICATION_URL + "/{applicationId}/marketplace-preview/image",
            NewUrl.APPLICATION_URL + "/{applicationId}/marketplace-preview/image"})
    public Mono<ResponseEntity<byte[]>> image(@PathVariable String applicationId,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String etag) {
        return applications.findByIdWithoutDsl(applicationId)
                .filter(MarketplacePreviewWorker::eligible)
                .flatMap(app -> users.getVisitorId()
                        .flatMap(user -> permissions.checkUserPermissionStatusOnApplication(user, app.getId(),
                                ResourceAction.READ_APPLICATIONS, ApplicationRequestType.PUBLIC_TO_MARKETPLACE))
                        .filter(status -> status.hasPermission())
                        // Require a real publication even if all published versions were deleted.
                        .flatMap(ignored -> versions.existsByApplicationId(app.getId()).filter(Boolean::booleanValue))
                        .flatMap(ignored -> store.read(app.getId())))
                .filter(preview -> preview.getImage() != null && preview.getRenderedHash() != null)
                .map(preview -> {
                    String currentEtag = "\"" + preview.getRenderedHash() + "\"";
                    // Authorization happens before both 200 and 304. Unsharing revokes future reads.
                    if (currentEtag.equals(etag)) return ResponseEntity.status(304)
                            .header(HttpHeaders.CACHE_CONTROL, "private, no-cache").eTag(currentEtag).<byte[]>build();
                    return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
                            .header(HttpHeaders.CACHE_CONTROL, "private, no-cache").eTag(currentEtag).body(preview.getImage());
                })
                .defaultIfEmpty(ResponseEntity.notFound().header(HttpHeaders.CACHE_CONTROL, "no-store").build());
    }
}

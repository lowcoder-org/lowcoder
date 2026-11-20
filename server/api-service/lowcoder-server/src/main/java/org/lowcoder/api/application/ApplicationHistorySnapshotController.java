package org.lowcoder.api.application;

import com.google.common.collect.ImmutableMap;
import lombok.RequiredArgsConstructor;
import org.lowcoder.api.application.view.HistorySnapshotDslView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.util.Pagination;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshotTS;
import org.lowcoder.domain.application.service.ApplicationHistorySnapshotService;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.lowcoder.api.util.ViewBuilder.multiBuild;
import static org.lowcoder.sdk.exception.BizError.INVALID_HISTORY_SNAPSHOT;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;

@RequiredArgsConstructor
@RestController
public class ApplicationHistorySnapshotController implements ApplicationHistorySnapshotEndpoints
{

    private final ResourcePermissionService resourcePermissionService;
    private final ApplicationHistorySnapshotService applicationHistorySnapshotService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final ApplicationService applicationService;
    private final ApplicationRecordService applicationRecordService;

    @Override
    public Mono<ResponseView<Boolean>> create(@RequestBody ApplicationHistorySnapshotRequest request) {
        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> editableApplication(visitorId, request.applicationId())
                        .map(Application::getId)
                        // D-31: stored under the object id the check ran on, never under the key the caller sent
                        .delayUntil(applicationId -> applicationHistorySnapshotService.createHistorySnapshot(applicationId,
                                request.dsl(), request.context(), visitorId))
                        .flatMap(applicationId -> applicationService.updateLastEditedAt(applicationId, Instant.now(), visitorId)))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Map<String, Object>>> listAllHistorySnapshotBriefInfo(@PathVariable String applicationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String compName,
            @RequestParam(required = false) String theme,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {

        Pagination pagination = Pagination.of(page, size).check();

        return sessionUserService.getVisitorId()
                .delayUntil(visitor -> resourcePermissionService.checkResourcePermissionWithError(visitor, applicationId,
                        ResourceAction.EDIT_APPLICATIONS))
                .flatMap(__ -> applicationHistorySnapshotService.listAllHistorySnapshotBriefInfo(applicationId, compName, theme, from, to, pagination.toPageRequest()))
                .flatMap(snapshotList -> {
                    Mono<List<ApplicationHistorySnapshotBriefInfo>> snapshotBriefInfoList = multiBuild(snapshotList,
                            ApplicationHistorySnapshot::getCreatedBy,
                            userService::getByIds,
                            (applicationHistorySnapshot, user) -> new ApplicationHistorySnapshotBriefInfo(
                                    applicationHistorySnapshot.getId(),
                                    applicationHistorySnapshot.getContext(),
                                    applicationHistorySnapshot.getCreatedBy(),
                                    user.getName(),
                                    user.getAvatarUrl(),
                                    applicationHistorySnapshot.getCreatedAt().toEpochMilli()
                            )
                    );

                    Mono<Long> applicationHistorySnapshotCount = applicationHistorySnapshotService.countByApplicationId(applicationId);

                    return Mono.zip(snapshotBriefInfoList, applicationHistorySnapshotCount)
                            .map(tuple -> ImmutableMap.of("list", tuple.getT1(), "count", tuple.getT2()));
                })
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Map<String, Object>>> listAllHistorySnapshotBriefInfoArchived(@PathVariable String applicationId,
                                                                                   @RequestParam(defaultValue = "1") int page,
                                                                                   @RequestParam(defaultValue = "10") int size,
                                                                                   @RequestParam(required = false) String compName,
                                                                                   @RequestParam(required = false) String theme,
                                                                                   @RequestParam(required = false) Instant from,
                                                                                   @RequestParam(required = false) Instant to) {

        Pagination pagination = Pagination.of(page, size).check();

        return sessionUserService.getVisitorId()
                .delayUntil(visitor -> resourcePermissionService.checkResourcePermissionWithError(visitor, applicationId,
                        ResourceAction.EDIT_APPLICATIONS))
                .flatMap(__ -> applicationHistorySnapshotService.listAllHistorySnapshotBriefInfoArchived(applicationId, compName, theme, from, to, pagination.toPageRequest()))
                .flatMap(snapshotList -> {
                    Mono<List<ApplicationHistorySnapshotBriefInfo>> snapshotBriefInfoList = multiBuild(snapshotList,
                            ApplicationHistorySnapshotTS::getCreatedBy,
                            userService::getByIds,
                            (applicationHistorySnapshotTS, user) -> new ApplicationHistorySnapshotBriefInfo(
                                    applicationHistorySnapshotTS.getId(),
                                    applicationHistorySnapshotTS.getContext(),
                                    applicationHistorySnapshotTS.getCreatedBy(),
                                    user.getName(),
                                    user.getAvatarUrl(),
                                    applicationHistorySnapshotTS.getCreatedAt().toEpochMilli()
                            )
                    );

                    Mono<Long> applicationHistorySnapshotCount = applicationHistorySnapshotService.countByApplicationIdArchived(applicationId);

                    return Mono.zip(snapshotBriefInfoList, applicationHistorySnapshotCount)
                            .map(tuple -> ImmutableMap.of("list", tuple.getT1(), "count", tuple.getT2()));
                })
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<HistorySnapshotDslView>> getHistorySnapshotDsl(@PathVariable String applicationId,
            @PathVariable String snapshotId) {
        return sessionUserService.getVisitorId()
                .flatMap(visitor -> editableApplication(visitor, applicationId))
                // D-31: served only through the app it was saved for
                .flatMap(application -> applicationHistorySnapshotService.getHistorySnapshotDetail(snapshotId)
                        .filter(snapshot -> savedFor(application, snapshot.getApplicationId(),
                                snapshot.getApplicationIdResolved(), snapshot.getCreatedAt()))
                        .switchIfEmpty(deferredError(INVALID_HISTORY_SNAPSHOT, "INVALID_HISTORY_SNAPSHOT", snapshotId)))
                .map(ApplicationHistorySnapshot::getDsl)
                .zipWhen(applicationService::getAllDependentModulesFromDsl)
                .flatMap(tuple -> {
                    Map<String, Object> applicationDsl = tuple.getT1();
                    List<Application> dependentModules = tuple.getT2();
                    return Flux.fromIterable(dependentModules)
                            .flatMap(app -> app.getLiveApplicationDsl(applicationRecordService)
                                    .map(dsl -> Map.entry(app.getId(), dsl)))
                            .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                            .map(dependentModuleDsl ->
                                HistorySnapshotDslView.builder()
                                    .applicationsDsl(applicationDsl)
                                    .moduleDSL(dependentModuleDsl)
                                    .build());
                })
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<HistorySnapshotDslView>> getHistorySnapshotDslArchived(@PathVariable String applicationId,
                                                                            @PathVariable String snapshotId) {
        return sessionUserService.getVisitorId()
                .flatMap(visitor -> editableApplication(visitor, applicationId))
                // D-31: served only through the app it was saved for
                .flatMap(application -> applicationHistorySnapshotService.getHistorySnapshotDetailArchived(snapshotId)
                        .filter(snapshot -> savedFor(application, snapshot.getApplicationId(),
                                snapshot.getApplicationIdResolved(), snapshot.getCreatedAt()))
                        .switchIfEmpty(deferredError(INVALID_HISTORY_SNAPSHOT, "INVALID_HISTORY_SNAPSHOT", snapshotId)))
                .map(ApplicationHistorySnapshotTS::getDsl)
                .zipWhen(applicationService::getAllDependentModulesFromDsl)
                .flatMap(tuple -> {
                    Map<String, Object> applicationDsl = tuple.getT1();
                    List<Application> dependentModules = tuple.getT2();
                    return Flux.fromIterable(dependentModules)
                            .flatMap(app -> app.getLiveApplicationDsl(applicationRecordService)
                                    .map(dsl -> Map.entry(app.getId(), dsl)))
                            .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                            .map(dependentModuleDsl ->
                                HistorySnapshotDslView.builder()
                                    .applicationsDsl(applicationDsl)
                                    .moduleDSL(dependentModuleDsl)
                                    .build());
                })
                .map(ResponseView::success);
    }

    /**
     * The application {@code applicationKey} names (an object id, a gid or a slug), once {@code visitorId} is found to hold
     * EDIT on it (D-31). The key is resolved ONCE, with {@link ApplicationService#findByIdWithoutDsl} (the lookup the EDIT
     * check uses for the workspace; not {@link ApplicationService#findById}, which never reads a slug), and the check
     * receives the resolved object id, so the check and what the caller does next (store a snapshot under that object id,
     * or compare a stored one with it) concern the same application even when a slug moves meanwhile. A key that lookup
     * refuses fails with its NO_RESOURCE_FOUND (INVALID_PARAMETER for null) before any check.
     * Limits: the check looks the object id up again for the workspace, which names the same application as long as its
     * document exists (no route deletes one).
     */
    private Mono<Application> editableApplication(String visitorId, String applicationKey) {
        return applicationService.findByIdWithoutDsl(applicationKey)
                .delayUntil(application -> resourcePermissionService.checkResourcePermissionWithError(visitorId,
                        application.getId(), ResourceAction.EDIT_APPLICATIONS));
    }

    /**
     * Whether a snapshot with this stored application id, marker and creation time was saved for {@code application}
     * (D-31). The stored id must equal the application's object id: a gid or a slug, even the application's own, is
     * refused, because a slug moves between applications and a hyphenated one can become another application's gid.
     * Equality is enough when the snapshot carries the marker: the create route stored the object id it had resolved and
     * checked. A snapshot without it was stored under whatever key its caller sent, and a slug shaped like an object id
     * equals the id of an application created after it; such a snapshot is accepted only when the application was created
     * STRICTLY before the snapshot, and refused when either creation time is missing. Strict, not {@code !isAfter}: a
     * deliberate narrowing, not a claim that equal timestamps cannot occur in a legitimate flow (createdAt has no
     * uniqueness or monotonicity guarantee); a legacy snapshot genuinely taken in the same timestamp tick as its own
     * application's creation is refused by this rule, an accepted cost of closing the equal-timestamp collision case.
     * A snapshot with the marker is unaffected, since its ownership is proven by the marker, not by time order.
     * Limits (D-31 residual, narrowed by strict order, not eliminated): (1) a snapshot without the marker, stored under a
     * lookup that asked for the slug first, through a slug equal to the object id of an application that already existed
     * in the SAME OR A DIFFERENT workspace (a slug is checked against another application's slug only within the same
     * workspace, never against another application's id, and the slug lookup itself has no workspace constraint), still
     * passes; (2) both creation times are server wall-clock timestamps, not a monotonic sequence, so clock skew between
     * the nodes that wrote each one could still admit a colliding application whose real creation came after the
     * snapshot. The creation times are the servers' clocks at insert; a refused snapshot answers as an unknown snapshot
     * id but not in the same time (its document was read); a snapshot saved under a gid or a slug is still listed
     * through that key but no longer served;
     * the modules the snapshot's DSL names are not checked.
     */
    private static boolean savedFor(Application application, String storedApplicationId, Boolean applicationIdResolved,
            Instant snapshotCreatedAt) {
        if (!application.getId().equals(storedApplicationId)) {
            return false;
        }
        if (Boolean.TRUE.equals(applicationIdResolved)) {
            return true;
        }
        Instant applicationCreatedAt = application.getCreatedAt();
        return applicationCreatedAt != null && snapshotCreatedAt != null && applicationCreatedAt.isBefore(snapshotCreatedAt);
    }
}

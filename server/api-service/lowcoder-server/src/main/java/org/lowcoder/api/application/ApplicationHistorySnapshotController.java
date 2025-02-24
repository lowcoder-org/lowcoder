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
                .delayUntil(visitor -> resourcePermissionService.checkResourcePermissionWithError(visitor, request.applicationId(),
                        ResourceAction.EDIT_APPLICATIONS))
                .delayUntil(visitorId -> applicationHistorySnapshotService.createHistorySnapshot(request.applicationId(),
                        request.dsl(),
                        request.context(),
                        visitorId)
                )
                .flatMap(visitorId -> applicationService.updateLastEditedAt(request.applicationId(), Instant.now(), visitorId))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Map<String, Object>>> listAllHistorySnapshotBriefInfo(@PathVariable String applicationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String compName,
            @RequestParam String theme,
            @RequestParam Instant from,
            @RequestParam Instant to) {

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
                                                                                   @RequestParam String compName,
                                                                                   @RequestParam String theme,
                                                                                   @RequestParam Instant from,
                                                                                   @RequestParam Instant to) {

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
                .delayUntil(visitor -> resourcePermissionService.checkResourcePermissionWithError(visitor, applicationId,
                        ResourceAction.EDIT_APPLICATIONS))
                .flatMap(__ -> applicationHistorySnapshotService.getHistorySnapshotDetail(snapshotId))
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
                .delayUntil(visitor -> resourcePermissionService.checkResourcePermissionWithError(visitor, applicationId,
                        ResourceAction.EDIT_APPLICATIONS))
                .flatMap(__ -> applicationHistorySnapshotService.getHistorySnapshotDetailArchived(snapshotId))
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
}

package org.lowcoder.runner.eventlistener;

import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.group.event.GroupDeletedEvent;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.event.OrgDeletedEvent;
import org.lowcoder.domain.organization.event.OrgMemberLeftEvent;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.google.common.util.concurrent.ThreadFactoryBuilder;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Component
public class OrgAndGroupEventListener {

    /** How often a failed cleanup is attempted again, by each handler. */
    private static final int CLEANUP_RETRIES = 3;

    private final ExecutorService executorService = Executors.newCachedThreadPool(new ThreadFactoryBuilder()
            .setDaemon(false)
            .setNameFormat("org-event-async-executor")
            .build());

    private final Scheduler orgEventScheduler = Schedulers.fromExecutor(executorService);
    @Autowired
    private OrgMemberService orgMemberService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private GroupMemberService groupMemberService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private ResourcePermissionService resourcePermissionService;

    @EventListener
    public void onOrgDeleted(OrgDeletedEvent event) {

        log.info("org deleted event: {}", toJson(event));
        String orgId = event.getOrgId();
        orgMemberService.deleteOrgMembers(orgId)
                .then(deleteOrgGroups(orgId))
                .then(deleteOrgApplications(orgId))
                .then(deleteOrgDatasources(orgId))
                .retry(CLEANUP_RETRIES)
                .doOnError(e -> log.error("fail to handle org deletion", e))
                .subscribeOn(orgEventScheduler)
                .subscribe();
    }

    /**
     * Removes the user who left from the organization's groups and their application and datasource permissions there. The
     * three cleanups run independently, each with its own retries (BF-015): one failing for good does not cancel the others,
     * and its error is logged once all three have ended.
     * <p>
     * Limits: a cleanup that fails after its retries is not attempted again later, so what it should have removed stays.
     */
    @EventListener
    public void onUserLeaveOrg(OrgMemberLeftEvent orgMemberLeftEvent) {
        String orgId = orgMemberLeftEvent.getOrgId();
        String userId = orgMemberLeftEvent.getUserId();
        Mono<List<Boolean>> removeGroupMember = groupService.getByOrgId(orgId)
                .flatMap(group -> groupMemberService.removeMember(group.getId(), userId))
                .collectList()
                .retry(CLEANUP_RETRIES)
                .subscribeOn(orgEventScheduler);

        Mono<List<Boolean>> removeAppPermissions = applicationService.findByOrganizationIdWithoutDsl(orgId)
                .flatMap(application -> resourcePermissionService.removeUserApplicationPermission(application.getId(), userId))
                .collectList()
                .retry(CLEANUP_RETRIES)
                .subscribeOn(orgEventScheduler);

        Mono<List<Boolean>> removeDatasourcePermissions = datasourceService.getByOrgId(orgId)
                .flatMap(datasource -> resourcePermissionService.removeUserDatasourcePermission(datasource.getId(), userId))
                .collectList()
                .retry(CLEANUP_RETRIES)
                .subscribeOn(orgEventScheduler);

        Mono.whenDelayError(removeGroupMember, removeAppPermissions, removeDatasourcePermissions)
                .doOnError(e -> log.error("fail to handle user {} leaving org {}", userId, orgId, e))
                .subscribe();
    }

    /**
     * Soft-deletes the deleted organization's applications (BF-017): each one not already DELETED gets the status DELETED,
     * as deleting a recycled application does, and loses its public, marketplace and agency flags. The applications stay
     * stored. Deferred, so a retry of the org deletion lists them again.
     * <p>
     * Limits: the status alone does not stop an application from being opened or running its queries (query execution
     * reads neither the application's nor the datasource's status, NEW-6); what closes the deleted org's applications is
     * that their members are removed (BF-016) and that they are no longer public.
     */
    private Mono<Void> deleteOrgApplications(String orgId) {
        return Flux.defer(() -> applicationService.findByOrganizationIdWithoutDsl(orgId))
                .filter(application -> application.getApplicationStatus() != ApplicationStatus.DELETED)
                .concatMap(application -> applicationService.updateById(application.getId(), Application.builder()
                        .applicationStatus(ApplicationStatus.DELETED)
                        .publicToAll(false)
                        .publicToMarketplace(false)
                        .agencyProfile(false)
                        .build()))
                .then();
    }

    /**
     * Soft-deletes the deleted organization's datasources (BF-017): each one not already DELETED is marked DELETED, after the
     * applications. This skips the "still used by applications" check of {@code DatasourceService.delete} on purpose: the
     * organization's own applications are DELETED by then, so only an application of another organization (a reference
     * BF-002 refuses) could still use one, and keeping a deleted organization's credentials live for it is what BF-017
     * forbids. Deferred, like the applications step; a failure fails the step, so the org deletion is retried.
     * <p>
     * Limits: the datasources stay stored, credentials included (an archive, not a removal); the DELETED status hides them
     * from the datasource listings, but query execution does not read it (NEW-6).
     */
    private Mono<Void> deleteOrgDatasources(String orgId) {
        return Flux.defer(() -> datasourceService.getByOrgId(orgId))
                .filter(datasource -> datasource.getDatasourceStatus() != DatasourceStatus.DELETED)
                .concatMap(datasource -> datasourceRepository.markDatasourceAsDeleted(datasource.getId()))
                .then();
    }

    @EventListener
    public void onGroupDeleted(GroupDeletedEvent event) {
        log.info("group deleted event: {}", toJson(event));
        String groupId = event.getGroupId();
        groupMemberService.deleteGroupMembers(groupId)
                .retry(CLEANUP_RETRIES)
                .doOnError(e -> log.error("fail to handle group deletion", e))
                .subscribeOn(orgEventScheduler)
                .subscribe();
    }

    private Mono<Boolean> deleteOrgGroups(String orgId) {
        return groupService.getByOrgId(orgId)
                .flatMap(group -> groupService.delete(group.getId()))
                .collectList()
                .thenReturn(true);
    }
}

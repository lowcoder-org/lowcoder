package org.lowcoder.runner.eventlistener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.group.event.GroupDeletedEvent;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.event.OrgDeletedEvent;
import org.lowcoder.domain.organization.event.OrgMemberLeftEvent;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;
import reactor.core.publisher.MonoSink;

/**
 * Tests of {@link OrgAndGroupEventListener} over mocked services. The handlers run on the listener's own scheduler, so the
 * tests wait on latches counted down inside the stubs (bounded waits, never a fixed sleep as an assertion) and record the
 * executing thread and an event log. A handler that ends in an error is subscribed without an error consumer, so the end of
 * such a chain is observed through Reactor's error-dropped hook.
 *
 * <p>Related tests, referenced and not repeated: L3-11b ({@code OrganizationServiceImplDeleteMongoTest}) drives the listener
 * through a real org delete against MongoDB and checks that the org's applications and datasources end up soft-deleted
 * (BF-017); L4-8 ({@code BiRelationServiceImplTest}) covers the BiRelation cascade through {@code deleteOrgMembers} and
 * {@code deleteGroupMembers}. This class covers what those runs do not branch through: the order of the steps, the retries,
 * the error handling, the thread, the group-deleted path and the user-leaves-org handler. BF-015, BF-071 and BF-017 are
 * fixed: the user-leaves-org parts no longer cancel each other, the group-deleted cleanup is retried like the others, and
 * deleting an org soft-deletes its applications and datasources.
 *
 * <p>The listener's pool uses non-daemon threads (idle timeout 60 s of a cached pool); the surefire fork exits normally.
 */
class OrgAndGroupEventListenerTest {

    private static final String ORG_ID = "org-1";
    private static final String USER_ID = "user-1";
    private static final String GROUP_1 = "group-1";
    private static final String GROUP_2 = "group-2";
    private static final String APP_1 = "app-1";
    private static final String APP_2 = "app-2";
    private static final String DATASOURCE_1 = "ds-1";
    private static final String DATASOURCE_2 = "ds-2";
    private static final String SCHEDULER_THREAD = "org-event-async-executor";
    private static final long WAIT_SECONDS = 10;
    private static final int RETRIES = 3;

    private OrgAndGroupEventListener listener;
    private OrgMemberService orgMemberService;
    private GroupService groupService;
    private GroupMemberService groupMemberService;
    private ApplicationService applicationService;
    private DatasourceService datasourceService;
    private ResourcePermissionService resourcePermissionService;
    private DatasourceRepository datasourceRepository;

    private final List<String> events = new CopyOnWriteArrayList<>();
    private final List<Throwable> dropped = new CopyOnWriteArrayList<>();
    private final CountDownLatch droppedLatch = new CountDownLatch(1);
    /** The failure the test waits for: only a dropped error carrying it ends the wait (a stale error of another test does not). */
    private volatile Throwable expectedFailure;

    @BeforeEach
    void setUp() {
        listener = new OrgAndGroupEventListener();
        orgMemberService = mock(OrgMemberService.class);
        groupService = mock(GroupService.class);
        groupMemberService = mock(GroupMemberService.class);
        applicationService = mock(ApplicationService.class);
        datasourceService = mock(DatasourceService.class);
        resourcePermissionService = mock(ResourcePermissionService.class);
        datasourceRepository = mock(DatasourceRepository.class);
        ReflectionTestUtils.setField(listener, "orgMemberService", orgMemberService);
        ReflectionTestUtils.setField(listener, "groupService", groupService);
        ReflectionTestUtils.setField(listener, "groupMemberService", groupMemberService);
        ReflectionTestUtils.setField(listener, "applicationService", applicationService);
        ReflectionTestUtils.setField(listener, "datasourceService", datasourceService);
        ReflectionTestUtils.setField(listener, "resourcePermissionService", resourcePermissionService);
        ReflectionTestUtils.setField(listener, "datasourceRepository", datasourceRepository);
        Hooks.onErrorDropped(error -> {
            dropped.add(error);
            Throwable expected = expectedFailure;
            if (expected != null && (error == expected || error.getCause() == expected)) {
                droppedLatch.countDown();
            }
        });
    }

    @AfterEach
    void tearDown() {
        Hooks.resetOnErrorDropped();
    }

    private static Group group(String id) {
        return Group.builder().id(id).build();
    }

    private static Application application(String id) {
        return Application.builder().id(id).build();
    }

    private static Datasource datasource(String id) {
        return Datasource.builder().id(id).build();
    }

    private static void await(CountDownLatch latch, String what) throws InterruptedException {
        assertThat(latch.await(WAIT_SECONDS, TimeUnit.SECONDS)).as("waited for: " + what).isTrue();
    }

    /** True when the dropped error is the given failure, directly or as the cause of Reactor's "error callback not implemented". */
    private boolean droppedFailure(Throwable failure) {
        return dropped.stream().anyMatch(error -> error == failure || error.getCause() == failure);
    }

    private static void say(String format, Object... args) {
        System.out.println("[OrgAndGroupEventListenerTest] " + String.format(format, args));
    }

    private static OrgDeletedEvent orgDeleted() {
        OrgDeletedEvent event = new OrgDeletedEvent();
        event.setOrgId(ORG_ID);
        return event;
    }

    /** An org without applications or datasources, for the org deletion tests about the earlier steps. */
    private void stubNoApplicationsOrDatasources() {
        when(applicationService.findByOrganizationIdWithoutDsl(ORG_ID)).thenReturn(Flux.empty());
        when(datasourceService.getByOrgId(ORG_ID)).thenReturn(Flux.empty());
    }

    private static boolean marksDeleted(Application update) {
        return update != null && update.getApplicationStatus() == ApplicationStatus.DELETED;
    }

    private static GroupDeletedEvent groupDeleted() {
        GroupDeletedEvent event = new GroupDeletedEvent();
        event.setGroupId(GROUP_1);
        return event;
    }

    // ------------------------------------------------------------------ onOrgDeleted

    /**
     * Cleanup order: the org's members are deleted first, then the groups are listed and each is deleted in the order the
     * listing returns them, then the applications are soft-deleted, then the datasources (BF-017). The datasources are
     * marked DELETED directly: {@code DatasourceService.delete}, whose "still used by applications" check would leave a
     * deleted org's datasource live, is never called.
     */
    @Test
    void onOrgDeleted_runsMembersGroupsApplicationsThenDatasources_inThatOrder() throws InterruptedException {
        CountDownLatch done = new CountDownLatch(1);
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.defer(() -> {
            events.add("delete members");
            return Mono.just(true);
        }));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> {
            events.add("list groups");
            return Flux.just(group(GROUP_1), group(GROUP_2));
        }));
        when(groupService.delete(GROUP_1)).thenReturn(Mono.defer(() -> {
            events.add("delete " + GROUP_1);
            return Mono.empty();
        }));
        when(groupService.delete(GROUP_2)).thenReturn(Mono.defer(() -> {
            events.add("delete " + GROUP_2);
            return Mono.empty();
        }));
        when(applicationService.findByOrganizationIdWithoutDsl(ORG_ID)).thenReturn(Flux.defer(() -> {
            events.add("list applications");
            return Flux.just(application(APP_1));
        }));
        when(applicationService.updateById(eq(APP_1), argThat(OrgAndGroupEventListenerTest::marksDeleted))).thenReturn(Mono.defer(() -> {
            events.add("delete " + APP_1);
            return Mono.just(true);
        }));
        when(datasourceService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> {
            events.add("list datasources");
            return Flux.just(datasource(DATASOURCE_1));
        }));
        when(datasourceRepository.markDatasourceAsDeleted(DATASOURCE_1)).thenReturn(Mono.defer(() -> {
            events.add("delete " + DATASOURCE_1);
            done.countDown();
            return Mono.just(true);
        }));

        listener.onOrgDeleted(orgDeleted());
        await(done, "the last datasource deletion");

        assertThat(events).containsExactly("delete members", "list groups", "delete " + GROUP_1, "delete " + GROUP_2,
                "list applications", "delete " + APP_1, "list datasources", "delete " + DATASOURCE_1);
        verify(datasourceService, never()).delete(anyString());
        verifyNoInteractions(resourcePermissionService);
        say("org delete order: %s", events);
    }

    @Test
    void onOrgDeleted_deletesOnlyTheListedGroups_andAnOrgWithoutGroupsStillCompletes() throws InterruptedException {
        CountDownLatch listed = new CountDownLatch(1);
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.just(true));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> Flux.<Group>empty().doOnComplete(listed::countDown)));
        stubNoApplicationsOrDatasources();

        listener.onOrgDeleted(orgDeleted());
        await(listed, "the group listing of the empty org");

        verify(groupService, never()).delete(anyString());
        verify(orgMemberService).deleteOrgMembers(ORG_ID);
    }

    /**
     * {@code .retry(3)} restarts the WHOLE chain, so a failing group step re-runs {@code deleteOrgMembers}: a listing that fails
     * twice and then succeeds completes after three subscriptions of the members deletion. The operations are deletes by org id
     * (idempotent in these mocks; not verified against the real repositories).
     */
    @Test
    void onOrgDeleted_retriesTheWholeChain_thenSucceeds() throws InterruptedException {
        AtomicInteger memberDeletions = new AtomicInteger();
        AtomicInteger listings = new AtomicInteger();
        CountDownLatch done = new CountDownLatch(1);
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.defer(() -> {
            memberDeletions.incrementAndGet();
            return Mono.just(true);
        }));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> {
            if (listings.incrementAndGet() <= 2) {
                return Flux.error(new IllegalStateException("transient"));
            }
            return Flux.just(group(GROUP_1));
        }));
        when(groupService.delete(GROUP_1)).thenReturn(Mono.defer(() -> {
            done.countDown();
            return Mono.empty();
        }));
        stubNoApplicationsOrDatasources();

        listener.onOrgDeleted(orgDeleted());
        await(done, "the group deletion after two failed attempts");

        assertThat(listings.get()).isEqualTo(3);
        assertThat(memberDeletions.get()).as("the members deletion runs again with every retry of the chain").isEqualTo(3);
    }

    /** A listing that always fails is attempted 1 + 3 times, the group deletions never run, and the caller sees no exception. */
    @Test
    void onOrgDeleted_givesUpAfterThreeRetries_withoutRaisingToTheCaller() throws InterruptedException {
        IllegalStateException failure = new IllegalStateException("permanent");
        expectedFailure = failure;
        AtomicInteger listings = new AtomicInteger();
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.just(true));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> {
            listings.incrementAndGet();
            return Flux.<Group>error(failure);
        }));

        listener.onOrgDeleted(orgDeleted());
        await(droppedLatch, "the end of the failing chain");

        assertThat(droppedFailure(failure)).isTrue();
        assertThat(listings.get()).isEqualTo(1 + RETRIES);
        verify(groupService, never()).delete(anyString());
    }

    /** The work runs on the listener's own scheduler: the handler returns while the first step is still blocked. */
    @Test
    void onOrgDeleted_runsOnTheEventScheduler_notOnTheCaller() throws InterruptedException {
        AtomicReference<String> thread = new AtomicReference<>();
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch finished = new CountDownLatch(1);
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.defer(() -> {
            thread.set(Thread.currentThread().getName());
            entered.countDown();
            try {
                release.await(WAIT_SECONDS, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return Mono.just(true);
        }));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> Flux.<Group>empty().doOnComplete(finished::countDown)));
        stubNoApplicationsOrDatasources();

        listener.onOrgDeleted(orgDeleted());

        // reaching this line means the handler returned although the members deletion has not finished
        await(entered, "the members deletion to start");
        assertThat(finished.getCount()).as("the chain is still blocked in its first step").isEqualTo(1);
        release.countDown();
        await(finished, "the chain to finish");
        assertThat(thread.get()).isEqualTo(SCHEDULER_THREAD);
        assertThat(Thread.currentThread().getName()).isNotEqualTo(SCHEDULER_THREAD);
    }

    /**
     * Catches a retried org deletion writing again what is already gone (BF-017): applications and datasources that are
     * already DELETED are skipped; the others are soft-deleted, the applications with an update that sets the status
     * DELETED and clears the public, marketplace and agency flags, and nothing else.
     */
    @Test
    void onOrgDeleted_skipsApplicationsAndDatasourcesThatAreAlreadyDeleted() throws InterruptedException {
        CountDownLatch done = new CountDownLatch(1);
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.just(true));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.empty());
        Application deletedApplication = Application.builder().id(APP_2).applicationStatus(ApplicationStatus.DELETED).build();
        when(applicationService.findByOrganizationIdWithoutDsl(ORG_ID)).thenReturn(Flux.just(application(APP_1), deletedApplication));
        ArgumentCaptor<Application> update = ArgumentCaptor.forClass(Application.class);
        when(applicationService.updateById(eq(APP_1), update.capture())).thenReturn(Mono.just(true));
        Datasource deletedDatasource = datasource(DATASOURCE_2);
        deletedDatasource.setDatasourceStatus(DatasourceStatus.DELETED);
        when(datasourceService.getByOrgId(ORG_ID)).thenReturn(Flux.just(deletedDatasource, datasource(DATASOURCE_1)));
        when(datasourceRepository.markDatasourceAsDeleted(DATASOURCE_1)).thenReturn(Mono.defer(() -> {
            done.countDown();
            return Mono.just(true);
        }));

        listener.onOrgDeleted(orgDeleted());
        await(done, "the datasource deletion");

        verify(applicationService, never()).updateById(eq(APP_2), any());
        verify(datasourceRepository, never()).markDatasourceAsDeleted(DATASOURCE_2);
        assertThat(update.getValue().getApplicationStatus()).isEqualTo(ApplicationStatus.DELETED);
        // the raw fields: the accessors read a missing flag as false, which would not show that the update clears it
        assertThat(ReflectionTestUtils.getField(update.getValue(), "publicToAll")).isEqualTo(false);
        assertThat(ReflectionTestUtils.getField(update.getValue(), "publicToMarketplace")).isEqualTo(false);
        assertThat(ReflectionTestUtils.getField(update.getValue(), "agencyProfile")).isEqualTo(false);
        assertThat(update.getValue().getName()).as("nothing else is set").isNull();
        assertThat(update.getValue().getOrganizationId()).isNull();
        say("org delete: already deleted application and datasource skipped");
    }

    /** A datasource failure fails the step, so the whole org deletion is retried (1 + 3 attempts) and then gives up. */
    @Test
    void onOrgDeleted_anotherDatasourceFailure_retriesTheChain() throws InterruptedException {
        IllegalStateException failure = new IllegalStateException("datasource store down");
        expectedFailure = failure;
        AtomicInteger attempts = new AtomicInteger();
        when(orgMemberService.deleteOrgMembers(ORG_ID)).thenReturn(Mono.just(true));
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.empty());
        when(applicationService.findByOrganizationIdWithoutDsl(ORG_ID)).thenReturn(Flux.empty());
        when(datasourceService.getByOrgId(ORG_ID)).thenReturn(Flux.just(datasource(DATASOURCE_1)));
        when(datasourceRepository.markDatasourceAsDeleted(DATASOURCE_1)).thenReturn(Mono.defer(() -> {
            attempts.incrementAndGet();
            return Mono.<Boolean>error(failure);
        }));

        listener.onOrgDeleted(orgDeleted());
        await(droppedLatch, "the end of the failing chain");

        assertThat(droppedFailure(failure)).isTrue();
        assertThat(attempts.get()).isEqualTo(1 + RETRIES);
    }

    // ------------------------------------------------------------------ onGroupDeleted

    @Test
    void onGroupDeleted_deletesTheGroupMembers_onTheScheduler() throws InterruptedException {
        AtomicReference<String> thread = new AtomicReference<>();
        CountDownLatch done = new CountDownLatch(1);
        when(groupMemberService.deleteGroupMembers(GROUP_1)).thenReturn(Mono.defer(() -> {
            thread.set(Thread.currentThread().getName());
            done.countDown();
            return Mono.just(true);
        }));

        listener.onGroupDeleted(groupDeleted());
        await(done, "the group member deletion");

        assertThat(thread.get()).isEqualTo(SCHEDULER_THREAD);
        verify(groupMemberService).deleteGroupMembers(GROUP_1);
        verifyNoInteractions(groupService, orgMemberService);
    }

    /**
     * Catches orphaned group-member rows after a transient failure (BF-071, formerly recorded as "onGroupDeleted has NO
     * retry"): like the other handlers, {@code deleteGroupMembers} is retried, so a deletion that fails twice and then
     * succeeds completes after three attempts and nothing ends in the error hook.
     */
    @Test
    void onGroupDeleted_transientFailureIsRetried_thenSucceeds() throws InterruptedException {
        AtomicInteger attempts = new AtomicInteger();
        CountDownLatch done = new CountDownLatch(1);
        when(groupMemberService.deleteGroupMembers(GROUP_1)).thenReturn(Mono.defer(() -> {
            if (attempts.incrementAndGet() <= 2) {
                return Mono.<Boolean>error(new IllegalStateException("transient"));
            }
            done.countDown();
            return Mono.just(true);
        }));

        listener.onGroupDeleted(groupDeleted());
        await(done, "the group member deletion after two failed attempts");

        assertThat(attempts.get()).isEqualTo(3);
        assertThat(dropped).isEmpty();
        say("group delete: transient failure retried, %d attempts", attempts.get());
    }

    /**
     * A deletion that always fails is attempted 1 + 3 times, logged by the listener ("fail to handle group deletion"; the log
     * line itself is not asserted) and not raised to the caller.
     */
    @Test
    void onGroupDeleted_givesUpAfterThreeRetries_withoutRaisingToTheCaller() throws InterruptedException {
        IllegalStateException failure = new IllegalStateException("permanent");
        expectedFailure = failure;
        AtomicInteger attempts = new AtomicInteger();
        when(groupMemberService.deleteGroupMembers(GROUP_1)).thenReturn(Mono.defer(() -> {
            attempts.incrementAndGet();
            return Mono.<Boolean>error(failure);
        }));

        listener.onGroupDeleted(groupDeleted());
        await(droppedLatch, "the end of the failing chain");

        assertThat(droppedFailure(failure)).isTrue();
        assertThat(attempts.get()).isEqualTo(1 + RETRIES);
    }

    // ------------------------------------------------------------------ onUserLeaveOrg

    private void stubOrgContents(List<String> groups, List<String> apps, List<String> datasources) {
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.fromIterable(groups.stream().map(OrgAndGroupEventListenerTest::group).toList()));
        when(applicationService.findByOrganizationIdWithoutDsl(ORG_ID))
                .thenReturn(Flux.fromIterable(apps.stream().map(OrgAndGroupEventListenerTest::application).toList()));
        when(datasourceService.getByOrgId(ORG_ID))
                .thenReturn(Flux.fromIterable(datasources.stream().map(OrgAndGroupEventListenerTest::datasource).toList()));
    }

    /**
     * The user is removed from every group of the org and loses the permissions on every application and datasource of the
     * org, for that user and org only. A call with any other argument finds an unstubbed mock (null) and breaks the chain, so a
     * swapped id is noticed as a missing removal.
     */
    @Test
    void onUserLeaveOrg_removesTheUserFromEveryGroup_andEveryApplicationAndDatasourcePermission() throws InterruptedException {
        CountDownLatch removals = new CountDownLatch(5);
        List<String> threads = new CopyOnWriteArrayList<>();
        stubOrgContents(List.of(GROUP_1, GROUP_2), List.of(APP_1, APP_2), List.of(DATASOURCE_1));
        for (String groupId : List.of(GROUP_1, GROUP_2)) {
            when(groupMemberService.removeMember(groupId, USER_ID)).thenReturn(Mono.defer(() -> {
                events.add("group " + groupId);
                threads.add(Thread.currentThread().getName());
                removals.countDown();
                return Mono.just(true);
            }));
        }
        for (String appId : List.of(APP_1, APP_2)) {
            when(resourcePermissionService.removeUserApplicationPermission(appId, USER_ID)).thenReturn(Mono.defer(() -> {
                events.add("application " + appId);
                threads.add(Thread.currentThread().getName());
                removals.countDown();
                return Mono.just(true);
            }));
        }
        when(resourcePermissionService.removeUserDatasourcePermission(DATASOURCE_1, USER_ID)).thenReturn(Mono.defer(() -> {
            events.add("datasource " + DATASOURCE_1);
            threads.add(Thread.currentThread().getName());
            removals.countDown();
            return Mono.just(true);
        }));

        listener.onUserLeaveOrg(new OrgMemberLeftEvent(ORG_ID, USER_ID));
        await(removals, "the five removals");

        assertThat(Set.copyOf(events)).containsExactlyInAnyOrder("group " + GROUP_1, "group " + GROUP_2,
                "application " + APP_1, "application " + APP_2, "datasource " + DATASOURCE_1);
        assertThat(events).hasSize(5);
        assertThat(threads).as("every part runs on the listener's scheduler, none on the caller").hasSize(5)
                .allSatisfy(name -> assertThat(name).isEqualTo(SCHEDULER_THREAD));
        verify(applicationService).findByOrganizationIdWithoutDsl(ORG_ID);
    }

    @Test
    void onUserLeaveOrg_anOrgWithoutGroupsApplicationsOrDatasources_callsNoRemoval() throws InterruptedException {
        CountDownLatch listed = new CountDownLatch(3);
        when(groupService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> Flux.<Group>empty().doOnComplete(listed::countDown)));
        when(applicationService.findByOrganizationIdWithoutDsl(ORG_ID))
                .thenReturn(Flux.defer(() -> Flux.<Application>empty().doOnComplete(listed::countDown)));
        when(datasourceService.getByOrgId(ORG_ID)).thenReturn(Flux.defer(() -> Flux.<Datasource>empty().doOnComplete(listed::countDown)));

        listener.onUserLeaveOrg(new OrgMemberLeftEvent(ORG_ID, USER_ID));
        await(listed, "the three listings");

        verifyNoInteractions(groupMemberService, resourcePermissionService);
        assertThat(dropped).isEmpty();
    }

    /** Each part retries on its own: a group-member removal that fails twice then succeeds, and the other parts still run. */
    @Test
    void onUserLeaveOrg_eachPartRetries_aTransientFailureStillCleansEverything() throws InterruptedException {
        AtomicInteger groupAttempts = new AtomicInteger();
        AtomicInteger appAttempts = new AtomicInteger();
        AtomicInteger datasourceAttempts = new AtomicInteger();
        CountDownLatch done = new CountDownLatch(3);
        stubOrgContents(List.of(GROUP_1), List.of(APP_1), List.of(DATASOURCE_1));
        when(groupMemberService.removeMember(GROUP_1, USER_ID)).thenReturn(Mono.defer(() -> {
            if (groupAttempts.incrementAndGet() <= 2) {
                return Mono.<Boolean>error(new IllegalStateException("transient group"));
            }
            done.countDown();
            return Mono.just(true);
        }));
        when(resourcePermissionService.removeUserApplicationPermission(APP_1, USER_ID)).thenReturn(Mono.defer(() -> {
            if (appAttempts.incrementAndGet() <= 2) {
                return Mono.<Boolean>error(new IllegalStateException("transient application"));
            }
            done.countDown();
            return Mono.just(true);
        }));
        when(resourcePermissionService.removeUserDatasourcePermission(DATASOURCE_1, USER_ID)).thenReturn(Mono.defer(() -> {
            if (datasourceAttempts.incrementAndGet() <= 2) {
                return Mono.<Boolean>error(new IllegalStateException("transient datasource"));
            }
            done.countDown();
            return Mono.just(true);
        }));

        listener.onUserLeaveOrg(new OrgMemberLeftEvent(ORG_ID, USER_ID));
        await(done, "all three parts to succeed after two failures each");

        assertThat(groupAttempts.get()).isEqualTo(3);
        assertThat(appAttempts.get()).isEqualTo(3);
        assertThat(datasourceAttempts.get()).isEqualTo(3);
        assertThat(dropped).isEmpty();
    }

    /** A part that always fails is attempted 1 + 3 times, for each of the three parts on its own. */
    @ParameterizedTest(name = "always failing part: {0}")
    @ValueSource(strings = {"group", "application", "datasource"})
    void onUserLeaveOrg_aPartThatAlwaysFails_isAttemptedFourTimes(String part) throws InterruptedException {
        IllegalStateException failure = new IllegalStateException("permanent " + part);
        expectedFailure = failure;
        AtomicInteger attempts = new AtomicInteger();
        stubOrgContents(List.of(GROUP_1), List.of(APP_1), List.of(DATASOURCE_1));
        Mono<Boolean> failing = Mono.defer(() -> {
            attempts.incrementAndGet();
            return Mono.<Boolean>error(failure);
        });
        when(groupMemberService.removeMember(GROUP_1, USER_ID)).thenReturn("group".equals(part) ? failing : Mono.just(true));
        when(resourcePermissionService.removeUserApplicationPermission(APP_1, USER_ID))
                .thenReturn("application".equals(part) ? failing : Mono.just(true));
        when(resourcePermissionService.removeUserDatasourcePermission(DATASOURCE_1, USER_ID))
                .thenReturn("datasource".equals(part) ? failing : Mono.just(true));

        listener.onUserLeaveOrg(new OrgMemberLeftEvent(ORG_ID, USER_ID));
        await(droppedLatch, "the end of the failing handler");

        assertThat(droppedFailure(failure)).isTrue();
        assertThat(attempts.get()).isEqualTo(1 + RETRIES);
    }

    /**
     * Catches a user keeping permissions after leaving (BF-015, formerly pinned as the section 9 row "onUserLeaveOrg runs its
     * three cleanups through Mono.zip with no error consumer: one part failing for good cancels the others, and the error is
     * not logged"): the group-member removal fails for good (after its retries) while the application-permission removal is
     * in flight; the application part is not cancelled, it finishes when the test completes it, and only then does the
     * handler end with the group failure (logged by the listener; the log line itself is not asserted). What the unit test
     * cannot show: whether these services fail in production, or the real timing of the three parts.
     */
    @Test
    void onUserLeaveOrg_aPersistentFailureDoesNotCancelTheOtherParts() throws InterruptedException {
        IllegalStateException failure = new IllegalStateException("permanent group failure");
        expectedFailure = failure;
        CountDownLatch applicationInFlight = new CountDownLatch(1);
        CountDownLatch groupGaveUp = new CountDownLatch(1 + RETRIES);
        AtomicInteger applicationCancelled = new AtomicInteger();
        AtomicInteger applicationCompleted = new AtomicInteger();
        AtomicReference<MonoSink<Boolean>> applicationSink = new AtomicReference<>();
        stubOrgContents(List.of(GROUP_1), List.of(APP_1), List.of());
        when(groupMemberService.removeMember(GROUP_1, USER_ID)).thenReturn(Mono.defer(() -> {
            groupGaveUp.countDown();
            return Mono.<Boolean>error(failure);
        }));
        when(resourcePermissionService.removeUserApplicationPermission(APP_1, USER_ID)).thenReturn(Mono.<Boolean>create(sink -> {
            sink.onCancel(applicationCancelled::incrementAndGet);
            applicationSink.set(sink);
            applicationInFlight.countDown();
        }).doOnNext(ignored -> applicationCompleted.incrementAndGet()));

        listener.onUserLeaveOrg(new OrgMemberLeftEvent(ORG_ID, USER_ID));
        await(applicationInFlight, "the application part to be in flight");
        await(groupGaveUp, "the group part to fail on every attempt");

        assertThat(applicationCancelled.get()).as("the failing group part does not cancel the application part").isZero();
        assertThat(droppedFailure(failure)).as("the handler waits for the application part before it ends").isFalse();
        applicationSink.get().success(true);
        await(droppedLatch, "the end of the handler after the application part finished");

        assertThat(applicationCompleted.get()).as("the application permission removal finished").isEqualTo(1);
        assertThat(applicationCancelled.get()).isZero();
        assertThat(droppedFailure(failure)).isTrue();
        say("group part failed for good -> application part not cancelled, finished; then the handler ended with the error");
    }
}

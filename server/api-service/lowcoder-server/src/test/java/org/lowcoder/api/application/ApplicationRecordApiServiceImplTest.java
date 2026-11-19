package org.lowcoder.api.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationCombineId;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.repository.ApplicationRecordRepository;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationRecordServiceImpl;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.test.web.reactive.server.EntityExchangeResult;

import reactor.core.publisher.Mono;

/**
 * Tests of {@link ApplicationRecordApiServiceImpl} (the versions of an application) with Mockito. The mocks follow the
 * real services: {@code ApplicationServiceImpl.findById} and {@code ApplicationRecordServiceImpl.getById} fail when the
 * row is missing (they do not complete empty), so a missing record or application is an error here as it is in production.
 *
 * <p>BF-012 (was pinned under D-6 as plan §9 row "application version list readable for any application id by any
 * signed-in user"): {@code getByApplicationId} (ApplicationRecordApiServiceImpl:59-67) now checks, like the record DSL and the
 * delete, that the application belongs to the visitor's organization
 * ({@link #getByApplicationId_otherOrgsApplication_failsWithApplicationAndOrgNotMatch_andReadsNoVersions}). It is reached from
 * {@code ApplicationRecordController.getByApplicationId} (:28-30) at {@code /api/application-records/listByApplicationId},
 * which has no matcher of its own in SecurityConfig and falls under {@code .pathMatchers("/api/**")} /
 * {@code .authenticated()} (SecurityConfig:156-157), so any signed-in user reaches the check.
 */
class ApplicationRecordApiServiceImplTest {

    private static final String TAG = "[ApplicationRecordApiServiceImplTest] ";
    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final String ORG = "org-1";
    private static final String OTHER_ORG = "org-2";
    private static final String APP = "app-1";
    private static final String OTHER_APP = "app-2";
    private static final String RECORD = "record-1";
    private static final String LATEST = "latest";
    private static final String EDITING = "editing";
    private static final Map<String, Object> LIVE_DSL = Map.of("src", "live");
    private static final Map<String, Object> RECORD_DSL = Map.of("src", "record");

    private ApplicationService applicationService;
    private ApplicationRecordService recordService;
    private SessionUserService sessionUserService;
    private OrgDevChecker orgDevChecker;
    private UserService userService;
    private ApplicationRecordApiServiceImpl service;

    private final AtomicInteger dslSubscriptions = new AtomicInteger();
    private final AtomicInteger deletions = new AtomicInteger();

    @BeforeEach
    void setUp() {
        applicationService = mock(ApplicationService.class);
        recordService = mock(ApplicationRecordService.class);
        sessionUserService = mock(SessionUserService.class);
        orgDevChecker = mock(OrgDevChecker.class);
        userService = mock(UserService.class);
        service = new ApplicationRecordApiServiceImpl(applicationService, recordService, mock(ApplicationApiServiceImpl.class),
                sessionUserService, orgDevChecker, userService);
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member(ORG)));
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.empty());
        when(recordService.deleteById(anyString())).thenReturn(Mono.fromRunnable(deletions::incrementAndGet));
        dslSubscriptions.set(0);
        deletions.set(0);
    }

    // ---------------------------------------------------------------- fixtures

    private static OrgMember member(String orgId) {
        return OrgMember.builder().orgId(orgId).userId("user-1").role(MemberRole.MEMBER).build();
    }

    private static Application application(String id, String orgId) {
        return Application.builder().id(id).organizationId(orgId).build();
    }

    private static ApplicationVersion version(String id, String applicationId, String creatorId, long createdAtMillis) {
        return ApplicationVersion.builder().id(id).applicationId(applicationId).tag("tag-" + id).commitMessage("msg-" + id)
                .createdBy(creatorId).createdAt(Instant.ofEpochMilli(createdAtMillis)).applicationDSL(RECORD_DSL).build();
    }

    private void applicationExists(String id, String orgId) {
        when(applicationService.findById(id)).thenReturn(Mono.just(application(id, orgId)));
    }

    private void recordExists(String id, String applicationId) {
        when(recordService.getById(id)).thenReturn(Mono.just(version(id, applicationId, "creator", 1L)));
    }

    private void liveDsl(String applicationId) {
        when(applicationService.getLiveDSLByApplicationId(applicationId))
                .thenReturn(Mono.defer(() -> {
                    dslSubscriptions.incrementAndGet();
                    return Mono.just(LIVE_DSL);
                }));
    }

    private static BizException failure(Mono<?> mono) {
        Throwable error = mono.then().materialize().block(WAIT).getThrowable();
        assertThat(error).as("the Mono must fail with a BizException").isInstanceOf(BizException.class);
        System.out.println(TAG + "failed with " + error.getClass().getSimpleName() + " code " + ((BizException) error).getBizErrorCode());
        return (BizException) error;
    }

    private static void assertCode(BizException error, BizError expected) {
        assertThat(error.getBizErrorCode()).isEqualTo(expected.getBizErrorCode());
    }

    // ---------------------------------------------------------------- getRecordDSLFromApplicationCombineId

    /** Catches the live branch reading a stored record, or the DSL being read for another application. */
    @Test
    void getDsl_liveRecord_returnsTheLiveDsl_afterTheOrgCheck() {
        applicationExists(APP, ORG);
        liveDsl(APP);

        Map<String, Object> dsl = service.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APP, LATEST)).block(WAIT);

        assertThat(dsl).isEqualTo(LIVE_DSL);
        verify(applicationService).findById(APP);
        verify(recordService, never()).getById(any());
    }

    /** Catches the org check being skipped or inverted for the live branch: the DSL must not even be asked for. */
    @Test
    void getDsl_liveRecord_otherOrg_failsWithApplicationAndOrgNotMatch_andNeverReadsTheDsl() {
        applicationExists(APP, OTHER_ORG);
        liveDsl(APP);

        BizException error = failure(service.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APP, LATEST)));

        assertCode(error, BizError.APPLICATION_AND_ORG_NOT_MATCH);
        assertThat(dslSubscriptions).hasValue(0);
    }

    /** Catches the named branch returning the live DSL, or checking the org against the wrong application. */
    @Test
    void getDsl_namedRecord_returnsTheRecordsDsl_checkedOnTheRecordsApplication() {
        recordExists(RECORD, APP);
        applicationExists(APP, ORG);

        Map<String, Object> dsl = service.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APP, RECORD)).block(WAIT);

        assertThat(dsl).isEqualTo(RECORD_DSL);
        verify(applicationService).findById(APP);
        verify(applicationService, never()).getLiveDSLByApplicationId(any());
    }

    /**
     * Observed first, pinned as behaviour (no row): for a named record the {@code applicationId} of the request is not used
     * at all; the org check runs on the record's own application. A record of the caller's org is returned although the
     * requested id belongs to another org, and a record of another org is refused although the requested id is the
     * caller's own. This is the safe direction: the check follows the data that is returned.
     */
    @Test
    void getDsl_namedRecord_theRequestedApplicationIdIsIgnored_theRecordsApplicationDecides() {
        recordExists(RECORD, APP);
        applicationExists(APP, ORG);
        applicationExists(OTHER_APP, OTHER_ORG);

        Map<String, Object> dsl = service.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(OTHER_APP, RECORD)).block(WAIT);
        System.out.println(TAG + "record of the caller's org, requested id of another org -> " + dsl);
        assertThat(dsl).isEqualTo(RECORD_DSL);
        verify(applicationService, never()).findById(OTHER_APP);

        recordExists("record-2", OTHER_APP);
        BizException error = failure(service.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APP, "record-2")));
        assertCode(error, BizError.APPLICATION_AND_ORG_NOT_MATCH);
    }

    /** Catches an unknown record being swallowed into an empty answer: the not-found error must reach the caller. */
    @Test
    void getDsl_unknownRecord_propagatesNotFound() {
        when(recordService.getById("missing")).thenReturn(Mono.error(new BizException(BizError.APPLICATION_NOT_FOUND, "APPLICATION_NOT_FOUND")));

        BizException error = failure(service.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APP, "missing")));

        assertCode(error, BizError.APPLICATION_NOT_FOUND);
        verify(applicationService, never()).getLiveDSLByApplicationId(any());
    }

    /**
     * Observed behaviour, not a defect call: {@code ApplicationCombineId.isUsingEditingRecord} has no caller in this class,
     * so a record id of "editing" (or blank) is looked up like any other id. With the real
     * {@link ApplicationRecordServiceImpl} over a repository that has no such row, the request fails with
     * APPLICATION_NOT_FOUND. Reachable through {@code ApplicationRecordController.dslById} with
     * {@code ?applicationRecordId=editing}; whether a client ever sends it is not known here.
     */
    @Test
    void getDsl_editingOrBlankRecordId_isNotSpecialCased_observedBehaviour() {
        ApplicationRecordRepository repository = mock(ApplicationRecordRepository.class);
        when(repository.findById(anyString())).thenReturn(Mono.empty());
        ApplicationRecordApiServiceImpl withRealRecordService = new ApplicationRecordApiServiceImpl(applicationService,
                new ApplicationRecordServiceImpl(repository), mock(ApplicationApiServiceImpl.class), sessionUserService, orgDevChecker, userService);

        for (String id : new String[] {EDITING, ""}) {
            BizException error = failure(withRealRecordService.getRecordDSLFromApplicationCombineId(new ApplicationCombineId(APP, id)));
            assertCode(error, BizError.APPLICATION_NOT_FOUND);
            verify(repository).findById(id);
        }
        verify(applicationService, never()).getLiveDSLByApplicationId(any());
    }

    // ---------------------------------------------------------------- delete

    /** Catches the developer check being dropped: nothing may be deleted, and the deletion Mono must not even run. */
    @Test
    void delete_requiresOrgDev_andDeletesNothingOtherwise() {
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));
        recordExists(RECORD, APP);
        applicationExists(APP, ORG);

        BizException error = failure(service.delete(RECORD));

        assertCode(error, BizError.NOT_AUTHORIZED);
        assertThat(deletions).hasValue(0);
    }

    /** Catches the org comparison inverted or dropped, and the deletion running before the checks. */
    @Test
    void delete_otherOrg_failsWithApplicationAndOrgNotMatch_ownOrg_deletes() {
        recordExists(RECORD, APP);
        applicationExists(APP, OTHER_ORG);

        assertCode(failure(service.delete(RECORD)), BizError.APPLICATION_AND_ORG_NOT_MATCH);
        assertThat(deletions).as("another org's record is not deleted").hasValue(0);

        applicationExists(APP, ORG);
        service.delete(RECORD).block(WAIT);
        assertThat(deletions).as("own org's record is deleted").hasValue(1);
        verify(recordService, org.mockito.Mockito.atLeastOnce()).deleteById(RECORD);
    }

    /** Catches an unknown record turning into a successful no-op delete, or the deletion being attempted. */
    @Test
    void delete_unknownRecord_failsWithNotFound_andDeletesNothing() {
        when(recordService.getById("missing")).thenReturn(Mono.error(new BizException(BizError.APPLICATION_NOT_FOUND, "APPLICATION_NOT_FOUND")));

        BizException error = failure(service.delete("missing"));

        assertCode(error, BizError.APPLICATION_NOT_FOUND);
        assertThat(deletions).hasValue(0);
    }

    // ---------------------------------------------------------------- getByApplicationId

    @SuppressWarnings("unchecked")
    private void creators(User... users) {
        when(userService.getByIds(anyCollection())).thenAnswer(invocation -> {
            Collection<String> ids = invocation.getArgument(0);
            Map<String, User> byId = new java.util.HashMap<>();
            for (User user : users) {
                if (ids.contains(user.getId())) {
                    byId.put(user.getId(), user);
                }
            }
            return Mono.just(byId);
        });
    }

    private static User user(String id, String name) {
        return User.builder().id(id).name(name).build();
    }

    /** Catches a field copied from the wrong source, creators looked up by the wrong id, or the service's order changed. */
    @Test
    void getByApplicationId_buildsViewsWithTheCreatorName_inTheServiceOrder() {
        ApplicationVersion newer = version("r2", APP, "u2", 2_000L);
        ApplicationVersion older = version("r1", APP, "u1", 1_000L);
        applicationExists(APP, ORG);
        when(recordService.getByApplicationId(APP)).thenReturn(Mono.just(List.of(newer, older)));
        creators(user("u1", "Ada"), user("u2", "Grace"));

        List<ApplicationRecordMetaView> views = service.getByApplicationId(APP).block(WAIT);

        System.out.println(TAG + views);
        assertThat(views).containsExactly(
                new ApplicationRecordMetaView("r2", APP, "tag-r2", "msg-r2", 2_000L, "Grace"),
                new ApplicationRecordMetaView("r1", APP, "tag-r1", "msg-r1", 1_000L, "Ada"));
    }

    /**
     * Observed first, pinned as behaviour: a version whose creator is not returned by {@code UserService.getByIds}
     * is missing from the list ({@code ViewBuilder.multiBuild} drops it). That happens when the creator row is absent or
     * the creator id is null. A soft-deleted user is still returned by {@code getByIds} ({@code User.markAsDeleted} only
     * changes the state), so it does not drop. The versions written by {@code DatabaseChangelog.publishedToRecord}
     * (L2-11a) carry the application's {@code createdBy}, so they vanish from the list only for an application without
     * a creator row; this test shows the effect, not how often it occurs.
     */
    @Test
    void getByApplicationId_dropsVersionsWhoseCreatorIsUnknown_observedBehaviour() {
        applicationExists(APP, ORG);
        when(recordService.getByApplicationId(APP)).thenReturn(Mono.just(List.of(
                version("known", APP, "u1", 3_000L), version("unknownCreator", APP, "gone", 2_000L),
                version("nullCreator", APP, null, 1_000L))));
        creators(user("u1", "Ada"));

        List<ApplicationRecordMetaView> views = service.getByApplicationId(APP).block(WAIT);

        System.out.println(TAG + "views shown: " + views);
        assertThat(views).extracting(ApplicationRecordMetaView::id).containsExactly("known");
    }

    @Test
    void getByApplicationId_noRecords_returnsAnEmptyList() {
        applicationExists(APP, ORG);
        when(recordService.getByApplicationId(APP)).thenReturn(Mono.just(List.of()));
        creators();

        List<ApplicationRecordMetaView> views = service.getByApplicationId(APP).block(WAIT);

        assertThat(views).isEmpty();
        verify(userService).getByIds(List.of());
    }

    /**
     * BF-012 (was the pin of plan §9 row "application version list readable for any application id by any signed-in user"):
     * for an application of another organization the answer is APPLICATION_AND_ORG_NOT_MATCH, and neither the versions nor
     * their creators are read.
     */
    @Test
    void getByApplicationId_otherOrgsApplication_failsWithApplicationAndOrgNotMatch_andReadsNoVersions() {
        AtomicInteger versionReads = new AtomicInteger();
        applicationExists(OTHER_APP, OTHER_ORG);
        when(recordService.getByApplicationId(OTHER_APP)).thenReturn(Mono.defer(() -> {
            versionReads.incrementAndGet();
            return Mono.just(List.of(version("r1", OTHER_APP, "u1", 1_000L)));
        }));

        BizException error = failure(service.getByApplicationId(OTHER_APP));

        assertCode(error, BizError.APPLICATION_AND_ORG_NOT_MATCH);
        assertThat(versionReads).as("the version list is not read").hasValue(0);
        verifyNoInteractions(userService);
    }

    /**
     * Catches the org check being skipped for an unknown application: the lookup's failure (ApplicationServiceImpl.findById
     * answers a missing id with NO_RESOURCE_FOUND, CANT_FIND_APPLICATION) is the answer, and nothing is read.
     */
    @Test
    void getByApplicationId_unknownApplication_propagatesNotFound_andReadsNoVersions() {
        when(applicationService.findById("missing-app"))
                .thenReturn(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", "missing-app")));
        when(recordService.getByApplicationId("missing-app")).thenReturn(Mono.error(new AssertionError("versions read")));

        BizException error = failure(service.getByApplicationId("missing-app"));

        assertCode(error, BizError.NO_RESOURCE_FOUND);
        verifyNoInteractions(userService);
    }

    /**
     * BF-012 through the request stack: the production controller and the real service implementation behind it in the
     * {@link ContractTestClient} harness, services behind them mocked. A signed-in visitor of {@value #ORG} asking for the
     * versions of an application of another org gets the APPLICATION_AND_ORG_NOT_MATCH error response (HTTP 400) and no
     * creator name. Limit of the evidence: this does NOT exercise the real SecurityConfig (the harness has no security
     * chain), only the controller and the service; the SecurityConfig fall-through is read from SecurityConfig:156-157.
     */
    @Test
    void getByApplicationId_throughTheControllerAndTheRealService_refusesAnotherOrgsApplication() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        builder.visitor("user-1", member(ORG));
        ApplicationRecordService records = builder.mock(ApplicationRecordService.class);
        UserService users = builder.mock(UserService.class);
        ApplicationService applications = builder.mock(ApplicationService.class);
        SessionUserService sessions = builder.mock(SessionUserService.class);
        when(sessions.getVisitorOrgMemberCache()).thenReturn(Mono.just(member(ORG)));
        when(applications.findById("foreign-app-of-another-org")).thenReturn(Mono.just(application("foreign-app-of-another-org", OTHER_ORG)));
        when(records.getByApplicationId("foreign-app-of-another-org"))
                .thenReturn(Mono.just(List.of(version("r1", "foreign-app-of-another-org", "u1", 1_000L))));
        when(users.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("u1", user("u1", "Ada"))));
        builder.singleton("applicationRecordApiServiceImpl", new ApplicationRecordApiServiceImpl(applications, records,
                mock(ApplicationApiServiceImpl.class), sessions, builder.mock(OrgDevChecker.class), users));
        builder.controller(ApplicationRecordController.class);

        try (ContractTestClient client = builder.build()) {
            EntityExchangeResult<byte[]> result = client.web().get()
                    .uri(uri -> uri.path(NewUrl.APPLICATION_RECORD_URL + "/listByApplicationId")
                            .queryParam("applicationId", "foreign-app-of-another-org").build())
                    .exchange().expectBody().returnResult();
            System.out.println(TAG + "HTTP " + result.getStatus() + " body: "
                    + new String(result.getResponseBodyContent(), java.nio.charset.StandardCharsets.UTF_8));
            EndpointContract.assertBizError(result, BizError.APPLICATION_AND_ORG_NOT_MATCH, "APPLICATION_AND_ORG_NOT_MATCH");
            verifyNoInteractions(users);
        }
    }
}

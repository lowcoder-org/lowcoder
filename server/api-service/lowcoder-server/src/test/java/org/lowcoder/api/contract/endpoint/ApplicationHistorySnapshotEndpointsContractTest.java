package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationHistorySnapshotController;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotBriefInfo;
import org.lowcoder.api.application.ApplicationHistorySnapshotEndpoints.ApplicationHistorySnapshotRequest;
import org.lowcoder.api.application.view.HistorySnapshotDslView;
import org.lowcoder.api.contract.support.ApplicationSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadSamples;
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
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;

/**
 * Codec-level tests of the 5 {@link ApplicationHistorySnapshotEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task
 * T2.2), through the production {@link ApplicationHistorySnapshotController} in the {@link ContractTestClient} harness,
 * with every collaborator mocked.
 *
 * <p>The list endpoints return an untyped {@code Map}: {@code {"list": [ApplicationHistorySnapshotBriefInfo], "count":
 * Long}} (Appendix A), which the controller assembles from the snapshots and their creators; the DSL endpoints
 * assemble a {@code HistorySnapshotDslView} from the snapshot and the live DSL of its modules. These four are
 * {@code assembling}: the stubs are built from the samples so that what the controller assembles is the sample, and
 * the body must be the envelope around its S1 golden. {@code create} is {@code pass-through}: it passes the body's parts
 * on and wraps the {@code Boolean} of {@code ApplicationService#updateLastEditedAt}. The registry's branch occurrences inside the lambdas that
 * assemble the payload have the shape of their endpoint's branch.
 *
 * <p>The list endpoints' query parameters are declared twice: optional on the interface
 * ({@code ApplicationHistorySnapshotEndpoints.java:43-47}), required, and with another page default, on the controller
 * ({@code ApplicationHistorySnapshotController.java:60-66}). {@link #listAllHistorySnapshotBriefInfoWithoutQueryParameters}
 * pins what Spring makes of the two (plan §9 O16).
 */
class ApplicationHistorySnapshotEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(ApplicationHistorySnapshotEndpoints.class);
    static final String APPLICATION_ID = "ApplicationHistorySnapshotEndpointsContractTest.applicationId";
    static final String SNAPSHOT_ID = "ApplicationHistorySnapshotEndpointsContractTest.snapshotId";
    static final String COMP_NAME = "ApplicationHistorySnapshotEndpointsContractTest.compName";
    static final String THEME = "ApplicationHistorySnapshotEndpointsContractTest.theme";
    static final Instant FROM = Instant.parse("2026-01-01T00:00:00.123456789Z");
    static final Instant TO = Instant.parse("2026-01-02T00:00:00Z");
    static final int PAGE = 2;
    static final int SIZE = 7;
    /** Above {@code Integer.MAX_VALUE}: the count is a {@code Long}. */
    static final long COUNT = 3_000_000_090L;
    static final String LIST = "list";
    static final String COUNT_KEY = "count";
    static final String TRUE = "true";
    /** The controller's defaults, page {@code "1"} and size {@code "10"}, as the service receives them. */
    static final PageRequest DEFAULT_PAGE_REQUEST = PageRequest.of(0, 10);

    private ContractTestClient.Builder builder;
    private ApplicationHistorySnapshotService snapshotService;
    private ApplicationService applicationService;
    private UserService userService;
    private ApplicationRecordService applicationRecordService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        snapshotService = builder.mock(ApplicationHistorySnapshotService.class);
        applicationService = builder.mock(ApplicationService.class);
        userService = builder.mock(UserService.class);
        applicationRecordService = builder.mock(ApplicationRecordService.class);
        Mockito.when(builder.mock(ResourcePermissionService.class).checkResourcePermissionWithError(anyString(), anyString(),
                eq(ResourceAction.EDIT_APPLICATIONS))).thenReturn(Mono.empty());
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(ApplicationHistorySnapshotEndpointsContractTest.class);
    }

    /** The controller passes the body's parts on: the application id, the DSL and the context, compared by D1's rules. */
    @Test
    @SuppressWarnings("unchecked")
    void create() {
        ApplicationHistorySnapshotRequest expected = (ApplicationHistorySnapshotRequest) PayloadSamples.of(ApplicationHistorySnapshotRequest.class).value();
        Mockito.when(snapshotService.createHistorySnapshot(eq(expected.applicationId()), any(), any(), eq(Authentication.ANONYMOUS_USER_ID)))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(applicationService.updateLastEditedAt(eq(expected.applicationId()), any(), eq(Authentication.ANONYMOUS_USER_ID)))
                .thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(ApplicationHistorySnapshotRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<Map<String, Object>> dsl = ArgumentCaptor.forClass(Map.class);
            ArgumentCaptor<Map<String, Object>> context = ArgumentCaptor.forClass(Map.class);
            Mockito.verify(snapshotService).createHistorySnapshot(eq(expected.applicationId()), dsl.capture(), context.capture(),
                    eq(Authentication.ANONYMOUS_USER_ID));
            CanonicalJson.assertSameJava(expected.dsl(), dsl.getValue());
            CanonicalJson.assertSameJava(expected.context(), context.getValue());
        }
    }

    /** Page {@value #PAGE} of size {@value #SIZE} is asked for as {@code PageRequest} page {@value #PAGE} - 1. */
    @Test
    void listAllHistorySnapshotBriefInfo() {
        List<ApplicationHistorySnapshot> snapshots = List.of(snapshot(new ApplicationHistorySnapshot(), ApplicationHistorySnapshot::setContext),
                snapshot(new ApplicationHistorySnapshot(), ApplicationHistorySnapshot::setContext));
        Mockito.when(snapshotService.listAllHistorySnapshotBriefInfo(APPLICATION_ID, COMP_NAME, THEME, FROM, TO, PageRequest.of(PAGE - 1, SIZE)))
                .thenReturn(Mono.just(snapshots));
        Mockito.when(snapshotService.countByApplicationId(APPLICATION_ID)).thenReturn(Mono.just(COUNT));
        assertBriefInfoList("listAllHistorySnapshotBriefInfo");
    }

    @Test
    void listAllHistorySnapshotBriefInfoArchived() {
        List<ApplicationHistorySnapshotTS> snapshots = List.of(snapshot(new ApplicationHistorySnapshotTS(), ApplicationHistorySnapshotTS::setContext),
                snapshot(new ApplicationHistorySnapshotTS(), ApplicationHistorySnapshotTS::setContext));
        Mockito.when(snapshotService.listAllHistorySnapshotBriefInfoArchived(APPLICATION_ID, COMP_NAME, THEME, FROM, TO, PageRequest.of(PAGE - 1, SIZE)))
                .thenReturn(Mono.just(snapshots));
        Mockito.when(snapshotService.countByApplicationIdArchived(APPLICATION_ID)).thenReturn(Mono.just(COUNT));
        assertBriefInfoList("listAllHistorySnapshotBriefInfoArchived");
    }

    /**
     * Without query parameters (plan §9 O16): the page and size defaults are the controller's ({@code "1"}, so page 1,
     * {@code PageRequest} page 0; the interface's {@code "0"} would fail {@code Pagination#check}), and the filters reach
     * the service as {@code null} although the controller declares them required: Spring adds the interface's parameter
     * annotations that the controller's parameter lacks, among them {@code @Nullable}, which makes the parameter
     * optional. Not a response branch of the controller: the list is empty, so no user is looked up.
     */
    @Test
    void listAllHistorySnapshotBriefInfoWithoutQueryParameters() {
        Mockito.when(snapshotService.listAllHistorySnapshotBriefInfo(any(), any(), any(), any(), any(), any())).thenReturn(Mono.just(List.of()));
        Mockito.when(userService.getByIds(any())).thenReturn(Mono.just(Map.of()));
        Mockito.when(snapshotService.countByApplicationId(APPLICATION_ID)).thenReturn(Mono.just(COUNT));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listAllHistorySnapshotBriefInfo", Map.of(), null, APPLICATION_ID);
            ArgumentCaptor<PageRequest> page = ArgumentCaptor.forClass(PageRequest.class);
            Mockito.verify(snapshotService).listAllHistorySnapshotBriefInfo(eq(APPLICATION_ID), isNull(), isNull(), isNull(), isNull(), page.capture());
            System.out.println("[ApplicationHistorySnapshotEndpointsContractTest] without query parameters: " + result.getStatus().value()
                    + ", filters null, page=" + page.getValue());
            assertThat(page.getValue()).isEqualTo(DEFAULT_PAGE_REQUEST);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(
                    "{\"" + LIST + "\":[],\"" + COUNT_KEY + "\":" + COUNT + "}"));
        }
    }

    @Test
    void getHistorySnapshotDsl() {
        HistorySnapshotDslView view = ApplicationSamples.historySnapshotDslView();
        ApplicationHistorySnapshot snapshot = new ApplicationHistorySnapshot();
        snapshot.setDsl(view.getApplicationsDsl());
        Mockito.when(snapshotService.getHistorySnapshotDetail(SNAPSHOT_ID)).thenReturn(Mono.just(snapshot));
        stubModules(view);
        assertDslView("getHistorySnapshotDsl");
    }

    @Test
    void getHistorySnapshotDslArchived() {
        HistorySnapshotDslView view = ApplicationSamples.historySnapshotDslView();
        ApplicationHistorySnapshotTS snapshot = new ApplicationHistorySnapshotTS();
        snapshot.setDsl(view.getApplicationsDsl());
        Mockito.when(snapshotService.getHistorySnapshotDetailArchived(SNAPSHOT_ID)).thenReturn(Mono.just(snapshot));
        stubModules(view);
        assertDslView("getHistorySnapshotDslArchived");
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(ApplicationHistorySnapshotController.class).build();
    }

    /**
     * A snapshot (either kind) whose brief info is the sample: its id, context, creator and creation time. The
     * creator's user has no avatar of its own, so {@code User#getAvatarUrl} answers its third-party link, the sample's
     * {@code userAvatar}. The user is made as the store makes it, with the no-argument constructor: {@code User.builder()}
     * skips the initializer of the {@code avatarUrl} supplier (it has no {@code @Builder.Default}), and such a user
     * answers {@code ""}.
     */
    private <T extends HasIdAndAuditing> T snapshot(T snapshot, BiConsumer<T, Map<String, Object>> setContext) {
        ApplicationHistorySnapshotBriefInfo info = ApplicationSamples.applicationHistorySnapshotBriefInfo();
        snapshot.setId(info.snapshotId());
        snapshot.setCreatedBy(info.userId());
        snapshot.setCreatedAt(ApplicationSamples.SNAPSHOT_CREATED_AT);
        setContext.accept(snapshot, info.context());
        User user = new User();
        user.setId(info.userId());
        user.setName(info.userName());
        user.setTpAvatarLink(info.userAvatar());
        Mockito.when(userService.getByIds(any())).thenReturn(Mono.just(Map.of(info.userId(), user)));
        return snapshot;
    }

    private void assertBriefInfoList(String method) {
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("page", PAGE);
        query.put("size", SIZE);
        query.put("compName", COMP_NAME);
        query.put("theme", THEME);
        query.put("from", FROM);
        query.put("to", TO);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, query, null, APPLICATION_ID);
            String info = EndpointContract.s1(ApplicationHistorySnapshotBriefInfo.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(
                    "{\"" + LIST + "\":" + EndpointContract.array(info, info) + ",\"" + COUNT_KEY + "\":" + COUNT + "}"));
        }
    }

    /** The modules the snapshot's DSL uses: one application per {@code moduleDSL} entry, with no published record. */
    private void stubModules(HistorySnapshotDslView view) {
        List<Application> modules = new ArrayList<>();
        view.getModuleDSL().forEach((id, dsl) -> modules.add(Application.builder().id(id).editingApplicationDSL(dsl).build()));
        Mockito.when(applicationService.getAllDependentModulesFromDsl(view.getApplicationsDsl())).thenReturn(Mono.just(modules));
        Mockito.when(applicationRecordService.getLatestRecordByApplicationId(anyString())).thenReturn(Mono.empty());
    }

    private void assertDslView(String method) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, Map.of(), null, APPLICATION_ID, SNAPSHOT_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(HistorySnapshotDslView.class)));
        }
    }
}

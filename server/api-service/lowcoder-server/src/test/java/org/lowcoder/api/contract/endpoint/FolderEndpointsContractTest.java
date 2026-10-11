package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.contract.support.ApplicationSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.FolderController;
import org.lowcoder.api.home.FolderEndpoints;
import org.lowcoder.api.home.FolderEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.home.FolderEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.home.FolderInfoView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.model.FolderElement;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.APPLICATION_MOVE;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 9 {@link FolderEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T6.1), through the
 * production {@link FolderController} in the {@link ContractTestClient} harness, with every collaborator mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens ({@code Folder} is WP1's representative); the argument the service receives
 * is captured and compared with D1's rules ({@link PayloadAssertions#assertBindsTo}), or, where the controller passes on
 * parts of the body, part by part. Response: the service mocks return the samples, so the body must be the envelope
 * golden around their S1 goldens ({@link EndpointContract}); the {@code ResponseView<Void>} endpoints answer the envelope
 * without {@code data}. One test per registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code getElements}, whose page the
 * controller cuts from the service's {@code Flux<?>}, whose elements are {@link ApplicationInfoView}s and
 * {@link FolderInfoView}s ({@code FolderApiServiceImpl#getElements}, Appendix A); {@code pass-through} for the others,
 * where the payload is one service result in a {@code ResponseView}, even when other calls (id conversion, event
 * publishing, the original folder {@code update} reads, the application {@code move} reads) run beside it. The folder
 * id conversion is stubbed as the identity. Limits: the business events are mocks that complete empty; what they
 * publish is not part of the JSON contract, except that {@code move} must pass on the folders it read.
 */
class FolderEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(FolderEndpoints.class);
    static final String FOLDER_ID = "FolderEndpointsContractTest.folderId";
    static final String FROM_FOLDER_ID = "FolderEndpointsContractTest.fromFolderId";
    static final String TARGET_FOLDER_ID = "FolderEndpointsContractTest.targetFolderId";
    static final String APPLICATION_ID = "FolderEndpointsContractTest.applicationId";
    static final String PERMISSION_ID = "FolderEndpointsContractTest.permissionId";
    static final String UNKNOWN_ROLE = "FolderEndpointsContractTest.unknownRole";
    static final String NAME = "FolderEndpointsContractTest.name";
    static final String CATEGORY = "FolderEndpointsContractTest.category";
    /** {@code @RequestParam ApplicationType} binds the constant's name. */
    static final ApplicationType APPLICATION_TYPE = ApplicationType.MODULE;
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 2;
    /** {@code getElements}' defaults ({@code FolderEndpoints}): the first page, and {@code 0}, all elements. */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 0;
    /** {@code getEditingApplication(applicationId, withDeleted)} as {@code move} calls it. */
    static final Boolean WITH_DELETED = Boolean.TRUE;

    private ContractTestClient.Builder builder;
    private FolderApiService folderApiService;
    private FolderService folderService;
    private FolderElementRelationService folderElementRelationService;
    private ApplicationApiService applicationApiService;
    private BusinessEventPublisher businessEventPublisher;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        // Mono<Void> results (permissions, move, last view time) complete empty unless a test stubs them
        folderApiService = Mockito.mock(FolderApiService.class, ApplicationEndpointsContractTest.EMPTY_MONO);
        builder.singleton("folderApiService", folderApiService);
        folderService = builder.mock(FolderService.class);
        folderElementRelationService = builder.mock(FolderElementRelationService.class);
        applicationApiService = builder.mock(ApplicationApiService.class);
        GidService gidService = builder.mock(GidService.class);
        Mockito.when(gidService.convertFolderIdToObjectId(any())).thenAnswer(invocation -> Mono.just(Optional.ofNullable(invocation.getArgument(0))));
        businessEventPublisher = Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO);
        builder.singleton("businessEventPublisher", businessEventPublisher);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(FolderEndpointsContractTest.class);
    }

    @Test
    void create() {
        Mockito.when(folderApiService.create(any())).thenReturn(Mono.just(ApplicationSamples.folderInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(Folder.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(FolderInfoView.class)));
            ArgumentCaptor<Folder> folder = ArgumentCaptor.forClass(Folder.class);
            Mockito.verify(folderApiService).create(folder.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(Folder.class), folder.getValue());
            Mockito.verify(folderApiService).upsertLastViewTime(ApplicationSamples.folderInfoView().getFolderId());
        }
    }

    /** The deleted folder goes to the event only; the answer has no {@code data}. */
    @Test
    void delete() {
        Mockito.when(folderApiService.delete(FOLDER_ID)).thenReturn(Mono.just(PayloadSamples.folder()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, FOLDER_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(folderApiService).delete(FOLDER_ID);
        }
    }

    /** The bound {@link Folder} goes to the service; its id is also the one the original is read by. */
    @Test
    void update() {
        Folder bound = (Folder) PayloadSamples.of(Folder.class).value();
        Mockito.when(folderService.findById(bound.getId())).thenReturn(Mono.just(PayloadSamples.folder()));
        Mockito.when(folderApiService.update(any())).thenReturn(Mono.just(ApplicationSamples.folderInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of(), EndpointContract.d1(Folder.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(FolderInfoView.class)));
            ArgumentCaptor<Folder> folder = ArgumentCaptor.forClass(Folder.class);
            Mockito.verify(folderApiService).update(folder.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(Folder.class), folder.getValue());
            Mockito.verify(folderService).findById(bound.getId());
        }
    }

    /**
     * Page 2 of size 2 out of five elements, applications and folders alternating: the third and fourth element, one
     * of each class, and the total of all five. Every query parameter reaches the service; the parameter {@code id} is
     * the folder.
     */
    @Test
    void getElements() {
        stubElements(FOLDER_ID, APPLICATION_TYPE, NAME, CATEGORY, 5);
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("id", FOLDER_ID);
        query.put("applicationType", APPLICATION_TYPE.name());
        query.put("name", NAME);
        query.put("category", CATEGORY);
        query.put("pageNum", PAGE_NUM);
        query.put("pageSize", PAGE_SIZE);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getElements", query, null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(EndpointContract.array(
                    EndpointContract.s1(ApplicationInfoView.class), EndpointContract.s1(FolderInfoView.class)), PAGE_NUM, PAGE_SIZE, 5));
            Mockito.verify(folderApiService).getElements(FOLDER_ID, APPLICATION_TYPE, NAME, CATEGORY);
            Mockito.verify(folderApiService).upsertLastViewTime(FOLDER_ID);
        }
    }

    /**
     * Without any parameter: the root folder ({@code null}), no filters, and page size {@code 0}, which takes every
     * element. Same response branch as {@link #getElements()}.
     */
    @Test
    void getElementsWithDefaultPaging() {
        stubElements(null, null, null, null, 2);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getElements", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(EndpointContract.array(
                    EndpointContract.s1(ApplicationInfoView.class), EndpointContract.s1(FolderInfoView.class)), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2));
            Mockito.verify(folderApiService).getElements(null, null, null, null);
            Mockito.verify(folderApiService).upsertLastViewTime(null);
        }
    }

    /** The application is in a folder: the event gets the folder it leaves and the target. */
    @Test
    void move() {
        Mockito.when(folderElementRelationService.getByElementIds(List.of(APPLICATION_ID)))
                .thenReturn(Flux.just(new FolderElement(FROM_FOLDER_ID, APPLICATION_ID)));
        assertMove(Map.of("targetFolderId", TARGET_FOLDER_ID), FROM_FOLDER_ID, TARGET_FOLDER_ID);
    }

    /**
     * The application is in no folder ({@code defaultIfEmpty}), and without {@code targetFolderId} it moves to the root:
     * the event and the service get {@code null} for both. Same response shape as {@link #move()}.
     */
    @Test
    void moveWithoutCurrentFolder() {
        Mockito.when(folderElementRelationService.getByElementIds(List.of(APPLICATION_ID))).thenReturn(Flux.empty());
        assertMove(Map.of(), null, null);
    }

    /** The D1 role is {@code ApplicationSamples#VIEWER_ROLE}. */
    @Test
    void updatePermission() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    EndpointContract.d1(UpdatePermissionRequest.class), FOLDER_ID, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(folderApiService).updatePermission(FOLDER_ID, PERMISSION_ID, ResourceRole.VIEWER);
        }
    }

    /** A role {@code ResourceRole.fromValue} does not know: {@code INVALID_PARAMETER} naming the whole request. */
    @Test
    void updatePermissionWithUnknownRole() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    "{\"role\": \"" + UNKNOWN_ROLE + "\"}", FOLDER_ID, PERMISSION_ID);
            EndpointContract.assertInvalidParameter(result, new UpdatePermissionRequest(UNKNOWN_ROLE));
            Mockito.verify(folderApiService, Mockito.never()).updatePermission(any(), any(), any());
        }
    }

    @Test
    void removePermission() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "removePermission", Map.of(), null, FOLDER_ID, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(folderApiService).removePermission(FOLDER_ID, PERMISSION_ID);
        }
    }

    /**
     * The controller passes the body's parts on: both id sets as bound (D6 pins their class) and the D1 role,
     * {@code ApplicationSamples#EDITOR_ROLE}.
     */
    @Test
    @SuppressWarnings("unchecked")
    void grantPermission() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "grantPermission", Map.of(),
                    EndpointContract.d1(BatchAddPermissionRequest.class), FOLDER_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            ArgumentCaptor<Set<String>> userIds = ArgumentCaptor.forClass(Set.class);
            ArgumentCaptor<Set<String>> groupIds = ArgumentCaptor.forClass(Set.class);
            Mockito.verify(folderApiService).grantPermission(eq(FOLDER_ID), userIds.capture(), groupIds.capture(), eq(ResourceRole.EDITOR));
            BatchAddPermissionRequest expected = (BatchAddPermissionRequest) PayloadSamples.of(BatchAddPermissionRequest.class).value();
            CanonicalJson.assertSameJava(expected.userIds(), userIds.getValue());
            CanonicalJson.assertSameJava(expected.groupIds(), groupIds.getValue());
        }
    }

    /** A role {@code ResourceRole.fromValue} does not know: {@code INVALID_PARAMETER} naming the role. */
    @Test
    void grantPermissionWithUnknownRole() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "grantPermission", Map.of(),
                    "{\"role\": \"" + UNKNOWN_ROLE + "\"}", FOLDER_ID);
            EndpointContract.assertInvalidParameter(result, UNKNOWN_ROLE);
            Mockito.verify(folderApiService, Mockito.never()).grantPermission(any(), any(), any(), any());
        }
    }

    /** The controller answers {@code FolderApiService#getPermissions}. */
    @Test
    void getApplicationPermissions() {
        Mockito.when(folderApiService.getPermissions(FOLDER_ID)).thenReturn(Mono.just(ApplicationSamples.applicationPermissionView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getApplicationPermissions", Map.of(), null, FOLDER_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationPermissionView.class)));
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(FolderController.class).build();
    }

    /**
     * {@code count} elements for these service arguments, an {@link ApplicationInfoView} at even and a
     * {@link FolderInfoView} at odd positions; the service's {@code Flux<?>} is raw, so the stub is cast through it.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void stubElements(String folderId, ApplicationType applicationType, String name, String category, int count) {
        Flux elements = Flux.range(0, count).map(i -> i % 2 == 0 ? ApplicationSamples.applicationInfoView() : ApplicationSamples.folderInfoView());
        Mockito.when(folderApiService.getElements(folderId, applicationType, name, category)).thenReturn(elements);
    }

    /** {@code move} of {@link #APPLICATION_ID}: the answer has no {@code data}; the service and the event get the folders. */
    private void assertMove(Map<String, ?> query, String fromFolderId, String targetFolderId) {
        ApplicationView original = ApplicationSamples.applicationView();
        Mockito.when(applicationApiService.getEditingApplication(APPLICATION_ID, WITH_DELETED)).thenReturn(Mono.just(original));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "move", query, null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(folderApiService).move(APPLICATION_ID, targetFolderId);
            Mockito.verify(businessEventPublisher).publishApplicationCommonEvent(original, APPLICATION_ID, fromFolderId, targetFolderId, APPLICATION_MOVE);
        }
    }
}

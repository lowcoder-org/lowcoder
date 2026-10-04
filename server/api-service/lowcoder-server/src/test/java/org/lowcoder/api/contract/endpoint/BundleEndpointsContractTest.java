package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.bundle.BundleApiService;
import org.lowcoder.api.bundle.BundleController;
import org.lowcoder.api.bundle.BundleEndpoints;
import org.lowcoder.api.bundle.BundleEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundleAsAgencyProfileRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToAllRequest;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToMarketplaceRequest;
import org.lowcoder.api.bundle.BundleEndpoints.CreateBundleRequest;
import org.lowcoder.api.bundle.BundleEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.contract.support.BundleSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleApplication;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 24 {@link BundleEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T3.1), through the
 * production {@link BundleController} in the {@link ContractTestClient} harness, with every collaborator mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens; the argument the service receives is captured and compared with D1's
 * rules ({@link PayloadAssertions#assertBindsTo}), or, where the controller passes on parts of the body, part by part.
 * Response: the service mocks return the samples, so the body must be the envelope golden around their S1 goldens
 * ({@link EndpointContract}); the {@code ResponseView<Void>} endpoints answer the envelope without {@code data}. One
 * test per registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code getElements}, whose page the
 * controller cuts from the service's {@code Flux<?>} of {@link BundleApplication}s (Appendix A); {@code pass-through}
 * for the others, where the payload is one service result in a {@code ResponseView}, even when other calls (id
 * conversion, event publishing, the original bundle {@code update} reads) run beside it. Limits: the business events
 * are mocks that complete empty; what they publish is not part of the JSON contract.
 */
class BundleEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(BundleEndpoints.class);
    static final String BUNDLE_ID = "BundleEndpointsContractTest.bundleId";
    static final String TO_BUNDLE_ID = "BundleEndpointsContractTest.toBundleId";
    static final String APPLICATION_ID = "BundleEndpointsContractTest.applicationId";
    static final String PERMISSION_ID = "BundleEndpointsContractTest.permissionId";
    static final String UNKNOWN_ROLE = "BundleEndpointsContractTest.unknownRole";
    static final List<String> ELEMENT_IDS = List.of("BundleEndpointsContractTest.elementIds[0]", "BundleEndpointsContractTest.elementIds[1]");
    /** A list request parameter as a client sends it: comma-separated, split by Spring's conversion. */
    static final String ELEMENT_IDS_PARAMETER = String.join(",", ELEMENT_IDS);
    /** {@code @RequestParam ApplicationType} binds the constant's name. */
    static final ApplicationType APPLICATION_TYPE = ApplicationType.APPLICATION;
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 1;
    /** {@code getElements}' defaults ({@code BundleController}): the first page, and {@code 0}, all elements. */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 0;
    /** When the deleted bundle was created: {@code delete} reads it for its event, so it must be set. */
    static final Instant DELETED_BUNDLE_CREATED_AT = Instant.ofEpochSecond(1_767_225_900L, 123_456_789L);
    static final String TRUE = "true";

    private ContractTestClient.Builder builder;
    private BundleApiService bundleApiService;
    private BundleService bundleService;
    private UserHomeApiService userHomeApiService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        bundleApiService = builder.mock(BundleApiService.class);
        bundleService = builder.mock(BundleService.class);
        userHomeApiService = builder.mock(UserHomeApiService.class);
        GidService gidService = builder.mock(GidService.class);
        Mockito.when(gidService.convertBundleIdToObjectId(anyString())).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        Mockito.when(gidService.convertApplicationIdToObjectId(anyString())).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        builder.singleton("businessEventPublisher", Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(BundleEndpointsContractTest.class);
    }

    @Test
    void create() {
        Mockito.when(bundleApiService.create(any())).thenReturn(Mono.just(BundleSamples.bundleInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(CreateBundleRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(BundleInfoView.class)));
            ArgumentCaptor<CreateBundleRequest> request = ArgumentCaptor.forClass(CreateBundleRequest.class);
            Mockito.verify(bundleApiService).create(request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(CreateBundleRequest.class), request.getValue());
        }
    }

    /** The deleted bundle goes to the event only; the answer has no {@code data}. */
    @Test
    void delete() {
        Bundle deleted = BundleSamples.bundle();
        deleted.setCreatedAt(DELETED_BUNDLE_CREATED_AT);
        Mockito.when(bundleApiService.delete(BUNDLE_ID)).thenReturn(Mono.just(deleted));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(bundleApiService).delete(BUNDLE_ID);
        }
    }

    /** The bound {@link Bundle} goes to the service; its id is also the one the original is read by. */
    @Test
    void update() {
        Bundle bound = (Bundle) PayloadSamples.of(Bundle.class).value();
        Mockito.when(bundleService.findById(bound.getId())).thenReturn(Mono.just(BundleSamples.bundle()));
        Mockito.when(bundleApiService.update(any())).thenReturn(Mono.just(BundleSamples.bundleInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of(), EndpointContract.d1(Bundle.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(BundleInfoView.class)));
            ArgumentCaptor<Bundle> bundle = ArgumentCaptor.forClass(Bundle.class);
            Mockito.verify(bundleApiService).update(bundle.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(Bundle.class), bundle.getValue());
            Mockito.verify(bundleService).findById(bound.getId());
        }
    }

    @Test
    void publish() {
        Mockito.when(bundleApiService.publish(BUNDLE_ID)).thenReturn(Mono.just(BundleSamples.bundleInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "publish", Map.of(), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(BundleInfoView.class)));
        }
    }

    @Test
    void recycle() {
        Mockito.when(bundleApiService.recycle(BUNDLE_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "recycle", Map.of(), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    @Test
    void restore() {
        Mockito.when(bundleApiService.restore(BUNDLE_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "restore", Map.of(), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    @Test
    void getRecycledBundles() {
        Mockito.when(bundleApiService.getRecycledBundles()).thenReturn(Flux.just(BundleSamples.bundleInfoView(), BundleSamples.bundleInfoView()));
        assertBundleInfoList("getRecycledBundles", Map.of());
    }

    /** Page 2 of size 1 out of three elements: one element, and the total of all three. */
    @Test
    void getElements() {
        stubElements(3);
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("applicationType", APPLICATION_TYPE.name());
        query.put("pageNum", PAGE_NUM);
        query.put("pageSize", PAGE_SIZE);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getElements", query, null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(EndpointContract.s1(BundleApplication.class)), PAGE_NUM, PAGE_SIZE, 3), unorderedElements(1));
            Mockito.verify(bundleApiService).getElements(BUNDLE_ID, APPLICATION_TYPE);
        }
    }

    /**
     * Without paging parameters or an application type: page size {@code 0} takes every element, and the service gets
     * a null type. Same response branch as {@link #getElements()}.
     */
    @Test
    void getElementsWithDefaultPaging() {
        stubElements(2);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getElements", Map.of(), null, BUNDLE_ID);
            String element = EndpointContract.s1(BundleApplication.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(element, element), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2), unorderedElements(2));
            Mockito.verify(bundleApiService).getElements(BUNDLE_ID, null);
        }
    }

    @Test
    void moveApp() {
        Mockito.when(bundleApiService.moveApp(APPLICATION_ID, BUNDLE_ID, TO_BUNDLE_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "moveApp",
                    Map.of("fromBundleId", BUNDLE_ID, "toBundleId", TO_BUNDLE_ID), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(bundleApiService).moveApp(APPLICATION_ID, BUNDLE_ID, TO_BUNDLE_ID);
        }
    }

    @Test
    void addApp() {
        Mockito.when(bundleApiService.addApp(APPLICATION_ID, TO_BUNDLE_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "addApp", Map.of("toBundleId", TO_BUNDLE_ID), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(bundleApiService).addApp(APPLICATION_ID, TO_BUNDLE_ID);
        }
    }

    /** {@code elementIds} arrives as one comma-separated parameter and reaches the service as a list, in order. */
    @Test
    void reorder() {
        Mockito.when(bundleApiService.reorder(BUNDLE_ID, ELEMENT_IDS)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "reorder", Map.of("elementIds", ELEMENT_IDS_PARAMETER), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(bundleApiService).reorder(BUNDLE_ID, ELEMENT_IDS);
        }
    }

    /** The D1 role is {@code ApplicationSamples#VIEWER_ROLE}. */
    @Test
    void updatePermission() {
        Mockito.when(bundleApiService.updatePermission(BUNDLE_ID, PERMISSION_ID, ResourceRole.VIEWER)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    EndpointContract.d1(UpdatePermissionRequest.class), BUNDLE_ID, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(bundleApiService).updatePermission(BUNDLE_ID, PERMISSION_ID, ResourceRole.VIEWER);
        }
    }

    /** A role {@code ResourceRole.fromValue} does not know: {@code INVALID_PARAMETER} naming the whole request. */
    @Test
    void updatePermissionWithUnknownRole() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    "{\"role\": \"" + UNKNOWN_ROLE + "\"}", BUNDLE_ID, PERMISSION_ID);
            EndpointContract.assertInvalidParameter(result, new UpdatePermissionRequest(UNKNOWN_ROLE));
        }
    }

    @Test
    void removePermission() {
        Mockito.when(bundleApiService.removePermission(BUNDLE_ID, PERMISSION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "removePermission", Map.of(), null, BUNDLE_ID, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            Mockito.verify(bundleApiService).removePermission(BUNDLE_ID, PERMISSION_ID);
        }
    }

    /**
     * The controller passes the body's parts on: both id sets as bound (D6 pins their class) and the D1 role,
     * {@code ApplicationSamples#EDITOR_ROLE}.
     */
    @Test
    @SuppressWarnings("unchecked")
    void grantPermission() {
        Mockito.when(bundleApiService.grantPermission(eq(BUNDLE_ID), any(), any(), eq(ResourceRole.EDITOR))).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "grantPermission", Map.of(),
                    EndpointContract.d1(BatchAddPermissionRequest.class), BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
            ArgumentCaptor<Set<String>> userIds = ArgumentCaptor.forClass(Set.class);
            ArgumentCaptor<Set<String>> groupIds = ArgumentCaptor.forClass(Set.class);
            Mockito.verify(bundleApiService).grantPermission(eq(BUNDLE_ID), userIds.capture(), groupIds.capture(), eq(ResourceRole.EDITOR));
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
                    "{\"role\": \"" + UNKNOWN_ROLE + "\"}", BUNDLE_ID);
            EndpointContract.assertInvalidParameter(result, UNKNOWN_ROLE);
        }
    }

    /** The controller answers {@code BundleApiService#getPermissions}. */
    @Test
    void getBundlePermissions() {
        Mockito.when(bundleApiService.getPermissions(BUNDLE_ID)).thenReturn(Mono.just(BundleSamples.bundlePermissionView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getBundlePermissions", Map.of(), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(BundlePermissionView.class)));
        }
    }

    @Test
    void getPublishedBundle() {
        assertPublishedView("getPublishedBundle", BundleRequestType.PUBLIC_TO_ALL);
    }

    @Test
    void getPublishedMarketPlaceBundle() {
        assertPublishedView("getPublishedMarketPlaceBundle", BundleRequestType.PUBLIC_TO_MARKETPLACE);
    }

    @Test
    void getAgencyProfileBundle() {
        assertPublishedView("getAgencyProfileBundle", BundleRequestType.AGENCY_PROFILE);
    }

    /** {@code @RequestParam BundleStatus} binds the constant's name. */
    @Test
    void getBundles() {
        Mockito.when(userHomeApiService.getAllAuthorisedBundles4CurrentOrgMember(BundleStatus.RECYCLED))
                .thenReturn(Flux.just(BundleSamples.bundleInfoView(), BundleSamples.bundleInfoView()));
        assertBundleInfoList("getBundles", Map.of("bundleStatus", BundleStatus.RECYCLED.name()));
    }

    @Test
    void getMarketplaceBundles() {
        Mockito.when(userHomeApiService.getAllMarketplaceBundles())
                .thenReturn(Flux.just(BundleSamples.marketplaceBundleInfoView(), BundleSamples.marketplaceBundleInfoView()));
        assertMarketplaceList("getMarketplaceBundles");
    }

    @Test
    void getAgencyProfileBundles() {
        Mockito.when(userHomeApiService.getAllAgencyProfileBundles())
                .thenReturn(Flux.just(BundleSamples.marketplaceBundleInfoView(), BundleSamples.marketplaceBundleInfoView()));
        assertMarketplaceList("getAgencyProfileBundles");
    }

    @Test
    void setBundlePublicToAll() {
        boolean publicToAll = ((BundlePublicToAllRequest) PayloadSamples.of(BundlePublicToAllRequest.class).value()).publicToAll();
        Mockito.when(bundleApiService.setBundlePublicToAll(BUNDLE_ID, publicToAll)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setBundlePublicToAll", Map.of(),
                    EndpointContract.d1(BundlePublicToAllRequest.class), BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(bundleApiService).setBundlePublicToAll(BUNDLE_ID, publicToAll);
        }
    }

    @Test
    void setBundlePublicToMarketplace() {
        Mockito.when(bundleApiService.setBundlePublicToMarketplace(eq(BUNDLE_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setBundlePublicToMarketplace", Map.of(),
                    EndpointContract.d1(BundlePublicToMarketplaceRequest.class), BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<BundlePublicToMarketplaceRequest> request = ArgumentCaptor.forClass(BundlePublicToMarketplaceRequest.class);
            Mockito.verify(bundleApiService).setBundlePublicToMarketplace(eq(BUNDLE_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(BundlePublicToMarketplaceRequest.class), request.getValue());
        }
    }

    @Test
    void setBundleAsAgencyProfile() {
        boolean agencyProfile = ((BundleAsAgencyProfileRequest) PayloadSamples.of(BundleAsAgencyProfileRequest.class).value()).agencyProfile();
        Mockito.when(bundleApiService.setBundleAsAgencyProfile(BUNDLE_ID, agencyProfile)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setBundleAsAgencyProfile", Map.of(),
                    EndpointContract.d1(BundleAsAgencyProfileRequest.class), BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(bundleApiService).setBundleAsAgencyProfile(BUNDLE_ID, agencyProfile);
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(BundleController.class).build();
    }

    /** {@code count} element samples; the service's {@code Flux<?>} is raw, so the stub is cast through it. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void stubElements(int count) {
        Flux elements = Flux.fromStream(IntStream.range(0, count).mapToObj(i -> BundleSamples.bundleApplication()));
        Mockito.when(bundleApiService.getElements(eq(BUNDLE_ID), any())).thenReturn(elements);
    }

    /** The {@code PayloadAssertions#UNORDERED_ARRAYS} of the first {@code count} {@link BundleApplication}s of a page. */
    private static List<String> unorderedElements(int count) {
        List<String> pointers = PayloadAssertions.UNORDERED_ARRAYS.get(BundleApplication.class.getName());
        return IntStream.range(0, count).boxed().flatMap(i -> pointers.stream().map(pointer -> "/" + EndpointContract.DATA + "/" + i + pointer)).toList();
    }

    private void assertPublishedView(String method, BundleRequestType requestType) {
        Mockito.when(bundleApiService.getPublishedBundle(BUNDLE_ID, requestType)).thenReturn(Mono.just(BundleSamples.bundleInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, Map.of(), null, BUNDLE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(BundleInfoView.class)));
        }
    }

    private void assertBundleInfoList(String method, Map<String, ?> query) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, query, null);
            String view = EndpointContract.s1(BundleInfoView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(view, view)));
        }
    }

    private void assertMarketplaceList(String method) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, Map.of(), null);
            String view = EndpointContract.s1(MarketplaceBundleInfoView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(view, view)));
        }
    }
}

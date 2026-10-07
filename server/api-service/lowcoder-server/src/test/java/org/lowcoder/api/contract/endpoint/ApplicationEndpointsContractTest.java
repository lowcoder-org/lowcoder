package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.application.ApplicationController;
import org.lowcoder.api.application.ApplicationEndpoints;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationAsAgencyProfileRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToAllRequest;
import org.lowcoder.api.application.ApplicationEndpoints.ApplicationPublicToMarketplaceRequest;
import org.lowcoder.api.application.ApplicationEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
import org.lowcoder.api.application.ApplicationEndpoints.UpdateEditStateRequest;
import org.lowcoder.api.application.ApplicationEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
import org.lowcoder.api.contract.support.ApplicationSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.UserManagementSamples;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 26 {@link ApplicationEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T2.1), through
 * the production {@link ApplicationController} in the {@link ContractTestClient} harness, with every collaborator
 * mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens; the argument the service receives is captured and compared with D1's
 * rules ({@link PayloadAssertions#assertBindsTo}), or, where the controller passes on parts of the body, part by part.
 * Response: the service mocks return the samples, so the body must be the envelope golden around their S1 goldens
 * ({@link EndpointContract}). One test per registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} where the controller builds the payload
 * itself, the paging of {@code getApplications} and {@code getGroupsOrMembersWithoutPermissions} (which also filters
 * the {@code {"type", "data"}} maps of Appendix A); {@code pass-through} where the payload is one service result in a
 * {@code ResponseView}, even when other calls (event publishing, the view-time update, the original view for the
 * event) run beside it. Limits: the business events are mocks that complete empty; what they publish is not part of
 * the JSON contract.
 */
class ApplicationEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(ApplicationEndpoints.class);
    static final String APPLICATION_ID = "ApplicationEndpointsContractTest.applicationId";
    static final String PERMISSION_ID = "ApplicationEndpointsContractTest.permissionId";
    static final String TEMPLATE_ID = "ApplicationEndpointsContractTest.templateId";
    static final String NAME = "ApplicationEndpointsContractTest.name";
    static final String CATEGORY = "ApplicationEndpointsContractTest.category";
    static final String UNKNOWN_ROLE = "ApplicationEndpointsContractTest.unknownRole";
    /** A JSON string: a {@code @RequestBody String} receives the body text as it is, quotes included. */
    static final String SLUG_BODY = "\"ApplicationEndpointsContractTest.slug\"";
    static final String LATEST_TAG = "1.2.3";
    static final String NEXT_TAG = "1.2.4";
    /** {@code ApplicationController#publish}'s tag and commit message when there is no body and no record. */
    static final String FIRST_TAG = "1.0.0";
    static final String NO_COMMIT_MESSAGE = "";
    static final int APPLICATION_TYPE = ApplicationType.APPLICATION.getValue();
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 1;
    /** {@code getGroupsOrMembersWithoutPermissions}'s defaults ({@code ApplicationEndpoints}). */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 1000;
    /** The keys and type names {@code ApplicationApiServiceImpl#getGroupsOrMembersWithoutPermissions} builds. */
    static final String ENTRY_TYPE = "type";
    static final String ENTRY_DATA = "data";
    static final String GROUP_ENTRY = "Group";
    static final String USER_ENTRY = "User";
    /** Matches {@code GroupView.groupName} ignoring case, and not {@code OrgMemberView.name}. */
    static final String GROUP_SEARCH = "groupview.GROUPNAME";
    static final String TRUE = "true";
    /** The business events are fire-and-forget {@code Mono<Void>}s; their mock completes empty. */
    static final Answer<Object> EMPTY_MONO = invocation -> invocation.getMethod().getReturnType() == Mono.class
            ? Mono.empty() : Mockito.RETURNS_DEFAULTS.answer(invocation);

    private ContractTestClient.Builder builder;
    private ApplicationApiService applicationApiService;
    private UserHomeApiService userHomeApiService;
    private ApplicationRecordService applicationRecordService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        applicationApiService = builder.mock(ApplicationApiService.class);
        userHomeApiService = builder.mock(UserHomeApiService.class);
        applicationRecordService = builder.mock(ApplicationRecordService.class);
        GidService gidService = builder.mock(GidService.class);
        Mockito.when(gidService.convertApplicationIdToObjectId(anyString())).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        builder.singleton("businessEventPublisher", Mockito.mock(BusinessEventPublisher.class, EMPTY_MONO));
        Mockito.when(applicationApiService.updateUserApplicationLastViewTime(anyString())).thenReturn(Mono.empty());
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(ApplicationEndpointsContractTest.class);
    }

    @Test
    void create() {
        Mockito.when(applicationApiService.create(any())).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(CreateApplicationRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
            ArgumentCaptor<CreateApplicationRequest> request = ArgumentCaptor.forClass(CreateApplicationRequest.class);
            Mockito.verify(applicationApiService).create(request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(CreateApplicationRequest.class), request.getValue());
        }
    }

    @Test
    void createFromTemplate() {
        Mockito.when(applicationApiService.createFromTemplate(TEMPLATE_ID)).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "createFromTemplate", Map.of("templateId", TEMPLATE_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
        }
    }

    @Test
    void recycle() {
        stubOriginalView();
        Mockito.when(applicationApiService.recycle(APPLICATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "recycle", Map.of(), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    @Test
    void restore() {
        stubOriginalView();
        Mockito.when(applicationApiService.restore(APPLICATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "restore", Map.of(), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    @Test
    void getRecycledApplications() {
        Mockito.when(applicationApiService.getRecycledApplications(NAME, CATEGORY))
                .thenReturn(Flux.just(ApplicationSamples.applicationInfoView(), ApplicationSamples.applicationInfoView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getRecycledApplications", query("name", NAME, "category", CATEGORY), null);
            String view = EndpointContract.s1(ApplicationInfoView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(view, view)));
        }
    }

    @Test
    void delete() {
        stubOriginalView();
        Mockito.when(applicationApiService.delete(APPLICATION_ID)).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
        }
    }

    @Test
    void getEditingApplication() {
        Mockito.when(applicationApiService.getEditingApplication(APPLICATION_ID, Boolean.TRUE)).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getEditingApplication", Map.of("withDeleted", TRUE), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
        }
    }

    @Test
    void getPublishedApplication() {
        assertPublishedView("getPublishedApplication", ApplicationRequestType.PUBLIC_TO_ALL, Map.of("withDeleted", TRUE), Boolean.TRUE);
    }

    @Test
    void getPublishedMarketPlaceApplication() {
        assertPublishedView("getPublishedMarketPlaceApplication", ApplicationRequestType.PUBLIC_TO_MARKETPLACE, Map.of(), Boolean.FALSE);
    }

    @Test
    void getAgencyProfileApplication() {
        assertPublishedView("getAgencyProfileApplication", ApplicationRequestType.AGENCY_PROFILE, Map.of(), Boolean.FALSE);
    }

    @Test
    void update() {
        stubOriginalView();
        Mockito.when(applicationApiService.update(eq(APPLICATION_ID), any(), eq(Boolean.TRUE))).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of("updateStatus", TRUE),
                    EndpointContract.d1(Application.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
            ArgumentCaptor<Application> application = ArgumentCaptor.forClass(Application.class);
            Mockito.verify(applicationApiService).update(eq(APPLICATION_ID), application.capture(), eq(Boolean.TRUE));
            PayloadAssertions.assertBindsTo(PayloadSamples.of(Application.class), application.getValue());
        }
    }

    /** With a body and a latest record: the body is passed on as it is; the record's patch version is incremented. */
    @Test
    void publish() {
        Mockito.when(applicationRecordService.getLatestRecordByApplicationId(APPLICATION_ID))
                .thenReturn(Mono.just(ApplicationVersion.builder().tag(LATEST_TAG).build()));
        Mockito.when(applicationApiService.publish(eq(APPLICATION_ID), any())).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "publish", Map.of(), EndpointContract.d1(ApplicationPublishRequest.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
            ArgumentCaptor<ApplicationPublishRequest> request = ArgumentCaptor.forClass(ApplicationPublishRequest.class);
            Mockito.verify(applicationApiService).publish(eq(APPLICATION_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(ApplicationPublishRequest.class), request.getValue());
            Mockito.verify(client.bean(BusinessEventPublisher.class)).publishApplicationPublishEvent(APPLICATION_ID, request.getValue());
            // the record's next tag differs from the body's, so no version change is published
            Mockito.verify(client.bean(BusinessEventPublisher.class), Mockito.never()).publishApplicationVersionChangeEvent(APPLICATION_ID, NEXT_TAG);
        }
    }

    /**
     * {@code @RequestBody(required = false)} with an empty body (§5.2) and no record: the controller builds the request
     * from the first tag. Same response branch as {@link #publish()}.
     */
    @Test
    void publishWithoutBodyOrRecord() {
        Mockito.when(applicationRecordService.getLatestRecordByApplicationId(APPLICATION_ID)).thenReturn(Mono.empty());
        Mockito.when(applicationApiService.publish(eq(APPLICATION_ID), any())).thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "publish", Map.of(), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
            ApplicationPublishRequest expected = new ApplicationPublishRequest(NO_COMMIT_MESSAGE, FIRST_TAG);
            Mockito.verify(applicationApiService).publish(APPLICATION_ID, expected);
            Mockito.verify(client.bean(BusinessEventPublisher.class)).publishApplicationVersionChangeEvent(APPLICATION_ID, FIRST_TAG);
        }
    }

    @Test
    void updateEditState() {
        Mockito.when(applicationApiService.updateEditState(eq(APPLICATION_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updateEditState", Map.of(), EndpointContract.d1(UpdateEditStateRequest.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<UpdateEditStateRequest> request = ArgumentCaptor.forClass(UpdateEditStateRequest.class);
            Mockito.verify(applicationApiService).updateEditState(eq(APPLICATION_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(UpdateEditStateRequest.class), request.getValue());
        }
    }

    /** A {@code String} body is passed through as text (§5.2): the slug keeps the JSON quotes. */
    @Test
    void updateSlug() {
        Mockito.when(applicationApiService.updateSlug(APPLICATION_ID, SLUG_BODY)).thenReturn(Mono.just(ApplicationSamples.application()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updateSlug", Map.of(), SLUG_BODY, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(Application.class)),
                    EndpointContract.unorderedData(Application.class));
            Mockito.verify(applicationApiService).updateSlug(APPLICATION_ID, SLUG_BODY);
        }
    }

    /** {@code @JsonView(Public)}: the body is the {@code S1Public} golden, without the auth configs' secrets. */
    @Test
    void getUserHomePage() {
        Mockito.when(userHomeApiService.getUserHomePageView(ApplicationType.APPLICATION)).thenReturn(Mono.just(ApplicationSamples.userHomepageView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getUserHomePage", Map.of("applicationType", APPLICATION_TYPE), null);
            EndpointContract.assertResponse(result, HttpStatus.OK,
                    EndpointContract.success(EndpointContract.fixture(UserHomepageView.class, "S1Public")));
        }
    }

    /** Page 2 of size 1 out of three applications: one element, and the total of all three. */
    @Test
    void getApplications() {
        Mockito.when(userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(ApplicationType.APPLICATION, ApplicationStatus.RECYCLED,
                false, NAME, CATEGORY)).thenReturn(Flux.just(ApplicationSamples.applicationInfoView(), ApplicationSamples.applicationInfoView(),
                ApplicationSamples.applicationInfoView()));
        Map<String, Object> query = query("applicationType", APPLICATION_TYPE, "applicationStatus", ApplicationStatus.RECYCLED.name(),
                "withContainerSize", Boolean.FALSE, "name", NAME, "category", CATEGORY);
        query.putAll(query("pageNum", PAGE_NUM, "pageSize", PAGE_SIZE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getApplications", query, null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(EndpointContract.s1(ApplicationInfoView.class)), PAGE_NUM, PAGE_SIZE, 3));
        }
    }

    @Test
    void getMarketplaceApplications() {
        Mockito.when(userHomeApiService.getAllMarketplaceApplications(ApplicationType.APPLICATION))
                .thenReturn(Flux.just(ApplicationSamples.marketplaceApplicationInfoView(), ApplicationSamples.marketplaceApplicationInfoView()));
        assertMarketplaceList("getMarketplaceApplications");
    }

    @Test
    void getAgencyProfileApplications() {
        Mockito.when(userHomeApiService.getAllAgencyProfileApplications(ApplicationType.APPLICATION))
                .thenReturn(Flux.just(ApplicationSamples.marketplaceApplicationInfoView(), ApplicationSamples.marketplaceApplicationInfoView()));
        assertMarketplaceList("getAgencyProfileApplications");
    }

    /** The D1 role is {@link ApplicationSamples#VIEWER_ROLE}. */
    @Test
    void updatePermission() {
        Mockito.when(applicationApiService.updatePermission(APPLICATION_ID, PERMISSION_ID, ResourceRole.VIEWER)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    EndpointContract.d1(UpdatePermissionRequest.class), APPLICATION_ID, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(applicationApiService).updatePermission(APPLICATION_ID, PERMISSION_ID, ResourceRole.VIEWER);
        }
    }

    /** A role {@code ResourceRole.fromValue} does not know: {@code INVALID_PARAMETER} naming the whole request. */
    @Test
    void updatePermissionWithUnknownRole() {
        UpdatePermissionRequest request = new UpdatePermissionRequest(UNKNOWN_ROLE);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    "{\"role\": \"" + UNKNOWN_ROLE + "\"}", APPLICATION_ID, PERMISSION_ID);
            EndpointContract.assertInvalidParameter(result, request);
        }
    }

    @Test
    void removePermission() {
        Mockito.when(applicationApiService.removePermission(APPLICATION_ID, PERMISSION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "removePermission", Map.of(), null, APPLICATION_ID, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /**
     * The controller passes the body's parts on: both id sets as bound (D6 pins their class) and the D1 role,
     * {@link ApplicationSamples#EDITOR_ROLE}.
     */
    @Test
    @SuppressWarnings("unchecked")
    void grantPermission() {
        Mockito.when(applicationApiService.grantPermission(eq(APPLICATION_ID), any(), any(), eq(ResourceRole.EDITOR))).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "grantPermission", Map.of(),
                    EndpointContract.d1(BatchAddPermissionRequest.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<Set<String>> userIds = ArgumentCaptor.forClass(Set.class);
            ArgumentCaptor<Set<String>> groupIds = ArgumentCaptor.forClass(Set.class);
            Mockito.verify(applicationApiService).grantPermission(eq(APPLICATION_ID), userIds.capture(), groupIds.capture(), eq(ResourceRole.EDITOR));
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
                    "{\"role\": \"" + UNKNOWN_ROLE + "\"}", APPLICATION_ID);
            EndpointContract.assertInvalidParameter(result, UNKNOWN_ROLE);
        }
    }

    @Test
    void getApplicationPermissions() {
        Mockito.when(applicationApiService.getApplicationPermissions(APPLICATION_ID)).thenReturn(Mono.just(ApplicationSamples.applicationPermissionView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getApplicationPermissions", Map.of(), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationPermissionView.class)));
        }
    }

    /** Appendix A: the untyped list holds {@code {"type", "data"}} maps with a {@code GroupView} or an {@code OrgMemberView}. */
    @Test
    void getGroupsOrMembersWithoutPermissions() {
        stubGroupsAndMembers();
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getGroupsOrMembersWithoutPermissions", Map.of(), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(groupEntry(), userEntry()), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2));
        }
    }

    /** The {@code search} filter keeps the group whose name matches; same shape as the unfiltered branch. */
    @Test
    void getGroupsOrMembersWithoutPermissionsFilteredBySearch() {
        stubGroupsAndMembers();
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getGroupsOrMembersWithoutPermissions",
                    Map.of("search", GROUP_SEARCH), null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(groupEntry()), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 1));
        }
    }

    @Test
    void setApplicationPublicToAll() {
        boolean publicToAll = ((ApplicationPublicToAllRequest) PayloadSamples.of(ApplicationPublicToAllRequest.class).value()).publicToAll();
        Mockito.when(applicationApiService.setApplicationPublicToAll(APPLICATION_ID, publicToAll)).thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(applicationApiService.getApplicationPermissions(APPLICATION_ID)).thenReturn(Mono.just(ApplicationSamples.applicationPermissionView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setApplicationPublicToAll", Map.of(),
                    EndpointContract.d1(ApplicationPublicToAllRequest.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(applicationApiService).setApplicationPublicToAll(APPLICATION_ID, publicToAll);
        }
    }

    @Test
    void setApplicationPublicToMarketplace() {
        Mockito.when(applicationApiService.setApplicationPublicToMarketplace(eq(APPLICATION_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(applicationApiService.getApplicationPermissions(APPLICATION_ID)).thenReturn(Mono.just(ApplicationSamples.applicationPermissionView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setApplicationPublicToMarketplace", Map.of(),
                    EndpointContract.d1(ApplicationPublicToMarketplaceRequest.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<ApplicationPublicToMarketplaceRequest> request = ArgumentCaptor.forClass(ApplicationPublicToMarketplaceRequest.class);
            Mockito.verify(applicationApiService).setApplicationPublicToMarketplace(eq(APPLICATION_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(ApplicationPublicToMarketplaceRequest.class), request.getValue());
        }
    }

    @Test
    void setApplicationAsAgencyProfile() {
        boolean agencyProfile = ((ApplicationAsAgencyProfileRequest) PayloadSamples.of(ApplicationAsAgencyProfileRequest.class).value()).agencyProfile();
        Mockito.when(applicationApiService.setApplicationAsAgencyProfile(APPLICATION_ID, agencyProfile)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setApplicationAsAgencyProfile", Map.of(),
                    EndpointContract.d1(ApplicationAsAgencyProfileRequest.class), APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(applicationApiService).setApplicationAsAgencyProfile(APPLICATION_ID, agencyProfile);
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(ApplicationController.class).build();
    }

    /** The view {@code recycle}, {@code restore}, {@code delete} and {@code update} read before changing the application. */
    private void stubOriginalView() {
        Mockito.when(applicationApiService.getEditingApplication(APPLICATION_ID, Boolean.TRUE)).thenReturn(Mono.just(ApplicationSamples.applicationView()));
    }

    private void assertPublishedView(String method, ApplicationRequestType requestType, Map<String, ?> query, Boolean withDeleted) {
        Mockito.when(applicationApiService.getPublishedApplication(APPLICATION_ID, requestType, withDeleted))
                .thenReturn(Mono.just(ApplicationSamples.applicationView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, query, null, APPLICATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(ApplicationView.class)));
        }
    }

    private void assertMarketplaceList(String method) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, Map.of("applicationType", APPLICATION_TYPE), null);
            String view = EndpointContract.s1(MarketplaceApplicationInfoView.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(view, view)));
        }
    }

    /** The two maps production builds, as {@code HashMap}s, a group first. */
    private void stubGroupsAndMembers() {
        Map<String, Object> group = new HashMap<>(Map.of(ENTRY_TYPE, GROUP_ENTRY, ENTRY_DATA, UserManagementSamples.groupView()));
        Map<String, Object> member = new HashMap<>(Map.of(ENTRY_TYPE, USER_ENTRY, ENTRY_DATA, UserManagementSamples.orgMemberView()));
        Mockito.when(applicationApiService.getGroupsOrMembersWithoutPermissions(APPLICATION_ID)).thenReturn(Mono.just(List.of(group, member)));
    }

    private static String groupEntry() {
        return entry(GROUP_ENTRY, EndpointContract.s1(GroupView.class));
    }

    private static String userEntry() {
        return entry(USER_ENTRY, EndpointContract.s1(OrgMemberView.class));
    }

    private static String entry(String type, String dataJson) {
        return "{\"" + ENTRY_TYPE + "\":\"" + type + "\",\"" + ENTRY_DATA + "\":" + dataJson + "}";
    }

    /** Query parameters in order, from name/value pairs. */
    private static Map<String, Object> query(Object... namesAndValues) {
        Map<String, Object> query = new LinkedHashMap<>();
        for (int i = 0; i < namesAndValues.length; i += 2) {
            query.put((String) namesAndValues[i], namesAndValues[i + 1]);
        }
        return query;
    }
}

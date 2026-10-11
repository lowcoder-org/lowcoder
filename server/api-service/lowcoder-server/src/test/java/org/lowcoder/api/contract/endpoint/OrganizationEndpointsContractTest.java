package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.authentication.dto.RedirectView;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.OrganizationSamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.UserManagementSamples;
import org.lowcoder.api.contract.support.UserSamples;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.OrganizationController;
import org.lowcoder.api.usermanagement.OrganizationEndpoints;
import org.lowcoder.api.usermanagement.OrganizationEndpoints.UpdateOrgCommonSettingsRequest;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 17 {@link OrganizationEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T4.2), through
 * the production {@link OrganizationController} in the {@link ContractTestClient} harness, with every collaborator
 * mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens; the argument the service receives is captured and compared with D1's
 * rules ({@link PayloadAssertions#assertBindsTo}), or, where the controller passes on parts of the body, part by part.
 * {@code uploadLogo} sends a real multipart body; the service receives the {@code Mono<Part>} and the test reads the
 * {@link FilePart} from it. Response: the service mocks return the samples, so the body must be the envelope golden
 * around their S1 goldens ({@link EndpointContract}). Untyped roots (Appendix A): {@code getOrganizationByUser} pages
 * {@link OrgView}s, {@code getOrgCommonSettings} answers the {@code HashMap} subclass {@link OrganizationCommonSettings},
 * and {@code setCurrentOrganization} a {@code Boolean} or the redirect envelope around a {@link RedirectView} (its bind
 * branch is the {@code NEED_BIND_THIRD_PARTY_CONNECTION} error).
 * {@code getOrganization} and {@code updateSlug} answer a whole {@link Organization} without a view, its auth configs'
 * {@code clientSecret} included (O22). One test per registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code getOrganizationByUser}, whose
 * sorted page the controller builds from organizations; {@code pass-through} for the others, where the payload is one
 * service result in a {@code ResponseView}, even when other calls (id conversion, the login events, the domain check)
 * run beside it. Limits: the business events are mocks that complete empty.
 */
class OrganizationEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(OrganizationEndpoints.class);
    static final String ORG_ID = "OrganizationEndpointsContractTest.orgId";
    static final String USER_ID = "OrganizationEndpointsContractTest.userId";
    static final String EMAIL = "OrganizationEndpointsContractTest.email";
    /** A JSON string: a {@code @RequestBody String} receives the body text as it is, quotes included. */
    static final String SLUG_BODY = "\"OrganizationEndpointsContractTest.slug\"";
    static final long API_USAGE_COUNT = 3_000_000_160L;
    /** {@code getOrganizationByUser}'s defaults ({@code OrganizationEndpoints}): the first page, and {@code 0}, all elements. */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 0;
    static final int PAGE_NUM = 3;
    static final int PAGE_SIZE = 40_170;
    static final String ORG_NAME_PROPERTY = "orgName";
    /** Prefixed to the sample organization's name, so that the name sorts after it. */
    static final String LATER_NAME_PREFIX = "~";
    static final String FILE_PART = "file";
    static final String LOGO_FILE_NAME = "OrganizationEndpointsContractTest.logo.png";
    static final byte[] LOGO_BYTES = "OrganizationEndpointsContractTest.logo bytes é".getBytes(StandardCharsets.UTF_8);
    static final String TRUE = "true";

    private ContractTestClient.Builder builder;
    private OrgApiService orgApiService;
    private OrganizationService organizationService;
    private CommonConfig.Workspace workspace;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        orgApiService = builder.mock(OrgApiService.class);
        organizationService = builder.mock(OrganizationService.class);
        workspace = new CommonConfig.Workspace();
        Mockito.when(builder.mock(CommonConfig.class).getWorkspace()).thenReturn(workspace);
        GidService gidService = builder.mock(GidService.class);
        Mockito.when(gidService.convertOrganizationIdToObjectId(anyString())).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        builder.singleton("businessEventPublisher", Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(OrganizationEndpointsContractTest.class);
    }

    /**
     * SaaS mode: the user's active organizations, sorted by name ({@code OrganizationController.java:74-79}): the service
     * hands them in reverse order; the defaults sent explicitly, page 1 and size 0 (all).
     */
    @Test
    void getOrganizationByUser() throws JsonProcessingException {
        Organization later = UserManagementSamples.orgViewOrganization();
        later.setName(LATER_NAME_PREFIX + later.getName());
        stubUserOrganizations(later, UserManagementSamples.orgViewOrganization());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrganizationByUser",
                    Map.of("pageNum", DEFAULT_PAGE_NUM, "pageSize", DEFAULT_PAGE_SIZE), null, EMAIL);
            String view = EndpointContract.s1(OrgView.class);
            ObjectNode laterView = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(view);
            laterView.put(ORG_NAME_PROPERTY, later.getName());
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(EndpointContract.array(view,
                    PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(laterView)), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2));
        }
    }

    /** An organization without a name compares as equal ({@code OrganizationController.java:75-77}): the order stays. */
    @Test
    void getOrganizationByUserWithUnnamedOrganization() throws JsonProcessingException {
        Organization unnamed = UserManagementSamples.orgViewOrganization();
        unnamed.setName(null);
        stubUserOrganizations(UserManagementSamples.orgViewOrganization(), unnamed);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrganizationByUser", Map.of(), null, EMAIL);
            ObjectNode unnamedView = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.s1(OrgView.class));
            unnamedView.putNull(ORG_NAME_PROPERTY);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(EndpointContract.array(
                    EndpointContract.s1(OrgView.class), PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(unnamedView)),
                    DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 2));
        }
    }

    /** Enterprise mode: the one organization of the installation, whatever the email; explicit paging. */
    @Test
    void getOrganizationByUserInEnterpriseMode() {
        workspace.setMode(WorkspaceMode.ENTERPRISE);
        Mockito.when(organizationService.getOrganizationInEnterpriseMode()).thenReturn(Mono.just(UserManagementSamples.orgViewOrganization()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrganizationByUser",
                    Map.of("pageNum", DEFAULT_PAGE_NUM, "pageSize", PAGE_SIZE), null, EMAIL);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(EndpointContract.s1(OrgView.class)), DEFAULT_PAGE_NUM, PAGE_SIZE, 1));
            Mockito.verifyNoInteractions(builder.mock(UserService.class));
        }
    }

    /** The bound {@link Organization} (its write-only domain included) goes to the service; the answer is an {@link OrgView}. */
    @Test
    void create() {
        Mockito.when(orgApiService.create(any())).thenReturn(Mono.just(UserManagementSamples.orgView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(Organization.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(OrgView.class)));
            ArgumentCaptor<Organization> organization = ArgumentCaptor.forClass(Organization.class);
            Mockito.verify(orgApiService).create(organization.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(Organization.class), organization.getValue());
        }
    }

    @Test
    void update() {
        Mockito.when(orgApiService.update(eq(ORG_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of(), EndpointContract.d1(UpdateOrgRequest.class), ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<UpdateOrgRequest> request = ArgumentCaptor.forClass(UpdateOrgRequest.class);
            Mockito.verify(orgApiService).update(eq(ORG_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(UpdateOrgRequest.class), request.getValue());
        }
    }

    /** The service receives the {@code Mono<Part>} itself; the test reads it as production does. */
    @Test
    void uploadLogo() {
        AtomicReference<Part> received = new AtomicReference<>();
        AtomicReference<byte[]> bytes = new AtomicReference<>();
        Mockito.when(orgApiService.uploadLogo(eq(ORG_ID), any())).thenAnswer(invocation -> invocation.<Mono<Part>>getArgument(1)
                .flatMap(part -> {
                    received.set(part);
                    return DataBufferUtils.join(part.content());
                })
                .map(buffer -> {
                    byte[] read = new byte[buffer.readableByteCount()];
                    buffer.read(read);
                    DataBufferUtils.release(buffer);
                    bytes.set(read);
                    return Boolean.TRUE;
                }));
        MultipartBodyBuilder parts = new MultipartBodyBuilder();
        parts.part(FILE_PART, LOGO_BYTES, MediaType.IMAGE_PNG).filename(LOGO_FILE_NAME);
        MultiValueMap<String, HttpEntity<?>> body = parts.build();
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeMultipart(client, "uploadLogo", Map.of(), body, ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            assertThat(received.get()).isInstanceOf(FilePart.class);
            assertThat(received.get().name()).isEqualTo(FILE_PART);
            assertThat(((FilePart) received.get()).filename()).isEqualTo(LOGO_FILE_NAME);
            assertThat(received.get().headers().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
            assertThat(bytes.get()).isEqualTo(LOGO_BYTES);
        }
    }

    @Test
    void deleteLogo() {
        Mockito.when(orgApiService.deleteLogo(ORG_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("deleteLogo", Map.of(), ORG_ID);
    }

    /** Explicit paging; the controller hands the {@code int}s on and answers the service's page. */
    @Test
    void getOrgMembers() {
        Mockito.when(orgApiService.getOrganizationMembers(ORG_ID, PAGE_NUM, PAGE_SIZE)).thenReturn(Mono.just(UserManagementSamples.orgMemberListView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrgMembers", Map.of("pageNum", PAGE_NUM, "pageSize", PAGE_SIZE), null, ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(OrgMemberListView.class)));
        }
    }

    @Test
    void updateRoleForMember() {
        Mockito.when(orgApiService.updateRoleForMember(eq(ORG_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updateRoleForMember", Map.of(), EndpointContract.d1(UpdateRoleRequest.class), ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<UpdateRoleRequest> request = ArgumentCaptor.forClass(UpdateRoleRequest.class);
            Mockito.verify(orgApiService).updateRoleForMember(eq(ORG_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(UpdateRoleRequest.class), request.getValue());
        }
    }

    /** No organization-domain action: the switch's {@code Boolean}. */
    @Test
    void setCurrentOrganization() {
        stubSwitch(OrganizationDomainCheckResult.success());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setCurrentOrganization", Map.of(), null, ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /** §5.2's redirect branch: HTTP 200 with the {@code REDIRECT} code and a {@link RedirectView} as data. */
    @Test
    void setCurrentOrganizationRedirect() {
        stubSwitch(OrganizationDomainCheckResult.redirect(UserManagementSamples.REDIRECT_DOMAIN));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setCurrentOrganization", Map.of(), null, ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.redirect(EndpointContract.s1(RedirectView.class)));
        }
    }

    /** The bind branch of the same domain check: {@code NEED_BIND_THIRD_PARTY_CONNECTION}. */
    @Test
    void setCurrentOrganizationNeedBind() {
        stubSwitch(OrganizationDomainCheckResult.bind());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setCurrentOrganization", Map.of(), null, ORG_ID);
            BizError error = BizError.NEED_BIND_THIRD_PARTY_CONNECTION;
            EndpointContract.assertBizError(result, error, error.name());
        }
    }

    @Test
    void removeOrg() {
        Mockito.when(orgApiService.removeOrg(ORG_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("removeOrg", Map.of(), ORG_ID);
    }

    @Test
    void leaveOrganization() {
        Mockito.when(orgApiService.leaveOrganization(ORG_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("leaveOrganization", Map.of(), ORG_ID);
    }

    /** The user is a query parameter. */
    @Test
    void removeUserFromOrg() {
        Mockito.when(orgApiService.removeUserFromOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("removeUserFromOrg", Map.of("userId", USER_ID), ORG_ID);
    }

    @Test
    void getSupportedDatasourceTypes() {
        Mockito.when(builder.mock(DatasourceMetaInfoService.class).getAllSupportedDatasourceMetaInfos())
                .thenReturn(Flux.just(UserManagementSamples.datasourceMetaInfo(), UserManagementSamples.datasourceMetaInfo()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getSupportedDatasourceTypes", Map.of(), null, ORG_ID);
            String info = EndpointContract.s1(DatasourceMetaInfo.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(info, info)));
        }
    }

    @Test
    void getOrgCommonSettings() {
        Mockito.when(orgApiService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(UserManagementSamples.organizationCommonSettings()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrgCommonSettings", Map.of(), null, ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(OrganizationCommonSettings.class)));
        }
    }

    /** The controller passes the key and the {@code Object} value on; the value is the §4.6 input as bound. */
    @Test
    void updateOrgCommonSettings() {
        UpdateOrgCommonSettingsRequest expected = (UpdateOrgCommonSettingsRequest) PayloadSamples.of(UpdateOrgCommonSettingsRequest.class).value();
        Mockito.when(orgApiService.updateOrgCommonSettings(eq(ORG_ID), eq(expected.key()), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updateOrgCommonSettings", Map.of(),
                    EndpointContract.d1(UpdateOrgCommonSettingsRequest.class), ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<Object> value = ArgumentCaptor.forClass(Object.class);
            Mockito.verify(orgApiService).updateOrgCommonSettings(eq(ORG_ID), eq(expected.key()), value.capture());
            CanonicalJson.assertSameJava(expected.value(), value.getValue());
        }
    }

    /** A {@code Long} above {@code Integer.MAX_VALUE}, written as a JSON integer. */
    @Test
    void getOrgApiUsageCount() {
        Mockito.when(orgApiService.getApiUsageCount(ORG_ID, Boolean.TRUE)).thenReturn(Mono.just(API_USAGE_COUNT));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrgApiUsageCount", Map.of("lastMonthOnly", TRUE), null, ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(Long.toString(API_USAGE_COUNT)));
        }
    }

    /** A {@code String} body is passed through as text (§5.2): the slug keeps the JSON quotes. The answer is O22's. */
    @Test
    void updateSlug() {
        Mockito.when(organizationService.updateSlug(ORG_ID, SLUG_BODY)).thenReturn(Mono.just(OrganizationSamples.organization()));
        try (ContractTestClient client = client()) {
            assertOrganization(CONTRACT.exchange(client, "updateSlug", Map.of(), SLUG_BODY, ORG_ID));
        }
    }

    /** {@code withDeleted=true} reads deleted organizations too; the answer is O22's. */
    @Test
    void getOrganization() {
        Mockito.when(organizationService.getByIdWithDeleted(ORG_ID)).thenReturn(Mono.just(OrganizationSamples.organization()));
        try (ContractTestClient client = client()) {
            assertOrganization(CONTRACT.exchange(client, "getOrganization", Map.of("withDeleted", TRUE), null, ORG_ID));
        }
    }

    /** Without {@code withDeleted}, the active organization; same answer. */
    @Test
    void getOrganizationExcludingDeleted() {
        Mockito.when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(OrganizationSamples.organization()));
        try (ContractTestClient client = client()) {
            assertOrganization(CONTRACT.exchange(client, "getOrganization", Map.of(), null, ORG_ID));
        }
    }

    @Test
    void getOrganizationNotFound() {
        Mockito.when(organizationService.getById(ORG_ID)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrganization", Map.of(), null, ORG_ID);
            EndpointContract.assertBizError(result, BizError.ORGANIZATION_NOT_FOUND, BizError.ORGANIZATION_NOT_FOUND.name());
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(OrganizationController.class).build();
    }

    /** {@link #EMAIL}'s user is a member of one organization per element of {@code organizations}, in that order. */
    private void stubUserOrganizations(Organization... organizations) {
        User user = UserSamples.user();
        Mockito.when(builder.mock(UserService.class).findByEmailDeep(EMAIL)).thenReturn(Mono.just(user));
        OrgMember[] members = new OrgMember[organizations.length];
        for (int i = 0; i < organizations.length; i++) {
            String orgId = ORG_ID + "[" + i + "]";
            members[i] = new OrgMember(orgId, user.getId(), MemberRole.MEMBER, ORG_ID + ".state", 3_000_000_170L + i);
            Mockito.when(organizationService.getById(orgId)).thenReturn(Mono.just(organizations[i]));
        }
        Mockito.when(builder.mock(OrgMemberService.class).getAllActiveOrgs(user.getId())).thenReturn(Flux.just(members));
    }

    private void stubSwitch(OrganizationDomainCheckResult domainCheck) {
        Mockito.when(orgApiService.switchCurrentOrganizationTo(ORG_ID)).thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(orgApiService.checkOrganizationDomain()).thenReturn(Mono.just(domainCheck));
    }

    private void assertSuccessTrue(String method, Map<String, ?> query, Object... uriVariables) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, query, null, uriVariables);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /** The whole {@link Organization}, without a view: its auth configs' {@code clientSecret} is in the answer (O22). */
    private static void assertOrganization(EntityExchangeResult<byte[]> result) {
        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(Organization.class)));
        assertThat(new String(result.getResponseBody(), StandardCharsets.UTF_8)).as("O22: the organization writes its auth configs' secrets")
                .contains(PayloadSamples.SECRET_MARKER);
    }
}

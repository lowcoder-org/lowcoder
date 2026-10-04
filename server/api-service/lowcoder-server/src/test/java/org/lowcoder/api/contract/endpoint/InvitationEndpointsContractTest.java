package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.UserManagementSamples;
import org.lowcoder.api.usermanagement.InvitationApiService;
import org.lowcoder.api.usermanagement.InvitationController;
import org.lowcoder.api.usermanagement.InvitationEndpoints;
import org.lowcoder.api.usermanagement.InvitationEndpoints.InviteEmailRequest;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.user.service.EmailCommunicationService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 4 {@link InvitationEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T4.4), through the
 * production {@link InvitationController} in the {@link ContractTestClient} harness, with every collaborator mocked.
 *
 * <p>Request: {@code sendInvitationEmails}' body is the D1 golden; the controller passes on its parts, which the test
 * compares with the sample's (the implementation declares no {@code @RequestBody}; the declaration's applies).
 * Response: the service mocks return the samples, so the body must be the envelope golden around their S1 goldens
 * ({@link EndpointContract}). Untyped root (Appendix A): {@code inviteUser} answers a {@code Boolean} for a signed-in
 * visitor, and for an anonymous one the error-with-data envelope ({@code INVITED_USER_NOT_LOGIN}, HTTP 200) around the
 * {@link InvitationVO} ({@link EndpointContract#errorWithData}). One test per registry response branch, named as the
 * branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code pass-through} for all four, where the payload is one
 * service result in a {@code ResponseView}; {@code sendInvitationEmails} wraps the mail service's {@code boolean}.
 */
class InvitationEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(InvitationEndpoints.class);
    static final String ORG_ID = "InvitationEndpointsContractTest.orgId";
    static final String INVITATION_ID = "InvitationEndpointsContractTest.invitationId";
    static final String VISITOR_ID = "InvitationEndpointsContractTest.visitorId";
    static final OrgMember VISITOR_ORG_MEMBER = new OrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, ORG_ID + ".state", 3_000_000_210L);
    static final String PUBLIC_URL = "https://invitationendpointscontracttest.example.com";
    /** {@code InvitationController#sendInvitationEmails}' link path and message. */
    static final String INVITE_PATH = "/invite/";
    static final String INVITATION_MESSAGE = "You have been invited to join our platform. Click here to accept the invitation: %s";
    /** The message of {@code inviteUser}'s error-with-data answer. */
    static final String NO_MESSAGE = "";
    static final String TRUE = "true";

    private ContractTestClient.Builder builder;
    private InvitationApiService invitationApiService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        invitationApiService = builder.mock(InvitationApiService.class);
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(InvitationEndpointsContractTest.class);
    }

    @Test
    void create() {
        Mockito.when(invitationApiService.create(ORG_ID)).thenReturn(Mono.just(UserManagementSamples.invitationVO()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of("orgId", ORG_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(InvitationVO.class)));
        }
    }

    @Test
    void get() {
        Mockito.when(invitationApiService.getInvitationView(INVITATION_ID)).thenReturn(Mono.just(UserManagementSamples.invitationVO()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "get", Map.of(), null, INVITATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(InvitationVO.class)));
        }
    }

    /** A signed-in visitor joins: the service's {@code Boolean}. */
    @Test
    void inviteUser() {
        builder.visitor(VISITOR_ID, VISITOR_ORG_MEMBER);
        Mockito.when(invitationApiService.inviteUser(INVITATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "inviteUser", Map.of(), null, INVITATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /**
     * §5.2's error-with-data branch: an anonymous visitor gets HTTP 200 with the {@code INVITED_USER_NOT_LOGIN} code, an
     * empty message and the invitation as data; the invitation is not accepted.
     */
    @Test
    void inviteUserNotLoggedIn() {
        Mockito.when(invitationApiService.getInvitationView(INVITATION_ID)).thenReturn(Mono.just(UserManagementSamples.invitationVO()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "inviteUser", Map.of(), null, INVITATION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.errorWithData(BizError.INVITED_USER_NOT_LOGIN,
                    NO_MESSAGE, EndpointContract.s1(InvitationVO.class)));
            Mockito.verify(invitationApiService, Mockito.never()).inviteUser(anyString());
        }
    }

    /** The bound request's organization gets an invitation; its emails and the invitation's link go to the mail service. */
    @Test
    void sendInvitationEmails() {
        InviteEmailRequest sample = (InviteEmailRequest) PayloadSamples.of(InviteEmailRequest.class).value();
        InvitationVO invitation = UserManagementSamples.invitationVO();
        Mockito.when(builder.mock(CommonConfig.class).getLowcoderPublicUrl()).thenReturn(PUBLIC_URL);
        Mockito.when(invitationApiService.create(sample.orgId())).thenReturn(Mono.just(invitation));
        EmailCommunicationService mail = builder.mock(EmailCommunicationService.class);
        Mockito.when(mail.sendInvitationEmails(any(), anyString(), anyString())).thenReturn(true);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "sendInvitationEmails", Map.of(), EndpointContract.d1(InviteEmailRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<String[]> emails = ArgumentCaptor.forClass(String[].class);
            Mockito.verify(mail).sendInvitationEmails(emails.capture(), eq(PUBLIC_URL + INVITE_PATH + invitation.getInviteCode()), eq(INVITATION_MESSAGE));
            assertThat(emails.getValue()).as("the bound emails, in order").containsExactly(sample.emails());
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(InvitationController.class).build();
    }
}

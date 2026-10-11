package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.authentication.dto.RedirectView;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.UserManagementSamples;
import org.lowcoder.api.contract.support.UserSamples;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.api.usermanagement.UserController;
import org.lowcoder.api.usermanagement.UserEndpoints;
import org.lowcoder.api.usermanagement.UserEndpoints.CreateUserRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.LostPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.MarkUserStatusRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.ResetLostPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.ResetPasswordRequest;
import org.lowcoder.api.usermanagement.UserEndpoints.UpdatePasswordRequest;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateUserRequest;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.domain.user.service.UserStatusService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
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
 * Codec-level tests of the 21 {@link UserEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T4.1), through the
 * production {@link UserController} in the {@link ContractTestClient} harness, with every collaborator mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens; the argument the service receives is captured and compared with D1's
 * rules ({@link PayloadAssertions#assertBindsTo}), or, where the controller passes on parts of the body, part by part.
 * The two photo uploads send a real multipart body and compare the {@link FilePart} the controller hands on: its file
 * name, content type and bytes. Response: the service mocks return the samples, so the body must be the envelope golden
 * around their S1 goldens ({@link EndpointContract}). Untyped roots (Appendix A): {@code createUserAndAddToOrg} and
 * {@code createSCIMUserAndAddToOrg} answer a {@link User} (O1: its {@code KNOWN-EXPOSURE-} values are in the S1 golden),
 * {@code getUserProfile} a {@link UserProfileView} or the redirect envelope around a {@link RedirectView},
 * {@code getUserDetail} a {@link UserDetail}, and {@code getUserOrgs} the double envelope of O6 around
 * {@code {"orgView", "isCurrentOrg"}} maps. One test per registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code getUserOrgs}, whose page of maps the
 * controller builds; {@code pass-through} for the others, where the payload is one service result in a
 * {@code ResponseView}, even when other calls (the admin check, adding the member, switching the organization, the
 * domain check) run beside it. Limits: the profile photo endpoints answer image bytes or an empty body, not JSON; their
 * tests pin status, {@code Content-Type} and bytes.
 */
class UserEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(UserEndpoints.class);
    static final String UPDATE_SELF = "UserEndpoints#update(UpdateUserRequest, ServerWebExchange)";
    static final String UPDATE_BY_ID = "UserEndpoints#update(String, String, UpdateUserRequest, ServerWebExchange)";
    static final String PROFILE_PHOTO_SELF = "UserEndpoints#getProfilePhoto(ServerWebExchange)";
    static final String PROFILE_PHOTO_BY_ID = "UserEndpoints#getProfilePhoto(ServerWebExchange, String)";
    static final String ORG_ID = "UserEndpointsContractTest.orgId";
    static final String USER_ID = "UserEndpointsContractTest.userId";
    static final String ORG_NAME = "UserEndpointsContractTest.orgName";
    static final String PASSWORD = "UserEndpointsContractTest.password";
    static final String BLANK = " ";
    static final String UNKNOWN_STATUS_TYPE = "UserEndpointsContractTest.unknownStatusType";
    static final String NOT_AN_EMAIL = "UserEndpointsContractTest.notAnEmail";
    static final String RESET_PASSWORD = "UserEndpointsContractTest.resetPassword";
    /** The visitor is the {@code User} sample; {@code SessionUserService#getVisitorId} answers its id. */
    static final User VISITOR = UserSamples.user();
    static final String VISITOR_ID = VISITOR.getId();
    static final OrgMember VISITOR_ORG_MEMBER = new OrgMember(UserManagementSamples.orgViewOrganization().getId(), VISITOR_ID,
            MemberRole.ADMIN, "UserEndpointsContractTest.state", 3_000_000_150L);
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 1;
    static final long ORG_TOTAL = 3;
    /** {@code getUserOrgs}' sort ({@code UserController}). */
    static final String SORT_PROPERTY = "updatedAt";
    static final String ORG_VIEW_KEY = "orgView";
    static final String IS_CURRENT_ORG_KEY = "isCurrentOrg";
    static final String FILE_PART = "file";
    static final String PHOTO_FILE_NAME = "UserEndpointsContractTest.photo.png";
    static final byte[] PHOTO_BYTES = "UserEndpointsContractTest.photo bytes é".getBytes(StandardCharsets.UTF_8);
    static final String TRUE = "true";
    /** The 404 of the photo endpoints has no body, and no {@code Content-Type}. */
    static final MediaType NO_CONTENT_TYPE = null;

    private ContractTestClient.Builder builder;
    private UserService userService;
    private UserApiService userApiService;
    private UserHomeApiService userHomeApiService;
    private OrgApiService orgApiService;
    private OrgMemberService orgMemberService;
    private SessionUserService sessionUserService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder().visitor(VISITOR_ID, VISITOR_ORG_MEMBER);
        userService = builder.mock(UserService.class);
        userApiService = builder.mock(UserApiService.class);
        userHomeApiService = builder.mock(UserHomeApiService.class);
        orgApiService = builder.mock(OrgApiService.class);
        orgMemberService = builder.mock(OrgMemberService.class);
        sessionUserService = builder.mock(SessionUserService.class);
        Mockito.when(sessionUserService.getVisitor()).thenReturn(Mono.just(VISITOR));
        Mockito.when(orgApiService.checkVisitorAdminRole(ORG_ID)).thenReturn(Mono.just(VISITOR_ORG_MEMBER));
        Mockito.when(orgApiService.switchCurrentOrganizationTo(anyString(), eq(ORG_ID))).thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(orgMemberService.tryAddOrgMember(eq(ORG_ID), anyString(), eq(MemberRole.MEMBER))).thenReturn(Mono.just(Boolean.TRUE));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(UserEndpointsContractTest.class);
    }

    /** The D1 email and password reach the form authentication; the created {@link User} is the answer (O1). */
    @Test
    void createUserAndAddToOrg() {
        CreateUserRequest request = (CreateUserRequest) PayloadSamples.of(CreateUserRequest.class).value();
        AuthUser authUser = AuthUser.builder().uid(request.email()).build();
        Mockito.when(builder.mock(AuthenticationApiService.class).authenticateByForm(request.email(), request.password(),
                AuthSourceConstants.EMAIL, true, null, ORG_ID)).thenReturn(Mono.just(authUser));
        Mockito.when(userService.createNewUserByAuthUser(authUser, false)).thenReturn(Mono.just(UserSamples.user()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "createUserAndAddToOrg", Map.of(),
                    EndpointContract.d1(CreateUserRequest.class), ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(User.class)));
            Mockito.verify(orgMemberService).tryAddOrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER);
        }
    }

    /** An existing user of the D1 email: added to the organization and answered as it is. */
    @Test
    void createSCIMUserAndAddToOrg() {
        Mockito.when(userService.findByEmailDeep(UserManagementSamples.CREATE_USER_EMAIL)).thenReturn(Mono.just(UserSamples.user()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "createSCIMUserAndAddToOrg", Map.of(),
                    EndpointContract.d1(CreateUserRequest.class), ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(User.class)));
            Mockito.verify(orgMemberService).tryAddOrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER);
            Mockito.verify(userService, Mockito.never()).saveUser(any());
        }
    }

    /**
     * No user of the D1 email: the controller saves a new one built from the normalized email; the answer is the saved
     * user, here the {@link User} sample.
     */
    @Test
    void createSCIMUserAndAddToOrgForNewUser() {
        Mockito.when(userService.findByEmailDeep(UserManagementSamples.CREATE_USER_EMAIL)).thenReturn(Mono.empty());
        Mockito.when(userService.saveUser(any())).thenReturn(Mono.just(UserSamples.user()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "createSCIMUserAndAddToOrg", Map.of(),
                    EndpointContract.d1(CreateUserRequest.class), ORG_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(User.class)));
            ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
            Mockito.verify(userService).saveUser(saved.capture());
            assertThat(saved.getValue().getEmail()).isEqualTo(UserManagementSamples.CREATE_USER_EMAIL);
            assertThat(saved.getValue().getName()).isEqualTo(UserManagementSamples.CREATE_USER_EMAIL);
        }
    }

    /** An email {@code EmailUtils.looksLikeEmail} rejects, after the admin check: {@code INVALID_EMAIL_FORMAT}. */
    @Test
    void createSCIMUserAndAddToOrgWithInvalidEmail() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "createSCIMUserAndAddToOrg", Map.of(),
                    "{\"email\": \"" + NOT_AN_EMAIL + "\", \"password\": \"" + PASSWORD + "\"}", ORG_ID);
            EndpointContract.assertBizError(result, BizError.INVALID_EMAIL_FORMAT, BizError.INVALID_EMAIL_FORMAT.name());
        }
    }

    /**
     * No organization-domain action: the profile in a {@code ResponseView}. The endpoint has no {@code @JsonView}, so
     * the organizations of {@code orgAndRoles} are written whole, the auth configs' {@code clientSecret} included
     * (O22); the explicit check makes a fix fail here by name, not only as a golden difference.
     */
    @Test
    void getUserProfile() {
        stubProfile(OrganizationDomainCheckResult.success());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getUserProfile", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(UserProfileView.class)));
            assertThat(new String(result.getResponseBody(), StandardCharsets.UTF_8)).as("O22: the profile writes the auth configs' secrets")
                    .contains(PayloadSamples.SECRET_MARKER);
        }
    }

    /** §5.2's redirect branch: HTTP 200 with the {@code REDIRECT} code and a {@link RedirectView} as data. */
    @Test
    void getUserProfileRedirect() {
        stubProfile(OrganizationDomainCheckResult.redirect(UserManagementSamples.REDIRECT_DOMAIN));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getUserProfile", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.redirect(EndpointContract.s1(RedirectView.class)));
        }
    }

    /** The bind branch of the same domain check: {@code NEED_BIND_THIRD_PARTY_CONNECTION}. */
    @Test
    void getUserProfileNeedBind() {
        stubProfile(OrganizationDomainCheckResult.bind());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getUserProfile", Map.of(), null);
            BizError error = BizError.NEED_BIND_THIRD_PARTY_CONNECTION;
            EndpointContract.assertBizError(result, error, error.name());
        }
    }

    /**
     * O6: a {@code ResponseView} whose data is a {@code PageResponseView} of {@code {"orgView", "isCurrentOrg"}} maps.
     * Both organizations are the visitor's current one; the total is the service's count.
     */
    @Test
    void getUserOrgs() {
        OrganizationService organizationService = builder.mock(OrganizationService.class);
        PageRequest pageable = PageRequest.of(PAGE_NUM - 1, PAGE_SIZE, Sort.by(Sort.Direction.DESC, SORT_PROPERTY));
        Mockito.when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(VISITOR_ORG_MEMBER));
        Mockito.when(organizationService.findUserOrgs(VISITOR_ID, ORG_NAME, pageable))
                .thenReturn(Flux.just(UserManagementSamples.orgViewOrganization(), UserManagementSamples.orgViewOrganization()));
        Mockito.when(organizationService.countUserOrgs(VISITOR_ID, ORG_NAME)).thenReturn(Mono.just(ORG_TOTAL));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getUserOrgs",
                    Map.of("orgName", ORG_NAME, "pageNum", PAGE_NUM, "pageSize", PAGE_SIZE), null);
            String entry = "{\"" + ORG_VIEW_KEY + "\":" + EndpointContract.s1(OrgView.class) + ",\"" + IS_CURRENT_ORG_KEY + "\":" + TRUE + "}";
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(
                    EndpointContract.page(EndpointContract.array(entry, entry), PAGE_NUM, PAGE_SIZE, (int) ORG_TOTAL)));
        }
    }

    @Test
    void newUserGuidanceShown() {
        Mockito.when(userHomeApiService.markNewUserGuidanceShown(VISITOR_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "newUserGuidanceShown", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /** The D1 type selects the status; the {@code Object} value reaches the service as bound (the §4.6 input). */
    @Test
    void markStatus() {
        UserStatusService userStatusService = builder.mock(UserStatusService.class);
        Mockito.when(userStatusService.mark(eq(VISITOR_ID), eq(UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "markStatus", Map.of(), EndpointContract.d1(MarkUserStatusRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<Object> value = ArgumentCaptor.forClass(Object.class);
            Mockito.verify(userStatusService).mark(eq(VISITOR_ID), eq(UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE), value.capture());
            MarkUserStatusRequest expected = (MarkUserStatusRequest) PayloadSamples.of(MarkUserStatusRequest.class).value();
            CanonicalJson.assertSameJava(expected.value(), value.getValue());
        }
    }

    /** A type {@code UserStatusType.fromValue} does not know: {@code INVALID_USER_STATUS} naming it. */
    @Test
    void markStatusWithUnknownType() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "markStatus", Map.of(), "{\"type\": \"" + UNKNOWN_STATUS_TYPE + "\"}");
            BizError error = BizError.INVALID_USER_STATUS;
            EndpointContract.assertBizError(result, error, error.name(), UNKNOWN_STATUS_TYPE);
        }
    }

    /** The visitor's own profile: the D1 name and language reach the service in a partial {@link User}. */
    @Test
    void update() {
        assertUpdate(UPDATE_SELF, VISITOR_ID);
    }

    /** An admin updates another member: same body, same answer, for the path's user. */
    @Test
    void updateById() {
        assertUpdate(UPDATE_BY_ID, USER_ID, ORG_ID, USER_ID);
    }

    @Test
    void uploadProfilePhoto() {
        AtomicReference<byte[]> received = stubPhotoUpload(VISITOR);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeMultipart(client, "uploadProfilePhoto", Map.of(), photo());
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            assertPhotoPart(VISITOR, received);
        }
    }

    @Test
    void uploadProfilePhotoById() {
        User member = UserSamples.user();
        Mockito.when(userService.findById(USER_ID)).thenReturn(Mono.just(member));
        AtomicReference<byte[]> received = stubPhotoUpload(member);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchangeMultipart(client, "uploadProfilePhotoById", Map.of(), photo(), ORG_ID, USER_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            assertPhotoPart(member, received);
        }
    }

    /**
     * {@code deleteProfilePhoto} maps the service's {@code Mono<Void>} to a {@code ResponseView}, which never happens:
     * the answer is HTTP 200 with a JSON {@code Content-Type} and an empty body, not an envelope (O21).
     */
    @Test
    void deleteProfilePhoto() {
        Mockito.when(userService.deleteProfilePhoto(VISITOR)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "deleteProfilePhoto", Map.of(), null);
            EndpointContract.assertEmptyResponse(result, HttpStatus.OK, MediaType.APPLICATION_JSON);
            Mockito.verify(userService).deleteProfilePhoto(VISITOR);
        }
    }

    /** As {@link #deleteProfilePhoto()}, for the path's user (O21). */
    @Test
    void deleteProfilePhotoById() {
        User member = UserSamples.user();
        Mockito.when(userService.findById(USER_ID)).thenReturn(Mono.just(member));
        Mockito.when(userService.deleteProfilePhoto(member)).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "deleteProfilePhotoById", Map.of(), null, ORG_ID, USER_ID);
            EndpointContract.assertEmptyResponse(result, HttpStatus.OK, MediaType.APPLICATION_JSON);
            Mockito.verify(userService).deleteProfilePhoto(member);
        }
    }

    /** The visitor's avatar, written by the service as the asset service writes it: the image bytes, not JSON. */
    @Test
    void getProfilePhoto() {
        stubAvatar(VISITOR_ID);
        try (ContractTestClient client = client()) {
            assertPhoto(CONTRACT.exchange(client, PROFILE_PHOTO_SELF, Map.of(), null));
        }
    }

    /** No avatar: the service completes without writing; the controller sets 404 and the body is empty. */
    @Test
    void getProfilePhotoNotFound() {
        Mockito.when(userService.getUserAvatar(any(), eq(VISITOR_ID))).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EndpointContract.assertEmptyResponse(CONTRACT.exchange(client, PROFILE_PHOTO_SELF, Map.of(), null), HttpStatus.NOT_FOUND, NO_CONTENT_TYPE);
        }
    }

    @Test
    void getProfilePhotoOfUser() {
        stubAvatar(USER_ID);
        try (ContractTestClient client = client()) {
            assertPhoto(CONTRACT.exchange(client, PROFILE_PHOTO_BY_ID, Map.of(), null, USER_ID));
        }
    }

    @Test
    void getProfilePhotoOfUserNotFound() {
        Mockito.when(userService.getUserAvatar(any(), eq(USER_ID))).thenReturn(Mono.empty());
        try (ContractTestClient client = client()) {
            EndpointContract.assertEmptyResponse(CONTRACT.exchange(client, PROFILE_PHOTO_BY_ID, Map.of(), null, USER_ID), HttpStatus.NOT_FOUND, NO_CONTENT_TYPE);
        }
    }

    @Test
    void updatePassword() {
        UpdatePasswordRequest request = (UpdatePasswordRequest) PayloadSamples.of(UpdatePasswordRequest.class).value();
        Mockito.when(userService.updatePassword(VISITOR_ID, request.oldPassword(), request.newPassword())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePassword", Map.of(), EndpointContract.d1(UpdatePasswordRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(userService).updatePassword(VISITOR_ID, request.oldPassword(), request.newPassword());
        }
    }

    /** A blank password: {@code INVALID_PARAMETER} with the message of {@code PASSWORD_EMPTY}. */
    @Test
    void updatePasswordWithEmptyPassword() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePassword", Map.of(), "{\"oldPassword\": \"" + PASSWORD + "\"}");
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "PASSWORD_EMPTY");
        }
    }

    /** In enterprise mode the new password is the answer, a JSON string. */
    @Test
    void resetPassword() {
        Mockito.when(builder.mock(CommonConfig.class).isEnterpriseMode()).thenReturn(true);
        ResetPasswordRequest request = (ResetPasswordRequest) PayloadSamples.of(ResetPasswordRequest.class).value();
        Mockito.when(userApiService.resetPassword(request.userId())).thenReturn(Mono.just(RESET_PASSWORD));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "resetPassword", Map.of(), EndpointContract.d1(ResetPasswordRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success("\"" + RESET_PASSWORD + "\""));
        }
    }

    /** Outside enterprise mode: {@code UNSUPPORTED_OPERATION} with the message of {@code BAD_REQUEST}. */
    @Test
    void resetPasswordOutsideEnterpriseMode() {
        Mockito.when(builder.mock(CommonConfig.class).isEnterpriseMode()).thenReturn(false);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "resetPassword", Map.of(), EndpointContract.d1(ResetPasswordRequest.class));
            EndpointContract.assertBizError(result, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST");
        }
    }

    @Test
    void resetPasswordWithoutUserId() {
        Mockito.when(builder.mock(CommonConfig.class).isEnterpriseMode()).thenReturn(true);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "resetPassword", Map.of(), "{}");
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "INVALID_USER_ID");
        }
    }

    @Test
    void lostPassword() {
        LostPasswordRequest request = (LostPasswordRequest) PayloadSamples.of(LostPasswordRequest.class).value();
        Mockito.when(userApiService.lostPassword(request.userEmail())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "lostPassword", Map.of(), EndpointContract.d1(LostPasswordRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /** A blank email: the controller answers an empty {@code Mono}, so HTTP 200, JSON, with an empty body (O21). */
    @Test
    void lostPasswordWithoutEmail() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "lostPassword", Map.of(), "{\"userEmail\": \"" + BLANK + "\"}");
            EndpointContract.assertEmptyResponse(result, HttpStatus.OK, MediaType.APPLICATION_JSON);
            Mockito.verifyNoInteractions(userApiService);
        }
    }

    @Test
    void resetLostPassword() {
        ResetLostPasswordRequest request = (ResetLostPasswordRequest) PayloadSamples.of(ResetLostPasswordRequest.class).value();
        Mockito.when(userApiService.resetLostPassword(request.userEmail(), request.token(), request.newPassword())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "resetLostPassword", Map.of(), EndpointContract.d1(ResetLostPasswordRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(userApiService).resetLostPassword(request.userEmail(), request.token(), request.newPassword());
        }
    }

    /** A missing token: {@code INVALID_PARAMETER} with its own name as the message key. */
    @Test
    void resetLostPasswordWithMissingField() {
        ResetLostPasswordRequest request = (ResetLostPasswordRequest) PayloadSamples.of(ResetLostPasswordRequest.class).value();
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "resetLostPassword", Map.of(),
                    "{\"userEmail\": \"" + request.userEmail() + "\", \"newPassword\": \"" + request.newPassword() + "\"}");
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, BizError.INVALID_PARAMETER.name());
        }
    }

    /** The password is a query parameter, not a body. */
    @Test
    void setPassword() {
        Mockito.when(userService.setPassword(VISITOR_ID, PASSWORD)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setPassword", Map.of("password", PASSWORD), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    @Test
    void setPasswordEmpty() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "setPassword", Map.of("password", BLANK), null);
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "PASSWORD_EMPTY");
        }
    }

    @Test
    void getCurrentUser() {
        Mockito.when(userService.buildUserDetail(VISITOR, false)).thenReturn(Mono.just(UserManagementSamples.userDetail()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getCurrentUser", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(UserDetail.class)));
        }
    }

    @Test
    void getUserDetail() {
        Mockito.when(userApiService.getUserDetailById(USER_ID)).thenReturn(Mono.just(UserManagementSamples.userDetail()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getUserDetail", Map.of(), null, USER_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(UserDetail.class)));
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(UserController.class).build();
    }

    private void stubProfile(OrganizationDomainCheckResult domainCheck) {
        Mockito.when(userHomeApiService.buildUserProfileView(eq(VISITOR), any())).thenReturn(Mono.just(UserManagementSamples.userProfileView()));
        Mockito.when(orgApiService.checkOrganizationDomain()).thenReturn(Mono.just(domainCheck));
    }

    /**
     * {@code UserController#updateUser}: the D1 name and language in a new {@link User}, with {@code hasSetNickname};
     * the service's user goes to the profile view, which is the answer.
     */
    private void assertUpdate(String endpoint, String userId, Object... uriVariables) {
        User updated = UserSamples.user();
        Mockito.when(userService.update(eq(userId), any())).thenReturn(Mono.just(updated));
        Mockito.when(userHomeApiService.buildUserProfileView(eq(updated), any())).thenReturn(Mono.just(UserManagementSamples.userProfileView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, endpoint, Map.of(), EndpointContract.d1(UpdateUserRequest.class), uriVariables);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(UserProfileView.class)));
            ArgumentCaptor<User> partial = ArgumentCaptor.forClass(User.class);
            Mockito.verify(userService).update(eq(userId), partial.capture());
            UpdateUserRequest expected = (UpdateUserRequest) PayloadSamples.of(UpdateUserRequest.class).value();
            assertThat(partial.getValue().getName()).isEqualTo(expected.getName());
            assertThat(partial.getValue().getUiLanguage()).isEqualTo(expected.getUiLanguage());
            assertThat(partial.getValue().isHasSetNickname()).isTrue();
        }
    }

    private static MultiValueMap<String, HttpEntity<?>> photo() {
        MultipartBodyBuilder parts = new MultipartBodyBuilder();
        parts.part(FILE_PART, PHOTO_BYTES, MediaType.IMAGE_PNG).filename(PHOTO_FILE_NAME);
        return parts.build();
    }

    /** The bytes of the part the service receives, read while the request is live, as production reads them. */
    private AtomicReference<byte[]> stubPhotoUpload(User user) {
        AtomicReference<byte[]> received = new AtomicReference<>();
        Mockito.when(userService.saveProfilePhoto(any(), eq(user))).thenAnswer(invocation -> {
            Part part = invocation.getArgument(0);
            return DataBufferUtils.join(part.content()).map(buffer -> {
                byte[] bytes = new byte[buffer.readableByteCount()];
                buffer.read(bytes);
                DataBufferUtils.release(buffer);
                received.set(bytes);
                return Boolean.TRUE;
            });
        });
        return received;
    }

    private void assertPhotoPart(User user, AtomicReference<byte[]> received) {
        ArgumentCaptor<Part> part = ArgumentCaptor.forClass(Part.class);
        Mockito.verify(userService).saveProfilePhoto(part.capture(), eq(user));
        System.out.println("[UserEndpointsContractTest] part " + part.getValue().getClass().getName() + " " + part.getValue().headers());
        assertThat(part.getValue()).isInstanceOf(FilePart.class);
        assertThat(part.getValue().name()).isEqualTo(FILE_PART);
        assertThat(((FilePart) part.getValue()).filename()).isEqualTo(PHOTO_FILE_NAME);
        assertThat(part.getValue().headers().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(received.get()).isEqualTo(PHOTO_BYTES);
    }

    /** {@code AssetServiceImpl#makeImageResponse}: status 200, the asset's content type, and its bytes. */
    private void stubAvatar(String userId) {
        Mockito.when(userService.getUserAvatar(any(), eq(userId))).thenAnswer(invocation -> {
            ServerHttpResponse response = invocation.<ServerWebExchange>getArgument(0).getResponse();
            response.setStatusCode(HttpStatus.OK);
            response.getHeaders().setContentType(MediaType.IMAGE_PNG);
            return response.writeWith(Mono.just(response.bufferFactory().wrap(PHOTO_BYTES)));
        });
    }

    /** The image as written: the controller's 404 for an empty answer comes after the response is committed. */
    private static void assertPhoto(EntityExchangeResult<byte[]> result) {
        assertThat(result.getStatus().value()).isEqualTo(HttpStatus.OK.value());
        assertThat(result.getResponseHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(result.getResponseBody()).isEqualTo(PHOTO_BYTES);
    }
}

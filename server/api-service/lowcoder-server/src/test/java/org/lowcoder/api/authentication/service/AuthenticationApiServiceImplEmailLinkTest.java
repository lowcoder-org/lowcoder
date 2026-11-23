package org.lowcoder.api.authentication.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactory;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.InvitationApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code AuthenticationApiServiceImpl#updateOrCreateUser}'s branch 2 -- an account
 * found by e-mail address, not by the same source/subject connection -- must link ONLY when that is safe,
 * never merely because the address matches. Mock style of {@link AuthenticationApiServiceImplMutationsTest}.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationApiServiceImplEmailLinkTest {

    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String USER_ID = "user-1";
    private static final String UID = "uid-1";
    private static final String CONFIG_A = "cfg-a";
    private static final String SOURCE_GENERIC = "GENERIC";
    private static final String STUB_TYPE = "STUB";

    @Mock private OrgApiService orgApiService;
    @Mock private OrganizationService organizationService;
    @Mock private AuthRequestFactory<AuthRequestContext> authRequestFactory;
    @Mock private AuthenticationService authenticationService;
    @Mock private UserService userService;
    @Mock private InvitationApiService invitationApiService;
    @Mock private BusinessEventPublisher businessEventPublisher;
    @Mock private SessionUserService sessionUserService;
    @Mock private CookieHelper cookieHelper;
    @Mock private AuthConfigFactory authConfigFactory;
    @Mock private UserApiService userApiService;
    @Mock private OrgMemberService orgMemberService;
    @Mock private JWTUtils jwtUtils;
    @Mock private AuthProperties authProperties;
    @Mock private GroupMemberService groupMemberService;

    private AuthenticationApiServiceImpl service;

    private static class StubAuthConfig extends AbstractAuthConfig {
        StubAuthConfig(String id, String source, boolean enable, boolean enableRegister, String authType) {
            super(id, source, source, enable, enableRegister, authType);
        }

        @Override
        public void merge(AbstractAuthConfig oldConfig) {
        }
    }

    @BeforeEach
    void setUp() {
        service = new AuthenticationApiServiceImpl(orgApiService, organizationService, authRequestFactory,
                authenticationService, userService, invitationApiService, businessEventPublisher, sessionUserService,
                cookieHelper, authConfigFactory, userApiService, orgMemberService, jwtUtils, authProperties,
                new CommonConfig(), groupMemberService);
    }

    private static AuthUser authUser(String source, String orgId) {
        FormAuthRequestContext context = new FormAuthRequestContext("login", "pw", false, orgId);
        context.setAuthConfig(new StubAuthConfig(CONFIG_A, source, true, true, STUB_TYPE));
        return AuthUser.builder().uid(UID).orgId(orgId).authContext(context).build();
    }

    private static OrgMember member(String orgId) {
        return OrgMember.builder().orgId(orgId).userId(USER_ID).role(MemberRole.MEMBER).build();
    }

    private static Connection connection(String source) {
        return Connection.builder().authId("auth-" + source).source(source).rawId("raw-" + source).build();
    }

    /** Resolves branch 2 (found by raw id, not by source+id): {@code findByAuthUserSourceAndRawId} empty, {@code findByAuthUserRawId} hits {@code found}. */
    private void resolvesByRawIdOnly(AuthUser authUser, User found) {
        when(userService.findByAuthUserSourceAndRawId(authUser)).thenReturn(Mono.empty());
        when(userService.findByAuthUserRawId(authUser)).thenReturn(Mono.just(found));
    }

    private static void assertBizError(Throwable throwable, BizError expected) {
        assertThat(throwable).isInstanceOf(BizException.class);
        assertThat(((BizException) throwable).getError()).isEqualTo(expected);
    }

    /** Case 1: a GENERIC sign-in whose claimed address resolves to an account that ALREADY has connections -> {@code ALREADY_BIND}, never linked. */
    @Test
    void genericSource_accountFoundByAddressWithConnections_refusedAlreadyBind() {
        User found = User.builder().id(USER_ID).connections(new HashSet<>(Set.of(connection("GOOGLE")))).build();
        AuthUser authUser = authUser(SOURCE_GENERIC, ORG_ID);
        resolvesByRawIdOnly(authUser, found);

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.ALREADY_BIND))
                .verify();

        verify(userService, never()).addNewConnectionAndReturnUser(any(), any());
        verify(orgMemberService, never()).getRawOrgMemberships(any());
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] account with existing connections -> ALREADY_BIND, never linked");
    }

    /** Case 2: an EMAIL (form) sign-up whose typed address resolves to a provider-only account -> {@code USER_LOGIN_ID_EXIST}, never linked. */
    @Test
    void emailSourceRegister_providerOnlyAccountFoundByAddress_refusedUserLoginIdExist() {
        User found = User.builder().id(USER_ID).connections(new HashSet<>(Set.of(connection("GOOGLE")))).build();
        AuthUser authUser = authUser(AuthSourceConstants.EMAIL, ORG_ID);
        resolvesByRawIdOnly(authUser, found);

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.USER_LOGIN_ID_EXIST))
                .verify();

        verify(userService, never()).addNewConnectionAndReturnUser(any(), any());
        assertThat(found.getPassword()).isNull();
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] EMAIL register against a provider-only account -> USER_LOGIN_ID_EXIST");
    }

    /** Case 3: GENERIC, a placeholder with no connections and an exclusive raw membership of the provider's own org -> linked. */
    @Test
    void genericSource_placeholderExclusiveMemberOfProviderOrg_linked() {
        User placeholder = User.builder().id(USER_ID).connections(new HashSet<>()).build();
        AuthUser authUser = authUser(SOURCE_GENERIC, ORG_ID);
        resolvesByRawIdOnly(authUser, placeholder);
        when(orgMemberService.getRawOrgMemberships(USER_ID)).thenReturn(Mono.just(List.of(member(ORG_ID))));
        when(userService.addNewConnectionAndReturnUser(USER_ID, authUser)).thenReturn(Mono.just(placeholder));

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false)).expectNext(placeholder).verifyComplete();

        verify(userService).addNewConnectionAndReturnUser(USER_ID, authUser);
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] placeholder, exclusive member of provider org -> linked");
    }

    /** Case 4: same placeholder, but its single raw membership is NOT the provider's org -> {@code ALREADY_BIND}. */
    @Test
    void genericSource_placeholderMemberOfADifferentOrg_refusedAlreadyBind() {
        User placeholder = User.builder().id(USER_ID).connections(new HashSet<>()).build();
        AuthUser authUser = authUser(SOURCE_GENERIC, ORG_ID);
        resolvesByRawIdOnly(authUser, placeholder);
        when(orgMemberService.getRawOrgMemberships(USER_ID)).thenReturn(Mono.just(List.of(member(OTHER_ORG_ID))));

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.ALREADY_BIND))
                .verify();

        verify(userService, never()).addNewConnectionAndReturnUser(any(), any());
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] placeholder, not a member of the provider's org -> ALREADY_BIND");
    }

    /**
     * Case 5: the cross-org SCIM-pollution scenario of plan section 3 -- the placeholder has TWO raw memberships
     * (the provider's org, and one other an attacker admin pulled it into via {@code createSCIMUserAndAddToOrg}) ->
     * {@code ALREADY_BIND}, not linked, since the membership is no longer exclusive.
     */
    @Test
    void genericSource_placeholderWithTwoRawMemberships_refusedAlreadyBindNotFooledByPollution() {
        User placeholder = User.builder().id(USER_ID).connections(new HashSet<>()).build();
        AuthUser authUser = authUser(SOURCE_GENERIC, ORG_ID);
        resolvesByRawIdOnly(authUser, placeholder);
        when(orgMemberService.getRawOrgMemberships(USER_ID)).thenReturn(Mono.just(List.of(member(ORG_ID), member(OTHER_ORG_ID))));

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.ALREADY_BIND))
                .verify();

        verify(userService, never()).addNewConnectionAndReturnUser(any(), any());
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] placeholder polluted with a second org membership -> ALREADY_BIND");
    }

    /** Case 6: EMAIL source against a placeholder (case (b) explicitly excludes EMAIL) -> {@code USER_LOGIN_ID_EXIST}. */
    @Test
    void emailSource_placeholder_refusedUserLoginIdExist() {
        User placeholder = User.builder().id(USER_ID).connections(new HashSet<>()).build();
        AuthUser authUser = authUser(AuthSourceConstants.EMAIL, ORG_ID);
        resolvesByRawIdOnly(authUser, placeholder);

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.USER_LOGIN_ID_EXIST))
                .verify();

        verify(userService, never()).addNewConnectionAndReturnUser(any(), any());
        verify(orgMemberService, never()).getRawOrgMemberships(any());
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] EMAIL source against a placeholder -> USER_LOGIN_ID_EXIST, case (b) excludes EMAIL");
    }

    /** Case 7: {@code isSuperAdmin = true} links as before, regardless of connections or membership. */
    @Test
    void isSuperAdmin_linksAsBefore_regardlessOfConnectionsOrMembership() {
        User found = User.builder().id(USER_ID).connections(new HashSet<>(Set.of(connection("GOOGLE")))).build();
        AuthUser authUser = authUser(SOURCE_GENERIC, ORG_ID);
        resolvesByRawIdOnly(authUser, found);
        when(userService.addNewConnectionAndReturnUser(USER_ID, authUser)).thenReturn(Mono.just(found));

        StepVerifier.create(service.updateOrCreateUser(authUser, false, true)).expectNext(found).verifyComplete();

        verify(userService).addNewConnectionAndReturnUser(USER_ID, authUser);
        verify(orgMemberService, never()).getRawOrgMemberships(any());
        System.out.println("[AuthenticationApiServiceImplEmailLinkTest] isSuperAdmin=true -> linked unconditionally");
    }
}

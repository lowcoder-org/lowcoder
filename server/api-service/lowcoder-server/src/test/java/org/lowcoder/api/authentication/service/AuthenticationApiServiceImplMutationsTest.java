package org.lowcoder.api.authentication.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactory;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.InvitationApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.ConnectionAuthToken;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Unit tests of the mutating methods of {@link AuthenticationApiServiceImpl}: enable/disable/find auth configs,
 * the connection update after re-authentication, user lookup/creation routing, the post-login organisation and
 * group join, and the login orchestration.
 *
 * <p>Defects pinned here (owner decision D-6: today's behaviour is asserted, a fix changes the test on purpose):
 * <ul>
 *   <li>plan §9 / analysis H3: {@code disableAuthConfig(.., delete=true)} on an organisation without an
 *       organisation domain throws a NullPointerException;</li>
 *   <li>plan §9 "findAuthConfigs ignores its enableOnly parameter".</li>
 * </ul>
 * Fixed since: plan §9 "builds a duplicate-config error and drops it" (BF-087): a new config of a type the organisation
 * already has is refused ({@link #enableAuthConfig_newConfigOfATypeAlreadyAdded_isRefusedAsADuplicateBF087}).
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationApiServiceImplMutationsTest {

    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String ENTERPRISE_ORG_ID = "org-enterprise";
    private static final String USER_ID = "user-1";
    private static final String CONFIG_A = "cfg-a";
    private static final String CONFIG_B = "cfg-b";
    private static final String SOURCE_GOOGLE = "GOOGLE";
    private static final String STUB_TYPE = "STUB";
    private static final String OTHER_TYPE = "OTHER";
    private static final String UID = "uid-1";
    private static final String OLD_AUTH_ID = "old-auth-id";
    private static final String GROUP_ID = "group-1";
    private static final String INVITATION_ID = "invitation-1";
    private static final String EMAIL_AUTH_ID = AuthSourceConstants.EMAIL;

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

    private CommonConfig commonConfig;
    private AuthenticationApiServiceImpl service;

    /** A concrete auth config that records the config it was merged from. */
    private static class StubAuthConfig extends AbstractAuthConfig {
        private AbstractAuthConfig mergedFrom;

        StubAuthConfig(String id, String source, boolean enable, boolean enableRegister, String authType) {
            super(id, source, source, enable, enableRegister, authType);
        }

        @Override
        public void merge(AbstractAuthConfig oldConfig) {
            this.mergedFrom = oldConfig;
        }
    }

    @BeforeEach
    void setUp() {
        commonConfig = new CommonConfig();
        service = new AuthenticationApiServiceImpl(orgApiService, organizationService, authRequestFactory,
                authenticationService, userService, invitationApiService, businessEventPublisher, sessionUserService,
                cookieHelper, authConfigFactory, userApiService, orgMemberService, jwtUtils, authProperties,
                commonConfig, groupMemberService);
    }

    // ---------------------------------------------------------------- helpers

    private static OrgMember member(MemberRole role) {
        return OrgMember.builder().orgId(ORG_ID).userId(USER_ID).role(role).build();
    }

    private void visitorIs(MemberRole role) {
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member(role)));
    }

    private static StubAuthConfig config(String id, boolean enable) {
        return new StubAuthConfig(id, SOURCE_GOOGLE, enable, true, STUB_TYPE);
    }

    private static StubAuthConfig config(String id, String authType) {
        return new StubAuthConfig(id, SOURCE_GOOGLE, true, true, authType);
    }

    private static AuthConfigRequest request(String id) {
        AuthConfigRequest request = new AuthConfigRequest();
        request.put("id", id);
        return request;
    }

    /** A request that creates a config: it carries no id, as the client's "Add OAuth Provider" form sends it. */
    private static AuthConfigRequest newConfigRequest() {
        return new AuthConfigRequest();
    }

    private static Organization organization(AbstractAuthConfig... configs) {
        OrganizationDomain domain = new OrganizationDomain();
        domain.setConfigs(new ArrayList<>(List.of(configs)));
        Organization organization = Organization.builder().id(ORG_ID).build();
        organization.setOrganizationDomain(domain);
        return organization;
    }

    private static Organization organizationWithoutDomain() {
        return Organization.builder().id(ORG_ID).build();
    }

    private void organizationIs(Organization organization) {
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(organization));
    }

    private static void assertBizError(Throwable throwable, BizError expected) {
        assertThat(throwable).isInstanceOf(BizException.class);
        assertThat(((BizException) throwable).getError()).isEqualTo(expected);
    }

    private static AuthUser authUser(String source, String uid, String orgId, String authConfigId, boolean enableRegister) {
        FormAuthRequestContext context = new FormAuthRequestContext("login", "pw", false, orgId);
        context.setAuthConfig(new StubAuthConfig(authConfigId, source, true, enableRegister, STUB_TYPE));
        return AuthUser.builder().uid(uid).orgId(orgId).authContext(context).build();
    }

    private static Connection connection(String source, String rawId, String authId, String... orgIds) {
        return Connection.builder().authId(authId).source(source).rawId(rawId).orgIds(new HashSet<>(Set.of(orgIds))).build();
    }

    private static User userWith(Connection... connections) {
        return User.builder().id(USER_ID).connections(new HashSet<>(Set.of(connections))).build();
    }

    // ------------------------------------------------------ enableAuthConfig

    /** Catches a dropped admin check: a plain member must not be able to change the login configuration. */
    @Test
    void enableAuthConfig_nonAdminMember_isRejectedBeforeAnyChange() {
        visitorIs(MemberRole.MEMBER);

        StepVerifier.create(service.enableAuthConfig(request(CONFIG_A)))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.NOT_AUTHORIZED))
                .verify();

        verifyNoInteractions(authConfigFactory);
        verify(organizationService, never()).update(anyString(), any());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] member -> NOT_AUTHORIZED, nothing built or updated");
    }

    /** Catches {@code || isSuperAdmin()} being dropped from the admin check. */
    @Test
    void enableAuthConfig_superAdmin_isAllowed() {
        visitorIs(MemberRole.SUPER_ADMIN);
        organizationIs(organization());
        when(authConfigFactory.build(any(), eq(true))).thenReturn(config(CONFIG_A, true));
        when(organizationService.update(eq(ORG_ID), any())).thenReturn(Mono.just(true));

        StepVerifier.create(service.enableAuthConfig(request(CONFIG_A))).expectNext(true).verifyComplete();
        System.out.println("[AuthenticationApiServiceImplMutationsTest] super admin may enable a config");
    }

    /** Catches EMAIL being handled as an ordinary config: it only clears the organisation's isEmailDisabled flag. */
    @Test
    void enableAuthConfig_email_clearsIsEmailDisabled_andBuildsNoConfig() {
        visitorIs(MemberRole.ADMIN);
        Organization organization = organization();
        organization.setIsEmailDisabled(true);
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(true));

        StepVerifier.create(service.enableAuthConfig(request(EMAIL_AUTH_ID))).expectNext(true).verifyComplete();

        assertThat(organization.getIsEmailDisabled()).isFalse();
        verifyNoInteractions(authConfigFactory);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] EMAIL enable -> isEmailDisabled=false, no config built");
    }

    /** Catches a built config not being stored: an organisation without domain gets one holding the new config. */
    @Test
    void enableAuthConfig_newConfig_isAddedToANewOrganizationDomain_andOrganizationUpdated() {
        visitorIs(MemberRole.ADMIN);
        Organization organization = organizationWithoutDomain();
        organizationIs(organization);
        StubAuthConfig built = config(CONFIG_A, true);
        when(authConfigFactory.build(any(), eq(true))).thenReturn(built);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(true));

        StepVerifier.create(service.enableAuthConfig(request(CONFIG_A))).expectNext(true).verifyComplete();

        assertThat(organization.getOrganizationDomain()).isNotNull();
        assertThat(organization.getAuthConfigs()).containsExactly(built);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] new config stored in a fresh OrganizationDomain");
    }

    /** Catches a second config with the same id being appended instead of merged into the old one. */
    @Test
    void enableAuthConfig_existingConfig_isMergedNotDuplicated() {
        visitorIs(MemberRole.ADMIN);
        StubAuthConfig old = config(CONFIG_A, false);
        StubAuthConfig other = config(CONFIG_B, true);
        Organization organization = organization(old, other);
        organizationIs(organization);
        StubAuthConfig built = config(CONFIG_A, true);
        when(authConfigFactory.build(any(), eq(true))).thenReturn(built);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(true));

        StepVerifier.create(service.enableAuthConfig(request(CONFIG_A))).expectNext(true).verifyComplete();

        assertThat(built.mergedFrom).isSameAs(old);
        assertThat(organization.getAuthConfigs()).containsExactlyInAnyOrder(built, other);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] same id -> merged, "
                + organization.getAuthConfigs().size() + " configs remain");
    }

    /**
     * BF-087 (fixed; was pinned as the plan §9 defect "builds a duplicate-config error and drops it"): a new config (a
     * request without an id) of a type the organization already has is refused with DUPLICATE_AUTH_CONFIG_ADDITION, and
     * the organization is not updated.
     */
    @Test
    void enableAuthConfig_newConfigOfATypeAlreadyAdded_isRefusedAsADuplicateBF087() {
        visitorIs(MemberRole.ADMIN);
        StubAuthConfig existing = config(CONFIG_A, STUB_TYPE);
        Organization organization = organization(existing);
        organizationIs(organization);
        when(authConfigFactory.build(any(), eq(true))).thenReturn(config(CONFIG_B, STUB_TYPE));

        StepVerifier.create(service.enableAuthConfig(newConfigRequest()))
                .expectErrorSatisfies(e -> {
                    System.out.println("[AuthenticationApiServiceImplMutationsTest] new " + STUB_TYPE + " config beside an existing one -> " + e);
                    assertBizError(e, BizError.DUPLICATE_AUTH_CONFIG_ADDITION);
                })
                .verify();
        verify(organizationService, never()).update(anyString(), any());
        assertThat(organization.getAuthConfigs()).containsExactly(existing);
    }

    /** BF-087: the generic OAuth type may be added more than once, as the client offers it; a second one is added. */
    @Test
    void enableAuthConfig_newGenericConfigBesideAnotherGeneric_isAddedBF087() {
        visitorIs(MemberRole.ADMIN);
        StubAuthConfig existing = config(CONFIG_A, AuthTypeConstants.GENERIC);
        Organization organization = organization(existing);
        organizationIs(organization);
        StubAuthConfig built = config(CONFIG_B, AuthTypeConstants.GENERIC);
        when(authConfigFactory.build(any(), eq(true))).thenReturn(built);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(true));

        StepVerifier.create(service.enableAuthConfig(newConfigRequest())).expectNext(true).verifyComplete();

        System.out.println("[AuthenticationApiServiceImplMutationsTest] second GENERIC config -> " + organization.getAuthConfigs().size() + " configs");
        assertThat(organization.getAuthConfigs()).containsExactlyInAnyOrder(existing, built);
    }

    /** BF-087: a new config of a type the organization does not have yet is added beside the others. */
    @Test
    void enableAuthConfig_newConfigOfAnotherType_isAddedBF087() {
        visitorIs(MemberRole.ADMIN);
        StubAuthConfig existing = config(CONFIG_A, STUB_TYPE);
        Organization organization = organization(existing);
        organizationIs(organization);
        StubAuthConfig built = config(CONFIG_B, OTHER_TYPE);
        when(authConfigFactory.build(any(), eq(true))).thenReturn(built);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(true));

        StepVerifier.create(service.enableAuthConfig(newConfigRequest())).expectNext(true).verifyComplete();

        assertThat(organization.getAuthConfigs()).containsExactlyInAnyOrder(existing, built);
    }

    // ----------------------------------------------------- disableAuthConfig

    /** Catches a dropped admin check on disable: nothing may be queried, updated or logged out. */
    @Test
    void disableAuthConfig_nonAdmin_isRejected_noUpdate_noTokenRemoval() {
        visitorIs(MemberRole.MEMBER);

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.NOT_AUTHORIZED))
                .verify();

        verify(organizationService, never()).update(anyString(), any());
        verifyNoInteractions(userApiService);
        verify(sessionUserService, never()).removeUserSession(anyString());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] member -> NOT_AUTHORIZED on disable");
    }

    /** Catches the lock-out defect: disabling the only effective login method must be forbidden. */
    @Test
    void disableAuthConfig_lastEffectiveConfig_isForbidden() {
        visitorIs(MemberRole.ADMIN);
        when(authenticationService.findAllAuthConfigs(ORG_ID, true))
                .thenReturn(Flux.just(new FindAuthConfig(config(CONFIG_A, true), null)));

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.DISABLE_AUTH_CONFIG_FORBIDDEN))
                .verify();

        verify(organizationService, never()).update(anyString(), any());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] last effective config cannot be disabled");
    }

    /** Catches the forbid check being too eager: with another effective config the disable proceeds. */
    @Test
    void disableAuthConfig_otherEffectiveConfigExists_proceeds_andAsksForEffectiveConfigsOnly() {
        visitorIs(MemberRole.ADMIN);
        when(authenticationService.findAllAuthConfigs(ORG_ID, true)).thenReturn(Flux.just(
                new FindAuthConfig(config(CONFIG_A, true), null), new FindAuthConfig(config(CONFIG_B, true), null)));
        Organization organization = organization(config(CONFIG_A, true), config(CONFIG_B, true));
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(false));

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, false)).expectNext(false).verifyComplete();

        verify(authenticationService).findAllAuthConfigs(ORG_ID, true);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] another effective config -> disable proceeds");
    }

    /** Catches EMAIL being treated as a stored config: it only sets the organisation's isEmailDisabled flag. */
    @Test
    void disableAuthConfig_email_setsIsEmailDisabled_andLeavesConfigsUntouched() {
        visitorIs(MemberRole.ADMIN);
        when(authenticationService.findAllAuthConfigs(ORG_ID, true)).thenReturn(Flux.just(
                new FindAuthConfig(config(EMAIL_AUTH_ID, true), null), new FindAuthConfig(config(CONFIG_B, true), null)));
        StubAuthConfig stored = config(CONFIG_B, true);
        Organization organization = organization(stored);
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(false));

        StepVerifier.create(service.disableAuthConfig(EMAIL_AUTH_ID, true)).expectNext(false).verifyComplete();

        assertThat(organization.getIsEmailDisabled()).isTrue();
        assertThat(organization.getAuthConfigs()).containsExactly(stored);
        assertThat(stored.isEnable()).isTrue();
        System.out.println("[AuthenticationApiServiceImplMutationsTest] EMAIL disable -> flag only, even with delete=true");
    }

    /** Catches delete=false removing the config or touching its siblings: it must only set enable=false. */
    @Test
    void disableAuthConfig_deleteFalse_onlySetsEnableFalse_andKeepsTheConfig() {
        visitorIs(MemberRole.ADMIN);
        enoughEffectiveConfigs();
        StubAuthConfig target = config(CONFIG_A, true);
        StubAuthConfig sibling = config(CONFIG_B, true);
        Organization organization = organization(target, sibling);
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(false));

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, false)).expectNext(false).verifyComplete();

        assertThat(organization.getAuthConfigs()).containsExactlyInAnyOrder(target, sibling);
        assertThat(target.isEnable()).isFalse();
        assertThat(sibling.isEnable()).isTrue();
        System.out.println("[AuthenticationApiServiceImplMutationsTest] delete=false -> enable=false, both configs kept");
    }

    /** Catches the delete flag being ignored: delete=true removes exactly the matching config. */
    @Test
    void disableAuthConfig_deleteTrue_removesOnlyTheMatchingConfig() {
        visitorIs(MemberRole.ADMIN);
        enoughEffectiveConfigs();
        StubAuthConfig target = config(CONFIG_A, true);
        StubAuthConfig sibling = config(CONFIG_B, true);
        Organization organization = organization(target, sibling);
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(false));

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, true)).expectNext(false).verifyComplete();

        assertThat(organization.getAuthConfigs()).containsExactly(sibling);
        assertThat(target.isEnable()).isTrue();
        System.out.println("[AuthenticationApiServiceImplMutationsTest] delete=true -> only " + CONFIG_A + " removed");
    }

    /**
     * Pins the plan §9 / analysis H3 defect: {@code disableAuthConfig(.., delete=true)} dereferences
     * {@code organization.getOrganizationDomain()} without a null check, so an organisation without a domain
     * fails with a NullPointerException and is never updated. A fix changes this test on purpose.
     */
    @Test
    void disableAuthConfig_deleteTrue_organizationWithoutDomain_failsWithNpe_pinsNullDomainDefect() {
        visitorIs(MemberRole.ADMIN);
        enoughEffectiveConfigs();
        organizationIs(organizationWithoutDomain());

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, true))
                .expectError(NullPointerException.class)
                .verify();

        verify(organizationService, never()).update(anyString(), any());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] no domain + delete=true -> NPE, no update (today's behaviour)");
    }

    /** Catches sessions of a disabled provider staying valid: every org member's tokens for that auth id are removed. */
    @Test
    void disableAuthConfig_updateSucceeded_removesTheTokensOfEveryOrgMemberForThatAuthId() {
        visitorIs(MemberRole.ADMIN);
        enoughEffectiveConfigs();
        Organization organization = organization(config(CONFIG_A, true));
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(true));
        when(orgMemberService.getOrganizationMembers(ORG_ID)).thenReturn(Flux.just(
                OrgMember.builder().orgId(ORG_ID).userId("u1").role(MemberRole.MEMBER).build(),
                OrgMember.builder().orgId(ORG_ID).userId("u2").role(MemberRole.MEMBER).build()));
        when(userApiService.getTokensByAuthId("u1", CONFIG_A)).thenReturn(Flux.just("t1", "t2"));
        when(userApiService.getTokensByAuthId("u2", CONFIG_A)).thenReturn(Flux.just("t3"));
        when(sessionUserService.removeUserSession(anyString())).thenReturn(Mono.empty());

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, false)).expectNext(true).verifyComplete();

        verify(sessionUserService).removeUserSession("t1");
        verify(sessionUserService).removeUserSession("t2");
        verify(sessionUserService).removeUserSession("t3");
        System.out.println("[AuthenticationApiServiceImplMutationsTest] t1,t2,t3 of the two members removed");
    }

    /** Catches token removal after a failed update: nobody may be logged out when nothing changed. */
    @Test
    void disableAuthConfig_updateFailed_removesNoTokens() {
        visitorIs(MemberRole.ADMIN);
        enoughEffectiveConfigs();
        Organization organization = organization(config(CONFIG_A, true));
        organizationIs(organization);
        when(organizationService.update(ORG_ID, organization)).thenReturn(Mono.just(false));

        StepVerifier.create(service.disableAuthConfig(CONFIG_A, false)).expectNext(false).verifyComplete();

        verifyNoInteractions(userApiService);
        verify(sessionUserService, never()).removeUserSession(anyString());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] update=false -> no token removed");
    }

    private void enoughEffectiveConfigs() {
        when(authenticationService.findAllAuthConfigs(ORG_ID, true)).thenReturn(Flux.just(
                new FindAuthConfig(config(CONFIG_A, true), null), new FindAuthConfig(config(CONFIG_B, true), null)));
    }

    // ------------------------------------------------------- findAuthConfigs

    /** Catches a dropped admin check on listing: the configs (with secrets) are admin-only. */
    @Test
    void findAuthConfigs_nonAdmin_isRejected_andNothingIsQueried() {
        visitorIs(MemberRole.MEMBER);

        StepVerifier.create(service.findAuthConfigs(false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.NOT_AUTHORIZED))
                .verify();

        verifyNoInteractions(authenticationService);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] member -> NOT_AUTHORIZED on list");
    }

    /**
     * Pins the plan §9 defect "findAuthConfigs ignores its enableOnly parameter": the admin's own organisation is
     * queried with enableOnly=false even when the caller passes true. A fix changes this test on purpose.
     */
    @Test
    void findAuthConfigs_admin_queriesOwnOrg_andIgnoresEnableOnly_pinsEnableOnlyDefect() {
        visitorIs(MemberRole.ADMIN);
        FindAuthConfig found = new FindAuthConfig(config(CONFIG_A, false), null);
        when(authenticationService.findAllAuthConfigs(ORG_ID, false)).thenReturn(Flux.just(found));

        StepVerifier.create(service.findAuthConfigs(true)).expectNext(found).verifyComplete();

        verify(authenticationService).findAllAuthConfigs(ORG_ID, false);
        verify(authenticationService, never()).findAllAuthConfigs(anyString(), eq(true));
        System.out.println("[AuthenticationApiServiceImplMutationsTest] findAuthConfigs(true) still queried enableOnly=false");
    }

    // -------------------------------------------------------- updateConnection

    /** Catches the organisation not being merged into the connection, or merged twice, and activeAuthId not following. */
    @Test
    void updateConnection_mergesTheOrgOnce_setsAuthId_andActiveAuthId() {
        Connection existing = connection(SOURCE_GOOGLE, UID, OLD_AUTH_ID, ORG_ID);
        User user = userWith(existing);
        AuthUser blankOrg = authUser(SOURCE_GOOGLE, UID, "", CONFIG_A, true);
        service.updateConnection(blankOrg, user);
        assertThat(existing.getOrgIds()).containsExactly(ORG_ID);

        AuthUser otherOrg = authUser(SOURCE_GOOGLE, UID, OTHER_ORG_ID, CONFIG_A, true);
        service.updateConnection(otherOrg, user);
        service.updateConnection(otherOrg, user);

        assertThat(existing.getOrgIds()).containsExactlyInAnyOrder(ORG_ID, OTHER_ORG_ID);
        assertThat(existing.getAuthId()).isEqualTo(CONFIG_A);
        assertThat(user.getActiveAuthId()).isEqualTo(CONFIG_A);
        assertThat(user.getConnections()).hasSize(1);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] orgs=" + existing.getOrgIds()
                + " authId=" + existing.getAuthId() + " activeAuthId=" + user.getActiveAuthId());
    }

    /** Catches the Google refresh token being lost: a re-login that returns none inherits the stored one. */
    @Test
    void updateConnection_emptyNewRefreshToken_inheritsTheStoredOne_butAPresentOneWins() {
        Connection existing = connection(SOURCE_GOOGLE, UID, OLD_AUTH_ID, ORG_ID);
        existing.setAuthConnectionAuthToken(ConnectionAuthToken.builder().accessToken("old-a").refreshToken("old-r").build());
        User user = userWith(existing);

        AuthUser withoutRefresh = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        withoutRefresh.setAuthToken(AuthToken.builder().accessToken("new-a").build());
        service.updateConnection(withoutRefresh, user);
        assertThat(withoutRefresh.getAuthToken().getRefreshToken()).isEqualTo("old-r");
        assertThat(existing.getAuthConnectionAuthToken().getAccessToken()).isEqualTo("new-a");
        assertThat(existing.getAuthConnectionAuthToken().getRefreshToken()).isEqualTo("old-r");

        AuthUser withRefresh = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        withRefresh.setAuthToken(AuthToken.builder().accessToken("newer-a").refreshToken("new-r").build());
        service.updateConnection(withRefresh, user);
        assertThat(existing.getAuthConnectionAuthToken().getRefreshToken()).isEqualTo("new-r");
        System.out.println("[AuthenticationApiServiceImplMutationsTest] refresh token inherited, then overwritten by a present one");
    }

    /** Catches a stale token surviving a login without token, and raw user info not being refreshed. */
    @Test
    void updateConnection_nullAuthToken_clearsTheStoredToken_andCopiesRawUserInfo() {
        Connection existing = connection(SOURCE_GOOGLE, UID, OLD_AUTH_ID, ORG_ID);
        existing.setAuthConnectionAuthToken(ConnectionAuthToken.builder().accessToken("old-a").refreshToken("old-r").build());
        User user = userWith(existing);
        AuthUser authUser = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        authUser.setRawUserInfo(Map.of("k", "v"));

        service.updateConnection(authUser, user);

        assertThat(existing.getAuthConnectionAuthToken()).isNull();
        assertThat(existing.getRawUserInfo()).containsEntry("k", "v");
        System.out.println("[AuthenticationApiServiceImplMutationsTest] token cleared, rawUserInfo=" + existing.getRawUserInfo());
    }

    /**
     * getAuthConnection: EMAIL subjects match case-insensitively (exact match preferred, deterministic), every other
     * source is byte-exact. {@code NONE} = no connection matched and the update throws NoSuchElementException.
     * Columns: source, stored raw ids (|), authenticated uid, raw id of the connection that must be updated.
     */
    @ParameterizedTest(name = "{0} stored={1} uid={2} -> {3}")
    @CsvSource(delimiter = ';', value = {
            "EMAIL;John@Doe.com;john@doe.com;John@Doe.com",
            "EMAIL;John@Doe.com|john@doe.com;john@doe.com;john@doe.com",
            "EMAIL;john@doe.com|John@Doe.com;John@Doe.com;John@Doe.com",
            "EMAIL;john@doe.com;JoHn@DoE.com;john@doe.com",
            "GOOGLE;AbC;AbC;AbC",
            "GOOGLE;AbC;abc;NONE"})
    void updateConnection_matchesEmailCaseInsensitively_andOtherSourcesExactly(
            String source, String storedRawIds, String uid, String expectedRawId) {
        Set<Connection> connections = new HashSet<>();
        for (String rawId : storedRawIds.split("\\|")) {
            connections.add(connection(source, rawId, OLD_AUTH_ID, ORG_ID));
        }
        User user = User.builder().id(USER_ID).connections(connections).build();
        AuthUser authUser = authUser(source, uid, ORG_ID, CONFIG_A, true);

        if (expectedRawId.equals("NONE")) {
            assertThatThrownBy(() -> service.updateConnection(authUser, user)).isInstanceOf(NoSuchElementException.class);
            System.out.println("[AuthenticationApiServiceImplMutationsTest] " + source + " uid=" + uid + " -> no match");
            return;
        }
        service.updateConnection(authUser, user);

        for (Connection connection : connections) {
            String expectedAuthId = connection.getRawId().equals(expectedRawId) ? CONFIG_A : OLD_AUTH_ID;
            assertThat(connection.getAuthId()).as("authId of " + connection.getRawId()).isEqualTo(expectedAuthId);
        }
        System.out.println("[AuthenticationApiServiceImplMutationsTest] " + source + " uid=" + uid + " updated " + expectedRawId);
    }

    // ------------------------------------------------------ updateOrCreateUser

    /** Catches the register flag being ignored: an unknown user may only be created when registration is enabled. */
    @Test
    void updateOrCreateUser_noUser_registerDisabled_failsUserNotExist_registerEnabled_createsWithSuperAdminFlag() {
        when(userService.findByAuthUserSourceAndRawId(any())).thenReturn(Mono.empty());
        when(userService.findByAuthUserRawId(any())).thenReturn(Mono.empty());
        AuthUser closed = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, false);

        StepVerifier.create(service.updateOrCreateUser(closed, false, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.USER_NOT_EXIST))
                .verify();
        verify(userService, never()).createNewUserByAuthUser(any(), org.mockito.ArgumentMatchers.anyBoolean());

        User created = User.builder().id("new-user").build();
        AuthUser open = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        when(userService.createNewUserByAuthUser(open, true)).thenReturn(Mono.just(created));
        StepVerifier.create(service.updateOrCreateUser(open, false, true)).expectNext(created).verifyComplete();
        System.out.println("[AuthenticationApiServiceImplMutationsTest] register disabled -> USER_NOT_EXIST; enabled -> created");
    }

    /** Catches the first lookup not winning: same source and id updates the connection and saves, nothing is added. */
    @Test
    void updateOrCreateUser_foundBySourceAndRawId_updatesTheConnection_andSaves() {
        Connection existing = connection(SOURCE_GOOGLE, UID, OLD_AUTH_ID, ORG_ID);
        User user = userWith(existing);
        AuthUser authUser = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        when(userService.findByAuthUserSourceAndRawId(authUser)).thenReturn(Mono.just(user));
        when(userService.findByAuthUserRawId(authUser)).thenReturn(Mono.just(User.builder().id("other").build()));
        when(userService.saveUser(user)).thenReturn(Mono.just(user));

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false)).expectNext(user).verifyComplete();

        assertThat(existing.getAuthId()).isEqualTo(CONFIG_A);
        verify(userService, never()).addNewConnectionAndReturnUser(anyString(), any());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] source+rawId hit -> connection updated and user saved");
    }

    /** Catches the cross-source link being lost: a user known only by raw id gets the new connection added. */
    @Test
    void updateOrCreateUser_foundOnlyByRawId_addsANewConnection() {
        User user = User.builder().id(USER_ID).build();
        AuthUser authUser = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        when(userService.findByAuthUserSourceAndRawId(authUser)).thenReturn(Mono.empty());
        when(userService.findByAuthUserRawId(authUser)).thenReturn(Mono.just(user));
        when(userService.addNewConnectionAndReturnUser(USER_ID, authUser)).thenReturn(Mono.just(user));

        StepVerifier.create(service.updateOrCreateUser(authUser, false, false)).expectNext(user).verifyComplete();

        verify(userService, never()).saveUser(any());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] rawId-only hit -> new connection added");
    }

    /** Catches link-existing mode searching for a user: it must attach the connection to the current visitor. */
    @Test
    void updateOrCreateUser_linkExistingUser_addsTheConnectionToTheVisitor_withoutLookups() {
        User visitor = User.builder().id(USER_ID).build();
        AuthUser authUser = authUser(SOURCE_GOOGLE, UID, ORG_ID, CONFIG_A, true);
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        when(userService.addNewConnectionAndReturnUser(USER_ID, authUser)).thenReturn(Mono.just(visitor));

        StepVerifier.create(service.updateOrCreateUser(authUser, true, false)).expectNext(visitor).verifyComplete();

        verify(userService, never()).findByAuthUserSourceAndRawId(any());
        verify(userService, never()).findByAuthUserRawId(any());
        System.out.println("[AuthenticationApiServiceImplMutationsTest] link mode -> connection added to visitor " + USER_ID);
    }

    // -------------------------------------------------------------- onUserLogin

    private void workspaceMode(WorkspaceMode mode) {
        CommonConfig.Workspace workspace = new CommonConfig.Workspace();
        workspace.setMode(mode);
        commonConfig.setWorkspace(workspace);
    }

    /** Catches a login without organisation (SaaS mode) touching org or group membership. */
    @Test
    void onUserLogin_saasMode_blankOrgId_doesNothing() {
        workspaceMode(WorkspaceMode.SAAS);

        StepVerifier.create(service.onUserLogin("", User.builder().id(USER_ID).build(), SOURCE_GOOGLE, GROUP_ID)).verifyComplete();

        verifyNoInteractions(orgApiService, groupMemberService, organizationService);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] SaaS + blank org -> no membership change");
    }

    /** Catches the enterprise organisation not being used: the user joins it regardless of the login's orgId. */
    @Test
    void onUserLogin_enterpriseMode_joinsTheEnterpriseOrganization() {
        workspaceMode(WorkspaceMode.ENTERPRISE);
        when(organizationService.getOrganizationInEnterpriseMode())
                .thenReturn(Mono.just(Organization.builder().id(ENTERPRISE_ORG_ID).build()));
        when(orgApiService.tryAddUserToOrgAndSwitchOrg(ENTERPRISE_ORG_ID, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.onUserLogin(null, User.builder().id(USER_ID).build(), SOURCE_GOOGLE, null)).verifyComplete();

        verify(orgApiService).tryAddUserToOrgAndSwitchOrg(ENTERPRISE_ORG_ID, USER_ID);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] enterprise mode -> joined " + ENTERPRISE_ORG_ID);
    }

    /** Catches duplicate group membership: the user is added to the group only when not yet a member. */
    @Test
    void onUserLogin_groupGiven_addsTheMemberOnlyWhenAbsent() {
        workspaceMode(WorkspaceMode.SAAS);
        User user = User.builder().id(USER_ID).build();
        when(orgApiService.tryAddUserToOrgAndSwitchOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(true));
        when(groupMemberService.getGroupMember(GROUP_ID, USER_ID)).thenReturn(Mono.empty());
        when(groupMemberService.addMember(ORG_ID, GROUP_ID, USER_ID, MemberRole.MEMBER)).thenReturn(Mono.just(true));

        StepVerifier.create(service.onUserLogin(ORG_ID, user, SOURCE_GOOGLE, GROUP_ID)).verifyComplete();
        verify(groupMemberService).addMember(ORG_ID, GROUP_ID, USER_ID, MemberRole.MEMBER);

        when(groupMemberService.getGroupMember(GROUP_ID, USER_ID))
                .thenReturn(Mono.just(GroupMember.builder().groupId(GROUP_ID).userId(USER_ID).build()));
        StepVerifier.create(service.onUserLogin(ORG_ID, user, SOURCE_GOOGLE, GROUP_ID)).verifyComplete();
        verify(groupMemberService, times(1)).addMember(anyString(), anyString(), anyString(), any());

        StepVerifier.create(service.onUserLogin(ORG_ID, user, SOURCE_GOOGLE, null)).verifyComplete();
        verify(groupMemberService, times(2)).getGroupMember(GROUP_ID, USER_ID);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] group member added once; absent group id -> no group call");
    }

    // ----------------------------------------------------------- loginOrRegister

    /**
     * A default workspace is created only for a new user without organisation and invitation, and only when
     * workspace creation is on; an invitation is redeemed; the login event is always published.
     * Columns: isNewUser, authUser orgId, invitationId, workspaceCreation, expected default-workspace creation.
     */
    @ParameterizedTest(name = "new={0} org={1} invitation={2} creation={3} -> createDefault={4}")
    @CsvSource(nullValues = "null", value = {
            "true,null,null,true,true",
            "true,null,null,false,false",
            "true,org-1,null,true,false",
            "true,null,invitation-1,true,false",
            "false,null,null,true,false"})
    void loginOrRegister_createsTheDefaultWorkspaceOnlyWhenAllConditionsHold(
            boolean isNewUser, String orgId, String invitationId, boolean workspaceCreation, boolean expectCreate) {
        workspaceMode(WorkspaceMode.SAAS);
        AuthUser authUser = authUser(SOURCE_GOOGLE, UID, orgId, CONFIG_A, true);
        User user = User.builder().id(USER_ID).isNewUser(isNewUser).build();
        when(userService.findByAuthUserSourceAndRawId(authUser)).thenReturn(Mono.empty());
        when(userService.findByAuthUserRawId(authUser)).thenReturn(Mono.empty());
        when(userService.createNewUserByAuthUser(authUser, false)).thenReturn(Mono.just(user));
        when(sessionUserService.saveUserSession(anyString(), eq(user), eq(SOURCE_GOOGLE))).thenReturn(Mono.empty());
        when(businessEventPublisher.publishUserLoginEvent(SOURCE_GOOGLE)).thenReturn(Mono.empty());
        lenient().when(authProperties.getWorkspaceCreation()).thenReturn(workspaceCreation);
        lenient().when(organizationService.createDefault(user, false))
                .thenReturn(Mono.just(Organization.builder().id(ORG_ID).build()));
        lenient().when(orgApiService.tryAddUserToOrgAndSwitchOrg(anyString(), anyString())).thenReturn(Mono.just(true));
        lenient().when(invitationApiService.inviteUser(INVITATION_ID)).thenReturn(Mono.just(true));
        ServerWebExchange exchange = mock(ServerWebExchange.class);

        StepVerifier.create(service.loginOrRegister(authUser, exchange, invitationId, false)).verifyComplete();

        verify(organizationService, times(expectCreate ? 1 : 0)).createDefault(user, false);
        verify(invitationApiService, times(invitationId == null ? 0 : 1)).inviteUser(INVITATION_ID);
        verify(cookieHelper).saveCookie(anyString(), eq(exchange));
        verify(businessEventPublisher).publishUserLoginEvent(SOURCE_GOOGLE);
        System.out.println("[AuthenticationApiServiceImplMutationsTest] new=" + isNewUser + " org=" + orgId + " invitation="
                + invitationId + " creation=" + workspaceCreation + " -> createDefault=" + expectCreate);
    }
}

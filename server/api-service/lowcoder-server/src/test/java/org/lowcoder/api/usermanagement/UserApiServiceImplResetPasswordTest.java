package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code UserApiServiceImpl#resetPassword} must refuse to reset a SUPER_ADMIN (by role or
 * by the account-wide {@code superAdmin} flag), unless the visitor is resetting their own password.
 *
 * <p>{@code resetPassword}'s chain is {@code checkAdminPermissionAndUserBelongsToCurrentOrg(userId)
 * .then(checkResetTargetBelowSuperAdmin(userId)).then(userService.resetPassword(userId))}: the last {@code .then}'s
 * argument, {@code userService.resetPassword(userId)}, is a Java method call evaluated while the chain is
 * ASSEMBLED, even when an earlier step fails and the resulting {@code Mono} is never subscribed (the same pattern
 * documented in {@code OrgApiServiceImplTest} for {@code updateRoleForMember}/{@code removeUserFromOrg}, and in
 * {@code FolderApiServiceImplTest} as {@code flagged}/{@code flaggedVoid}). So "nothing was reset" is asserted with
 * a subscription flag, never {@code verify(..., never()).resetPassword(...)}.
 */
class UserApiServiceImplResetPasswordTest {

    private static final String ORG_ID = "org-1";
    private static final String VISITOR_ID = "visitor-1";
    private static final String TARGET_ID = "target-1";
    private static final String NEW_PASSWORD = "UserApiServiceImplResetPasswordTest.newPassword";

    private SessionUserService sessionUserService;
    private OrgMemberService orgMemberService;
    private UserService userService;
    private UserApiServiceImpl service;

    @BeforeEach
    void setUp() {
        sessionUserService = mock(SessionUserService.class);
        orgMemberService = mock(OrgMemberService.class);
        userService = mock(UserService.class);
        service = new UserApiServiceImpl(sessionUserService, orgMemberService, userService, mock(UserRepository.class));
    }

    private void visitorIs(String visitorId, MemberRole visitorRole) {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(visitorId));
        when(sessionUserService.getVisitorOrgMemberCache())
                .thenReturn(Mono.just(new OrgMember(ORG_ID, visitorId, visitorRole, "visitor-state", 0L)));
    }

    private void targetIs(MemberRole targetRole, boolean superAdminFlag) {
        when(orgMemberService.getOrgMember(ORG_ID, TARGET_ID))
                .thenReturn(Mono.just(new OrgMember(ORG_ID, TARGET_ID, targetRole, "target-state", 0L)));
        User target = User.builder().id(TARGET_ID).superAdmin(superAdminFlag).build();
        when(userService.findById(TARGET_ID)).thenReturn(Mono.just(target));
    }

    private static <T> Mono<T> flagged(AtomicBoolean subscribed, T value) {
        return Mono.defer(() -> {
            subscribed.set(true);
            return Mono.justOrEmpty(value);
        });
    }

    private static void assertUnsupportedOperation(Mono<String> result) {
        StepVerifier.create(result)
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable).isInstanceOf(BizException.class);
                    assertThat(((BizException) throwable).getError()).isEqualTo(BizError.UNSUPPORTED_OPERATION);
                    assertThat(((BizException) throwable).getMessageKey()).isEqualTo("BAD_REQUEST");
                })
                .verify();
    }

    /** Target SUPER_ADMIN role, ADMIN-role visitor -> refused, nothing reset. */
    @Test
    void targetSuperAdminRole_adminVisitor_refusedD40() {
        visitorIs(VISITOR_ID, MemberRole.ADMIN);
        targetIs(MemberRole.SUPER_ADMIN, false);
        AtomicBoolean reset = new AtomicBoolean();
        when(userService.resetPassword(TARGET_ID)).thenReturn(flagged(reset, NEW_PASSWORD));

        assertUnsupportedOperation(service.resetPassword(TARGET_ID));

        assertThat(reset).as("userService.resetPassword must never be subscribed").isFalse();
    }

    /** Target ADMIN role but the account-wide superAdmin flag is set, ADMIN-role visitor -> refused, nothing reset. */
    @Test
    void targetSuperAdminFlagRoleAdmin_adminVisitor_refusedD40() {
        visitorIs(VISITOR_ID, MemberRole.ADMIN);
        targetIs(MemberRole.ADMIN, true);
        AtomicBoolean reset = new AtomicBoolean();
        when(userService.resetPassword(TARGET_ID)).thenReturn(flagged(reset, NEW_PASSWORD));

        assertUnsupportedOperation(service.resetPassword(TARGET_ID));

        assertThat(reset).as("userService.resetPassword must never be subscribed").isFalse();
    }

    /**
     * The same two protected-target denials, but with a SUPER_ADMIN-role VISITOR: the refusal must not depend on
     * the visitor's own role, only on the target's role/flag and on self-identity. An implementation that wrongly
     * exempts every SUPER_ADMIN-role visitor from the check would pass the two tests above but fail these.
     */
    @Test
    void targetSuperAdminRole_superAdminVisitor_nonSelf_refusedD40() {
        visitorIs(VISITOR_ID, MemberRole.SUPER_ADMIN);
        targetIs(MemberRole.SUPER_ADMIN, false);
        AtomicBoolean reset = new AtomicBoolean();
        when(userService.resetPassword(TARGET_ID)).thenReturn(flagged(reset, NEW_PASSWORD));

        assertUnsupportedOperation(service.resetPassword(TARGET_ID));

        assertThat(reset).isFalse();
    }

    @Test
    void targetSuperAdminFlagRoleAdmin_superAdminVisitor_nonSelf_refusedD40() {
        visitorIs(VISITOR_ID, MemberRole.SUPER_ADMIN);
        targetIs(MemberRole.ADMIN, true);
        AtomicBoolean reset = new AtomicBoolean();
        when(userService.resetPassword(TARGET_ID)).thenReturn(flagged(reset, NEW_PASSWORD));

        assertUnsupportedOperation(service.resetPassword(TARGET_ID));

        assertThat(reset).isFalse();
    }

    /** A plain MEMBER target, superAdmin flag false -> reset (unaffected, the baseline allowed case). */
    @Test
    void targetMemberRole_notSuperAdminFlag_resetD40() {
        visitorIs(VISITOR_ID, MemberRole.ADMIN);
        targetIs(MemberRole.MEMBER, false);
        when(userService.resetPassword(TARGET_ID)).thenReturn(Mono.just(NEW_PASSWORD));

        StepVerifier.create(service.resetPassword(TARGET_ID)).expectNext(NEW_PASSWORD).verifyComplete();
    }

    /**
     * An ADMIN target, superAdmin flag false, is still resettable -- section 3's rule refuses only a SUPER_ADMIN
     * role or a true superAdmin flag. Required so an implementation that wrongly blocks EVERY ADMIN target would
     * fail here while still passing every other planned case.
     */
    @Test
    void targetAdminRole_notSuperAdminFlag_resetD40() {
        visitorIs(VISITOR_ID, MemberRole.ADMIN);
        targetIs(MemberRole.ADMIN, false);
        when(userService.resetPassword(TARGET_ID)).thenReturn(Mono.just(NEW_PASSWORD));

        StepVerifier.create(service.resetPassword(TARGET_ID)).expectNext(NEW_PASSWORD).verifyComplete();
    }

    /**
     * The visitor resets ITSELF, visitor/target role ADMIN with superAdmin=true -> allowed. Matches
     * {@link #targetSuperAdminFlagRoleAdmin_adminVisitor_refusedD40} in every respect except that {@code userId} now
     * equals the visitor's own id, isolating the self-exception precisely.
     */
    @Test
    void selfReset_adminRoleWithSuperAdminFlag_allowedD40() {
        visitorIs(VISITOR_ID, MemberRole.ADMIN);
        // checkAdminPermissionAndUserBelongsToCurrentOrg (unchanged by this phase) still looks up the visitor's own
        // membership of its current org, self-reset included -- the visitor is necessarily a member of it.
        when(orgMemberService.getOrgMember(ORG_ID, VISITOR_ID))
                .thenReturn(Mono.just(new OrgMember(ORG_ID, VISITOR_ID, MemberRole.ADMIN, "visitor-state", 0L)));
        // checkResetTargetBelowSuperAdmin's self path returns before reading the target's membership or user
        // record a SECOND time, so no additional stub for them is needed or expected to be consulted.
        when(userService.resetPassword(VISITOR_ID)).thenReturn(Mono.just(NEW_PASSWORD));

        StepVerifier.create(service.resetPassword(VISITOR_ID)).expectNext(NEW_PASSWORD).verifyComplete();
    }

    /** Visitor not an admin -> unchanged answer (the existing, unaffected check runs first). */
    @Test
    void visitorNotAnAdmin_refusedUnchangedD40() {
        visitorIs(VISITOR_ID, MemberRole.MEMBER);
        AtomicBoolean reset = new AtomicBoolean();
        when(userService.resetPassword(eq(TARGET_ID))).thenReturn(flagged(reset, NEW_PASSWORD));

        assertUnsupportedOperation(service.resetPassword(TARGET_ID));

        assertThat(reset).isFalse();
    }

    /** Target not a member of the visitor's current org -> unchanged answer (the existing, unaffected check runs first). */
    @Test
    void targetNotAMember_refusedUnchangedD40() {
        visitorIs(VISITOR_ID, MemberRole.ADMIN);
        when(orgMemberService.getOrgMember(ORG_ID, TARGET_ID)).thenReturn(Mono.empty());
        AtomicBoolean reset = new AtomicBoolean();
        when(userService.resetPassword(eq(TARGET_ID))).thenReturn(flagged(reset, NEW_PASSWORD));

        assertUnsupportedOperation(service.resetPassword(TARGET_ID));

        assertThat(reset).isFalse();
    }
}

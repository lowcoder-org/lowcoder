package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.invitation.service.InvitationService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link InvitationApiServiceImpl} (joining by invitation, the invitation view, invitation creation),
 * {@link InvitationVO} and {@link UserApiServiceImpl} (the admin gate of user detail and password reset, and the
 * removal of stale tokens), with every collaborator mocked. The two one-line delegates of {@code UserApiServiceImpl}
 * ({@code lostPassword}, {@code resetLostPassword}) are not tested: that would test a mock.
 *
 * <p>Pinned production defects (owner decision D-6: fixes are deferred, a fix changes these tests on purpose):
 * <ul>
 * <li>plan section 9 row "InvitationApiServiceImpl (:103) raises INVITER_NOT_FOUND with the message key
 * INVITED_ORG_DELETED": see {@link #getInvitationView_inviterMissing_isInviterNotFoundWithTheOrgDeletedKey_pinsSection9Row}.</li>
 * </ul>
 * Fixed (BF-006, was the plan section 9 row "no role check on invitation creation"): creating an invitation needs
 * membership of the organization ({@link #create_visitorWhoIsNotAMemberOfTheOrganization_isRefused_andNothingIsSaved}), and
 * an invitation lets someone join only while its creator is a member
 * ({@link #inviteUser_invitationWhoseCreatorIsNotAMember_isInvalid_andNobodyJoins}).
 */
@ExtendWith(MockitoExtension.class)
class InvitationAndUserApiServiceTest {

    private static final String LOG_PREFIX = "[InvitationAndUserApiServiceTest] ";

    private static final String INVITATION_ID = "invitation-1";
    private static final String ORG_ID = "org-1";
    private static final String VISITOR_ID = "visitor-1";
    private static final String CREATOR_ID = "creator-1";
    private static final String TARGET_ID = "target-1";
    private static final String ORG_NAME = "Org One";

    @Mock
    private InvitationService invitationService;
    @Mock
    private OrgApiService orgApiService;
    @Mock
    private UserService userService;
    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private OrganizationService organizationService;
    @Mock
    private OrgMemberService orgMemberService;
    @Mock
    private AbstractBizThresholdChecker bizThresholdChecker;
    @Mock
    private UserRepository userRepository;

    private InvitationApiServiceImpl invitationApiService;
    private UserApiServiceImpl userApiService;

    private final List<String> events = new ArrayList<>();

    @BeforeEach
    void setUp() {
        invitationApiService = new InvitationApiServiceImpl(invitationService, orgApiService, userService, sessionUserService,
                organizationService, orgMemberService, bizThresholdChecker);
        userApiService = new UserApiServiceImpl(sessionUserService, orgMemberService, userService, userRepository);
    }

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    private static Invitation invitation() {
        Invitation invitation = Invitation.builder().createUserId(CREATOR_ID).invitedOrganizationId(ORG_ID).build();
        invitation.setId(INVITATION_ID);
        return invitation;
    }

    private static Organization organization() {
        Organization organization = new Organization();
        organization.setId(ORG_ID);
        organization.setName(ORG_NAME);
        return organization;
    }

    private static User user(String id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.justOrEmpty(value);
        });
    }

    private Mono<Void> loggedVoid(String event, RuntimeException failure) {
        return Mono.defer(() -> {
            events.add(event);
            return failure == null ? Mono.empty() : Mono.error(failure);
        });
    }

    // ------------------------------------------------------------------ inviteUser

    /**
     * Catches a join with a code that does not exist: INVALID_INVITATION_CODE with the code as argument, and no
     * organization or membership lookup, no quota check and no switch.
     */
    @Test
    void inviteUser_unknownInvitation_isInvalidInvitationCode() {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        when(invitationService.getById(INVITATION_ID)).thenReturn(Mono.empty());

        StepVerifier.create(invitationApiService.inviteUser(INVITATION_ID))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE");
                    assertThat(((BizException) error).getArgs()).containsExactly(INVITATION_ID);
                })
                .verify();
        verifyNoInteractions(organizationService, orgMemberService, orgApiService, bizThresholdChecker);
        say("inviteUser: unknown invitation -> INVALID_INVITATION_CODE, nothing else touched");
    }

    private void stubJoin() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(invitationService.getById(INVITATION_ID)).thenReturn(Mono.just(invitation()));
        lenient().when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(organization()));
        lenient().when(orgApiService.switchCurrentOrganizationTo(ORG_ID)).thenReturn(logged("switch", true));
        stubCreatorMembership(true);
    }

    /** The invitation's creator is (or is not) a member of the invited organization; the lookup is logged as "inviter". */
    private void stubCreatorMembership(boolean member) {
        lenient().when(orgMemberService.getOrgMember(ORG_ID, CREATOR_ID)).thenReturn(Mono.defer(() -> {
            events.add("inviter");
            return member ? Mono.just(new OrgMember(ORG_ID, CREATOR_ID, MemberRole.ADMIN, "normal", 0L)) : Mono.empty();
        }));
    }

    private void stubMembership(boolean member) {
        lenient().when(orgMemberService.getOrgMember(ORG_ID, VISITOR_ID)).thenReturn(Mono.defer(() -> {
            events.add("lookup");
            return member ? Mono.just(new OrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, "normal", 0L)) : Mono.empty();
        }));
    }

    /**
     * Catches a join into a deleted organization: INVITED_ORG_DELETED, the membership lookup is never subscribed, no
     * member is added and the current org is not switched.
     */
    @Test
    void inviteUser_deletedOrganization_isInvitedOrgDeleted() {
        stubJoin();
        stubMembership(false);
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.empty());
        lenient().when(invitationService.inviteToOrg(VISITOR_ID, ORG_ID)).thenReturn(logged("invite", true));

        StepVerifier.create(invitationApiService.inviteUser(INVITATION_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVITED_ORG_DELETED, "INVITED_ORG_DELETED"))
                .verify();
        assertThat(events).isEmpty();
        say("inviteUser: deleted organization -> INVITED_ORG_DELETED, nothing subscribed");
    }

    /**
     * Catches a second membership (or a second quota count) for a visitor who is already in the organization:
     * ALREADY_IN_ORGANIZATION, no quota check, no {@code inviteToOrg}, and the switch is never subscribed.
     */
    @Test
    void inviteUser_alreadyAMember_isRejectedWithoutASecondMembership() {
        stubJoin();
        stubMembership(true);
        lenient().when(bizThresholdChecker.checkMaxOrgCount(VISITOR_ID)).thenReturn(loggedVoid("orgCount", null));
        lenient().when(bizThresholdChecker.checkMaxOrgMemberCount(ORG_ID)).thenReturn(loggedVoid("memberCount", null));
        lenient().when(invitationService.inviteToOrg(VISITOR_ID, ORG_ID)).thenReturn(logged("invite", true));

        StepVerifier.create(invitationApiService.inviteUser(INVITATION_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.ALREADY_IN_ORGANIZATION, "ALREADY_IN_ORGANIZATION"))
                .verify();
        assertThat(events).containsExactly("inviter", "lookup");
        say("inviteUser: already a member -> ALREADY_IN_ORGANIZATION, events %s", events);
    }

    /**
     * BF-006: an invitation counts only while its creator is a member of the organization, so one minted by an outsider
     * before creation checked membership (or by a member who has left) is INVALID_INVITATION_CODE with the invitation id;
     * the creator check runs after the organization check, and the visitor's membership lookup, the quota checks, the join
     * and the switch are never subscribed.
     */
    @Test
    void inviteUser_invitationWhoseCreatorIsNotAMember_isInvalid_andNobodyJoins() {
        stubJoin();
        stubCreatorMembership(false);
        stubMembership(false);
        lenient().when(bizThresholdChecker.checkMaxOrgCount(VISITOR_ID)).thenReturn(loggedVoid("orgCount", null));
        lenient().when(invitationService.inviteToOrg(VISITOR_ID, ORG_ID)).thenReturn(logged("invite", true));

        StepVerifier.create(invitationApiService.inviteUser(INVITATION_ID))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE");
                    assertThat(((BizException) error).getArgs()).containsExactly(INVITATION_ID);
                })
                .verify();
        assertThat(events).containsExactly("inviter");
        say("inviteUser: creator not a member -> INVALID_INVITATION_CODE, events %s", events);
    }

    private enum Join {
        OK, ORG_COUNT_FAILS, MEMBER_COUNT_FAILS, INVITE_RETURNS_FALSE
    }

    /**
     * Catches the quota bypass on joining: {@code checkMaxOrgCount(visitor)}, then {@code checkMaxOrgMemberCount(org)},
     * then {@code inviteToOrg(visitor, org)}, then the visitor's current org is switched; a failing check stops
     * everything after it. The last row pins today's behaviour (not a defect): the flow does not check
     * {@code inviteToOrg}'s result, so after a false join the switch is still subscribed and its result returned.
     */
    @ParameterizedTest
    @EnumSource(Join.class)
    void inviteUser_newMember_runsTheQuotaChecksInOrderThenJoinsThenSwitches(Join scenario) {
        stubJoin();
        stubMembership(false);
        BizException orgCountFailure = new BizException(BizError.EXCEED_MAX_USER_ORG_COUNT, "EXCEED_MAX_USER_ORG_COUNT");
        BizException memberCountFailure = new BizException(BizError.EXCEED_MAX_ORG_MEMBER_COUNT, "EXCEED_MAX_ORG_MEMBER_COUNT");
        when(bizThresholdChecker.checkMaxOrgCount(VISITOR_ID))
                .thenReturn(loggedVoid("orgCount", scenario == Join.ORG_COUNT_FAILS ? orgCountFailure : null));
        when(bizThresholdChecker.checkMaxOrgMemberCount(ORG_ID))
                .thenReturn(loggedVoid("memberCount", scenario == Join.MEMBER_COUNT_FAILS ? memberCountFailure : null));
        lenient().when(invitationService.inviteToOrg(VISITOR_ID, ORG_ID))
                .thenReturn(logged("invite", scenario != Join.INVITE_RETURNS_FALSE));

        Mono<Boolean> result = invitationApiService.inviteUser(INVITATION_ID);

        switch (scenario) {
            case ORG_COUNT_FAILS -> {
                StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(orgCountFailure)).verify();
                assertThat(events).containsExactly("inviter", "lookup", "orgCount");
            }
            case MEMBER_COUNT_FAILS -> {
                StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(memberCountFailure)).verify();
                assertThat(events).containsExactly("inviter", "lookup", "orgCount", "memberCount");
            }
            default -> {
                StepVerifier.create(result).expectNext(true).verifyComplete();
                assertThat(events).containsExactly("inviter", "lookup", "orgCount", "memberCount", "invite", "switch");
            }
        }
        say("inviteUser %s -> %s", scenario, events);
    }

    // ------------------------------------------------------------------ getInvitationView

    private void stubViewParts(boolean inviterExists, boolean orgExists) {
        lenient().when(userService.findById(CREATOR_ID)).thenReturn(inviterExists ? Mono.just(user(CREATOR_ID, "Creator")) : Mono.empty());
        lenient().when(organizationService.getById(ORG_ID)).thenReturn(orgExists ? Mono.just(organization()) : Mono.empty());
    }

    /**
     * Catches an invitation view for a code that does not exist (INVALID_INVITATION_CODE with the code as argument)
     * and for an invitation whose organization was deleted (INVITED_ORG_DELETED).
     */
    @Test
    void getInvitationView_unknownInvitationOrDeletedOrganization_areRefused() {
        when(invitationService.getById("unknown")).thenReturn(Mono.empty());
        StepVerifier.create(invitationApiService.getInvitationView("unknown"))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.INVALID_INVITATION_CODE, "INVALID_INVITATION_CODE");
                    assertThat(((BizException) error).getArgs()).containsExactly("unknown");
                })
                .verify();

        when(invitationService.getById(INVITATION_ID)).thenReturn(Mono.just(invitation()));
        stubViewParts(true, false);
        StepVerifier.create(invitationApiService.getInvitationView(INVITATION_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVITED_ORG_DELETED, "INVITED_ORG_DELETED"))
                .verify();
        say("getInvitationView: unknown code -> INVALID_INVITATION_CODE, deleted org -> INVITED_ORG_DELETED");
    }

    /**
     * Pins the plan section 9 row "InvitationApiServiceImpl (:103) raises INVITER_NOT_FOUND with the message key
     * INVITED_ORG_DELETED": an invitation whose creator no longer exists gives the error code INVITER_NOT_FOUND but the
     * message key of the deleted organization, so the user is told the wrong thing. A fix changes this test on purpose.
     */
    @Test
    void getInvitationView_inviterMissing_isInviterNotFoundWithTheOrgDeletedKey_pinsSection9Row() {
        when(invitationService.getById(INVITATION_ID)).thenReturn(Mono.just(invitation()));
        stubViewParts(false, true);

        StepVerifier.create(invitationApiService.getInvitationView(INVITATION_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVITER_NOT_FOUND, "INVITED_ORG_DELETED"))
                .verify();
        say("getInvitationView: inviter missing -> INVITER_NOT_FOUND with key INVITED_ORG_DELETED (section 9 row pinned)");
    }

    /**
     * Catches a wrong invitation view ({@code InvitationVO.from}): the invite code is the invitation id, the creator
     * name is the inviter's, and the organization name and id are the invited organization's.
     */
    @Test
    void getInvitationView_buildsTheViewFromTheInvitationInviterAndOrganization() {
        when(invitationService.getById(INVITATION_ID)).thenReturn(Mono.just(invitation()));
        stubViewParts(true, true);

        StepVerifier.create(invitationApiService.getInvitationView(INVITATION_ID))
                .assertNext(this::assertViewOfTheInvitation)
                .verifyComplete();
        say("getInvitationView: view built from invitation, inviter and organization");
    }

    private void assertViewOfTheInvitation(InvitationVO view) {
        assertThat(view.getInviteCode()).isEqualTo(INVITATION_ID);
        assertThat(view.getCreateUserName()).isEqualTo("Creator");
        assertThat(view.getInvitedOrganizationName()).isEqualTo(ORG_NAME);
        assertThat(view.getInvitedOrganizationId()).isEqualTo(ORG_ID);
    }

    // ------------------------------------------------------------------ create

    /** Catches an invitation created for an organization that does not exist: INVALID_ORG_ID, nothing saved. */
    @Test
    void create_unknownOrganization_isInvalidOrgId() {
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(user(CREATOR_ID, "Creator")));
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.empty());

        StepVerifier.create(invitationApiService.create(ORG_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_ORG_ID, "INVALID_ORG_ID"))
                .verify();
        verifyNoInteractions(invitationService);
        say("create: unknown organization -> INVALID_ORG_ID, nothing saved");
    }

    /**
     * Catches an invitation attributed to the wrong user or organization: the saved invitation carries the visitor's id
     * as creator and the organization id, and the returned view shows the visitor's name and the organization.
     */
    @Test
    void create_savesTheInvitationForTheVisitorAndTheOrganization() {
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(user(CREATOR_ID, "Creator")));
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(organization()));
        when(orgMemberService.getOrgMember(ORG_ID, CREATOR_ID))
                .thenReturn(Mono.just(new OrgMember(ORG_ID, CREATOR_ID, MemberRole.MEMBER, "normal", 0L)));
        ArgumentCaptor<Invitation> saved = ArgumentCaptor.forClass(Invitation.class);
        when(invitationService.create(saved.capture())).thenReturn(Mono.just(invitation()));

        StepVerifier.create(invitationApiService.create(ORG_ID)).assertNext(this::assertViewOfTheInvitation).verifyComplete();

        assertThat(saved.getValue().getCreateUserId()).isEqualTo(CREATOR_ID);
        assertThat(saved.getValue().getInvitedOrganizationId()).isEqualTo(ORG_ID);
        say("create: invitation saved for creator %s and org %s", CREATOR_ID, ORG_ID);
    }

    /**
     * BF-006 (was pinned as the plan section 9 row "no role check on invitation creation"): a signed-in visitor who is not
     * a member of the organization is refused with NOT_AUTHORIZED, the membership is looked up for the visitor and that
     * organization, and no invitation is saved. Any member may invite (an admin-only rule needs a client change first).
     */
    @Test
    void create_visitorWhoIsNotAMemberOfTheOrganization_isRefused_andNothingIsSaved() {
        when(sessionUserService.getVisitor()).thenReturn(Mono.just(user(VISITOR_ID, "Outsider")));
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(organization()));
        when(orgMemberService.getOrgMember(ORG_ID, VISITOR_ID)).thenReturn(Mono.empty());

        StepVerifier.create(invitationApiService.create(ORG_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .verify();

        verify(orgMemberService).getOrgMember(ORG_ID, VISITOR_ID);
        verifyNoInteractions(invitationService, orgApiService, bizThresholdChecker);
        say("create: a visitor with no membership in %s is refused, nothing saved (BF-006)", ORG_ID);
    }

    // ------------------------------------------------------------------ UserApiServiceImpl: the admin gate

    private enum UserOperation {
        GET_DETAIL, RESET_PASSWORD
    }

    static Stream<Arguments> gateRows() {
        List<Arguments> rows = new ArrayList<>();
        for (UserOperation operation : UserOperation.values()) {
            rows.add(Arguments.of(operation, MemberRole.MEMBER, true, false));
            rows.add(Arguments.of(operation, MemberRole.MEMBER, false, false));
            rows.add(Arguments.of(operation, MemberRole.ADMIN, false, false));
            rows.add(Arguments.of(operation, MemberRole.ADMIN, true, true));
            rows.add(Arguments.of(operation, MemberRole.SUPER_ADMIN, true, true));
            rows.add(Arguments.of(operation, MemberRole.SUPER_ADMIN, false, false));
        }
        return rows.stream();
    }

    /**
     * Regression test of correct behaviour (not a defect pin): a user's detail and password reset are reserved to an
     * ADMIN or SUPER_ADMIN of the visitor's current organization and only for a user who belongs to that same
     * organization; a member, or an admin asking about a user of a foreign organization, gets UNSUPPORTED_OPERATION
     * BAD_REQUEST and no user service Mono is subscribed. The membership lookup is made with the visitor's own org id.
     */
    @ParameterizedTest(name = "{0} as {1}, target in the org {2} -> allowed {3}")
    @MethodSource("gateRows")
    void userOperation_requiresAnAdminOfTheVisitorsOrgAndATargetInThatOrg(UserOperation operation, MemberRole role,
            boolean targetInOrg, boolean allowed) {
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember(ORG_ID, VISITOR_ID, role, "current", 0L)));
        lenient().when(orgMemberService.getOrgMember(ORG_ID, TARGET_ID)).thenReturn(
                targetInOrg ? Mono.just(new OrgMember(ORG_ID, TARGET_ID, MemberRole.MEMBER, "normal", 0L)) : Mono.empty());
        User target = user(TARGET_ID, "Target");
        UserDetail detail = UserDetail.builder().build();
        lenient().when(userService.findById(TARGET_ID)).thenReturn(logged("findById", target));
        lenient().when(userService.buildUserDetail(target, false)).thenReturn(logged("detail", detail));
        lenient().when(userService.resetPassword(TARGET_ID)).thenReturn(logged("reset", "new-password"));

        Mono<?> result = operation == UserOperation.GET_DETAIL ? userApiService.getUserDetailById(TARGET_ID)
                : userApiService.resetPassword(TARGET_ID);

        if (allowed) {
            Object expected = operation == UserOperation.GET_DETAIL ? detail : "new-password";
            StepVerifier.create(result.map(value -> (Object) value)).expectNext(expected).verifyComplete();
            assertThat(events).isEqualTo(operation == UserOperation.GET_DETAIL ? List.of("findById", "detail") : List.of("reset"));
        } else {
            StepVerifier.create(result)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"))
                    .verify();
            assertThat(events).isEmpty();
        }
        say("%s as %s, target in org=%s -> allowed=%s, events %s", operation, role, targetInOrg, allowed, events);
    }

    /** Pins today's behaviour: an admin asking for the detail of an unknown user of the org gets an empty result. */
    @Test
    void getUserDetailById_unknownUserOfTheOrg_completesEmpty() {
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(new OrgMember(ORG_ID, VISITOR_ID, MemberRole.ADMIN, "current", 0L)));
        when(orgMemberService.getOrgMember(ORG_ID, TARGET_ID))
                .thenReturn(Mono.just(new OrgMember(ORG_ID, TARGET_ID, MemberRole.MEMBER, "normal", 0L)));
        when(userService.findById(TARGET_ID)).thenReturn(Mono.empty());

        StepVerifier.create(userApiService.getUserDetailById(TARGET_ID)).verifyComplete();

        verify(userService, never()).buildUserDetail(any(), org.mockito.ArgumentMatchers.anyBoolean());
        say("getUserDetailById: unknown user -> empty, no detail built");
    }

    // ------------------------------------------------------------------ UserApiServiceImpl: removeInvalidTokens

    private static Connection connection(String source, Set<String> tokens) {
        return Connection.builder().source(source).rawId("raw-" + source).tokens(new HashSet<>(tokens)).build();
    }

    /**
     * Catches stale tokens kept alive in MongoDB forever and valid ones dropped: the tokens of every connection are
     * checked against Redis ({@code tokenExist}), those that do not exist are removed from every connection, valid ones
     * stay, and the user is saved once (also when nothing had to be removed, today's behaviour).
     */
    @ParameterizedTest(name = "stale tokens: {0}")
    @ValueSource(booleans = {true, false})
    void removeInvalidTokens_removesOnlyTheTokensMissingFromRedis_andSavesTheUser(boolean someStale) {
        User user = user("user-1", "User");
        Connection first = connection("GITHUB", Set.of("t1", "t2"));
        Connection second = connection("GOOGLE", Set.of("t3"));
        user.getConnections().add(first);
        user.getConnections().add(second);
        when(userRepository.findById("user-1")).thenReturn(Mono.just(user));
        when(sessionUserService.tokenExist("t1")).thenReturn(Mono.just(true));
        when(sessionUserService.tokenExist("t2")).thenReturn(Mono.just(!someStale));
        when(sessionUserService.tokenExist("t3")).thenReturn(Mono.just(!someStale));
        when(userRepository.save(user)).thenReturn(logged("save", user));

        StepVerifier.create(userApiService.removeInvalidTokens("user-1")).verifyComplete();

        assertThat(first.getTokens()).containsExactlyInAnyOrderElementsOf(someStale ? Set.of("t1") : Set.of("t1", "t2"));
        assertThat(second.getTokens()).containsExactlyInAnyOrderElementsOf(someStale ? Set.<String>of() : Set.of("t3"));
        assertThat(events).containsExactly("save");
        say("removeInvalidTokens stale=%s: tokens left %s / %s", someStale, first.getTokens(), second.getTokens());
    }

    /** Catches a save for a user that does not exist: nothing is saved. */
    @Test
    void removeInvalidTokens_unknownUser_savesNothing() {
        when(userRepository.findById("ghost")).thenReturn(Mono.empty());

        StepVerifier.create(userApiService.removeInvalidTokens("ghost")).verifyComplete();

        verify(userRepository, never()).save(any());
        say("removeInvalidTokens: unknown user -> nothing saved");
    }
}

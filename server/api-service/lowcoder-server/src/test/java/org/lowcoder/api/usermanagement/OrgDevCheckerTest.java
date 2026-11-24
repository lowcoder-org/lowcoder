package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link OrgDevChecker#checkOrgDev} (D-11, D-41): admin, super admin or a member of the given membership's own
 * workspace dev group passes; a plain member outside the dev group is refused with NEED_DEV_TO_CREATE_RESOURCE.
 * Unlike {@link OrgDevChecker#checkCurrentOrgDev}, the membership is passed in by the caller, not read from
 * {@code sessionUserService.getVisitorOrgMemberCache()} — the whole point of the new method, so every case here
 * verifies that the session cache is never consulted.
 */
class OrgDevCheckerTest {

    private static final String LOG_PREFIX = "[OrgDevCheckerTest] ";
    private static final String ORG_ID = "org-1";
    private static final String USER_ID = "user-1";
    private static final String MSG_NEED_DEV = "NEED_DEV_TO_CREATE_RESOURCE";

    private final SessionUserService sessionUserService = mock(SessionUserService.class);
    private final GroupService groupService = mock(GroupService.class);
    private final GroupMemberService groupMemberService = mock(GroupMemberService.class);
    private final OrgDevChecker checker = new OrgDevChecker(sessionUserService, groupService, groupMemberService);

    private static OrgMember member(MemberRole role) {
        return new OrgMember(ORG_ID, USER_ID, role, "normal", 0L);
    }

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    @Test
    void admin_passes_withoutConsultingTheDevGroupOrTheSessionCache() {
        OrgMember admin = member(MemberRole.ADMIN);

        StepVerifier.create(checker.checkOrgDev(admin)).verifyComplete();

        verifyNoInteractions(groupService, groupMemberService, sessionUserService);
        say("admin -> passes, no dev-group lookup, no session cache read");
    }

    @Test
    void superAdmin_passes_withoutConsultingTheDevGroupOrTheSessionCache() {
        OrgMember superAdmin = member(MemberRole.SUPER_ADMIN);

        StepVerifier.create(checker.checkOrgDev(superAdmin)).verifyComplete();

        verifyNoInteractions(groupService, groupMemberService, sessionUserService);
        say("super admin -> passes, no dev-group lookup, no session cache read");
    }

    @Test
    void memberOfTheDevGroup_passes() {
        OrgMember plainMember = member(MemberRole.MEMBER);
        Group devGroup = new Group();
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.just(devGroup));
        when(groupMemberService.isMember(devGroup, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(checker.checkOrgDev(plainMember)).verifyComplete();

        verifyNoInteractions(sessionUserService);
        say("member of the dev group -> passes, the session cache is never read");
    }

    @Test
    void plainMember_notInTheDevGroup_isRefused() {
        OrgMember plainMember = member(MemberRole.MEMBER);
        Group devGroup = new Group();
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.just(devGroup));
        when(groupMemberService.isMember(devGroup, USER_ID)).thenReturn(Mono.just(false));

        StepVerifier.create(checker.checkOrgDev(plainMember))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException biz = (BizException) error;
                    assertThat(biz.getError()).isEqualTo(BizError.NEED_DEV_TO_CREATE_RESOURCE);
                    assertThat(biz.getMessageKey()).isEqualTo(MSG_NEED_DEV);
                })
                .verify();

        verifyNoInteractions(sessionUserService);
        say("plain member, not in the dev group -> NEED_DEV_TO_CREATE_RESOURCE, the session cache is never read");
    }

    @Test
    void plainMember_noDevGroupAtAll_isRefused() {
        OrgMember plainMember = member(MemberRole.MEMBER);
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.empty());

        StepVerifier.create(checker.checkOrgDev(plainMember))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.NEED_DEV_TO_CREATE_RESOURCE);
                })
                .verify();

        verify(groupMemberService, never()).isMember(any(), any());
        verifyNoInteractions(sessionUserService);
        say("plain member, workspace has no dev group -> NEED_DEV_TO_CREATE_RESOURCE, no membership lookup attempted");
    }

    /**
     * D-11/D-41 itself: an admin of the visitor's CURRENT workspace who is only a plain, non-dev member of a
     * DIFFERENT, given workspace is refused for that given workspace — {@code checkOrgDev} decides purely from the
     * membership it is handed, never from {@code sessionUserService.getVisitorOrgMemberCache()}.
     */
    @Test
    void adminOfTheCurrentWorkspace_butPlainMemberOfTheGivenWorkspace_isRefusedForTheGivenWorkspace() {
        OrgMember currentWorkspaceAdmin = new OrgMember("current-org", USER_ID, MemberRole.ADMIN, "normal", 0L);
        lenientStubSessionCacheTo(currentWorkspaceAdmin);
        OrgMember targetWorkspaceMember = member(MemberRole.MEMBER);
        Group devGroup = new Group();
        when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.just(devGroup));
        when(groupMemberService.isMember(devGroup, USER_ID)).thenReturn(Mono.just(false));

        StepVerifier.create(checker.checkOrgDev(targetWorkspaceMember))
                .expectErrorSatisfies(error -> assertThat(((BizException) error).getError()).isEqualTo(BizError.NEED_DEV_TO_CREATE_RESOURCE))
                .verify();

        verify(groupService).getDevGroup(ORG_ID);
        verifyNoInteractions(sessionUserService);
        say("admin of the current workspace, plain member of the given workspace -> refused for the given workspace");
    }

    private void lenientStubSessionCacheTo(OrgMember member) {
        org.mockito.Mockito.lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member));
    }
}
